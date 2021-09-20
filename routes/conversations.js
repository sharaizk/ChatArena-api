const router = require("express").Router()
const Conversation = require('../models/Conversation')

// New conv

router.post("/",async (req,res)=>{
    console.log(req.query)
    const {senderId, receiverId} = req.body
    const newConversation = new Conversation({
        members:[senderId, receiverId]
    })

    try{
        const savedConversation = await newConversation.save()
        res.status(200).send(savedConversation)
    }catch(err){
        res.status(500).json(err)
    }
})

// get conv

router.get('/:userId',async(req,res)=>{
    const {userId} = req.params
    try {
        const conversation = await Conversation.find({
            members:{ $in:[userId]}
        })
        res.status(200).json(conversation)
    } catch (error) {
        res.status(500).json(err)
    }
})

module.exports=router