// const path = require("path")
// const dotenv = require('dotenv')
// const OpenAI = require("openai")
// const { seoFunc, websiteFunc, copyWritingFunc, motherAI } = require("./automationController")

// dotenv.config({ path: path.resolve(__dirname, "../.env") })

// function listTools() {
//     const tools = [
//         {
//             "website": "Designs and develops complete, production-ready HTML/CSS/JS websites with modern, responsive layouts.",
//             "seo": "Analyzes and optimizes website content, meta tags, structure, and keywords for search engine ranking.",
//             "copywriting": "Creates persuasive marketing copy, blog posts, product descriptions, email campaigns, and ad content.",
//             "motherAI": "Handles general queries, research, analysis, and tasks outside the scope of specialized agents."
//         }
//     ]

//     return tools
// }

// const tools = new Map()

// function registerTool(name, func, description, parameters = {}) {
//     tools.set(
//         name, {
//             name,
//             function: func,
//             description,
//             parameters
//         }
//     )
// }

// function getTool(name) {
//     return tools.get(name)
// }

// async function executeTool(name, args = {}) {
//     const tool = getTool(name)
//     if (!tool) {
//         throw new Error(`Tool '${name}' not found`)
//     }

//     try {
//         return await tool.function(args)
//     } catch (error) {
//         throw new Error(`Tool execution failed: ${error.message}`)
//     }
// }

// function getToolDefinitions() {
//     const definitions = []

//     for (const [name, tool] of tools) {
//         definitions.push({
//             type: "function",
//             function: {
//                 name: tool.name,
//                 description: tool.description,
//                 parameters: tool.parameters
//             }
//         })
//     }

//     return definitions
// }

// registerTool(
//     "seo",
//     async (args) => {
//         return await seoFunc(args.instruction)
//     },
//     "Optimizes website content for search engines. Use this tool when the user requests: SEO analysis, keyword research, meta tag optimization, content optimization for ranking, sitemap generation, schema markup, or improving search visibility. Returns SEO recommendations, optimized content, and implementation guidelines.",
//     {
//         type: "object",
//         properties: {
//             instruction: {
//                 type: "string",
//                 description: "Detailed SEO requirements: specify target keywords, pages to optimize, competitor analysis needs, or specific SEO goals (e.g., 'optimize homepage for keyword X', 'create SEO strategy for e-commerce site')"
//             }
//         },
//         required: ["instruction"]
//     }
// )

// registerTool(
//     "website",
//     async (args) => {
//         return await websiteFunc(args.instruction)
//     },
//     "Generates complete, production-ready HTML/CSS/JavaScript websites. Use this tool when the user requests: website creation, landing pages, web applications, UI components, or frontend development. Returns fully functional HTML code with embedded CSS and JavaScript that can be deployed immediately. Include design requirements, features needed, color schemes, and responsiveness needs in the instruction.",
//     {
//         type: "object",
//         properties: {
//             instruction: {
//                 type: "string",
//                 description: "Comprehensive website specification including: purpose, target audience, required pages/sections, design preferences (colors, style, layout), features (forms, galleries, navigation), responsiveness requirements, and any specific functionality needed"
//             }
//         },
//         required: ["instruction"]
//     }
// )

// registerTool(
//     "motherAI",
//     async (args) => {
//         return await motherAI(args.instruction)
//     },
//     "General-purpose AI assistant for tasks outside specialized domains. Use this tool for: general questions, research, data analysis, explanations, brainstorming, problem-solving, calculations, or any query that doesn't fit website development, SEO, or copywriting. This is the fallback tool for miscellaneous requests.",
//     {
//         type: "object",
//         properties: {
//             instruction: {
//                 type: "string",
//                 description: "Any general question, task, or request that needs to be answered or completed"
//             }
//         },
//         required: ["instruction"]
//     }
// )

// registerTool(
//     "copywriting",
//     async (args) => {
//         return await copyWritingFunc(args.instruction)
//     },
//     "Creates professional marketing and promotional content. Use this tool when the user requests: ad copy, product descriptions, email campaigns, blog posts, social media content, sales pages, video scripts, press releases, taglines, or any persuasive written content. Returns polished, engaging copy optimized for the target audience and marketing goals.",
//     {
//         type: "object",
//         properties: {
//             instruction: {
//                 type: "string",
//                 description: "Copywriting brief including: content type (ad, email, blog post, etc.), target audience, key message/value proposition, tone of voice, word count, call-to-action, and any specific requirements or constraints"
//             }
//         },
//         required: ["instruction"]
//     }
// )

// registerTool(
//     "listTools",
//     () => listTools(),
//     "Returns a complete list of all available tools with their descriptions. Use this tool only when the user explicitly asks what tools are available or requests to see available capabilities.",
//     {
//         type: "object",
//         properties: {},
//         required: []
//     }
// )


// const client = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// })

// async function invokeOpenAI(message, maxIterations = 15) {
//     let messages = [
//         {
//             role: 'system',
//             content: `You are an AI orchestrator that coordinates multiple specialized agents to deliver comprehensive solutions.

// CRITICAL INSTRUCTIONS:
// 1. **Analyze the user's request carefully** to identify ALL relevant tools that should be used
// 2. **Use multiple tools when appropriate** - don't limit yourself to just one tool
// 3. **Think holistically** - if a user asks for a website, consider if they also need SEO optimization, copywriting, etc.
// 4. **Call tools in logical order** - for example, create website content first, then optimize it for SEO
// 5. **Leverage tool combinations** for better results:
//    - Website + SEO: Always optimize websites for search engines
//    - Copywriting + SEO: Make copy both persuasive and search-friendly
//    - Website + Copywriting + SEO: Full-service web solutions
//    - MotherAI: Use for research, strategy, or questions before creating content

// TOOL USAGE PATTERNS:
// - **"Build a website"** → Use 'website' tool AND 'seo' tool (websites should always be SEO-friendly)
// - **"Create landing page"** → Use 'website' + 'copywriting' + 'seo' (needs design, copy, and optimization)
// - **"Write product description"** → Use 'copywriting' + 'seo' (descriptions should rank well)
// - **"Marketing campaign"** → Use 'copywriting' + 'seo' + possibly 'motherAI' for strategy
// - **"Online store"** → Use 'website' + 'copywriting' + 'seo' (comprehensive solution)
// - **General questions/research** → Use 'motherAI' first, then specialized tools as needed

// WORKFLOW APPROACH:
// 1. If the request involves creating web content → plan to use website, copywriting, and SEO tools
// 2. If the request needs research/strategy first → start with motherAI, then specialized tools
// 3. Always consider: "What would make this deliverable more complete and valuable?"
// 4. Don't just do the minimum - provide comprehensive solutions

// QUALITY STANDARDS:
// - Never create a website without SEO optimization
// - Never write marketing copy without considering SEO
// - Always provide complete, production-ready deliverables
// - Combine tools to create synergy and better outcomes

// Remember: Your goal is to deliver exceptional, comprehensive solutions by intelligently coordinating multiple specialized agents.`
//         },
//         { role: 'user', content: message }
//     ]
    
//     let iteration = 0
//     let results = {
//         query: message,
//         toolsUsed: [],
//         artifacts: {},
//         summary: null,
//         conversationHistory: [],
//         executionDetails: []
//     }

//     while (iteration < maxIterations) {
//         iteration++
    
//         try {
//             const response = await client.chat.completions.create({
//                 model: "gpt-4o",
//                 messages: messages,
//                 tools: getToolDefinitions(),
//                 tool_choice: "auto"
//             })

//             const assistantMessage = response.choices[0].message
//             messages.push(assistantMessage)
            
//             const toolCalls = assistantMessage.tool_calls
            
//             if (toolCalls && toolCalls.length > 0) {
//                 for (const toolCall of toolCalls) {
//                     const toolName = toolCall.function.name
//                     const toolArgs = JSON.parse(toolCall.function.arguments)
                    
//                     let toolResult;
//                     let hasError = false;
//                     const executionStart = Date.now()
                    
//                     try {
//                         toolResult = await executeTool(toolName, toolArgs)
//                         const executionTime = Date.now() - executionStart
                        
//                         const execution = {
//                             tool: toolName,
//                             arguments: toolArgs,
//                             result: toolResult,
//                             success: true,
//                             executionTime: executionTime,
//                             timestamp: new Date().toISOString()
//                         }
                        
//                         results.executionDetails.push(execution)
                        
//                         if (!results.toolsUsed.includes(toolName)) {
//                             results.toolsUsed.push(toolName)
//                         }
                        
//                         // Store artifacts by tool type
//                         if (toolName === 'website' && toolResult && toolResult.html) {
//                             results.artifacts.website = {
//                                 html: toolResult.html,
//                                 generatedAt: new Date().toISOString()
//                             }
//                         } else if (toolName === 'seo' && toolResult) {
//                             results.artifacts.seo = {
//                                 data: toolResult,
//                                 generatedAt: new Date().toISOString()
//                             }
//                         } else if (toolName === 'copywriting' && toolResult) {
//                             results.artifacts.copywriting = {
//                                 content: toolResult,
//                                 generatedAt: new Date().toISOString()
//                             }
//                         } else if (toolName === 'motherAI' && toolResult) {
//                             results.artifacts.motherAI = {
//                                 response: toolResult,
//                                 generatedAt: new Date().toISOString()
//                             }
//                         }
                        
//                     } catch (error) {
//                         toolResult = `Error: ${error.message}`
//                         hasError = true
                        
//                         results.executionDetails.push({
//                             tool: toolName,
//                             arguments: toolArgs,
//                             error: error.message,
//                             success: false,
//                             timestamp: new Date().toISOString()
//                         })
//                     }
                    
//                     messages.push({
//                         role: 'tool',
//                         tool_call_id: toolCall.id,
//                         content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
//                     })
//                 }
                
//                 continue

//             } else {
//                 const finalText = assistantMessage.content || 'No response'
                
//                 results.summary = finalText
//                 results.conversationHistory = messages
//                 results.totalIterations = iteration
                
//                 return results
//             }

//         } catch (error) {
//             return {
//                 ...results,
//                 error: error.message,
//                 failedAt: iteration
//             }
//         }
//     }
    
//     return {
//         ...results,
//         error: 'Max iterations reached',
//         maxIterations: maxIterations
//     }
// }


// module.exports={invokeOpenAI}

// // async function run() {
// //     const res = await invokeOpenAI("Build and SEO friendly website for Harambee Stars")
// //     console.log(res);
    
// // }

// // run()