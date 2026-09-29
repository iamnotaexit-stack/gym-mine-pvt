import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, History, Trash2, Plus, Save, Trash as TrashIcon } from 'lucide-react';
import type { Plan } from '../types';

export default function Settings() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newPlan, setNewPlan] = useState({ name: '', months: 1, price: 1000 });
  const [gymName, setGymName] = useState('');
  const [graceDays, setGraceDays] = useState(3);
  const [generalGroup, setGeneralGroup] = useState('');
  const [trainerGroup, setTrainerGroup] = useState('');

  // Sub-admins
  const [subadmins, setSubadmins] = useState<{id: string, name: string, role: string}[]>([]);
  const [newSubadminEmail, setNewSubadminEmail] = useState('');
  const [newSubadminName, setNewSubadminName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Settings
    const { data: settings } = await supabase.from('settings').select('*').single();
    if (settings) {
      setGymName(settings.gym_name || '');
      setGraceDays(settings.grace_days || 3);
      setGeneralGroup(settings.group_url_general || '');
      setTrainerGroup(settings.group_url_trainer || '');
    }

    // Fetch Plans
    const { data: plansData } = await supabase.from('plans').select('*').order('price', { ascending: true });
    if (plansData) setPlans(plansData);

    // Fetch Subadmins (profiles where role = subadmin)
    const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'subadmin');
    if (profiles) setSubadmins(profiles);

    setLoading(false);
  };

  const handleSaveSettings = async () => {
    await supabase.from('settings').update({
      gym_name: gymName,
      grace_days: graceDays,
      group_url_general: generalGroup,
      group_url_trainer: trainerGroup
    }).eq('id', (await supabase.from('settings').select('id').single()).data?.id);
    alert('Settings saved!');
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('plans').insert(newPlan).select().single();
    if (data) {
      setPlans([...plans, data]);
      setNewPlan({ name: '', months: 1, price: 1000 });
    } else {
      alert('Error creating plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm("Are you sure? Members on this plan might be affected.")) {
      await supabase.from('plans').delete().eq('id', id);
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  const handleInviteSubadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // We reuse the edge function but pass role! Actually, our edge function forces 'member'.
      // For now, let's just alert that it requires Edge Function updates.
      alert("Inviting sub-admins requires backend configuration for permissions. For now, you can add them via Supabase Dashboard directly!");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* General Settings */}
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold border-b border-red-100 pb-2 flex items-center gap-2 text-gray-900">
          <SettingsIcon size={20} className="text-red-600" /> General Settings
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gym Name</label>
            <input type="text" value={gymName} onChange={e => setGymName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (Days)</label>
            <input type="number" value={graceDays} onChange={e => setGraceDays(parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">General WhatsApp Group URL</label>
            <input type="url" placeholder="https://chat.whatsapp.com/..." value={generalGroup} onChange={e => setGeneralGroup(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trainer WhatsApp Group URL</label>
            <input type="url" placeholder="https://chat.whatsapp.com/..." value={trainerGroup} onChange={e => setTrainerGroup(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <button onClick={handleSaveSettings} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2">
          <Save size={18} /> Save Settings
        </button>
      </div>

      {/* Plans Management */}
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold border-b border-red-100 pb-2 text-gray-900">Manage Plans</h2>
        
        <div className="space-y-3">
          {plans.length === 0 ? (
            <p className="text-gray-500 text-sm">No plans created yet.</p>
          ) : (
            plans.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <div className="font-bold text-gray-900">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.months} Months | ₹{p.price}</div>
                </div>
                <button onClick={() => handleDeletePlan(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <TrashIcon size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddPlan} className="pt-4 border-t border-gray-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
            <input required type="text" placeholder="e.g. 3 Months Pro" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Months</label>
            <input required type="number" min="1" value={newPlan.months} onChange={e => setNewPlan({...newPlan, months: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input required type="number" min="0" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <button type="submit" className="w-full md:w-auto bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2 h-[42px]">
            <Plus size={18} /> Add Plan
          </button>
        </form>
      </div>

      {/* Subadmins Management */}
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold border-b border-red-100 pb-2 text-gray-900">Sub-Admins / Trainers</h2>
        
        <div className="space-y-3">
          {subadmins.length === 0 ? (
            <p className="text-gray-500 text-sm">No sub-admins found.</p>
          ) : (
            subadmins.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="font-bold text-gray-900">{s.name}</div>
                <div className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold uppercase">{s.role}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleInviteSubadmin} className="pt-4 border-t border-gray-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required type="text" placeholder="Trainer Name" value={newSubadminName} onChange={e => setNewSubadminName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input required type="email" placeholder="trainer@gym.com" value={newSubadminEmail} onChange={e => setNewSubadminEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <button type="submit" className="w-full md:w-auto bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center gap-2 h-[42px]">
            <Plus size={18} /> Invite
          </button>
        </form>
      </div>

      {/* Admin Tools */}
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold border-b border-red-100 pb-2 text-gray-900">
          Admin Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/#/activity" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
            <div className="p-2 bg-gray-100 rounded-full text-gray-700">
              <History size={20} />
            </div>
            <div>
              <div className="font-bold text-gray-900">Activity Log</div>
              <div className="text-sm text-gray-500">View recent actions</div>
            </div>
          </a>
          
          <a href="/#/trash" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
            <div className="p-2 bg-gray-100 rounded-full text-gray-700">
              <Trash2 size={20} />
            </div>
            <div>
              <div className="font-bold text-gray-900">Trash / Archive</div>
              <div className="text-sm text-gray-500">Restore or delete members</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
