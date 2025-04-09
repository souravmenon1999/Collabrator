import React, { createContext, useContext, useState, ReactNode } from 'react';
import { taskFields, folderFields, spaceFields, FormField, topicFields } from '../types/types'; // Import topicFields

const modalFieldMap: Record<string, FormField[]> = {
  addTask: taskFields,
  addFolder: folderFields,
  editFolder: folderFields,
  addSpace: spaceFields,
  addTopic: folderFields,

};

interface ModalContextType {
  showModal: boolean;
  modalType: string;
  formFields: FormField[];
  modalProps: any; // Add modalProps here
  openModal: (type: string, props?: any) => void; // Update openModal signature
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [modalProps, setModalProps] = useState<any>(null); // Add modalProps state


  const openModal = (type: string, props?: any) => {
    setModalType(type);
    setFormFields(modalFieldMap[type] || []); // Dynamically set form fields
    setShowModal(true);
    setModalProps(props);
    console.log("ModalContext: openModal called", { type, props }); // Store props here

  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setFormFields([]); // Reset form fields when closing the modal
  };

  const value = {
    showModal,
    modalType,
    formFields,
    modalProps, // Include modalProps in value
    openModal,
    closeModal,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
