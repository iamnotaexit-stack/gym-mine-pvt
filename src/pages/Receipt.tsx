import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Payment } from '../types';
import { Printer, ArrowLeft, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

interface ReceiptData extends Payment {
  member: any;
}

export default function Receipt() {
  const { id } = useParams();
  const { t, regionInfo } = useLanguage();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [gymName, setGymName] = useState('Gym Addict 2.0');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      if (id === 'pay-mock-1') {
        setData({
          id: 'pay-mock-1',
          member_id: '1',
          amount: 1500,
          trainer_fee: 0,
          method: 'upi',
          paid_on: '2026-09-29',
          covers_from: '2026-09-29',
          covers_to: '2026-10-29',
          note: null,
          created_by: '2026-09-29T10:00:00Z',
          member: {
            id: '1',
            name: 'Rahul Sharma',
            phone: '+919876543210',
            email: 'rahul@example.com',
            join_date: '2026-08-15',
            current_due_date: '2026-10-15',
            anchor_day: 15,
            plan_id: 'plan-1',
            is_frozen: false,
            has_trainer: true,
            trainer_name: 'Alex Coach',
            notes: '',
            created_by: '',
            updated_at: '',
            deleted_at: null,
            plan: { name: '1 Month Standard' }
          }
        } as ReceiptData);
      } else {
        const { mockPayments, mockMembers } = await import('../lib/mockData');
        const p = mockPayments.find(x => x.id === id);
        if (p) {
          const m = mockMembers.find(x => x.id === p.member_id);
          setData({ ...p, member: m } as ReceiptData);
        }
      }
      return;
    }

    const { data: settings } = await supabase.from('settings').select('gym_name').single();
    if (settings) setGymName(settings.gym_name);

    const { data: payment } = await supabase
      .from('payments')
      .select('*, member:members(*, plan:plans(name))')
      .eq('id', id)
      .single();

    if (payment) setData(payment as ReceiptData);
  };

  if (!data) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  const total = data.amount + data.trainer_fee;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Non-printable controls */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link to={`/members/${data.member_id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <LanguageSelector variant="compact" />
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700 shadow-xs transition-colors"
        >
          <Printer size={18} /> {t('print_pdf')}
        </button>
      </div>

      {/* Printable Receipt Area */}
      <div className="bg-white p-8 sm:p-12 border border-red-200 print:border-none print:shadow-none print:p-0 shadow-sm rounded-xl">
        <div className="text-center mb-8 border-b-2 border-red-200 pb-8">
          <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-widest">{gymName}</h1>
          <p className="text-xs text-gray-500 font-semibold tracking-wider mt-1 flex items-center justify-center gap-1">
            <MapPin size={12} /> {regionInfo.city}, {regionInfo.state}
          </p>
          <p className="text-red-700 mt-2 font-bold tracking-wide uppercase text-sm">{t('payment_receipt')}</p>
        </div>

        <div className="flex justify-between items-start mb-8 text-sm sm:text-base">
          <div>
            <div className="text-gray-500 mb-1">{t('billed_to')}</div>
            <div className="font-bold text-gray-900 text-lg">{data.member.name}</div>
            <div className="text-gray-600">{data.member.phone}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 mb-1">{t('receipt_no')}</div>
            <div className="font-mono text-gray-900">{data.id.split('-')[0].toUpperCase()}</div>
            <div className="text-gray-500 mt-3 mb-1">{t('date_label')}</div>
            <div className="font-medium text-gray-900">{data.paid_on}</div>
          </div>
        </div>

        <table className="w-full text-left mb-8">
          <thead>
            <tr className="border-b-2 border-gray-800 text-gray-900">
              <th className="py-3 font-semibold w-2/3">{t('description_label')}</th>
              <th className="py-3 font-semibold text-right w-1/3">{t('amount_label')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-red-100">
              <td className="py-4">
                <div className="font-medium text-gray-900">{t('gym_membership')} ({data.member.plan?.name || '-'})</div>
                <div className="text-sm text-gray-500 mt-1">Covers: {data.covers_from} to {data.covers_to}</div>
              </td>
              <td className="py-4 text-right font-medium">₹{data.amount}</td>
            </tr>
            {data.trainer_fee > 0 && (
              <tr className="border-b border-red-100">
                <td className="py-4">
                  <div className="font-medium text-gray-900">{t('trainer_fee_label')}</div>
                </td>
                <td className="py-4 text-right font-medium">₹{data.trainer_fee}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end mb-12">
          <div className="w-1/2 sm:w-1/3">
            <div className="flex justify-between items-center text-lg font-bold text-gray-900 border-t-2 border-gray-800 pt-3">
              <span>{t('total_label')}</span>
              <span>₹{total}</span>
            </div>
            <div className="text-right text-sm text-gray-500 mt-2 uppercase">
              {t('paid_via')} {data.method}
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm mt-16 pt-8 border-t border-red-200">
          <p className="font-medium text-gray-700">{t('thank_you')}</p>
          <p className="mt-1 text-xs">{t('computer_generated')}</p>
        </div>
      </div>
      
      {/* Global styles for print via inline style block */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .max-w-2xl, .max-w-2xl * {
            visibility: visible;
          }
          .max-w-2xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
