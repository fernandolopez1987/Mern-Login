const {Schema, model, models} = require('mongoose')


const userSchema = new Schema({
    email:{
        type:String,
        trim:true,
        required:true,
        unique:true,
        lowercase:true
    },
    name:{
        type:String,
        trim:true,
        required:true
    },
    hash_password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        default:'User'
    },
    resetPasswordLink:{
        date:String,
        default:''
    }

},{timeStamp:true})

module.exports = model('User', userSchema)