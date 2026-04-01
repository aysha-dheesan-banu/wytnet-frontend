import React from 'react';
import { User } from '../../api/types';

interface ViewUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

interface SectionField {
    label: string;
    value: string | number | boolean;
    isStatus?: boolean;
    isFullWidth?: boolean;
}

interface Section {
    title: string;
    icon: string;
    fields: SectionField[];
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    const sections: Section[] = [
        {
            title: 'Account Information',
            icon: 'account_circle',
            fields: [
                { label: 'Username', value: user.username },
                { label: 'Email Address', value: user.email },
                { label: 'User ID', value: user.id },
                { label: 'Role', value: user.role?.toUpperCase() || (user.is_superuser ? 'ADMIN' : 'USER') },
                { label: 'Status', value: user.is_active ? 'Active' : 'Inactive', isStatus: true }
            ]
        },
        {
            title: 'Personal Details',
            icon: 'person',
            fields: [
                { label: 'Full Name', value: user.full_name || user.name || 'Not provided' },
                { label: 'Nickname', value: user.nickname || 'Not provided' },
                { label: 'Gender', value: user.gender || 'Not provided' },
                { label: 'Date of Birth', value: user.dob || 'Not provided' },
                { label: 'Marital Status', value: user.marital_status || 'Not provided' }
            ]
        },
        {
            title: 'Contact & Location',
            icon: 'place',
            fields: [
                { label: 'Phone', value: user.phone || 'Not provided' },
                { label: 'Location', value: user.location || 'Not provided' },
                { label: 'Mother Tongue', value: user.mother_tongue || 'Not provided' },
                { label: 'Languages', value: user.languages || 'Not provided' }
            ]
        },
        {
            title: 'Bio & Preferences',
            icon: 'notes',
            fields: [
                { label: 'Biography', value: user.bio || 'No bio provided', isFullWidth: true }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 dark:border-slate-700/50 flex justify-between items-start bg-gray-50/50 dark:bg-slate-900/20">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold uppercase shadow-lg shadow-indigo-200 dark:shadow-none">
                            {user.username?.[0] || user.email?.[0] || 'U'}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">
                                {user.full_name || user.username}
                            </h3>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                {user.is_active ? 'Active User' : 'Banned / Inactive'} • {user.role || 'Member'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-400">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="material-icons text-indigo-500 text-lg">{section.icon}</span>
                                <h4 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">{section.title}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {section.fields.map((field, fIdx) => (
                                    <div key={fIdx} className={`p-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl ${field.isFullWidth ? 'md:col-span-2' : ''}`}>
                                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{field.label}</p>
                                        <p className={`text-sm font-semibold ${field.isStatus ? (user.is_active ? 'text-emerald-600' : 'text-red-600') : 'text-gray-700 dark:text-gray-200'}`}>
                                            {field.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-slate-900/20 border-t border-gray-100 dark:border-slate-700/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-300 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Close View
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewUserModal;
