const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const cloudinary = require('cloudinary').v2
const User = require('../models/User')

cloudinary.config({
    cloud_name:'xdevs',
    api_key:'633265198349345',
    api_secret:'mZc0qtkcqJ5aitjMy0df7wMcvZA'
})

router.post('/register', async (req,res)=>{
    const {name, password,username, dateofbirth, gender, country,profileimage} = req.body
        
    let {email} =req.body
    email = email.toLowerCase()
    if(!name || !email || !username || !password || !dateofbirth || !gender || !country){
        return res.status(400).json({error: "Please fill the field"})
    }
    try{
        const img = await cloudinary.uploader.upload(profileimage)
        const emailExist = await User.findOne({email:email})
        const userNameExist = await User.findOne({username: username})

        if(emailExist){
            return res.status(400).json({error: 'Email Already Exists'})
        }
        if(userNameExist){
            return res.status(400).json({error: 'Username Already Exists'})
        }

        else{
            const user = new User({name, email, username, password, dateofbirth, gender, country,profilepic: img.url})
            const userRegister = await user.save()
            if(userRegister){
                return res.status(200).send({message:"SIGNED UP"})
            }
        }
    }
    catch(e){
        console.log(e)
    }
})

router.post('/login', async(req,res)=>{
    try {
        const {password,username} = req.body
        if(!username || !password){
            return res.status(400).json({error:'Please fill the data'})
        }
    
        const userFound = await User.findOne({username: username})
    
        if(userFound){

            const isMatch = await bcrypt.compare(password, userFound.password)
            if(!isMatch){
                res.status(400).json({error:'Invalid Credentials'})
            }
    
            else{
                const userData = await User.findOne({username: username}).select({ "_id": 1, "name": 1, "email":1,"username":1,"dateofbirth":1, "gender":1, "country":1,"profilepic":1,"friends":1})
                const token = jwt.sign({userId: userData._id},process.env.SECRET_KEY)
                res.status(200).send({userData,token})
            }
        }
        else{
            res.status(400).json({error:'Invalid Credientials'})
        }
    } catch (error) {
        console.log(error)
    }
})

router.post('/authenticate',(req,res)=>{
    const {token} = req.body
    jwt.verify(token,process.env.SECRET_KEY, async(err, payload)=>{
        const {userId} = payload
        const user = await User.findById(userId)
        res.status(200).send({user})
    })
})


module.exports = router