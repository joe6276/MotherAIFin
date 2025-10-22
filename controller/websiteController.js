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

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function generateComponentCode(componentType, instruction) {
  const apiKey = process.env.OPENAI_API_KEY;

  const prompt = `Generate HTML and CSS code for a ${componentType} component based on this instruction: ${instruction}.
  Return the response in this exact JSON format:
  {
    "html": "the HTML code here",
    "css": "the CSS code here"
  }
  Make the code clean, modern, and production-ready.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", 
        messages: [
          {
            role: "system",
            content:
              "You are an experienced programmer that generates clean HTML and CSS code. Always return responses in valid JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      return;
    }

    const messageContent = data.choices[0].message.content;
    const generatedCode = JSON.parse(messageContent);

    return {
        html:generatedCode.html.toString(),
        css:generatedCode.css.toString()
    };
  } catch (error) {
    console.error("Error generating code:", error);
    return res.status(500).status(error)
  }
}


async function websiteAgent(req,res) {
try {
    const {component,instruction}= req.body
    const response= await generateComponentCode(component,instruction)
    return res.status(200).json(response)
} catch (error) {
     console.error("Error generating code:", error);
     return res.status(500).status(error)
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

module.exports={websiteAgent,saveContent}
