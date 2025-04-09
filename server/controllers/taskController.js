const TaskModel = require('../models/taskModels');
const Space = require('../models/spaceModel');
const User = require('../models/userModel');
const emailService = require('../services/emailService');
const googleCalendarService = require('../services/googleCalendarService');
const mongoose = require('mongoose');
const pushNotificationService = require('../services/pushNotificationService'); // Make sure this is imported
const sseController = require('./sseController');


const handleGoogleCallback = async (req, res) => {
    console.log('Google callback initiated - DEBUG LOGS FOLLOW'); // *** DEBUG LOG START ***
    try {
        const { code, state } = req.query;
        if (!code || !state) {
            console.error("handleGoogleCallback: Error - Authorization code and state are missing."); // DEBUG
            return res.status(400).send('Authorization code and state are required.');
        }

        const { userId, taskId } = JSON.parse(state);

        if (!userId || !taskId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(taskId)) {
            console.error("handleGoogleCallback: Error - Invalid state parameters."); // DEBUG
            return res.status(400).send('Invalid state parameters.');
        }

        const tokens = await googleCalendarService.getTokens(code);

        await User.findByIdAndUpdate(userId, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
        });

        const updatedUser = await User.findById(userId); // Re-fetch user
        console.log("handleGoogleCallback: Updated user.googleAccessToken:", updatedUser.googleAccessToken); // DEBUG

        const task = await TaskModel.findById(taskId);
        const user = await User.findById(userId);

        if (!task || !user) {
            console.error("handleGoogleCallback: Error - Task or User not found."); // DEBUG
            return res.status(404).send('Task or User not found.');
        }

        console.log("handleGoogleCallback: task object from DB:", task); // DEBUG
        console.log("handleGoogleCallback: user object from DB:", user); // DEBUG
        console.log("handleGoogleCallback: task.DUEDATE from DB:", task.DUEDATE); // DEBUG
        user.taskTitle = task.TITLE;
        user.taskDescription = task.DESCRIPTION;
        user.taskDueDate = task.DUEDATE;
        console.log("handleGoogleCallback: user.taskDueDate after assignment:", user.taskDueDate); // DEBUG


        await googleCalendarService.addTaskToCalendar(user);
        console.log(`Google Calendar event created after callback for user: ${user.email}`);

        res.send('Google Calendar event created successfully!');

    } catch (error) {
        console.error('handleGoogleCallback: Error handling Google callback - ERROR:', error); // DEBUG
        res.status(500).send('Error handling Google callback.');
    }
    console.log('Google callback finished - DEBUG LOGS END'); // *** DEBUG LOG END ***
};

const createTask = async (req, res) => {
    console.log('Task creation initiated - DEBUG LOGS FOLLOW'); // *** DEBUG LOG START ***
    try {
        const {
            spaceId, // Still expecting spaceId - clarify its role if needed
            userId, // Task creator's userId - still expecting userId
            TITLE,
            DESCRIPTION,
            DUEDATE,
            NEXTACTIONDETAILS,
            ASSIGNEE: assigneeUserIdsFromBody, // Expecting array of User IDs now, renamed from ASSIGNEE
            LOCATION,
            FLAG,
            PRIORITY,
            LIST,
            IMAGE,
            LINKEDSPACES // Expecting array of Space IDs - NEW, expecting LINKEDSPACES
        } = req.body;

        let parsedDueDate = null;
        let dueDateString = null;

        const taskOwnerEmail = req.query.email; // Get email from query parameter - still using email for task owner
        console.log("createTask: taskOwnerEmail from query:", taskOwnerEmail); // DEBUG
        console.log("createTask: req.body.DUEDATE (dueDateString):", dueDateString); // DEBUG
        
        console.log(assigneeUserIdsFromBody);

        if (!taskOwnerEmail) {
            console.error("createTask: Error - Task owner email is required in query parameters.");
            return res.status(400).json({ message: "Task owner email is required in query parameters." });
        }

        const taskOwnerUser = await User.findOne({ email: taskOwnerEmail });
        console.log("createTask: Task Owner User:", taskOwnerUser); // DEBUG
        const TASKOWNER = taskOwnerUser._id; // Set TASKOWNER to the user ID

        if (!taskOwnerUser) {
            console.error(`createTask: Error - Task owner user not found with email: ${taskOwnerEmail}`);
            return res.status(404).json({ message: "Task owner not found with provided email." });
        }

        // --- Input Validation ---
        if (!TITLE) {
            console.error("createTask: Error - Task title is required.");
            return res.status(400).json({ message: "Task title is required." });
        }
        if (!spaceId || !mongoose.Types.ObjectId.isValid(spaceId)) { // Still validating spaceId for now
            console.error("createTask: Error - Invalid spaceId.");
            return res.status(400).json({ message: "Invalid spaceId." });
        }
        if (!LINKEDSPACES || !Array.isArray(LINKEDSPACES) || LINKEDSPACES.length === 0) { // Validate LINKEDSPACES
            console.error("createTask: Error - Linked Spaces are required and must be an array with at least one space.");
            return res.status(400).json({ message: "Linked Spaces are required and must be an array with at least one space." });
        }

        // --- Parse Due Date ---
        if (DUEDATE && typeof DUEDATE === 'object' && DUEDATE.date && DUEDATE.time) {
            dueDateString = `${DUEDATE.date}T${DUEDATE.time}:00`; // Construct ISO format string
        } else if (typeof DUEDATE === 'string') {
            dueDateString = DUEDATE; // Assume it's already a date string (for other cases maybe)
        }

        if (dueDateString) {
            parsedDueDate = new Date(dueDateString);
            console.log("createTask: parsedDueDate after new Date():", parsedDueDate);
            if (isNaN(parsedDueDate.getTime())) {
                console.warn("createTask: Warning - Invalid DUEDATE format received:", dueDateString);
                parsedDueDate = null;
            }
        }

        // --- Prepare Assignees ---
        const assigneeList = [];
        const assigneeEmails = []; // To collect emails for notifications

        if (assigneeUserIdsFromBody && Array.isArray(assigneeUserIdsFromBody)) { // Expecting User IDs now
            for (const userId of assigneeUserIdsFromBody) {
console.log(userId.userId)
                if (mongoose.Types.ObjectId.isValid(userId.userId)) { // Validate each userId
                    const user = await User.findById(userId.userId);
                    console.log(user.email)
                    if (user) {
                        assigneeList.push({ userId: user._id }); // Push assignee object with userId
                        assigneeEmails.push(user.email); // Collect email for notifications
                    } else {
                        console.warn(`createTask: Warning - Assignee User with ID ${userId} not found.`);
                        // Consider how to handle not found assignees - skip or error? For now, skip.
                    }
                } else {
                    console.warn(`createTask: Warning - Invalid assignee userId format: ${userId}`);
                    // Handle invalid userId format, skip for now.
                }
            }
        }


        // --- Create New Task ---
        const newTask = new TaskModel({
            userId, // Task creator
            spaceId, // Still setting spaceId - clarify if still needed
            TITLE,
            DESCRIPTION,
            DUEDATE: parsedDueDate,
            NEXTACTIONDETAILS,
            ASSIGNEE: assigneeList, // Use assigneeList created with userIds
            LOCATION,
            FLAG,
            PRIORITY,
            LIST,
            IMAGE,
            LINKEDSPACES: LINKEDSPACES || [], // Set LINKEDSPACES from request body
            TASKOWNER,
        });

        const savedTask = await newTask.save();
        console.log("createTask: savedTask object:", savedTask); // DEBUG


        // --- Update Linked Spaces ---
        if (LINKEDSPACES && LINKEDSPACES.length > 0) {
            for (const linkedSpaceId of LINKEDSPACES) {
                if (mongoose.Types.ObjectId.isValid(linkedSpaceId)) {
                    const space = await Space.findById(linkedSpaceId);
                    if (space) {
                        space.tasks.push(savedTask._id);
                        await space.save();
                    } else {
                        console.warn(`createTask: Warning - Linked Space with ID ${linkedSpaceId} not found.`);
                        // Handle not found linked space - skip or error? For now, skip and log.
                    }
                } else {
                    console.warn(`createTask: Warning - Invalid linkedSpaceId format: ${linkedSpaceId}`);
                    // Handle invalid linkedSpaceId format, skip for now.
                }
            }
        }


        // --- Update Assignee Users and Send Notifications ---
        for (let i = 0; i < assigneeList.length; i++) { // Iterate through assigneeList (which contains userIds)
            const assigneeUserId = assigneeList[i].userId; // Get userId from assignee object
            const assigneeEmail = assigneeEmails[i]; // Get corresponding email for notifications (if available)
            const user = await User.findById(assigneeUserId);

            console.log('createTask: Iterating through assignee', assigneeEmail, assigneeUserId); // DEBUG

            if (user) {
                user.tasks.push(savedTask._id);
                await user.save();

                const notificationDataForUser = {
                    taskId: savedTask._id,
                    taskOwner: taskOwnerEmail,
                    spaceId, // Still sending primary spaceId - check if LINKEDSPACES should be used instead for notifications
                    userEmail: assigneeEmail,
                    title: TITLE,
                    taskDescription: DESCRIPTION,
                    assignedby: taskOwnerUser.name,
                    dueDate: parsedDueDate ? parsedDueDate.toLocaleDateString() : 'No Due Date',
                };


                // SSE Notification
                const sseSent = sseController.sendSseNotification(assigneeEmail, {
                    messageType: 'taskAssigned',
                    ...notificationDataForUser
                });

                if (!sseSent) {
                    console.log('createTask: Looking to send via FCM for', assigneeEmail);
                    try {
                        await pushNotificationService.sendTaskNotification({
                            topic: "Task Assigned",
                            userId: assigneeUserId, // FCM push still needs userId
                            taskTitle: TITLE,
                            taskDescription: DESCRIPTION,
                            dueDate: parsedDueDate,
                        });
                        console.log(`createTask: Push notification sent to user ID: ${assigneeUserId} (SSE not active)`);
                    } catch (pushError) {
                        console.error(`createTask: Error sending push notification to user ID ${assigneeUserId}:`, pushError);
                    }
                } else {
                    console.log(`createTask: SSE notification sent to email: ${assigneeEmail}`);
                }


                // Email Notification
                try {
                    await emailService.sendTaskAssignmentEmail(user.email, {
                        messageType: 'taskAssigned',
                        ...notificationDataForUser
                    });
                    console.log(`createTask: Email notification sent to: ${user.email}`);
                } catch (emailError) {
                    console.error(`createTask: Error sending email to ${user.email}:`, emailError);
                }


                // Google Calendar Integration - Keeping as is for now - still using user.googleAccessToken
                if (user.googleAccessToken) {
                    try {
                        await googleCalendarService.addTaskToCalendar(user, { // Pass task details
                            TITLE: TITLE,
                            DESCRIPTION: DESCRIPTION,
                            DUEDATE: parsedDueDate,
                        });
                        console.log(`createTask: Google Calendar event created for: ${user.email}`);
                    } catch (calendarError) {
                        console.error(`createTask: Error adding event to Google Calendar for ${user.email}:`, calendarError);
                    }
                } else {
                    const authUrl = googleCalendarService.getAuthUrl(assigneeUserId, savedTask._id);
                    return res.status(200).json({ authUrl, message: "Google Calendar authorization required for assignee." });
                }


            } else {
                console.warn(`createTask: Warning - Assignee User with ID ${assigneeUserId} not found during update: ${assigneeUserId}`);
            }
        }


        // Transform and Send Response
        const transformedTask = savedTask.toObject();
        transformedTask.id = transformedTask._id.toString();
        delete transformedTask._id;

        res.status(201).json(transformedTask);

    } catch (error) {
        console.error("createTask: Error creating task - ERROR:", error);
        res.status(500).json({ message: "Failed to create task", error: error.message });
    } finally {
        console.log('Task creation finished - DEBUG LOGS END'); // *** DEBUG LOG END ***
    }
};


const updateTask = async (req, res) => {
    console.log('Task update initiated - DEBUG LOGS FOLLOW'); // *** DEBUG LOG START ***
    try {
        const taskId = req.params.taskId;
        const {
            spaceId, // Still expecting spaceId - clarify its role if needed
            userId, // Task updater's userId (could be different from creator)
            TITLE,
            DESCRIPTION,
            DUEDATE, // Expecting DUEDATE object {date, time}
            NEXTACTIONDETAILS,
            ASSIGNEE: assigneeUserIdsFromBody, // Expecting array of User IDs
            LOCATION,
            FLAG,
            PRIORITY,
            LIST,
            IMAGE,
            LINKEDSPACES // Expecting array of Space IDs
        } = req.body;

        let parsedDueDate = null;
        let dueDateString = null;

        const taskOwnerEmail = req.query.email; // Get email from query parameter - still using email for task owner
        console.log("updateTask: taskOwnerEmail from query:", taskOwnerEmail); // DEBUG

        if (!taskOwnerEmail) {
            console.error("updateTask: Error - Task owner email is required in query parameters.");
            return res.status(400).json({ message: "Task owner email is required in query parameters." });
        }

        const taskOwnerUser = await User.findOne({ email: taskOwnerEmail });
        if (!taskOwnerUser) {
            console.error(`updateTask: Error - Task owner user not found with email: ${taskOwnerEmail}`);
            return res.status(404).json({ message: "Task owner not found with provided email." });
        }
        const TASKOWNER = taskOwnerUser._id;


        // --- Input Validation ---
        if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
            console.error("updateTask: Error - Invalid taskId.");
            return res.status(400).json({ message: "Invalid taskId." });
        }
        if (!TITLE) {
            console.error("updateTask: Error - Task title is required.");
            return res.status(400).json({ message: "Task title is required." });
        }
        if (!spaceId || !mongoose.Types.ObjectId.isValid(spaceId)) {
            console.error("updateTask: Error - Invalid spaceId.");
            return res.status(400).json({ message: "Invalid spaceId." });
        }
        if (!LINKEDSPACES || !Array.isArray(LINKEDSPACES) || LINKEDSPACES.length === 0) {
            console.error("updateTask: Error - Linked Spaces are required and must be an array with at least one space.");
            return res.status(400).json({ message: "Linked Spaces are required and must be an array with at least one space." });
        }

        // --- Parse Due Date (Consistent with createTask) ---
        if (DUEDATE && typeof DUEDATE === 'object' && DUEDATE.date && DUEDATE.time) {
            dueDateString = `${DUEDATE.date}T${DUEDATE.time}:00`; // Construct ISO format string
        } else if (typeof DUEDATE === 'string') {
            dueDateString = DUEDATE; // Assume it's already a date string (for other cases maybe)
        }

        if (dueDateString) {
            parsedDueDate = new Date(dueDateString);
            console.log("updateTask: parsedDueDate after new Date():", parsedDueDate);
            if (isNaN(parsedDueDate.getTime())) {
                console.warn("updateTask: Warning - Invalid DUEDATE format received:", dueDateString);
                parsedDueDate = null;
            }
        }

        // --- Fetch Existing Task ---
        const existingTask = await TaskModel.findById(taskId).populate('ASSIGNEE.userId LINKEDSPACES TASKOWNER'); // Populate for comparison
        if (!existingTask) {
            console.error(`updateTask: Error - Task not found with ID: ${taskId}`);
            return res.status(404).json({ message: "Task not found." });
        }

        const oldLinkedSpaceIds = existingTask.LINKEDSPACES.map(space => space._id.toString());
        const newLinkedSpaceIds = LINKEDSPACES || [];
        const spacesToAdd = newLinkedSpaceIds.filter(id => !oldLinkedSpaceIds.includes(id));
        const spacesToRemove = oldLinkedSpaceIds.filter(id => !newLinkedSpaceIds.includes(id));


        const oldAssigneeUserIds = existingTask.ASSIGNEE.map(assignee => assignee.userId._id.toString());
        const newAssigneeUserIds = assigneeUserIdsFromBody && Array.isArray(assigneeUserIdsFromBody) ? assigneeUserIdsFromBody.map(item => item.userId) : [];
        const assigneesToAdd = newAssigneeUserIds.filter(id => !oldAssigneeUserIds.includes(id));
        const assigneesToRemove = oldAssigneeUserIds.filter(id => !newAssigneeUserIds.includes(id));
        const currentAssigneeUserIds = newAssigneeUserIds; // Current assignees are those in the updated request


        // --- Prepare Assignees for Update ---
        const updatedAssigneeList = [];
        const assigneeEmailsForAddNotifications = []; // Emails for "task assigned" notifications to new assignees
        const assigneeEmailsForUpdateNotifications = []; // Emails for "task updated" notifications to current assignees

        if (newAssigneeUserIds && Array.isArray(newAssigneeUserIds)) {
            for (const userId of newAssigneeUserIds) {
                if (mongoose.Types.ObjectId.isValid(userId)) {
                    const user = await User.findById(userId);
                    if (user) {
                        updatedAssigneeList.push({ userId: user._id }); // Push assignee object
                        if (assigneesToAdd.includes(userId)) {
                            assigneeEmailsForAddNotifications.push(user.email); // Collect emails for "task assigned"
                        }
                        assigneeEmailsForUpdateNotifications.push(user.email); // Collect emails for "task updated" for current assignees
                    } else {
                        console.warn(`updateTask: Warning - Assignee User with ID ${userId} not found.`);
                    }
                } else {
                    console.warn(`updateTask: Warning - Invalid assignee userId format: ${userId}`);
                }
            }
        }


        // --- Update Task Document ---
        existingTask.spaceId = spaceId; // Update spaceId if needed
        existingTask.userId = userId; // Update updater userId
        existingTask.TITLE = TITLE;
        existingTask.DESCRIPTION = DESCRIPTION;
        existingTask.DUEDATE = parsedDueDate;
        existingTask.NEXTACTIONDETAILS = NEXTACTIONDETAILS;
        existingTask.ASSIGNEE = updatedAssigneeList; // Set updated assignee list
        existingTask.LOCATION = LOCATION;
        existingTask.FLAG = FLAG;
        existingTask.PRIORITY = PRIORITY;
        existingTask.LIST = LIST;
        existingTask.IMAGE = IMAGE;
        existingTask.LINKEDSPACES = LINKEDSPACES || []; // Update linked spaces
        existingTask.TASKOWNER = TASKOWNER;

        const updatedTask = await existingTask.save();
        console.log("updateTask: updatedTask object:", updatedTask); // DEBUG


        // --- Update Linked Spaces ---
        for (const linkedSpaceId of spacesToAdd) {
            const space = await Space.findById(linkedSpaceId);
            if (space) {
                space.tasks.push(taskId);
                await space.save();
            }
        }
        for (const linkedSpaceId of spacesToRemove) {
            const space = await Space.findById(linkedSpaceId);
            if (space) {
                space.tasks.pull(taskId); // Use pull to remove task ID from array
                await space.save();
            }
        }


        // --- Update Assignee Users and Send Notifications ---

        // Remove task from removed assignees' task list
        for (const assigneeIdToRemove of assigneesToRemove) {
            const user = await User.findById(assigneeIdToRemove);
            if (user) {
                user.tasks.pull(taskId);
                await user.save();
                console.log(`updateTask: Task removed from user ${user.email} tasks list.`);
                // Optionally send "task unassigned" notification here
            }
        }


        // Add task to newly added assignees' task list and send "task assigned" notifications
        for (let i = 0; i < assigneesToAdd.length; i++) {
            const assigneeUserId = assigneesToAdd[i];
            const assigneeEmail = assigneeEmailsForAddNotifications[i];
            const user = await User.findById(assigneeUserId);

            if (user) {
                user.tasks.push(taskId);
                await user.save();

                const notificationDataForNewAssignee = {
                    taskId: updatedTask._id,
                    taskOwner: taskOwnerEmail,
                    spaceId, // Still sending primary spaceId - check if LINKEDSPACES should be used instead for notifications
                    userEmail: assigneeEmail,
                    title: TITLE,
                    taskDescription: DESCRIPTION,
                    assignedby: taskOwnerUser.name,
                    dueDate: parsedDueDate ? parsedDueDate.toLocaleDateString() : 'No Due Date',
                };

                // Send "Task Assigned" notifications to newly added assignees (same as in createTask)
                // SSE Notification (for new assignees)
                const sseSent = sseController.sendSseNotification(assigneeEmail, {
                    messageType: 'taskAssigned', // Use 'taskAssigned' for new assignees
                    ...notificationDataForNewAssignee
                });
                if (!sseSent) {
                    try {
                        await pushNotificationService.sendTaskNotification({
                            topic: "Task Assigned", // Topic for new assignment
                            userId: assigneeUserId,
                            taskTitle: TITLE,
                            taskDescription: DESCRIPTION,
                            dueDate: parsedDueDate,
                        });
                        console.log(`updateTask: Push notification (Task Assigned) sent to user ID: ${assigneeUserId} (SSE not active)`);
                    } catch (pushError) {
                        console.error(`updateTask: Error sending push notification (Task Assigned) to user ID ${assigneeUserId}:`, pushError);
                    }
                } else {
                    console.log(`updateTask: SSE notification (Task Assigned) sent to email: ${assigneeEmail}`);
                }
                // Email Notification (for new assignees)
                try {
                    await emailService.sendTaskAssignmentEmail(user.email, {
                        messageType: 'taskAssigned', // Use 'taskAssigned' email template for new assignees
                        ...notificationDataForNewAssignee
                    });
                    console.log(`updateTask: Email notification (Task Assigned) sent to: ${user.email}`);
                } catch (emailError) {
                    console.error(`updateTask: Error sending email (Task Assigned) to ${user.email}:`, emailError);
                }
                // Google Calendar Integration (for new assignees)
                if (user.googleAccessToken) {
                    try {
                        await googleCalendarService.addTaskToCalendar(user);
                        console.log(`updateTask: Google Calendar event created for (new assignee): ${user.email}`);
                    } catch (calendarError) {
                        console.error(`updateTask: Error adding event to Google Calendar for (new assignee) ${user.email}:`, calendarError);
                    }
                } else {
                    const authUrl = googleCalendarService.getAuthUrl(assigneeUserId, updatedTask._id); // Use updatedTask._id as taskId
                    return res.status(200).json({ authUrl, message: "Google Calendar authorization required for new assignee." });
                }

            }
        }


        // Send "Task Updated" notifications to all current assignees (including those who were already assignees)
        for (let i = 0; i < currentAssigneeUserIds.length; i++) { // Iterate through ALL current assignee IDs from request
            const assigneeUserId = currentAssigneeUserIds[i];
            const user = await User.findById(assigneeUserId);
            if (user) {
                const notificationDataForUpdate = {
                    taskId: updatedTask._id,
                    taskOwner: taskOwnerEmail,
                    spaceId, // Still sending primary spaceId - check if LINKEDSPACES should be used instead for notifications
                    userEmail: user.email,
                    title: TITLE,
                    taskDescription: DESCRIPTION,
                    assignedby: taskOwnerUser.name,
                    dueDate: parsedDueDate ? parsedDueDate.toLocaleDateString() : 'No Due Date',
                    updateMessage: "Task details have been updated." // Indicate task update in notification
                };

                // SSE Notification (for task update)
                const sseSentUpdate = sseController.sendSseNotification(user.email, {
                    messageType: 'taskUpdated', // New messageType 'taskUpdated'
                    ...notificationDataForUpdate
                });
                if (!sseSentUpdate) {
                    try {
                        await pushNotificationService.sendTaskNotification({
                            topic: "Task Updated", // New topic for update
                            userId: assigneeUserId,
                            taskTitle: TITLE,
                            taskDescription: DESCRIPTION,
                            dueDate: parsedDueDate,
                            updateMessage: "Task details have been updated."
                        });
                        console.log(`updateTask: Push notification (Task Updated) sent to user ID: ${assigneeUserId} (SSE not active)`);
                    } catch (pushError) {
                        console.error(`updateTask: Error sending push notification (Task Updated) to user ID ${assigneeUserId}:`, pushError);
                    }
                } else {
                    console.log(`updateTask: SSE notification (Task Updated) sent to email: ${user.email}`);
                }

                // Email Notification (for task update)
                try {
                    await emailService.sendTaskUpdateEmail(user.email, { // New email service function for task update
                        messageType: 'taskUpdated', // Use 'taskUpdated' email template
                        ...notificationDataForUpdate
                    });
                    console.log(`updateTask: Email notification (Task Updated) sent to: ${user.email}`);
                } catch (emailError) {
                    console.error(`updateTask: Error sending email (Task Updated) to ${user.email}:`, emailError);
                }

            }
        }


        // Transform and Send Response
        const transformedTask = updatedTask.toObject();
        transformedTask.id = transformedTask._id.toString();
        delete transformedTask._id;

        res.status(200).json(transformedTask); // Send 200 for successful UPDATE

    } catch (error) {
        console.error("updateTask: Error updating task - ERROR:", error);
        res.status(500).json({ message: "Failed to update task", error: error.message });
    } finally {
        console.log('Task update finished - DEBUG LOGS END'); // *** DEBUG LOG END ***
    }
};

const deleteTask = async (req, res) => {
    console.log('Task deletion initiated - DEBUG LOGS FOLLOW'); // *** DEBUG LOG START ***
    try {
        const taskId = req.params.taskId;

        if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
            console.error("deleteTask: Error - Invalid taskId.");
            return res.status(400).json({ message: "Invalid taskId." });
        }

        const task = await TaskModel.findById(taskId).populate('LINKEDSPACES ASSIGNEE.userId'); // Populate linked spaces and assignees

        if (!task) {
            console.error(`deleteTask: Error - Task not found with ID: ${taskId}`);
            return res.status(404).json({ message: "Task not found." });
        }

        // --- Remove task from linked spaces' tasks array ---
        if (task.LINKEDSPACES && task.LINKEDSPACES.length > 0) {
            for (const space of task.LINKEDSPACES) {
                if (space && space.tasks) { // Check if space and space.tasks are valid
                    space.tasks.pull(taskId);
                    await space.save();
                    console.log(`deleteTask: Task removed from space: ${space.name} (ID: ${space._id})`);
                } else {
                    console.warn(`deleteTask: Warning - Invalid space or tasks array found for space ID: ${space?._id}`);
                }
            }
        }

        // --- Remove task from assignees' tasks array ---
        if (task.ASSIGNEE && task.ASSIGNEE.length > 0) {
            for (const assigneeObj of task.ASSIGNEE) {
                const assignee = assigneeObj.userId; // Access populated userId
                if (assignee && assignee.tasks) { // Check if assignee and assignee.tasks are valid
                    assignee.tasks.pull(taskId);
                    await assignee.save();
                    console.log(`deleteTask: Task removed from assignee: ${assignee.name} (ID: ${assignee._id})`);
                } else {
                    console.warn(`deleteTask: Warning - Invalid assignee or tasks array found for assignee ID: ${assignee?._id}`);
                }
            }
        }

        // --- Delete the Task Document ---
        await TaskModel.findByIdAndDelete(taskId);
        console.log(`deleteTask: Task successfully deleted. Task ID: ${taskId}`);

        res.status(200).json({ message: "Task deleted successfully", taskId: taskId }); // Send back taskId for frontend update

    } catch (error) {
        console.error("deleteTask: Error deleting task - ERROR:", error);
        res.status(500).json({ message: "Failed to delete task", error: error.message });
    } finally {
        console.log('Task deletion finished - DEBUG LOGS END'); // *** DEBUG LOG END ***
    }
};

// const createTask = async (req, res) => {
//     console.log('Task creation initiated - DEBUG LOGS FOLLOW'); // *** DEBUG LOG START ***
//     try {
//         const {
//             spaceId,
//             userId, // Task creator's userId
//             TITLE,
//             DESCRIPTION,
//             DUEDATE: dueDateString, // Renamed
//             NEXTACTIONDETAILS,
//             ASSIGNEE, // Expect an array of email addresses
//             LOCATION,
//             FLAG,
//             PRIORITY,
//             LIST,
//             IMAGE
//         } = req.body;

//         const taskOwnerEmail = req.query.email; // Get email from query parameter
//         console.log("createTask: taskOwnerEmail from query:", taskOwnerEmail); // DEBUG


//         console.log("createTask: req.body.DUEDATE (dueDateString):", dueDateString); // DEBUG


//         if (!taskOwnerEmail) {
//             console.error("createTask: Error - Task owner email is required in query parameters."); // DEBUG
//             return res.status(400).json({ message: "Task owner email is required in query parameters." });
//         }

//         const taskOwnerUser = await User.findOne({ email: taskOwnerEmail });
//         console.log(taskOwnerUser)
//         const TASKOWNER = taskOwnerUser._id; // Set TASKOWNER to the user ID


//         if (!taskOwnerUser) {
//             console.error(`createTask: Error - Task owner user not found with email: ${taskOwnerEmail}`); // DEBUG
//             return res.status(404).json({ message: "Task owner not found with provided email." });
//         }

//         // Validation
//         if (!TITLE) {
//             console.error("createTask: Error - Task title is required."); // DEBUG
//             return res.status(400).json({ message: "Task title is required." });
//         }
//         if (!spaceId || !mongoose.Types.ObjectId.isValid(spaceId)) {
//             console.error("createTask: Error - Invalid spaceId."); // DEBUG
//             return res.status(400).json({ message: "Invalid spaceId." });
//         }

//         // Find user IDs based on email addresses
//         const assigneeUserIds = [];
//         const assigneeEmails = []; // Collect assignee emails for SSE notifications
//         const assigneeList = [];

//         if (ASSIGNEE && ASSIGNEE.length > 0) {
//             for (const email of ASSIGNEE) {
//                 const user = await User.findOne({ email });
//                 if (user) {
//                     assigneeUserIds.push(user._id);
//                     assigneeEmails.push(email); // Store email for SSE
//                     assigneeList.push({ userId: user._id })

//                 } else {
//                     console.log(`User with email ${email} not found: ${email}`);
//                     // Consider more robust error handling if needed, e.g., return an error to client
//                 }
//             }
//         }

//         let parsedDueDate = null; // Initialize parsedDueDate
//         if (dueDateString) {
//             parsedDueDate = new Date(dueDateString); // Attempt to parse
//             console.log("createTask: parsedDueDate after new Date():", parsedDueDate); // DEBUG
//             if (isNaN(parsedDueDate.getTime())) { // Check for invalid Date
//                 console.warn("createTask: Warning - Invalid DUEDATE format received:", dueDateString); // DEBUG
//                 parsedDueDate = null; // Set to null if parsing fails, or handle error as needed
//                 // Consider returning an error to the client if DUEDATE is mandatory and invalid.
//                 // return res.status(400).json({ message: "Invalid DUEDATE format." });
//             }
//         }


//         const newTask = new TaskModel({
//             userId, // Task creator
//             spaceId,
//             TITLE,
//             DESCRIPTION,
//             DUEDATE: parsedDueDate, // Use parsedDueDate here
//             NEXTACTIONDETAILS,
//             ASSIGNEE: assigneeList,
//             LOCATION,
//             FLAG,
//             PRIORITY,
//             LIST,
//             IMAGE,
//             LINKEDSPACES: [],
//             TASKOWNER,
//         });

//         const savedTask = await newTask.save();
//         console.log("createTask: savedTask object:", savedTask); // DEBUG


//         // Update Space's tasks array
//         const space = await Space.findById(spaceId);
//         if (!space) {
//             console.error("createTask: Error - Space not found."); // DEBUG
//             return res.status(404).json({ message: "Space not found." });
//         }
//         space.tasks.push(savedTask._id);
//         await space.save();

//         // Update User's tasks array and send notifications
//         for (let i = 0; i < assigneeUserIds.length; i++) {

//             const assigneeUserId = assigneeUserIds[i];
//             const assigneeEmail = assigneeEmails[i]; 
//             const user = await User.findById(assigneeUserId);

//             console.log('iterating through ',assigneeEmail)

//             if (user) {
//                 user.tasks.push(savedTask._id);
//                 await user.save();

//                   // Prepare user object with task details for services
//                   const notificationDataForUser = {
//                     taskId: savedTask._id,
//                     taskOwner: taskOwnerEmail,
//                     spaceId, // Create notification data object
//                     userEmail: assigneeEmail, // Use email for notification data
//                     title: TITLE,
//                     taskDescription: DESCRIPTION,
//                     assignedby: taskOwnerUser.name,
//                     dueDate: parsedDueDate ? parsedDueDate.toLocaleDateString() : 'No Due Date', // Format date for notification
//                 };

//                 // Prepare user object with task details for services
//                 user.taskTitle = TITLE;
//                 user.taskDescription = DESCRIPTION;
//                 user.taskDueDate = parsedDueDate; // Use parsedDueDate here - consistent with saved task

//                 const sseSent = sseController.sendSseNotification(assigneeEmail, { // <-- Call sendSseNotification with email
//                     messageType: 'taskAssigned', // Type to identify on client
//                     ...notificationDataForUser // Include task details
//                 });
                
//                 if (!sseSent) { // If SSE not sent (user offline or error), fallback to FCM
//                    console.log('looking to send via FCM for', assigneeEmail)
//                     try {
//                         await pushNotificationService.sendTaskNotification({
//                             topic: "Task Assigned", // Fallback to FCM - still use userId for FCM
//                             userId: assigneeUserId, // FCM push still needs userId
//                             taskTitle: TITLE,
//                             taskDescription: DESCRIPTION,
//                             dueDate: parsedDueDate,
//                         });
//                         console.log(`Push notification sent to user ID: ${assigneeUserId} (SSE not active)`);
//                     } catch (pushError) {
//                         console.error(`Error sending push notification to user ID ${assigneeUserId}:`, pushError);
//                         // Handle push notification errors
//                     }
//                 } else {
//                     console.log(`SSE notification sent to email: ${assigneeEmail}`);
//                 }

//                 // Send email notification
//                 try {
//                     await emailService.sendTaskAssignmentEmail(user.email, { // <-- Call sendSseNotification with email
//                         messageType: 'taskAssigned', // Type to identify on client
//                         ...notificationDataForUser // Include task details
//                     }); // Use parsedDueDate
//                     console.log(`Email notification sent to: ${user.email}`);
//                 } catch (emailError) {
//                     console.error(`Error sending email to ${user.email}:`, emailError);
//                 }

//                 // Google Calendar integration
//                 if (user.googleAccessToken) {
//                     try {
//                         await googleCalendarService.addTaskToCalendar(user);
//                         console.log(`Google Calendar event created for: ${user.email}`);
//                     } catch (calendarError) {
//                         console.error(`Error adding event to Google Calendar for ${user.email}:`, calendarError);
//                     }
//                 } else {
//                     const authUrl = googleCalendarService.getAuthUrl(assigneeUserId, savedTask._id);
//                     return res.status(200).json({ authUrl, message: "Google Calendar authorization required for assignee." });
//                 }

             

//             } else {
//                 console.warn(`Assignee User with ID ${assigneeUserId} not found during update: ${assigneeUserId}`);
//             }
//         }

//         // Transform the response
//         const transformedTask = savedTask.toObject();
//         transformedTask.id = transformedTask._id.toString();
//         delete transformedTask._id;

//         res.status(201).json(transformedTask);

//     } catch (error) {
//         console.error("createTask: Error creating task - ERROR:", error); // DEBUG
//         res.status(500).json({ message: "Failed to create task", error: error.message });
//     }
//     console.log('Task creation finished - DEBUG LOGS END'); // *** DEBUG LOG END ***
// };



const getUsersFromSpaces = async (req, res) => {
    try {
        const spaceIds = req.body.spaceIds; // Get spaceIds from request body (array)

        if (!Array.isArray(spaceIds)) {
            return res.status(400).json({ message: "spaceIds must be an array in the request body" });
        }

        if (spaceIds.length === 0) {
            return res.status(200).json([]); // Return empty array if no spaceIds provided
        }

        let allUsers = [];
        for (const spaceId of spaceIds) {
            const usersInSpace = await User.find({
                'spaces': { $in: [spaceId] } // Find users who are members of THIS space
            });
            allUsers = allUsers.concat(usersInSpace); // Collect users from all spaces
        }

        // Ensure unique users using a Set
        const uniqueUsersSet = new Set();
        const uniqueUserOptions = [];

        for (const user of allUsers) {
            if (!uniqueUsersSet.has(user._id.toString())) { // Check if user ID is already in the Set
                uniqueUsersSet.add(user._id.toString()); // Add user ID to the Set
                uniqueUserOptions.push({ // Add user option to the array
                    value: user._id.toString(),
                    label: user.name, // Or user.username, adjust based on your User model
                    email: user.email, // Or user.email, if available
                });
            }
        }


        res.status(200).json(uniqueUserOptions);
    } catch (error) {
        console.error("Error fetching users from spaces:", error);
        res.status(500).json({ message: "Error fetching users from spaces", error: error });
    }
};


module.exports = {
    createTask,
    getUsersFromSpaces,
    handleGoogleCallback,
    updateTask,
    deleteTask,
};