const dotenv = require("dotenv")
const path = require("path");
const { checkSubscription } = require("./paymentController");
const { getLast10Messages, insertMessage } = require("../memory");


dotenv.config({ path: path.resolve(__dirname, "../.env") })



async function motherAI(question, userId) {
    
    
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const systemPrompt = "You are a helpful AI assistant. Provide clear, accurate, and concise responses.";

    // Get conversation history from your database
    const history = await getLast10Messages(userId); // Your database function

    try {
        // Build OpenAI messages with history
        const openaiMessages = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: question }
        ];

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
                    messages: openaiMessages,
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
            
         await insertMessage("assistant", answer, userId)
            
            
            return answer;
        } else {
            console.error("OpenAI API Error:", data);
            throw new Error("OpenAI API failed");
        }

    } catch (error) {
    

        // Fallback to Claude API
        try {
         

            // Build Claude messages with history
            const claudeMessages = [
                ...history,
                { role: "user", content: question }
            ];

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
                    system: systemPrompt,
                    messages: claudeMessages,
                    temperature: 0.7
                })
            });

            const claudeData = await claudeResponse.json();

            if (!claudeResponse.ok) {
                console.error("Claude API Error:", claudeData);
                throw new Error("Claude API failed");
            }

            const answer = claudeData.content[0].text;
            
            await insertMessage("assistant", answer, userId)
            
            return answer;

        } catch (claudeError) {
            console.error("Claude API Error:", claudeError);
            throw claudeError;
        }
    }
}





async function motherAIExample(req, res) {
    try {
        const { instruction, userId } = req.body

        await insertMessage("user", instruction, userId)
        var checkSub = await checkSubscription(userId)
        if (!checkSub) {
            return res.status(400).json({ error: "Kindly Check your Subscription" });
        }
     
        
        const response = await motherAI(instruction, userId)

        return res.status(200).json({ response })
    } catch (error) {
        return res.status(500).json(error)
    }

}


module.exports = { motherAIExample }
