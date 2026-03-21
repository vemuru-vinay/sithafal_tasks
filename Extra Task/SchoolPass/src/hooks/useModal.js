import { useState } from 'react';

export default function useModal() {
  const [modal, setModal] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showAlert = ({ type = 'info', title, message, confirmText = 'OK' }) => {
    return new Promise((resolve) => {
      setModal({
        visible: true,
        type, title, message, confirmText,
        showCancel: false,
        onConfirm: () => { setModal(m => ({ ...m, visible: false })); resolve(true); },
        onCancel:  () => { setModal(m => ({ ...m, visible: false })); resolve(false); },
      });
    });
  };

  const showConfirm = ({ type = 'warning', title, message, confirmText = 'Yes', cancelText = 'Cancel' }) => {
    return new Promise((resolve) => {
      setModal({
        visible: true,
        type, title, message, confirmText, cancelText,
        showCancel: true,
        onConfirm: () => { setModal(m => ({ ...m, visible: false })); resolve(true); },
        onCancel:  () => { setModal(m => ({ ...m, visible: false })); resolve(false); },
      });
    });
  };

  return { modal, showAlert, showConfirm };
}
