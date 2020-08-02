const User = require('../models/userModels')
const expressJwt = require('express-jwt')
const bcryptjs = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const fetch = require('node-fetch')
const {validationResult} = require('express-validator')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const { errorHandler } = require('../helpers/dbErrorHandling')

exports.registerController = async (req,res) =>{
    
    const {name, email, password} = req.body
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        const firstError = errors.array().map(error => error.msg)[0]
        return res.status(422).json({
            error: firstError
        })
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                error: "Email is taken"
            })
        }
        console.log(password)
        const salt = await bcryptjs.genSalt(10);
        let hash_password = await bcryptjs.hash( password, salt );
        console.log(hash_password)

        const payload = {
             name, email, hash_password
        };
        const token= jwt.sign(payload, process.env.JWT_ACCOUNT_ACTIVATION,{ expiresIn: '5m' })  
        res.json({ token });

        const link=`http://${req.headers.host}${req.baseUrl}/activation/${token}`
        
        const smtpTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL,
              pass: process.env.PASS
            }
          });  
          
        
        const mailOptions={
            to : email,
            subject : "Account activation Link",
            html : `
                <h1>Please use the following to activate your account</h1>
                <p>${link}/</p>
                <hr/>
                <p>This email may containe sensetive information</p>
                <p>http://${req.headers.host}</p>
                `
        }
        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
                res.end("error");
            }
            else {
                console.log(`Message sent: ${email}` );
                res.send("Please check your mail, we sent mail to verify account");
            }
        });
    } catch (error) {
        console.log(error)     
        res.status(500).json({msg:'error'})   
    }      
   
}

exports.activationController = (req,res) =>{

    const {token} = req.body; 
    
    if(token){    
        jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err, decoded)=>{
            if(err){
                return res.status(401).json({
                    error: 'Expired Token, Singup again'
                })
            }else {
                const {name, email, hash_password} = jwt.decode(token)

                const user =  new User({name, email, hash_password})

                user.save((err, user) =>{
                    if(err){
                        console.log('Save error', errorHandler(err))
                        return res.status(401).json({
                            errors: errorHandler(err)
                        });
                    } else{
                        return res.json({
                            success: true,
                            message: user
                        });
                    }
                });
            }
        });   
    } else {
        return res.json({
            message: 'error happening please try again'
        })
    }
}

exports.signinController = async (req, res) =>{

    const { email, password } = req.body

    const errors = validationResult(req)

    if(!errors.isEmpty()){
        const firstError = errors.array().map(error => error.msg)[0]
        return res.status(422).json({
            error: firstError
        })
    }
    try {
        let user = await User.findOne({ email })
        console.log(user.hash_password);
        if (!user) {
            return res.status(400).json({
                errors: 'User with that email does not exist. Please signup'
            })
        }
        
        const pass = await bcryptjs.compare( password, user.hash_password );
        if(!pass){
            return res.status(400).json({ 
                errors: 'Email and password do no match'
             })
        }
        
        const token = jwt.sign({
            _id : user._id
        }, process.env.SECRET_TOKEN,{ expiresIn: '7d'});

        const { _id, name, role} = user;
        return res.status(200).json({
            token,
            user:{
                _id,
                name,
                email,
                role
            }
            
        })
    } catch (error) {
        console.log(error)     
        res.status(500).json({msg:'error'})
    }
}

exports.forgotPasswordController = async (req, res) =>{
    
    const { email } = req.body;
    console.log(req.body)
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        const firstError = errors.array().map(error => error.msg)[0]
        return res.status(422).json({
            error: firstError
        })
    }

    try {
        let user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                error: 'User with this email doest not exists'
            })
        }
        const token = jwt.sign({
            _id : user._id
        }, process.env.JWT_RESET_PASSWORD, { expiresIn: '20m'});
        
        const smtpTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL,
              pass: process.env.PASS
            }
        });
        const link=`http://${req.headers.host}${req.baseUrl}/resetpassword/${token}`
        
        const mailOptions={
            to : email,
            subject : "Password Reset Link",
            html : `
                <h1>Please use the following link to reset your password</h1>
                <p>${link}</p>
                <hr/>
                <p>This email may contain sensitive information</p>
                <p>http://${req.headers.host}</p>
            `
        }
        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
                res.end("error");
            }
            else {
                console.log(`Message sent: ${email}` );
            }
        });

        let data = await user.updateOne({ resetPasswordLink: token })
        if(!user){
            return res.status(400).json({ error: "User with this email does not exists" })
        }
        return res.status(200).json({ message:'Please check your email, we sent email to reset password'})

    } catch (error) {
        console.log(error)     
        res.status(500).json({ message: err.message}) 
    }
}

exports.resetPasswordController = async (req, res) =>{

    const { resetPasswordLink, newPassword } = req.body

    const errors = validationResult(req)

    if(!errors.isEmpty()){
        const firstError = errors.array().map(error => error.msg)[0]
        return res.status(422).json({
            error: firstError
        })
    }
    if(resetPasswordLink){
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, (err, decoded) =>{
            if(err){
                return res.status(400).json({ error: 'Expired link. Try again' });
            }
        })    
    }

    const salt = await bcryptjs.genSalt(10);
    let hash_password = await bcryptjs.hash( newPassword, salt );
    let user = await User.findOneAndUpdate({resetPasswordLink},{resetPasswordLink:'', hash_password: hash_password}, {new:true})
    if(!user){
        return res.status(400).json({ message: 'The user doesn not exist, the password was not changed '})
    }
    console.log(user)   
    res.status(200).json({message:'Great! Now you can login with your new password', user})
}

exports.adminMiddleware = async (req, res, next) =>{

    let user = await User.findById({_id : req.user._id})
    if(!user){
        return res.status.json({
            error: `User not found`
        })
    }
    if(user.role !== 'admin'){
        return res.status(400).json({
            error: `Admin resource. Access denied`
        })
    }
    req.profile = user;
    next();
}

exports.requireSignin = expressJwt({ 
    secret: process.env.SECRET_TOKEN
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT)

exports.googleController = async (req, res) =>{
    
    const {idToken} = req.body

    client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT})
        .then(response =>{
            const { email_verified, name, email} = response.payload
            if(email_verified){
                let user = await User.findOne({email})
                if(user){
                    const token = jwt.sign({ _id : user._id}, process.env.SECRET_TOKEN,{
                        expiresIn: '7d'
                    });
                    const { _id, email, name, role} = user;
                    return res.json({
                        token,
                        user:{_id, email, name, role}
                    });
                } else {
                    let hash_password = email+process.env.SECRET_TOKEN;
                    user = new User({name, email, hash_password});
                    await user.save((err, data) =>{
                        if(err){
                            return res.status(400).json({
                                error: 'User signup failed with google'
                            })
                        }
                        const token =jwt.sign(
                            { _id : data._id},
                            process.env.SECRET_TOKEN,
                            { expiresIn: '7d' });
                        const { _id, email, name, role } = data;
                        return res.json({
                            token,
                            user:{ _id, email, name, role }
                        });
                    });
                }    
            }else {
                return res.status(400).json({
                    error: 'Google login failed. Try again'
                })
            }
        })
}

exports.facebookController = async (req, res) =>{
    const { userID, AccessToken } = req.body
    
    const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`

    return(
        fetch(url, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(response =>{
            const { email, name } = response;
            let user = await User.findOne({ email })
            if(user){
                const token = jwt.sign({ _id: user._id }, process.env.SECRET_TOKEN, { expiresIn: '7d'})
            } else {
                let hash_password = email+process.env.SECRET_TOKEN;
                user = new User({name, email, hash_password});
                await user.save((err, data) =>{
                    if(err){
                        console.log(err)
                        return res.status(400).json({
                            error: 'User signup failed with facebook'
                        })
                    }
                    const token =jwt.sign(
                        { _id : data._id},
                        process.env.SECRET_TOKEN,
                        { expiresIn: '7d' });
                    const { _id, email, name, role } = data;
                    return res.json({
                        token,
                        user:{ _id, email, name, role }
                    });
                });
            }
        })
        .catch(error => {
            res.json({
                error: 'Facebook login failed. Try later'
            })
        })
    )
}