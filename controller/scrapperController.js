const { scrapeURL, scrapeAllPages } = require("../puppet")

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




module.exports={getScrapped, getDetailedScrapped}