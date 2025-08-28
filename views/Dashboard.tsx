



import React, { useState, useMemo } from 'react';
import type { Job, Drawing } from '../types';
import { MaximizeIcon, MinimizeIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from '../components/Icons';

interface DashboardProps {
    jobs: Job[];
    onJobClick: (job: Job) => void;
    getDepartmentForProcess: (processName: string) => string | null;
}

const getCurrentDepartmentsSummary = (job: Job): string => {
    if (job.completedAt) {
        return 'Completed';
    }
    if (job.jobType !== 'Service' || !job.drawings || job.drawings.length === 0) {
        return 'N/A';
    }
    const uniqueDepartments = [...new Set(job.drawings.map(d => d.currentDepartment))];
    return uniqueDepartments.length > 0 ? uniqueDepartments.join(', ') : 'N/A';
};

const getPendingDepartmentsSummary = (job: Job, getDepartmentForProcess: (processName: string) => string | null): string | JSX.Element => {
    if (job.deliveredAt) {
        return (
            <div className="flex items-center gap-1">
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-700">Delivered</span>
            </div>
        );
    }
    if (job.completedAt) {
        return <span className="text-blue-600 font-semibold">Ready for Delivery</span>;
    }

    if (job.jobType !== 'Service' || !job.drawings || job.drawings.length === 0) {
        return 'N/A';
    }

    const allUpcomingDepartments = new Set<string>();

    job.drawings.forEach(drawing => {
        if (!drawing.processes || ['Completed', 'Hold'].includes(drawing.currentDepartment) || drawing.materialStatus !== 'Ready') {
            return;
        }

        const sortedProcesses = [...drawing.processes].sort((a, b) => a.sequence - b.sequence);
        const firstIncompleteIndex = sortedProcesses.findIndex(p => !p.completed || !p.qualityCheckCompleted);

        if (firstIncompleteIndex === -1) { // All processes done
            if (!drawing.finalQcApproved && drawing.currentDepartment !== 'Final Quality Check') {
                allUpcomingDepartments.add('Final Quality Check');
            }
            return;
        }

        for (let i = firstIncompleteIndex; i < sortedProcesses.length; i++) {
            const process = sortedProcesses[i];
            const department = getDepartmentForProcess(process.name);
            if (department && department !== drawing.currentDepartment) {
                allUpcomingDepartments.add(department);
            }
        }
        
        if (drawing.currentDepartment !== 'Final Quality Check') {
             allUpcomingDepartments.add('Final Quality Check');
        }
    });

    const pendingList = Array.from(allUpcomingDepartments);
    if (pendingList.length > 0) {
        // Add 'Completed' as the final step if it's not already considered done.
         if (!pendingList.includes('Completed')) {
             pendingList.push('Completed');
         }
    }

    return pendingList.length > 0 ? pendingList.join(', ') : 'N/A';
};


export const Dashboard: React.FC<DashboardProps> = ({ jobs, onJobClick, getDepartmentForProcess }) => {
    const [currentView, setCurrentView] = useState<'ongoing' | 'completed' | 'detail'>('detail');
    const [filterValue, setFilterValue] = useState('');
    const [fullScreen, setFullScreen] = useState(false);
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

    const { processingJobs, completedJobs } = useMemo(() => {
        const processing: Job[] = [];
        const completed: Job[] = [];
        jobs.forEach(job => {
            if (job.completedAt && !job.deliveredAt) {
                completed.push(job);
            } else if (!job.completedAt) {
                processing.push(job);
            }
        });
        return { processingJobs: processing, completedJobs: completed };
    }, [jobs]);

    const filterJobs = (jobList: Job[]) => {
        if (!filterValue.trim()) return jobList;
        const filter = filterValue.toLowerCase();
        return jobList.filter(job => 
            job.jobNumber.toLowerCase().includes(filter) ||
            job.customerName.toLowerCase().includes(filter) ||
            job.addedDate.includes(filter) ||
            job.finishDate.includes(filter)
        );
    };
    
    const filteredProcessingJobs = useMemo(() => filterJobs(processingJobs), [processingJobs, filterValue]);
    const filteredCompletedJobs = useMemo(() => filterJobs(completedJobs), [completedJobs, filterValue]);
    const filteredAllJobs = useMemo(() => filterJobs(jobs), [jobs, filterValue]);

    const renderView = () => {
        switch (currentView) {
            case 'ongoing':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProcessingJobs.map(job => (
                            <div key={job.id} onClick={() => onJobClick(job)} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500 cursor-pointer hover:shadow-lg">
                                <h4 className="font-bold text-gray-900 text-lg truncate">{job.jobNumber}</h4>
                                <p className="text-sm text-gray-600">Customer: {job.customerName}</p>
                                <p className="text-sm text-gray-600">Finish by: {job.finishDate}</p>
                            </div>
                        ))}
                        {filteredProcessingJobs.length === 0 && <p className="text-center text-gray-500 py-4 col-span-full">No ongoing jobs to display.</p>}
                    </div>
                );
            case 'completed':
                 return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Finish Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCompletedJobs.map(job => (
                                <tr key={job.id} onClick={() => onJobClick(job)} className="hover:bg-gray-50 cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.jobNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.customerName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.finishDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.completedAt ? new Date(job.completedAt).toLocaleDateString() : 'N/A'}</td>
                                </tr>
                            ))}
                             {filteredCompletedJobs.length === 0 && (
                                <tr><td colSpan={4} className="text-center text-gray-500 py-4">No completed jobs to display.</td></tr>
                            )}
                        </tbody>
                    </table>
                 );
            case 'detail':
                return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-12 px-6 py-3"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Finish Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processing Dept</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending Depts</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAllJobs.map(job => (
                                <React.Fragment key={job.id}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            {job.jobDescription && (
                                                <button onClick={(e) => { e.stopPropagation(); setExpandedJobId(expandedJobId === job.id ? null : job.id); }} className="p-1 rounded-full hover:bg-gray-200">
                                                    {expandedJobId === job.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                </button>
                                            )}
                                        </td>
                                        <td onClick={() => onJobClick(job)} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer">{job.jobNumber}</td>
                                        <td onClick={() => onJobClick(job)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer">{job.customerName || 'N/A'}</td>
                                        <td onClick={() => onJobClick(job)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer">{job.addedDate}</td>
                                        <td onClick={() => onJobClick(job)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer">{job.finishDate}</td>
                                        <td onClick={() => onJobClick(job)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer">{getCurrentDepartmentsSummary(job)}</td>
                                        <td onClick={() => onJobClick(job)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer">{getPendingDepartmentsSummary(job, getDepartmentForProcess)}</td>
                                    </tr>
                                    {expandedJobId === job.id && (
                                        <tr className="bg-indigo-50">
                                            <td colSpan={7} className="px-12 py-3 text-sm text-gray-700">
                                                <p className="whitespace-pre-wrap break-words"><strong className="text-indigo-800">Description:</strong> {job.jobDescription}</p>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                             {filteredAllJobs.length === 0 && (
                                <tr><td colSpan={7} className="text-center text-gray-500 py-4">No jobs to display.</td></tr>
                            )}
                        </tbody>
                    </table>
                );
        }
    };

    const ongoingJobsCount = filteredProcessingJobs.length;

    return (
        <section className={`bg-white p-6 rounded-xl shadow-lg mb-8 max-w-7xl mx-auto flex flex-col ${fullScreen ? 'fixed inset-0 z-40' : 'h-[80vh]'}`}>
            <div className="flex justify-between items-center mb-4 border-b pb-3 flex-shrink-0">
                <h2 className="text-2xl font-bold text-indigo-700">Job Overview Dashboard</h2>
                <button onClick={() => setFullScreen(!fullScreen)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center gap-1">
                    {fullScreen ? <><MinimizeIcon /> Exit Full Screen</> : <><MaximizeIcon /> Full Screen</>}
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4 mb-4 p-4 bg-gray-50 rounded-lg flex-shrink-0">
                <div className="flex-grow w-full sm:w-auto">
                     <div className="flex justify-center border-b border-gray-200">
                        <button onClick={() => setCurrentView('ongoing')} className={`px-4 py-2 text-sm font-semibold ${currentView === 'ongoing' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>
                            Ongoing Work
                        </button>
                         <button onClick={() => setCurrentView('completed')} className={`px-4 py-2 text-sm font-semibold ${currentView === 'completed' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>
                            Completed Jobs
                        </button>
                         <button onClick={() => setCurrentView('detail')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg ${currentView === 'detail' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>
                            Detail View
                        </button>
                    </div>
                </div>
                <input 
                    type="text" 
                    value={filterValue} 
                    onChange={(e) => setFilterValue(e.target.value)} 
                    placeholder="Enter job number to filter..." 
                    className="w-full sm:w-1/3 block px-4 py-2 border border-gray-300 rounded-md shadow-sm" 
                />
            </div>
             <h3 className="text-xl font-bold text-gray-800 mb-4 flex-shrink-0">
                {currentView === 'ongoing' && `All Jobs - Ongoing Work - ${String(ongoingJobsCount).padStart(2, '0')}`}
                {currentView === 'completed' && 'All Jobs - Completed'}
                {currentView === 'detail' && 'All Jobs - Detail View'}
            </h3>
             <div className="overflow-auto flex-grow pr-2">
                {renderView()}
            </div>
        </section>
    );
};
