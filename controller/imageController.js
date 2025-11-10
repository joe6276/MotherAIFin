const  OpenAI = require("openai")
const dotenv = require("dotenv")
const path = require("path");
dotenv.config({path:path.resolve(__dirname, "../.env")})

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const {BlobServiceClient}= require("@azure/storage-blob")

async function generateAndUploadImage(prompt) {
  // Replace spaces & special chars safely
  const safePrompt = encodeURIComponent(prompt);
  const url = `https://pollinations.ai/p/${safePrompt}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const fileName = `pollinations_${Date.now()}.png`;
  const imageUrl = await uploadToAzure(buffer, fileName);

  console.log("✅ Uploaded image to:", imageUrl);
  return imageUrl;
}

async function uploadToAzure(buffer, fileName) {
    
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient("spareparts");
 
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: "image/png" },
  });

  return blockBlobClient.url;
}


// generateAndUploadImage("a futuristic African city skyline at sunset, cyberpunk style")
//   .then(url => console.log("🌆 Image URL:", url))
//   .catch(err => console.error("❌ Error:", err));

async function uploadAnImage(req,res){
    try {
       const {instruction, userId}= req.body
       
      var checkSub= await checkSubscription(userId)
      if(!checkSub){
        return res.status(400).json({ error: "Kindly Check your Subscription" });
      }
        const image = await generateAndUploadImage(instruction)
        return res.status(200).json({url:image})
    } catch (error) {
        console.log(error);
        
        return res.status(500).json(error)
    }
}


module.exports={uploadAnImage}