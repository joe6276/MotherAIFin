const { generateMultiSegmentAdvert } = require("../videoTools");
const { checkSubscription } = require("./paymentController");


async function generateVideo(req, res) {
    try {

        const { instruction, userId } = req.body;

        var checkSub = await checkSubscription(userId)
        if (!checkSub) {
            return res.status(400).json({ error: "Kindly Check your Subscription" });
        } if (!checkSubscription(userId)) {
            return res.status(400).json({ error: "Kindly Check your Subscription" });
        }

        const res = await generateMultiSegmentAdvert(instruction)
        return res.status(200).json(res)
    } catch (error) {
        return res.status(500).json(error)
    }
}




async function run() {

    try {
        const response = await generateMultiSegmentAdvert("create for an AI Marketting Video for my company called JoeAI")
        console.log(response);

    } catch (error) {
        console.log(error);

    }

}

// run()

module.exports = { generateVideo }