const {Router} = require("express")

const router = Router()

const {register, login} = require("../controller/userController")


router.post('/register', register)
router.post("/login", login)

module.exports ={router}