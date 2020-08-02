const express = require('express');
const router = express.Router();
const { adminMiddleware, requireSignin } = require('../controllers/authController')
const{ userIdController, updateController} = require('../controllers/userController');


router.get('/user/:id',requireSignin, userIdController)
router.put('/user/update', requireSignin, updateController)
router.put('/admin/update', requireSignin, adminMiddleware, updateController)