import React, { useState, useEffect } from 'react';
import { getObjects } from '../../api/object';
import { getAliasesForObject, createAlias, deleteAlias } from '../../api/admin';
import { WytObject, ObjectAlias } from '../../api/types';

const AliasManager: React.FC = () => {
  const [objects, setObjects] = useState<WytObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>('');
  const [aliases, setAliases] = useState<ObjectAlias[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAlias, setNewAlias] = useState('');

  useEffect(() => {
    fetchObjects();
  }, []);

  useEffect(() => {
    if (selectedObjectId) {
      fetchAliases(selectedObjectId);
    } else {
      setAliases([]);
    }
  }, [selectedObjectId]);

  const fetchObjects = async () => {
    try {
      const res = await getObjects(0, 1000);
      setObjects(res.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAliases = async (id: string) => {
    setLoading(true);
    try {
      const res = await getAliasesForObject(id);
      setAliases(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObjectId || !newAlias.trim()) return;
    try {
      await createAlias({ object_id: selectedObjectId, alias: newAlias.trim() });
      setNewAlias('');
      fetchAliases(selectedObjectId);
    } catch (e) {
      alert('Error adding alias');
    }
  };

  const handleDeleteAlias = async (aliasId: string) => {
    try {
      await deleteAlias(aliasId);
      fetchAliases(selectedObjectId);
    } catch (e) {
      alert('Error deleting alias');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Select Object to Manage</label>
          <select 
            value={selectedObjectId}
            onChange={(e) => setSelectedObjectId(e.target.value)}
            className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-wyt-primary/10 outline-none transition-all dark:text-white appearance-none cursor-pointer font-bold uppercase tracking-tight"
          >
            <option value="">-- Choose an Object --</option>
            {objects.map(obj => (
              <option key={obj.id} value={obj.id}>{obj.name} {obj.category ? `(${obj.category})` : ''}</option>
            ))}
          </select>
        </div>

        {selectedObjectId ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
               Aliases for <span className="text-wyt-primary">{objects.find(o => o.id === selectedObjectId)?.name}</span>
            </h3>

            <form onSubmit={handleAddAlias} className="flex gap-2 mb-8">
              <input 
                type="text" 
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="Enter new alias..."
                className="flex-1 px-6 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 focus:ring-wyt-primary/10 outline-none transition-all dark:text-white font-medium shadow-sm"
              />
              <button 
                type="submit"
                disabled={!newAlias.trim()}
                className="px-8 py-4 bg-wyt-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-none active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                Add
              </button>
            </form>

            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-10 text-gray-400 italic">Fetching aliases...</div>
              ) : aliases.length === 0 ? (
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center text-gray-400 font-medium border-2 border-dashed border-gray-100 dark:border-slate-800">
                  No aliases found for this object.
                </div>
              ) : (
                aliases.map(alias => (
                  <div key={alias.id} className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-gray-50 dark:border-slate-800 group hover:border-wyt-primary/20 transition-all shadow-sm">
                    <span className="font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">{alias.alias}</span>
                    <button 
                      onClick={() => handleDeleteAlias(alias.id)}
                      className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-[2rem]">
            <svg className="h-12 w-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p className="font-bold uppercase tracking-widest text-[10px]">Select an object above to manage its aliases</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AliasManager;
