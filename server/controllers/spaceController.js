const Space = require('../models/spaceModel');
const Folder = require('../models/folderModel'); // Import Folder model to associate space with folder
const User = require('../models/userModel');
const Task = require('../models/taskModels'); // Import Task model
const Thread = require('../models/subThreadModel').Thread; // Import Thread mode
const mongoose = require('mongoose');
 // Import User model


 exports.createSpace = async (req, res) => {
  try {
      const { folderID, name, description, members } = req.body;
      const { email } = req.query; // Extract owner's email from query parameters

      if (!email) {
          return res.status(400).json({ message: "User email is required to create a space. Please provide email in query parameters." });
      }

      const folder = await Folder.findById(folderID);
      if (!folder) {
          return res.status(404).json({ message: 'Folder not found' });
      }

      const owner = await User.findOne({ email: email });
      if (!owner) {
          return res.status(404).json({ message: "Owner user not found with provided email." });
      }

      const newSpace = new Space({
          folderId: folderID,
          name,
          description,
          Owner: owner._id,
          Members: [],
          tasks: [],
          subjects: [],
          createdAt: new Date()
      });
      
      newSpace.Members.push(owner._id);

      await newSpace.save();

      folder.spaces.push(newSpace._id);
      await folder.save();

      owner.spaces.push(newSpace._id);
      
      await owner.save();

      if (members && Array.isArray(members)) {
        for (const memberEmail of members) {
            // Check if the memberEmail is the same as the owner's email
            if (memberEmail !== email) { // Keep this check
                const member = await User.findOne({ email: memberEmail });
                if (member) {
                    newSpace.Members.push(member._id);
                    member.spaces.push(newSpace._id);
    
                    // --- Duplicate Folder ID Prevention ---
                    if (!member.folders.includes(folderID)) { // **Check if folderID is already present**
                        member.folders.push(folderID); // **Only push if it's NOT already there**
                    }
                    // --- End of Duplicate Folder ID Prevention ---
    
                    await member.save();
                } else {
                    console.warn(`Member with email ${memberEmail} not found.`);
                }
            }
        }

        await newSpace.save();
    }

      const spaceResponse = {
          id: newSpace._id.toString(),
          name: newSpace.name,
          folderId: folderID,
          subThreads: [],
          created: new Date(newSpace.createdAt).toLocaleDateString('en-GB', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          }).replace(/ /g, ' ')
      };

      res.status(201).json(spaceResponse);
  } catch (error) {
      console.error('Error creating space:', error);
      res.status(500).json({ message: 'Failed to create space', error: error.message });
  }
};

exports.getSpace = async (req, res) => {
  try {
    const spaceId = req.params.spaceId;
    const space = await Space.findById(spaceId).populate('subThreads'); // If you plan to populate subThreads
    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }
    res.status(200).json(space);
  } catch (error) {
    console.error('Error fetching space:', error);
    res.status(500).json({ message: 'Failed to fetch space', error: error.message });
  }
};

exports.getSpaceMembers= async (req, res) => {
    console.log('get space memebers');
    try {
        const spaceId = req.params.spaceId;

        if (!spaceId) {
            return res.status(400).json({ message: "Space ID is required." });
        }

        const space = await Space.findById(spaceId).populate('Members', 'name email'); // Populate Members and select name and email

        if (!space) {
            return res.status(404).json({ message: "Space not found." });
        }

        // Transform members to the format { value: userId, label: userName }
        const members = space.Members.map(member => ({
            value: member._id.toString(), // Use _id as value
            label: member.name,          // Use name as label (you can use email or other fields if needed)
            email: member.email,         // Include email if you want to display it
        }));

        res.status(200).json(members); // Send the transformed members list

    } catch (error) {
        console.error("Error fetching space members:", error);
        res.status(500).json({ message: "Failed to fetch space members.", error: error.message });
    }
},

// exports.updateSpace= async (req, res) => {
//     try {
//         const spaceId = req.params.spaceId;
//         const { name, description, members } = req.body; // Expecting members as an array of user IDs

//         if (!spaceId) {
//             return res.status(400).json({ message: "Space ID is required for update." });
//         }
//         if (!name) {
//             return res.status(400).json({ message: "Space name is required." });
//         }

//         const space = await Space.findById(spaceId);

//         if (!space) {
//             return res.status(404).json({ message: "Space not found." });
//         }

//         space.name = name;
//         space.description = description;
//         if (members && Array.isArray(members)) { // Check if members is provided and is an array
//             space.Members = members; // Assign the array of user IDs directly to space.Members
//         }


//         await space.save();

//         // Respond with a success message or updated space (optional, as per your frontend needs)
//         res.status(200).json({ message: 'Space updated successfully', spaceId: spaceId, name: name }); // Sending back just spaceId and name for redux update

//     } catch (error) {
//         console.error("Error updating space:", error);
//         res.status(500).json({ message: "Failed to update space.", error: error.message });
//     }
// }


exports.updateSpace = async (req, res) => {
    console.log('folder update');
    try {
        const { id: spaceId, name, description, members } = req.body; // Get spaceId from body to identify space
        if (!spaceId || !mongoose.Types.ObjectId.isValid(spaceId)) {
            return res.status(400).json({ message: "Invalid space ID provided for update." });
        }

        const space = await Space.findById(spaceId).populate('Members', '_id email name').populate('Owner', '_id email name');
        if (!space) {
            return res.status(404).json({ message: 'Space not found' });
        }

        // Update basic space details
        space.name = name || space.name; // Update name if provided in request
        space.description = description || space.description; // Update description if provided

        let newMemberIds = [];
        let membersToRemoveIds = [];
        const currentMemberIds = space.Members.map(member => member._id.toString());
        const ownerIdString = space.Owner._id.toString();


        if (members && Array.isArray(members)) {
            newMemberIds = members.filter(memberId => !currentMemberIds.includes(memberId));
            membersToRemoveIds = currentMemberIds.filter(memberId => !members.includes(memberId) && memberId !== ownerIdString); // Exclude owner
        } else {
            membersToRemoveIds = [...currentMemberIds.filter(memberId => memberId !== ownerIdString)]; // If no members in req body, remove all except owner
        }


        // Add new members
        for (const memberId of newMemberIds) {
            if (!currentMemberIds.includes(memberId)) { // Double check not already a member
                const member = await User.findById(memberId);
                if (member) {
                    space.Members.push(member._id);
                    member.spaces.push(space._id); // Add space to user's spaces array

                    // START: Update folder list for newly added user
                    const folderIdOfSpace = space.folderId;
                    if (folderIdOfSpace && !member.folders.some(folderId => folderId.equals(folderIdOfSpace))) {
                        member.folders.push(folderIdOfSpace);
                    }
                    // END: Update folder list for newly added user

                    await member.save();
                } else {
                    console.warn(`User with ID ${memberId} not found, skipping.`);
                }
            }
        }


        // Remove members (excluding owner) and update User model
        for (const memberIdToRemove of membersToRemoveIds) {
            const memberIndex = space.Members.findIndex(member => member._id.toString() === memberIdToRemove);
            if (memberIndex > -1) {
                space.Members.splice(memberIndex, 1); // Remove from space's members

                const memberToRemove = await User.findById(memberIdToRemove);
                if (memberToRemove) {
                    memberToRemove.spaces = memberToRemove.spaces.filter(spaceRefId => spaceRefId.toString() !== spaceId); // Remove space from user's spaces

                    // START: Check if user still has any spaces in the folder after removing current space
                    const remainingSpacesInFolderForRemovedMember = await Space.find({
                        folderId: space.folderId,
                        Members: memberToRemove._id,
                        _id: { $ne: spaceId } // Exclude the space being updated
                    });
                    console.log(`Update Space - Query for remaining spaces for removed member ${memberToRemove._id}:`, {
                        folderId: space.folderId,
                        Members: memberToRemove._id,
                        _id: { $ne: spaceId }
                    });
                    console.log(`Update Space - Remaining spaces found for removed member ${memberToRemove._id}:`, remainingSpacesInFolderForRemovedMember);


                    if (remainingSpacesInFolderForRemovedMember.length === 0) {
                        console.log(`Update Space - Removed member ${memberToRemove._id} has no remaining spaces in folder ${space.folderId}. Removing folder ID.`);
                        memberToRemove.folders.pull(space.folderId);
                        console.log(`Update Space - After folder ID pull for removed member ${memberToRemove._id} folders:`, memberToRemove.folders);
                    }
                    // END: Check if user still has any spaces in the folder after removing current space


                    await memberToRemove.save();
                }
            }
        }


        await space.save(); // Save updated space

        const spaceResponse = {
            id: space._id.toString(),
            name: space.name,
            folderId: space.folderId.toString(),
            description: space.description,
            members: space.Members.map(member => ({ // Structure member info for response
                value: member._id.toString(),
                label: member.name,
                email: member.email
            })),
            updatedAt: new Date(space.updatedAt).toLocaleDateString('en-GB', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }).replace(/ /g, ' ')
        };


        res.status(200).json(spaceResponse); // Respond with updated space data
    } catch (error) {
        console.error('Error updating space:', error);
        res.status(500).json({ message: 'Failed to update space', error: error.message });
    }
};
exports.deleteSpace = async (req, res) => {
    const spaceId = req.params.spaceId;

    if (!spaceId || !mongoose.Types.ObjectId.isValid(spaceId)) {
        return res.status(400).json({ message: "Invalid space ID provided for deletion." });
    }

    try {
        const space = await Space.findById(spaceId).populate('Members').populate('Owner');
        if (!space) {
            return res.status(404).json({ message: 'Space not found' });
        }

        // 1. Delete Tasks associated with the Space and update User.tasks
        const tasksToDelete = await Task.find({ spaceId: spaceId });
        for (const task of tasksToDelete) {
            // Remove task reference from assignee Users
            for (const assignee of task.ASSIGNEE) {
                const user = await User.findById(assignee.userId);
                if (user) {
                    user.tasks.pull(task._id); // Remove task from user's tasks array
                    await user.save();
                }
            }
            await Task.findByIdAndDelete(task._id); // Delete the task itself
        }

        // 2. Delete Threads associated with the Space and update User.threads
        const threadsToDelete = await Thread.find({ spaceId: spaceId });
        for (const thread of threadsToDelete) {
            const user = await User.findById(thread.userId); // Creator of the thread
            if (user) {
                user.threads.pull(thread._id); // Remove thread from creator's threads array
                await user.save();
            }
            await Thread.findByIdAndDelete(thread._id); // Delete the thread itself
        }

        // 3. Remove Space reference from Users (Members and Owner)
        const members = space.Members;
        for (const member of members) {
            member.spaces.pull(spaceId); // Remove space from member's spaces array
            await member.save();
        }
        if (space.Owner) { // Ensure owner exists before trying to update
            const owner = await User.findById(space.Owner._id); // Re-fetch owner to ensure latest data
            if (owner) {
                owner.spaces.pull(spaceId); // Remove space from owner's spaces array
                await owner.save();
            }
        }


        // 4. Remove Space reference from Folder
        const folder = await Folder.findById(space.folderId);
        if (folder) {
            folder.spaces.pull(spaceId); // Remove space from folder's spaces array
            await folder.save();
        }

        // 5. Delete the Space itself
        await Space.findByIdAndDelete(spaceId);

        res.status(200).json({ message: 'Space deleted successfully' });

    } catch (error) {
        console.error('Error deleting space:', error);
        res.status(500).json({ message: 'Failed to delete space', error: error.message });
    }
};


// ... You can add other controller functions for getting, updating, deleting spaces as needed ...