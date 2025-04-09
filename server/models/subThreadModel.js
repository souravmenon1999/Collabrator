const mongoose = require('mongoose'); // Import mongoose
const { Schema } = mongoose;  
console.log("subthreadModel.js is being executed"); // ADD THIS LINE at the VERY TOP
      // Get Schema from mongoose

const messageSchema = new Schema({ // Now Schema is defined and will work
    PARENTMESSAGEID: {
        type: Schema.Types.ObjectId,
        ref: 'Message', // Self-reference for replies
        default: null // Not all messages are replies
    },
    USERID: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who sent the message
        required: true // Every message must have a sender (assuming)
    },
    CONTENT: {
        type: String,
        required: true // Message content is required
    },
    CREATEDAT: {
        type: Date,
        default: Date.now // Default to current timestamp on creation
    },
    REPLIES: [{
        type: Schema.Types.ObjectId,
        ref: 'Message', // Array of references to reply messages
        default: []
    }]
});

exports.Message = mongoose.model('Message', messageSchema);


// 2. Thread Schema (thread.model.js or subThreadModel.js)
const threadSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who sent the message
        required: true // Every message must have a sender (assuming)
    },
    spaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Space',
        required: true
    },
    TOPIC: {
        type: String,
        required: true
    },
    // ADDED FIELD: Parent Message ID (Optional, for linking to a potential initiating message in the thread)
    PARENTMESSAGEID: {
        type: Schema.Types.ObjectId,
        ref: 'Message', // Reference to a Message within this thread or possibly another thread
        default: null  // Not every thread needs to have a designated initiating message
    },
    messages: [{
        type: Schema.Types.ObjectId,
        ref: 'Message',
        default: []
    }],
    unread: [{
        type: Number, // You might want to reconsider this type, perhaps ref: 'Message' or something else?
        ref: 'Message', // Potentially incorrect ref here, might need to ref User or Message
        default: 2
    }],
    googleChatSpaceId: {type: String},
    CREATEDAT: {
        type: Date,
        default: Date.now
    },
    UPDATEDAT: {
        type: Date,
        default: Date.now
    },
    members: [{ // ADD THIS FIELD - Array of user references
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [] // Initialize with an empty array
    }]
});

exports.Thread = mongoose.model('Thread', threadSchema);