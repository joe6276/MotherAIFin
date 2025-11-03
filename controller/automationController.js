const dotenv = require("dotenv")
const path = require("path")
dotenv.config({ path: path.resolve(__dirname, "../.env") })


async function chooseAgentsFunc(instruction) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    
    const prompt = `    
    You are an expert AI agent selector. Based on the user's instruction, choose ALL suitable agents from the following options that would be needed to fulfill the request: website, seo, copyWriting, video, motherAI.
    
    The Agents do the following:
        {
        "website": "This agent specializes in designing and developing professional websites tailored to client needs.",
        "seo": "This agent focuses on optimizing websites for search engines to improve visibility and ranking.",
        "copyWriting": "This agent crafts engaging and persuasive written content, including scripts, articles, and marketing copy.",
        "video": "This agent produces high-quality video content for promotions, tutorials, and storytelling.",
        "motherAI": "This is a general agent that can answer any question that the above agents cant answer"
        }
    
    Based on the instruction: "${instruction}", respond with a comma-separated list of the appropriate agent names.
    
    Examples:
    - "Generate an SEO friendly website" → website, seo
    - "Create a promotional video with a compelling script" → video, copyWriting
    - "Write blog content" → copyWriting
    - "What is the capital of France?" → motherAI
    
    Respond ONLY with the agent names separated by commas, nothing else.
    `;

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
                            content: "You are an expert AI agent selector. Always respond with a comma-separated list of suitable agent names only."
                        },
                        {
                            role: "user",
                            content: prompt
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
            const answer = data.choices[0].message.content.trim();
            // Parse the comma-separated response into an array
            const agents = answer.split(',').map(agent => agent.trim());
            return agents;
        } else {
            console.error("OpenAI API Error:", data);
            throw new Error("OpenAI API failed");
        }

    } catch (error) {
        console.log("OpenAI failed or timed out, falling back to Claude:", error.message);
        
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
                    max_tokens: 1024,
                    system: "You are an expert AI agent selector. Always respond with a comma-separated list of suitable agent names only.",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });

            const claudeData = await claudeResponse.json();

            if (!claudeResponse.ok) {
                console.error("Claude API Error:", claudeData);
                throw new Error("Claude API failed");
            }

            const answer = claudeData.content[0].text.trim();
            // Parse the comma-separated response into an array
            const agents = answer.split(',').map(agent => agent.trim());
            return agents;

        } catch (claudeError) {
            console.error("Claude API Error:", claudeError);
            throw claudeError;
        }
    }
}



async function chooseAgent(req,res) {

    try {
        const { instruction}= req.body
        const response = await chooseAgentsFunc(instruction)

        return res.status(200).json(response)

    } catch (error) {
        res.status(500).json(error)
    }
    
}


module.exports={chooseAgent}