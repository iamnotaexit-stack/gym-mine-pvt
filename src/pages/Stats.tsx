import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, Payment } from '../types';
import { computeMemberStatus, getCurrentISTDateString } from '../lib/dates';
import { Link } from 'react-router-dom';
import { TrendingUp, AlertCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

export default function Stats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const todayStr = getCurrentISTDateString();
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
    let members: Member[] = [];
    let payments: Payment[] = [];
    let graceDays = 3;

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      const { mockMembers, mockPayments } = await import('../lib/mockData');
      members = mockMembers;
      payments = mockPayments;
    } else {
      const { data: settings } = await supabase.from('settings').select('grace_days').single();
      graceDays = settings?.grace_days || 3;

      const { data: membersData } = await supabase
        .from('members')
        .select('*, plan:plans(*)')
        .is('deleted_at', null)
        .eq('is_frozen', false);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .like('paid_on', `${currentMonthPrefix}-%`);
        
      members = membersData || [];
      payments = paymentsData || [];
    }

    // Computations
    let paid = 0;
    let unpaid = 0; // due or due_soon
    let overdue = 0;
    let overdueAmount = 0;
    let pendingAmount = 0;
    let newJoins = 0;
    
    const overdueList: Member[] = [];
    const duesNext7Days: Member[] = [];
    
    const trainerClients: Record<string, number> = {};
    
    members.forEach(m => {
      const status = computeMemberStatus(m.current_due_date, false, graceDays);
      
      if (status === 'active') paid++;
      else if (status === 'overdue') {
        overdue++;
        overdueList.push(m);
        if (m.plan) overdueAmount += m.plan.price;
      } else {
        unpaid++; // due or due_soon
      }

      if (status === 'due_soon' || status === 'due') {
        duesNext7Days.push(m);
        if (m.plan) pendingAmount += m.plan.price;
      }
      
      if (m.join_date.startsWith(currentMonthPrefix)) {
        newJoins++;
      }

      if (m.has_trainer && m.trainer_name) {
        trainerClients[m.trainer_name] = (trainerClients[m.trainer_name] || 0) + 1;
      }
    });

    // Revenue
    let revenueUPI = 0;
    let revenueCash = 0;
    const revenueThisMonth = payments.reduce((acc, p) => {
      if (p.voided_at) return acc;
      const total = p.amount + p.trainer_fee;
      if (p.method === 'upi') revenueUPI += total;
      else if (p.method === 'cash') revenueCash += total;
      return acc + total;
    }, 0);

    // Collection rate removed as per user request.

    // Sort overdue by days overdue (oldest date first)
    overdueList.sort((a, b) => a.current_due_date.localeCompare(b.current_due_date));
    duesNext7Days.sort((a, b) => a.current_due_date.localeCompare(b.current_due_date));

    setStats({
      paid, unpaid, overdue, revenueThisMonth, revenueUPI, revenueCash,
      overdueList, duesNext7Days, newJoins, overdueAmount, pendingAmount,
      trainerClients
    });

    setLoading(false);
  };

  if (loading || !stats) return <div className="text-center py-12 text-gray-500">Calculating stats...</div>;

  const trainerChartData = Object.entries(stats.trainerClients).map(([name, count]) => ({
    name, count
  }));

  const cardClasses = "bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-red-100/50 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300";

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
            Overview
          </h1>
        </div>
      </div>

      {/* Top Metrics Cards - Compact on Mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        <div className={`${cardClasses} col-span-2 md:col-span-1 flex flex-col justify-between relative overflow-hidden group`}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 text-gray-500 mb-2 sm:mb-4">
              <TrendingUp size={16} className="text-red-500" /> <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Revenue</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">₹{stats.revenueThisMonth.toLocaleString()}</div>
            <div className="mt-2 sm:mt-4 flex gap-3 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></span>UPI: ₹{stats.revenueUPI.toLocaleString()}</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></span>Cash: ₹{stats.revenueCash.toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <div className={`${cardClasses} relative overflow-hidden group p-4`}>
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 text-gray-500 mb-2">
              <AlertCircle size={16} className="text-red-500" /> <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">{stats.overdue} <span className="text-sm font-medium text-red-400">members</span></div>
            <div className="mt-2 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg inline-block">
              ₹{stats.overdueAmount.toLocaleString()} Pending
            </div>
          </div>
        </div>

        <div className={`${cardClasses} relative overflow-hidden group p-4`}>
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 text-gray-500 mb-2">
              <Calendar size={16} className="text-red-500" /> <span className="text-xs font-semibold uppercase tracking-wider">New Joins</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{stats.newJoins}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Overdue List */}
        <div className={`${cardClasses}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Overdue Members</h2>
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">{stats.overdueList.length}</span>
          </div>
          {stats.overdueList.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm font-medium">All caught up!</div>
          ) : (
            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {stats.overdueList.map((m: Member) => (
                <Link key={m.id} to={`/members/${m.id}`} className="block p-3 bg-gray-50/50 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-all group">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-red-700 transition-colors">{m.name}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Due: {m.current_due_date}</div>
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                      {Math.floor((new Date().getTime() - new Date(m.current_due_date + 'T00:00:00Z').getTime()) / (1000 * 3600 * 24))} days late
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Due in 7 Days */}
        <div className={`${cardClasses}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Due in 7 Days</h2>
            <div className="flex gap-2 items-center"><span className="text-[10px] sm:text-xs font-bold text-gray-500">₹{stats.pendingAmount.toLocaleString()}</span><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">{stats.duesNext7Days.length}</span></div>
          </div>
          {stats.duesNext7Days.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm font-medium">No upcoming dues.</div>
          ) : (
            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {stats.duesNext7Days.map((m: Member) => (
                <Link key={m.id} to={`/members/${m.id}`} className="block p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all group">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm sm:text-base text-gray-900">{m.name}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Due: {m.current_due_date}</div>
                    </div>
                    <ArrowUpRight size={14} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trainer Clients Bar Chart */}
      {trainerChartData.length > 0 && (
        <div className={`${cardClasses}`}>
          <h2 className="text-base sm:text-lg font-bold mb-4 text-gray-900">Trainer Clients</h2>
          <div className="h-48 w-full">
            <ErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trainerChartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 11, fontWeight: 500}} width={80} />
                  <RechartsTooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
}
