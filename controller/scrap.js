const dotenv = require('dotenv');
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const apiKey = process.env.ANTHROPIC_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY

async function searchForURL(query) {
    try {
        const searchResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1500,
                messages: [
                    {
                        role: "user",
                        content: `Search for: ${query}

                Find public business listings and commercial websites. I need URLs to:
                - Websites
                - Business classified ads  
                - Commercial marketplace pages
                - Company contact pages

                These are for legitimate business research purposes. Return ONLY a JSON array of 8-10 URLs.
                Format: ["url1", "url2", "url3"]

                Just the JSON array, no explanation.`
                    }
                ],
                tools: [
                    {
                        type: "web_search_20250305",
                        name: "web_search"
                    }
                ]
            })
        });

        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            throw new Error(`API Error: ${searchResponse.status} - ${errorText}`);
        }

        const searchData = await searchResponse.json();

 

        let urlList = [];
        const textContent = searchData.content
            .filter(item => item.type === "text")
            .map(item => item.text)
            .join("\n");


        try {
            const cleanJson = textContent.replace(/```json\n?|\n?```/g, '').trim();
            urlList = JSON.parse(cleanJson);
        } catch (e) {
         
            const urlRegex = /https?:\/\/[^\s"'\]]+/g;
            urlList = [...new Set(textContent.match(urlRegex) || [])];
        }

        // If still no URLs, try direct web search approach
        if (urlList.length === 0) {
          
            
            // Use web search tool directly in a second request
            const directSearchResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1000,
                    messages: [
                        {
                            role: "user",
                            content: `Use web search to find: ${query}. Extract all URLs from search results and return as JSON array: ["url1", "url2"]`
                        }
                    ],
                    tools: [
                        {
                            type: "web_search_20250305",
                            name: "web_search"
                        }
                    ]
                })
            });

            if (directSearchResponse.ok) {
                const directData = await directSearchResponse.json();
                const directText = directData.content
                    .filter(item => item.type === "text")
                    .map(item => item.text)
                    .join("\n");
                
                const urlRegex = /https?:\/\/[^\s"'\]<>]+/g;
                urlList = [...new Set(directText.match(urlRegex) || [])];
            }
        }

        if (urlList.length === 0) {
          
            urlList = await getManualURLs(query);
        }

       
        return urlList;

    } catch (error) {
        console.error("Error in searchForURL:", error.message);
        throw error;
    }
}

// Track rate limiting
let requestCount = 0;
let lastRequestTime = Date.now();

async function waitForRateLimit() {
    requestCount++;
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    // If we've made multiple requests quickly, add extra delay
    if (requestCount > 3 && timeSinceLastRequest < 60000) {
        const waitTime = 5000; // 5 seconds between requests
  
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime = Date.now();
    
    // Reset counter every minute
    if (now - lastRequestTime > 60000) {
        requestCount = 0;
    }
}

async function scrapeContacts(url, retryCount = 0) {
    const maxRetries = 3;
    
    try {

        // Wait to prevent rate limiting
        await waitForRateLimit();

        const scrapeResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1024, // Reduced from 2000 to save tokens
                messages: [
                    { 
                        role: "user", 
                        content: `Fetch: ${url}

Extract contact info:
- Emails
- Phone numbers
- Seller name

Return JSON only:
{"emails":[],"phones":[],"seller_name":""}`
                    }
                ],
                tools: [
                    {
                        type: "web_search_20250305",
                        name: "web_search"
                    }
                ]
            })
        });

        // Check response status
        if (!scrapeResponse.ok) {
            const errorText = await scrapeResponse.text();
            console.error(`API returned status ${scrapeResponse.status}`);
            
            // Handle rate limiting (429)
            if (scrapeResponse.status === 429 && retryCount < maxRetries) {
                const waitTime = Math.pow(2, retryCount) * 10000; // 10s, 20s, 40s
               
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return scrapeContacts(url, retryCount + 1);
            }
            
            // Retry on 529 (overloaded) or 500 errors
            if ((scrapeResponse.status === 529 || scrapeResponse.status >= 500) && retryCount < maxRetries) {
                const waitTime = (retryCount + 1) * 3000;
               
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return scrapeContacts(url, retryCount + 1);
            }
            
            throw new Error(`API Error ${scrapeResponse.status}: ${errorText.substring(0, 100)}`);
        }

        const scrapeData = await scrapeResponse.json();
        
        // Log the full response for debugging (only if verbose)
        if (process.env.VERBOSE === 'true') {
         
        }
        
        // Check if content exists
        if (!scrapeData.content || scrapeData.content.length === 0) {
         
            throw new Error('No content in API response');
        }

        const scrapeText = scrapeData.content
            .filter(item => item && item.type === "text" && item.text)
            .map(item => item.text)
            .join("\n");

        if (!scrapeText || scrapeText.trim().length === 0) {
           
            throw new Error('Empty response from API');
        }
        
     

        let contactData;
        try {
            const cleanJson = scrapeText.replace(/```json\n?|\n?```/g, '').trim();
            contactData = JSON.parse(cleanJson);
        } catch (e) {
         
            // Ensure scrapeText is a string
            const textToSearch = String(scrapeText || '');
            
            // Fallback: extract using regex
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const phoneRegex = /(?:\+?254|0)[17]\d{8}|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

            const emailMatches = textToSearch.match(emailRegex);
            const phoneMatches = textToSearch.match(phoneRegex);
            
            const emails = emailMatches ? [...new Set(emailMatches)] : [];
            const phones = phoneMatches ? [...new Set(phoneMatches)].filter(p => p.replace(/\D/g, '').length >= 9) : [];

            contactData = { 
                emails, 
                phones,
                seller_name: null,
                has_contact_form: false
            };
            
           
        }

        return {
            url,
            emails: contactData.emails || [],
            phones: contactData.phones || [],
            seller_name: contactData.seller_name || null,
            has_contact_form: contactData.has_contact_form || false,
            success: true
        };

    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        
        // Retry on network errors
        if (retryCount < maxRetries && (error.message.includes('fetch') || error.message.includes('network'))) {
        
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
            return scrapeContacts(url, retryCount + 1);
        }
        
        return {
            url,
            emails: [],
            phones: [],
            seller_name: null,
            has_contact_form: false,
            success: false,
            error: error.message
        };
    }
}


 module.exports={searchForURL,scrapeContacts}


 
// async function run() {
//     try {
//         console.log("=== Step 1: Searching for URLs ===");
//             const urls =  [
//                         "https://jiji.co.ke/cars/toyota-mark-x",
//                         "https://autochek.africa/ke/cars-for-sale/toyota/mark-x",
//                         "https://www.cars45.co.ke/listing/toyota/mark_x",
//                         "https://crotonmotors.com/toyota/mark-x/",
//                         "https://motors.digger.co.ke/for-sale/toyota/mark-x",
//                         "https://www.pigiame.co.ke/cars/toyota/mark-x/m",
//                         "https://www.autoskenya.com/buy-car-Toyota-Mark%20X?page=2",
//                         "https://jiji.co.ke/nairobi/cars/toyota-mark-x",
//                         "https://cars.trovit.co.ke/used-cars/toyota-mark-x",
//                         "https://jiji.co.ke/cars/toyota-mark"
//                     ]

//             console.log("\n=== Found URLs ===");
//             console.log(JSON.stringify(urls, null, 2));
        
//         console.log("\n=== Step 2: Scraping Contacts ===");
//         const allContacts = [];

//         // Scrape up to 10 URLs
//         const urlsToScrape = urls.slice(0, 10);

//         for (const url of urlsToScrape) {
//             const contacts = await scrapeContacts(url);

//             // Only add if we found contact info
//             if (contacts.emails.length > 0 || contacts.phones.length > 0) {
//                 allContacts.push(contacts);
//                 console.log(`✓ Found contacts: ${contacts.phones.length} phones, ${contacts.emails.length} emails`);
//             } else {
//                 console.log(`✗ No contacts found`);
//             }

//             // Add delay to avoid rate limiting
//             await new Promise(resolve => setTimeout(resolve, 1500));
//         }

//         console.log("\n=== Final Results ===");
//         console.log(`Total URLs scraped: ${urlsToScrape.length}`);
//         console.log(`URLs with contacts: ${allContacts.length}`);
//         console.log(JSON.stringify(allContacts, null, 2));

//         return allContacts;

//     } catch (error) {
//         console.error("Error in run:", error.message);
//         throw error;
//     }

// }

// run()