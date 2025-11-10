const dotenv = require("dotenv")
const path = require("path")
const fs = require('fs')
const axios = require('axios')
const os = require('os')
dotenv.config({ path: path.resolve(__dirname, "../.env") })
const { BlobServiceClient } = require("@azure/storage-blob");
const OpenAI = require("openai")
const { uploadImageFile } = require("../uploads")
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function uploadAFile(fileBuffer, fileName) {
    // Example: using Azure Blob Storage SDK

    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("spareparts");

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: { blobContentType: "audio/mpeg" },
    });

    const fileUrl = blockBlobClient.url;

    return fileUrl;
}

async function textToSpeech(text, voice = "cedar") {

    const response = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",   // or "gpt-4o-mini"
        voice,             //'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral', 'verse', 'ballad', 'ash', 'sage', 'marin', and 'cedar'.
        format: "mp3",
        input: text    // 🔥 This is the required parameter you missed

    });

    const buffer = Buffer.from(await response.arrayBuffer());

    const fileName = `openai_tts_${Date.now()}.mp3`;
    const fileUrl = await uploadAFile(buffer, fileName);

    return fileUrl;
}


async function transcribeFromUrl(audioUrl) {
    try {
        if (!audioUrl || typeof audioUrl !== "string") {
            throw new Error("Missing or invalid 'audioUrl'");
        }



        // Download the audio file temporarily
        const response = await axios.get(audioUrl, { responseType: "arraybuffer" });

        // Extract filename extension or fallback to .mp3
        const extension = path.extname(new URL(audioUrl).pathname) || ".mp3";
        const tempPath = path.join(os.tmpdir(), `audio_${Date.now()}${extension}`);
        fs.writeFileSync(tempPath, response.data);



        // Transcribe with OpenAI Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempPath),
            model: "whisper-1",
            response_format: "text",
        });

        // Clean up
        fs.unlinkSync(tempPath);

        return transcription;
    } catch (error) {
        throw error;
    }
}
async function motherAI(question) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const prompt = "You are a helpful AI assistant. Provide clear, accurate, and concise responses.";

    try {
        // Try OpenAI first with 30 second timeout
        const gptResponse = await Promise.race([
            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: prompt
                        },
                        {
                            role: "user",
                            content: question
                        }
                    ],
                    temperature: 0.7
                })
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
            )
        ]);

        const data = await gptResponse.json();

        if (gptResponse.ok) {
            const answer = data.choices[0].message.content;
            return answer;
        } else {

            throw new Error("OpenAI API failed");
        }

    } catch (error) {


        // Fallback to Claude API
        try {



            const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": claudeKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 4096,
                    system: prompt,
                    messages: [
                        {
                            role: "user",
                            content: question
                        }
                    ],
                    temperature: 0.7
                })
            });

            const claudeData = await claudeResponse.json();

            if (!claudeResponse.ok) {

                throw new Error("Claude API failed");
            }

            const answer = claudeData.content[0].text;
            return answer;

        } catch (claudeError) {

            throw claudeError;
        }
    }
}
async function conversationalist(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file provided" });
        }
        const { voice, userId } = req.body


        var checkSub = await checkSubscription(userId)
        if (!checkSub) {
            return res.status(400).json({ error: "Kindly Check your Subscription" });
        }

        const URL = await uploadImageFile(req.file)
        const texts = await transcribeFromUrl(URL)
        const answer = await motherAI(texts)
        const response = await textToSpeech(answer, voice)

        return res.status(200).json({ url: response })

    } catch (error) {
        // console.error("❌ Whisper API Error:", error.response?.data || error.message);
        res.status(500).json({ error: error });
    }

}


module.exports = { conversationalist }