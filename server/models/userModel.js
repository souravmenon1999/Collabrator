const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  folders: [{
    type: Schema.Types.ObjectId,
    ref: 'Folder'
  }],
  spaces: [{
    type: Schema.Types.ObjectId,
    ref: 'Space'
  }],
  tasks: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  threads: [{
    type: Schema.Types.ObjectId,
    ref: 'Thread'
  }],
  password: {
    type: String,
    required: true
  },
  googleAccessToken: { // ADD THIS FIELD
    type: String
  },
  googleRefreshToken: { // ADD THIS FIELD
    type: String
  },
  fcmDeviceToken: { // ADD THIS FIELD
    type: String
  }, // <-- **[SNIPPET 3A: ADD fcmDeviceToken Field]** Field to store FCM device token

});

const User = mongoose.model('User', userSchema);

module.exports = User;