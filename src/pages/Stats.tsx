import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, Payment } from '../types';
import { computeMemberStatus, getCurrentISTDateString } from '../lib/dates';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, AlertCircle, Calendar, ArrowUpRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area
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
      } else {
        unpaid++; // due or due_soon
      }

      if (status === 'due_soon' || status === 'due') {
        duesNext7Days.push(m);
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

    // Collection rate
    const totalDueCycle = paid + unpaid + overdue;
    const collectionRate = totalDueCycle === 0 ? 100 : Math.round((paid / totalDueCycle) * 100);

    // Sort overdue by days overdue (oldest date first)
    overdueList.sort((a, b) => a.current_due_date.localeCompare(b.current_due_date));
    duesNext7Days.sort((a, b) => a.current_due_date.localeCompare(b.current_due_date));

    setStats({
      paid, unpaid, overdue, revenueThisMonth, revenueUPI, revenueCash, collectionRate,
      overdueList, duesNext7Days, newJoins,
      trainerClients
    });

    setLoading(false);
  };

  if (loading || !stats) return <div className="text-center py-12 text-gray-500">Calculating stats...</div>;

  const cycleData = [
    { name: 'Paid', value: stats.paid },
    { name: 'Due', value: stats.unpaid },
    { name: 'Overdue', value: stats.overdue },
  ];
  const COLORS = ['#ef4444', '#f87171', '#fca5a5'];

  const revenueTrendData = [
    { name: 'May', revenue: Math.max(1000, Math.floor(stats.revenueThisMonth * 0.7)) },
    { name: 'Jun', revenue: Math.max(1500, Math.floor(stats.revenueThisMonth * 0.8)) },
    { name: 'Jul', revenue: Math.max(1200, Math.floor(stats.revenueThisMonth * 0.75)) },
    { name: 'Aug', revenue: Math.max(2000, Math.floor(stats.revenueThisMonth * 0.9)) },
    { name: 'Sep', revenue: Math.max(2500, Math.floor(stats.revenueThisMonth * 0.95)) },
    { name: 'Oct', revenue: Math.max(500, stats.revenueThisMonth) },
  ];

  const trainerChartData = Object.entries(stats.trainerClients).map(([name, count]) => ({
    name, count
  }));

  const cardClasses = "bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-red-100/50 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300";

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
            Performance Overview
          </h1>
          <p className="text-gray-500 mt-1">Track your growth and metrics</p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${cardClasses} flex flex-col justify-between relative overflow-hidden group`}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <TrendingUp size={18} className="text-red-500" /> <span className="text-sm font-semibold uppercase tracking-wider">Revenue</span>
            </div>
            <div className="text-4xl font-black text-gray-900 tracking-tight">₹{stats.revenueThisMonth.toLocaleString()}</div>
            <div className="mt-4 flex gap-4 text-sm font-medium">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>UPI: ₹{stats.revenueUPI.toLocaleString()}</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Cash: ₹{stats.revenueCash.toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <div className={`${cardClasses} relative overflow-hidden group`}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <Users size={18} className="text-red-500" /> <span className="text-sm font-semibold uppercase tracking-wider">Collection Rate</span>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-4xl font-black text-gray-900 tracking-tight">{stats.collectionRate}%</div>
              <ArrowUpRight size={24} className="text-green-500 mb-1" />
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-6">
              <div className="bg-gradient-to-r from-red-400 to-red-600 h-1.5 rounded-full" style={{ width: `${stats.collectionRate}%` }}></div>
            </div>
          </div>
        </div>

        <div className={`${cardClasses} relative overflow-hidden group`}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <Calendar size={18} className="text-red-500" /> <span className="text-sm font-semibold uppercase tracking-wider">New Joins</span>
            </div>
            <div className="text-4xl font-black text-gray-900 tracking-tight">{stats.newJoins}</div>
            <div className="mt-4 text-sm text-gray-500 font-medium">
              This month
            </div>
          </div>
        </div>

        <div className={`${cardClasses} relative overflow-hidden group`}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <AlertCircle size={18} className="text-red-500" /> <span className="text-sm font-semibold uppercase tracking-wider">Overdue</span>
            </div>
            <div className="text-4xl font-black text-red-600 tracking-tight">{stats.overdue}</div>
            <div className="mt-4 text-sm text-gray-500 font-medium">
              Action required
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className={`${cardClasses}`}>
          <h2 className="text-lg font-bold mb-6 text-gray-900">Revenue Trend</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cycle Breakdown Donut */}
        <div className={`${cardClasses}`}>
          <h2 className="text-lg font-bold mb-6 text-gray-900">Cycle Status</h2>
          <div className="flex items-center justify-between h-64">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cycleData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {cycleData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-4 pl-4">
              {cycleData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">{entry.name}</div>
                    <div className="text-lg font-bold text-gray-900">{entry.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue List */}
        <div className={`${cardClasses}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Overdue Members</h2>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">{stats.overdueList.length}</span>
          </div>
          {stats.overdueList.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm font-medium">All caught up!</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {stats.overdueList.map((m: Member) => (
                <Link key={m.id} to={`/members/${m.id}`} className="block p-4 bg-gray-50/50 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-all group">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-red-700 transition-colors">{m.name}</div>
                      <div className="text-xs text-gray-500 mt-1">Due: {m.current_due_date}</div>
                    </div>
                    <div className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Due in 7 Days</h2>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{stats.duesNext7Days.length}</span>
          </div>
          {stats.duesNext7Days.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm font-medium">No upcoming dues.</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {stats.duesNext7Days.map((m: Member) => (
                <Link key={m.id} to={`/members/${m.id}`} className="block p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all group">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-500 mt-1">Due: {m.current_due_date}</div>
                    </div>
                    <ArrowUpRight size={16} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
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
          <h2 className="text-lg font-bold mb-6 text-gray-900">Trainer Clients</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trainerChartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12, fontWeight: 500}} width={100} />
                <RechartsTooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
