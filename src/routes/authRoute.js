const express = require('express')
const router = express.Router()
const {registerController, activationController,signinController
    ,resetPasswordController, googleController, facebookController
} = require ('../controllers/authController')
const { validSign, validLogin, resetPasswordValidator, forgotPasswordValidator} = require('../helpers/valid')


router.post('/register', validSign, registerController)
router.post('/activation', validSign,activationController)
router.post('/login', validLogin, signinController)

router.put('/forgotpassword', forgotPasswordValidator, forgotPasswordController)
router.put('/resetpassword', resetPasswordValidator, resetPasswordController)

router.post('/googlelogin', googleController)
router.post('/facebooklogin', facebookController)

module.exports = router