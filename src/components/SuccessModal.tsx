import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, CheckCircle2, QrCode, ArrowRight, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToProfile: () => void;
  memberName: string;
  memberPhone: string;
  groupUrl: string | null;
}

export default function SuccessModal({ isOpen, onClose, onGoToProfile, memberName, memberPhone, groupUrl }: SuccessModalProps) {
  const defaultMsg = `Hi ${memberName}, welcome to Gym Addict 2.0!\n\nYou can view your membership details and receipt here:\n${window.location.origin}\n\nSee you at the gym!`;
  const [message, setMessage] = useState(defaultMsg);
  const [showQR, setShowQR] = useState(false);

  // Lazy load QRCode only if needed
  const QRCode = showQR ? React.lazy(() => import('qrcode.react').then(m => ({ default: m.QRCodeSVG }))) : null;

  const handleSend = () => {
    const phone = memberPhone.replace('+', '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-green-50 px-6 py-8 text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-green-700/50 hover:text-green-700 transition-colors">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Member Added</h2>
            <p className="text-green-800 font-medium">{memberName} has been successfully registered.</p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 bg-white">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                <span>Welcome Message (Editable)</span>
              </label>
              <textarea 
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none text-gray-600 leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSend}
                className="w-full bg-[#25D366] text-white h-12 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#1fae53] transition-colors shadow-sm"
              >
                <MessageCircle size={20} /> Send via WhatsApp
              </button>
              
              {groupUrl && (
                <button 
                  onClick={() => setShowQR(!showQR)}
                  className="w-full bg-white text-gray-700 border border-gray-200 h-12 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <QrCode size={20} /> {showQR ? 'Hide Group QR Code' : 'Show Group QR Code'}
                </button>
              )}
            </div>

            {showQR && groupUrl && QRCode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center pt-2">
                <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm mb-2">
                  <React.Suspense fallback={<div className="w-32 h-32 bg-gray-50 animate-pulse rounded-lg" />}>
                    <QRCode value={groupUrl} size={140} level="H" />
                  </React.Suspense>
                </div>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Scan to join group</span>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button 
              onClick={onGoToProfile}
              className="text-gray-600 font-medium text-sm flex items-center gap-1.5 hover:text-gray-900 transition-colors"
            >
              View Member Profile <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
