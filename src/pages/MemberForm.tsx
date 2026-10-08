import { formatMoney } from '../lib/money';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Plan } from '../types';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateNextDueDate } from '../lib/dates';
import { useAuth } from '../contexts/AuthContext';
import SuccessModal from '../components/SuccessModal';

export default function MemberForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isEditing = Boolean(id);

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
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Success Modal State
  const [showModal, setShowModal] = useState(false);
  const [createdMember, setCreatedMember] = useState<{id: string, name: string, phone: string, groupUrl: string | null, magicLink?: string | null} | null>(null);

  // Initial Payment States (New Member Only)
  const [payAdmissionFee, setPayAdmissionFee] = useState(true);
  const [payPlanFee, setPayPlanFee] = useState(true);
  const [globalAdmissionFee, setGlobalAdmissionFee] = useState(500);
  const [admissionFeeEditable, setAdmissionFeeEditable] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchPlans();
    if (isEditing) {
      fetchMember();
    }
  }, [id]);

  const fetchPlans = async () => {
    const { data } = await supabase.from('plans').select('*');
    if (data) {
      setPlans(data);
      if (!isEditing && data.length > 0) {
        setForm(f => ({ ...f, plan_id: data[0].id }));
      }
    }
    const { data: settings } = await supabase.from('settings').select('admission_fee, admission_fee_editable').single();
    if (settings && settings.admission_fee !== undefined) {
      setGlobalAdmissionFee(settings.admission_fee);
      setAdmissionFeeEditable(settings.admission_fee_editable !== false);
    }
  };

  const fetchMember = async () => {
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

    const anchor_day = parseInt(form.join_date.split('-')[2], 10);
    const selectedPlan = plans.find(p => p.id === form.plan_id);
    
    // If logging plan fee, calculate the real next due date, else they are due immediately
    let current_due_date = form.join_date;
    if (!isEditing && payPlanFee && selectedPlan) {
       current_due_date = calculateNextDueDate(anchor_day, form.join_date, selectedPlan.months);
    }

    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      join_date: form.join_date,
      anchor_day,
      plan_id: form.plan_id,
      current_due_date,
      has_trainer: form.has_trainer,
      trainer_name: form.has_trainer ? form.trainer_name : null,
      notes: form.notes || null,
    };

    if (isEditing) {
      // Dont update current_due_date on edit unless we are explicitly changing their cycle, which is risky
      const { current_due_date: _discard, ...editPayload } = payload;
      const { error } = await supabase.from('members').update(editPayload).eq('id', id);
      setLoading(false);
      if (!error) navigate(`/members/${id}`);
    } else {
      const { data: user } = await supabase.auth.getUser();
      const actorId = user.user?.id;

      let totalAmount = 0;
      let notes = [];
      const willPay = (payAdmissionFee || payPlanFee) && selectedPlan;
      if (willPay) {
        if (payAdmissionFee) {
          totalAmount += globalAdmissionFee;
          notes.push(`Admission: ₹${globalAdmissionFee}`);
        }
        if (payPlanFee) {
          totalAmount += selectedPlan.price;
          notes.push(`Plan: ₹${selectedPlan.price}`);
        }
      }

      const { data: newMember, error: memberError } = await supabase.from('members').insert(payload).select().single();

      let error = memberError;
      let newMemberId = newMember?.id;

      if (!error && newMemberId) {
        if (willPay && totalAmount > 0) {
          const { error: payError } = await supabase.from('payments').insert({
            member_id: newMemberId,
            amount: totalAmount,
            method: 'cash',
            paid_on: form.join_date,
            covers_from: form.join_date,
            covers_to: current_due_date,
            idempotency_key: crypto.randomUUID()
          });
          if (payError) console.error("Payment insert error:", payError);
        }

        await supabase.from('audit_log').insert({
          actor: actorId,
          action: 'create_member',
          entity: 'members',
          entity_id: newMemberId,
          meta: { name: payload.name, transactional: false }
        });
      }

      if (!error && newMemberId) {
        // Fetch URL for QR
        const { data: settings } = await supabase.from('settings').select('group_url_general, group_url_trainer').single();
        const url = payload.has_trainer ? settings?.group_url_trainer : settings?.group_url_general;

        let generatedMagicLink = null;
        if (payload.email) {
          try {
            const { data: inviteData } = await supabase.functions.invoke('invite-member', {
              body: { email: payload.email, name: payload.name, redirectTo: window.location.origin }
            });
            if (inviteData?.actionLink) {
              generatedMagicLink = inviteData.actionLink;
            }
          } catch (err) {
            console.error("Failed to invoke invite-member function", err);
          }
        }
        
        setCreatedMember({
          id: newMemberId,
          name: payload.name,
          phone: payload.phone,
          groupUrl: url || null,
          magicLink: generatedMagicLink
        });
        setShowModal(true);
      } else if (error) {
        toast.error(error?.message || 'Error creating member');
      }
      setLoading(false);
    }
  };

  const selectedPlanPrice = plans.find(p => p.id === form.plan_id)?.price || 0;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Member' : 'Add Member'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-red-200 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input 
              required 
              type="text" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Phone *</label>
            <input 
              required 
              type="tel" 
              value={form.phone} 
              onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Join Date *</label>
            <input 
              required 
              type="date" 
              value={form.join_date} 
              onChange={e => setForm({...form, join_date: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 min-h-[44px]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Plan *</label>
            {plans.length === 0 ? (
              <div className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex items-center justify-between">
                <span>No plans found. You must create one first.</span>
                <Link to="/settings" className="font-bold underline hover:text-red-700">Go to Settings</Link>
              </div>
            ) : (
              <select 
                required
                value={form.plan_id} 
                onChange={e => setForm({...form, plan_id: e.target.value})}
                className="w-full px-4 py-3 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 min-h-[44px] bg-white appearance-none"
              >
                <option value="" disabled>Select a plan...</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({formatMoney(p.price)} for {p.months}m)</option>
                ))}
              </select>
            )}
          </div>

          {!isEditing && plans.length > 0 && (
            <div className="sm:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm mb-2">Initial Payments (Optional)</h3>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input 
                    type="checkbox" 
                    checked={payAdmissionFee}
                    onChange={e => setPayAdmissionFee(e.target.checked)}
                    className="w-5 h-5 sm:w-4 sm:h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-gray-900 font-medium select-none">Admission Fee Paid</span>
                </label>
                {payAdmissionFee && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">₹</span>
                    <input 
                      type="number"
                      disabled={!admissionFeeEditable && role !== 'owner'}
                      value={globalAdmissionFee}
                      onChange={e => setGlobalAdmissionFee(parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={payPlanFee}
                  onChange={e => setPayPlanFee(e.target.checked)}
                  className="w-5 h-5 sm:w-4 sm:h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <span className="text-gray-900 font-medium select-none">Plan Fee Paid ({formatMoney(selectedPlanPrice)})</span>
              </label>

              {(payAdmissionFee || payPlanFee) && (
                <div className="pt-3 border-t border-gray-200 mt-2">
                  <div className="text-sm text-gray-700">
                    Total Collecting Today: <span className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded">{formatMoney((payAdmissionFee ? globalAdmissionFee : 0) + (payPlanFee ? selectedPlanPrice : 0))}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 sm:col-span-2 border-t border-gray-100 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.has_trainer}
                onChange={e => setForm({...form, has_trainer: e.target.checked})}
                className="w-5 h-5 sm:w-4 sm:h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
              <span className="text-gray-900 font-medium select-none">Has Personal Trainer?</span>
            </label>

            {form.has_trainer && (
              <div className="space-y-1 pl-8">
                <label className="block text-sm font-medium text-gray-700">Trainer Name *</label>
                <input 
                  required={form.has_trainer}
                  type="text" 
                  value={form.trainer_name} 
                  onChange={e => setForm({...form, trainer_name: e.target.value})}
                  className="w-full px-4 py-3 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 min-h-[44px]"
                />
              </div>
            )}
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea 
              rows={3}
              value={form.notes} 
              onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-red-100 flex justify-end">
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

      {createdMember && (
        <SuccessModal 
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            navigate('/');
          }}
          onGoToProfile={() => {
            setShowModal(false);
            navigate(`/members/${createdMember.id}`);
          }}
          memberName={createdMember.name}
          memberPhone={createdMember.phone}
          groupUrl={createdMember.groupUrl}
          magicLink={createdMember.magicLink}
        />
      )}
    </div>
  );
}
