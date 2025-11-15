// const path = require("path")
// const dotenv = require('dotenv')
// const Anthropic = require("@anthropic-ai/sdk")

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
//             name: tool.name,
//             description: tool.description,
//             input_schema: tool.parameters
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
//         return await motherAI(args.instruction) // Fixed: should call motherAIFunc, not websiteFunc
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
//         return await copyWritingFunc(args.instruction) // Fixed: should call copywritingFunc, not websiteFunc
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


// const client = new Anthropic({
//     apiKey: process.env.ANTHROPIC_API_KEY,
// })
// async function invokeClaudeTool(message, maxIterations = 15) {
//     let messages = [{ role: 'user', content: message }]
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
//             const response = await client.messages.create({
//                 model: "claude-sonnet-4-20250514",
//                 max_tokens: 4096,
//                 messages: messages,
//                 tools: getToolDefinitions(),
//                 system: `You are an AI orchestrator that coordinates multiple specialized agents to deliver comprehensive solutions.

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
//             })

//             const toolUses = response.content.filter(c => c.type === 'tool_use')
            
//             if (toolUses.length > 0) {
//                 messages.push({
//                     role: 'assistant',
//                     content: response.content
//                 })

//                 const toolResults = []
                
//                 for (const toolUse of toolUses) {
//                     const toolName = toolUse.name
//                     const toolArgs = toolUse.input
                    
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
                    
//                     toolResults.push({
//                         type: 'tool_result',
//                         tool_use_id: toolUse.id,
//                         content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
//                         ...(hasError && { is_error: true })
//                     })
//                 }
                
//                 messages.push({
//                     role: 'user',
//                     content: toolResults
//                 })
                
//                 continue

//             } else {
//                 const textResponse = response.content.find(c => c.type === 'text')
//                 const finalText = textResponse?.text || 'No response'
                
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

// // const copywritingPrompts = [
// //     "Write a welcome email sequence (3 emails) for new subscribers to a fitness app. Tone: Motivating and friendly. Include: Email 1 - Welcome and app overview, Email 2 - How to get started guide, Email 3 - Success stories and call-to-action to upgrade to premium.",
// //     "Create compelling landing page copy for a mobile money savings app targeting young professionals in Kenya. Include: Hero headline, subheadline, 5 benefit statements, feature descriptions, trust indicators, and 3 different CTA variations. Tone: Professional yet approachable.",
// //     "Write 5 SEO-friendly product descriptions for an online electronics store. Products: Laptop (gaming), Smartphone (budget), Wireless earbuds, Smart TV, Tablet. Each description should be 150-200 words, highlight key features, benefits, and include a compelling reason to buy now.",
// //     "Create a 2-week social media content calendar for a Nairobi-based coffee shop. Include: 10 Instagram captions, 5 Facebook posts, 3 Twitter threads. Mix promotional content (30%), educational content (40%), and engagement content (30%). Tone: Warm, community-focused.",
// //     "Write 5 Google Ads variations for a real estate agency in Nairobi. Target: 'Buy apartments Nairobi'. Each ad should include: Headline 1 (30 chars), Headline 2 (30 chars), Headline 3 (30 chars), Description 1 (90 chars), Description 2 (90 chars). Focus on luxury, location, and investment value.",
// //     "Write a long-form sales page for an online course teaching digital marketing. Target: Small business owners in Africa. Include: Attention-grabbing headline, problem statement, solution overview, course curriculum, instructor bio, social proof (testimonials structure), pricing section, FAQs, and compelling CTA. Tone: Authoritative but encouraging.",
// //     "Create a 60-second explainer video script for a food delivery app. Structure: Hook (5 sec), Problem (15 sec), Solution (20 sec), How it works (15 sec), CTA (5 sec). Tone: Upbeat and conversational. Include visual cues and voice-over directions.",
// //     "Write a press release for a fintech startup that just raised $2M in seed funding. The company provides micro-loans to small businesses in East Africa using AI for credit scoring. Include: Headline, dateline, opening paragraph, company background, funding details, quotes from CEO and lead investor, about section.",
// //     "Write a monthly newsletter for a software development agency. Include: Editor's note, 3 industry news summaries, featured case study, tech tip of the month, team spotlight, upcoming events section. Tone: Professional and informative. Word count: 800-1000 words.",
// //     "Write a case study about how our e-commerce platform helped a local retailer increase online sales by 300%. Structure: Client background, Challenge, Our solution, Implementation process, Results (with metrics), Client testimonial, CTA. Make it compelling and data-driven.",
// //     "Write 3 different engaging introductions for a blog post titled '10 Ways to Grow Your Instagram Following Organically'. Each intro should be 100-150 words, hook the reader with a problem/question, and smoothly transition to the main content. Tone: Helpful expert.",
// //     "Create 15 tagline options for a new eco-friendly packaging company in Kenya. The company makes biodegradable packaging from agricultural waste. Taglines should be: memorable, 5-7 words max, emphasize sustainability and innovation.",
// //     "Write the copy for slides 1-5 of a startup pitch deck: 1) Hook/Problem slide, 2) Solution slide, 3) Market opportunity slide, 4) Business model slide, 5) Traction slide. The startup is a B2B SaaS for inventory management for retail stores in Africa. Keep each slide to 25-30 words max.",
// //     "Write a conversational chatbot script for an online clothing store. Create responses for: Welcome message, Help with sizing, Track order, Return policy, Product recommendations, Handle complaints, Connect to human agent. Tone: Friendly and helpful.",
// //     "Write a direct mail letter for a luxury car dealership targeting high-income professionals. The offer is a VIP test drive event with complimentary dinner. Include: Personalized opening, value proposition, event details, FOMO elements, RSVP CTA. Length: 300-400 words."
// // ]

// // async function run() {
// //     console.log("Running");
    
// //     const response = await invokeTool(copywritingPrompts[2])
    
// //     console.log(response);
    
// // }

// // run()


// module.exports={invokeClaudeTool}