const { scrapeURL, scrapeAllPages } = require("../puppet")
const { searchForURL, scrapeContacts } = require("./scrap")

async function getScrapped(req,res) {
try {
        const {url, userId}= req.body

        const response = await scrapeURL(url)

        return res.status(200).json({response})
} catch (error) {
    return res.status(500).json({error})
}
}

async function getDetailedScrapped(req,res) {
try {
        const {url, userId}= req.body

        const response = await scrapeAllPages(url)

        return res.status(200).json({response})
} catch (error) {
    return res.status(500).json({error})
}
}


async function scrapByKeyword(req,res){
    try {
        const {instruction}= req.body
        console.log(instruction);
        
        const response = await searchForURL(instruction)
        return res.status(200).json({response})
    } catch (error) {
        return res.status(500).json({response: error.message})
    }
}


async function getContacts(req,res){
    try {
        const {urls}= req.body
            const allContacts = [];
           for (const url of urls) {
            const contacts = await scrapeContacts(url);

            // Only add if we found contact info
            if (contacts.emails.length > 0 || contacts.phones.length > 0) {
                allContacts.push(contacts);
                console.log(`✓ Found contacts: ${contacts.phones.length} phones, ${contacts.emails.length} emails`);
            } else {
                console.log(`✗ No contacts found`);
            }

            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

       
        return res.status(200).json({allContacts})
    } catch (error) {
        return res.status(500).json({response: error.message})
    }
}




module.exports={getScrapped, getDetailedScrapped, getContacts, scrapByKeyword}