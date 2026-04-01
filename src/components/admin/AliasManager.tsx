import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getObjects, getObjectTypes } from '../../api/object';
import { getAliasesForObject, createAlias, deleteAlias } from '../../api/admin';
import { WytObject } from '../../api/types';
import ConfirmModal from './ConfirmModal';
import Pagination from './Pagination';

interface AliasManagerProps {
  createTrigger: number;
  onTriggerHandled?: () => void;
}

const AliasManager: React.FC<AliasManagerProps> = ({ createTrigger, onTriggerHandled }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filterType, setFilterType] = useState('All Types');
  const [selectedObject, setSelectedObject] = useState<WytObject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [rowValues, setRowValues] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => { }
  });
  const [newAliasName, setNewAliasName] = useState('');
  const [tempSourceId, setTempSourceId] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { data: objRes, isLoading: loadingObjects } = useQuery({
    queryKey: ['objects'],
    queryFn: () => getObjects(0, 1000)
  });
  const objects = objRes?.items || [];

  const { data: typeRes } = useQuery({
    queryKey: ['types'],
    queryFn: getObjectTypes
  });
  const types = typeRes?.items || [];

  const { data: aliasRes, isLoading: loadingAliases } = useQuery({
    queryKey: ['aliases', selectedObject?.id],
    queryFn: () => getAliasesForObject(selectedObject!.id),
    enabled: !!selectedObject
  });
  const aliases = aliasRes?.items || [];

  // Sync rows when aliases change
  React.useEffect(() => {
    if (aliasRes?.items) {
      const initialValues: Record<string, string> = {};
      aliasRes.items.forEach(a => {
        initialValues[a.id] = a.alias;
      });
      setRowValues(initialValues);
    }
  }, [aliasRes?.items]);

  // Watch for external create trigger
  React.useEffect(() => {
    if (createTrigger > 0) {
      setModalMode('create');
      setSelectedObject(null);
      setTempSourceId('');
      setNewAliasName('');
      setIsModalOpen(true);
      onTriggerHandled?.();
    }
  }, [createTrigger, onTriggerHandled]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async ({ id, alias }: { id: string; alias: string }) => {
      if (!selectedObject && modalMode !== 'create') throw new Error('No object selected');
      // Atomic Re-sync: Delete old and create new with same object_id
      await deleteAlias(id);
      return await createAlias({ object_id: selectedObject?.id || tempSourceId, alias });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aliases', selectedObject?.id || tempSourceId] });
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
    onError: () => {
      toast.error('Error synchronizing alias');
    }
  });

  const registerMutation = useMutation({
    mutationFn: (data: { object_id: string; alias: string }) => createAlias(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aliases', tempSourceId] });
      queryClient.invalidateQueries({ queryKey: ['objects'] });
      setNewAliasName('');
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error('Error registering alias');
    }
  });


  const clearAllAliasesMutation = useMutation({
    mutationFn: async (aliases: { id: string }[]) => {
      return Promise.all(aliases.map(a => deleteAlias(a.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    },
    onError: () => {
      toast.error('Error clearing aliases');
    }
  });

  const handleClearAllAliases = (obj: WytObject) => {
    if (!obj.aliases || obj.aliases.length === 0) {
      toast.error('No aliases to clear for this object.');
      return;
    }
    setConfirmState({
      isOpen: true,
      title: 'Clear All Aliases?',
      message: `Are you sure you want to delete ALL aliases for "${obj.name}"? The object itself will remain intact.`,
      confirmText: 'Yes, Clear All',
      onConfirm: () => clearAllAliasesMutation.mutate(obj.aliases!)
    });
  };

  const handleRowUpdate = (id: string) => {
    const val = rowValues[id]?.trim();
    if (!val) return;
    updateMutation.mutate({ id, alias: val });
  };

  const handleRowValueChange = (id: string, val: string) => {
    setRowValues(prev => ({ ...prev, [id]: val }));
  };


  const renderIcon = (iconStr: string | undefined, className = "text-xl") => {
    const icon = (iconStr || '').trim();
    if (icon.startsWith('http') || icon.startsWith('/uploads/')) {
      const src = icon.startsWith('http') ? icon : `http://localhost:8000${icon}`;
      return (
        <img
          src={src}
          alt=""
          className="w-8 h-8 object-contain rounded-lg"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fallback = document.createElement('span');
            fallback.className = `material-icons ${className} text-indigo-500`;
            fallback.innerText = 'category';
            e.currentTarget.parentElement?.appendChild(fallback);
          }}
        />
      );
    }
    const iconName = (!icon || icon.length < 3 || ['string', 'icon', 'none', 'null'].includes(icon.toLowerCase()))
      ? 'category'
      : icon;
    return <span className={`material-icons ${className} text-indigo-500`}>{iconName}</span>;
  };

  const handleOpenManager = (obj: WytObject, mode: 'view' | 'edit' = 'view') => {
    setSelectedObject(obj);
    setModalMode(mode);
    setIsModalOpen(true);
    if (mode === 'edit') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const filteredObjects = objects.filter(o => {
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All Types' || types.find(t => t.id === o.type_id)?.name === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredObjects.length / itemsPerPage);
  const paginatedObjects = filteredObjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  const totalAliases = objects.reduce((acc, o) => acc + (o.aliases?.length || 0), 0);
  const entitiesWithAliases = objects.filter(o => (o.aliases?.length || 0) > 0).length;

  const stats = [
    { label: 'Total Aliases', value: totalAliases, icon: 'label' },
    { label: 'Entities with Aliases', value: entitiesWithAliases, icon: 'inventory' },
    { label: 'All Types', value: types.length, icon: 'category' }
  ];

  return (
    <div className="p-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tighter">{stat.value}</h3>
              <div className="w-10 h-10 bg-gray-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-gray-400">
                <span className="material-icons">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-gray-50/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-gray-100 dark:border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search objects by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
          />
          <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
          className="px-6 py-3.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs font-semibold uppercase tracking-widest text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-center"
        >
          <option>All Types</option>
          {types.map(t => <option key={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full text-left font-sans">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
            <tr>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24">Icon</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Object Name</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aliases</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {loadingObjects ? (
              <tr><td colSpan={5} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-50/50 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Loading Objects...</span>
                </div>
              </td></tr>
            ) : filteredObjects.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 uppercase text-[10px] font-bold tracking-widest italic">No objects found</td></tr>
            ) : (
              paginatedObjects.map(obj => (
                <tr key={obj.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-all group">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors overflow-hidden">
                      {renderIcon(obj.icon)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white tracking-tight uppercase">{obj.name}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        {types.find(t => t.id === obj.type_id)?.name || obj.category || 'General'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-50 dark:bg-slate-900 text-gray-500 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-gray-100 dark:border-slate-700">
                      {types.find(t => t.id === obj.type_id)?.name || 'Default'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900 dark:text-white ml-0.5">
                      {obj.aliases?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenManager(obj, 'view')}
                        className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all active:scale-90"
                        title="View Aliases"
                      >
                        <span className="material-icons text-lg">visibility</span>
                      </button>
                      <button
                        onClick={() => handleOpenManager(obj, 'edit')}
                        className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all active:scale-90"
                        title="Edit Aliases"
                      >
                        <span className="material-icons text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleClearAllAliases(obj)}
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                        title="Clear All Aliases"
                      >
                        <span className="material-icons text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredObjects.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Management Modal */}
      {isModalOpen && (selectedObject || modalMode === 'create') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl p-12 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">
                  {modalMode === 'create' ? 'Create New Alias' : 'MANAGE ALIASES'}
                </h3>
                <p className="text-gray-400 font-medium mt-1">
                  {modalMode === 'create' ? 'Create a new alias for your knowledge graph' : 'Configuring aliases for'}{' '}
                  <span className="text-indigo-600 font-semibold">{selectedObject?.name}</span>
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Global Creation Fields */}
            {modalMode === 'create' && (
              <div className="bg-gray-50/50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] mb-8 border border-gray-100 dark:border-slate-800 flex-shrink-0 animate-in fade-in slide-in-from-top-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1 text-center">Select Object</label>
                    <select
                      value={tempSourceId}
                      onChange={(e) => setTempSourceId(e.target.value)}
                      style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                      className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl text-sm font-semibold outline-none transition-all dark:text-white text-center"
                    >
                      <option value="">Select Object</option>
                      {objects.map(obj => (
                        <option key={obj.id} value={obj.id}>{obj.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1 text-center">Add Alias</label>
                    <input
                      type="text"
                      placeholder="e.g. Laptop, Portable Computer"
                      value={newAliasName}
                      onChange={(e) => setNewAliasName(e.target.value)}
                      className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl text-sm font-semibold outline-none transition-all dark:text-white text-center"
                    />
                  </div>
                </div>
                <button
                  onClick={() => registerMutation.mutate({ object_id: tempSourceId, alias: newAliasName })}
                  disabled={!tempSourceId || !newAliasName || registerMutation.isPending}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-[12px] uppercase tracking-[0.2em] transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                >
                  {registerMutation.isPending ? 'Syncing...' : 'Create Alias'}
                </button>
              </div>
            )}

            {/* List with Inline Updating Rows */}
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingAliases ? (
                <div className="py-20 text-center">
                  <div className="w-8 h-8 border-4 border-indigo-50/50 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Querying Records...</span>
                </div>
              ) : (
                <>
                  {[...aliases].sort((a, b) => a.alias.localeCompare(b.alias)).map(alias => (
                    <div key={alias.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 px-8 py-5 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 transition-all shadow-sm">
                      <div className="flex-1">
                        <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-4">Current Entry</label>
                        <input
                          type="text"
                          value={rowValues[alias.id] || ''}
                          onChange={(e) => handleRowValueChange(alias.id, e.target.value)}
                          className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl text-xs font-semibold outline-none border border-transparent focus:border-indigo-500/20 dark:text-white transition-all"
                          readOnly={modalMode === 'view'}
                        />
                      </div>
                      {modalMode === 'edit' && (
                        <button
                          onClick={() => handleRowUpdate(alias.id)}
                          disabled={updateMutation.isPending && updateMutation.variables?.id === alias.id}
                          className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                        >
                          {updateMutation.isPending && updateMutation.variables?.id === alias.id ? '...' : 'Update'}
                        </button>
                      )}
                    </div>
                  ))}

                  {aliases.length === 0 && modalMode === 'view' && (
                    <div className="bg-gray-50/50 dark:bg-slate-900/50 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-100 dark:border-slate-800">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No linked records found</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Branded Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        isDestructive={true}
      />
    </div>
  );
};

export default AliasManager;
