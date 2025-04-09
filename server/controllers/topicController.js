const Space = require('../models/spaceModel');
const subThread = require('../models/subThreadModel');
const googleChatService = require('../services/googleChatService'); // Import the Google Chat service
const User = require('../models/userModel');


console.log("Thread:", subThread); // Add this line




// exports.addTopic = async (req, res) => {
//     try {
//         const { spaceId, name, email } = req.body; // Expecting email from req.body
//         console.log(email) // logging email instead of userId

//         if (!spaceId || !name || !email) { // Added check for email as it's now required
//             return res.status(400).json({ message: "Space ID, topic name, and email are required." }); // Modified message to include email
//         }

//         // 1. **Get User's Google Access Token:**
//         //    Now find user by email instead of userId
//         const user = await User.findOne({ email: email }); // Find user by email
//         if (!user || !user.googleAccessToken) {
//             return res.status(400).json({ message: "User not found or Google Access Token missing for provided email." }); // Modified message to be email specific
//         }
//         const accessToken = user.googleAccessToken;
//         const userId = user._id; // Get userId from the found user object - crucial step


//         // 2. **Create Google Chat Space:**
//         // let googleChatSpaceResponse;
//         // try {
//         //     googleChatSpaceResponse = await googleChatService.createGoogleChatSpace(accessToken, name);
//         //     console.log("Google Chat Space created:", googleChatSpaceResponse);
//         // } catch (googleChatError) {
//         //     // Handle Google Chat Space creation error
//         //     return res.status(500).json({
//         //         message: "Failed to create Google Chat Space.",
//         //         googleChatError: googleChatError.message // Include Google Chat error message for debugging
//         //     });
//         // }

//         // const googleChatSpaceId = googleChatSpaceResponse.name; // Extract Google Chat Space ID from API response


//         // 3. Create a new Thread document in your application's database
//         const newTopic = await subThread.Thread.create({
//             userId: userId, // Use userId obtained from the user object found by email
//             spaceId,
//             TOPIC: name,
//             messages: [],
//             unread: [],
//             // googleChatSpaceId: googleChatSpaceId // **Store Google Chat Space ID here**
//         });

//         // 4. Find the Application Space and add the new topic's ID
//         const space = await Space.findById(spaceId);
//         if (!space) {
//             return res.status(404).json({ message: "Space not found in application." });
//         }
//         space.subjects.push(newTopic._id);
//         await space.save();


//         const transformedTopic = { // Transform the topic object as before
//             userId: newTopic.userId,
//             spaceId: newTopic.spaceId,
//             TOPIC: newTopic.TOPIC,
//             PARENTMESSAGEID: newTopic.PARENTMESSAGEID,
//             messages: newTopic.messages,
//             unread: newTopic.unread,
//             // googleChatSpaceId: newTopic.googleChatSpaceId, // Include googleChatSpaceId in response
//             id: newTopic._id.toString(),
//             CREATEDAT: newTopic.CREATEDAT.toISOString(),
//             UPDATEDAT: newTopic.UPDATEDAT.toISOString(),
//             __v: newTopic.__v
//         };

//         // 5. Respond with success
//         res.status(201).json(transformedTopic);

//     } catch (error) {
//         console.error("Error adding topic:", error);
//         res.status(500).json({ message: "Failed to add topic.", error: error.message });
//     }
// };


exports.addTopic = async (req, res) => {
        try {
            const { spaceId, name, email, members } = req.body; // Expecting email and members from req.body
            console.log(email, members) // logging email and members
    
            if (!spaceId || !name || !email) {
                return res.status(400).json({ message: "Space ID, topic name, and email are required." });
            }
    
            // 1. Find User by Email (Creator of the topic)
            const user = await User.findOne({ email: email });
            if (!user || !user.googleAccessToken) {
                return res.status(400).json({ message: "User not found or Google Access Token missing for provided email." });
            }
            const accessToken = user.googleAccessToken;
            const userId = user._id; // Creator's User ID
    
            // ... (Google Chat Space creation commented out as per previous code) ...
    
            // 3. Create a new Thread document in your application's database
            const newTopic = await subThread.Thread.create({
                userId: userId, // Creator is the userId
                spaceId,
                TOPIC: name,
                messages: [],
                unread: [],
                members: [userId, ...members], // **Add creator and selected members to the members array**
                // googleChatSpaceId: googleChatSpaceId // **Store Google Chat Space ID here**
            });
    
            // **NEW CHECK: Verify if the newTopic ID exists in the database**
            const checkedTopic = await subThread.Thread.findById(newTopic._id);
            if (!checkedTopic) {
                return res.status(500).json({ message: "Failed to create topic properly, ID not found after creation." });
            }
    
            // 4. Find the Application Space and add the new topic's ID
            const space = await Space.findById(spaceId);
            if (!space) {
                return res.status(404).json({ message: "Space not found in application." });
            }
    
            // ** Check if topic ID already exists in space.subjects before pushing - Although unlikely in normal flow**
            if (!space.subjects.includes(newTopic._id)) {
                space.subjects.push(newTopic._id);
                await space.save();
            }
    
    
            // 5. Update User models to include the new thread
            const creatorUser = await User.findById(userId);
            if (creatorUser) {
                // ** Check if topic ID already exists in user.threads before pushing - Although unlikely in normal flow**
                if (!creatorUser.threads.includes(newTopic._id)) {
                    creatorUser.threads.push(newTopic._id);
                    await creatorUser.save(); // Save the updated creatorUser
                }
            }
    
    
            if (members && members.length > 0) { // If there are selected members
                await User.updateMany( // Update all selected members
                    { _id: { $in: members } }, // Match users with IDs in the 'members' array
                    { $addToSet: { threads: newTopic._id } } // Use $addToSet to prevent duplicate entries
                );
            }
    
    
            const transformedTopic = {
                userId: newTopic.userId,
                spaceId: newTopic.spaceId,
                TOPIC: newTopic.TOPIC,
                PARENTMESSAGEID: newTopic.PARENTMESSAGEID,
                messages: newTopic.messages,
                unread: newTopic.unread,
                members: newTopic.members, // **Include members in the response**
                // googleChatSpaceId: newTopic.googleChatSpaceId, // Include googleChatSpaceId in response
                id: newTopic._id.toString(),
                CREATEDAT: newTopic.CREATEDAT.toISOString(),
                UPDATEDAT: newTopic.UPDATEDAT.toISOString(),
                __v: newTopic.__v
            };
    
            // 6. Respond with success
            res.status(201).json(transformedTopic);
    
        } catch (error) {
            console.error("Error adding topic:", error);
            res.status(500).json({ message: "Failed to add topic.", error: error.message });
        }
    };


    exports.updateTopic = async (req, res) => {
        try {
            const { topicId } = req.params; // Get topicId from URL params
            const { name, members } = req.body; // Get updated name and members from request body
            console.log("update topic api", topicId, name, members);
    
            if (!topicId || !name) {
                return res.status(400).json({ message: "Topic ID and new topic name are required." });
            }
    
            // **Fetch the existing topic and populate its members**
            const existingTopic = await subThread.Thread.findById(topicId).populate('members', '_id'); // Populate members with only _id for efficiency
    
            if (!existingTopic) {
                return res.status(404).json({ message: "Topic not found." });
            }
    
            const originalMemberIds = existingTopic.members.map(member => member._id.toString()); // Get original member IDs as strings
            const newMemberIds = [existingTopic.userId.toString(), ...members]; // New member IDs including owner
    
    
            // **Identify members who are REMOVED from the topic in this update**
            const removedMemberIds = originalMemberIds.filter(memberId => !newMemberIds.includes(memberId));
            console.log("Removed Member IDs:", removedMemberIds);
    
    
            // **Update Topic Name and Members**
            existingTopic.TOPIC = name;
            existingTopic.members = [existingTopic.userId, ...members]; // Ensure creator is always included and set new members
    
            await existingTopic.save(); // Save the updated topic
    
            // **Remove thread association from removed users**
            for (const removedMemberId of removedMemberIds) {
                try {
                    const user = await User.findById(removedMemberId);
                    if (user) {
                        // **Remove the topic (subThread) ID from the user's threads array**
                        user.threads.pull(topicId); // Use pull to remove topicId from the array
                        await user.save();
                        console.log(`Removed topic ${topicId} from user ${removedMemberId}`);
                    } else {
                        console.warn(`User with ID ${removedMemberId} not found, but was removed from topic ${topicId}.`);
                    }
                } catch (userUpdateError) {
                    console.error(`Error updating user ${removedMemberId} after topic update:`, userUpdateError);
                    // Consider how you want to handle this error - maybe log it and continue, or return an error response
                }
            }
    
    
            // **Populate members for the response - Optional, but good practice**
            
    console.log(existingTopic.members);
            const transformedTopic = { // Transform the topic object for consistency in response
                userId: existingTopic.userId,
                spaceId: existingTopic.spaceId,
                TOPIC: existingTopic.TOPIC,
                PARENTMESSAGEID: existingTopic.PARENTMESSAGEID,
                messages: existingTopic.messages,
                unread: existingTopic.unread,
                members: existingTopic.members, // Include populated members in the response
                id: existingTopic._id.toString(),
                CREATEDAT: existingTopic.CREATEDAT.toISOString(),
                UPDATEDAT: existingTopic.UPDATEDAT.toISOString(),
                __v: existingTopic.__v
            };
    
    
            res.status(200).json(transformedTopic); // Respond with the updated topic
        } catch (error) {
            console.error("Error updating topic:", error);
            res.status(500).json({ message: "Failed to update topic.", error: error.message });
        }
    };

    exports.deleteTopic = async (req, res) => {
        try {
            const { topicId } = req.params; // Get topicId from URL params
    
            if (!topicId) {
                return res.status(400).json({ message: "Topic ID is required for deletion." });
            }
    
            const existingTopic = await subThread.Thread.findById(topicId);
            if (!existingTopic) {
                return res.status(404).json({ message: "Topic not found." });
            }
    
            await subThread.Thread.findByIdAndDelete(topicId); // Delete the topic from the database
    
            res.status(200).json({ message: "Topic deleted successfully." }); // Respond with success message
    
        } catch (error) {
            console.error("Error deleting topic:", error);
            res.status(500).json({ message: "Failed to delete topic.", error: error.message });
        }
    };