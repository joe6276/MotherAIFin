// const { createWriteStream, existsSync, mkdirSync } = require("fs")
// const { GoogleGenAI } = require("@google/genai")
// const { Readable } = require("stream")
// const path = require("path")
// const dotenv = require("dotenv")
// dotenv.config({ path: path.resolve(__dirname, "../.env") });

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

// const videosDir = path.join(__dirname, 'generated_videos');
// if (!existsSync(videosDir)) {
//     mkdirSync(videosDir);
// }


// async function generateVideo(question) {
//     let prompt = copyWriting(question)

//     try {
//         let operation = await ai.models.generateVideos({
//             model: "veo-3.0-generate-preview",
//             prompt: prompt,
//             config: {
//                 personGeneration: "allow_all",
//                 aspectRatio: "16:9"
//             }
//         })

//         while (!operation.done) {

//             await new Promise((resolve) => setTimeout(resolve, 10000));
//             operation = await ai.operations.getVideosOperation({
//                 operation: operation,
//             });
//         }

//         const videoName = `video_${Date.now()}.mp4`
//         if (operation.response?.generatedVideos?.length > 0) {

//             const generatedVideo = operation.response.generatedVideos[0];
//             const videoPath = path.join(videosDir, videoName);
//             const resp = await fetch(`${generatedVideo.video?.uri}&key=${GEMINI_API_KEY}`);

//             if (!resp.ok) {
//                 throw new Error(`Failed to download video: ${resp.statusText}`);
//             }

//             const writer = createWriteStream(videoPath);

//             // Wait for the download to complete and verify file
//             await new Promise((resolve, reject) => {
//                 const stream = Readable.fromWeb(resp.body);
//                 stream.pipe(writer);

//                 writer.on('finish', () => {
//                     // Check if file exists and has content
//                     if (existsSync(videoPath)) {
//                         const fs = require('fs');
//                         const stats = fs.statSync(videoPath);
//                         if (stats.size > 0) {
//                             resolve();
//                         } else {
//                             reject(new Error("Downloaded file is empty"));
//                         }
//                     } else {
//                         reject(new Error("Video file was not created"));
//                     }
//                 });

//                 writer.on('error', reject);
//                 stream.on('error', reject);
//             });

//             const vpath = path.join(__dirname, 'generated_videos', videoName);

//             console.log('The Path is Here');

//             console.log(vpath);



//             //   await uploadVideoToDrive(vpath)
//             return vpath;
//         }

//     } catch (error) {
//         console.error("Error generating video:", error);
//         throw error;
//     }
// }

// async function copyWriting(question) {
//     const openaiKey = process.env.OPENAI_API_KEY;
//     const claudeKey = process.env.ANTHROPIC_API_KEY;
//     const prompt = `You are an expert AI Copy writer, who writes video Scipts adapting to the user requirements.`;
    
//     try {
//         // Try OpenAI first with 30 second timeout
//         const gptResponse = await Promise.race([
//             fetch("https://api.openai.com/v1/chat/completions", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": `Bearer ${openaiKey}`
//                 },
//                 body: JSON.stringify({
//                     model: "gpt-4o-mini",
//                     messages: [
//                         {
//                             role: "system",
//                             content: prompt
//                         },
//                         {
//                             role: "user",
//                             content: question
//                         }
//                     ],
//                     temperature: 0.7
//                 })
//             }),
//             new Promise((_, reject) => 
//                 setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
//             )
//         ]);

//         const data = await gptResponse.json();

//         if (gptResponse.ok) {
//             const answer = data.choices[0].message.content;
//             return answer;
//         } else {
//             console.error("OpenAI API Error:", data);
//             throw new Error("OpenAI API failed");
//         }

//     } catch (error) {
//         console.log("OpenAI failed or timed out, falling back to Claude:", error.message);
        
//         // Fallback to Claude API
//         try {
//             console.log("calling Claude..");
            

//             const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "x-api-key": claudeKey,
//                     "anthropic-version": "2023-06-01"
//                 },
//                 body: JSON.stringify({
//                     model: "claude-sonnet-4-20250514",
//                     max_tokens: 4096,
//                     system: prompt,
//                     messages: [
//                         {
//                             role: "user",
//                             content: question
//                         }
//                     ],
//                     temperature: 0.7
//                 })
//             });

//             const claudeData = await claudeResponse.json();

//             if (!claudeResponse.ok) {
//                 console.error("Claude API Error:", claudeData);
//                 throw new Error("Claude API failed");
//             }

//             const answer = claudeData.content[0].text;
//             return answer;

//         } catch (claudeError) {
//             console.error("Claude API Error:", claudeError);
//             throw claudeError;
//         }
//     }
// }

// async function run() {
    
//     const videoPath = await generateVideo(`Create a 30-second promotional video for a new AI-powered productivity app, 
//         showcasing its features and benefits with upbeat music and dynamic visuals.`);


//         console.log(videoPath);
        
// }

// run()



const { createWriteStream, existsSync, mkdirSync, createReadStream } = require("fs")
const { GoogleGenAI } = require("@google/genai")
const { Readable } = require("stream")
const path = require("path")
const dotenv = require("dotenv")
const fs = require("fs").promises

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY



const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

const videosDir = path.join(__dirname, 'generated_videos');
if (!existsSync(videosDir)) {
    mkdirSync(videosDir);
}

async function generateVideo(prompt) {
    try {
        let operation = await ai.models.generateVideos({
            model: "veo-3.0-generate-preview",
            prompt: prompt,
            config: {
                personGeneration: "allow_all",
                aspectRatio: "16:9"
            }
        })

        while (!operation.done) {
            await new Promise((resolve) => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({
                operation: operation,
            });
        }

        const videoName = `video_${Date.now()}.mp4`
        if (operation.response?.generatedVideos?.length > 0) {
            const generatedVideo = operation.response.generatedVideos[0];
            const videoPath = path.join(videosDir, videoName);
            const resp = await fetch(`${generatedVideo.video?.uri}&key=${GEMINI_API_KEY}`);

            if (!resp.ok) {
                throw new Error(`Failed to download video: ${resp.statusText}`);
            }

            const writer = createWriteStream(videoPath);

            await new Promise((resolve, reject) => {
                const stream = Readable.fromWeb(resp.body);
                stream.pipe(writer);

                writer.on('finish', () => {
                    if (existsSync(videoPath)) {
                        const fs = require('fs');
                        const stats = fs.statSync(videoPath);
                        if (stats.size > 0) {
                            resolve();
                        } else {
                            reject(new Error("Downloaded file is empty"));
                        }
                    } else {
                        reject(new Error("Video file was not created"));
                    }
                });

                writer.on('error', reject);
                stream.on('error', reject);
            });

            return videoPath;
        }
    } catch (error) {
       
        throw error;
    }
}

async function generateVideoScripts(mainPrompt, numSegments = 4) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    
    const systemPrompt = `You are an expert video script writer. Create ${numSegments} distinct video prompts that together form a cohesive advertisement.
Each prompt should be for an 8-second video segment that flows naturally into the next.
Return ONLY a JSON array of ${numSegments} prompts, nothing else. No markdown, no explanation.
Example format: ["prompt 1", "prompt 2", "prompt 3", "prompt 4"]

Each prompt should:
- Be visually descriptive and cinematic
- Flow naturally from the previous segment
- Include camera movements, mood, and visual style
- Be specific about what should be shown`;
    
    try {
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
                        { role: "system", content: systemPrompt },
                        { role: "user", content: mainPrompt }
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
            const content = data.choices[0].message.content.trim();
            // Remove markdown code blocks if present
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        }
    } catch (error) {
        
        
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
                    messages: [{ role: "user", content: mainPrompt }],
                    temperature: 0.7
                })
            });

            const claudeData = await claudeResponse.json();
            if (!claudeResponse.ok) {
                throw new Error("Claude API failed");
            }
            
            const content = claudeData.content[0].text.trim();
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        } catch (claudeError) {
            console.error("Claude API Error:", claudeError);
            throw claudeError;
        }
    }
}


async function generateMultiSegmentAdvert(mainPrompt, numSegments = 1) {
  
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

module.exports={
    generateMultiSegmentAdvert
}

// async function run() {
//     try {
//         const result = await generateMultiSegmentAdvert(
//             `Create a promotional video for a new AI-powered productivity app, 
//             showcasing its features and benefits with upbeat music and dynamic visuals.`,
//             4 // Number of 8-second segments (total: ~32 seconds)
//         );
        
//         console.log("\n🎉 Advertisement generation complete!");
//         console.log(`📹 Final video: ${result.finalVideo}`);
//         console.log(`📊 Total segments: ${result.segments.length}`);
//         console.log(`\n💡 Individual segments saved at:`);
//         result.segments.forEach((path, i) => {
//             console.log(`   Segment ${i + 1}: ${path}`);
//         });
        
//         console.log(`\n📋 Scripts used:`);
//         result.scripts.forEach((script, i) => {
//             console.log(`   ${i + 1}. ${script}`);
//         });
        
//     } catch (error) {
//         console.error("\n❌ Error generating advertisement:", error);
//         console.error("Stack trace:", error.stack);
//         process.exit(1);
//     }
// }

// run();

