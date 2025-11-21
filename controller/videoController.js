const { downloadVideo, textToSpeech, mergeAudioWithVideo, deleteFiles, uploadVideoFileUnique, generateSrtFile, addSubtitlesToVideo } = require("./merger");
const { generateScript, generateImage, generateVideo, generateSingleScript } = require("./video");
const path = require("path")
const fs = require('fs')
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

async function getScenes(req, res) {
    try {
        const { instruction, userId } = req.body;
        const scenes = await generateScript(instruction)
        return res.status(200).json({ scenes })
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


async function addAudio(req, res) {

    const { text, userId, videoUrl } = req.body

    try {
        await downloadVideo(videoUrl, `input${userId}.mp4`)
        await textToSpeech(text, `generated_audio${userId}.mp3`)



        const audioDuration = 6
        const options = {}
        const srtPath = `subtitles${userId}.srt`
        const finalPath = `final_with_subtitles${userId}.mp4`;
        generateSrtFile(text, srtPath, audioDuration, options.wordsPerSubtitle || 8)

        await mergeAudioWithVideo(`input${userId}.mp4`, `generated_audio${userId}.mp3`, `output_with_audio${userId}.mp4`)

        await addSubtitlesToVideo(`output_with_audio${userId}.mp4`, srtPath, finalPath, options.subtitleStyle)

        const outputPath = path.join(__dirname, `../${finalPath}`);
        const buffer = fs.readFileSync(outputPath);
        const url = await uploadVideoFileUnique(buffer, finalPath);

        deleteFiles(`input${userId}.mp4`, `generated_audio${userId}.mp3`, `output_with_audio${userId}.mp4`, finalPath, srtPath)
        return res.status(200).json({ url })

    } catch (error) {
        console.log(error);

        return res.status(500).json({ error })
    }

}


module.exports = { genVideo, genSingleVideo, getScenes, addAudio }