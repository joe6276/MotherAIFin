const {json}= require("express")
const express = require("express")
const {router}= require ("./routes/index")
const app= express()


app.use(json())
app.use("/users", router)



app.listen(80, ()=>{
    console.log("Server is running on port 80")
})
