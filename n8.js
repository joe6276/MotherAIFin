
// const geminiApiKey="AIzaSyCrRJmiwiiH9aqwZFilGR6WCPvjMWNvIr8"


// async function searchForURL(query) {
//     try {

//       console.log("called");
      
//         // Using Gemini API v1 endpoint with gemini-2.5-flash
//         const searchResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 contents: [{
//                     parts: [{
//                         text: `Based on the search query: "${query}"

//                 Generate a list of 8-10 likely public business listing URLs and commercial website URLs that would appear in search results for this query. Include:
//                 - Official business websites
//                 - Business classified ad sites (like Craigslist, Facebook Marketplace)
//                 - Commercial marketplace pages (like eBay, Amazon sellers)
//                 - Company contact/about pages
//                 - Business directory listings

//                 Return ONLY a valid JSON array of complete URLs with proper domains.
//                 Format: ["https://example.com/page1", "https://example2.com/page2"]

//                 Return ONLY the JSON array, no explanation or markdown formatting.`
//                     }]
//                 }],
//                 generationConfig: {
//                     temperature: 0.7,
//                     maxOutputTokens: 1500
//                 }
//             })
//         });

//         if (!searchResponse.ok) {
//             const errorText = await searchResponse.text();
//             throw new Error(`Gemini API Error: ${searchResponse.status} - ${errorText}`);
//         }

//         const searchData = await searchResponse.json();

//         console.log("Full Gemini Response:", JSON.stringify(searchData, null, 2));

//         let urlList = [];
        
//         // Extract text from Gemini response structure
//         const textContent = searchData.candidates?.[0]?.content?.parts
//             ?.filter(part => part.text)
//             .map(part => part.text)
//             .join("\n") || "";

//         console.log("Extracted Text:", textContent);

//         try {
//             const cleanJson = textContent.replace(/```json\n?|\n?```/g, '').trim();
//             urlList = JSON.parse(cleanJson);
//         } catch (e) {
//             console.log("JSON parsing failed, extracting URLs manually");
//             const urlRegex = /https?:\/\/[^\s"'\]]+/g;
//             urlList = [...new Set(textContent.match(urlRegex) || [])];
//         }

//         // Filter out invalid URLs
//         urlList = urlList.filter(url => {
//             try {
//                 new URL(url);
//                 return true;
//             } catch {
//                 return false;
//             }
//         });

//         if (urlList.length === 0) {
//             console.log('Gemini returned no URLs. Using manual marketplace URLs...');
//             urlList = await getManualURLs(query);
//         }

//         console.log(`Found ${urlList.length} URLs to scrape`);
//         return urlList;

//     } catch (error) {
//         console.error("Error in searchForURL:", error.message);
//         throw error;
//     }
// }

// async function run() {
//   try {
//     const response= await searchForURL("Mark X cars available for sale")
//     console.log(response);
    
//   } catch (error) {
    
//   }
// }

// run()