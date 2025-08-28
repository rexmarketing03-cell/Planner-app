import React, { useState, useMemo } from 'react';
import type { Job, Designer, OfficialStaff, Operator } from '../types';
import { ChevronLeftIcon, GripVerticalIcon, PlayIcon, PauseIcon, CheckIcon, EditIcon, TrashIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from '../components/Icons';
import { AddEligibleDesignerModal } from '../components/modals/AddEligibleDesignerModal';

interface DesignAdvanceProps {
    onBack: () => void;
    jobs: Job[];
    designers: Designer[];
    onAddDesigner: (name: string) => void;
    onRemoveDesigner: (id: string, name: string) => void;
    onRenameDesigner: (id: string, newName: string) => void;
    onDropJobOnDesigner: (jobId: string, designer: Designer) => void;
    onFinishDesign: (jobId: string) => void;
    onStartDesign: (jobId: string) => void;
    onHoldDesign: (jobId: string) => void;
    onResumeDesign: (jobId: string) => void;
    onJobClick: (jobId: string) => void;
    currentUser: OfficialStaff | Operator | null;
    officialStaff: OfficialStaff[];
}

const UnassignedJobCard: React.FC<{
    job: Job;
    onDragStart: (e: React.DragEvent, jobId: string) => void;
    isDraggable: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
}> = ({ job, onDragStart, isDraggable, isExpanded, onToggleExpand }) => (
    <div
        draggable={isDraggable}
        onDragStart={(e) => onDragStart(e, job.id)}
        className={`bg-white p-3 rounded-lg border shadow-sm ${isDraggable ? 'hover:shadow-md hover:border-blue-400' : 'opacity-70'}`}
    >
        <div className={`flex items-start gap-2 ${isDraggable ? 'cursor-grab' : 'cursor-not-allowed'}`}>
            <GripVerticalIcon />
            <div className="flex-grow">
                 <p className="font-bold text-gray-800 truncate" title={`${job.jobNumber} - ${job.customerName}`}>{job.jobNumber} - {job.customerName}</p>
                <p className="text-xs text-gray-500 font-semibold">Finish: {job.finishDate}</p>
            </div>
        </div>
        {job.jobDescription && (
            <>
                <div className="text-right mt-1">
                    <button onClick={onToggleExpand} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-auto">
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

const AssignedJobCard: React.FC<{
    job: Job;
    onFinishDesign: (jobId: string) => void;
    onStartDesign: (jobId: string) => void;
    onHoldDesign: (jobId: string) => void;
    onResumeDesign: (jobId: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}> = ({ job, onFinishDesign, onStartDesign, onHoldDesign, onResumeDesign, isExpanded, onToggleExpand }) => {
    const statusColor = useMemo(() => {
        switch (job.designerStatus) {
            case 'In Progress': return 'border-green-500';
            case 'On Hold': return 'border-yellow-500';
            case 'Pending':
            default: return 'border-indigo-500';
        }
    }, [job.designerStatus]);

    const daysRemaining = job.designTargetDate ? (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(job.designTargetDate);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    })() : null;

    let remainingText = '';
    let remainingColor = 'text-gray-500';
    if (daysRemaining !== null) {
        if (daysRemaining < 0) {
            remainingText = `${Math.abs(daysRemaining)} day(s) overdue`;
            remainingColor = 'text-red-500';
        } else if (daysRemaining === 0) {
            remainingText = 'Due today';
            remainingColor = 'text-yellow-600';
        } else {
            remainingText = `${daysRemaining} day(s) remaining`;
        }
    }
    
    return (
        <div className={`bg-white p-3 rounded-lg border-l-4 ${statusColor} shadow-sm`}>
            <div>
                <p className="font-bold text-gray-800 truncate">{job.jobNumber}</p>
                <p className="text-xs text-gray-500">{job.customerName}</p>
                <p className="text-xs text-gray-500 font-semibold mt-1">Target: {job.designTargetDate}</p>
                {remainingText && <p className={`text-xs font-bold mt-1 ${remainingColor}`}>{remainingText}</p>}
            </div>

            {job.jobDescription && (
                 <>
                    <div className="text-right mt-1">
                        <button onClick={onToggleExpand} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-auto">
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

            <div className="mt-2 pt-2 border-t">
                {(!job.designerStatus || job.designerStatus === 'Pending') && (
                     <button
                        onClick={() => onStartDesign(job.id)}
                        className="w-full mt-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-semibold"
                    > <PlayIcon /> Start Design </button>
                )}
                 {job.designerStatus === 'In Progress' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onHoldDesign(job.id)}
                            className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm font-semibold"
                        > <PauseIcon /> Hold </button>
                        <button
                            onClick={() => onFinishDesign(job.id)}
                            className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-semibold"
                        > <CheckIcon /> Finish </button>
                    </div>
                 )}
                 {job.designerStatus === 'On Hold' && (
                     <button
                        onClick={() => onResumeDesign(job.id)}
                        className="w-full mt-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-semibold"
                    > <PlayIcon /> Resume </button>
                 )}
            </div>
        </div>
    );
};

const CompletedJobCard: React.FC<{ job: Job; onClick: (jobId: string) => void; isSentToPlanning: boolean; isExpanded: boolean; onToggleExpand: () => void; }> = ({ job, onClick, isSentToPlanning, isExpanded, onToggleExpand }) => {
    const duration = job.designerStartedAt && job.designerFinishedAt ? (() => {
        const start = new Date(job.designerStartedAt);
        start.setHours(0, 0, 0, 0);
        const finish = new Date(job.designerFinishedAt);
        finish.setHours(0, 0, 0, 0);
        const diffTime = finish.getTime() - start.getTime();
        // Add 1 to be inclusive of the start day
        return (diffTime / (1000 * 60 * 60 * 24)) + 1;
    })() : null;

    let durationText = '';
    if (duration !== null) {
        if (duration === 1) {
            durationText = 'Took 1 day';
        } else {
            durationText = `Took ${duration} day(s)`;
        }
    }
    
    return (
        <div className={`bg-white p-3 rounded-lg border-l-4 ${isSentToPlanning ? 'border-green-500' : 'border-gray-400'} shadow-sm`}>
            <div onClick={() => onClick(job.id)} className="cursor-pointer">
                {isSentToPlanning && (
                    <div className="float-right bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" />
                        Sent
                    </div>
                )}
                <p className="font-bold text-gray-800 truncate">{job.jobNumber}</p>
                <p className="text-xs text-gray-500">{job.customerName}</p>
                <p className="text-xs text-gray-500 font-semibold mt-1">Finished: {job.designerFinishedAt ? new Date(job.designerFinishedAt).toLocaleDateString() : 'N/A'}</p>
                {durationText && <p className="text-xs text-gray-500 font-semibold">{durationText}</p>}
            </div>
             {job.jobDescription && (
                <>
                    <div className="text-right mt-1">
                        <button onClick={onToggleExpand} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-auto">
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
};

export const DesignAdvance: React.FC<DesignAdvanceProps> = ({ 
    onBack, 
    jobs, 
    designers,
    onAddDesigner,
    onRemoveDesigner,
    onRenameDesigner,
    onDropJobOnDesigner,
    onFinishDesign,
    onStartDesign,
    onHoldDesign,
    onResumeDesign,
    onJobClick,
    currentUser, 
    officialStaff,
}) => {
    const [draggedOverDesignerId, setDraggedOverDesignerId] = useState<string | null>(null);
    const [showAddDesignerModal, setShowAddDesignerModal] = useState(false);
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});

    const toggleJobExpansion = (jobId: string) => {
        setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
    };

    const isHeadOfDesigner = useMemo(() => 
        currentUser && 'permissions' in currentUser && currentUser.permissions.includes('Head Of Designer')
    , [currentUser]);
    const isDesignerOnly = useMemo(() => currentUser && 'permissions' in currentUser && currentUser.permissions.includes('Designer') && !isHeadOfDesigner, [currentUser, isHeadOfDesigner]);
    const currentDesignerProfile = useMemo(() => isDesignerOnly ? designers.find(d => d.name === currentUser?.name) : null, [designers, currentUser, isDesignerOnly]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const { unassignedJobs, assignedJobsToDesigners, completedDesignJobs } = useMemo(() => {
        const unassigned: Job[] = [];
        const assigned: { [key: string]: Job[] } = {};
        const completed: Job[] = [];
        designers.forEach(d => { assigned[d.id] = []; });

        const designJobs = jobs.filter(job => job.jobType === 'Service' && job.designRequired);

        designJobs.forEach(job => {
            // A designer should only see jobs they completed. Head sees all.
            if (job.designFinished && (!isDesignerOnly || job.designerId === currentDesignerProfile?.id)) {
                completed.push(job);
            } else if (job.designerId && assigned[job.designerId] && !job.designCompleted) {
                // A designer should only see jobs assigned to them. Head sees all.
                if (!isDesignerOnly || job.designerId === currentDesignerProfile?.id) {
                    assigned[job.designerId].push(job);
                }
            } else if (!job.designerId && !job.designCompleted && !isDesignerOnly) {
                // Only Head should see unassigned jobs.
                unassigned.push(job);
            }
        });
        
        completed.sort((a,b) => {
            const dateA = a.designerFinishedAt ? new Date(a.designerFinishedAt).getTime() : 0;
            const dateB = b.designerFinishedAt ? new Date(b.designerFinishedAt).getTime() : 0;
            return dateB - dateA;
        });

        return { unassignedJobs: unassigned, assignedJobsToDesigners: assigned, completedDesignJobs: completed };
    }, [jobs, designers, isDesignerOnly, currentDesignerProfile]);
    
    const filteredUnassignedJobs = useMemo(() => {
        const filterText = (filters['unassigned'] || '').toLowerCase();
        if (!filterText) return unassignedJobs;
        return unassignedJobs.filter(job => 
            job.jobNumber.toLowerCase().includes(filterText) ||
            job.customerName.toLowerCase().includes(filterText) ||
            job.finishDate.includes(filterText)
        );
    }, [unassignedJobs, filters]);

    const filteredCompletedJobs = useMemo(() => {
        const filterText = (filters['completed'] || '').toLowerCase();
        if (!filterText) return completedDesignJobs;
        return completedDesignJobs.filter(job => 
            job.jobNumber.toLowerCase().includes(filterText) ||
            job.customerName.toLowerCase().includes(filterText) ||
            (job.designerFinishedAt && new Date(job.designerFinishedAt).toLocaleDateString().includes(filterText))
        );
    }, [completedDesignJobs, filters]);


    const handleDragStart = (e: React.DragEvent, jobId: string) => {
        e.dataTransfer.setData("jobId", jobId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDragEnter = (e: React.DragEvent, designerId: string) => {
        e.preventDefault();
        setDraggedOverDesignerId(designerId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggedOverDesignerId(null);
    };

    const handleDrop = (e: React.DragEvent, designer: Designer) => {
        if (!isHeadOfDesigner) return;
        e.preventDefault();
        setDraggedOverDesignerId(null);
        const jobId = e.dataTransfer.getData("jobId");
        if (jobId) {
            onDropJobOnDesigner(jobId, designer);
        }
    };

    const handleSaveNewDesigner = (name: string) => {
        onAddDesigner(name);
        setShowAddDesignerModal(false);
    };


    return (
        <>
        <AddEligibleDesignerModal 
            show={showAddDesignerModal}
            onClose={() => setShowAddDesignerModal(false)}
            onSave={handleSaveNewDesigner}
            officialStaff={officialStaff}
            designers={designers}
        />
        <div className="h-screen bg-gray-100 flex flex-col p-4 font-sans">
            <header className="flex items-center justify-between mb-4 flex-shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border text-gray-700 hover:bg-gray-100">
                    <ChevronLeftIcon />
                    Back to Workflow
                </button>
                <h1 className="text-3xl font-bold text-indigo-800">Advanced Design Management</h1>
                <div className="w-48"></div>
            </header>

            <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
                {/* Unassigned Jobs Column */}
                {!isDesignerOnly && (
                    <div className="bg-white rounded-xl shadow-lg border p-4 flex flex-col flex-shrink-0 w-80">
                    <div className="flex-shrink-0">
                        <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">New Jobs ({filteredUnassignedJobs.length})</h2>
                        <input
                            type="text"
                            placeholder="Filter by Job#, Customer..."
                            value={filters['unassigned'] || ''}
                            onChange={(e) => handleFilterChange('unassigned', e.target.value)}
                            className="w-full px-2 py-1 border rounded-md text-sm mb-2"
                        />
                    </div>
                    <div className="flex-grow space-y-3 overflow-y-auto pr-2 bg-gray-50 p-2 rounded-md">
                        {filteredUnassignedJobs.length > 0 ? (
                             filteredUnassignedJobs.map(job => (
                                <UnassignedJobCard key={job.id} job={job} onDragStart={handleDragStart} isDraggable={isHeadOfDesigner ?? false} isExpanded={!!expandedJobs[job.id]} onToggleExpand={() => toggleJobExpansion(job.id)} />
                            ))
                        ) : (
                            <div className="text-center text-gray-500 pt-10">
                                <p>No new jobs to assign.</p>
                            </div>
                        )}
                    </div>
                </div>
                )}

                {/* Designer Columns */}
                {(isHeadOfDesigner ? designers : (currentDesignerProfile ? [currentDesignerProfile] : [])).map(designer => {
                    const jobsForDesigner = assignedJobsToDesigners[designer.id] || [];
                    const filterText = (filters[designer.id] || '').toLowerCase();
                    const filteredJobsForDesigner = !filterText ? jobsForDesigner : jobsForDesigner.filter(job => 
                        job.jobNumber.toLowerCase().includes(filterText) ||
                        job.customerName.toLowerCase().includes(filterText) ||
                        (job.designTargetDate && job.designTargetDate.includes(filterText))
                    );

                    return (
                        <div
                            key={designer.id}
                            onDragOver={isHeadOfDesigner ? handleDragOver : undefined}
                            onDrop={isHeadOfDesigner ? (e) => handleDrop(e, designer) : undefined}
                            onDragEnter={isHeadOfDesigner ? (e) => handleDragEnter(e, designer.id) : undefined}
                            onDragLeave={isHeadOfDesigner ? handleDragLeave : undefined}
                            className={`bg-white rounded-xl shadow-lg border p-4 flex flex-col transition-colors duration-200 flex-shrink-0 w-80 ${draggedOverDesignerId === designer.id ? 'bg-indigo-50' : ''}`}
                        >
                            <div className="flex-shrink-0">
                                <div className="flex justify-between items-center mb-3 border-b pb-2">
                                    <h2 className="text-xl font-semibold text-indigo-700 truncate">{designer.name} ({filteredJobsForDesigner.length})</h2>
                                    {isHeadOfDesigner && (
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => onRemoveDesigner(designer.id, designer.name)} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full" title="Delete"><TrashIcon/></button>
                                        </div>
                                    )}
                                </div>
                                 <input
                                    type="text"
                                    placeholder="Filter by Job#, Customer..."
                                    value={filters[designer.id] || ''}
                                    onChange={(e) => handleFilterChange(designer.id, e.target.value)}
                                    className="w-full px-2 py-1 border rounded-md text-sm mb-2"
                                />
                            </div>
                            <div className={`flex-grow space-y-3 overflow-y-auto pr-2 border-2 border-dashed rounded-md p-2 relative ${draggedOverDesignerId === designer.id ? 'border-indigo-400' : 'border-gray-300'}`}>
                                 {filteredJobsForDesigner.length > 0 ? (
                                    filteredJobsForDesigner.map(job => (
                                        <AssignedJobCard
                                            key={job.id}
                                            job={job}
                                            onStartDesign={onStartDesign}
                                            onHoldDesign={onHoldDesign}
                                            onResumeDesign={onResumeDesign}
                                            onFinishDesign={onFinishDesign}
                                            isExpanded={!!expandedJobs[job.id]}
                                            onToggleExpand={() => toggleJobExpansion(job.id)}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 pt-10 pointer-events-none">
                                        <p>Drag jobs here to assign</p>
                                    </div>
                                )}
                                 {draggedOverDesignerId === designer.id && (
                                    <div className="absolute inset-0 flex items-center justify-center text-indigo-700 font-semibold bg-indigo-200 bg-opacity-75 rounded-md pointer-events-none">
                                        <p>Drop to Assign</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
                
                 {/* Add Designer Button */}
                 {isHeadOfDesigner && (
                    <div className="flex-shrink-0 w-80 flex items-center justify-center">
                        <button 
                            onClick={() => setShowAddDesignerModal(true)}
                            className="w-full h-full flex flex-col items-center justify-center bg-gray-200 border-2 border-dashed border-gray-400 rounded-xl text-gray-600 hover:bg-gray-300 hover:border-gray-500 transition-colors"
                        >
                            <PlusIcon />
                            <span className="mt-2 font-semibold">Add Designer</span>
                        </button>
                    </div>
                )}

                {/* Completed Design Column */}
                 <div className="bg-white rounded-xl shadow-lg border p-4 flex flex-col flex-shrink-0 w-80">
                    <div className="flex-shrink-0">
                        <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">Completed Designs ({filteredCompletedJobs.length})</h2>
                        <input
                            type="text"
                            placeholder="Filter by Job#, Customer..."
                            value={filters['completed'] || ''}
                            onChange={(e) => handleFilterChange('completed', e.target.value)}
                            className="w-full px-2 py-1 border rounded-md text-sm mb-2"
                        />
                    </div>
                    <div className="flex-grow space-y-3 overflow-y-auto pr-2 bg-gray-50 p-2 rounded-md">
                        {filteredCompletedJobs.length > 0 ? (
                             filteredCompletedJobs.map(job => (
                                <CompletedJobCard 
                                    key={job.id} 
                                    job={job} 
                                    onClick={onJobClick}
                                    isSentToPlanning={!!job.designCompleted}
                                    isExpanded={!!expandedJobs[job.id]}
                                    onToggleExpand={() => toggleJobExpansion(job.id)}
                                />
                            ))
                        ) : (
                            <div className="text-center text-gray-500 pt-10">
                                <p>No designs completed yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};
