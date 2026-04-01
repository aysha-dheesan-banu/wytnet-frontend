import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getObjects, getObjectTypes } from '../../api/object';
import { getAllRelations, createRelation, deleteRelation, getRelationsForObject } from '../../api/admin';
import { WytObject } from '../../api/types';
import ConfirmModal from './ConfirmModal';
import Pagination from './Pagination';

interface RelationManagerProps {
  createTrigger: number;
  onTriggerHandled?: () => void;
}

const RelationManager: React.FC<RelationManagerProps> = ({ createTrigger, onTriggerHandled }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filterType, setFilterType] = useState('All Types');
  const [selectedObject, setSelectedObject] = useState<WytObject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [rowValues, setRowValues] = useState<Record<string, { related_id: string; type: string }>>({});
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
  const [tempSourceId, setTempSourceId] = useState('');
  const [tempTargetId, setTempTargetId] = useState('');
  const [tempRelationType, setTempRelationType] = useState('parent');

  // Watch for external create trigger
  React.useEffect(() => {
    if (createTrigger > 0) {
      setModalMode('create');
      setSelectedObject(null);
      setTempSourceId('');
      setTempTargetId('');
      setTempRelationType('parent');
      setIsModalOpen(true);
      onTriggerHandled?.();
    }
  }, [createTrigger, onTriggerHandled]);
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

  // Fetch ALL relations for a unified graph view
  const { data: allRelationsRes, isLoading: loadingRelations } = useQuery({
    queryKey: ['all-relations'],
    queryFn: () => getAllRelations().then(res => res.items || [])
  });

  const allRelations = allRelationsRes || [];

  // Filter relations where the selected object is either the source or the target
  const relations = selectedObject
    ? allRelations.filter(r => r.object_id === selectedObject.id || r.related_object_id === selectedObject.id)
    : [];

  // Sync rows when relations change
  React.useEffect(() => {
    if (relations.length > 0) {
      const initialValues: Record<string, { related_id: string; type: string }> = {};
      relations.forEach(r => {
        // If it's an incoming relation (where selected is target), the 'related_id' for editing is actually the source (object_id)
        const isIncoming = selectedObject && r.related_object_id === selectedObject.id;
        initialValues[r.id] = {
          related_id: isIncoming ? r.object_id : r.related_object_id,
          type: r.relation_type
        };
      });
      setRowValues(initialValues);
    }
  }, [relations, selectedObject]);

  // Mutations
  const updateRelationMutation = useMutation({
    mutationFn: async ({ id, related_id, type }: { id: string; related_id: string; type: string }) => {
      const existingRel = allRelations.find(r => r.id === id);
      if (!existingRel) throw new Error('Existing relation not found');

      // Atomic Re-sync: Delete old and create new
      await deleteRelation(id);

      // Maintain the correct direction:
      // If we are editing an incoming link (where selected is target), the new source remains the original source
      const isIncoming = selectedObject && existingRel.related_object_id === selectedObject.id;

      return await createRelation({
        object_id: isIncoming ? related_id : (selectedObject?.id || tempSourceId),
        related_object_id: isIncoming ? (selectedObject?.id || tempSourceId) : related_id,
        relation_type: type
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-relations'] });
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
    onError: (err) => {
      console.error('Failed to sync relation', err);
      toast.error('Failed to synchronize relation.');
    }
  });

  const connectMutation = useMutation({
    mutationFn: (data: { object_id: string; related_object_id: string; relation_type: string }) => createRelation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-relations'] });
      queryClient.invalidateQueries({ queryKey: ['objects'] });
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error('Error establishing connection');
    }
  });

  const getDynamicChildrenCount = (objId: string) => {
    return allRelations.filter(r =>
      (r.object_id === objId && r.relation_type === 'parent') ||
      (r.related_object_id === objId && r.relation_type === 'child')
    ).length;
  };

  const getDynamicParentsCount = (objId: string) => {
    return allRelations.filter(r =>
      (r.related_object_id === objId && r.relation_type === 'parent') ||
      (r.object_id === objId && r.relation_type === 'child')
    ).length;
  };

  const handleRowUpdate = (id: string) => {
    const val = rowValues[id];
    if (!val || !val.related_id || !val.type) return;
    updateRelationMutation.mutate({ id, related_id: val.related_id, type: val.type });
  };

  const handleRowValueChange = (id: string, field: 'related_id' | 'type', value: string) => {
    setRowValues(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleClearAllRelations = (obj: WytObject) => {
    setConfirmState({
      isOpen: true,
      title: 'Clear All Connections?',
      message: `Are you sure you want to delete ALL connections for "${obj.name}"? The object itself will remain intact.`,
      confirmText: 'Yes, Clear All',
      onConfirm: async () => {
        try {
          const rels = await getRelationsForObject(obj.id);
          const items = rels.items || [];
          if (items.length === 0) {
            toast.error('No relations to clear.');
            setConfirmState(prev => ({ ...prev, isOpen: false }));
            return;
          }
          await Promise.all(items.map((r: { id: string }) => deleteRelation(r.id)));
          queryClient.invalidateQueries({ queryKey: ['objects'] });
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          toast.success(`Successfully cleared ${items.length} connections for ${obj.name}.`);
        } catch (err) {
          toast.error('Error clearing relations');
        }
      }
    });
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

  const stats = [
    { label: 'Total Entities', value: objects.length, icon: 'inventory_2' },
    { label: 'Total Relations', value: allRelations.length, icon: 'share' },
    { label: 'Linked Objects', value: objects.filter(o => getDynamicChildrenCount(o.id) > 0 || getDynamicParentsCount(o.id) > 0).length, icon: 'hub' },
    { label: 'Standalone Objects', value: objects.filter(o => getDynamicChildrenCount(o.id) === 0 && getDynamicParentsCount(o.id) === 0).length, icon: 'blur_off' }
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
            placeholder="Search catalog by entity name..."
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
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entity Name</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Classification</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Children</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Parents</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {loadingObjects ? (
              <tr><td colSpan={6} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-50/50 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-widest">Hydrating Catalog...</span>
                </div>
              </td></tr>
            ) : filteredObjects.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-20 text-center text-gray-400 uppercase text-[10px] font-semibold tracking-widest italic">No catalog matches</td></tr>
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
                        {obj.category && !['generic', 'system node', 'none', 'null', 'string'].includes(obj.category.toLowerCase().trim())
                          ? obj.category
                          : types.find(t => t.id === obj.type_id)?.name || 'Generic Object'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-50 dark:bg-slate-900 text-gray-500 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-gray-100 dark:border-slate-700">
                      {types.find(t => t.id === obj.type_id)?.name || 'Generic'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                      {getDynamicChildrenCount(obj.id)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                      {getDynamicParentsCount(obj.id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenManager(obj, 'view')}
                        className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all active:scale-90"
                        title="View Relations"
                      >
                        <span className="material-icons text-lg">visibility</span>
                      </button>
                      <button
                        onClick={() => handleOpenManager(obj, 'edit')}
                        className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all active:scale-90"
                        title="Edit Relations"
                      >
                        <span className="material-icons text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleClearAllRelations(obj)}
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                        title="Clear All Connections"
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
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl p-12 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">

            <div className="flex justify-between items-start mb-8 flex-shrink-0">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">
                  {modalMode === 'create' ? 'Create Relation' : 'RELATION HUB'}
                </h3>
                <p className="text-gray-400 font-medium mt-1">
                  {modalMode === 'create' ? 'Establish a new connection in the graph' : 'Linking nomenclature for'}{' '}
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
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1 text-center">Select Relation Object</label>
                    <select
                      value={tempTargetId}
                      onChange={(e) => setTempTargetId(e.target.value)}
                      style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                      className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl text-sm font-semibold outline-none transition-all dark:text-white text-center"
                    >
                      <option value="">Select Object</option>
                      {objects.filter(o => o.id !== tempSourceId).map(obj => (
                        <option key={obj.id} value={obj.id}>{obj.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1 text-center">Define Edge Label</label>
                  <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border-2 border-transparent focus-within:border-indigo-500/20 transition-all">
                    {['parent', 'child', 'similar'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTempRelationType(t)}
                        className={`flex-1 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tempRelationType === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-600'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => connectMutation.mutate({ object_id: tempSourceId, related_object_id: tempTargetId, relation_type: tempRelationType })}
                  disabled={!tempSourceId || !tempTargetId || connectMutation.isPending}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-[12px] uppercase tracking-[0.2em] transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                >
                  {connectMutation.isPending ? 'Syncing...' : 'Create Relation'}
                </button>
              </div>
            )}

            {/* List with Inline Updating Rows */}
            {modalMode !== 'create' && (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loadingRelations ? (
                  <div className="py-20 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-50/50 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Querying Records...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {[...relations]
                      .sort((a, b) => {
                        const nameA = objects.find(o => o.id === a.related_object_id)?.name || '';
                        const nameB = objects.find(o => o.id === b.related_object_id)?.name || '';
                        return nameA.localeCompare(nameB);
                      })
                      .map(rel => {
                        const isIncoming = selectedObject && rel.related_object_id === selectedObject.id;
                        return (
                          <div key={rel.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 px-8 py-5 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 transition-all shadow-sm">
                            <div className="flex-1">
                              <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-4">
                                {isIncoming ? 'Originating Parent' : 'Target Entity'}
                              </label>
                              <select
                                value={rowValues[rel.id]?.related_id || ''}
                                onChange={(e) => handleRowValueChange(rel.id, 'related_id', e.target.value)}
                                disabled={modalMode === 'view'}
                                style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                                className={`w-full px-5 py-3 ${isIncoming ? 'bg-indigo-50/30' : 'bg-gray-50/50'} dark:bg-slate-800/50 rounded-2xl text-[11px] font-semibold outline-none border border-transparent focus:border-indigo-500/20 dark:text-white transition-all appearance-none text-center`}
                              >
                                {objects.map(obj => (
                                  <option key={obj.id} value={obj.id}>{obj.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="w-32">
                              <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-4 text-center">Edge Label</label>
                              <select
                                value={rowValues[rel.id]?.type || 'parent'}
                                onChange={(e) => handleRowValueChange(rel.id, 'type', e.target.value)}
                                disabled={modalMode === 'view'}
                                style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                                className="w-full px-4 py-3 bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl text-[11px] font-semibold outline-none border border-transparent focus:border-indigo-500/20 dark:text-white transition-all appearance-none text-center uppercase tracking-tighter"
                              >
                                {['parent', 'child', 'similar'].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            {modalMode === 'edit' && (
                              <button
                                onClick={() => handleRowUpdate(rel.id)}
                                disabled={updateRelationMutation.isPending && updateRelationMutation.variables?.id === rel.id}
                                className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                              >
                                {updateRelationMutation.isPending && updateRelationMutation.variables?.id === rel.id ? '...' : 'Update'}
                              </button>
                            )}
                          </div>
                        )
                      })}

                    {relations.length === 0 && (
                      <div className="bg-gray-50/50 dark:bg-slate-900/50 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-100 dark:border-slate-800">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No linked records found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal */}
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

export default RelationManager;
