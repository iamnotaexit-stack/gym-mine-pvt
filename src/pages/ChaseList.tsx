import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Member } from '../types';
import { getCurrentISTDateString, calculateNextDueDate } from '../lib/dates';
import { CheckCircle, MessageCircle, Banknote, QrCode } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface ChaseItem {
  member: Member;
  offset: number;
  isSent: boolean;
}

export default function ChaseList() {
  const [items, setItems] = useState<ChaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, item: ChaseItem | null, method: 'cash' | 'upi' }>({ isOpen: false, item: null, method: 'cash' });

  useEffect(() => {
    fetchChaseList();
  }, []);

  const fetchChaseList = async () => {
    setLoading(true);
    const todayStr = getCurrentISTDateString();
    
    let offsets: number[] = [-3, 0, 1, 3, 7];
    let members: Member[] = [];
    let sentIds = new Set<string>();

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      const { mockMembers } = await import('../lib/mockData');
      members = mockMembers;
    } else {
      const { data: settings } = await supabase.from('settings').select('reminder_offsets').single();
      if (settings?.reminder_offsets) offsets = settings.reminder_offsets;

      const { data: membersData } = await supabase
        .from('members')
        .select('*, plan:plans(*)')
        .is('deleted_at', null)
        .eq('is_frozen', false);
      if (membersData) members = membersData;

      const { data: logs } = await supabase
        .from('reminder_log')
        .select('member_id')
        .eq('channel', 'whatsapp')
        .gte('sent_at', todayStr + 'T00:00:00Z');
      sentIds = new Set(logs?.map(l => l.member_id) || []);
    }

    const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();
    
    const needsReminder: { member: Member, offset: number }[] = [];
    
    for (const m of members) {
      if (m.email && m.email.trim().length > 0) continue;

      const dueMs = new Date(m.current_due_date + 'T00:00:00Z').getTime();
      const daysDiff = (dueMs - todayMs) / (1000 * 60 * 60 * 24);
      const currentOffset = -daysDiff;
      
      if (offsets.includes(currentOffset)) {
        needsReminder.push({ member: m, offset: currentOffset });
      }
    }

    const finalItems = needsReminder.map(r => ({
      ...r,
      isSent: sentIds.has(r.member.id)
    }));

    setItems(finalItems.sort((a, b) => a.offset - b.offset));
    setLoading(false);
  };

  const markSent = async (memberId: string, dueDate: string, offset: number) => {
    // Optimistic update
    setItems(items.map(i => i.member.id === memberId ? { ...i, isSent: true } : i));

    const kind = offset < 0 ? 'due_soon' : (offset === 0 ? 'due_today' : 'overdue');
    
    await supabase.from('reminder_log').insert({
      member_id: memberId,
      due_date: dueDate,
      kind,
      channel: 'whatsapp'
    });
  };

  const handleWhatsApp = (item: ChaseItem) => {
    const phone = item.member.phone.replace('+', '');
    const prefix = item.offset < 0 ? 'is due on' : (item.offset === 0 ? 'is due TODAY' : 'was due on');
    const msg = encodeURIComponent(`Hi ${item.member.name}, a gentle reminder that your gym fee ${prefix} ${item.member.current_due_date}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    
    if (!item.isSent) {
      markSent(item.member.id, item.member.current_due_date, item.offset);
    }
  };

  const handleQuickPay = async (item: ChaseItem, method: 'cash' | 'upi') => {
    setConfirmConfig({ isOpen: false, item: null, method: 'cash' });
    if (!item.member.plan) return;
    
    // Optimistically remove from list
    setItems(items.filter(i => i.member.id !== item.member.id));

    const amount = item.member.plan.price;
    const nextDue = calculateNextDueDate(item.member.anchor_day, item.member.current_due_date, item.member.plan.months);
    const todayStr = getCurrentISTDateString();

    if (import.meta.env.VITE_SUPABASE_URL !== undefined) {
      // 1. Insert Payment
      await supabase.from('payments').insert({
        member_id: item.member.id,
        amount,
        trainer_fee: 0,
        method,
        paid_on: todayStr,
        covers_from: item.member.current_due_date,
        covers_to: nextDue,
        note: 'Quick Pay from Chase List'
      });

      // 2. Update Member
      await supabase.from('members').update({ current_due_date: nextDue }).eq('id', item.member.id);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500 ">Loading chase list...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 ">Today's Chase List</h1>
      <p className="text-gray-600 ">Members without email who require manual WhatsApp reminders today.</p>

      {items.length === 0 ? (
        <div className="bg-white  p-8 rounded-xl border border-red-200  text-center text-gray-500  shadow-sm">
          No reminders needed today. Great job!
        </div>
      ) : (
        <div className="bg-white  rounded-xl border border-red-200  overflow-hidden shadow-sm">
          <ul className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <li key={`${item.member.id}-${idx}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white  transition-colors">
                <div>
                  <h3 className="font-semibold text-gray-900  text-lg">{item.member.name}</h3>
                  <div className="text-sm text-gray-500  flex gap-3 mt-1">
                    <span>Due: {item.member.current_due_date}</span>
                    <span className="font-medium text-red-600">
                      {item.offset < 0 ? `In ${Math.abs(item.offset)} days` : (item.offset === 0 ? 'Today' : `${item.offset} days late`)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  {item.isSent ? (
                    <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-red-50 text-red-700 font-medium rounded-lg min-h-[44px]">
                      <CheckCircle size={18} /> Sent
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleWhatsApp(item)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 min-h-[44px]"
                    >
                      <MessageCircle size={18} /> WhatsApp
                    </button>
                  )}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => item.member.plan ? setConfirmConfig({ isOpen: true, item, method: 'upi' }) : alert("No plan")}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-3 sm:py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 min-h-[44px] text-sm border border-green-200"
                    >
                      <QrCode size={16} /> UPI
                    </button>
                    <button 
                      onClick={() => item.member.plan ? setConfirmConfig({ isOpen: true, item, method: 'cash' }) : alert("No plan")}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-3 sm:py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 min-h-[44px] text-sm border border-blue-200"
                    >
                      <Banknote size={16} /> Cash
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={`Confirm ${confirmConfig.method.toUpperCase()} Payment`}
        message={`Mark ₹${confirmConfig.item?.member.plan?.price} as paid for ${confirmConfig.item?.member.name}?`}
        confirmText="Confirm Payment"
        onConfirm={() => confirmConfig.item && handleQuickPay(confirmConfig.item, confirmConfig.method)}
        onCancel={() => setConfirmConfig({ isOpen: false, item: null, method: 'cash' })}
      />
    </div>
  );
}
