const {json}= require("express")
const express = require("express")
const cors= require("cors")
const session = require("express-session")
const {router}= require ("./routes/index")
const { websiteRouter } = require("./routes/websiteRoutes")
const dotenv=require("dotenv")
const { orchestrationRouter } = require("./routes/orchestartionRoutes")
const { copyWritingRouter } = require("./routes/copywritingRoutes")
const { seoRouter } = require("./routes/seoRouter")
const { videoRouter } = require("./routes/videoRoutes")
const { transcribeRouter } = require("./routes/transcribeRoutes")
const { motherAiRouter } = require("./routes/motherAIRoutes")
const { imageRouter } = require("./routes/imageRoutes")
const { convoRouter } = require("./routes/conversationRoutes")
const { automationRouter } = require("./routes/automationRouter")
const { googleRouter } = require("./routes/googleRoutes")
dotenv.config()


const app= express()
app.use(json())
app.use(session({
    secret: process.env.SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 10000
    }
}))

app.use(cors())
app.use("/users", router)
app.use("/website", websiteRouter)
app.use("/orchestration", orchestrationRouter)
app.use("/copywriting", copyWritingRouter)
app.use("/seo", seoRouter)
app.use("/video", videoRouter)
app.use("/transcribe", transcribeRouter)
app.use("/motherAI", motherAiRouter)
app.use("/image", imageRouter)
app.use("/convo", convoRouter)
app.use("/automation", automationRouter)
app.use("/auth", googleRouter)

app.get("/test", (req,res)=>{
    res.status(200).send("<h1> Hello  Changes!!!! </h1>")
})

app.listen(process.env.PORT, ()=>{
    console.log("Server is running...")
})
