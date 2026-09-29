import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, CreditCard, FileText, Smartphone } from 'lucide-react';
import { computeMemberStatus } from '../lib/dates';
import type { Member, Payment } from '../types';
import { QRCodeSVG } from 'qrcode.react';

export default function MemberDashboard() {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

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
      .single();

    if (memberData) {
      const { data: settings } = await supabase.from('settings').select('grace_days').single();
      memberData.status = computeMemberStatus(
        memberData.current_due_date,
        memberData.is_frozen,
        settings?.grace_days || 3
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

  // QR Code payload (could be used by owner to scan member in)
  const qrPayload = JSON.stringify({ id: member.id, name: member.name });

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'due_soon': return 'bg-yellow-100 text-yellow-800';
      case 'due': return 'bg-orange-100 text-orange-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'frozen': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {member.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ID / QR Card */}
        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm flex flex-col items-center text-center">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Digital Gym ID</h2>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 inline-block">
            <QRCodeSVG value={qrPayload} size={160} level="M" />
          </div>
          <p className="text-xs text-gray-500">Scan at the front desk to check in.</p>
        </div>

        {/* Status Card */}
        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm md:col-span-2 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Membership Status</h2>
              <div className="text-2xl font-bold text-gray-900">{member.plan?.name || 'No Plan'}</div>
            </div>
            <span className={`px-3 py-1 text-sm font-bold rounded-full uppercase ${getStatusColor(member.status)}`}>
              {member.status?.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Calendar size={14} /> Next Due Date</div>
              <div className="font-bold text-lg text-red-600">{member.current_due_date}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Smartphone size={14} /> Phone</div>
              <div className="font-medium text-gray-900">{member.phone}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard size={20} /> Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-gray-500 text-sm">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="p-3 font-semibold text-gray-600 text-sm">Date</th>
                  <th className="p-3 font-semibold text-gray-600 text-sm">Amount</th>
                  <th className="p-3 font-semibold text-gray-600 text-sm">Period Covered</th>
                  <th className="p-3 font-semibold text-gray-600 text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-sm">{p.paid_on}</td>
                    <td className="p-3 text-sm font-bold text-gray-900">₹{p.amount}</td>
                    <td className="p-3 text-sm text-gray-600">{p.covers_from} to {p.covers_to}</td>
                    <td className="p-3 text-sm text-green-600 font-medium flex items-center gap-1"><FileText size={14}/> Paid</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
