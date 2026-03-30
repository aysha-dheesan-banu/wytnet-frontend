import React, { useState, useEffect } from 'react';
import { getObjectTypes, createObjectType, updateObjectType, deleteObjectType } from '../../api/object';
import { ObjectType } from '../../api/types';

const TypeManager: React.FC = () => {
  const [types, setTypes] = useState<ObjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ObjectType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getObjectTypes();
      setTypes(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await updateObjectType(editingType.id, formData);
      } else {
        await createObjectType(formData);
      }
      setIsModalOpen(false);
      setEditingType(null);
      setFormData({ name: '', description: '', icon: '' });
      fetchData();
    } catch (e) {
      alert('Error saving object type');
    }
  };

  const handleEdit = (type: ObjectType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      icon: type.icon || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this type? This may affect objects linked to it.')) {
      try {
        await deleteObjectType(id);
        fetchData();
      } catch (e) {
        alert('Error deleting object type');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Metadata Categories</h3>
        <button 
          onClick={() => { setEditingType(null); setIsModalOpen(true); }}
          className="px-6 py-2 bg-wyt-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          Add Type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400 italic">Loading types...</div>
        ) : types.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 italic">No object types defined.</div>
        ) : (
          types.map(type => (
            <div key={type.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-gray-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-100/20 transition-all group relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center shadow-inner overflow-hidden">
                  {(type.icon?.includes('_') || (type.icon?.length ?? 0) > 2) ? (
                    <span className="material-icons text-indigo-600 text-2xl">{type.icon}</span>
                  ) : (
                    <span className="text-2xl">{type.icon || '📦'}</span>
                  )}
                  <span className="text-[8px] font-black uppercase text-indigo-300 dark:text-indigo-700 mt-1">{type.icon?.substring(0, 10)}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <button onClick={() => handleEdit(type)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-900">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" /></svg>
                  </button>
                  <button onClick={() => handleDelete(type.id)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-900">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" /></svg>
                  </button>
                </div>
              </div>
              
              <div className="relative z-10">
                <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-tight text-xl mb-2">{type.name}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium line-clamp-2">{type.description || 'Define common characteristics for this object category.'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
              {editingType ? 'Edit' : 'New'} Type
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Icon (Emoji)</label>
                <input 
                  type="text" 
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  placeholder="e.g. 📦 or ⚙️"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-lg focus:ring-2 focus:ring-wyt-primary/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-wyt-primary/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-wyt-primary/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-gray-500 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-wyt-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-transform active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypeManager;
