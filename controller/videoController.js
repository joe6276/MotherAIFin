const { generateScript, generateImage, generateVideo, generateSingleScript } = require("./video");


async function genVideo(req, res) {
    try {

        const { instruction, userId } = req.body;
        const scenes = await generateScript(instruction)
        const finalMovieUrls = [];
        const images = [];

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i]
            const imgURL = await generateImage(scene)
            console.log(imgURL);

            const vidURL = await generateVideo(scene, imgURL)

            console.log(vidURL);

            images.push(imgURL)
            finalMovieUrls.push(vidURL)
        }

        console.log(finalMovieUrls);
        console.log(images);

        const safeImages = images.map(i => i.toString());
        const safeVideos = finalMovieUrls.map(v => v.toString());
        const safeScenes = scenes.map(s => s.toString());

        return res.status(200).json({ images: safeImages, videos: safeVideos, scenes: safeScenes });

    } catch (error) {
        return res.status(500).json(error)
    }
}

async function getScenes(req,res) {
    try {
        const { instruction, userId } = req.body;
        const scenes = await generateScript(instruction)
        return res.status(200).json({scenes})
    } catch (error) {
        return res.status(500).json(error)
    }
}

async function genSingleVideo(req, res) {
    try {

        const { instruction, userId } = req.body;
        const scenes = await generateSingleScript(instruction)
        const finalMovieUrls = [];
        const images = [];

        const imgURL = await generateImage(scenes[0])
        const vidURL = await generateVideo(scenes[0], imgURL)


        images.push(imgURL)
        finalMovieUrls.push(vidURL)

        return res.status(200).json({ images, videos: finalMovieUrls, scenes })

    } catch (error) {
        return res.status(500).json(error)
    }
}


module.exports = { genVideo, genSingleVideo, getScenes }