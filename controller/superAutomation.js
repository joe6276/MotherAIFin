const path = require("path")
const dotenv = require("dotenv")
dotenv.config({path:path.resolve(__dirname, "../.env")})
const Anthropic = require("@anthropic-ai/sdk")


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
                    model: "gpt-4o",
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
                    model: "gpt-4o",
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
async function listTools(){
        const tools = `    
  
        {
        "website": "This tool specializes in designing and developing professional websites tailored to client needs.",
        "seo": "This tool focuses on optimizing websites for search engines to improve visibility and ranking.",
        "copyWriting": "This tool crafts engaging and persuasive written content, including scripts, articles, and marketing copy.",
        "motherAI": "This is a general tool that can answer any question that the above agents cant answer"
        }
   
    `;
    return tools
}


const tools = new Map()

function registerTool( name, func, description, parameters ={}){
    tools.set(name, {name, function:func, description,parameters})
}

function getTool(name){
    return tools.get(name)
}

async function executeTool(name, args= {}){
    const tool = getTool(name)
    if(!tool){
        throw new Error(`Tool '${name} not found` )
    }

    try {
        return await tool.function(args)
    } catch (error) {
        throw new Error(`Tool execution failed: ${error.message}`) 
    }
}

function getToolDefinitions(){
    const definitions = []
    for(const [name, tool] of tools){
        definitions.push({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters
        })
    }
    return definitions;
}

//Register Website

registerTool(
    'website',
    async(args)=>{
        return await websiteFunc(args.instruction)
    },
    "This function takes in a prompt and return a website structure implementing the prompt"
    ,{
        type: "object",
        properties: {
            instruction:{
                type:'string',
                description: "Instruction for the website to be generated"
            }
        }
    },
    
)

//Register SEO
registerTool(
    "seo",
    async( args)=>{
        return await seoFunc(args.instruction)
    },
    " The function takes in an instruction and return an SEO friendly result",
    {
        type: "object",
        properties: {
            instruction:{
                type: "string",
                description: "Instruction for SEO optimization"
            }
        }
    }    
)