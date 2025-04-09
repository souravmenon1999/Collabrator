// controllers/notificationController.js
const Task = require('../models/taskModels');
const User = require('../models/userModel'); // Assuming path to your User model

exports.markNotificationsAsRead = async (req, res) => {
    console.log('hit123');
    try {
        const taskIds = req.body.taskIds;
        const userEmail = req.body.userEmail; // **Get userEmail from request body**

        console.log(taskIds);
        console.log(userEmail);

        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ message: "Task IDs are required in the request body as an array." });
        }
        if (!userEmail) {
            return res.status(400).json({ message: "User email is required." }); // **User Email is now required**
        }

        // Retrieve userId from User model based on userEmail
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found for the provided email." });
        }
        const userId = user._id; // Get userId from the found User document


        // Find tasks and update isRead status for the logged-in user in ASSIGNEE array
        const updatePromises = taskIds.map(async (taskId) => {
            try {
                console.log(taskId, '1task ID ')
                const task = await Task.findById(taskId);
                if (!task) {
                    console.warn(`Task not found: ${taskId}`);
                    
                }

                // Find the assignee object for the current user and update isRead to true
                const assigneeToUpdate = task.ASSIGNEE.find(assignee => assignee.userId.toString() === userId.toString() /* **Use userId retrieved from email for comparison** */); // Ensure comparison with string

                if (assigneeToUpdate) {
                    console.log('dam')
                    console.log(assigneeToUpdate);
                    assigneeToUpdate.isRead = true;
                    await task.save();
                    console.log('edited for assignee to update')
                    console.log(taskId);
                    
                } else {
                    console.warn(`Assignee for user ${userEmail} (ID: ${userId}) not found in task: ${taskId}`); // Log with email and userId
                
                }
            } catch (error) {
                console.error(`Error updating task ${taskId}:`, error);
                
            }
        });

        const updatedTaskIds = (await Promise.all(updatePromises)).filter(taskId => taskId !== null);

        if (updatedTaskIds.length > 0) {
            console.log(`Successfully marked tasks as read: ${updatedTaskIds.join(', ')} for user: ${userEmail} (ID: ${userId})`); // Log with email and userId
            return res.status(200).json({ message: "Notifications marked as read successfully.", updatedTaskIds });
        } else {
            return res.status(404).json({ message: "No tasks found or no notifications updated for the provided IDs and user." });
        }


    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return res.status(500).json({ message: "Failed to mark notifications as read", error: error.message });
    }
};