import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getObjects, createObject, updateObject, deleteObject, getObjectTypes,
  uploadObjectIcon 
} from '../../api/object';
import { WytObject } from '../../api/types';
import ConfirmModal from './ConfirmModal';

interface ObjectManagerProps {
  createTrigger: number;
  onTriggerHandled?: () => void;
}

const ObjectManager: React.FC<ObjectManagerProps> = ({ createTrigger, onTriggerHandled }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<WytObject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type_id: '',
    icon: 'category'
  });
  const [filterType, setFilterType] = useState('All Types');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [isUploading, setIsUploading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingObject, setViewingObject] = useState<WytObject | null>(null);
  const [confirmDeleteState, setConfirmDeleteState] = useState<{ isOpen: boolean; id: string | null; name: string }>({
    isOpen: false,
    id: null,
    name: ''
  });

  // Watch for external create trigger
  React.useEffect(() => {
    if (createTrigger > 0) {
      setEditingObject(null);
      setFormData({ name: '', description: '', type_id: '', icon: 'category' });
      setIsModalOpen(true);
      onTriggerHandled?.();
    }
  }, [createTrigger, onTriggerHandled]);

  // Queries
  const { data: objRes, isLoading: loadingObjects } = useQuery({
    queryKey: ['objects'],
    queryFn: () => getObjects(0, 100)
  });
  const objects = objRes?.items || [];

  const { data: typeRes, isLoading: loadingTypes } = useQuery({
    queryKey: ['types'],
    queryFn: getObjectTypes
  });
  const types = typeRes?.items || [];

  const loading = loadingObjects || loadingTypes;

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingObject) {
        return updateObject(editingObject.id, payload);
      }
      return createObject(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
      setIsModalOpen(false);
      setEditingObject(null);
      setFormData({ name: '', description: '', type_id: '', icon: 'category' });
    },
    onError: (err: any) => {
      console.error('Save error:', err);
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? detail[0]?.msg : 'Error saving object');
      alert(message || 'Error saving object');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteObject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
    onError: () => {
      alert('Error deleting object');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      type_id: formData.type_id || null,
    };
    saveMutation.mutate(payload);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      const res = await uploadObjectIcon(file);
      if (res.item) {
        setFormData(prev => ({ ...prev, icon: res.item! }));
      }
    } catch (err) {
      alert('Failed to upload icon');
    } finally {
      setIsUploading(false);
    }
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

  const handleEdit = (obj: WytObject) => {
    setIsViewModalOpen(false);
    setEditingObject(obj);
    setFormData({
      name: obj.name,
      description: obj.description || '',
      type_id: obj.type_id || '',
      icon: obj.icon || 'category',
    });
    setIsModalOpen(true);
  };

  const handleView = (obj: WytObject) => {
    setViewingObject(obj);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDeleteState({ isOpen: true, id, name });
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteState.id) {
      deleteMutation.mutate(confirmDeleteState.id);
    }
  };

  const getEffectiveParents = (obj: WytObject) => {
    return obj.parent_names && obj.parent_names.length > 0 
      ? obj.parent_names 
      : (obj.parent_name ? obj.parent_name.split(',').map(s => s.trim()) : ['Main']);
  };

  const renderParents = (obj: WytObject) => {
    const rawParents = getEffectiveParents(obj);
    const count = (rawParents.length === 1 && rawParents[0].toLowerCase() === 'main') ? 0 : rawParents.length;
    
    return (
      <div className="text-sm font-black text-gray-900 dark:text-white ml-0.5">
        {count}
      </div>
    );
  };

  const filteredObjects = objects.filter(o => {
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase()) || 
                         o.normalized_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = filterType === 'All Types' || 
                       types.find(t => t.id === o.type_id)?.name === filterType;
    
    const matchesStatus = filterStatus === 'Active' ? o.is_active : !o.is_active;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = [
    { label: 'Total Objects', value: objects.length, icon: 'inventory_2' },
    { label: 'Object Types', value: types.length, icon: 'category' },
    { label: 'With Description', value: objects.filter(o => o.description).length, icon: 'description' },
    { label: 'Total Aliases', value: objects.reduce((acc, o) => acc + (o.aliases?.length || 0), 0), icon: 'label' }
  ];

  return (
    <div className="p-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</h3>
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
            placeholder="Search objects by name or alias..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
          />
          <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
        </div>
        
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
          className="px-4 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
        >
          <option>All Types</option>
          {types.map(t => <option key={t.id}>{t.name}</option>)}
        </select>

        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
          className="px-4 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
        >
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <div className="flex gap-1 ml-auto">
           <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><span className="material-icons">chevron_left</span></button>
           <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><span className="material-icons">chevron_right</span></button>
        </div>
      </div>

      {/* Redesigned Table */}
      <div className="overflow-x-auto rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full text-left font-sans">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Object Icon</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Object Name</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aliases</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Parents</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Childs</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {loading ? (
              <tr><td colSpan={8} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                   <div className="w-8 h-8 border-4 border-indigo-50/50 border-t-indigo-600 rounded-full animate-spin"></div>
                   <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Loading Objects...</span>
                </div>
              </td></tr>
            ) : filteredObjects.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-20 text-center text-gray-400 uppercase text-[10px] font-bold tracking-widest italic">No matching records</td></tr>
            ) : (
              filteredObjects.map(obj => (
                <tr key={obj.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-all group">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors overflow-hidden">
                      {renderIcon(obj.icon)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-black text-gray-900 dark:text-white tracking-tight uppercase">{obj.name}</div>
                      {obj.description && <div className="text-[10px] text-gray-400 font-medium truncate max-w-[200px] mt-0.5">{obj.description}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-900 dark:text-white ml-0.5">
                      {obj.aliases?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-slate-700">
                      {types.find(t => t.id === obj.type_id)?.name || 'Default'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {renderParents(obj)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-900 dark:text-white">{obj.child_count || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 pr-2">
                      <button onClick={() => handleView(obj)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all shadow-none hover:shadow-lg shadow-indigo-100">
                        <span className="material-icons text-lg">visibility</span>
                      </button>
                      <button onClick={() => handleEdit(obj)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all shadow-none hover:shadow-lg shadow-indigo-100">
                        <span className="material-icons text-lg">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(obj.id, obj.name)}
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                        title="Full Entity Delete"
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
      </div>

      {/* Redesigned Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl p-12 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                  {editingObject ? 'Modify' : 'Register'} Object
                </h3>
                <p className="text-gray-400 font-medium mt-1">Configure your knowledge graph object metadata</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                 <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Unique Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g. Zimbabwe"
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Classification Type</label>
                  <select 
                    value={formData.type_id}
                    onChange={(e) => setFormData({...formData, type_id: e.target.value})}
                    style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all dark:text-white"
                  >
                    <option value="">Default Unit</option>
                    {types.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Visual Icon</label>
                  <div className="flex gap-3">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0 overflow-hidden border-2 border-dashed border-gray-200 dark:border-slate-700">
                      {renderIcon(formData.icon, "text-2xl")}
                    </div>
                    <div className="flex-1 space-y-2">
                       <input 
                        type="text" 
                        value={formData.icon}
                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        placeholder="Material Icon name or URL"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all dark:text-white"
                      />
                      <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-colors ${isUploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 cursor-pointer hover:bg-indigo-100'}`}>
                        <span className={`material-icons text-xs ${isUploading ? 'animate-spin' : ''}`}>{isUploading ? 'sync' : 'upload'}</span>
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">System Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={8}
                    placeholder="Provide a detailed description of this object..."
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all dark:text-white resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-4">
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 active:scale-95"
                  >
                    {editingObject ? 'Update Record' : 'Create Record'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && viewingObject && (() => {
        const modalParents = getEffectiveParents(viewingObject).filter(n => n.toLowerCase() !== 'main');
        const modalParentCount = modalParents.length;
        
        // Discover children from the existing catalog
        const modalChildren = objects.filter(o => {
          const parents = getEffectiveParents(o);
          return parents.some(p => p.toLowerCase() === viewingObject.name.toLowerCase() || p === viewingObject.id);
        });

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsViewModalOpen(false)}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-12 border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200 overflow-hidden">
              
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950 rounded-2xl flex items-center justify-center text-indigo-600">
                    {renderIcon(viewingObject.icon, "text-3xl")}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {viewingObject.name}
                    </h3>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      {types.find(t => t.id === viewingObject.type_id)?.name || 'Default Type'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsViewModalOpen(false)} 
                  className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                >
                   <span className="material-icons">close</span>
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Description</label>
                  <div className="p-6 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border border-gray-100 dark:border-slate-800 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {viewingObject.description || 'No description available for this record.'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent Nodes</label>
                    <div className="flex flex-wrap gap-2">
                      {modalParentCount > 0 ? modalParents.map((p, i) => (
                        <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                          {p}
                        </span>
                      )) : <span className="px-3 py-1 bg-gray-50 dark:bg-slate-800 text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">Main Root</span>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Child Nodes</label>
                    <div className="flex flex-wrap gap-2">
                      {modalChildren.length > 0 ? modalChildren.map((c, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                          {c.name}
                        </span>
                      )) : <span className="text-[10px] text-gray-400 italic">No downstream connections</span>}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 p-4 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl">
                      <span className="block text-[8px] font-black text-gray-400 uppercase mb-1">Total Children</span>
                      <span className="text-xl font-black text-gray-900 dark:text-white">{viewingObject.child_count || 0}</span>
                    </div>
                    <div className="flex-1 p-4 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl">
                      <span className="block text-[8px] font-black text-gray-400 uppercase mb-1">Parent Count</span>
                      <span className="text-xl font-black text-gray-900 dark:text-white">
                        {modalParentCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Custom Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmDeleteState.isOpen}
        onClose={() => setConfirmDeleteState({ ...confirmDeleteState, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Full Entity Delete?"
        message={`Are you sure you want to permanently delete "${confirmDeleteState.name}"? This action cannot be undone and will remove all associated aliases and relations.`}
        confirmText="Yes, Delete Object"
        isDestructive={true}
      />
    </div>
  );
};

export default ObjectManager;
