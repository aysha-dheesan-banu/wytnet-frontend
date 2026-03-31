import React from 'react';

const PostSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 border border-gray-100 dark:border-slate-700 shadow-sm animate-pulse">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                            <div className="h-3 w-12 bg-gray-100 dark:bg-slate-700 rounded-md"></div>
                        </div>
                        <div className="flex items-center gap-3 h-2 w-32 bg-gray-100 dark:bg-slate-700 rounded-md"></div>
                    </div>
                </div>
                <div className="h-8 w-24 bg-gray-100 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div className="flex gap-4 mb-2 mt-4">
                <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-3 w- كامل bg-gray-100 dark:bg-slate-700 rounded-md"></div>
                    <div className="h-3 w-5/6 bg-gray-100 dark:bg-slate-700 rounded-md"></div>
                </div>
                <div className="w-[120px] h-[80px] bg-gray-200 dark:bg-slate-700 rounded-2xl shrink-0"></div>
            </div>
            <div className="h-12 w-full bg-gray-200 dark:bg-slate-700 rounded-2xl mt-4"></div>
        </div>
    );
};

export default PostSkeleton;
