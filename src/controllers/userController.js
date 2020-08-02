const User = require('../models/userModels')
const expressJwt = require('express-jwt')
const { update } = require('../models/userModels')

exports.userIdController = async (req, res) =>{
    const { id } = req.params
    
    let user = await User.findById({ id })
    if(!user){
        return res.status(400).json({
            error: 'User not found'
        })
    }
    user.hashed_password = undefined;
    res.json(user)
}

exports.updateController = async (req, res) =>{

    const { name, password } = req.body;

    try {
        let user = await User.findOne({ _id: req.user._id })
        if(!user){
            return res.status(400).json({
                error: 'User not found'
            });
        }
        if(!name){
            return res.status(400).json({
                error: 'Name is required'
            });
        }else{
            user.name = name
        }

        if(password){
            if(password.length < 8){
                return res.status(400).json({
                    error: 'Password should be min 6 characters long'
                });
            } else {
                user.hash_password = password;
            }            
        }

        await user.save((err, updatedUser) => {
            if(err){
                console.log(err)
                return res.status(400).json({
                    error: 'User update failed'
                });
            }
            updatedUser.hash_password = undefined;
            res.json(updatedUser)
        })
    } catch (error) {
        console.log(error)     
        res.status(500).json({ message: err.message}) 
    }
}