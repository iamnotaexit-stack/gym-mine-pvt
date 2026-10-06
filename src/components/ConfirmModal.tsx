import { Drawer } from 'vaul';


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
  
  
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 max-h-[85vh] z-[101] outline-none shadow-2xl">
          <div className="p-4 bg-white rounded-t-[20px] flex-1 pb-safe">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-6" />
            <div className="max-w-md mx-auto">
              <Drawer.Title className="font-bold text-xl text-gray-900 mb-2">
                {title}
              </Drawer.Title>
              <Drawer.Description className="text-gray-600 mb-6 text-sm">
                {message}
              </Drawer.Description>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onConfirm();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold min-h-[48px] rounded-xl transition-colors text-base"
                >
                  {confirmText}
                </button>
                <button
                  onClick={onCancel}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold min-h-[48px] rounded-xl transition-colors text-base"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
