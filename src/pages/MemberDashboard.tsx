import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, CreditCard, Smartphone, MapPin, Globe, Sparkles, LogOut } from 'lucide-react';
import { computeMemberStatus } from '../lib/dates';
import type { Member, Payment } from '../types';
import type { Language } from '../lib/translations';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../contexts/LanguageContext';

export default function MemberDashboard() {
  const { user, signOut } = useAuth();
  const { t, regionInfo, language, setLanguage } = useLanguage();
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'receipts' | 'community'>('profile');

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

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  if (!member) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-red-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Account Not Linked</h2>
        <p>We could not find a gym membership linked to your email address ({user?.email}).</p>
        <p className="mt-4">Please contact the gym owner.</p>
      </div>
    );
  }

  // Simple print function for a specific receipt
  const printReceipt = (p: Payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${p.paid_on}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #111; max-width: 600px; margin: auto; }
            h1 { color: #dc2626; margin-bottom: 5px; }
            .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f9f9f9; padding-bottom: 15px; }
            .label { color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .val { font-weight: bold; font-size: 16px; }
            .total { font-size: 24px; color: #166534; font-weight: 900; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Gym Addict 2.0</h1>
            <p style="color: #666; margin: 0;">Payment Receipt - Guwahati, Assam</p>
          </div>
          <div class="row">
            <div class="label">Member Name</div>
            <div class="val">${member.name}</div>
          </div>
          <div class="row">
            <div class="label">Date of Payment</div>
            <div class="val">${p.paid_on}</div>
          </div>
          <div class="row">
            <div class="label">Payment Method</div>
            <div class="val" style="text-transform: capitalize;">${p.method || 'Cash'}</div>
          </div>
          <div class="row">
            <div class="label">Period Covered</div>
            <div class="val">${p.covers_from} to ${p.covers_to}</div>
          </div>
          <div class="row" style="margin-top: 30px; border-bottom: 0;">
            <div class="label" style="font-size: 18px; color: #111;">Total Paid</div>
            <div class="total">₹${p.amount}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 space-y-6 pt-4 px-4 sm:px-0">
      <div className="bg-red-700 text-white p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black uppercase tracking-tight">{t('member_portal')}</h1>
            <span className="bg-red-900/40 text-red-100 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">
              Personal
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-red-200 font-medium">
            <MapPin size={13} className="text-red-300" />
            <span>{regionInfo.city}, {regionInfo.state}</span>
          </div>
        </div>
        
        <button 
          onClick={signOut}
          className="relative z-10 flex items-center gap-2 bg-red-800/50 hover:bg-red-800 px-4 py-2 rounded-xl transition-colors text-sm font-bold shadow-sm"
        >
          <LogOut size={16} /> {t('nav_logout')}
        </button>
        
        {/* Decorative background elements */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-red-600 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
      </div>

      {/* Local Guwahati Greeting Banner */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 rounded-xl shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-red-100 flex items-center gap-1">
            <Sparkles size={12} /> {regionInfo.localGreeting}
          </div>
          <div className="text-lg font-bold mt-0.5">{member.name}</div>
          <div className="text-xs text-red-100 mt-0.5">{regionInfo.tagline}</div>
        </div>
        <span className="text-2xl font-bold opacity-80 hidden sm:block">GA</span>
      </div>

      {/* 1. Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-lg border-t-4 border-t-red-600 shadow-md animate-in fade-in duration-300">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">{t('personal_info')}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{t('name')}</div>
              <div className="text-xl font-bold text-gray-900">{member.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{t('membership_plan')}</div>
              <div className="text-lg font-bold text-red-600">{member.plan?.name || '-'}</div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <Calendar size={14} /> {t('next_due_date')}
              </div>
              <div className="font-bold text-gray-900">{member.current_due_date}</div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <Smartphone size={14} /> {t('phone_number')}
              </div>
              <div className="font-medium text-gray-900">{member.phone}</div>
            </div>

            {member.has_trainer && member.trainer_name && (
              <div className="sm:col-span-2 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{t('personal_trainer')}</div>
                <div className="font-medium text-gray-900">{member.trainer_name}
            <div className="sm:col-span-2 pt-6 mt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-3 flex items-center gap-1">
                <Globe size={14} /> App Language
              </div>
              <div className="flex flex-wrap gap-2">
                {(['en', 'hi', 'as'] as Language[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLanguage(l)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      language === l
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {l === 'as' ? 'অসমীয়া' : (l === 'hi' ? 'हिंदी' : 'English')}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
          </div>
        </div>
      )}

      {/* 2. Receipts Tab */}
      {activeTab === 'receipts' && (
        <div className="bg-white p-6 rounded-lg border-t-4 border-t-red-600 shadow-md animate-in fade-in duration-300">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <CreditCard size={18} /> {t('payment_receipts')}
          </h2>
          
          {payments.length === 0 ? (
            <p className="text-gray-500 text-sm font-medium">No payments recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {payments.map(p => (
                <div key={p.id} className="border border-gray-100 rounded-lg p-4 hover:border-red-200 transition-colors shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{p.paid_on}</div>
                    <div className="text-lg font-black text-green-700">₹{p.amount}</div>
                    <div className="text-sm text-gray-600 mt-1">Covers: {p.covers_from} to {p.covers_to}</div>
                  </div>
                  <button 
                    onClick={() => printReceipt(p)}
                    className="w-full sm:w-auto bg-gray-900 text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors"
                  >
                    {t('download_btn')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Community Tab */}
      {activeTab === 'community' && (
        <div className="bg-white p-6 rounded-lg border-t-4 border-t-red-600 shadow-md flex flex-col items-center text-center justify-center animate-in fade-in duration-300">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{t('whatsapp_community')}</h2>
          <p className="text-sm text-gray-600 mb-6 font-medium">{t('community_scan_hint')}</p>
          
          {(member.has_trainer ? settings?.group_url_trainer : settings?.group_url_general) ? (
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 inline-block mb-4">
              <QRCodeSVG 
                value={member.has_trainer ? settings?.group_url_trainer : settings?.group_url_general} 
                size={220} 
                level="H" 
              />
            </div>
          ) : (
            <div className="text-gray-400 text-xs uppercase tracking-widest font-bold border border-dashed border-gray-200 p-8 rounded-lg w-full">
              No WhatsApp Group Configured
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-3xl mx-auto flex justify-around p-3">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 p-2 w-full rounded-lg transition-colors ${activeTab === 'profile' ? 'text-red-600' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('personal_info')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('receipts')}
            className={`flex flex-col items-center gap-1 p-2 w-full rounded-lg transition-colors ${activeTab === 'receipts' ? 'text-red-600' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <CreditCard size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('payment_receipts')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center gap-1 p-2 w-full rounded-lg transition-colors ${activeTab === 'community' ? 'text-red-600' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('whatsapp_community')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
