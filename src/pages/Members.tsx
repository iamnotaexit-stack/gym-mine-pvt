import { useEffect, useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { supabase } from '../lib/supabase';
import type { Member } from '../types';
import { computeMemberStatus } from '../lib/dates';
import { Search, Plus, Filter, Edit, Trash2, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '../contexts/LanguageContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from '@tanstack/react-table';

type FilterType = 'All' | 'Paid' | 'Due soon' | 'Due' | 'Overdue' | 'Frozen' | 'Trainer clients';
const ITEMS_PER_PAGE = 200;

export default function Members() {
  const { t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, type: 'archive' | 'trainer', id: string | null }>({ isOpen: false, type: 'archive', id: null });
  const navigate = useNavigate();
  const [parentRef] = useAutoAnimate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: settings } = await supabase.from('settings').select('grace_days').single();
    const graceDays = settings?.grace_days || 3;

    const { data, error } = await supabase
      .from('members')
      .select('*, plan:plans(*)')
      .is('deleted_at', null)
      .limit(ITEMS_PER_PAGE)
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const processed = (data || []).map(m => {
      const nextDue = m.current_due_date || m.join_date;
      return {
        ...m,
        next_due_date: nextDue,
        status: computeMemberStatus(nextDue, m.is_frozen, graceDays)
      };
    });

    setMembers(processed);
    setLoading(false);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50';
      case 'due_soon': return 'bg-amber-100/80 text-amber-700 border border-amber-200/50';
      case 'due': return 'bg-red-100/80 text-red-700 border border-red-200/50';
      case 'overdue': return 'bg-rose-100/80 text-rose-700 border border-rose-200/50';
      case 'frozen': return 'bg-slate-100/80 text-slate-700 border border-slate-200/50';
      default: return 'bg-slate-100/80 text-slate-700 border border-slate-200/50';
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

  const columnHelper = createColumnHelper<Member>();
  
  const columns = [
    columnHelper.accessor('name', {
      header: t('name'),
      cell: info => (
        <div className="flex items-center gap-2">
          <Link to={`/members/${info.row.original.id}`} className="font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors">
            {info.getValue()}
          </Link>
          {info.row.original.has_trainer && <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded shadow-sm border border-purple-200/50 tracking-wider">Trainer</span>}
        </div>
      )
    }),
    columnHelper.accessor('phone', {
      header: t('phone'),
      cell: info => <span className="text-gray-600 font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('plan.name', {
      header: t('plan'),
      cell: info => <span className="text-gray-600">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('status', {
      header: t('status'),
      cell: info => (
        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm ${getStatusColor(info.getValue())}`}>
          {getStatusLabel(info.getValue())}
        </span>
      )
    }),
    columnHelper.accessor('next_due_date', {
      header: t('next_due'),
      cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">{t('actions')}</div>,
      cell: info => (
        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.preventDefault(); navigate(`/members/${info.row.original.id}/edit`); }} className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-md transition-all border border-transparent hover:border-gray-200 shadow-sm" title={t('edit')}>
            <Edit size={16} />
          </button>
          <button onClick={(e) => { e.preventDefault(); setConfirmConfig({ isOpen: true, type: 'trainer', id: info.row.original.id }); }} className="p-1.5 text-purple-600 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-all border border-transparent hover:border-purple-200 shadow-sm" title={t('upgrade')}>
            <UserCheck size={16} />
          </button>
          <button onClick={(e) => { e.preventDefault(); setConfirmConfig({ isOpen: true, type: 'archive', id: info.row.original.id }); }} className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-md transition-all border border-transparent hover:border-rose-200 shadow-sm" title={t('delete_archive')}>
            <Trash2 size={16} />
          </button>
        </div>
      )
    })
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleArchive = async (id: string) => {
    await supabase.from('members').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    setMembers(members.filter(m => m.id !== id));
    setConfirmConfig({ isOpen: false, type: 'archive', id: null });
  };

  const handleUpgradeToTrainer = async (id: string) => {
    await supabase.from('members').update({ has_trainer: true, is_frozen: true }).eq('id', id);
    fetchData();
    setConfirmConfig({ isOpen: false, type: 'trainer', id: null });
  };

  return (
    <div className="space-y-6 pb-safe">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('members_title')}</h1>
        <Link to="/members/add" className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-700 w-full sm:w-auto justify-center shadow-md shadow-red-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
          <Plus size={20} />
          {t('add_member')}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder={t('search_placeholder')} 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-sm outline-none"
          />
        </div>
        <div className="relative min-w-[200px]">
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value as FilterType)}
            className="w-full appearance-none pl-4 pr-10 py-3 bg-white rounded-xl border border-gray-200 shadow-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-sm font-medium outline-none cursor-pointer"
          >
            {['All', 'Paid', 'Due soon', 'Due', 'Overdue', 'Frozen', 'Trainer clients'].map(f => (
              <option key={f} value={f}>{f === 'All' ? t('filter_all') : f}</option>
            ))}
          </select>
          <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 mt-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
              <Skeleton height={24} width="50%" />
              <Skeleton height={14} width="30%" />
              <div className="flex justify-between pt-3 border-t border-gray-50 mt-1">
                <Skeleton height={32} width={80} borderRadius={8} />
                <Skeleton height={32} width={80} borderRadius={8} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="grid grid-cols-1 md:hidden gap-3 mt-4" ref={parentRef}>
            {filtered.map(m => (
              <div key={m.id} onClick={() => navigate(`/members/${m.id}`)} className="group cursor-pointer bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all active:scale-[0.98]">
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors">{m.name}</h3>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${getStatusColor(m.status)}`}>
                    {getStatusLabel(m.status)}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-500 mb-3">{m.phone}</div>
                <div className="flex justify-between items-end text-sm mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100/50">
                  <div>
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">{t('plan')}</div>
                    <div className="font-medium text-gray-800">{m.plan?.name || '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">{t('next_due')}</div>
                    <div className="font-bold text-gray-900">{m.next_due_date}</div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                  <button onClick={(e) => { e.preventDefault(); navigate(`/members/${m.id}/edit`); }} className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 shadow-sm transition-colors">
                    <Edit size={16} /> Edit
                  </button>
                  <button onClick={(e) => { e.preventDefault(); setConfirmConfig({ isOpen: true, type: 'archive', id: m.id }); }} className="w-12 flex items-center justify-center text-rose-600 bg-white hover:bg-rose-50 rounded-xl border border-gray-200 hover:border-rose-200 shadow-sm transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 font-medium">No members found</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/80 shadow-lg shadow-gray-200/40">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="bg-gray-50/80 border-b border-gray-200/80">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="p-4 font-semibold text-xs uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:bg-gray-100/50 transition-colors" onClick={header.column.getToggleSortingHandler()}>
                        <div className="flex items-center gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ChevronUp size={14} className="text-red-500" />,
                            desc: <ChevronDown size={14} className="text-red-500" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody ref={parentRef}>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="group border-b border-gray-100/80 hover:bg-red-50/30 transition-all cursor-default">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="p-8 text-center text-gray-400 font-medium">
                      No members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

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
