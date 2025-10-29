const  OpenAI = require("openai")
const dotenv = require("dotenv")
const path = require("path");
const { uploadImageFile } = require("../uploads");
dotenv.config({path:path.resolve(__dirname, "../.env")})

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });



async function describeImage(imageUrl) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // supports vision
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image in detail." },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error describing image:", error);
    throw error;
  }
}


async function uploadAnImage(req,res){
    try {
        const imageUrl = await uploadImageFile(req.file);
        const text = await describeImage(imageUrl)
        return res.status(200).json({imageUrl, text})
    } catch (error) {
        console.log(error);
        
        return res.status(500).json(error)
    }
}


module.exports={uploadAnImage}