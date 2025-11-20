const Groq= require("groq-sdk")
const {fal}= require("@fal-ai/client")
const path = require("path")
const dotenv = require("dotenv")

dotenv.config({path:path.resolve(__dirname, "../.env")})




const FAL_KEY = process.env.FAL_KEY
const GROQ_API_KEY=process.env.GROQ_API_KEY


// initialization

fal.config({
  credentials: FAL_KEY
})


const groqClient = new Groq({apiKey: GROQ_API_KEY})





async function generateSingleScript(userStory) {
 const prompt = `
You are a movie director. Convert this story idea into ONE powerful cinematic scene.
Return ONLY a valid JSON array with exactly 1 string. Do not write anything else.

Example format: ["A lone knight walking through a foggy battlefield as embers fall from the sky"]

Story: ${userStory}
`;


    const completion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
    });

    let content = completion.choices[0].message.content;

    // Extract ONLY JSON
    let scenes;
    try {
        const start = content.indexOf("[");
        const end = content.lastIndexOf("]") + 1;
        if (start === -1 || end === 0) throw new Error("No JSON found");
        scenes = JSON.parse(content.slice(start, end));
    } catch (err) {
        
        scenes = [
            "A cinematic establishing shot",
            "A close up of the protagonist",
            "An action shot",
        ];
    }
    return scenes;
}

async function generateScript(userStory) {
  const prompt = `
    You are a movie director. Break this story idea into exactly 3 distinct visual scenes.
    Return ONLY a valid JSON array of strings. Do not write anything else.
    Example format: ["A dark castle at night", "A knight drawing his sword", "The dragon breathing fire"]

    Story: ${userStory}
    `;

    const completion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
    });

    let content = completion.choices[0].message.content;

    // Extract ONLY JSON
    let scenes;
    try {
        const start = content.indexOf("[");
        const end = content.lastIndexOf("]") + 1;
        if (start === -1 || end === 0) throw new Error("No JSON found");
        scenes = JSON.parse(content.slice(start, end));
    } catch (err) {
       
        scenes = [
            "A cinematic establishing shot",
            "A close up of the protagonist",
            "An action shot",
        ];
    }

 
    return scenes;
}

async function generateImage(sceneDescription) {
 
    const result = await fal.subscribe("fal-ai/flux/dev", {
        input: {
            prompt: `Cinematic, 8k, photorealistic, movie still: ${sceneDescription}`,
            image_size: "landscape_16_9",
        },
    });
    const imageUrl = result.data.images[0].url
 
    return imageUrl;
}


async function generateVideo(sceneDescription, imageUrl) {
  
    const result = await fal.subscribe("fal-ai/cogvideox-5b/image-to-video", {
        input: {
            prompt: `${sceneDescription}, subtle cinematic motion, 4k`,
            image_url: imageUrl,
        },
    });

    const videoUrl = result.data.video.url
    return videoUrl;
}



module.exports={generateScript, generateImage, generateSingleScript, generateVideo}