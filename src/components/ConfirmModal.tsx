import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  
  // Prevent scrolling on body when open, but handle it manually and safely
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full sm:w-[400px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl pb-safe flex flex-col"
          >
            <div className="p-6">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-200 mb-6 sm:hidden" />
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {title}
              </h2>
              <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                {message}
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onConfirm();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold h-12 rounded-xl transition-colors text-base"
                >
                  {confirmText}
                </button>
                <button
                  onClick={onCancel}
                  className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-semibold h-12 rounded-xl transition-colors text-base"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
