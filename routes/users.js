const User = require("../models/User");
const Request = require('../models/Requests')
const router = require("express").Router();
const sendReq = require('../index')
const accept = require('../index')
router.get("/", async (req, res) => {
    const {userId} = req.query;

    try {
      const user = userId
        ? await User.findById(userId)
        : await User.findOne({ username: username });
      const { password, updatedAt, ...other } = user._doc;
      res.status(200).json(other);
    } catch (err) {
      res.status(500).json(err);
    }
  });


router.get('/search',async (req,res)=>{
  const {username} = req.query

  try{
    if(username.length >0){
      const searchedUser = await User.find({username:{$regex: '^' + username, $options: 'i'}}).select({"_id":1, "name":1,"username":1,"profilepic":1})
      res.status(200).send(searchedUser)
    }
    else{
      res.status(200).send([])
    }
  }
  catch(err){
    res.status(400).send()
  }
})


const getSenderInfo = async(senderId) =>{
  try {
    const senderInfo = await User.findOne({_id: senderId}).select({"_id":1, "name":1,"username":1,"profilepic":1})
    return senderInfo
  } catch (error) {

  }
}

const getReceiverInfo = async(receiverId) =>{
  try {
    const receiverInfo = await User.findOne({_id:receiverId}).select({"_id":1, "name":1,"username":1,"profilepic":1})
    return receiverInfo
  } catch (error) {
    
  }
}

// send friend Request

router.post('/sendrequest',async(req,res)=>{
  const {userId, sender} = req.body
  try {
    // getting the info of the sender
    const senderInfo = await getSenderInfo(sender)
    // search if sender has already got the request from receiver

    const receiverData = await Request.findOne({receiver:sender}).select({"_id":0,"senders":1})
    if (receiverData){
      const senderHasRequest = receiverData.senders.some(el=>el.senderInfo._id == userId)
      if(senderHasRequest){
        return res.status(400).send({error:"You already have Request from this user"})
      }
    }

    // checking if there are already request for the receiver
    const searchRequestForOne = await Request.findOne({receiver: userId}).select({"_id":0,"senders":1})
    if(searchRequestForOne){
      // checking if the sender has already sent the request
      const requestExist = searchRequestForOne.senders.some(el=>el.senderInfo._id == sender )
      if(!requestExist){
        // sending the request if sender hasnot sent the request
        await Request.findOneAndUpdate({receiver:userId},{$push:{senders:{senderInfo:senderInfo}}})
        sendReq.sendReq(userId)
        return res.status(200).send({message:"Friend Request Sent"})
      }
      else{
        return res.status(400).send({error:"Request already sent"})
      }
    }
    else{
      // creating a new request if the reqeusts don't exists
      const createNewRequest = new Request({receiver:userId, senders:{senderInfo: senderInfo}})
      const saveNewRequest = await createNewRequest.save()
      if(saveNewRequest){
        sendReq.sendReq(userId)
        return res.status(200).send({message:"Freind Request Sent"})
      }
    }

  } catch (error) {
    console.log(error)
      return res.status(404).send({error:"Something went wrong with the server"})
  }

})

router.get('/getrequests',async(req,res)=>{
  const {userId} = req.query
  try {
      const searchForRequests = await Request.findOne({receiver: userId}).select({"_id":0,"senders":1})
      if(searchForRequests){
        res.status(200).send(searchForRequests.senders)
      }
      else{
        return res.status(200).send([])
      }
  } catch (error) {
    return res.status(404).send({error:"Can't find the Requests"})
  }
})

router.get('/getfriends',async (req,res)=>{
  const {userId} = req.query
  try {
    const friendList = await User.findOne({_id: userId}).select({"_id":0,"friends":1})
    if(friendList){
      res.status(200).send(friendList.friends)
    }
  } catch (error) {
    res.status(404).send({error:"User Doesn't exist"})
  }
})

router.patch('/acceptrequest',async(req,res)=>{
  const {sender, receiver} = req.body
  try {
    const requestBody = await Request.findOne({receiver:receiver}).select({"_id":0,"senders":1})
    if(requestBody){
      const senderInfo = await getSenderInfo(sender)
      const receiverInfo = await getReceiverInfo(receiver)
      const pullSender = await Request.findOneAndUpdate({receiver: receiver},{$pull:{ senders:{senderInfo:senderInfo}}})
      if(pullSender){
        const updateReceiver = await User.findOneAndUpdate({_id: receiver},{$push:{friends:senderInfo}})
        const updateSender = await User.findOneAndUpdate({_id: sender},{$push:{friends:receiverInfo}})
        if(updateReceiver && updateSender){
          accept.accept(sender,receiver)
          res.status(200).send({message: 'Requests accepted'})
        }
      }
    }
    else{
      res.status(404).send({error:"Request not found"})
    }
  
  } catch (error) {
    console.log(error)
    res.status(400).send({error:"Something went wrong on the back side"})    
  }
})



module.exports = router