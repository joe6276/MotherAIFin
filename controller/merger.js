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


async function run() {
    try {
        const userId = 20;
        const outputPath = path.join(__dirname, `../output_with_audio${userId}.mp4`);
        const buffer = fs.readFileSync(outputPath);
        const url = await uploadVideoFileUnique(buffer, `output_with_audio${userId}.mp4`);
        console.log(url);

    } catch (error) {
        console.log(error);

    }
}


// run()

module.exports = { downloadVideo, textToSpeech, mergeAudioWithVideo, uploadVideoFileUnique, deleteFiles }