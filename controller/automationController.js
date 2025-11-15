const dotenv = require("dotenv")
const path = require("path");
const { SEO_WEBSITE_PROMPT } = require("../data/seoResult");
const { checkSubscription } = require("./paymentController");
const OpenAI = require("openai")
const Anthropic = require("@anthropic-ai/sdk")
dotenv.config({ path: path.resolve(__dirname, "../.env") })


async function chooseAgentsFunc(instruction) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    const prompt = `    
    You are an expert AI agent selector. Based on the user's instruction, choose ALL suitable agents from the following options that would be needed to fulfill the request: website, seo, copyWriting, video, motherAI.
    
    The Agents do the following:
        {
        "website": "This agent specializes in designing and developing professional websites tailored to client1 needs.",
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
                    model: "gpt-4o",
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
        const { instruction, userId } = req.body

        var checkSub = await checkSubscription(userId)
        if (!checkSub) {
            return res.status(400).json({ error: "Kindly Check your Subscription" });
        }
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
                    model: "gpt-4o",
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
  
  CRITICAL: Return ONLY a valid JSON object with this exact structure:
  {"html": "HTML code here", "css": "CSS code here"}
  
  Important rules:
  - Escape all quotes inside the HTML and CSS strings
  - Keep code on single lines or use \\n for line breaks
  - No markdown formatting, no code blocks, no backticks
  - Return ONLY the raw JSON object
  - Make the code clean, modern, and production-ready`;

    const systemPrompt = "You are an experienced programmer. You MUST return responses as valid JSON only. Escape all special characters properly. Never use markdown code blocks.";

    // Enhanced JSON extraction and validation
    function extractAndValidateJSON(content) {
        let cleaned = content.trim();

        // Remove markdown code blocks
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
        }

        cleaned = cleaned.trim();

        // Find JSON object boundaries
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}');

        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('No JSON object found in response');
        }

        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

        // Try to parse
        try {
            const parsed = JSON.parse(cleaned);

            // Validate structure
            if (!parsed.html || !parsed.css) {
                throw new Error('Invalid JSON structure: missing html or css fields');
            }

            return parsed;
        } catch (e) {
            // If parsing fails, try to fix common issues
            console.log('Initial parse failed, attempting fixes...');

            // Attempt to fix unescaped quotes (basic fix)
            let fixed = cleaned;

            // This is a last resort - try to extract using regex
            const htmlMatch = cleaned.match(/"html"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            const cssMatch = cleaned.match(/"css"\s*:\s*"((?:[^"\\]|\\.)*)"/);

            if (htmlMatch && cssMatch) {
                return {
                    html: htmlMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
                    css: cssMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
                };
            }

            throw new Error(`JSON parsing failed: ${e.message}`);
        }
    }

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
                    response_format: { type: "json_object" } // Force JSON mode
                }),
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
            )
        ]);

        const data = await gptResponse.json();

        if (gptResponse.ok) {
            const messageContent = data.choices[0].message.content;
            const generatedCode = extractAndValidateJSON(messageContent);

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
                throw new Error(`Claude API failed: ${JSON.stringify(claudeData)}`);
            }

            const messageContent = claudeData.content[0].text;
            console.log("Claude raw response:", messageContent.substring(0, 200)); // Debug log

            const generatedCode = extractAndValidateJSON(messageContent);

            return {
                html: generatedCode.html.toString(),
                css: generatedCode.css.toString()
            };

        } catch (claudeError) {
            console.error("Claude API Error:", claudeError);

            // Return fallback HTML/CSS
            console.log("Both APIs failed, returning fallback component");
            return {
                html: `<div class="component-error">
          <h3>Component Generation Error</h3>
          <p>Unable to generate ${componentType} component. Please try again.</p>
        </div>`,
                css: `.component-error {
          padding: 20px;
          border: 2px solid #ff6b6b;
          border-radius: 8px;
          background: #ffe0e0;
          color: #c92a2a;
          text-align: center;
        }`
            };
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

async function motherAI(instruction) {
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
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: prompt
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

async function copyWritingFunc(instruction) {
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
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: prompt
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
        const copywriting = await copyWritingFunc(instruction)
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

        console.dir(output);

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


async function automationCombiner(req, res) {
    try {
        const { originalInstruction, agentChain, userId } = req.body


        var checkSub = await checkSubscription(userId)
        if (!checkSub) {
            return res.status(400).json({ error: "Kindly Check your Subscription" });
        }
        const result = await chainAgents(originalInstruction, agentChain, agentFunctions)

        return res.status(200).json(result)
    } catch (error) {
        return res.status(500).json(error)
    }
}
// run()


async function autoAutomatter(req, res) {

 
    const {instruction, userId}= req.body
       console.log(instruction);
    
    try {
        const result = await invokeOpenAI(instruction)

        return res.status(200).json( { success: true, result, provider: 'openai' })
    } catch (error) {
        console.log('OpenAI failed, trying Claude...', error.message);

        try {
            const result = await invokeClaudeTool(instruction);
            return res.status(200).json( { success: true, result, provider: 'openai' })
        } catch (claudeError) {
            return res.status(200).json({ success: false, error: claudeError.message })
            
        }
    }

}




function listTools() {
    const tools = [
        {
            "website": "Designs and develops complete, production-ready HTML/CSS/JS websites with modern, responsive layouts.",
            "seo": "Analyzes and optimizes website content, meta tags, structure, and keywords for search engine ranking.",
            "copywriting": "Creates persuasive marketing copy, blog posts, product descriptions, email campaigns, and ad content.",
            "motherAI": "Handles general queries, research, analysis, and tasks outside the scope of specialized agents."
        }
    ]

    return tools
}

const tools = new Map()

function registerTool(name, func, description, parameters = {}) {
    tools.set(
        name, {
            name,
            function: func,
            description,
            parameters
        }
    )
}

function getTool(name) {
    return tools.get(name)
}

async function executeTool(name, args = {}) {
    const tool = getTool(name)
    if (!tool) {
        throw new Error(`Tool '${name}' not found`)
    }

    try {
        return await tool.function(args)
    } catch (error) {
        throw new Error(`Tool execution failed: ${error.message}`)
    }
}

function getToolDefinitions() {
    const definitions = []

    for (const [name, tool] of tools) {
        definitions.push({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        })
    }

    return definitions
}

registerTool(
    "seo",
    async (args) => {
        return await seoFunc(args.instruction)
    },
    "Optimizes website content for search engines. Use this tool when the user requests: SEO analysis, keyword research, meta tag optimization, content optimization for ranking, sitemap generation, schema markup, or improving search visibility. Returns SEO recommendations, optimized content, and implementation guidelines.",
    {
        type: "object",
        properties: {
            instruction: {
                type: "string",
                description: "Detailed SEO requirements: specify target keywords, pages to optimize, competitor analysis needs, or specific SEO goals (e.g., 'optimize homepage for keyword X', 'create SEO strategy for e-commerce site')"
            }
        },
        required: ["instruction"]
    }
)

registerTool(
    "website",
    async (args) => {
        return await websiteFunc(args.instruction)
    },
    "Generates complete, production-ready HTML/CSS/JavaScript websites. Use this tool when the user requests: website creation, landing pages, web applications, UI components, or frontend development. Returns fully functional HTML code with embedded CSS and JavaScript that can be deployed immediately. Include design requirements, features needed, color schemes, and responsiveness needs in the instruction.",
    {
        type: "object",
        properties: {
            instruction: {
                type: "string",
                description: "Comprehensive website specification including: purpose, target audience, required pages/sections, design preferences (colors, style, layout), features (forms, galleries, navigation), responsiveness requirements, and any specific functionality needed"
            }
        },
        required: ["instruction"]
    }
)

registerTool(
    "motherAI",
    async (args) => {
        return await motherAI(args.instruction)
    },
    "General-purpose AI assistant for tasks outside specialized domains. Use this tool for: general questions, research, data analysis, explanations, brainstorming, problem-solving, calculations, or any query that doesn't fit website development, SEO, or copywriting. This is the fallback tool for miscellaneous requests.",
    {
        type: "object",
        properties: {
            instruction: {
                type: "string",
                description: "Any general question, task, or request that needs to be answered or completed"
            }
        },
        required: ["instruction"]
    }
)

registerTool(
    "copywriting",
    async (args) => {
        return await copyWritingFunc(args.instruction)
    },
    "Creates professional marketing and promotional content. Use this tool when the user requests: ad copy, product descriptions, email campaigns, blog posts, social media content, sales pages, video scripts, press releases, taglines, or any persuasive written content. Returns polished, engaging copy optimized for the target audience and marketing goals.",
    {
        type: "object",
        properties: {
            instruction: {
                type: "string",
                description: "Copywriting brief including: content type (ad, email, blog post, etc.), target audience, key message/value proposition, tone of voice, word count, call-to-action, and any specific requirements or constraints"
            }
        },
        required: ["instruction"]
    }
)

registerTool(
    "listTools",
    () => listTools(),
    "Returns a complete list of all available tools with their descriptions. Use this tool only when the user explicitly asks what tools are available or requests to see available capabilities.",
    {
        type: "object",
        properties: {},
        required: []
    }
)


const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

async function invokeOpenAI(message, maxIterations = 15) {
    let messages = [
        {
            role: 'system',
            content: `You are an AI orchestrator that coordinates multiple specialized agents to deliver comprehensive solutions.

CRITICAL INSTRUCTIONS:
1. **Analyze the user's request carefully** to identify ALL relevant tools that should be used
2. **Use multiple tools when appropriate** - don't limit yourself to just one tool
3. **Think holistically** - if a user asks for a website, consider if they also need SEO optimization, copywriting, etc.
4. **Call tools in logical order** - for example, create website content first, then optimize it for SEO
5. **Leverage tool combinations** for better results:
   - Website + SEO: Always optimize websites for search engines
   - Copywriting + SEO: Make copy both persuasive and search-friendly
   - Website + Copywriting + SEO: Full-service web solutions
   - MotherAI: Use for research, strategy, or questions before creating content

TOOL USAGE PATTERNS:
- **"Build a website"** → Use 'website' tool AND 'seo' tool (websites should always be SEO-friendly)
- **"Create landing page"** → Use 'website' + 'copywriting' + 'seo' (needs design, copy, and optimization)
- **"Write product description"** → Use 'copywriting' + 'seo' (descriptions should rank well)
- **"Marketing campaign"** → Use 'copywriting' + 'seo' + possibly 'motherAI' for strategy
- **"Online store"** → Use 'website' + 'copywriting' + 'seo' (comprehensive solution)
- **General questions/research** → Use 'motherAI' first, then specialized tools as needed

WORKFLOW APPROACH:
1. If the request involves creating web content → plan to use website, copywriting, and SEO tools
2. If the request needs research/strategy first → start with motherAI, then specialized tools
3. Always consider: "What would make this deliverable more complete and valuable?"
4. Don't just do the minimum - provide comprehensive solutions

QUALITY STANDARDS:
- Never create a website without SEO optimization
- Never write marketing copy without considering SEO
- Always provide complete, production-ready deliverables
- Combine tools to create synergy and better outcomes

Remember: Your goal is to deliver exceptional, comprehensive solutions by intelligently coordinating multiple specialized agents.`
        },
        { role: 'user', content: message }
    ]
    
    let iteration = 0
    let results = {
        query: message,
        toolsUsed: [],
        artifacts: {},
        summary: null,
        conversationHistory: [],
        executionDetails: []
    }

    while (iteration < maxIterations) {
        iteration++
    
        try {
            const response = await client.chat.completions.create({
                model: "gpt-4o",
                messages: messages,
                tools: getToolDefinitions(),
                tool_choice: "auto"
            })

            const assistantMessage = response.choices[0].message
            messages.push(assistantMessage)
            
            const toolCalls = assistantMessage.tool_calls
            
            if (toolCalls && toolCalls.length > 0) {
                for (const toolCall of toolCalls) {
                    const toolName = toolCall.function.name
                    const toolArgs = JSON.parse(toolCall.function.arguments)
                    
                    let toolResult;
                    let hasError = false;
                    const executionStart = Date.now()
                    
                    try {
                        toolResult = await executeTool(toolName, toolArgs)
                        const executionTime = Date.now() - executionStart
                        
                        const execution = {
                            tool: toolName,
                            arguments: toolArgs,
                            result: toolResult,
                            success: true,
                            executionTime: executionTime,
                            timestamp: new Date().toISOString()
                        }
                        
                        results.executionDetails.push(execution)
                        
                        if (!results.toolsUsed.includes(toolName)) {
                            results.toolsUsed.push(toolName)
                        }
                        
                        // Store artifacts by tool type
                        if (toolName === 'website' && toolResult && toolResult.html) {
                            results.artifacts.website = {
                                html: toolResult.html,
                                generatedAt: new Date().toISOString()
                            }
                        } else if (toolName === 'seo' && toolResult) {
                            results.artifacts.seo = {
                                data: toolResult,
                                generatedAt: new Date().toISOString()
                            }
                        } else if (toolName === 'copywriting' && toolResult) {
                            results.artifacts.copywriting = {
                                content: toolResult,
                                generatedAt: new Date().toISOString()
                            }
                        } else if (toolName === 'motherAI' && toolResult) {
                            results.artifacts.motherAI = {
                                response: toolResult,
                                generatedAt: new Date().toISOString()
                            }
                        }
                        
                    } catch (error) {
                        toolResult = `Error: ${error.message}`
                        hasError = true
                        
                        results.executionDetails.push({
                            tool: toolName,
                            arguments: toolArgs,
                            error: error.message,
                            success: false,
                            timestamp: new Date().toISOString()
                        })
                    }
                    
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                    })
                }
                
                continue

            } else {
                const finalText = assistantMessage.content || 'No response'
                
                results.summary = finalText
                results.conversationHistory = messages
                results.totalIterations = iteration
                
                return results
            }

        } catch (error) {
            return {
                ...results,
                error: error.message,
                failedAt: iteration
            }
        }
    }
    
    return {
        ...results,
        error: 'Max iterations reached',
        maxIterations: maxIterations
    }
}

const client1 = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})
async function invokeClaudeTool(message, maxIterations = 15) {
    let messages = [{ role: 'user', content: message }]
    let iteration = 0
    let results = {
        query: message,
        toolsUsed: [],
        artifacts: {},
        summary: null,
        conversationHistory: [],
        executionDetails: []
    }

    while (iteration < maxIterations) {
        iteration++
    
        try {
            const response = await client1.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4096,
                messages: messages,
                tools: getToolDefinitions(),
                system: `You are an AI orchestrator that coordinates multiple specialized agents to deliver comprehensive solutions.

CRITICAL INSTRUCTIONS:
1. **Analyze the user's request carefully** to identify ALL relevant tools that should be used
2. **Use multiple tools when appropriate** - don't limit yourself to just one tool
3. **Think holistically** - if a user asks for a website, consider if they also need SEO optimization, copywriting, etc.
4. **Call tools in logical order** - for example, create website content first, then optimize it for SEO
5. **Leverage tool combinations** for better results:
   - Website + SEO: Always optimize websites for search engines
   - Copywriting + SEO: Make copy both persuasive and search-friendly
   - Website + Copywriting + SEO: Full-service web solutions
   - MotherAI: Use for research, strategy, or questions before creating content

TOOL USAGE PATTERNS:
- **"Build a website"** → Use 'website' tool AND 'seo' tool (websites should always be SEO-friendly)
- **"Create landing page"** → Use 'website' + 'copywriting' + 'seo' (needs design, copy, and optimization)
- **"Write product description"** → Use 'copywriting' + 'seo' (descriptions should rank well)
- **"Marketing campaign"** → Use 'copywriting' + 'seo' + possibly 'motherAI' for strategy
- **"Online store"** → Use 'website' + 'copywriting' + 'seo' (comprehensive solution)
- **General questions/research** → Use 'motherAI' first, then specialized tools as needed

WORKFLOW APPROACH:
1. If the request involves creating web content → plan to use website, copywriting, and SEO tools
2. If the request needs research/strategy first → start with motherAI, then specialized tools
3. Always consider: "What would make this deliverable more complete and valuable?"
4. Don't just do the minimum - provide comprehensive solutions

QUALITY STANDARDS:
- Never create a website without SEO optimization
- Never write marketing copy without considering SEO
- Always provide complete, production-ready deliverables
- Combine tools to create synergy and better outcomes

Remember: Your goal is to deliver exceptional, comprehensive solutions by intelligently coordinating multiple specialized agents.`
            })

            const toolUses = response.content.filter(c => c.type === 'tool_use')
            
            if (toolUses.length > 0) {
                messages.push({
                    role: 'assistant',
                    content: response.content
                })

                const toolResults = []
                
                for (const toolUse of toolUses) {
                    const toolName = toolUse.name
                    const toolArgs = toolUse.input
                    
                    let toolResult;
                    let hasError = false;
                    const executionStart = Date.now()
                    
                    try {
                        toolResult = await executeTool(toolName, toolArgs)
                        const executionTime = Date.now() - executionStart
                        
                        const execution = {
                            tool: toolName,
                            arguments: toolArgs,
                            result: toolResult,
                            success: true,
                            executionTime: executionTime,
                            timestamp: new Date().toISOString()
                        }
                        
                        results.executionDetails.push(execution)
                        
                        if (!results.toolsUsed.includes(toolName)) {
                            results.toolsUsed.push(toolName)
                        }
                        
                        // Store artifacts by tool type
                        if (toolName === 'website' && toolResult && toolResult.html) {
                            results.artifacts.website = {
                                html: toolResult.html,
                                generatedAt: new Date().toISOString()
                            }
                        } else if (toolName === 'seo' && toolResult) {
                            results.artifacts.seo = {
                                data: toolResult,
                                generatedAt: new Date().toISOString()
                            }
                        } else if (toolName === 'copywriting' && toolResult) {
                            results.artifacts.copywriting = {
                                content: toolResult,
                                generatedAt: new Date().toISOString()
                            }
                        } else if (toolName === 'motherAI' && toolResult) {
                            results.artifacts.motherAI = {
                                response: toolResult,
                                generatedAt: new Date().toISOString()
                            }
                        }
                        
                    } catch (error) {
                        toolResult = `Error: ${error.message}`
                        hasError = true
                        
                        results.executionDetails.push({
                            tool: toolName,
                            arguments: toolArgs,
                            error: error.message,
                            success: false,
                            timestamp: new Date().toISOString()
                        })
                    }
                    
                    toolResults.push({
                        type: 'tool_result',
                        tool_use_id: toolUse.id,
                        content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
                        ...(hasError && { is_error: true })
                    })
                }
                
                messages.push({
                    role: 'user',
                    content: toolResults
                })
                
                continue

            } else {
                const textResponse = response.content.find(c => c.type === 'text')
                const finalText = textResponse?.text || 'No response'
                
                results.summary = finalText
                results.conversationHistory = messages
                results.totalIterations = iteration
                
                return results
            }

        } catch (error) {
            return {
                ...results,
                error: error.message,
                failedAt: iteration
            }
        }
    }
    
    return {
        ...results,
        error: 'Max iterations reached',
        maxIterations: maxIterations
    }
}



module.exports = { chooseAgent, automationCombiner, websiteFunc, seoFunc, motherAI, copyWritingFunc, autoAutomatter}