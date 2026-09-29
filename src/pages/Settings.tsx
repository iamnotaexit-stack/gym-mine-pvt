import { Settings as SettingsIcon, History, Trash2 } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 ">Settings</h1>

      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold border-b border-red-100 pb-2 flex items-center gap-2">
          <SettingsIcon size={20} className="text-red-600" /> General Settings
        </h2>
        
        <p className="text-gray-600">
          Settings configuration is disabled in the mockup preview.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold border-b border-red-100 pb-2">
          Admin Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/activity" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
            <div className="p-2 bg-gray-100 rounded-full text-gray-700">
              <History size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Activity Log</div>
              <div className="text-sm text-gray-500">View recent actions</div>
            </div>
          </a>
          
          <a href="/trash" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
            <div className="p-2 bg-gray-100 rounded-full text-gray-700">
              <Trash2 size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Trash / Archive</div>
              <div className="text-sm text-gray-500">Restore or delete members</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
