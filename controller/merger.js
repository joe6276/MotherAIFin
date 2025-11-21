const fs = require("fs");
const { Readable } = require("stream");
const OpenAI = require("openai");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path")
const dotenv = require("dotenv")
dotenv.config({ path: path.resolve(__dirname, "../.env") })
const { BlobServiceClient } = require("@azure/storage-blob")
const { v4 } = require("uuid")
const apiKey = process.env.OPENAI_API_KEY

const client = new OpenAI({
    apiKey: apiKey,
});


ffmpeg.setFfmpegPath(ffmpegPath);


async function downloadVideo(url, outputPath) {
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const nodeStream = Readable.fromWeb(res.body);
    const fileStream = fs.createWriteStream(outputPath);

    await new Promise((resolve, reject) => {
        nodeStream.pipe(fileStream);
        nodeStream.on("error", reject);
        fileStream.on("finish", resolve);
    });

    console.log("Downloaded:", outputPath);
}


async function textToSpeech(text, audioName) {
    const sampleText = text

    const response = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: sampleText,
        format: "mp3"
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(audioName, buffer);

    console.log("Audio generated!");
}



function mergeAudioWithVideo(videopath, audiopath, outputName) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videopath)
            .input(audiopath)
            .outputOptions([
                "-map 0:v",   // use video from input.mp4
                "-map 1:a",   // use audio from generated_audio.mp3
                "-c:v copy",  // do not re-encode video
                "-shortest"   // end when the shortest stream ends
            ])
            .save(outputName)
            .on("end", resolve)
            .on("error", reject);
    });
}


function deleteFiles(...filePaths) {
    filePaths.forEach((path) => {
        if (fs.existsSync(path)) {
            try {
                fs.unlinkSync(path);
                console.log(`Deleted: ${path}`);
            } catch (err) {
                console.error(`Error deleting ${path}:`, err);
            }
        } else {
            console.log(`File not found, skipping: ${path}`);
        }
    });
}

async function uploadVideoFileUnique(fileBuffer, originalName) {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw new Error("Azure Storage connection string is not set in environment variables.");
    }

    const fileExtension = originalName.split(".").pop() || "mp4";
    const uniqueFileName = `${v4()}.${fileExtension}`;
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("spareparts");
    await containerClient.createIfNotExists();
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);
    await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: { blobContentType: "video/mp4" },
    });

    console.log(`Video uploaded: ${uniqueFileName}`);

    return blockBlobClient.url;
}




// Format time for SRT subtitle format (HH:MM:SS,mmm)
function formatSrtTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function generateSrtFile(text, srtPath, audioDuration, wordsPerSubtitle = 8) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const subtitles = [];
    
    const totalWords = words.length;
    const timePerWord = audioDuration / totalWords;
    
    console.log(`Generating SRT: ${totalWords} words, ${audioDuration}s duration, ${timePerWord.toFixed(3)}s per word`);
    
    for (let i = 0; i < words.length; i += wordsPerSubtitle) {
        const chunk = words.slice(i, i + wordsPerSubtitle).join(" ");
        const startTime = i * timePerWord;
        const endTime = Math.min((i + wordsPerSubtitle) * timePerWord, audioDuration);
        
        subtitles.push({
            index: subtitles.length + 1,
            start: formatSrtTime(startTime),
            end: formatSrtTime(endTime),
            text: chunk
        });
    }
    
    const srtContent = subtitles
        .map(sub => `${sub.index}\n${sub.start} --> ${sub.end}\n${sub.text}\n`)
        .join("\n");
    
    fs.writeFileSync(srtPath, srtContent, "utf8");
    console.log("SRT file generated:", srtPath);
    console.log("SRT content preview:\n", srtContent.substring(0, 200));
    
    // Verify file was written
    if (fs.existsSync(srtPath)) {
        const stats = fs.statSync(srtPath);
        console.log(`SRT file size: ${stats.size} bytes`);
    } else {
        console.error("WARNING: SRT file was not created!");
    }
}

function addSubtitlesToVideo(videoPath, srtPath, outputPath, subtitleStyle = {}) {
    const defaultStyle = {
        FontSize: 28,
        PrimaryColour: '&H00FFFFFF', // White (format: &H00BBGGRR)
        OutlineColour: '&H00000000', // Black outline
        BackColour: '&H80000000',    // Semi-transparent black background
        Outline: 3,
        Shadow: 2,
        Bold: -1,
        Alignment: 2,  // Bottom center
        MarginV: 40    // 40 pixels from bottom
    };
    
    const style = { ...defaultStyle, ...subtitleStyle };
    
    // Escape ampersands in color values for shell
    const styleString = Object.entries(style)
        .map(([key, value]) => {
            const stringValue = String(value).replace(/&/g, '\\&');
            return `${key}=${stringValue}`;
        })
        .join(',');
    
    // Get absolute path
    const absoluteSrtPath = path.resolve(srtPath);
    
    // Prepare path for FFmpeg based on OS
    let ffmpegPath;
    if (process.platform === 'win32') {
        // Windows: Convert backslashes to forward slashes and escape special chars
        ffmpegPath = absoluteSrtPath
            .replace(/\\/g, '/')
            .replace(/:/g, '\\\\:')
            .replace(/\[/g, '\\\\[')
            .replace(/\]/g, '\\\\]');
    } else {
        // Linux/Mac: Escape special chars
        ffmpegPath = absoluteSrtPath
            .replace(/:/g, '\\:')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]');
    }
    
    console.log("Original SRT path:", absoluteSrtPath);
    console.log("FFmpeg SRT path:", ffmpegPath);
    console.log("Subtitle style:", styleString);
    
    // Verify SRT exists
    if (!fs.existsSync(absoluteSrtPath)) {
        console.error("ERROR: SRT file not found!");
        return Promise.reject(new Error(`SRT file not found: ${absoluteSrtPath}`));
    }
    
    // Read and log SRT content for debugging
    const srtContent = fs.readFileSync(absoluteSrtPath, 'utf8');
    console.log("SRT content (first 200 chars):", srtContent.substring(0, 200));
    
    // Build the subtitle filter string
    const subtitleFilter = `subtitles=${ffmpegPath}:force_style='${styleString}'`;
    
    console.log("Subtitle filter:", subtitleFilter);
    
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoPath)
            .outputOptions([
                '-vf', subtitleFilter,
                '-c:v', 'libx264',
                '-c:a', 'copy',
                '-preset', 'fast',
                '-crf', '23'
            ])
            .save(outputPath)
            .on("start", (commandLine) => {
                console.log("FFmpeg command:", commandLine);
            })
            .on("progress", (progress) => {
                if (progress.percent) {
                    console.log(`Processing: ${Math.floor(progress.percent)}% done`);
                }
            })
            .on("end", () => {
                console.log("Subtitles added to video!");
                
                // Verify output file exists and has content
                if (fs.existsSync(outputPath)) {
                    const stats = fs.statSync(outputPath);
                    console.log(`Output video size: ${stats.size} bytes`);
                    
                    const inputStats = fs.statSync(videoPath);
                    console.log(`Input video size: ${inputStats.size} bytes`);
                } else {
                    console.error("WARNING: Output video was not created!");
                }
                
                resolve();
            })
            .on("error", (err, stdout, stderr) => {
                console.error("FFmpeg error:", err.message);
                if (stderr) {
                    const stderrStr = String(stderr);
                    console.error("FFmpeg stderr:", stderrStr);
                    
                    // Look for specific errors
                    if (stderrStr.includes("No such file")) {
                        console.error("File access error - check file paths");
                    }
                    if (stderrStr.includes("Invalid argument")) {
                        console.error("Filter syntax error - check escaping");
                    }
                }
                reject(err);
            });
    });
}




module.exports = { downloadVideo, textToSpeech, mergeAudioWithVideo, uploadVideoFileUnique, deleteFiles, generateSrtFile, addSubtitlesToVideo }