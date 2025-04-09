// src/components/TaskModal.tsx
import { log } from "console";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; // Corrected import: useDispatch
import { setFolders, addSpaceToFolder, addTaskToSpace, addSubThreadToSpace } from "../redux/reducers/dataReducer"; // import addSpaceToFolder
import { RootState } from "../redux/store";
import Cookies from 'js-cookie'; // Import js-cookie
import axios from 'axios'; // Import axios
import MultiSelectDropdown from "./MultiSelectDropdown.tsx";



interface FormField {
    id: string;
    type?: string;
    label: string;
    placeholder?: string;
    options?: { value: string, label: string }[];
    toggleable?: boolean;
    subFields?: FormField[];
    searchable?: boolean;
    validationRules?: {
      required?: boolean; // We will use only 'required' rule
      // You can add other rules later if needed
  };

}

interface TaskModalProps {
    onClose: () => void;
    title: string;
    formFields: FormField[];
    modalFormType: string;
    folderId?: string;
    spaceId?: string;
    modalProps: any;
}

export default function TaskModal({ onClose, title, formFields, modalFormType, folderId, spaceId, modalProps }: TaskModalProps) {
    console.log("TaskModal Props:", { modalFormType, folderId, spaceId, title }); // Updated console log
    console.log("TaskModal Props: modalFormType prop value:", modalFormType); // Added console log for modalFormType prop

    const [formData, setFormData] = useState<Record<string, any>>({
        owner: [] // Initialize as empty array
    });

    useEffect(() => {
        console.log("Form Data Changed:", formData);
      }, [formData])
    const [fieldVisibility, setFieldVisibility] = useState<Record<string, boolean>>(
        formFields.reduce((acc, field) => {
            acc[field.id] = field.toggleable ? false : true;
            return acc;
        }, {} as Record<string, boolean>)
    );


    const [userOptions, setUserOptions] = useState< { value: string, label: string }[]>([]);
    

    const [formErrors, setFormErrors] = useState<Record<string, string | null>>({}); // State for validation errors
    const validateField = (field: FormField, value: any): string | null => {
      const rules = field.validationRules;
      console.log(`Validating field: ${field.id}, value:`, value); // <--- ADD THIS LOG


      if (field.id.includes('.')) { // <--- **CHECK for subfields**
        console.log(`  -- Subfield Validation --`); // <--- **SECOND CONSOLE LOG (ADD THIS)**
        console.log(`  Field Label: ${field.label}`); // <--- **THIRD CONSOLE LOG (ADD THIS)**
        console.log(`  Validation Rules:`, rules);   // <--- **FOURTH CONSOLE LOG (ADD THIS)**
    }
  
      if (!rules || !rules.required) {
        console.log(`Field ${field.id} - No rules or not required.`); // <--- ADD THIS LOG
        // Check if rules exist AND if 'required' is true
          return null; // No validation needed or field is not required
      }
  
      if (rules.required && !value) {
        console.log(`Field ${field.id} - Required and empty!`); // <--- ADD THIS LOG

          return `${field.label} is required.`; // Error message for required fields
      }

      console.log(`Field ${field.id} - No validation error.`); // <--- ADD THIS LOG

  
      return null; // No validation errors (field is either not required, or has a value if required)
  };

    
    const dummyUsers = [  //  <-- Paste the dummyUsers list HERE
        { value: "user1-id", label: "John Doe" },
        { value: "user2-id", label: "Jane Smith" },
        { value: "user3-id", label: "Robert Brown" },
        { value: "user4-id", label: "Alice Johnson" },
        { value: "user5-id", label: "Charlie Wilson" }
      ];// State for user dropdown options

      useEffect(() => {
        if (modalFormType === "space" || modalFormType === "task") {
          console.log(modalFormType);
          
            const fetchUsers = async () => {
                try {
                  const response = await axios.get('http://localhost:5000/api/users');
                  console.log(response.data);
                  
                  const formattedUsers = response.data.map((user) => ({
                    value: user.email,
                    label: user.name,
                    email:user.email // Use email if name is missing
                  }));
                  console.log(formattedUsers);
                  
                  setUserOptions(formattedUsers);
                } catch (error) {
                  console.error("Error fetching users:", error);
                  setUserOptions([]);
                }
              };
          fetchUsers();
        }
      }, [modalFormType]);


    const dispatch = useDispatch(); // <--- useDispatch() called at the top level of component
    const currentFolders = useSelector((state: RootState) => state.data.folders); // <--- useSelector() called at the top level

    // const handleChange = (fieldId: string, value: any) => {
    //     console.log(`Updating ${fieldId}:`, value);
    //     setFormData((prev) => ({ ...prev, [fieldId]: value }));


    //     const field = getUpdatedFields().find(f => f.id === fieldId);
    //     if (field) {
    //         const error = validateField(field, value);
    //         setFormErrors(prevErrors => ({ ...prevErrors, [fieldId]: error }));
    //     }
    // };

    const handleChange = (fieldId: string, value: any) => {
      console.log(`Updating ${fieldId}:`, value);
      setFormData((prev) => {
          const updatedFormData = { ...prev };
          // Handle nested fields like DUEDATE.date
          if (fieldId.includes('.')) {
              const [parentFieldId, childFieldId] = fieldId.split('.');
              if (!updatedFormData[parentFieldId]) {
                  updatedFormData[parentFieldId] = {}; // Initialize parent if not exist
              }
              updatedFormData[parentFieldId][childFieldId] = value;
          } else {
              updatedFormData[fieldId] = value;
          }
          return updatedFormData;
      });
  
      // Find the field definition to perform validation
      const field = getUpdatedFields().find(f => {
          if (fieldId.includes('.')) {
              return f.subFields?.find(sf => `${f.id}.${sf.id}` === fieldId);
          }
          return f.id === fieldId;
      });
  
      if (field) {
          let fieldToValidate = field;
          let valueToValidate = value;
  
          if (fieldId.includes('.')) {
              const [, childFieldId] = fieldId.split('.');
              fieldToValidate = field.subFields?.find(sf => sf.id === childFieldId) || field; // Fallback to parent if subfield not found (shouldn't happen)
              valueToValidate = formData[field.id]?.[childFieldId] ?? value; // Get the nested value from formData
          }
  
          if(fieldToValidate){ // check if fieldToValidate is not undefined
            console.log(`handleChange - Validating field: ${fieldToValidate.id}, label: ${fieldToValidate.label}, value:`, valueToValidate); // <-- **NINTH CONSOLE LOG (ADD THIS)**

              const error = validateField(fieldToValidate, valueToValidate);
              setFormErrors(prevErrors => ({ ...prevErrors, [fieldId]: error }));
          }
      }
  };



    const toggleField = (id: string) => {
        setFieldVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
    };
    const handleSubmit = async () => {
        let payload = {};
        let apiEndpoint = ""; // Variable to store the API endpoint

        console.log("modalFormType inside handleSubmit:", modalFormType); // Added log inside handleSubmit

        if (modalFormType === "folder") {
            console.log('hi');
            const email = Cookies.get('userEmail'); // Get email from cookie in component
            console.log(email);
            
            
            apiEndpoint = `http://localhost:5000/api/folders?email=${email}`; // Folder API endpoint
            payload = {
                userID: '67b6b4b1bebae88081f8464e', // Ensure userID is handled correctly
                name: formData.folderName || "",
                description: formData.description || "",
            };
        } else if (modalFormType === "space") {
            console.log(folderId);
            console.log('hi');
            console.log(formData.spaceName);
            console.log();
            
            const email = Cookies.get('userEmail'); // Get email from cookie in component
            console.log(email);
            

            apiEndpoint = `http://localhost:5000/api/spaces?email=${email}`; // Space API endpoint (assuming this route exists)
            payload = {
                folderID: folderId, // Include folderId in the payload for spaces
                name: formData.spaceName || "", // Assuming you have a field named 'spaceName' in your formFields for spaces
                description: formData.spaceDescription || "",
                members: formData.owner,// Assuming you have 'spaceDescription' if needed
                // ... any other space specific fields from your form
            };
        } else if (modalFormType === "addTopic") {
            const email = Cookies.get('userEmail'); // Get email from cookie in component

            console.log("addTopic is triggered");
            apiEndpoint = "http://localhost:5000/api/topics"; //  Topic API endpoint (adjust if different)
            payload = {

                email: email, // Ensure userID is handled correctly
                spaceId: spaceId, // Assuming spaceId prop is correctly passed
                name: formData.topicName || "", 
                
                
        }
        
        console.log(payload);
        
    }
    else if (modalFormType === "task") {
        console.log(spaceId);
        console.log(formData.TITLE);

        const email = Cookies.get('userEmail'); // Get email from cookie in component
        console.log(email);
        
        apiEndpoint = `http://localhost:5000/api/tasks?email=${email}`; // Task API endpoint
        payload = {
            spaceId:spaceId,
            userId: '67b6b4b1bebae88081f8464e', // IMPORTANT: Replace with actual user ID retrieval logic
            TITLE: formData.TITLE || "", // Use schema field names, handle defaults
            DESCRIPTION: formData.DESCRIPTION || "",
            DUEDATE: formData.date && formData.time ? new Date(`${formData.date}T${formData.time}`) : undefined, // Combine date and time
            NEXTACTIONDETAILS: {
                Activity: formData.NEXTACTIONDETAILS?.Activity || "",
                date: formData.NEXTACTIONDETAILS?.date ? new Date(formData.NEXTACTIONDETAILS.date) : undefined,
                time: formData.NEXTACTIONDETAILS?.time || "", // Time might need more parsing depending on format
            },
            ASSIGNEE: formData.owner || "",
            LOCATION: formData.LOCATION || "",
            FLAG: formData.FLAG || false, // Ensure boolean default
            PRIORITY: formData.PRIORITY || "None", // Default from schema
            LIST: formData.LIST || "EMI",      // Default from schema
            IMAGE: formData.IMAGE || "",
            // STATUS will be handled by backend defaults, no need to send from frontend unless you want to override defaults.
            // SUBTASKS and LINKEDSPACES can be added later.
        };
    }

    else if (modalFormType === "editFolder") {
        console.log("editFolder is triggered");
        apiEndpoint = `http://localhost:5000/api/folders/${modalProps.folder.id}`; // PUT endpoint for folder update
        payload = {
            name: formData.folderName || modalProps.folder.name || "",
            description: formData.description || modalProps.folder.description || "",
        };
    }


    const updatedFields = getUpdatedFields();
    const validationErrors: Record<string, string | null> = {};
    let hasErrors = false;

    updatedFields.forEach(field => {
        const error = validateField(field, formData[field.id]);
        validationErrors[field.id] = error;
        if (error) {
            hasErrors = true;
        }
    });

    setFormErrors(validationErrors);

    if (hasErrors) {
        alert("Please correct the errors in the form.");
        return;
    }

        try {
            console.log(JSON.stringify(payload));

            const response = await fetch(apiEndpoint, {
                method: modalFormType === "editFolder" ? "PUT" : "POST", // Use PUT for edit, POST for others
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("Operation successful!");
                onClose();

                const newData = await response.json(); // Parse the JSON response for both folder and space

                if (modalFormType === "folder") {
                    const newFolder = newData;
                    console.log("New folder created:", newFolder);
                    const updatedFolders = [...currentFolders, newFolder];
                    dispatch(setFolders(updatedFolders));
                } else if (modalFormType === "space") {
                    const newSpace = newData;
                    console.log("New space created:", newSpace);
                    dispatch(addSpaceToFolder({ folderId: folderId!, newSpace })); // Dispatch addSpaceToFolder with folderId and newSpace
                }
                else if (modalFormType === "addTopic") {
                    console.log("Space ID for topic:", spaceId);
                    
                    console.log(newData);
                    
                    dispatch(addSubThreadToSpace({ spaceId: spaceId!, newSubThread: newData })); // Corrected: use newSubThread                   
                    
                     // Log spaceId when adding topic
                    // Dispatch addSpaceToFolder with folderId and newSpace
                }else if (modalFormType === "task") {
                    console.log("New task created:", newData);
                    if (newData.authUrl) {
                      window.location.href = newData.authUrl;
                      return; // Log the new task data
                    dispatch(addTaskToSpace({ spaceId: spaceId!, newTask: newData })); // Directly dispatch addTaskToSpace reducer <--- DIRECT DISPATCH
                }
              }
                else if (modalFormType === "editFolder") {
                    const updatedFolder = await response.json();
                console.log("Folder updated:", updatedFolder);
                dispatch(updateFolder(updatedFolder)); 
                }

            } else {
                console.error("Failed to submit data");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };;

    const getUpdatedFields = () => {
        return formFields.map(field => {
          // For the space members dropdown
          if ( (modalFormType === "space" && field.id === "owner" || modalFormType === "task" && field.id === "ASSIGNEE")) {
            return {
              ...field,
              options: userOptions.length > 0 ? userOptions : dummyUsers
            };
          }
          return field;
        });
      };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-1">
            <div className="bg-[#111b21] rounded-2xl w-full max-w-3xl mx-auto shadow-lg">
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-600">
                    <h2 className="text-lg text-white">{title}</h2>
                </div>

                {/* Modal Body */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
    {getUpdatedFields().map((field) => (
        <div key={field.id} className="space-y-4">
            {field.subFields ? (
                <div>
                    <h4 className="text-gray-400 mb-2">{field.label}</h4>
                    <div className="flex flex-wrap gap-4">
                        {field.subFields.map((subField) => (
                            <div key={subField.id} className="w-full md:w-[48%]">
                                <RenderField field={subField} handleChange={handleChange} modalFormType={modalFormType} formData={formData} formErrors={formErrors} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : field.toggleable ? (
                <>
                        {console.log("Rendering SectionToggle for field:", field)} {/* ADD THIS LOG */}

                        <SectionToggle
        label={field.label}
        enabled={fieldVisibility[field.id]}
        onChange={() => toggleField(field.id)}
        field={field}             //  <--  ADD THIS:  Pass the field prop!
        handleChange={handleChange} //  <--  ADD THIS: Pass the handleChange function!
    />                  
                </>
            ) : (
                <RenderField field={field} handleChange={handleChange} formData={formData} formErrors={formErrors} />
            )}
        </div>
    ))}
</div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-600 flex justify-between">
                    <button className="w-1/2 text-center text-red-400 font-medium py-2" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="w-1/2 text-center text-green-400 font-medium py-2 border-l border-gray-600" onClick={handleSubmit}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

function RenderField({ field, handleChange, modalProps, modalFormType, formData, formErrors }: {
  field: FormField;
  handleChange: (id: string, value: any) => void;
  modalProps?: any;
  modalFormType?: string;
  formData: Record<string, any>;
  formErrors: Record<string, string | null>;
}) {

  const errorMessage = formErrors[field.id] || null;

  if (field.subFields) {
      return (
          <div>
              <label className="text-gray-400 block mb-1">{field.label}</label>
              {field.subFields.map((subField) => (
                  <div key={subField.id}>
                      <label className="text-gray-400 block mb-1">{subField.label}</label>
                      {/* Render subfield based on its type */}
                      {subField.type === "date" && (
                          <input
                              type="date"
                              className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                              onChange={(e) =>
                                  handleChange(`${field.id}.${subField.id}`, e.target.value)
                              }
                          />
                      )}
                      {subField.type === "time" && (
                          <input
                              type="time"
                              className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                              onChange={(e) =>
                                  handleChange(`${field.id}.${subField.id}`, e.target.value)
                              }
                          />
                      )}
                      {subField.type === "text" && (
                          <input
                              type="text"
                              className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                              onChange={(e) =>
                                  handleChange(`${field.id}.${subField.id}`, e.target.value)
                              }
                          />
                      )}
                      {/* Display error message for subfield */}
                      {console.log(`RenderField - Subfield Error Message:`, formErrors[`${field.id}.${subField.id}`], `for field: ${field.id}.${subField.id}`)} {/* <-- ADD THIS LOG */}
                      {formErrors[`${field.id}.${subField.id}`] && (
                          <p className="text-red-500 text-sm mt-1">{formErrors[`${field.id}.${subField.id}`]}</p>
                      )}
                  </div>
              ))}
          </div>
      );
  }


  if (field.type === "boolean") {
      return (
          <div className="flex items-center justify-between">
              <span className="text-gray-400">{field.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                  <input
                      type="checkbox"
                      className="sr-only"
                      onChange={(e) => handleChange(field.id, e.target.checked)} // <--- IMPORTANT: handleChange here
                  />
                  <div className="w-12 h-6 bg-gray-600 rounded-full transition-colors">
                      <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform" />
                  </div>
              </label>
          </div>
      );
  }

  if (field.type === 'select') {
      if (field.searchable) {
          return (
              <div>
                  <label className="text-gray-400 block mb-1">{field.label}</label>
                  <MultiSelectDropdown
                      options={field.options || []}
                      selectedValues={formData.owner}
                      onSelect={(option) => {
                          console.log('Current formData:', formData);
                          console.log('Option to add:', option);

                          const isDuplicate = formData.owner.includes(option);

                          if (!isDuplicate) {
                              handleChange('owner', [...formData.owner, option]);
                              console.log('Option added successfully:', option);
                          } else {
                              console.log('Duplicate option, not added:', option);
                          }
                      }}
                      onRemove={(value) => {
                          handleChange(
                              'owner',
                              formData.owner.filter((user) => user !== value)
                          );
                      }}
                  />
              </div>
          );
      } else {
          return (
              <div>
                  <label className="text-gray-400 block mb-1">{field.label}</label>
                  <select
                      className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                      onChange={(e) => handleChange(field.id, e.target.value)}
                  >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                              {option.label}
                          </option>
                      ))}
                  </select>
              </div>
          );
      }
  }


  if (field.type === 'date' || field.type === 'time') {
      return (
          <div>
              <label className="text-gray-400 block mb-1">{field.label}</label>
              <input
                  type={field.type}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                  onChange={(e) => handleChange(field.id, e.target.value)}
              />
          </div>
      );
  }


  if (field.type === "text") {
      return (
          <div>
              <label className="text-gray-400 block mb-1">{field.label}</label>
              <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                  onChange={(e) => {
                      console.log(`RenderField - Text Input OnChange: field.id=${field.id}, value=${e.target.value}`); // <-- ELEVENTH CONSOLE LOG (already present, keep it)
                      handleChange(field.id, e.target.value);
                  }}
              />

              {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}

          </div>
      );
  }


  return ( // For fields without subfields (text, boolean, select, etc.) and default case
      <div>
          <label className="text-gray-400 block mb-1">{field.label}</label>
          <input
              type={field.type}
              placeholder={field.placeholder}
              className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
              onChange={(e) => handleChange(field.id, e.target.value)}
          />
          {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
      </div>
  );
}
// function RenderField({ field, handleChange, modalProps, modalFormType, formData, formErrors }: {
//     field: FormField;
//     handleChange: (id: string, value: any) => void;
//     modalProps?: any;
//     modalFormType?: string;
//     formData: Record<string, any>;
//     formErrors: Record<string, string | null>; // <-- formErrors is in the interface!

//      // Add formData type
//     // Define modalFormType prop type
//     // modalProps is correctly added and marked as optional
// }) {

//   const errorMessage = formErrors[field.id] || null; // <-- **DEFINITION of errorMessage**



//     if (field.subFields) {
//         return (
//           <div>
//         <label className="text-gray-400 block mb-1">{field.label}</label>
//         {field.subFields.map((subField) => (
//           <div key={subField.id}>
//             <label className="text-gray-400 block mb-1">{subField.label}</label>
//             {/* Render subfield based on its type */}
//             {subField.type === "date" && (
//               <input
//                 type="date"
//                 className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
//                 onChange={(e) =>
//                   handleChange(`${field.id}.${subField.id}`, e.target.value)
//                 }
//               />
//             )}
//             {subField.type === "time" && (
//               <input
//                 type="time"
//                 className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
//                 onChange={(e) =>
//                   handleChange(`${field.id}.${subField.id}`, e.target.value)
//                 }
//               />
//             )}
//             {subField.type === "text" && (
//               <input
//                 type="text"
//                 className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
//                 onChange={(e) =>
//                   handleChange(`${field.id}.${subField.id}`, e.target.value)
//                 }
//               />
//             )}
//           </div>
//         ))}
//       </div>
//         );
//       }
//    /*  if (field.type === "select") {
//         return (
//             <div>
//                 <label className="text-gray-400 block mb-1">{field.label}</label>
//                 <select
//                     className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
//                     onChange={(e) => handleChange(field.id, e.target.value)}
//                 >
//                     {field.options?.map((option) => (
//                         <option key={option}>{option}</option>
//                     ))}
//                 </select>
//             </div>
//         );
//     } */

//  /*        if (field.type === "select" ) {
//             return (
//                 <div>
//                     <label className="text-gray-400 block mb-1">{field.label}</label>
//                     <MultiSelectDropdown
//   options={field.options || []}
//   selectedValues={formData.owner}
//   onSelect={(option) => {
//     console.log("Current formData:", formData);
//     console.log("Option to add:", option);

//     // Check if the email already exists in formData.owner
//     const isDuplicate = formData.owner.includes(option);

//     if (!isDuplicate) {
//         // Add the email if it's not a duplicate
//         handleChange('owner', [...formData.owner, option]); // Store only email
//         console.log("Option added successfully:", option);
//     } else {
//         console.log("Duplicate option, not added:", option);
//     }
// }}
//   onRemove={(value) => {
//     handleChange('owner', 
//       formData.owner.filter(user => user !== value)
//     );
//   }}
// />
//                 </div>
//             );
//         } */

//             if (field.type === 'select') {
//                 if (field.searchable) {
//                   return (
//                     <div>
//                       <label className="text-gray-400 block mb-1">{field.label}</label>
//                       <MultiSelectDropdown
//                         options={field.options || []}
//                         selectedValues={formData.owner}
//                         onSelect={(option) => {
//                           console.log('Current formData:', formData);
//                           console.log('Option to add:', option);
            
//                           const isDuplicate = formData.owner.includes(option);
            
//                           if (!isDuplicate) {
//                             handleChange('owner', [...formData.owner, option]);
//                             console.log('Option added successfully:', option);
//                           } else {
//                             console.log('Duplicate option, not added:', option);
//                           }
//                         }}
//                         onRemove={(value) => {
//                           handleChange(
//                             'owner',
//                             formData.owner.filter((user) => user !== value)
//                           );
//                         }}
//                       />
//                     </div>
//                   );
//                 } else {
//                   return (
//                     <div>
//                       <label className="text-gray-400 block mb-1">{field.label}</label>
//                       <select
//                         className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
//                         onChange={(e) => handleChange(field.id, e.target.value)}
//                       >
//                         <option value="">Select {field.label}</option>
//                         {field.options?.map((option) => (
//                           <option key={option.value} value={option.value}>
//                             {option.label}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   );
//                 }
//               }
    

//               if (field.type === 'date' || field.type === 'time') {
//                 return (
//                   <div>
//                     <label className="text-gray-400 block mb-1">{field.label}</label>
//                     <input
//                       type={field.type}
//                       className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
//                       onChange={(e) => handleChange(field.id, e.target.value)}
//                     />
//                   </div>
//                 );
//               }
//         // if (field.type === "select") {
//         //     return (
//         //         <div>
//         //             <label className="text-gray-400 block mb-1">{field.label}</label>
//         //             <select
//         //                 className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
//         //                 onChange={(e) => handleChange(field.id, e.target.value)}
//         //             >
//         //                 <option value="">Select {field.label}</option> {/* Default option */}
//         //                 {field.options?.map((option) => (
//         //                     <option key={option.value} value={option.value}>{option.label}</option>
//         //                 ))}
//         //             </select>
//         //         </div>
//         //     );
//         // }

//         if (field.type === "boolean") {
//           return (
//               <div className="flex items-center justify-between">
//                   <span className="text-gray-400">{field.label}</span>
//                   <label className="relative inline-flex items-center cursor-pointer">
//                       <input
//                           type="checkbox"
//                           className="sr-only"
//                           onChange={(e) => handleChange(field.id, e.target.checked)} // <--- IMPORTANT: handleChange here
//                       />
//                       <div className="w-12 h-6 bg-gray-600 rounded-full transition-colors">
//                           <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform" />
//                       </div>
//                   </label>
//               </div>
//           );
//       }

   

//     return (
//         <div>
//             <label className="text-gray-400 block mb-1">{field.label}</label>
//             <input
//                 type={field.type}
//                 placeholder={field.placeholder}
//                 className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
//                 onChange={(e) => handleChange(field.id, e.target.value)}
//             />

//           {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}

//         </div>
//     );
// }

interface SectionToggleProps {
    label: string;
    enabled: boolean;
    onChange: () => void;
    field: FormField;       // To identify the field and its ID
    handleChange: (id: string, value: any) => void; // 
}
function SectionToggle({ label, enabled, onChange, field, handleChange }: SectionToggleProps) {
  return (
      <div className="flex items-center justify-between">
          <span className="text-gray-400">{label}</span>
          <label className="relative inline-flex items-center cursor-pointer">
              <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => { // Modified onChange handler
                      onChange();
                      console.log(field.id);
                       // Call the original visibility toggle function (passed as prop)
                      handleChange(field.id, e.target.checked); // **CRUCIAL: Call handleChange to update the form data value!**
                  }}
                  className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-green-400" : "bg-gray-600"}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`} />
              </div>
          </label>
      </div>
  );
}