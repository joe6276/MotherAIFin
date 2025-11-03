// const dotenv = require('dotenv')
// const path = require("path")
// dotenv.config({ path: path.resolve(__dirname, "../.env") })


// async function generateComponentCode(componentType, instruction) {
//     const apiKey = process.env.OPENAI_API_KEY
//     const prompt = `Generate HTML and CSS code for a ${componentType} component based on this instruction: ${instruction}
  
//                     Return the response in this exact JSON format:
//                     {
//                     "html": "the HTML code here",
//                     "css": "the CSS code here"
//                     }
//                     Make the code clean, modern, and production-ready.`;

//     try {
        
//         const response= await fetch('https://api.openai.com/v1/chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${apiKey}`
//             },
//             body: JSON.stringify({
//                 model:'gpt-4',
//                         messages: [
//           {
//             role: 'system',
//             content: 'You are an experienced Programmer that generates clean HTML and CSS code. Always return responses in valid JSON format.'
//           },
//           {
//             role: 'user',
//             content: prompt
//           }
//         ],

//         temperature: 0.7
//             })
//         })

//         const data = await response.json()
//         console.log("HTML");
        
//         console.log(data.choices[0].message.content);

        
        
//         const generatedCode = JSON.parse(data.choices[0].message.content);
    
//         return {
//             html: generatedCode.html,
//             css: generatedCode.css
//         };

//     } catch (error) {
//           console.error('Error generating code:', error);
//         throw error;
//     }


// }


// async function run() {
//     const response = await generateComponentCode("header", "Create a navigation header with logo and links and for a company called JoeAI")
//     console.log(response);
    
// }
// run()


const dotenv = require('dotenv');
const path = require('path');
const { createFileinDateFolder } = require('../google');
const { url } = require('inspector');

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function generateComponentCode(componentType, instruction) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;

  const prompt = `Generate HTML and CSS code for a ${componentType} component based on this instruction: ${instruction}.
  Return the response in this exact JSON format (without any markdown code blocks or backticks):
  {
    "html": "the HTML code here",
    "css": "the CSS code here"
  }
  Make the code clean, modern, and production-ready.`;

  const systemPrompt = "You are an experienced programmer that generates clean HTML and CSS code. Always return responses in valid JSON format WITHOUT markdown code blocks or backticks. Return only the raw JSON object.";

  // Helper function to extract JSON from markdown code blocks
  function extractJSON(content) {
    // Remove markdown code blocks if present
    let cleaned = content.trim();
    
    // Remove ```json and ``` wrappers
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    return cleaned.trim();
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
        }),
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
      )
    ]);

    const data = await gptResponse.json();

    if (gptResponse.ok) {
      const messageContent = data.choices[0].message.content;
      const cleanedContent = extractJSON(messageContent);
      const generatedCode = JSON.parse(cleanedContent);

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
      const cleanedContent = extractJSON(messageContent);
      const generatedCode = JSON.parse(cleanedContent);

      return {
        html: generatedCode.html.toString(),
        css: generatedCode.css.toString()
      };

    } catch (claudeError) {
      console.error("Claude API Error:", claudeError);
      throw claudeError;
    }
  }
}

async function websiteAgent(req, res) {
  try {
    const { component, instruction } = req.body;
    const response = await generateComponentCode(component, instruction);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error generating code:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function updateComponent(componentType, instruction, existingCode = null, url) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;

  let prompt;
  
  if (existingCode && existingCode.html && existingCode.css) {
    // Update mode: modify existing code
    prompt = `You are updating an existing ${componentType} component. 

EXISTING CODE:
HTML:
${existingCode.html}

CSS:
${existingCode.css}

UPDATE INSTRUCTION: ${instruction}

Apply the requested changes to the existing code. Return the COMPLETE updated code (not just the changes) in this exact JSON format:
{
  "html": "the complete updated HTML code here",
  "css": "the complete updated CSS code here"
}

Incase ${url} is provided add the image to the component, use a nice styling to achieve this.

Make sure all changes are applied correctly and the code remains clean and production-ready.`;
  } else {
    // Generate mode: create new code
    prompt = `Generate HTML and CSS code for a ${componentType} component based on this instruction: ${instruction}.
Return the response in this exact JSON format:
{
  "html": "the HTML code here",
  "css": "the CSS code here"
}
Make the code clean, modern, and production-ready.`;
  }

  const systemPrompt = "You are an experienced programmer that generates and updates clean HTML and CSS code. Always return responses in valid JSON format with 'html' and 'css' properties.";

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
      
      // Handle potential markdown code blocks
      let jsonString = messageContent;
      if (messageContent.includes('```json')) {
        jsonString = messageContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      } else if (messageContent.includes('```')) {
        jsonString = messageContent.replace(/```\s*/g, '').trim();
      }
      
      const generatedCode = JSON.parse(jsonString);

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
      
      // Handle potential markdown code blocks
      let jsonString = messageContent;
      if (messageContent.includes('```json')) {
        jsonString = messageContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      } else if (messageContent.includes('```')) {
        jsonString = messageContent.replace(/```\s*/g, '').trim();
      }
      
      const generatedCode = JSON.parse(jsonString);

      return {
        html: generatedCode.html.toString(),
        css: generatedCode.css.toString()
      };

    } catch (claudeError) {
      console.error("Claude API Error:", claudeError);
      throw claudeError;
    }
  }
}


async function updateComponentCode(req,res){
  try {
    
    const {component, instruction, existingCode, url}= req.body
    const response = await updateComponent(component,instruction,existingCode, url)
    return res.status(200).json(response)
  } catch (error) {
    return res.status(500).json(error)
  }
}

async function saveContent(req,res) {
    try {
        const {name, content}= req.body
        const response= await createFileinDateFolder(name,content)
        return res.status(200).json(response) 
    } catch (error) {
         return res.status(500).status(error)
    }
}

module.exports={websiteAgent,saveContent, updateComponentCode}
