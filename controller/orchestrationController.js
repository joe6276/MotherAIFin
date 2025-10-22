const dotenv = require('dotenv')
const path = require("path")
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function chooseAgent(instruction){
    const apiKey = process.env.OPENAI_API_KEY;
    const prompt=`    
    You are an expert AI agent selector. Based on the user's instruction, choose the most suitable agent from the following options: website, seo, copyWriting, video, motherAI.
    The Agents do the following:
        {
        "website": "This agent specializes in designing and developing professional websites tailored to client needs.",
        "seo": "This agent focuses on optimizing websites for search engines to improve visibility and ranking.",
        "copyWriting": "This agent crafts engaging and persuasive written content, including scripts, articles, and marketing copy.",
        "video": "This agent produces high-quality video content for promotions, tutorials, and storytelling.",
        "motherAI": "This is an advanced multi-functional agent capable of coordinating and combining the Website, SEO, Copywriting, and Video agents to deliver complete, integrated digital solutions."
        }
    Based on the instruction: "${instruction}", respond with the name of the most appropriate agent only.
    
    `

    try {
        
        const response = await fetch("https://api.openai.com/v1/chat/completions",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                 "Authorization": `Bearer ${apiKey}`
            },
            body:JSON.stringify({
                model:"gpt-4o-mini",
                messages:[
                    {
                        role:"system",
                        content:"You are an expert AI agent selector. Always respond with the name of the most suitable agent only."
                    },{
                        role:"user",
                        content: prompt
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
        console.error("Error generating code:", error);
        throw error
    }
    
}


async function orchestrationAgent(req,res){
    try {
        const {instruction} = req.body
        const response = await chooseAgent(instruction)
        return res.status(200).json({selectedAgent:response})
    } catch (error) {
        return res.status(500).json({error})
    }
}

module.exports={orchestrationAgent}

