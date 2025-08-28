import React, { useState, useMemo } from 'react';
import type { Job } from '../types';
import { MaximizeIcon, MinimizeIcon, AlertTriangleIcon, ChevronDownIcon, ChevronUpIcon } from '../components/Icons';

interface QualityCheckingProps {
    jobs: Job[];
    onJobClick: (job: Job, department: string) => void;
    getDepartmentForProcess: (processName: string) => string | null;
}

const JobCard: React.FC<{ job: Job; onClick: () => void; isExpanded: boolean; onToggleExpand: () => void; }> = ({ job, onClick, isExpanded, onToggleExpand }) => (
    <div className={`bg-gray-100 p-3 rounded-lg shadow-sm border ${job.priority === 'Urgent' ? 'border-red-400' : 'border-gray-200'}`}>
        <div onClick={onClick} className="font-bold text-gray-900 flex items-center gap-2 cursor-pointer">
            {job.priority === 'Urgent' && <AlertTriangleIcon className="h-5 w-5 text-red-500" />}
            <span className="truncate">{job.jobNumber} - {job.finishDate} - {job.customerName || 'N/A'}</span>
        </div>
        {job.jobDescription && (
            <>
                <div className="text-right mt-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} 
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-auto"
                    >
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </button>
                </div>
                {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-sm text-gray-600 whitespace-pre-wrap break-words">
                        {job.jobDescription}
                    </div>
                )}
            </>
        )}
    </div>
);


export const QualityChecking: React.FC<QualityCheckingProps> = ({ jobs, onJobClick, getDepartmentForProcess }) => {
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const [fullScreenDepartment, setFullScreenDepartment] = useState<string | null>(null);
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

    const handleFilterChange = (department: string, value: string) => {
        setFilters(prev => ({ ...prev, [department]: value }));
    };

    const { pendingProcessQcJobs, finalQcJobs } = useMemo(() => {
        const pendingProcess = new Map<string, Job>();
        const finalQc = new Map<string, Job>();

        jobs.forEach(job => {
            if (job.jobType === 'Service' && job.drawings) {
                let needsFinalQc = false;
                let needsProcessQc = false;

                for (const drawing of job.drawings) {
                    if (drawing.currentDepartment === 'Final Quality Check') {
                        needsFinalQc = true;
                    }
                    for (const process of drawing.processes) {
                        if (process.completed && !process.qualityCheckCompleted) {
                            needsProcessQc = true;
                        }
                    }
                }
                
                if (needsProcessQc) {
                    pendingProcess.set(job.id, job);
                }
                // A job can't be in both lists. Process QC takes priority.
                if (needsFinalQc && !needsProcessQc) { 
                    finalQc.set(job.id, job);
                }
            }
        });
        return { 
            pendingProcessQcJobs: Array.from(pendingProcess.values()), 
            finalQcJobs: Array.from(finalQc.values()) 
        };
    }, [jobs]);
    
    const applyFilter = (jobs: Job[], filterText: string) => {
        if (!filterText) return jobs;
        const lowerCaseFilter = filterText.toLowerCase();
        return jobs.filter(job => 
            job.jobNumber.toLowerCase().includes(lowerCaseFilter) ||
            job.customerName.toLowerCase().includes(lowerCaseFilter) ||
            job.finishDate.includes(lowerCaseFilter)
        );
    };

    const filteredPendingJobs = applyFilter(pendingProcessQcJobs, filters['Pending Process QC'] || '');
    const filteredFinalJobs = applyFilter(finalQcJobs, filters['Final Quality Check'] || '');


    const handlePendingJobClick = (job: Job) => {
        for (const drawing of job.drawings || []) {
            for (const process of drawing.processes) {
                if (process.completed && !process.qualityCheckCompleted) {
                    const department = getDepartmentForProcess(process.name);
                    if (department) {
                        onJobClick(job, department);
                        return;
                    }
                }
            }
        }
    };
    
    const departments = [
        { name: 'Pending Process QC', jobs: filteredPendingJobs, onClick: handlePendingJobClick },
        { name: 'Final Quality Check', jobs: filteredFinalJobs, onClick: (job: Job) => onJobClick(job, 'Final Quality Check') }
    ];

    return (
        <section className="mt-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {departments.map(dept => {
                    const isFullScreen = fullScreenDepartment === dept.name;
                    return (
                        <div key={dept.name} className={`bg-white rounded-xl shadow-lg p-5 border-t-4 border-indigo-500 flex flex-col ${isFullScreen ? 'fixed inset-4 z-40' : 'h-[60vh] sm:col-span-1'}`}>
                            <div className="flex justify-between items-center mb-2 pb-2 border-b flex-shrink-0">
                                <h3 className="text-xl font-semibold text-indigo-700">{dept.name} ({dept.jobs.length})</h3>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setFullScreenDepartment(isFullScreen ? null : dept.name)} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300">
                                        {isFullScreen ? <MinimizeIcon /> : <MaximizeIcon />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex-shrink-0 mb-2">
                                <input type="text" placeholder="Filter jobs..." value={filters[dept.name] || ''} onChange={e => handleFilterChange(dept.name, e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm" />
                            </div>
                            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                                {dept.jobs.length > 0 ? (
                                    dept.jobs
                                        .sort((a, b) => new Date(a.finishDate).getTime() - new Date(b.finishDate).getTime())
                                        .map(job => (
                                            <JobCard 
                                                key={job.id} 
                                                job={job} 
                                                onClick={() => dept.onClick(job)}
                                                isExpanded={expandedJobId === job.id}
                                                onToggleExpand={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                                            />
                                        ))
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No jobs in this department.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
