// services/taskCheckService.js
const TaskModel = require('../models/taskModels');
const User = require('../models/userModel');
const emailService = require('./emailService'); // Email service
const pushNotificationService = require('./pushNotificationService'); // FCM push service
const sseController = require('../controllers/sseController'); // SSE controller

async function checkTasksDueTomorrow() {
    try {
        const now = new Date();
        const startOfTomorrow = new Date(now);
        startOfTomorrow.setHours(now.getHours() + 1, 0, 0, 0);
        const endOfTomorrow = new Date(startOfTomorrow);
        endOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

        const targetDueDate = new Date(now);
        targetDueDate.setDate(now.getDate() + 1);
        targetDueDate.setHours(now.getHours(), now.getMinutes(), 0, 0);

        console.log("Task Check Service: Checking for tasks due tomorrow - Start Time:", startOfTomorrow, " End Time:", endOfTomorrow);
        console.log("Task due date", targetDueDate);

        const tasksDueTomorrow = await TaskModel.find({
            DUEDATE: targetDueDate
        }).populate('ASSIGNEE.userId');

        console.log(`Task Check Service: Number of tasks due tomorrow: ${tasksDueTomorrow.length}`);

        if (tasksDueTomorrow.length > 0) {
            console.log("Task Check Service: Tasks found due tomorrow, processing notifications...");
            for (const task of tasksDueTomorrow) {
                for (const assignee of task.ASSIGNEE) {
                    const user = assignee.userId;
                    if (user) {
                        const notificationData = {
                            topic: "Task Reminder", // Consistent topic
                            userId: user._id,
                            taskTitle: task.TITLE,
                            taskDescription: task.DESCRIPTION,
                            dueDate: task.DUEDATE,
                            
                        };

                        // Check SSE connection and send notification
                        const sseSent = sseController.sendSseNotification(user.email, {
                            messageType: 'taskReminder', // Keep 'taskReminder' for SSE messages
                            ...notificationData
                        });

                        if (!sseSent) {
                            try {
                                // **[USE NEW FUNCTION: sendTaskReminderNotification for FCM]**
                                await pushNotificationService.sendTaskReminderNotification(notificationData); // Use reminder-specific FCM function
                                console.log(`Task Check Service: FCM push reminder notification sent to user ID: ${user._id} (for task: ${task.TITLE})`); // Differentiated log
                            } catch (pushError) {
                                console.error(`Task Check Service: Error sending FCM push reminder notification to user ID ${user._id}:`, pushError); // Differentiated log
                            }
                        } else {
                            console.log(`Task Check Service: SSE reminder notification sent to email: ${user.email} (for task: ${task.TITLE})`); // Differentiated log
                        }

                        try {
                            // **[USE NEW FUNCTION: sendTaskReminderEmail for email]**
                            await emailService.sendTaskReminderEmail(user.email, task.TITLE, task.DUEDATE, task.DESCRIPTION); // Use reminder-specific email function
                            console.log(`Task Check Service: Reminder email sent to: ${user.email} (for task: ${task.TITLE})`); // Differentiated log
                        } catch (emailError) {
                            console.error(`Task Check Service: Error sending reminder email to ${user.email}:`, emailError); // Differentiated log
                        }
                    } else {
                        console.warn(`Task Check Service: Assignee user ID ${assignee.userId} not found while processing task reminders.`);
                    }
                }
            }
        } else {
            console.log("Task Check Service: No tasks due tomorrow.");
        }

    } catch (error) {
        console.error("Task Check Service: Error during task due tomorrow check:", error);
    }
}

module.exports = {
    checkTasksDueTomorrow
};