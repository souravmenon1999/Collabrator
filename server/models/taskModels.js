// const mongoose = require('mongoose');

// // Mongoose Schema for Subtask
// const subTaskSchema = new mongoose.Schema({
//     TITLE: { type: String, required: true },
//     ISCOMPLETED: { type: Boolean, default: false }
// });

// // Mongoose Schema for Task Status
// const taskStatusSchema = new mongoose.Schema({
//     ISCOMPLETED: { type: Boolean, default: false },
//     CREATEDAT: { type: Date, default: Date.now },
//     UPDATEDAT: { type: Date, default: Date.now } // Will be updated on save
// });

// // Mongoose Schema for Task
// const taskSchema = new mongoose.Schema(
//     {
//         spaceId: {
//               type: mongoose.Schema.Types.ObjectId,
//               required: true,
//               ref: 'Space' // Reference to the Folder model
//             },
//         userId: { type: String, required: true }, // Or type: mongoose.Schema.Types.ObjectId, ref: 'User'
//         TITLE: { type: String, required: true },
//         DESCRIPTION: { type: String },
//         DUEDATE: { type: Date },
//         STATUS: {
//             type: taskStatusSchema,
//             default: {} // Initialize with default values
//         },
//         SUBTASKS: [subTaskSchema],
//         LINKEDSPACES: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Space' }], // Assuming you have a Space model
//         LINKEDCALENDAREVENTID: { type: String },
//         NEXTACTIONDETAILS: {
//             Activity: { type: String },
//             date: { type: Date },
//             time: { type: String } // Or Date, depending on how you want to store time
//         },
//         DEADLINE: { // Consider removing this redundant DEADLINE group and just using DUEDATE
//             date: { type: Date },
//             time: { type: String } // Or Date
//         },
//         ASSIGNEE: [{ // Modified ASSIGNEE array
//             userId: { // Renamed from just type to userId for clarity
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: 'User' // Reference to your User model
//             },
//             isRead: { type: Boolean, default: false }, // Added isRead status with default false
            
//         }],
//         TASKOWNER:{
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User'
//         }, // Or type: mongoose.Schema.Types.ObjectId, ref: 'User'
//         LOCATION: { type: String },
//         FLAG: { type: Boolean, default: false },
//         PRIORITY: { type: String },
//         LIST: { type: String }, // Consider renaming to Category/TaskList
//         IMAGE: { type: String } // Store URL or path to image
//     },
//     {
//         timestamps: true // Automatically adds createdAt and updatedAt fields
//     }
// );

// // Middleware to update STATUS.UPDATEDAT on every save
// taskSchema.pre('save', function(next) {
//     this.STATUS.UPDATEDAT = new Date();
//     next();
// });

// const TaskModel = mongoose.model('Task', taskSchema);

// module.exports = TaskModel;

const mongoose = require('mongoose');

// Mongoose Schema for Subtask
const subTaskSchema = new mongoose.Schema({
    TITLE: { type: String, required: true },
    ISCOMPLETED: { type: Boolean, default: false }
});

// Mongoose Schema for Task Status
const taskStatusSchema = new mongoose.Schema({
    ISCOMPLETED: { type: Boolean, default: false },
    CREATEDAT: { type: Date, default: Date.now },
    UPDATEDAT: { type: Date, default: Date.now } // Will be updated on save
});

// Mongoose Schema for Task
const taskSchema = new mongoose.Schema(
    {
        spaceId: { // Still keeping spaceId - could represent primary or initial space (to be clarified)
            type: mongoose.Schema.Types.ObjectId,
            required: true, // Keeping required for now as per request, but consider making optional if primary space concept is not needed
            ref: 'Space' // Reference to the Space model
        },
        userId: { type: String, required: true }, // userId of the task creator
        TITLE: { type: String, required: true },
        DESCRIPTION: { type: String },
        DUEDATE: { type: Date },
        STATUS: {
            type: taskStatusSchema,
            default: {}
        },
        SUBTASKS: [subTaskSchema],
        LINKEDSPACES: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Space' }], // Tasks linked to multiple Spaces - THIS IS KEY
        LINKEDCALENDAREVENTID: { type: String },
        NEXTACTIONDETAILS: {
            Activity: { type: String },
            date: { type: Date },
            time: { type: String }
        },
        DEADLINE: {
            date: { type: Date },
            time: { type: String }
        },
        ASSIGNEE: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            isRead: { type: Boolean, default: false },
        }],
        TASKOWNER: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        LOCATION: { type: String },
        FLAG: { type: Boolean, default: false },
        PRIORITY: { type: String },
        LIST: { type: String },
        IMAGE: { type: String }
    },
    {
        timestamps: true
    }
);

// Middleware to update STATUS.UPDATEDAT on every save
taskSchema.pre('save', function (next) {
    this.STATUS.UPDATEDAT = new Date();
    next();
});

const TaskModel = mongoose.model('Task', taskSchema);

module.exports = TaskModel;