const dotenv = require("dotenv")
const path = require("path");
const { SEO_WEBSITE_PROMPT } = require("../data/seoResult");
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



async function chooseAgent(req, res) {

    try {
        const { instruction } = req.body
        const response = await chooseAgentsFunc(instruction)

        return res.status(200).json(response)

    } catch (error) {
        res.status(500).json(error)
    }

}


async function seoFunc(instruction) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

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
                            content: SEO_WEBSITE_PROMPT
                        },
                        {
                            role: "user",
                            content: instruction
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
                    max_tokens: 4096,
                    system: SEO_WEBSITE_PROMPT,
                    messages: [
                        {
                            role: "user",
                            content: instruction
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

async function websiteFunc(instruction) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    const prompt = `Generate HTML and CSS code for a website based on this instruction: ${instruction}.
  Return the response in this exact JSON format:
  {
    "html": "the HTML code here",
    "css": "the CSS code here"
  }
  Make the code clean, modern, and production-ready.`;

    const systemPrompt = "You are an experienced programmer that generates clean HTML and CSS code. Always return responses in valid JSON format.";

    try {
        // Try OpenAI first with 30 second timeout
        const gptResponse = await Promise.race([
            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt,
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.7,
                }),
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
            )
        ]);

        const data = await gptResponse.json();

        if (gptResponse.ok) {
            const messageContent = data.choices[0].message.content;
            const generatedCode = JSON.parse(messageContent);

            return {
                html: generatedCode.html.toString(),
                css: generatedCode.css.toString()
            };
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
                    max_tokens: 4096,
                    system: systemPrompt,
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

            const messageContent = claudeData.content[0].text;
            const generatedCode = JSON.parse(messageContent);

            return {
                html: generatedCode.html.toString(),
                css: generatedCode.css.toString()
            };

            console.log();
            

        } catch (claudeError) {
            console.error("Claude API Error:", claudeError);
            throw claudeError;
        }
    }
}

 
function formatAgentOutput(output) {
    if (typeof output === 'string') {
        return output;
    }
    
    if (typeof output === 'object' && output !== null) {
        // Handle website agent format specifically
        if (output.html && output.css) {
            return `HTML Code:
\`\`\`html
${output.html}
\`\`\`

CSS Code:
\`\`\`css
${output.css}
\`\`\``;
        }
        
        // Handle other object formats
        return JSON.stringify(output, null, 2);
    }
    
    return String(output);
}

async function motherAI(question) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const prompt = "You are a helpful AI assistant. Provide clear, accurate, and concise responses.";

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
                            content: prompt
                        },
                        {
                            role: "user",
                            content: question
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
            console.log("calling Claude..");


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
                    system: prompt,
                    messages: [
                        {
                            role: "user",
                            content: question
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

async function copyWritingFunc(question) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const prompt = `You are an expert AI Copy writer, who writes script adapting to the user requirements.`;

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
                            content: prompt
                        },
                        {
                            role: "user",
                            content: question
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
            console.log("calling Claude..");


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
                    system: prompt,
                    messages: [
                        {
                            role: "user",
                            content: question
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

async function generateMultiSegmentAdvert(mainPrompt, numSegments = 4) {

    // Generate scripts for each segment
    console.log("📝 Generating video scripts...");
    const scripts = await generateVideoScripts(mainPrompt, numSegments);

    console.log("\n📋 Video segments to generate:");
    scripts.forEach((script, i) => {
        console.log(`  ${i + 1}. ${script.substring(0, 80)}...`);
    });

    // Generate each video segment
    const videoPaths = [];
    for (let i = 0; i < scripts.length; i++) {
        console.log(`\n🎥 Generating segment ${i + 1}/${scripts.length}...`);
        console.log(`📝 Script: ${scripts[i].substring(0, 100)}...`);

        try {
            const videoPath = await generateVideo(scripts[i]);

            // Verify videoPath is valid before pushing
            if (!videoPath) {
                throw new Error(`Video generation returned undefined/null for segment ${i + 1}`);
            }

            videoPaths.push(videoPath);
            console.log(`✅ Segment ${i + 1} completed: ${videoPath}`);
            console.log(`📊 Total videos so far: ${videoPaths.length}`);

        } catch (error) {
            console.error(`❌ Failed to generate segment ${i + 1}:`, error.message);
            console.error(`📊 Videos generated so far: ${videoPaths.length}`);
            throw error;
        }
    }

    // Verify all videos were generated
    console.log(`\n✅ All ${videoPaths.length} video segments generated successfully!`);
    console.log(`📹 Video paths:`);
    videoPaths.forEach((path, i) => {
        console.log(`   ${i + 1}. ${path}`);
    });



    return {

        segments: videoPaths,
        scripts
    };
}

function createTailoredInstruction(
    originalInstruction,
    currentAgent,
    allAgents,
    currentIndex,
    previousOutput,
    extraInstruction
) {
    const isFirstAgent = currentIndex === 0;
    const isLastAgent = currentIndex === allAgents.length - 1;
    const nextAgent = !isLastAgent ? allAgents[currentIndex + 1].name : null;

    // Agent-specific context
    const agentContext = {
        website: "You are creating website specifications and design.",
        seo: "You are optimizing for search engines.",
        copyWriting: "You are writing compelling content.",
        video: "You are creating video production plans.",
        motherAI: "You are providing general assistance."
    };

    let instruction = `${agentContext[currentAgent] || ''}\n\n`;

    // Add extra instruction if provided
    if (extraInstruction) {
        instruction += `🎯 SPECIFIC INSTRUCTION FOR THIS TASK:\n${extraInstruction}\n\n`;
    }

    if (isFirstAgent) {
        // First agent: Use original instruction
        instruction += `Original Request: "${originalInstruction}"\n\n`;
        instruction += `Please provide your output for this request.`;

    } else {
        // Subsequent agents: Use previous output
        instruction += `Original Request: "${originalInstruction}"\n\n`;
        instruction += `Previous Agent Output:\n---\n${previousOutput}\n---\n\n`;
        instruction += `Based on the above output, provide your specialized ${currentAgent} work.`;
    }

    // Add context about next agent if applicable
    if (nextAgent) {
        instruction += `\n\nNote: Your output will be used by the ${nextAgent} agent next, so ensure it contains relevant information for ${nextAgent} work.`;
    }

    return instruction;
}

const agentFunctions = {
    website: async (instruction) => {
      const website = await websiteFunc(instruction)
      return website
    },
    seo: async (instruction) => {
       const seo = await seoFunc(instruction)
        return seo
    },
    copyWriting: async (instruction) => {
        const copywriting= await copyWritingFunc(instruction)
        return copywriting
    },
    video: async (instruction) => {
        const response = await generateMultiSegmentAdvert(instruction)
        return response;
    },
    motherAI: async (instruction) => {
        const response = await motherAI(instruction)
        return response
    }
};


async function chainAgents(originalInstruction, agentChain, agentFunctions) {
    const results = [];
    let currentOutput = null;

    for (let i = 0; i < agentChain.length; i++) {
        const agentConfig = agentChain[i];
        const agentName = agentConfig.name;
        const extraInstruction = agentConfig.instruction || null;
        const agentFunction = agentFunctions[agentName];

      
        

        if (!agentFunction) {
            throw new Error(`Agent function not found: ${agentName}`);
        }

        // Create tailored instruction for this agent
        const tailoredInstruction = createTailoredInstruction(
            originalInstruction,
            agentName,
            agentChain,
            i,
            currentOutput,
            extraInstruction
        );

        console.log(`\n🤖 Executing Agent ${i + 1}/${agentChain.length}: ${agentName}`);
        if (extraInstruction) {
            console.log(`📌 Extra instruction: ${extraInstruction.substring(0, 80)}...`);
        }
        console.log(`📝 Full instruction: ${tailoredInstruction.substring(0, 100)}...`);

        // Execute the agent with the tailored instruction
        const respons = await agentFunction(tailoredInstruction);
        const output = formatAgentOutput(respons)
        
        console.dir(output) ;

        // Store result
        results.push({
            agentName: agentName,
            step: i + 1,
            extraInstruction: extraInstruction,
            fullInstruction: tailoredInstruction,
            output: output
        });

        // This output becomes input for next agent
        currentOutput = output;

        console.log(`✅ ${agentName} completed (${output.length} characters)`);
    }

    return {
        originalInstruction,
        agentChain: agentChain.map(a => a.name),
        results,
        finalOutput: currentOutput
    };
}

async function run() {
        const agentChain = [
        {
            name: "website",
            instruction: "Focus on modern, for a coffee Shop website minimalist design. Include a reservation system."
        },
        {
            name: "seo",
            instruction: "Target local coffee shop keywords. Optimize for 'coffee shop near me' searches."
        }
    ];

     const result = await chainAgents(
        "Generate an SEO friendly website for a coffee shop",
        agentChain,
        agentFunctions
    );

    // Access results
    
    
    return result;
}

async function automationCombiner(req,res){
    try {
        const { originalInstruction, agentChain}= req.body

        const result = await chainAgents(originalInstruction,agentChain,agentFunctions)
        
        return res.status(200).json(result)
    } catch (error) {
        return res.status(500).json(error)
    }
}
// run()

module.exports = { chooseAgent, automationCombiner }