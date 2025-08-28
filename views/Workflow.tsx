





import React, { useState } from 'react';
import type { Job } from '../types';
import { MaximizeIcon, MinimizeIcon, PrinterIcon, AlertTriangleIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '../components/Icons';

interface WorkflowProps {
    departments: string[];
    jobs: Job[];
    fullScreenDepartment: string | null;
    setFullScreenDepartment: (dept: string | null) => void;
    openPrintModal: (department: string) => void;
    onJobClick: (job: Job, department: string) => void;
    onProductJobClick: (job: Job) => void;
    onAdvanceClick?: (department: string) => void;
    onJobDetailClick?: (job: Job) => void;
    viewContext?: 'service' | 'product';
}

export const Workflow: React.FC<WorkflowProps> = ({ departments, jobs, fullScreenDepartment, setFullScreenDepartment, openPrintModal, onJobClick, onProductJobClick, onAdvanceClick, onJobDetailClick }) => {
    const [departmentFilters, setDepartmentFilters] = useState<{ [key: string]: string }>({});
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

    const handleFilterChange = (department: string, value: string) => {
        setDepartmentFilters(prev => ({ ...prev, [department]: value }));
    };

    return (
        <section className="mt-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {departments.map(department => {
                    const jobsInDept = jobs.filter(job => {
                        // Terminal states are handled first and can contain any job type
                        if (department === "Completed") {
                            return !!job.completedAt && !job.deliveredAt;
                        }
                        if (department === "Delivered") {
                            return !!job.deliveredAt;
                        }

                        // Urgent jobs must be active (not completed)
                        if (department === "Urgent") {
                            return !job.completedAt && job.priority === "Urgent";
                        }
                        
                        // Any job that is already complete should not appear in any active department.
                        if (job.completedAt) {
                            return false;
                        }

                        // Special filter for Material Ready Pending - shows jobs that NEED material actions,
                        // regardless of their current department.
                        if (department === "Material Ready Pending") {
                            return job.jobType === 'Service' && !job.completedAt && job.drawings && job.drawings.some(d => d.materialStatus === 'Pending' || d.materialStatus === 'Awaiting Stock');
                        }

                        // Filter for Product department
                        if (department === "Products") {
                            return job.jobType === 'Product';
                        }
                        
                        // Filter for Design department
                        if (department === "Design") {
                            return job.jobType === 'Service' && job.designRequired && !job.designCompleted;
                        }
                        
                        // Filter for Programming department
                        if (department === "Programming") {
                            return job.jobType === 'Service' && job.programmingRequired && !job.programmingCompleted;
                        }

                        // Filter for Planning department with backward compatibility
                        if (department === "Planning") {
                            return job.jobType === 'Service' && (
                                (job.drawings && job.drawings.some(d => d.currentDepartment === "Planning")) ||
                                (job.designCompleted === true && (!job.drawings || job.drawings.length === 0)) // Legacy data
                            );
                        }

                        // Default filter for other service departments (Milling, Lathe, etc.)
                        return job.jobType === 'Service' && job.drawings && job.drawings.some(d => d.currentDepartment === department);

                    }).filter(job => {
                        const filterText = (departmentFilters[department] || '').toLowerCase();
                        if (!filterText) return true;
                        
                        const searchText = `${job.jobNumber} ${job.finishDate} ${job.customerName || ''}`.toLowerCase();
                        return searchText.includes(filterText);
                    });

                    const isFullScreen = fullScreenDepartment === department;
                    const cardColor = department === 'Delivered' ? 'border-green-500' : 'border-indigo-500';

                    return (
                        <div key={department} className={`bg-white rounded-xl shadow-lg p-5 border-t-4 ${cardColor} flex flex-col ${isFullScreen ? 'fixed inset-4 z-40' : 'h-[50vh]'}`}>
                            <div className="flex justify-between items-center mb-2 pb-2 border-b flex-shrink-0">
                                <h3 className="text-xl font-semibold text-indigo-700">{department} ({jobsInDept.length})</h3>
                                <div className="flex items-center space-x-2">
                                    {(department === 'Design' || department === 'Programming') && onAdvanceClick && (
                                         <button onClick={() => onAdvanceClick(department)} className="p-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 flex items-center gap-1 text-sm" title="Advanced View">
                                            <SparklesIcon /> Advance
                                        </button>
                                    )}
                                    <button onClick={() => openPrintModal(department)} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300" title="Print Jobs"><PrinterIcon /></button>
                                    <button onClick={() => setFullScreenDepartment(isFullScreen ? null : department)} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300">
                                        {isFullScreen ? <MinimizeIcon /> : <MaximizeIcon />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex-shrink-0 mb-2">
                                <input type="text" placeholder="Filter jobs..." value={departmentFilters[department] || ''} onChange={e => handleFilterChange(department, e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm" />
                            </div>
                            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                                {jobsInDept.length > 0 ? (
                                    jobsInDept.sort((a, b) => new Date(a.finishDate).getTime() - new Date(b.finishDate).getTime()).map(job => {
                                        const isAwaitingMaterial = job.drawings?.some(d => d.materialStatus === 'Awaiting Stock');
                                        const needsReplan = department === 'Planning' && job.drawings?.some(d => d.replanRequired);
                                        const isExpanded = expandedJobId === job.id;
                                        return (
                                            <div 
                                                key={job.id} 
                                                className={`bg-gray-100 p-3 rounded-lg shadow-sm border ${job.priority === 'Urgent' ? 'border-red-400' : 'border-gray-200'} ${department === 'Delivered' ? 'bg-green-50' : ''}`}
                                            >
                                                <div 
                                                    onClick={() => {
                                                        if ((department === 'Completed' || department === 'Delivered') && onJobDetailClick) {
                                                            onJobDetailClick(job);
                                                            return;
                                                        }
                                        
                                                        if (job.jobType === 'Product' && department === 'Products') {
                                                            onProductJobClick(job);
                                                        } else if (job.jobType === 'Service') {
                                                            onJobClick(job, department);
                                                        }
                                                    }} 
                                                    className="font-bold text-gray-900 flex justify-between items-start cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        {job.priority === 'Urgent' && !job.completedAt && <AlertTriangleIcon className="h-5 w-5 text-red-500" />}
                                                        <span className="truncate">{job.jobNumber} - {job.finishDate} - {job.customerName || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {needsReplan && (
                                                             <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-200 text-orange-800 flex-shrink-0 flex items-center gap-1">
                                                                <AlertTriangleIcon className="w-3 h-3" /> Need A Change
                                                            </span>
                                                        )}
                                                        {isAwaitingMaterial && (
                                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-200 text-yellow-800 flex-shrink-0">
                                                                Awaiting Material
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {job.jobDescription && (
                                                    <>
                                                        <div className="text-right mt-2">
                                                            <button 
                                                                onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
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
                                    })
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
