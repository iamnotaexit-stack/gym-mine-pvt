import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Settings as SettingsIcon, 
  History, 
  Trash2, 
  Plus, 
  Save, 
  Trash as TrashIcon,
  Globe,
  MapPin,
  } from 'lucide-react';
import type { Plan } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

import LanguageSelector from '../components/LanguageSelector';

export default function Settings() {
  const { 
    t, 
    } = useLanguage();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newPlan, setNewPlan] = useState({ name: '', months: 1, price: 1000 });
  const [gymName, setGymName] = useState('');
  const [graceDays, setGraceDays] = useState(3);
  const [admissionFee, setAdmissionFee] = useState(500);
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
      setAdmissionFee(settings.admission_fee || 500);
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
      admission_fee: admissionFee,
      group_url_general: generalGroup,
      group_url_trainer: trainerGroup
    }).eq('id', (await supabase.from('settings').select('id').single()).data?.id);
    alert(t('saved_alert'));
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
      alert("Inviting sub-admins requires backend configuration for permissions. For now, you can add them via Supabase Dashboard directly!");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">{t('loading')}</div>;

  // Language-appropriate sample name to avoid mixed-script font rendering glitches
  

  return (
    <div className="max-w-4xl mx-auto sm:space-y-8 pb-12 bg-gray-50 sm:bg-transparent">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('settings_title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('settings_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100 text-xs font-semibold self-start sm:self-auto">
          <MapPin size={14} /> Guwahati, Assam
        </div>
      </div>

      
      {/* 0. APP SETTINGS */}
      <div className="bg-white sm:rounded-xl sm:border sm:border-red-200 sm:shadow-sm sm:p-6 p-4 border-b sm:border-none border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Globe size={18} className="text-gray-400" />
          <span>App UI Language</span>
        </div>
        <LanguageSelector variant="compact" />
      </div>

      {/* 1. GENERAL SETTINGS */}
      <div className="bg-white sm:rounded-xl sm:border sm:border-red-200 sm:shadow-sm sm:p-6 p-4 border-b sm:border-none border-gray-100 space-y-6">
        <h2 className="text-lg font-bold border-b border-red-100 pb-2 flex items-center gap-2 text-gray-900">
          <SettingsIcon size={20} className="text-red-600" /> {t('general_settings')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('gym_name')}</label>
            <input type="text" value={gymName} onChange={e => setGymName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('grace_days')}</label>
            <input type="number" value={graceDays} onChange={e => setGraceDays(parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admission_fee')}</label>
            <input type="number" value={admissionFee} onChange={e => setAdmissionFee(parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('general_group')}</label>
            <input type="url" placeholder="https://chat.whatsapp.com/..." value={generalGroup} onChange={e => setGeneralGroup(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('trainer_group')}</label>
            <input type="url" placeholder="https://chat.whatsapp.com/..." value={trainerGroup} onChange={e => setTrainerGroup(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <button onClick={handleSaveSettings} className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 shadow-xs transition-colors">
          <Save size={18} /> {t('save_settings_btn')}
        </button>
      </div>

      {/* 3. PLANS MANAGEMENT */}
      <div className="bg-white sm:rounded-xl sm:border sm:border-red-200 sm:shadow-sm sm:p-6 p-4 border-b sm:border-none border-gray-100 space-y-6">
        <h2 className="text-lg font-bold border-b border-red-100 pb-2 text-gray-900">{t('manage_plans')}</h2>
        
        <div className="space-y-3">
          {plans.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('no_plans_yet')}</p>
          ) : (
            plans.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <div className="font-bold text-gray-900">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.months} {t('months')} | ₹{p.price}</div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('plan_name')}</label>
            <input required type="text" placeholder="e.g. 3 Months Pro" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('months')}</label>
            <input required type="number" min="1" value={newPlan.months} onChange={e => setNewPlan({...newPlan, months: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('price')}</label>
            <input required type="number" min="0" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <button type="submit" className="w-full md:w-auto bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2 h-[42px] transition-colors">
            <Plus size={18} /> {t('add_plan')}
          </button>
        </form>
      </div>

      {/* 4. SUBADMINS MANAGEMENT */}
      <div className="bg-white sm:rounded-xl sm:border sm:border-red-200 sm:shadow-sm sm:p-6 p-4 border-b sm:border-none border-gray-100 space-y-6">
        <div>
          <h2 className="text-lg font-bold border-b border-red-100 pb-2 text-gray-900">{t('subadmins_title')}</h2>
          <p className="text-xs text-gray-500 mt-1">{t('subadmins_desc')}</p>
        </div>
        
        <div className="space-y-3">
          {subadmins.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('no_subadmins_yet')}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('trainer_name_label')}</label>
            <input required type="text" placeholder="Trainer Name" value={newSubadminName} onChange={e => setNewSubadminName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('trainer_email_label')}</label>
            <input required type="email" placeholder="trainer@gym.com" value={newSubadminEmail} onChange={e => setNewSubadminEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <button type="submit" className="w-full md:w-auto bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center gap-2 h-[42px] transition-colors">
            <Plus size={18} /> {t('invite_btn')}
          </button>
        </form>
      </div>

      {/* 5. ADMIN TOOLS */}
      <div className="bg-white sm:rounded-xl sm:border sm:border-red-200 sm:shadow-sm sm:p-6 p-4 border-b sm:border-none border-gray-100 space-y-4">
        <h2 className="text-lg font-bold border-b border-red-100 pb-2 text-gray-900">
          {t('admin_tools')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/#/activity" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
            <div className="p-2 bg-gray-100 rounded-full text-gray-700">
              <History size={20} />
            </div>
            <div>
              <div className="font-bold text-gray-900">{t('nav_activity')}</div>
              <div className="text-sm text-gray-500">{t('activity_log_desc')}</div>
            </div>
          </a>
          
          <a href="/#/trash" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
            <div className="p-2 bg-gray-100 rounded-full text-gray-700">
              <Trash2 size={20} />
            </div>
            <div>
              <div className="font-bold text-gray-900">{t('nav_trash')}</div>
              <div className="text-sm text-gray-500">{t('trash_desc')}</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
