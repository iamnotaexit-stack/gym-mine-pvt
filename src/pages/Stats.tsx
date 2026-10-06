import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, Payment } from '../types';
import { computeMemberStatus, getCurrentISTDateString } from '../lib/dates';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, AlertCircle, Calendar } from 'lucide-react';

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
        .gte('paid_on', `${currentMonthPrefix}-01`);
        
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

    setStats({
      paid, unpaid, overdue, revenueThisMonth, revenueUPI, revenueCash, collectionRate,
      overdueList, duesNext7Days, newJoins,
      trainerClients
    });

    setLoading(false);
  };

  if (loading || !stats) return <div className="text-center py-12 text-gray-500 ">Calculating stats...</div>;

  const maxTrainerClients = Math.max(...Object.values(stats.trainerClients as Record<string, number>), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 ">Gym Dashboard</h1>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <TrendingUp size={16} /> <span className="text-sm font-medium">Revenue (Month)</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">₹{stats.revenueThisMonth.toLocaleString()}</div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
              <span className="text-green-600">UPI: ₹{stats.revenueUPI.toLocaleString()}</span>
              <span className="text-blue-600">Cash: ₹{stats.revenueCash.toLocaleString()}</span>
            </div>
            <div className="w-full flex h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500" style={{ width: `${(stats.revenueUPI / (stats.revenueThisMonth || 1)) * 100}%` }}></div>
              <div className="bg-blue-500" style={{ width: `${(stats.revenueCash / (stats.revenueThisMonth || 1)) * 100}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white  p-4 rounded-xl border border-red-200  shadow-sm">
          <div className="flex items-center gap-2 text-gray-500  mb-2">
            <Users size={16} /> <span className="text-sm font-medium">Collection Rate</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.collectionRate}%</div>
          {/* Simple SVG Progress Bar */}
          <div className="w-full bg-gray-50  rounded-full h-1.5 mt-2">
            <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${stats.collectionRate}%` }}></div>
          </div>
        </div>

        <div className="bg-white  p-4 rounded-xl border border-red-200  shadow-sm">
          <div className="flex items-center gap-2 text-gray-500  mb-2">
            <Calendar size={16} /> <span className="text-sm font-medium">New Joins (Month)</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.newJoins}</div>
        </div>

        <div className="bg-white  p-4 rounded-xl border border-red-200  shadow-sm">
          <div className="flex items-center gap-2 text-gray-500  mb-2">
            <AlertCircle size={16} /> <span className="text-sm font-medium">Overdue Cycle</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cycle Breakdown SVG Bar */}
        <div className="bg-white  p-6 rounded-xl border border-red-200  shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-900 ">Current Cycle Status</h2>
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 ">Paid</span>
              <span className="text-xl font-bold text-red-600">{stats.paid}</span>
            </div>
            <div className="flex flex-col border-l pl-4 border-red-100 ">
              <span className="text-sm text-gray-500 ">Due</span>
              <span className="text-xl font-bold text-red-500">{stats.unpaid}</span>
            </div>
            <div className="flex flex-col border-l pl-4 border-red-100 ">
              <span className="text-sm text-gray-500 ">Overdue</span>
              <span className="text-xl font-bold text-red-600">{stats.overdue}</span>
            </div>
          </div>
          
          <div className="w-full flex h-4 rounded-full overflow-hidden">
            <div className="bg-red-500" style={{ width: `${(stats.paid / (stats.paid + stats.unpaid + stats.overdue || 1)) * 100}%` }}></div>
            <div className="bg-red-400" style={{ width: `${(stats.unpaid / (stats.paid + stats.unpaid + stats.overdue || 1)) * 100}%` }}></div>
            <div className="bg-red-500" style={{ width: `${(stats.overdue / (stats.paid + stats.unpaid + stats.overdue || 1)) * 100}%` }}></div>
          </div>
        </div>

        {/* Trainer Clients SVG Chart */}
        <div className="bg-white  p-6 rounded-xl border border-red-200  shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-900 ">Trainer Clients</h2>
          {Object.entries(stats.trainerClients).length === 0 ? (
            <p className="text-gray-500  text-sm">No trainer clients yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.trainerClients).map(([trainer, count]: any) => (
                <div key={trainer}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 ">{trainer}</span>
                    <span className="text-gray-500 ">{count}</span>
                  </div>
                  <div className="w-full bg-gray-50  h-2 rounded-full">
                    <div 
                      className="bg-red-400 h-2 rounded-full" 
                      style={{ width: `${(count / maxTrainerClients) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overdue List */}
        <div className="bg-white  p-6 rounded-xl border border-red-200  shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-900 ">Overdue ({stats.overdueList.length})</h2>
          {stats.overdueList.length === 0 ? (
            <p className="text-gray-500  text-sm">No overdue members.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {stats.overdueList.map((m: Member) => (
                <Link key={m.id} to={`/members/${m.id}`} className="block p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900 ">{m.name}</div>
                    <div className="text-xs text-red-600">Due: {m.current_due_date}</div>
                  </div>
                  <div className="text-xs font-medium bg-white  px-2 py-1 rounded border border-red-100">
                    {Math.floor((new Date().getTime() - new Date(m.current_due_date + 'T00:00:00Z').getTime()) / (1000 * 3600 * 24))} days late
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Next 7 Days */}
        <div className="bg-white  p-6 rounded-xl border border-red-200  shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-gray-900 ">Due in 7 Days</h2>
            <div className="text-sm font-medium text-red-600">{stats.duesNext7Days.length} renewals in next 7d</div>
          </div>
          {stats.duesNext7Days.length === 0 ? (
            <p className="text-gray-500  text-sm">No dues in the next 7 days.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {stats.duesNext7Days.map((m: Member) => (
                <Link key={m.id} to={`/members/${m.id}`} className="block p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900 ">{m.name}</div>
                    <div className="text-xs text-red-600">Due: {m.current_due_date}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
