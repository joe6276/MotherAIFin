const OpenAI = require("openai");
const fs = require("fs");
const dotenv = require("dotenv")
const path = require("path");
dotenv.config({path:path.resolve(__dirname, "../.env")})

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const {BlobServiceClient}= require("@azure/storage-blob");
const { checkSubscription } = require("./paymentController");

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




const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// async function generateImage() {
//   const result = await openai.images.generate({
//     model: "gpt-image-1",
//     prompt: "A futuristic African city at sunset with flying cars",
//     size: "1024x1024"
//   });

//   // Get Base64 image
//   const image_base64 = result.data[0].b64_json;

//   // Save to file
//   const buffer = Buffer.from(image_base64, "base64");
//   fs.writeFileSync("image.png", buffer);

//   console.log("Image saved as image.png");
// }

// generateImage();

module.exports={uploadAnImage}