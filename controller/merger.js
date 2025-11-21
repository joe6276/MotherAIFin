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
        PrimaryColour: '&H00FFFFFF',
        OutlineColour: '&H00000000',
        BackColour: '&H80000000',
        Outline: 3,
        Shadow: 2,
        Bold: -1,
        Alignment: 2,
        MarginV: 40
    };
    
    const style = { ...defaultStyle, ...subtitleStyle };
    
    // Detect if running on Azure
    const isAzure = process.env.WEBSITE_INSTANCE_ID !== undefined;
    
    // Set FFmpeg path for Azure
    if (isAzure) {
        const ffmpegPath = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
        const ffprobePath = path.join(process.cwd(), 'bin', 'ffprobe.exe');
        
        if (fs.existsSync(ffmpegPath)) {
            ffmpeg.setFfmpegPath(ffmpegPath);
            console.log('Using FFmpeg from:', ffmpegPath);
        } else {
            console.error('FFmpeg not found at:', ffmpegPath);
            return Promise.reject(new Error('FFmpeg binary not found in deployment'));
        }
        
        if (fs.existsSync(ffprobePath)) {
            ffmpeg.setFfprobePath(ffprobePath);
        }
    }
    
    // Get absolute paths
    const absoluteSrtPath = path.resolve(srtPath);
    const absoluteVideoPath = path.resolve(videoPath);
    const absoluteOutputPath = path.resolve(outputPath);
    
    // Verify inputs exist
    if (!fs.existsSync(absoluteVideoPath)) {
        return Promise.reject(new Error(`Video file not found: ${absoluteVideoPath}`));
    }
    
    if (!fs.existsSync(absoluteSrtPath)) {
        return Promise.reject(new Error(`SRT file not found: ${absoluteSrtPath}`));
    }
    
    // Prepare FFmpeg path (always use forward slashes for FFmpeg)
    let ffmpegSrtPath = absoluteSrtPath.replace(/\\/g, '/');
    
    // Escape special characters for FFmpeg filter
    ffmpegSrtPath = ffmpegSrtPath
        .replace(/:/g, '\\:')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/'/g, "\\'");
    
    // Build style string
    const styleString = Object.entries(style)
        .map(([key, value]) => {
            const stringValue = String(value).replace(/&/g, '\\&');
            return `${key}=${stringValue}`;
        })
        .join(',');
    
    // Build subtitle filter
    const subtitleFilter = `subtitles='${ffmpegSrtPath}':force_style='${styleString}'`;
    
    console.log('=== FFmpeg Processing Details ===');
    console.log('Environment:', isAzure ? 'Azure App Service' : 'Local');
    console.log('Video path:', absoluteVideoPath);
    console.log('SRT path:', absoluteSrtPath);
    console.log('Output path:', absoluteOutputPath);
    console.log('FFmpeg SRT path:', ffmpegSrtPath);
    console.log('Subtitle filter:', subtitleFilter);
    
    // Read SRT for debugging
    try {
        const srtContent = fs.readFileSync(absoluteSrtPath, 'utf8');
        console.log('SRT preview:', srtContent.substring(0, 200));
    } catch (err) {
        console.error('Could not read SRT file:', err.message);
    }
    
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const command = ffmpeg()
            .input(absoluteVideoPath)
            .outputOptions([
                '-vf', subtitleFilter,
                '-c:v', 'libx264',
                '-c:a', 'copy',
                '-preset', 'ultrafast', // Faster for Azure timeouts
                '-crf', '23'
            ])
            .output(absoluteOutputPath);
        
        command
            .on('start', (commandLine) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('progress', (progress) => {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                if (progress.percent) {
                    console.log(`Progress: ${Math.floor(progress.percent)}% | Time: ${elapsed}s`);
                }
                
                // Azure timeout warning
                if (isAzure && elapsed > 200) {
                    console.warn('WARNING: Approaching Azure timeout limit (230s)');
                }
            })
            .on('end', () => {
                const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`Processing completed in ${totalTime}s`);
                
                // Verify output
                if (fs.existsSync(absoluteOutputPath)) {
                    const stats = fs.statSync(absoluteOutputPath);
                    const inputStats = fs.statSync(absoluteVideoPath);
                    console.log(`Input: ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`);
                    console.log(`Output: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                    resolve(absoluteOutputPath);
                } else {
                    reject(new Error('Output video was not created'));
                }
            })
            .on('error', (err, stdout, stderr) => {
                console.error('=== FFmpeg Error ===');
                console.error('Error message:', err.message);
                
                if (stderr) {
                    const stderrStr = String(stderr);
                    console.error('FFmpeg stderr:', stderrStr);
                    
                    // Specific error hints
                    if (stderrStr.includes('No such file')) {
                        console.error('HINT: File path issue - check file exists and path escaping');
                    }
                    if (stderrStr.includes('Invalid argument')) {
                        console.error('HINT: Filter syntax error - check character escaping');
                    }
                    if (stderrStr.includes('libx264') || stderrStr.includes('codec')) {
                        console.error('HINT: Codec issue - FFmpeg may be missing codecs');
                    }
                    if (stderrStr.includes('fontconfig')) {
                        console.error('HINT: Font issue - may need font files in Azure');
                    }
                }
                
                reject(err);
            });
        
        command.run();
    });
}



module.exports = { downloadVideo, textToSpeech, mergeAudioWithVideo, uploadVideoFileUnique, deleteFiles, generateSrtFile, addSubtitlesToVideo }