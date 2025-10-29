// const dotenv = require("dotenv");
// const path = require("path");
// const OpenAI = require("openai");
// const { Readable } = require("stream");

// dotenv.config({ path: path.resolve(__dirname, "../.env") });

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// async function transcribeAudio(req, res) {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No audio file provided" });
//     }

//     // Convert buffer to a readable stream
//     const bufferStream = Readable.from(req.file.buffer);

//     // Send audio to OpenAI Whisper
//      const transcription = await openai.audio.transcriptions.create({
//       file: bufferStream,
//       model: "whisper-1",
//       response_format: "text",
//     });
//     res.json({ text: transcription });
//   } catch (error) {
//     console.error("Error transcribing audio:", error);
//     res.status(500).json({ error });
//   }
// }


const dotenv = require("dotenv");
const path = require("path");
const OpenAI = require("openai");
const fs = require("fs");
const { Readable } = require("stream");
const { uploadImageFile } = require("../uploads");
const axios = require("axios")
const os = require("os");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function transcribeAudio(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    var URL = await uploadImageFile(req.file)
    var textss= await transcribeFromUrl(URL)
    return res.json({ URL, text:textss });
  } catch (error) {
    console.error("❌ Whisper API Error:", error.response?.data || error.message);
    res.status(500).json({ error: error });
  }
}


async function transcribeFromUrl(audioUrl) {
  try {
   
    if (!audioUrl) {
      return res.status(400).json({ error: "Missing 'audioUrl' in request body" });
    }

    console.log("🎧 Downloading audio from:", audioUrl);

    // Download the audio file temporarily
    const response = await axios.get(audioUrl, { responseType: "arraybuffer" });

    // Extract filename or fallback to random
    const extension = path.extname(audioUrl) || ".mp3";
    const tempPath = path.join(os.tmpdir(), `audio_${Date.now()}${extension}`);
    fs.writeFileSync(tempPath, response.data);

    console.log("📁 File downloaded to:", tempPath);

    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-1",
      response_format: "text",
    });

    // Delete temp file
    fs.unlinkSync(tempPath);

    return transcription
  } catch (error) {
    console.error("❌ Whisper API Error:", error.response?.data || error.message);
    throw error
  }
}

module.exports = { transcribeAudio };

