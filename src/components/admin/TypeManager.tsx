import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getObjectTypes, createObjectType, updateObjectType, deleteObjectType } from '../../api/object';
import { ObjectType } from '../../api/types';
import ConfirmModal from './ConfirmModal';
import Pagination from './Pagination';

interface TypeManagerProps {
  createTrigger: number;
  onTriggerHandled?: () => void;
}

const TypeManager: React.FC<TypeManagerProps> = ({ createTrigger, onTriggerHandled }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ObjectType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
  });
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    id: string | null;
    name: string;
  }>({
    isOpen: false,
    id: null,
    name: ''
  });

  // Watch for external create trigger
  React.useEffect(() => {
    if (createTrigger > 0) {
      setEditingType(null);
      setFormData({ name: '', slug: '', description: '', icon: 'category' });
      setIsModalOpen(true);
      onTriggerHandled?.();
    }
  }, [createTrigger, onTriggerHandled]);

  // Fetch Types
  const { data: typesRes, isLoading: loading } = useQuery({
    queryKey: ['types'],
    queryFn: getObjectTypes
  });
  const types = typesRes?.items || [];

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingType) {
        return updateObjectType(editingType.id, data);
      }
      return createObjectType(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] });
      setIsModalOpen(false);
      setEditingType(null);
      setFormData({ name: '', slug: '', description: '', icon: '' });
    },
    onError: () => {
      toast.error('Error saving object type');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteObjectType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] });
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    },
    onError: () => {
      toast.error('Error deleting object type');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleEdit = (type: ObjectType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      slug: type.slug || '',
      description: type.description || '',
      icon: type.icon || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmState({ isOpen: true, id, name });
  };

  const handleConfirmDelete = () => {
    if (confirmState.id) {
      deleteMutation.mutate(confirmState.id);
    }
  };

  const filteredTypes = types.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);
  const paginatedTypes = filteredTypes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const stats = [
    { label: 'Total Types', value: types.length, icon: 'category' },
    { label: 'Total Icons', value: types.filter(t => t.icon).length, icon: 'insert_emoticon' },
    { label: 'With Description', value: types.filter(t => t.description).length, icon: 'description' },
    { label: 'Manual Slugs', value: types.filter(t => t.slug).length, icon: 'link' }
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
            placeholder="Search types by name, slug or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
          />
          <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
        </div>

        <div className="flex gap-1 ml-auto">
          <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><span className="material-icons">chevron_left</span></button>
          <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><span className="material-icons">chevron_right</span></button>
        </div>
      </div>

      {/* Redesigned List View (Table) */}
      <div className="overflow-x-auto rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full text-left font-sans">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
            <tr>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24">Icon</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Slug</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Loading Categories...</span>
                  </div>
                </td>
              </tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-gray-400 uppercase text-[10px] font-bold tracking-widest italic">
                  No object types defined.
                </td>
              </tr>
            ) : (
              paginatedTypes.map(type => (
                <tr key={type.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-all group">
                  <td className="px-8 py-5">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-inner overflow-hidden border border-indigo-100/50 dark:border-slate-700">
                      {(type.icon?.includes('_') || (type.icon?.length ?? 0) > 2) ? (
                        <span className="material-icons text-xl">{type.icon}</span>
                      ) : (
                        <span className="text-xl">{type.icon || '📦'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-gray-900 dark:text-white tracking-tight uppercase">{type.name}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-slate-900 text-gray-500 rounded-lg text-[10px] font-mono border border-gray-200 dark:border-slate-700">
                      {type.slug}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[300px]">
                      {type.description || 'No description provided.'}
                    </p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all shadow-none hover:shadow-lg shadow-indigo-100"
                        title="Edit Type"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(type.id, type.name)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all shadow-none hover:shadow-lg shadow-red-100"
                        title="Delete Category"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1 1v3M4 7h16" strokeWidth="2.5" /></svg>
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
          totalItems={filteredTypes.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight mb-6">
              {editingType ? 'Edit' : 'New'} Type
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Icon (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g. 📦 or ⚙️"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-lg focus:ring-2 focus:ring-wyt-primary/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                    setFormData({ ...formData, name: newName, slug: editingType ? formData.slug : newSlug });
                  }}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-wyt-primary/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Slug (Identifier)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  required
                  placeholder="e.g. vehicle-type"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-wyt-primary/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-wyt-primary/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-gray-500 font-semibold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-wyt-primary text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-transform active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branded Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Category?"
        message={`Are you sure you want to delete the category "${confirmState.name}"? This will remove the classification from linked objects but will NOT delete the objects themselves.`}
        confirmText="Yes, Delete Category"
        isDestructive={true}
      />
    </div>
  );
};

export default TypeManager;
