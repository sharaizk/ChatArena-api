const mongoose =require('mongoose')

const requestSchema = new mongoose.Schema(
    {
        receiver:{
            type:String,
            required: true
        },
        senders:[
            
            {
                _id: false,
                senderInfo: {
                    type: Object, 
                    required: true,
                    _id: false
                }
            }
        ]
    }, {
        writeConcern: {
          w: 'majority',
          j: true,
          wtimeout: 1000
        }
    }
)

const Request = mongoose.model('REQUESTS', requestSchema)
module.exports = Request