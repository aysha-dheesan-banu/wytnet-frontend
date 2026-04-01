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
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{stat.label}</h4>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    {stat.value}
                                </div>
                            </div>
                            <div className={`w-14 h-14 ${stat.iconBg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                <span className={`material-icons ${stat.color.split(' ')[1]} text-2xl`}>{stat.icon}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Overview;
