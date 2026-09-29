import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Plan } from '../types';
import { ArrowLeft, Save, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MemberForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  const [form, setForm] = useState({
    name: '',
    phone: '+91',
    email: '',
    join_date: new Date().toISOString().split('T')[0],
    plan_id: '',
    has_trainer: false,
    trainer_name: '',
    notes: ''
  });

  const [showQR, setShowQR] = useState(false);
  const [createdName, setCreatedName] = useState('');
  const [groupUrl, setGroupUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    if (isEditing) {
      fetchMember();
    }
  }, [id]);

  const fetchPlans = async () => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      const mockPlans = [
        { id: 'plan-1', name: '1 Month Standard', months: 1, price: 1500, created_at: '' },
        { id: 'plan-2', name: '3 Months Pro', months: 3, price: 4000, created_at: '' },
        { id: 'plan-3', name: '1 Year Elite', months: 12, price: 12000, created_at: '' },
      ];
      setPlans(mockPlans);
      if (!isEditing && !form.plan_id) {
        setForm(f => ({ ...f, plan_id: mockPlans[0].id }));
      }
      return;
    }

    const { data } = await supabase.from('plans').select('*').order('months');
    if (data) {
      setPlans(data);
      if (!isEditing && data.length > 0 && !form.plan_id) {
        setForm(f => ({ ...f, plan_id: data[0].id }));
      }
    }
  };

  const fetchMember = async () => {
    if (!id) return;
    
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      const { mockMembers } = await import('../lib/mockData');
      const m = mockMembers.find(x => x.id === id);
      if (m) {
        setForm({
          name: m.name,
          phone: m.phone,
          email: m.email || '',
          join_date: m.join_date,
          plan_id: m.plan_id,
          has_trainer: m.has_trainer,
          trainer_name: m.trainer_name || '',
          notes: m.notes || ''
        });
      }
      return;
    }

    const { data } = await supabase.from('members').select('*').eq('id', id).single();
    if (data) {
      setForm({
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        join_date: data.join_date,
        plan_id: data.plan_id,
        has_trainer: data.has_trainer,
        trainer_name: data.trainer_name || '',
        notes: data.notes || ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let normalizedPhone = form.phone.replace(/\s+/g, '');
    if (!normalizedPhone.startsWith('+')) {
      if (normalizedPhone.length === 10) normalizedPhone = '+91' + normalizedPhone;
    }

    const payload = {
      name: form.name,
      phone: normalizedPhone,
      email: form.email || null,
      join_date: form.join_date,
      current_due_date: form.join_date,
      anchor_day: Math.min(31, parseInt(form.join_date.split('-')[2], 10)),
      plan_id: form.plan_id,
      is_frozen: false,
      has_trainer: form.has_trainer,
      trainer_name: form.has_trainer ? form.trainer_name : null,
      notes: form.notes || null,
    };

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      // Mock save
      setTimeout(() => {
        if (isEditing) {
          navigate(`/members/${id}`);
        } else {
          setCreatedName(form.name);
          setGroupUrl("https://chat.whatsapp.com/mock-invite-link");
          setShowQR(true);
        }
        setLoading(false);
      }, 500);
      return;
    }

    if (isEditing) {
      const { error } = await supabase.from('members').update(payload).eq('id', id);
      setLoading(false);
      if (!error) navigate(`/members/${id}`);
    } else {
      const { error } = await supabase.from('members').insert(payload);
      if (!error) {
        // Log activity
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          await supabase.from('audit_log').insert({
            actor: user.user.id,
            action: 'create_member',
            entity: 'members',
            entity_id: '00000000-0000-0000-0000-000000000000', 
            meta: { name: payload.name }
          });
        }

        // If email exists, invite them via Edge Function
        if (payload.email) {
          try {
            await supabase.functions.invoke('invite-member', {
              body: { email: payload.email, name: payload.name }
            });
          } catch (err) {
            console.error("Failed to invoke invite-member function", err);
          }
        }
        
        // Fetch URL for QR
        const { data: settings } = await supabase.from('settings').select('group_url_general, group_url_trainer').single();
        const url = payload.has_trainer ? settings?.group_url_trainer : settings?.group_url_general;
        setGroupUrl(url || null);

        setCreatedName(form.name);
        setShowQR(true);
      }
      setLoading(false);
    }
  };

  if (showQR) {
    const QRCode = React.lazy(() => import('qrcode.react').then(m => ({ default: m.QRCodeSVG })));
    
    const handleSendWelcome = () => {
      const phone = form.phone.replace('+', '');
      const msg = encodeURIComponent(`Hi ${createdName}, welcome to FitPro!\n\nYou can view your membership, payments, and ID here:\nhttps://fitpro.app/portal/magic-link-demo\n\nSee you at the gym!`);
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    const handleDownloadQR = () => {
      const svg = document.getElementById("group-qr-code");
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const a = document.createElement("a");
        a.download = "FitPro-Group-QR.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
      <div className="bg-white p-8 rounded-xl shadow-xl border border-red-200 text-center max-w-md mx-auto mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Member Added!</h2>
        <p className="text-gray-600 mb-8"><strong>{createdName}</strong> has been successfully registered.</p>
        
        <div className="space-y-4 mb-8">
          <button 
            onClick={handleSendWelcome}
            className="w-full bg-[#25D366] text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1fae53] transition-colors shadow-sm"
          >
            <MessageCircle size={20} /> Send Magic Link (WhatsApp)
          </button>
          <p className="text-xs text-gray-500 px-4">
            Sends an automated welcome message containing their secure login link to the Member Portal.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-8 mb-8">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">WhatsApp Group Invite</h3>
          {groupUrl ? (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 inline-block">
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4 inline-block">
                <React.Suspense fallback={<div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg"></div>}>
                  <QRCode id="group-qr-code" value={groupUrl} size={192} level="H" />
                </React.Suspense>
              </div>
              <p className="text-sm text-gray-600 mb-4 font-medium">Scan to join the gym group</p>
              <button 
                onClick={handleDownloadQR}
                className="w-full bg-white text-gray-700 py-2 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
              >
                Download QR Code
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500 border border-dashed border-gray-300 bg-gray-50 p-6 rounded-xl">
              No WhatsApp Group URL configured in Settings.
            </div>
          )}
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors text-lg shadow-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 hover:bg-gray-100  rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600 " />
        </Link>
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Member' : 'Add Member'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white  p-6 rounded-xl shadow-sm border border-red-200  space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 ">Full Name *</label>
            <input 
              required 
              type="text" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300  focus:ring-2 focus:ring-red-500 min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 ">Phone *</label>
            <input 
              required 
              type="tel" 
              value={form.phone} 
              onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300  focus:ring-2 focus:ring-red-500 min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 ">Email (Optional)</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300  focus:ring-2 focus:ring-red-500 min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 ">Join Date *</label>
            <input 
              required 
              type="date" 
              value={form.join_date} 
              onChange={e => setForm({...form, join_date: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300  focus:ring-2 focus:ring-red-500 min-h-[44px]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 ">Plan *</label>
            <select 
              required
              value={form.plan_id} 
              onChange={e => setForm({...form, plan_id: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300 focus:ring-2 focus:ring-red-500 min-h-[44px] bg-white appearance-none"
            >
              <option value="" disabled>Select a plan...</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name} (₹{p.price} for {p.months}m)</option>
              ))}
            </select>
          </div>

          <div className="space-y-4 sm:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.has_trainer}
                onChange={e => setForm({...form, has_trainer: e.target.checked})}
                className="w-5 h-5 sm:w-4 sm:h-4 text-red-600 rounded border-red-300  focus:ring-red-500"
              />
              <span className="text-gray-900  font-medium select-none">Has Personal Trainer?</span>
            </label>

            {form.has_trainer && (
              <div className="space-y-1 pl-8">
                <label className="block text-sm font-medium text-gray-700 ">Trainer Name *</label>
                <input 
                  required={form.has_trainer}
                  type="text" 
                  value={form.trainer_name} 
                  onChange={e => setForm({...form, trainer_name: e.target.value})}
                  className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300  focus:ring-2 focus:ring-red-500 min-h-[44px]"
                />
              </div>
            )}
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 ">Notes</label>
            <textarea 
              rows={3}
              value={form.notes} 
              onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300  focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-red-100  flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto bg-red-600 text-white px-8 py-3 sm:py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Member'}
          </button>
        </div>
      </form>
    </div>
  );
}
