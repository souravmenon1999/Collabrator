const Folder = require('../models/folderModel');
const Space = require('../models/spaceModel'); 
const Task = require('../models/taskModels');   
const Thread = require('../models/subThreadModel').Thread; 
const User = require('../models/userModel'); // Assuming path to your User model



const folderController = {
    createFolder: async (req, res) => {
        /* try {
            const { userID, name, description } = req.body;
            const { email } = req.query; // Extract email from query parameters
            if (!email) {
                return res.status(400).json({ message: "User email is required to create a folder. Please provide email in query parameters." });
            }

            console.log(userID);
            const newFolder = new Folder({ userID, name, description, spaces: [] });
            const savedFolder = await newFolder.save();

            // Transform the response to the desired format
            const transformedFolder = {
                id: savedFolder._id, // Rename _id to id
                name: savedFolder.name,
                description:description, // Keep name
                isExpanded: false, // Add isExpanded: false
                spaces: savedFolder.spaces, // Keep spaces
                created: new Date(savedFolder.createdAt).toLocaleDateString('en-GB', { // Format createdAt
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })
                    .replace(/ /g, ' '), // Replace space with no-break space if needed (optional for display consistency)
            };

            res.status(201).json(transformedFolder); // Send the transformed response
        } catch (error) {
            res.status(500).json({ message: error.message });
        } */
            const { name, description } = req.body; // Extract name and description from request body
            const { email } = req.query; // Extract email from query parameters
        
            if (!email) {
                return res.status(400).json({ message: "User email is required to create a folder. Please provide email in query parameters." });
            }
        
            if (!name) {
                return res.status(400).json({ message: "Folder name is required." });
            }
        
            try {
                // 1. Find the user by email
                const user = await User.findOne({ email: email });
                if (!user) {
                    return res.status(404).json({ message: "User not found with provided email." });
                }
        
                // 2. Create the new folder, associating it with the found user's ID
                const newFolder = new Folder({
                    userID: user._id, // Use the _id of the found user
                    name,
                    description,
                    spaces: [] // Initialize spaces as empty array if not provided in request
                });
                const savedFolder = await newFolder.save();
        
                // 3. Append the new folder's ID to the user's folders array
                user.folders.push(savedFolder._id);
                await user.save(); // Save the updated user document
        
                // 4. Transform the response to the desired format (same as before)
                const transformedFolder = {
                    id: savedFolder._id.toString(), // Convert ObjectId to string
                    name: savedFolder.name,
                    description: savedFolder.description,
                    isExpanded: false,
                    spaces: savedFolder.spaces,
                    created: new Date(savedFolder.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    }).replace(/ /g, ' '),
                };
        
                res.status(201).json(transformedFolder); // Send the transformed response
        
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
    },

    /* getUserFolders: async (req, res) => {  // Example: Get folders for a user
        try {
            // Populate 'spaces', and then within each space, populate 'subjects' and 'tasks'
            const folders = await Folder.find().populate({
                path: 'spaces', // Populate the 'spaces' field in Folder model
                populate: [ // Array of populations for 'spaces'
                    {
                        path: 'subjects', // Populate 'subjects' in Space model
                        model: 'Thread'  // Model for 'subjects' is Thread
                    },
                    {
                        path: 'tasks',    // Populate 'tasks' in Space model
                        model: 'Task' // Model for 'tasks' is TaskModel (make sure this is the correct model name)
                    }
                ]
            });

            // Transform the response
            const transformedFolders = folders.map(folder => {
                // Transform each populated space object within the folder
                const transformedSpaces = folder.spaces.map(space => {
                    // Transform populated subthreads (subjects)
                    const transformedSubThreads = space.subjects.map(thread => ({
                      userId: thread.userId,
                      spaceId: thread.spaceId.toString(),
                      TOPIC: thread.TOPIC,
                      PARENTMESSAGEID: thread.PARENTMESSAGEID,
                      messages: thread.messages.map(messageId => messageId.toString()),
                      unread: thread.unread,
                      id: thread._id.toString(),
                      CREATEDAT: thread.CREATEDAT ? thread.CREATEDAT.toISOString() : undefined,
                      UPDATEDAT: thread.UPDATEDAT ? thread.UPDATEDAT.toISOString() : undefined,
                      __v: thread.__v,
                  }));;

                    // --- Reverted Task Transformation Logic ---
                    const transformedTasks = space.tasks.map(task => ({
                      id: task._id.toString(),
                      spaceId: space._id.toString(),
                      TITLE: task.TITLE,
                      DESCRIPTION: task.DESCRIPTION || "", // Added description to be in line with API response structure and handle null
                      STATUS: { // Modified STATUS to match API response structure
                          ISCOMPLETED: task.STATUS.ISCOMPLETED,
                          _id: task.STATUS._id ? task.STATUS._id.toString() : undefined, // Added _id from STATUS and handle if _id is not present
                          CREATEDAT: task.STATUS.CREATEDAT ? task.STATUS.CREATEDAT.toISOString() : undefined, // Added CREATEDAT and convert to ISO string and handle if CREATEDAT is not present
                          UPDATEDAT: task.STATUS.UPDATEDAT ? task.STATUS.UPDATEDAT.toISOString() : undefined // Added UPDATEDAT and convert to ISO string and handle if UPDATEDAT is not present
                      },
                      LINKEDSPACES: task.LINKEDSPACES || [], // Keep LINKEDSPACES and handle null/undefined
                      NEXTACTIONDETAILS: task.NEXTACTIONDETAILS || { // Keep NEXTACTIONDETAILS and handle null/undefined, provide default empty object
                          Activity: "",
                          time: ""
                      },
                      ASSIGNEE: task.ASSIGNEE || "", // Keep ASSIGNEE and handle null/undefined
                      LOCATION: task.LOCATION || "", // Keep LOCATION and handle null/undefined
                      FLAG: task.FLAG || false, // Keep FLAG and handle null/undefined
                      PRIORITY: task.PRIORITY || "None", // Keep PRIORITY and handle null/undefined
                      LIST: task.LIST || "EMI", // Keep LIST and handle null/undefined
                      IMAGE: task.IMAGE || "", // Keep IMAGE and handle null/undefined
                      SUBTASKS: task.SUBTASKS || [], // Keep SUBTASKS and handle null/undefined
                      createdAt: task.createdAt ? task.createdAt.toISOString() : undefined, // Keep createdAt and convert to ISO string and handle if createdAt is not present
                      updatedAt: task.updatedAt ? task.updatedAt.toISOString() : undefined, // Keep updatedAt and convert to ISO string and handle if updatedAt is not present
                      __v: task.__v, // Keep __v - versionKey from mongoose
                      dueDate: task.DUEDATE ? new Date(task.DUEDATE).toLocaleDateString('en-GB', {  // Format dueDate if present - Keep this as it was for frontend display
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                      }) : null,
                      createdFormatted: new Date(task.createdAt).toLocaleDateString('en-GB', { // Format task createdAt - Keep this as it was for frontend display (and rename to createdFormatted to avoid confusion with createdAt which is now ISO string)
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                      })
                          .replace(/ /g, ' '),
                      statusCompleted: task.STATUS.ISCOMPLETED, // Keep statusCompleted - this is redundant as ISCOMPLETED is already in STATUS, but kept for now to match original transformation
                  
                  }));;
                    // --- End of Reverted Task Transformation Logic ---


                    return {
                        id: space._id.toString(),
                        name: space.name,
                        folderId: folder._id.toString(),
                        subThreads: transformedSubThreads, // Now populated and transformed
                        tasks: transformedTasks,       // Now populated and transformed
                        created: new Date(space.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })
                            .replace(/ /g, ' '),
                        description: space.description,
                        // ... other space properties
                    };
                });

                return {
                    id: folder._id.toString(),
                    name: folder.name,
                    isExpanded: false,
                description:folder.description, // Keep name
                    
                    spaces: transformedSpaces,
                    created: new Date(folder.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })
                        .replace(/ /g, ' '),
                };
            });

            res.json(transformedFolders); // Send the transformed response
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } */

        getUserFolders: async (req, res) => {
            const { email } = req.query;
            console.log(' get folder - split populate approach with userId in each folder');
        
            if (!email) {
                return res.status(400).json({ message: "Email is required" });
            }
        
            try {
                let user = await User.findOne({ email: email });
        
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
        
                user = await user.populate('folders');
        
                user = await user.populate({
                    path: 'folders.spaces',
                    match: {
                        $or: [
                            { Members: user._id },
                            { Owner: user._id }
                        ]
                    },
                    populate: [
                        {
                            path: 'subjects',
                            model: 'Thread',
                            match: { members: { $in: [user._id] } }
                        },
                        {
                            path: 'tasks',
                            model: 'Task'
                        }
                    ]
                });
        
                if (!user.folders) {
                    return res.status(200).json([]);
                }
        
                const transformedFolders = user.folders.map(folder => {
                    if (folder.spaces && folder.spaces.length > 0) {
                        const transformedSpaces = folder.spaces.map(space => {
                            const filteredSubjects = space.subjects.filter(subject => subject !== null);

                            const transformedSubThreads = space.subjects.map(thread => ({
                                userId: thread.userId,
                                spaceId: thread.spaceId.toString(),
                                TOPIC: thread.TOPIC,
                                PARENTMESSAGEID: thread.PARENTMESSAGEID,
                                messages: thread.messages.map(messageId => messageId.toString()),
                                unread: thread.unread,
                                id: thread._id.toString(),
                                CREATEDAT: thread.CREATEDAT ? thread.CREATEDAT.toISOString() : undefined,
                                UPDATEDAT: thread.UPDATEDAT ? thread.UPDATEDAT.toISOString() : undefined,
                                __v: thread.__v,
                                members: thread.members, // Include members in the transformed thread object if needed in frontend

                            }));
        
                            const transformedTasks = space.tasks.map(task => ({
                                id: task._id.toString(),
                                isRead: task.isRead || undefined,
                                spaceId: space._id.toString(),
                                TITLE: task.TITLE,
                                DESCRIPTION: task.DESCRIPTION || "",
                                STATUS: {
                                    ISCOMPLETED: task.STATUS.ISCOMPLETED,
                                    _id: task.STATUS._id ? task.STATUS._id.toString() : undefined,
                                    CREATEDAT: task.STATUS.CREATEDAT ? task.STATUS.CREATEDAT.toISOString() : undefined,
                                    UPDATEDAT: task.STATUS.UPDATEDAT ? task.STATUS.UPDATEDAT.toISOString() : undefined
                                },
                                LINKEDSPACES: task.LINKEDSPACES || [],
                                NEXTACTIONDETAILS: task.NEXTACTIONDETAILS || {
                                    Activity: "",
                                    time: ""
                                },
                                ASSIGNEE: task.ASSIGNEE || "",
                                LOCATION: task.LOCATION || "",
                                FLAG: task.FLAG || false,
                                PRIORITY: task.PRIORITY || "None",
                                LIST: "MBA",
                                IMAGE: task.IMAGE || "",
                                SUBTASKS: task.SUBTASKS || [],
                                createdAt: task.createdAt ? task.createdAt.toISOString() : undefined,
                                updatedAt: task.updatedAt ? task.updatedAt.toISOString() : undefined,
                                __v: task.__v,
                                DUEDATE: task.DUEDATE ? new Date(task.DUEDATE).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                }) : null,
                                createdFormatted: new Date(task.createdAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                }).replace(/ /g, ' '),
                                statusCompleted: task.STATUS.ISCOMPLETED,
                            }));
        
                            return {
                                id: space._id.toString(),
                                name: space.name,
                                folderId: folder._id.toString(),
                                subThreads: transformedSubThreads,
                                tasks: transformedTasks,
                                created: new Date(space.createdAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                }).replace(/ /g, ' '),
                                description: space.description,
                            };
                        });
        
                        return {
                            id: folder._id.toString(),
                            name: folder.name,
                            isExpanded: false,
                            description: folder.description,
                            spaces: transformedSpaces,
                            created: new Date(folder.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            }).replace(/ /g, ' '),
                            userId: user._id.toString() // Add userId here
                        };
                    } else {
                        return null;
                    }
                }).filter(folder => folder !== null);
        
                res.json(transformedFolders);
            } catch (error) {
                console.error("Error in getUserFolders (split populate):", error);
                res.status(500).json({ message: error.message });
            }
        },
   
    deleteFolder: async (req, res) => {
        console.log('reached');
        try {
            const folderId = req.params.folderId;

            if (!folderId) {
                return res.status(400).json({ message: "Folder ID is required for deletion." });
            }

            const folder = await Folder.findById(folderId).populate('spaces'); // Populate spaces for cascading deletion

            if (!folder) {
                return res.status(404).json({ message: "Folder not found." });
            }

            // --- Cascade Delete Logic (Optional but Recommended) ---
            // Delete all spaces within the folder and their associated resources (tasks, threads)
            if (folder.spaces && folder.spaces.length > 0) {
                for (const space of folder.spaces) {
                    // Delete tasks within the space
                    await Task.deleteMany({ spaceId: space._id });
                    // Delete threads (subjects) within the space
                    await Thread.deleteMany({ spaceId: space._id });
                    // Finally, delete the space itself
                    await Space.findByIdAndDelete(space._id);
                }
            }
            // --- End of Cascade Delete Logic ---

            // Now, delete the folder itself
            await Folder.findByIdAndDelete(folderId);

            res.status(200).json({ message: "Folder deleted successfully." });

        } catch (error) {
            console.error("Error deleting folder:", error);
            res.status(500).json({ message: "Failed to delete folder.", error: error.message });
        }
    },

    updateFolder: async (req, res) => {
        try {
            const folderId = req.params.folderId; // Get folderId from URL parameters
            const { name, description } = req.body; // Get updated name and description from request body

            if (!folderId) {
                return res.status(400).json({ message: "Folder ID is required for update." });
            }

            if (!name) {
                return res.status(400).json({ message: "Folder name is required." }); // Ensure name is provided in update
            }

            const folder = await Folder.findById(folderId); // Find folder by ID

            if (!folder) {
                return res.status(404).json({ message: "Folder not found." }); // Folder not found
            }

            // Update folder properties
            folder.name = name;
            folder.description = description; // Update description as well

            await folder.save(); // Save the updated folder

            res.status(200).json(folder); // Respond with the updated folder object

        } catch (error) {
            console.error("Error updating folder:", error);
            res.status(500).json({ message: "Failed to update folder.", error: error.message }); // Server error
        }
    },


    updateFolder: async (req, res) => {
        try {
            const folderId = req.params.folderId; // Get folderId from URL parameters
            const { name, description } = req.body; // Get updated name and description from request body

            if (!folderId) {
                return res.status(400).json({ message: "Folder ID is required for update." });
            }

            if (!name) {
                return res.status(400).json({ message: "Folder name is required." }); // Ensure name is provided in update
            }

            const folder = await Folder.findById(folderId); // Find folder by ID

            if (!folder) {
                return res.status(404).json({ message: "Folder not found." }); // Folder not found
            }

            // Update folder properties
            folder.name = name;
            folder.description = description; // Update description as well

            await folder.save(); // Save the updated folder

            // Transform the response to match the format expected by the frontend (similar to createFolder)
           


            res.status(200).json('folder updated'); // Respond with the updated folder object

        } catch (error) {
            console.error("Error updating folder:", error);
            res.status(500).json({ message: "Failed to update folder.", error: error.message }); // Server error
        }
    
    },

    // ... other folder controller methods (GET, PUT, DELETE logic) ...
};


    // ... other folder controller methods (GET, PUT, DELETE logic) ...


module.exports = folderController;


// getUserFolders: async (req, res) => {
//     const { email } = req.query;
//     console.log(email) // Extract email from query parameters

//     if (!email) {
//         return res.status(400).json({ message: "Email is required" });
//     }

//     try {
//         // Find the user by email and populate their folders array
//         const user = await User.findOne({ email: email }).populate({
//             path: 'folders', // Populate the 'folders' field in User model
//             populate: { // Now populate within the folders
//                 path: 'spaces', // Populate 'spaces' in Folder model
//                 populate: [
//                     {
//                         path: 'subjects', // Populate 'subjects' in Space model
//                         model: 'Thread'
//                     },
//                     {
//                         path: 'tasks',    // Populate 'tasks' in Space model
//                         model: 'Task'
//                     }
//                 ]
//             }
//         });

//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         if (!user.folders || user.folders.length === 0) {
//             return res.status(200).json([]); // Return empty array if user has no folders, not an error
//         }

//         // Transform the folders (already populated with spaces, subjects, tasks)
//         const transformedFolders = user.folders.map(folder => {
//             // Transform each populated space object within the folder
//             const transformedSpaces = folder.spaces.map(space => {
//                 // Transform populated subthreads (subjects)
//                 const transformedSubThreads = space.subjects.map(thread => ({
//                     userId: thread.userId,
//                     spaceId: thread.spaceId.toString(),
//                     TOPIC: thread.TOPIC,
//                     PARENTMESSAGEID: thread.PARENTMESSAGEID,
//                     messages: thread.messages.map(messageId => messageId.toString()),
//                     unread: thread.unread,
//                     id: thread._id.toString(),
//                     CREATEDAT: thread.CREATEDAT ? thread.CREATEDAT.toISOString() : undefined,
//                     UPDATEDAT: thread.UPDATEDAT ? thread.UPDATEDAT.toISOString() : undefined,
//                     __v: thread.__v,
//                 }));;

//                 // --- Reverted Task Transformation Logic ---
//                 const transformedTasks = space.tasks.map(task => ({
//                     id: task._id.toString(),
//                     isRead:task.isRead || undefined,
//                     spaceId: space._id.toString(),
//                     TITLE: task.TITLE,
//                     DESCRIPTION: task.DESCRIPTION || "", // Added description to be in line with API response structure and handle null
//                     STATUS: { // Modified STATUS to match API response structure
//                         ISCOMPLETED: task.STATUS.ISCOMPLETED,
//                         _id: task.STATUS._id ? task.STATUS._id.toString() : undefined, // Added _id from STATUS and handle if _id is not present
//                         CREATEDAT: task.STATUS.CREATEDAT ? task.STATUS.CREATEDAT.toISOString() : undefined, // Added CREATEDAT and convert to ISO string and handle if CREATEDAT is not present
//                         UPDATEDAT: task.STATUS.UPDATEDAT ? task.STATUS.UPDATEDAT.toISOString() : undefined // Added UPDATEDAT and convert to ISO string and handle if UPDATEDAT is not present
//                     },
//                     LINKEDSPACES: task.LINKEDSPACES || [], // Keep LINKEDSPACES and handle null/undefined
//                     NEXTACTIONDETAILS: task.NEXTACTIONDETAILS || { // Keep NEXTACTIONDETAILS and handle null/undefined, provide default empty object
//                         Activity: "",
//                         time: ""
//                     },
//                     ASSIGNEE: task.ASSIGNEE || "", // Keep ASSIGNEE and handle null/undefined
//                     LOCATION: task.LOCATION || "", // Keep LOCATION and handle null/undefined
//                     FLAG: task.FLAG || false, // Keep FLAG and handle null/undefined
//                     PRIORITY: task.PRIORITY || "None", // Keep PRIORITY and handle null/undefined
//                     LIST:  "MBA", // Keep LIST and handle null/undefined
//                     IMAGE: task.IMAGE || "", // Keep IMAGE and handle null/undefined
//                     SUBTASKS: task.SUBTASKS || [], // Keep SUBTASKS and handle null/undefined
//                     createdAt: task.createdAt ? task.createdAt.toISOString() : undefined, // Keep createdAt and convert to ISO string and handle if createdAt is not present
//                     updatedAt: task.updatedAt ? task.updatedAt.toISOString() : undefined, // Keep updatedAt and convert to ISO string and handle if updatedAt is not present
//                     __v: task.__v, // Keep __v - versionKey from mongoose
//                     dueDate: task.DUEDATE ? new Date(task.DUEDATE).toLocaleDateString('en-GB', {  // Format dueDate if present - Keep this as it was for frontend display
//                         day: 'numeric',
//                         month: 'short',
//                         year: 'numeric'
//                     }) : null,
//                     createdFormatted: new Date(task.createdAt).toLocaleDateString('en-GB', { // Format task createdAt - Keep this as it was for frontend display (and rename to createdFormatted to avoid confusion with createdAt which is now ISO string)
//                         day: 'numeric',
//                         month: 'short',
//                         year: 'numeric'
//                     })
//                         .replace(/ /g, ' '),
//                     statusCompleted: task.STATUS.ISCOMPLETED, // Keep statusCompleted - this is redundant as ISCOMPLETED is already in STATUS, but kept for now to match original transformation

//                 }));;
//                 // --- End of Reverted Task Transformation Logic ---


//                 return {
//                     id: space._id.toString(),
//                     name: space.name,
//                     folderId: folder._id.toString(),
//                     subThreads: transformedSubThreads, // Now populated and transformed
//                     tasks: transformedTasks,       // Now populated and transformed
//                     created: new Date(space.createdAt).toLocaleDateString('en-GB', {
//                         day: 'numeric',
//                         month: 'short',
//                         year: 'numeric'
//                     })
//                         .replace(/ /g, ' '),
//                     description: space.description,
//                     // ... other space properties
//                 };
//             });

//             return {
//                 id: folder._id.toString(),
//                 name: folder.name,
//                 isExpanded: false,
//                 description: folder.description, // Keep name

//                 spaces: transformedSpaces,
//                 created: new Date(folder.createdAt).toLocaleDateString('en-GB', {
//                     day: 'numeric',
//                     month: 'short',
//                     year: 'numeric'
//                 })
//                     .replace(/ /g, ' '),
//             };
//         });

//         res.json(transformedFolders); // Send the transformed response
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// }
// ,
