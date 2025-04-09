const mongoose = require('mongoose');


const spaceSchema = new mongoose.Schema({
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Folder' // Reference to the Folder model
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    
    subjects: [{ // Or however you want to store subjects
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread' // Example: Array of strings
    }],

    Owner: { // Array of space IDs or documents
        type: mongoose.Schema.Types.ObjectId, // Or String if you're storing it as a string
        ref: 'User' // Optional: Reference to your Space model if you have one
      },

      Members: [{ // Array of space IDs or documents
        type: mongoose.Schema.Types.ObjectId, // Or String if you're storing it as a string
        ref: 'User' // Optional: Reference to your Space model if you have one
      }],

    tasks: [{ // Or however you want to store subjects
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task' // Example: Array of strings
    }],
      createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  spaceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });
  
  const Space = mongoose.model('Space', spaceSchema);
  
  module.exports = Space;

