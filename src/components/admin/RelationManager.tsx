import React, { useState, useEffect } from 'react';
import { WytObject, ObjectRelation } from '../../api/types';
import { getObjects } from '../../api/object';
import { createRelation, deleteRelation, getRelationsForObject } from '../../api/admin';

const RelationManager: React.FC = () => {
  const [objects, setObjects] = useState<WytObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>('');
  const [relations, setRelations] = useState<ObjectRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // New Relation data
  const [relatedObjectId, setRelatedObjectId] = useState('');
  const [relationType, setRelationType] = useState('parent');

  const fetchObjects = async () => {
    setLoadingObjects(true);
    try {
      console.log('Fetching objects for RelationManager...');
      const res = await getObjects();
      console.log('RelationManager objects received:', res);
      setObjects(res.items || []);
    } catch (err) {
      console.error('Failed to fetch objects in RelationManager', err);
    } finally {
      setLoadingObjects(false);
    }
  };

  const fetchRelations = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getRelationsForObject(id);
      setRelations(res.items || []);
    } catch (err) {
      console.error('Failed to fetch relations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  useEffect(() => {
    if (selectedObjectId) {
      fetchRelations(selectedObjectId);
    } else {
      setRelations([]);
    }
  }, [selectedObjectId]);

  const handleAddRelation = async () => {
    if (!selectedObjectId || !relatedObjectId) return;
    try {
      await createRelation({
        object_id: selectedObjectId,
        related_object_id: relatedObjectId,
        relation_type: relationType
      });
      fetchRelations(selectedObjectId);
      setIsModalOpen(false);
      setRelatedObjectId('');
    } catch (err) {
      console.error('Failed to add relation', err);
      alert('Failed to add relation. It might already exist.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this relation?')) {
      try {
        await deleteRelation(id);
        fetchRelations(selectedObjectId);
      } catch (err) {
        console.error('Failed to delete relation', err);
      }
    }
  };

  const filteredObjects = objects.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Object Selection Sidebar */}
        <div className="w-full md:w-1/3 border-r border-gray-100 dark:border-slate-700 pr-8">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Select Main Object</h3>
          <input 
            type="text"
            placeholder="Search objects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 mb-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
          />
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingObjects ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                 <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Catalog...</span>
              </div>
            ) : objects.length === 0 ? (
              <div className="py-10 text-center bg-gray-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                  No objects found.<br/>Please create objects first.
                </p>
                <button 
                  onClick={fetchObjects}
                  className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-[8px] font-black uppercase tracking-widest hover:border-indigo-500 transition-colors"
                >
                  Retry Fetch
                </button>
              </div>
            ) : filteredObjects.length === 0 ? (
              <div className="py-10 text-center text-gray-400 italic text-[10px] font-black uppercase tracking-widest bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl">
                No matches for "{search}"
              </div>
            ) : (
              filteredObjects.map(obj => (
                <button
                  key={obj.id}
                  onClick={() => setSelectedObjectId(obj.id)}
                  className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden ${selectedObjectId === obj.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none' : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-100 dark:hover:border-slate-700'}`}
                >
                  <div className="relative z-10">{obj.name}</div>
                  <span className={`block text-[9px] font-black uppercase tracking-widest relative z-10 mt-0.5 ${selectedObjectId === obj.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {obj.category || 'Metadata'}
                  </span>
                  {selectedObjectId === obj.id && (
                    <div className="absolute top-0 right-0 p-2 opacity-20">
                      <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        {/* Relations Content */}
        <div className="flex-1">
          {selectedObjectId ? (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Relations for {objects.find(o => o.id === selectedObjectId)?.name}
                  </h3>
                  <p className="text-gray-500 text-sm">Managing connections and hierarchies</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  ADD RELATION
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : relations.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {relations.map(rel => (
                    <div key={rel.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${rel.relation_type === 'parent' ? 'bg-blue-50 text-blue-600' : rel.relation_type === 'child' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                          {rel.relation_type}
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {rel.related_object_id} 
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium italic">Object ID</span>
                      </div>
                      <button 
                        onClick={() => handleDelete(rel.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                         <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No relations defined</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Select an object to manage its relations</h3>
            </div>
          )}
        </div>
      </div>

      {/* Add Relation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Add Relation</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Link two objects with a semantic relationship.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 ml-1">Related Object</label>
                <select 
                  value={relatedObjectId}
                  onChange={(e) => setRelatedObjectId(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent rounded-2xl focus:border-indigo-600/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-semibold outline-none dark:text-white"
                >
                  <option value="">Select an object...</option>
                  {objects.filter(o => o.id !== selectedObjectId).map(obj => (
                    <option key={obj.id} value={obj.id}>{obj.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 ml-1">Relation Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {['parent', 'child', 'similar'].map(t => (
                    <button
                      key={t}
                      onClick={() => setRelationType(t)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${relationType === t ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-gray-100 dark:border-slate-700 text-gray-400 hover:border-gray-200 shadow-sm'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleAddRelation}
                  className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  ADD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationManager;
