import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Member } from '../types';
import { calculateNextDueDate, getCurrentISTDateString } from '../lib/dates';
import { ArrowLeft, Save } from 'lucide-react';

export default function PaymentForm() {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    amount: '',
    trainer_fee: '0',
    method: 'upi',
    paid_on: getCurrentISTDateString(),
    note: ''
  });

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  const fetchMember = async () => {
    if (!memberId) return;

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      const { mockMembers } = await import('../lib/mockData');
      const m = mockMembers.find(x => x.id === memberId);
      if (m) {
        setMember(m);
        if (m.plan) setForm(f => ({ ...f, amount: String(m.plan!.price) }));
      }
      return;
    }

    const { data } = await supabase.from('members').select('*, plan:plans(*)').eq('id', memberId).single();
    if (data) {
      setMember(data);
      if (data.plan) {
        setForm(f => ({ ...f, amount: String(data.plan.price) }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !member.plan) return;
    setLoading(true);

    const amountNum = parseInt(form.amount, 10);
    const trainerFeeNum = parseInt(form.trainer_fee, 10);
    
    // Calculate new dates
    const coversFrom = member.current_due_date;
    const newDueDate = calculateNextDueDate(member.anchor_day, coversFrom, member.plan.months);

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setTimeout(() => {
        setLoading(false);
        navigate(`/receipt/pay-mock-1`);
      }, 500);
      return;
    }

    const payload = {
      member_id: member.id,
      amount: amountNum,
      trainer_fee: trainerFeeNum,
      method: form.method,
      paid_on: form.paid_on,
      covers_from: coversFrom,
      covers_to: newDueDate,
      note: form.note || null
    };

    // Record payment and update member atomically via RPC
    const { data: payment, error } = await supabase.rpc('record_payment', {
      p_member_id: payload.member_id,
      p_amount: payload.amount,
      p_trainer_fee: payload.trainer_fee,
      p_method: payload.method,
      p_paid_on: payload.paid_on,
      p_covers_from: payload.covers_from,
      p_covers_to: payload.covers_to,
      p_note: payload.note,
      p_idempotency: crypto.randomUUID()
    });
    
    if (error) {
      console.error(error);
      alert(error.message || 'Failed to record payment');
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate(`/receipt/${payment.id}`);
  };

  if (!member) return <div className="text-center py-12 text-gray-500 ">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/members/${memberId}`} className="p-2 hover:bg-gray-100  rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600 " />
        </Link>
        <h1 className="text-2xl font-bold">Mark Paid: {member.name}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white  p-6 rounded-xl shadow-sm border border-red-200  space-y-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
          <div className="text-sm text-red-800">Plan: <strong>{member.plan?.name}</strong></div>
          <div className="text-sm text-red-800">Next due shifts from <strong>{member.current_due_date}</strong> to <strong>{calculateNextDueDate(member.anchor_day, member.current_due_date, member.plan?.months || 1)}</strong></div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 ">Date Paid *</label>
            <input 
              required 
              type="date" 
              value={form.paid_on} 
              onChange={e => setForm({...form, paid_on: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300  focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 ">Amount (₹) *</label>
            <input 
              required 
              type="number" 
              min="0"
              value={form.amount} 
              onChange={e => setForm({...form, amount: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300  focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 ">Trainer Fee (₹)</label>
            <input 
              type="number" 
              min="0"
              value={form.trainer_fee} 
              onChange={e => setForm({...form, trainer_fee: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300  focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 ">Method *</label>
            <select 
              required
              value={form.method} 
              onChange={e => setForm({...form, method: e.target.value})}
              className="w-full px-4 py-3 sm:py-2 rounded-lg border border-red-300  focus:ring-2 focus:ring-red-500 bg-white "
            >
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 ">Notes (Optional)</label>
            <input 
              type="text" 
              value={form.note} 
              onChange={e => setForm({...form, note: e.target.value})}
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
            {loading ? 'Saving...' : 'Save & Print Receipt'}
          </button>
        </div>
      </form>
    </div>
  );
}
