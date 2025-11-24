const fs = require("fs");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4 } = require("uuid");
const OpenAI = require("openai");
const path = require("path")
const dotenv = require("dotenv")
const { fal } = require("@fal-ai/client");
const { url } = require("inspector");

dotenv.config({ path: path.resolve(__dirname, "../.env") })


const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateAudioAndUpload(text, voice="alloy") {
    // 1. Generate audio
    const response = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: voice,
        input: text,
        format: "mp3"
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // 2. Azure setup
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw new Error("Missing Azure connection string");
    }

    const blobName = `${v4()}.mp3`;

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("spareparts");
    await containerClient.createIfNotExists();

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // 3. Upload the audio buffer
    await blockBlobClient.uploadData(audioBuffer, {
        blobHTTPHeaders: { blobContentType: "audio/mpeg" }
    });

    console.log("Uploaded audio:", blobName);

    // 4. Return public URL
    return blockBlobClient.url;
}

async function uploadImage(fileBuffer, originalName) {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw new Error("Azure Storage connection string is missing");
    }

    // Extract extension safely
    const fileExtension = originalName.split(".").pop().toLowerCase() || "png";
    const uniqueFileName = `${v4()}.${fileExtension}`;

    // Create client
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("spareparts");
    await containerClient.createIfNotExists();

    const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);

    // Set MIME type
    const mimeType = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp"
    }[fileExtension] || "application/octet-stream";

    // Upload buffer
    await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: { blobContentType: mimeType }
    });

    console.log("Image uploaded:", uniqueFileName);

    return blockBlobClient.url;
}


async function generateLipVideo(imageURl, audioURL) {
    const result = await fal.subscribe("fal-ai/infinitalk", {
        input: {
            image_url: imageURl,
            audio_url: audioURL,
            prompt: ""
        },
        logs: true,
        onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
                update.logs.map((log) => log.message).forEach(console.log);
            }
        }
    })

  
    console.log(result.data);
    console.log(result.requestId)
    console.log(result);
      return result.data.video.url
    
}

async function uploadoneImage(req, res) {
    const file = req.file;
    const imageURL = await uploadImage(file.buffer, file.originalname);

  res.json({url:imageURL})

}

async function generateLipSync(req,res) {

    const {text,imageURL,voice}= req.body

    try {
          const audioURL = await generateAudioAndUpload(text, voice);
          console.log(imageURL, audioURL);
          
       const url = await generateLipVideo(imageURL, audioURL);

       return res.status(200).json({url})

    } catch (error) {
        return res.status(500).json(error)
    }

}



module.exports = { generateLipSync, uploadoneImage  }