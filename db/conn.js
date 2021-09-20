const mongoose = require('mongoose')
const DB = process.env.DB

mongoose.connect(DB,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(()=>{
    console.log('Connection Established')
}).catch((e)=>{
    console.log(e)
})