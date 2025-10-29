const { generateMultiSegmentAdvert } = require("../videoTools");


async function generateVideo(req,res){
    try {
        const {instruction} = req.body
       const res= await generateMultiSegmentAdvert(instruction)
         return res.status(200).json(res)
    } catch (error) {
        return res.status(500).json(error)
    }
}




module.exports={generateVideo}