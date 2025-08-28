
import React, { useMemo } from 'react';
import type { Job } from '../types';

interface ReportsProps {
    jobs: Job[];
    onShowJobDetails: () => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg shadow-md border-l-4 ${color}`}>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
);

const PieChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return <div className="text-center text-gray-500 p-4">No data available for chart.</div>;
    }

    let cumulativePercent = 0;
    const gradients = data.map(item => {
        const percent = (item.value / total) * 100;
        const start = cumulativePercent;
        const end = cumulativePercent + percent;
        cumulativePercent = end;
        return `${item.color} ${start}% ${end}%`;
    });

    return (
        <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-full" style={{ background: `conic-gradient(${gradients.join(', ')})` }}></div>
            <div className="text-sm space-y-2">
                {data.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                        <span>{item.name} ({item.value})</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const Reports: React.FC<ReportsProps> = ({ jobs, onShowJobDetails }) => {
    
    const analyticsData = useMemo(() => {
        const jobsInProgress = jobs.filter(j => !j.completedAt);
        const jobsCompleted = jobs.filter(j => !!j.completedAt);
        const totalReworks = jobs.flatMap(j => j.drawings || []).reduce((s, d) => s + (d.reworkCount || 0), 0);

        // Common calculations
        const statusCounts: { [key: string]: number } = {};
        jobsInProgress.forEach(job => {
            if (job.jobType === 'Service') {
                const departments = new Set(job.drawings?.map(d => d.currentDepartment));
                departments.forEach(dept => {
                    statusCounts[dept] = (statusCounts[dept] || 0) + 1;
                });
            } else {
                statusCounts['Product'] = (statusCounts['Product'] || 0) + 1;
            }
        });

        const chartData = [
            { name: 'Design', value: statusCounts['Design'] || 0, color: '#6366f1' },
            { name: 'Planning', value: statusCounts['Planning'] || 0, color: '#8b5cf6' },
            { name: 'Production', value: Object.keys(statusCounts).filter(k => !['Design', 'Planning', 'Final Quality Check', 'Hold', 'Completed', 'Products'].includes(k)).reduce((acc, k) => acc + statusCounts[k], 0), color: '#ec4899' },
            { name: 'Products', value: statusCounts['Product'] || 0, color: '#10b981'},
            { name: 'QC', value: statusCounts['Final Quality Check'] || 0, color: '#f59e0b' },
            { name: 'Hold', value: statusCounts['Hold'] || 0, color: '#6b7280' },
        ].filter(item => item.value > 0);
        
        return {
            totalJobs: jobs.length,
            completedJobsCount: jobsCompleted.length,
            jobsInProgressCount: jobsInProgress.length,
            totalReworks,
            chartData,
        };

    }, [jobs]);

    return (
        <div className="p-4 space-y-8">
            <div className="flex justify-between items-center">
                <h4 className="text-3xl font-bold text-indigo-600">Reports & Analytics</h4>
                <button
                    onClick={onShowJobDetails}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700"
                >
                    View All Job Details
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-6 rounded-xl shadow-lg border">
                <KpiCard title="Total Jobs" value={analyticsData.totalJobs} color="border-blue-500" />
                <KpiCard title="Jobs Completed" value={analyticsData.completedJobsCount} color="border-green-500" />
                 <KpiCard title="Jobs In Progress" value={analyticsData.jobsInProgressCount} color="border-pink-500" />
                <KpiCard title="Total Reworks" value={analyticsData.totalReworks} color="border-yellow-500" />
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg border">
                <h5 className="font-semibold text-gray-800 mb-4 text-lg">Active Job Status Distribution</h5>
                <PieChart data={analyticsData.chartData} />
            </div>
        </div>
    );
};