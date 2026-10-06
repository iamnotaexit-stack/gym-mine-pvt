import { useEffect, useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { supabase } from '../lib/supabase';
import type { Member } from '../types';
import { computeMemberStatus } from '../lib/dates';
import { Search, Plus, Filter, Edit, Trash2, UserCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { mockMembers } from '../lib/mockData';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '../contexts/LanguageContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

type FilterType = 'All' | 'Paid' | 'Due soon' | 'Due' | 'Overdue' | 'Frozen' | 'Trainer clients';

export default function Members() {
  const { t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, type: 'archive' | 'trainer', id: string | null }>({ isOpen: false, type: 'archive', id: null });
  const navigate = useNavigate();
  const [parentRef] = useAutoAnimate();
  const [tableRef] = useAutoAnimate();

  const handleArchive = async (id: string) => {
    setConfirmConfig({ isOpen: false, type: 'archive', id: null });
    
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setMembers(members.filter(m => m.id !== id));
      return;
    }
    
    await supabase.from('members').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  };

  const handleUpgradeToTrainer = async (id: string) => {
    setConfirmConfig({ isOpen: false, type: 'trainer', id: null });
    
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setMembers(members.map(m => m.id === id ? { ...m, name: m.name + ' (Trainer)', is_frozen: true, status: 'frozen' } : m));
      return;
    }

    const m = members.find(x => x.id === id);
    if (!m) return;
    const newName = m.name.includes('(Trainer)') ? m.name : `${m.name} (Trainer)`;
    
    await supabase.from('members').update({ 
      is_frozen: true,
      name: newName,
      notes: (m.notes ? m.notes + '\n' : '') + 'Upgraded to Trainer on ' + new Date().toLocaleDateString()
    }).eq('id', id);
    
    fetchData();
  };
  

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    if (!import.meta.env.VITE_SUPABASE_URL) {
      try {
        const processed: Member[] = mockMembers.map(m => {
          const nextDue = m.current_due_date || m.join_date;
          return {
            ...m,
            next_due_date: nextDue,
            status: computeMemberStatus(nextDue, m.is_frozen, 3)
          };
        });
        setMembers(processed);
        setHasMore(false);
      } catch (err) {
        console.error('Mock data error:', err);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Fetch settings for grace days
    const { data: settings } = await supabase.from('settings').select('grace_days').single();

    // Fetch members with plans, using pagination
    const { data, error } = await supabase
      .from('members')
      .select('*, plan:plans(*)')
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE); // Fetch one extra to check if hasMore

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    let results = data || [];
    if (results.length > ITEMS_PER_PAGE) {
      setHasMore(true);
      results = results.slice(0, ITEMS_PER_PAGE);
    } else {
      setHasMore(false);
    }

    // Compute status
    const processed: Member[] = results.map(m => {
      const nextDue = m.current_due_date;
      return {
        ...m,
        next_due_date: nextDue,
        status: computeMemberStatus(nextDue, m.status === 'frozen', settings?.grace_days || 3)
      };
    });

    setMembers(processed);
    setLoading(false);
  };

  const filtered = members.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.phone.includes(search)) return false;
    
    switch (filter) {
      case 'Paid': return m.status === 'active';
      case 'Due soon': return m.status === 'due_soon';
      case 'Due': return m.status === 'due';
      case 'Overdue': return m.status === 'overdue';
      case 'Frozen': return m.status === 'frozen';
      case 'Trainer clients': return m.has_trainer;
      default: return true;
    }
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'due_soon': return 'bg-red-100 text-red-800';
      case 'due': return 'bg-red-100 text-red-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'frozen': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'active': return t('status_active');
      case 'due_soon': return t('status_due_soon');
      case 'due': return t('status_due');
      case 'overdue': return t('status_overdue');
      case 'frozen': return t('status_frozen');
      default: return status?.replace('_', ' ') || '';
    }
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'All', label: t('filter_all') },
    { value: 'Paid', label: t('filter_paid') },
    { value: 'Due soon', label: t('filter_due_soon') },
    { value: 'Due', label: t('filter_due') },
    { value: 'Overdue', label: t('filter_overdue') },
    { value: 'Frozen', label: t('filter_frozen') },
    { value: 'Trainer clients', label: t('filter_trainer_clients') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t('members_title')}</h1>
        <Link to="/members/add" className="bg-red-600 text-white px-4 py-3 sm:py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-red-700 w-full sm:w-auto justify-center min-h-[44px]">
          <Plus size={20} />
          {t('add_member')}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder={t('search_placeholder')} 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2 rounded-lg border border-red-300 focus:ring-2 focus:ring-red-500 min-h-[44px]"
          />
        </div>
        <div className="relative">
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value as FilterType)}
            className="w-full sm:w-48 appearance-none pl-4 pr-10 py-3 sm:py-2 bg-white rounded-lg border border-red-300 focus:ring-2 focus:ring-red-500 min-h-[44px]"
          >
            {filterOptions.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-red-200 shadow-sm flex flex-col gap-2">
              <Skeleton height={20} width="40%" />
              <Skeleton height={14} width="25%" />
              <div className="flex justify-between pt-2 border-t border-red-50">
                <Skeleton height={30} width={80} />
                <Skeleton height={30} width={80} />
                <Skeleton height={30} width={40} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:hidden gap-3" ref={parentRef}>
          {filtered.map(m => (
            <div key={m.id} onClick={() => navigate(`/members/${m.id}`)} className="cursor-pointer bg-white p-4 rounded-xl border border-red-200 shadow-sm hover:border-red-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{m.name}</h3>
                <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${getStatusColor(m.status)}`}>
                  {getStatusLabel(m.status)}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{m.phone}</div>
              <div className="flex justify-between items-end text-sm mb-4">
                <div className="text-gray-500">{m.plan?.name || '-'}</div>
                <div className="font-medium">{t('due_date_label')}: {m.next_due_date}</div>
              </div>
              
              {/* Mobile Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-red-100" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={(e) => { e.preventDefault(); navigate(`/members/${m.id}/edit`); }}
                  className="flex-1 py-2 flex items-center justify-center gap-1 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200"
                >
                  <Edit size={14} /> {t('edit')}
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); setConfirmConfig({ isOpen: true, type: 'trainer', id: m.id }); }}
                  className="flex-1 py-2 flex items-center justify-center gap-1 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100"
                >
                  <UserCheck size={14} /> {t('upgrade')}
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); setConfirmConfig({ isOpen: true, type: 'archive', id: m.id }); }}
                  className="w-10 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
             <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-red-200">{t('no_members_found')}</div>
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {!loading && (
        <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-red-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-red-200">
                <th className="p-4 font-semibold text-gray-600">{t('name')}</th>
                <th className="p-4 font-semibold text-gray-600">{t('phone')}</th>
                <th className="p-4 font-semibold text-gray-600">{t('plan')}</th>
                <th className="p-4 font-semibold text-gray-600">{t('status')}</th>
                <th className="p-4 font-semibold text-gray-600">{t('next_due')}</th>
                <th className="p-4 font-semibold text-gray-600 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filtered.map(m => (
                <tr key={m.id} className="border-b border-red-100 hover:bg-red-50/50 transition-colors">
                  <td className="p-4">
                    <Link to={`/members/${m.id}`} className="font-semibold text-red-600 hover:underline">
                      {m.name}
                    </Link>
                    {m.has_trainer && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Trainer</span>}
                  </td>
                  <td className="p-4 text-gray-600">{m.phone}</td>
                  <td className="p-4 text-gray-600">{m.plan?.name || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${getStatusColor(m.status)}`}>
                      {getStatusLabel(m.status)}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{m.next_due_date}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => { e.preventDefault(); navigate(`/members/${m.id}/edit`); }}
                        title={t('edit')}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors border border-transparent hover:border-gray-200"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); setConfirmConfig({ isOpen: true, type: 'trainer', id: m.id }); }}
                        title={t('upgrade')}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                      >
                        <UserCheck size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); setConfirmConfig({ isOpen: true, type: 'archive', id: m.id }); }}
                        title={t('delete_archive')}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">{t('no_members_found')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <button 
          disabled={page === 1} 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">Page {page}</span>
        <button 
          disabled={!hasMore} 
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.type === 'archive' ? 'Archive Member' : 'Upgrade to Trainer'}
        message={confirmConfig.type === 'archive' ? 'Are you sure you want to archive this member? They will be removed from active lists.' : 'Upgrade this member to a Trainer? This will freeze their membership so they stop billing.'}
        confirmText={confirmConfig.type === 'archive' ? 'Archive' : 'Upgrade'}
        onConfirm={() => confirmConfig.id && (confirmConfig.type === 'archive' ? handleArchive(confirmConfig.id) : handleUpgradeToTrainer(confirmConfig.id))}
        onCancel={() => setConfirmConfig({ isOpen: false, type: 'archive', id: null })}
      />
    </div>
  );
}
