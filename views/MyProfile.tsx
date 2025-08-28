

import React, { useState, useMemo } from 'react';
import type { OfficialStaff, Operator, Job, ChatMessage, Drawing } from '../types';
import { ChevronLeftIcon, MessageSquareIcon, TrendingUpIcon, FileTextIcon } from '../components/Icons';

interface MyProfileProps {
    currentUser: OfficialStaff | Operator | null;
    jobs: Job[];
    messages: ChatMessage[];
    onBack: () => void;
    onOpenEditReport: (job: Job, drawing: Drawing) => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; change?: number; changeType?: 'increase' | 'decrease' | 'neutral' }> = ({ title, value, change, changeType }) => {
    const isPositive = changeType === 'increase';
    const isNegative = changeType === 'decrease';
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
                 <p className="text-3xl font-bold text-gray-800">{value}</p>
                 {change !== undefined && changeType !== 'neutral' && (
                     <p className={`text-sm font-semibold flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(change)}%
                    </p>
                 )}
            </div>
        </div>
    );
};


export const MyProfile: React.FC<MyProfileProps> = ({ currentUser, jobs, messages, onBack, onOpenEditReport }) => {
    const [activeTab, setActiveTab] = useState<'messages' | 'performance' | 'jobReports'>('messages');
    const [reportFilter, setReportFilter] = useState('');

    if (!currentUser || !('permissions' in currentUser)) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <button onClick={onBack} className="flex items-center gap-1 text-sm p-2 mb-4 bg-gray-200 rounded-md hover:bg-gray-300">
                    <ChevronLeftIcon /> Back
                </button>
                <p>No user profile to display.</p>
            </div>
        );
    }
    const staffUser = currentUser as OfficialStaff;

    const isQcUser = useMemo(() => 
        currentUser && 'permissions' in currentUser && currentUser.permissions.includes('Quality Assurance'), 
    [currentUser]);

    // --- Messages & Requests Logic ---
    const { mentions, dateRequests } = useMemo(() => {
        const lowerCaseName = staffUser.name.toLowerCase();
        const mentions = messages.filter(msg =>
            msg.text.toLowerCase().includes(lowerCaseName) && msg.senderId !== staffUser.id
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const dateRequests = jobs.filter(job => job.salesUpdateRequest?.status === 'pending');

        return { mentions, dateRequests };
    }, [messages, jobs, staffUser]);


    // --- Reports Logic ---
    const { monthlyStats, comparison } = useMemo(() => {
        // Find jobs this user has worked on
        const userJobs = jobs.filter(job => 
            job.designerId === staffUser.id || 
            job.programmerId === staffUser.id ||
            job.createdBy === staffUser.name // Simple check for sales
        );

        const stats: { [key: string]: { worked: Set<string>, completed: Set<string> } } = {};

        userJobs.forEach(job => {
            const startedAt = job.designerStartedAt || job.programmerStartedAt || job.createdAt;
            const finishedAt = job.designerFinishedAt || job.programmerFinishedAt || job.completedAt;
            
            if (startedAt) {
                const date = new Date(startedAt);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!stats[key]) stats[key] = { worked: new Set(), completed: new Set() };
                stats[key].worked.add(job.id);
            }
            if (finishedAt) {
                const date = new Date(finishedAt);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!stats[key]) stats[key] = { worked: new Set(), completed: new Set() };
                stats[key].completed.add(job.id);
            }
        });
        
        const sortedMonths = Object.keys(stats).sort().reverse();
        const monthlyStats = sortedMonths.map(key => ({
            month: key,
            worked: stats[key].worked.size,
            completed: stats[key].completed.size
        }));

        // Comparison logic
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonth = new Date(new Date().setMonth(now.getMonth() - 1));
        const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

        const currentMonthData = {
            worked: stats[currentMonthKey]?.worked.size || 0,
            completed: stats[currentMonthKey]?.completed.size || 0
        };
        const lastMonthData = {
            worked: stats[lastMonthKey]?.worked.size || 0,
            completed: stats[lastMonthKey]?.completed.size || 0
        };
        
        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? { change: 100, type: 'increase' as const } : { change: 0, type: 'neutral' as const };
            const change = ((current - previous) / previous) * 100;
            return {
                change: Math.round(change),
                type: change > 0 ? 'increase' as const : (change < 0 ? 'decrease' as const : 'neutral' as const)
            };
        };

        const comparison = {
            currentMonth: currentMonthData,
            lastMonth: lastMonthData,
            workedChange: calculateChange(currentMonthData.worked, lastMonthData.worked),
            completedChange: calculateChange(currentMonthData.completed, lastMonthData.completed)
        };
        
        return { monthlyStats, comparison };

    }, [jobs, staffUser]);

     const myReports = useMemo(() => {
        if (!isQcUser) return [];
        const reports: { job: Job, drawing: Drawing }[] = [];
        jobs.forEach(job => {
            (job.drawings || []).forEach(drawing => {
                if (drawing.finalReport && drawing.finalReport.checkedBy === staffUser.name) {
                    reports.push({ job, drawing });
                }
            });
        });
        return reports.sort((a,b) => new Date(b.drawing.finalReport!.reportDate).getTime() - new Date(a.drawing.finalReport!.reportDate).getTime());
    }, [jobs, staffUser, isQcUser]);

    const filteredReports = useMemo(() => {
        if (!reportFilter) return myReports;
        const lowerFilter = reportFilter.toLowerCase();
        return myReports.filter(({ job, drawing }) => 
            job.jobNumber.toLowerCase().includes(lowerFilter) ||
            drawing.name.toLowerCase().includes(lowerFilter)
        );
    }, [myReports, reportFilter]);


    const renderContent = () => {
        if (activeTab === 'messages') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-3">My Mentions</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                             {mentions.length > 0 ? mentions.map(msg => (
                                <div key={msg.id} className="bg-gray-100 p-3 rounded-lg border">
                                    <p className="text-sm">{msg.text}</p>
                                    <p className="text-xs text-gray-500 mt-1">From: {msg.senderName} on {new Date(msg.timestamp).toLocaleDateString()}</p>
                                </div>
                            )) : <p className="text-gray-500">No one has mentioned you recently.</p>}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold mb-3">Job Date Change Requests</h3>
                         <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                             {dateRequests.length > 0 ? dateRequests.map(job => (
                                <div key={job.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                    <p className="font-bold text-yellow-800">{job.jobNumber}</p>
                                    <p className="text-sm">{job.salesUpdateRequest?.reason}</p>
                                    <p className="text-xs text-gray-500 mt-1">Requested: {job.salesUpdateRequest?.requestedDate}</p>
                                </div>
                            )) : <p className="text-gray-500">No pending date change requests.</p>}
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'jobReports') {
            return (
                <div>
                    <h3 className="text-xl font-semibold mb-3">My Final Quality Reports</h3>
                    <input 
                        type="text" 
                        value={reportFilter} 
                        onChange={e => setReportFilter(e.target.value)} 
                        placeholder="Filter by Job Number or Drawing..." 
                        className="w-full p-2 border rounded-md mb-4" 
                    />
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {filteredReports.map(({ job, drawing }) => (
                            <div key={drawing.id} className="bg-gray-100 p-3 rounded-lg border flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{job.jobNumber}</p>
                                    <p className="text-sm text-gray-600">{drawing.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Report Date: {new Date(drawing.finalReport!.reportDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => onOpenEditReport(job, drawing)} 
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-semibold"
                                >
                                    View/Edit Report
                                </button>
                            </div>
                        ))}
                        {filteredReports.length === 0 && <p className="text-center text-gray-500 py-4">No reports found matching your filter.</p>}
                    </div>
                </div>
            )
        }

        if (activeTab === 'performance') {
            const { currentMonth, lastMonth, workedChange, completedChange } = comparison;
            return (
                <div>
                     <h3 className="text-xl font-semibold mb-4">This Month vs. Last Month</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KpiCard title="Jobs Worked This Month" value={currentMonth.worked} change={workedChange.change} changeType={workedChange.type} />
                        <KpiCard title="Jobs Completed This Month" value={currentMonth.completed} change={completedChange.change} changeType={completedChange.type} />
                        <KpiCard title="Jobs Worked Last Month" value={lastMonth.worked} />
                        <KpiCard title="Jobs Completed Last Month" value={lastMonth.completed} />
                    </div>

                    <h3 className="text-xl font-semibold mb-4">Monthly History</h3>
                    <div className="max-h-80 overflow-y-auto border rounded-lg">
                        <table className="min-w-full text-sm">
                             <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium">Month</th>
                                    <th className="px-4 py-2 text-left font-medium">Jobs Worked On</th>
                                    <th className="px-4 py-2 text-left font-medium">Jobs Completed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {monthlyStats.map(stat => (
                                    <tr key={stat.month}>
                                        <td className="px-4 py-2 font-semibold">{stat.month}</td>
                                        <td className="px-4 py-2">{stat.worked}</td>
                                        <td className="px-4 py-2">{stat.completed}</td>
                                    </tr>
                                ))}
                                {monthlyStats.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-gray-500">No work history found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
    };

    return (
        <section className="bg-white p-6 rounded-xl shadow-lg mb-8 max-w-7xl mx-auto">
             <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-1 text-sm p-2 bg-gray-200 rounded-md hover:bg-gray-300">
                        <ChevronLeftIcon /> Back
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-indigo-700">{staffUser.name}</h2>
                        <p className="text-gray-500">{staffUser.position}</p>
                    </div>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button 
                    onClick={() => setActiveTab('messages')}
                    className={`flex items-center gap-2 px-4 py-2 font-semibold ${activeTab === 'messages' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                >
                    <MessageSquareIcon /> Messages & Requests
                </button>
                 {isQcUser && (
                    <button 
                        onClick={() => setActiveTab('jobReports')}
                        className={`flex items-center gap-2 px-4 py-2 font-semibold ${activeTab === 'jobReports' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                    >
                        <FileTextIcon /> Job Reports
                    </button>
                )}
                <button 
                    onClick={() => setActiveTab('performance')}
                    className={`flex items-center gap-2 px-4 py-2 font-semibold ${activeTab === 'performance' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                >
                    <TrendingUpIcon /> My Performance
                </button>
            </div>

            {/* Content */}
            {renderContent()}
        </section>
    );
};
