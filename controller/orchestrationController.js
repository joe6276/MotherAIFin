const dotenv = require('dotenv')
const path = require("path")
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function chooseAgent(instruction) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    
    const prompt = `    
    You are an expert AI agent selector. Based on the user's instruction, choose the most suitable agent from the following options: website, seo, copyWriting, video, motherAI.
    The Agents do the following:
        {
        "website": "This agent specializes in designing and developing professional websites tailored to client needs.",
        "seo": "This agent focuses on optimizing websites for search engines to improve visibility and ranking.",
        "copyWriting": "This agent crafts engaging and persuasive written content, including scripts, articles, and marketing copy.",
        "video": "This agent produces high-quality video content for promotions, tutorials, and storytelling.",
        "motherAI": "This is an advanced multi-functional agent capable of coordinating and combining the Website, SEO, Copywriting, and Video agents to deliver complete, integrated digital solutions."
        }
    Based on the instruction: "${instruction}", respond with the name of the most appropriate agent only. You must give an agent name, I don't know is not a valid answer.
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
                            content: "You are an expert AI agent selector. Always respond with the name of the most suitable agent only."
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
            const answer = data.choices[0].message.content;
            return answer;
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
                    system: "You are an expert AI agent selector. Always respond with the name of the most suitable agent only.",
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

            const answer = claudeData.content[0].text;
            return answer;

        } catch (claudeError) {
            console.error("Claude API Error:", claudeError);
            throw claudeError;
        }
    }
}

async function orchestrationAgent(req, res) {
    try {
        const { instruction } = req.body;
        const response = await chooseAgent(instruction);
        return res.status(200).json({ selectedAgent: response });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { orchestrationAgent };

