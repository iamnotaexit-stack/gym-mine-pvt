import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Member } from '../types';
import { Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';

export default function Trash() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchArchived();
  }, []);

  const fetchArchived = async () => {
    setLoading(true);

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      const { mockMembers } = await import('../lib/mockData');
      const fakeDeleted = [{
        ...mockMembers[0],
        id: 'fake-del-1',
        name: 'Old User (Mock)',
        deleted_at: new Date(Date.now() - 86400000 * 5).toISOString()
      }];
      setMembers(fakeDeleted);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('members')
      .select('*, plan:plans(*)')
      .not('deleted_at', 'is', null);

    if (!error && data) {
      setMembers(data);
    }
    setLoading(false);
  };

  const handleRestore = async (id: string) => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setMembers(members.filter(m => m.id !== id));
      return;
    }
    const { error } = await supabase.from('members').update({ deleted_at: null }).eq('id', id);
    if (!error) {
      setMembers(members.filter(m => m.id !== id));
    } else {
      alert('Failed to restore member');
    }
  };

  const handleHardDelete = async (id: string) => {
    setConfirmConfig({ isOpen: false, id: null });
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setMembers(members.filter(m => m.id !== id));
      return;
    }
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (!error) {
      setMembers(members.filter(m => m.id !== id));
    } else {
      alert('Failed to delete member. ' + error.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500 ">Loading trash...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 hover:bg-red-50 rounded-full text-gray-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 m-0">Trash (Archived)</h1>
      </div>

      {members.length === 0 ? (
        <div className="bg-white  p-8 rounded-xl border border-red-200  text-center text-gray-500 ">
          No archived members found.
        </div>
      ) : (
        <div className="bg-white  rounded-xl border border-red-200  overflow-hidden shadow-sm">
          <ul className="divide-y divide-gray-100">
            {members.map(m => (
              <li key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900  text-lg">{m.name}</h3>
                  <p className="text-sm text-gray-500 ">{m.phone} | Archived on {new Date(m.deleted_at!).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleRestore(m.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 min-h-[44px]"
                  >
                    <RefreshCw size={16} /> Restore
                  </button>
                  <button 
                    onClick={() => setConfirmConfig({ isOpen: true, id: m.id })}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 min-h-[44px]"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title="Permanently Delete Member"
        message="Are you sure you want to completely delete this member? This action cannot be undone."
        confirmText="Delete Permanently"
        onConfirm={() => confirmConfig.id && handleHardDelete(confirmConfig.id)}
        onCancel={() => setConfirmConfig({ isOpen: false, id: null })}
      />
    </div>
  );
}
