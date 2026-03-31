import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'No, Cancel',
  isDestructive = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 dark:border-slate-800 animate-in zoom-in slide-in-from-bottom-8 duration-300">
        <div className="text-center">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium italic leading-relaxed mb-10">
            {message}
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`w-full py-4 ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-red-100 dark:shadow-none`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-black text-xs uppercase tracking-widest transition-colors"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
