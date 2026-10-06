import { formatMoney } from '../lib/money';
import { Drawer } from 'vaul';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Member, Payment } from '../types';
import { computeMemberStatus } from '../lib/dates';
import { ArrowLeft, Edit, MessageCircle, FileText, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

export default function MemberDetails() {
  const { getWhatsAppText } = useLanguage();
  const { id } = useParams();
  const { role } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmArchiveOpen, setIsConfirmArchiveOpen] = useState(false);
  const [voidDrawer, setVoidDrawer] = useState({ isOpen: false, paymentId: '' });
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      const { mockMembers, mockPayments } = await import('../lib/mockData');
      const m = mockMembers.find(x => x.id === id);
      if (m) {
        m.status = computeMemberStatus(m.current_due_date, m.is_frozen, 3);
        setMember(m);
      }
      
      if (role === 'owner') {
        const p = mockPayments.filter(x => x.member_id === id);
        setPayments(p);
      }
      
      setLoading(false);
      return;
    }
    
    // Fetch member
    const { data: memberData } = await supabase
      .from('members')
      .select('*, plan:plans(*)')
      .eq('id', id)
      .single();

    if (memberData) {
      const { data: settings } = await supabase.from('settings').select('grace_days').single();
      memberData.status = computeMemberStatus(
        memberData.current_due_date,
        memberData.status === 'frozen',
        settings?.grace_days || 3
      );
      setMember(memberData);
    }

    // Only owner can fetch payments
    if (role === 'owner') {
      const { data: payData } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', id)
        .order('paid_on', { ascending: false });
        
      if (payData) setPayments(payData);
    }
    
    setLoading(false);
  };

  const handleWhatsApp = () => {
    if (!member) return;
    const phone = member.phone.replace('+', '');
    const daysOffset = Math.floor((new Date().getTime() - new Date(member.current_due_date + 'T00:00:00Z').getTime()) / (1000 * 3600 * 24));
    const baseMsg = getWhatsAppText(member.name, member.current_due_date, daysOffset);
    const msg = encodeURIComponent(baseMsg);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleVoidPayment = (paymentId: string) => {
    setVoidReason('');
    setVoidDrawer({ isOpen: true, paymentId });
  };

  const submitVoidPayment = async () => {
    if (!voidReason.trim()) {
      toast.error('Reason is required');
      return;
    }
    
    const { error } = await supabase.from('payments').update({ 
      voided_at: new Date().toISOString(), 
      void_reason: voidReason 
    }).eq('id', voidDrawer.paymentId);
    
    if (!error) {
      setPayments(payments.map(p => p.id === voidDrawer.paymentId ? { ...p, voided_at: new Date().toISOString(), void_reason: voidReason } : p));
      fetchData();
      setVoidDrawer({ isOpen: false, paymentId: '' });
      toast.success('Payment voided');
    } else {
      toast.error(error.message);
    }
  };

  const toggleFreeze = async () => {
    if (!member) return;
    const { error } = await supabase.from('members').update({ is_frozen: !member.is_frozen }).eq('id', member.id);
    if (!error) {
      setMember({ ...member, is_frozen: !member.is_frozen });
      // Recompute status
      fetchData();
    }
  };


  if (loading) return <div className="text-center py-12 text-gray-500 ">Loading...</div>;
  if (!member) return <div className="text-center py-12 text-red-500">Member not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-gray-100  rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600 " />
        </Link>
        <h1 className="text-2xl font-bold flex-1">{member.name}</h1>
        <Link to={`/members/${id}/edit`} className="bg-white  text-gray-700  px-4 py-2 rounded-lg font-medium border border-red-300  hover:bg-white  flex items-center gap-2">
          <Edit size={16} /> Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="bg-white  p-6 rounded-xl border border-red-200  shadow-sm md:col-span-1 space-y-4">
          <div>
            <div className="text-sm text-gray-500 ">Phone</div>
            <div className="font-medium text-gray-900 ">{member.phone}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 ">Current Due Date</div>
            <div className="font-bold text-red-600 text-lg">{member.current_due_date}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 ">Status</div>
            <div className="font-medium capitalize">{member.status === 'frozen' ? 'Inactive' : member.status?.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 ">Plan</div>
            <div className="font-medium">{member.plan?.name || 'No Plan'}</div>
          </div>
          
          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={handleWhatsApp}
              className="w-full bg-red-500 text-white px-4 py-3 sm:py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-600 min-h-[44px]"
            >
              <MessageCircle size={18} /> WhatsApp Reminder
            </button>
            
            {role === 'owner' && (
              <>
                <Link 
                  to={`/payments/add/${id}`}
                  className="w-full bg-red-600 text-white px-4 py-3 sm:py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700 min-h-[44px]"
                >
                  <CreditCard size={18} /> Mark Paid
                </Link>
                <div className="flex gap-2">
                  <button 
                    onClick={toggleFreeze}
                    className="flex-1 bg-gray-50  text-gray-700  px-4 py-3 sm:py-2 rounded-lg font-semibold hover:bg-gray-100  min-h-[44px]"
                  >
                    {member.is_frozen ? 'Mark Active' : 'Mark Inactive'}
                  </button>
                  <button 
                    onClick={() => setIsConfirmArchiveOpen(true)}
                    className="flex-1 bg-red-50 text-red-700 px-4 py-3 sm:py-2 rounded-lg font-semibold hover:bg-red-100 min-h-[44px]"
                  >
                    Archive
                  </button>
                </div>
              </>
            )}

            {/* Subadmins can also archive */}
            {role === 'subadmin' && (
               <button 
                onClick={() => setIsConfirmArchiveOpen(true)}
                className="w-full bg-red-50 text-red-700 px-4 py-3 sm:py-2 rounded-lg font-semibold hover:bg-red-100 min-h-[44px]"
              >
                Archive Member
              </button>
            )}
          </div>
        </div>

        {/* Payments History (Owner Only) */}
        {role === 'owner' && (
          <div className="bg-white  p-6 rounded-xl border border-red-200  shadow-sm md:col-span-2">
            <h2 className="text-lg font-bold mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <p className="text-gray-500 ">No payments recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white  border-b border-red-200 ">
                      <th className="p-3 font-semibold text-gray-600  text-sm">Date</th>
                      <th className="p-3 font-semibold text-gray-600  text-sm">Amount</th>
                      <th className="p-3 font-semibold text-gray-600  text-sm">Covers To</th>
                      <th className="p-3 font-semibold text-gray-600  text-sm">Receipt</th>
<th className="p-3 font-semibold text-gray-600  text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className={`border-b border-red-100 ${p.voided_at ? "opacity-50 line-through" : ""}`}>
                        <td className="p-3 text-sm">{p.paid_on}</td>
                        <td className="p-3 text-sm font-medium">{formatMoney(p.amount)}</td>
                        <td className="p-3 text-sm text-gray-600 ">{p.covers_to}</td>
                        <td className="p-3 text-sm">
                          <Link to={`/receipt/${p.id}`} className="text-red-600 hover:underline flex items-center gap-1">
                            <FileText size={14} /> View
                          </Link>
                        </td>
                        <td className="p-3 text-sm">
                          {!p.voided_at && <button onClick={() => handleVoidPayment(p.id)} className="text-red-600 font-bold hover:underline">Void</button>}
                          {p.voided_at && <span className="text-xs text-gray-500">Voided: {p.void_reason}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      
      <Drawer.Root open={voidDrawer.isOpen} onOpenChange={(open) => !open && setVoidDrawer({ isOpen: false, paymentId: '' })}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 max-h-[85vh] z-[101] outline-none shadow-2xl">
            <div className="p-4 bg-white rounded-t-[20px] flex-1 pb-safe">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-6" />
              <div className="max-w-md mx-auto">
                <Drawer.Title className="font-bold text-xl text-gray-900 mb-2">Void Payment</Drawer.Title>
                <Drawer.Description className="text-gray-600 mb-6 text-sm">Please provide a reason for voiding this payment.</Drawer.Description>
                
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Reason for voiding..." 
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-gray-300 mb-4 focus:ring-2 focus:ring-red-500 outline-none"
                />

                <div className="flex flex-col gap-3">
                  <button onClick={submitVoidPayment} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold min-h-[48px] rounded-xl transition-colors text-base">
                    Confirm Void
                  </button>
                  <button onClick={() => setVoidDrawer({ isOpen: false, paymentId: '' })} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold min-h-[48px] rounded-xl transition-colors text-base">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <ConfirmModal 
        isOpen={isConfirmArchiveOpen}
        title="Archive Member"
        message={`Are you sure you want to archive ${member.name}? They will be removed from all active lists.`}
        confirmText="Archive"
        onConfirm={async () => {
          setIsConfirmArchiveOpen(false);
          if (import.meta.env.VITE_SUPABASE_URL !== undefined) {
            await supabase.from('members').update({ deleted_at: new Date().toISOString() }).eq('id', member.id);
          }
          window.location.href = '/';
        }}
        onCancel={() => setIsConfirmArchiveOpen(false)}
      />
    </div>
  );
}
