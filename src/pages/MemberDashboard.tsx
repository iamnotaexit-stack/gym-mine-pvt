import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, CreditCard, Smartphone } from 'lucide-react';
import { computeMemberStatus } from '../lib/dates';
import type { Member, Payment } from '../types';
import { QRCodeSVG } from 'qrcode.react';

export default function MemberDashboard() {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (user?.email) {
      fetchMemberData(user.email);
    }
  }, [user]);

  const fetchMemberData = async (email: string) => {
    // 1. Fetch member by email
    const { data: memberData } = await supabase
      .from('members')
      .select('*, plan:plans(*)')
      .eq('email', email)
      .is('deleted_at', null)
      .order('join_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (memberData) {
      const { data: settingsData } = await supabase.from('settings').select('*').single();
      setSettings(settingsData);
      
      memberData.status = computeMemberStatus(
        memberData.current_due_date,
        memberData.is_frozen,
        settingsData?.grace_days || 3
      );
      setMember(memberData);

      // 2. Fetch payments for this member
      const { data: payData } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberData.id)
        .order('paid_on', { ascending: false });
        
      if (payData) setPayments(payData);
    }
    
    setLoading(false);
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading your profile...</div>;

  if (!member) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-red-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Account Not Linked</h2>
        <p>We could not find a gym membership linked to your email address ({user?.email}).</p>
        <p className="mt-4">Please contact the gym owner.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-8">Member Portal</h1>

      {/* 1. Personal Info Section */}
      <div className="bg-white p-6 rounded-lg border-t-4 border-t-red-600 shadow-md">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Personal Info</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Name</div>
            <div className="text-xl font-bold text-gray-900">{member.name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Membership Plan</div>
            <div className="text-lg font-bold text-red-600">{member.plan?.name || 'No Plan'}</div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              <Calendar size={14} /> Next Due Date
            </div>
            <div className="font-bold text-gray-900">{member.current_due_date}</div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              <Smartphone size={14} /> Phone Number
            </div>
            <div className="font-medium text-gray-900">{member.phone}</div>
          </div>

          {member.has_trainer && member.trainer_name && (
            <div className="sm:col-span-2 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Personal Trainer</div>
              <div className="font-medium text-gray-900">{member.trainer_name}</div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Payment History Section */}
      <div className="bg-white p-6 rounded-lg border-t-4 border-t-red-600 shadow-md">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <CreditCard size={18} /> Payment Receipts
        </h2>
        
        {payments.length === 0 ? (
          <p className="text-gray-500 text-sm font-medium">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="p-3 font-bold text-gray-900 text-xs uppercase tracking-wider">Date</th>
                  <th className="p-3 font-bold text-gray-900 text-xs uppercase tracking-wider">Amount</th>
                  <th className="p-3 font-bold text-gray-900 text-xs uppercase tracking-wider">Period Covered</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-sm font-medium">{p.paid_on}</td>
                    <td className="p-3 text-sm font-black text-green-700 bg-green-50">₹{p.amount}</td>
                    <td className="p-3 text-sm text-gray-600">{p.covers_from} to {p.covers_to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. WhatsApp Group Joining Link/QR */}
      <div className="bg-white p-6 rounded-lg border-t-4 border-t-red-600 shadow-md flex flex-col items-center text-center justify-center">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">WhatsApp Community</h2>
        <p className="text-sm text-gray-600 mb-6 font-medium">Scan this code to join our official gym WhatsApp group.</p>
        
        {(member.has_trainer ? settings?.group_url_trainer : settings?.group_url_general) ? (
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 inline-block">
            <QRCodeSVG 
              value={member.has_trainer ? settings?.group_url_trainer : settings?.group_url_general} 
              size={180} 
              level="H" 
            />
          </div>
        ) : (
          <div className="text-gray-400 text-xs uppercase tracking-widest font-bold">
            No WhatsApp Group Configured
          </div>
        )}
      </div>
    </div>
  );
}
