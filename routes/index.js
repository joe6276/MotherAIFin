const {Router} = require("express")

const router = Router()

const {register, login, forgotPassword, resetPassword} = require("../controller/userController")


router.post('/register', register)
router.post("/login", login)
router.post("/forgot", forgotPassword)
router.post("/reset", resetPassword)
module.exports ={router}