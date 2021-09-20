const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");
const http = require("http");
const fileupload = require("express-fileupload");

require("dotenv").config();
const authRouter = require("./routes/router");
const convRouter = require("./routes/conversations");
const messRouter = require("./routes/messages");
const userRouter = require("./routes/users");

require("./db/conn");

const app = express();
const PORT = process.env.PORT;
app.use(
  fileupload({
    useTempFiles: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(cors());

app.use("/api/auth", authRouter);
app.use("/api/conversations", convRouter);
app.use("/api/messages", messRouter);
app.use("/api/user", userRouter);

const server = http.createServer(app)
const io = require('socket.io')(server,{
  cors:{
    origin:'http://localhost:3000'
  }
})

app.set('socketio', io)

let users=[]

const addUser = (userId, socketId) =>{
  !users.some(user=> user.userId === userId) && users.push({userId, socketId})
}

const offlineUser = (socketId) =>{
  users = users.filter(user=>user.socketId !== socketId)
}

const sendRequest = (userId) =>{
  const target = users.find(user=>user.userId === userId)
  if(target){
    io.to(target.socketId).emit('requestArrived',{message:'Hi'})
  }
}

const acceptRequest = (senderId, receiverId) =>{
  const sender = users.find(user=>user.userId === senderId)
  const receiver = users.find(user=>user.userId === receiverId)

  if(sender){
    io.to(sender.socketId).emit('requestAccepted')
  }
  if(receiver){
    io.to(receiver.socketId).emit('requestAccepted')
  }
  io.emit('getOnlineUser',users)

}


io.on('connection',(socket)=>{
  console.log('user connected')
 
  socket.on('onlineUser',(userId)=>{
      addUser(userId, socket.id)
      io.emit('getOnlineUser',users)
  })
  socket.on('disconnect',()=>{
      console.log('a user disconnected')
      offlineUser(socket.id)
      io.emit('getOnlineUser',users)
  })

  socket.on('logOut',()=>{
      offlineUser(socket.id)
  })
})

exports.sendReq=sendRequest
exports.accept=acceptRequest

server.listen(PORT, () => console.log("server up and running"));
