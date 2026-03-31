import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../api/user';
import { getPosts } from '../../api/post';
import { getObjects } from '../../api/object';

const Overview: React.FC = () => {
    const { data: usersRes } = useQuery({ queryKey: ['admin-users-count'], queryFn: () => getUsers(0, 1000) });
    const { data: postsRes } = useQuery({ queryKey: ['admin-posts-count'], queryFn: () => getPosts() });
    const { data: objectsRes } = useQuery({ queryKey: ['admin-objects-count'], queryFn: () => getObjects(0, 1000) });

    const stats = [
        {
            label: 'WytWall Users',
            value: usersRes?.itemCount || usersRes?.total || usersRes?.items?.length || 0,
            icon: 'person_outline',
            color: 'bg-blue-50 text-blue-600',
            iconBg: 'bg-blue-100/50'
        },
        {
            label: 'Total Posts',
            value: postsRes?.itemCount || postsRes?.total || postsRes?.items?.length || 0,
            icon: 'description',
            color: 'bg-green-50 text-green-600',
            iconBg: 'bg-green-100/50'
        },
        {
            label: 'Total Objects',
            value: objectsRes?.itemCount || objectsRes?.total || objectsRes?.items?.length || 0,
            icon: 'category',
            color: 'bg-purple-50 text-purple-600',
            iconBg: 'bg-purple-100/50'
        },
        {
            label: 'Active Status',
            value: postsRes?.items?.filter((p: any) => p.post_type === 'NEED' || p.post_type === 'OFFER').length || 0,
            icon: 'check_circle_outline',
            color: 'bg-orange-50 text-orange-600',
            iconBg: 'bg-orange-100/50'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</h4>
                                <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {stat.value}
                                </div>
                            </div>
                            <div className={`w-12 h-12 ${stat.iconBg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <span className={`material-icons ${stat.color.split(' ')[1]}`}>{stat.icon}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                        <span className="material-icons text-indigo-600">bolt</span>
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">Quick Actions</h3>
                    </div>
                    <div className="p-6 space-y-3">
                        {[
                            { label: 'Manage Platform Modules', icon: 'settings_input_component' },
                            { label: 'Configure API Integrations', icon: 'dvr' },
                            { label: 'View User Management', icon: 'manage_accounts' },
                            { label: 'Tenant Overview', icon: 'business' }
                        ].map((action, i) => (
                            <button key={i} className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20">
                                <div className="flex items-center gap-4">
                                    <span className="material-icons text-gray-400 group-hover:text-indigo-600 transition-colors text-lg">{action.icon}</span>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">{action.label}</span>
                                </div>
                                <span className="material-icons text-gray-300 group-hover:text-indigo-600 text-sm">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                        <span className="material-icons text-green-500">sensors</span>
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">System Status</h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Overall Health</span>
                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-tighter">Healthy</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>System Uptime</span>
                                <span className="text-gray-900 dark:text-white">325h 18m</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>Response Time</span>
                                <span className="text-gray-900 dark:text-white">8ms</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-2 w-full bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 w-[85%] rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Platform performance: 85% optimal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
