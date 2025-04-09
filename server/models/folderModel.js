const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({

  userID:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'users'
  }
 ,
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  spaces: [{ // Array of space IDs or documents
    type: mongoose.Schema.Types.ObjectId, // Or String if you're storing it as a string
    ref: 'Space' // Optional: Reference to your Space model if you have one
  }],
  // Add timestamps for creation and updates
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Important: Add a pre-save hook to update the updatedAt field
folderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});




  


const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;