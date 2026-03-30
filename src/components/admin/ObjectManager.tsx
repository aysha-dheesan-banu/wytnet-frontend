import React, { useState, useEffect } from 'react';
import { 
  getObjects, createObject, updateObject, deleteObject, getObjectTypes,
  uploadObjectIcon 
} from '../../api/object';
import { WytObject, ObjectType } from '../../api/types';

const ObjectManager: React.FC = () => {
  const [objects, setObjects] = useState<WytObject[]>([]);
  const [types, setTypes] = useState<ObjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<WytObject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type_id: '',
    icon: 'category'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [objRes, typeRes] = await Promise.all([
        getObjects(0, 100),
        getObjectTypes()
      ]);
      setObjects(objRes.items || []);
      setTypes(typeRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingObject) {
        await updateObject(editingObject.id, formData);
      } else {
        await createObject(formData);
      }
      setIsModalOpen(false);
      setEditingObject(null);
      setFormData({ name: '', description: '', type_id: '', icon: 'category' });
      fetchData();
    } catch (e) {
      alert('Error saving object');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      const res = await uploadObjectIcon(file);
      if (res.item) {
        setFormData(prev => ({ ...prev, icon: res.item! }));
      }
    } catch (err) {
      alert('Failed to upload icon');
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (iconStr: string | undefined, className = "text-xl") => {
    const icon = (iconStr || '').trim();
    
    // 1. If it starts with http or /uploads/, it's a real image URL
    if (icon.startsWith('http') || icon.startsWith('/uploads/')) {
      const src = icon.startsWith('http') ? icon : `http://localhost:8000${icon}`;
      return (
        <img 
          src={src} 
          alt="" 
          className="w-8 h-8 object-contain rounded-lg" 
          onError={(e) => {
            // Hide the broken image and show the triangle icon instead
            e.currentTarget.style.display = 'none';
            const fallback = document.createElement('span');
            fallback.className = `material-icons ${className} text-indigo-500`;
            fallback.innerText = 'category';
            e.currentTarget.parentElement?.appendChild(fallback);
          }}
        />
      );
    }
    
    // 2. Otherwise, treat it as a Material Icon name (default to 'category' if name is junk)
    const iconName = (!icon || icon.length < 3 || ['string', 'icon', 'none', 'null'].includes(icon.toLowerCase())) 
      ? 'category' 
      : icon;
      
    return <span className={`material-icons ${className} text-indigo-500`}>{iconName}</span>;
  };

  const handleEdit = (obj: WytObject) => {
    setEditingObject(obj);
    setFormData({
      name: obj.name,
      description: obj.description || '',
      type_id: obj.type_id || '',
      icon: obj.icon || 'category',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this object?')) {
      try {
        await deleteObject(id);
        fetchData();
      } catch (e) {
        alert('Error deleting object');
      }
    }
  };

  const filteredObjects = objects.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.normalized_name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Objects', value: objects.length, icon: 'inventory_2' },
    { label: 'Object Types', value: types.length, icon: 'category' },
    { label: 'With Description', value: objects.filter(o => o.description).length, icon: 'description' },
    { label: 'Total Aliases', value: objects.reduce((acc, o) => acc + (o.aliases?.length || 0), 0), icon: 'label' }
  ];

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
              <span className="material-icons text-2xl">bubble_chart</span>
            </span>
            Objects Management
          </h2>
          <p className="text-gray-500 font-medium mt-1 ml-14">Manage objects and knowledge graph structure</p>
        </div>
        <button 
          onClick={() => { setEditingObject(null); setFormData({ name: '', description: '', type_id: '', icon: 'category' }); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-none"
        >
          <span className="material-icons text-sm">add</span>
          Create Object
        </button>
      </div>

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
        
        <select className="px-4 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all">
          <option>All Types</option>
          {types.map(t => <option key={t.id}>{t.name}</option>)}
        </select>

        <select className="px-4 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all">
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
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aliases (count)</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Childs (count)</th>
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
                    <div className="flex items-center gap-2">
                       <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                         {obj.aliases?.length || 0}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-slate-700">
                      {types.find(t => t.id === obj.type_id)?.name || 'Default'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{obj.parent_name || 'Main'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-900 dark:text-white">{obj.child_count || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 pr-2">
                      <button onClick={() => handleEdit(obj)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all shadow-none hover:shadow-lg shadow-indigo-100">
                        <span className="material-icons text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDelete(obj.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all shadow-none hover:shadow-lg shadow-red-100">
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
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-indigo-100 transition-colors">
                        <span className="material-icons text-xs">upload</span>
                        Upload Image
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
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
    </div>
  );
};

export default ObjectManager;
