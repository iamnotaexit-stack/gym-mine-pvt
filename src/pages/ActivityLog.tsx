import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  at: string;
  meta: any;
  actor: string;
  profiles: { name: string } | null;
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setLogs([
        {
          id: 'log1',
          action: 'create_member',
          entity: 'members',
          at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          actor: 'user1',
          meta: { name: 'Rahul Sharma' },
          profiles: { name: 'Admin (You)' }
        },
        {
          id: 'log2',
          action: 'collect_payment',
          entity: 'payments',
          at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          actor: 'user1',
          meta: { amount: 1500 },
          profiles: { name: 'Admin (You)' }
        },
        {
          id: 'log3',
          action: 'update_member',
          entity: 'members',
          at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          actor: 'user1',
          meta: { note: 'Upgraded to Trainer' },
          profiles: { name: 'Subadmin (Jane)' }
        }
      ] as any);
      setLoading(false);
      return;
    }

    // Note: requires relationship between audit_log.actor and profiles.id
    const { data } = await supabase
      .from('audit_log')
      .select('*, profiles(name)')
      .order('at', { ascending: false })
      .limit(100);

    if (data) setLogs(data as any);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-12 text-gray-500 ">Loading activity...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 hover:bg-red-50 rounded-full text-gray-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 m-0">Activity Log</h1>
      </div>
      
      {logs.length === 0 ? (
        <div className="bg-white  p-8 rounded-xl border border-red-200  text-center text-gray-500  shadow-sm">
          No activity recorded yet.
        </div>
      ) : (
        <div className="bg-white  rounded-xl border border-red-200  overflow-hidden shadow-sm">
          <ul className="divide-y divide-gray-100">
            {logs.map(log => (
              <li key={log.id} className="p-4 flex items-start gap-4 hover:bg-white  transition-colors">
                <div className="mt-1 text-gray-500 ">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 ">
                    <span className="font-bold">{log.profiles?.name || 'Unknown User'}</span>{' '}
                    {log.action.replace('_', ' ')} on {log.entity}
                  </div>
                  {log.meta && (
                    <div className="text-xs text-gray-500  mt-1 font-mono bg-gray-50  p-1.5 rounded w-max max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      {JSON.stringify(log.meta)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500  mt-1">
                    {new Date(log.at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
