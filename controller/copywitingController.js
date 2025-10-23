const dotenv = require("dotenv")
const path = require("path")
dotenv.config({path:path.resolve(__dirname, "../.env")})

async function copyWriting(question) {
    const apiKey = process.env.OPENAI_API_KEY;
    const prompt=`You are an expert AI Copy writer, who writes script adapting to the user requirements.`
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                 model:"gpt-4o-mini",
                messages:[
                    {
                        role:"system",
                        content:prompt
                    },{
                        role:"user",
                        content: question
                    }
                ],
                temperature:0.7 
            })

        })

            const data = await response.json();

            if (!response.ok) {
            console.error("OpenAI API Error:", data);
            return;
            }

            const answer= data.choices[0].message.content
            return answer;
    } catch (error) {
        console.log(error);
        throw error
        
    }
}

async function copyWritingAgent(req,res) {
    const{instruction}= req.body

    try {
         const response = await copyWriting(instruction)
        return res.status(200).json({response:response})
    } catch (error) {
        return res.status(500).json({error})
    }
}

module.exports={copyWritingAgent}
