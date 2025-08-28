import React, { useState, useMemo } from 'react';
import type { Job, Programmer, OfficialStaff } from '../../types';
import { ChevronLeftIcon, GripVerticalIcon, PlayIcon, PauseIcon, CheckIcon, EditIcon, TrashIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from '../components/Icons';
import { DesignerModal } from '../components/modals/DesignerModal';
import { AddEligibleProgrammerModal } from '../components/modals/AddEligibleProgrammerModal';

interface ProgrammingAdvanceProps {
    onBack: () => void;
    jobs: Job[];
    programmers: Programmer[];
    onAddProgrammer: (name: string) => void;
    onRemoveProgrammer: (id: string, name: string) => void;
    onRenameProgrammer: (id: string, newName: string) => void;
    onDropJobOnProgrammer: (jobId: string, programmer: Programmer) => void;
    onFinishProgramming: (jobId: string) => void;
    onStartProgramming: (jobId: string) => void;
    onHoldProgramming: (jobId: string) => void;
    onResumeProgramming: (jobId: string) => void;
    onJobClick: (jobId: string) => void;
    officialStaff: OfficialStaff[];
}

const UnassignedJobCard: React.FC<{
    job: Job;
    onDragStart: (e: React.DragEvent, jobId: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}> = ({ job, onDragStart, isExpanded, onToggleExpand }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, job.id)}
        className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md hover:border-blue-400 cursor-grab"
    >
        <div className="flex items-start gap-2">
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
    onFinishProgramming: (jobId: string) => void;
    onStartProgramming: (jobId: string) => void;
    onHoldProgramming: (jobId: string) => void;
    onResumeProgramming: (jobId: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}> = ({ job, onFinishProgramming, onStartProgramming, onHoldProgramming, onResumeProgramming, isExpanded, onToggleExpand }) => {
    const statusColor = useMemo(() => {
        switch (job.programmerStatus) {
            case 'In Progress': return 'border-green-500';
            case 'On Hold': return 'border-yellow-500';
            case 'Pending':
            default: return 'border-indigo-500';
        }
    }, [job.programmerStatus]);

    const daysRemaining = job.programmingTargetDate ? (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(job.programmingTargetDate);
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
                <p className="text-xs text-gray-500 font-semibold mt-1">Target: {job.programmingTargetDate}</p>
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
                {(!job.programmerStatus || job.programmerStatus === 'Pending') && (
                     <button
                        onClick={() => onStartProgramming(job.id)}
                        className="w-full mt-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-semibold"
                    > <PlayIcon /> Start Programming </button>
                )}
                 {job.programmerStatus === 'In Progress' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onHoldProgramming(job.id)}
                            className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm font-semibold"
                        > <PauseIcon /> Hold </button>
                        <button
                            onClick={() => onFinishProgramming(job.id)}
                            className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-semibold"
                        > <CheckIcon /> Finish </button>
                    </div>
                 )}
                 {job.programmerStatus === 'On Hold' && (
                     <button
                        onClick={() => onResumeProgramming(job.id)}
                        className="w-full mt-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-semibold"
                    > <PlayIcon /> Resume </button>
                 )}
            </div>
        </div>
    );
};

const CompletedJobCard: React.FC<{ job: Job; onClick: (jobId: string) => void; isSentToPlanning: boolean; isExpanded: boolean; onToggleExpand: () => void; }> = ({ job, onClick, isSentToPlanning, isExpanded, onToggleExpand }) => {
    const duration = job.programmerStartedAt && job.programmerFinishedAt ? (() => {
        const start = new Date(job.programmerStartedAt);
        start.setHours(0, 0, 0, 0);
        const finish = new Date(job.programmerFinishedAt);
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
        <div 
            className={`bg-white p-3 rounded-lg border-l-4 ${isSentToPlanning ? 'border-green-500' : 'border-gray-400'} shadow-sm`}
        >
            <div onClick={() => onClick(job.id)} className="cursor-pointer">
                {isSentToPlanning && (
                    <div className="float-right bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" />
                        Sent
                    </div>
                )}
                <p className="font-bold text-gray-800 truncate">{job.jobNumber}</p>
                <p className="text-xs text-gray-500">{job.customerName}</p>
                <p className="text-xs text-gray-500 font-semibold mt-1">Finished: {job.programmerFinishedAt ? new Date(job.programmerFinishedAt).toLocaleDateString() : 'N/A'}</p>
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

export const ProgrammingAdvance: React.FC<ProgrammingAdvanceProps> = ({ 
    onBack, 
    jobs, 
    programmers,
    onAddProgrammer,
    onRemoveProgrammer,
    onRenameProgrammer,
    onDropJobOnProgrammer,
    onFinishProgramming,
    onStartProgramming,
    onHoldProgramming,
    onResumeProgramming,
    onJobClick,
    officialStaff,
}) => {
    const [draggedOverProgrammerId, setDraggedOverProgrammerId] = useState<string | null>(null);
    const [showAddProgrammerModal, setShowAddProgrammerModal] = useState(false);
    const [programmerToRename, setProgrammerToRename] = useState<Programmer | null>(null);
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});

    const toggleJobExpansion = (jobId: string) => {
        setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const { unassignedJobs, assignedJobsToProgrammers, completedProgrammingJobs } = useMemo(() => {
        const unassigned: Job[] = [];
        const assigned: { [key: string]: Job[] } = {};
        const completed: Job[] = [];
        programmers.forEach(p => { assigned[p.id] = []; });

        const programmingJobs = jobs.filter(job => job.jobType === 'Service' && job.programmingRequired);

        programmingJobs.forEach(job => {
            if (job.programmingFinished) {
                completed.push(job);
            } else if (job.programmerId && assigned[job.programmerId] && !job.programmingCompleted) {
                assigned[job.programmerId].push(job);
            } else if (!job.programmerId && !job.programmingCompleted) {
                unassigned.push(job);
            }
        });
        
        completed.sort((a,b) => {
            const dateA = a.programmerFinishedAt ? new Date(a.programmerFinishedAt).getTime() : 0;
            const dateB = b.programmerFinishedAt ? new Date(b.programmerFinishedAt).getTime() : 0;
            return dateB - dateA;
        });

        return { unassignedJobs: unassigned, assignedJobsToProgrammers: assigned, completedProgrammingJobs: completed };
    }, [jobs, programmers]);
    
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
        if (!filterText) return completedProgrammingJobs;
        return completedProgrammingJobs.filter(job => 
            job.jobNumber.toLowerCase().includes(filterText) ||
            job.customerName.toLowerCase().includes(filterText) ||
            (job.programmerFinishedAt && new Date(job.programmerFinishedAt).toLocaleDateString().includes(filterText))
        );
    }, [completedProgrammingJobs, filters]);


    const handleDragStart = (e: React.DragEvent, jobId: string) => {
        e.dataTransfer.setData("jobId", jobId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDragEnter = (e: React.DragEvent, programmerId: string) => {
        e.preventDefault();
        setDraggedOverProgrammerId(programmerId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggedOverProgrammerId(null);
    };

    const handleDrop = (e: React.DragEvent, programmer: Programmer) => {
        e.preventDefault();
        setDraggedOverProgrammerId(null);
        const jobId = e.dataTransfer.getData("jobId");
        if (jobId) {
            onDropJobOnProgrammer(jobId, programmer);
        }
    };

    const handleSaveNewProgrammer = (name: string) => {
        onAddProgrammer(name);
        setShowAddProgrammerModal(false);
    };

    const handleSaveRenameProgrammer = (newName: string) => {
        if (programmerToRename) {
            onRenameProgrammer(programmerToRename.id, newName);
        }
        setProgrammerToRename(null);
    };

    return (
        <>
        <AddEligibleProgrammerModal 
            show={showAddProgrammerModal}
            onClose={() => setShowAddProgrammerModal(false)}
            onSave={handleSaveNewProgrammer}
            officialStaff={officialStaff}
            programmers={programmers}
        />
        <DesignerModal 
            show={!!programmerToRename}
            onClose={() => setProgrammerToRename(null)}
            onSave={handleSaveRenameProgrammer}
            title="Rename Programmer"
            initialValue={programmerToRename?.name}
        />
        <div className="h-screen bg-gray-100 flex flex-col p-4 font-sans">
            <header className="flex items-center justify-between mb-4 flex-shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border text-gray-700 hover:bg-gray-100">
                    <ChevronLeftIcon />
                    Back to Workflow
                </button>
                <h1 className="text-3xl font-bold text-indigo-800">Advanced Programming Management</h1>
                <div className="w-48"></div>
            </header>

            <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
                {/* Unassigned Jobs Column */}
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
                                <UnassignedJobCard key={job.id} job={job} onDragStart={handleDragStart} isExpanded={!!expandedJobs[job.id]} onToggleExpand={() => toggleJobExpansion(job.id)} />
                            ))
                        ) : (
                            <div className="text-center text-gray-500 pt-10">
                                <p>No new jobs to assign.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Programmer Columns */}
                {programmers.map(programmer => {
                    const jobsForProgrammer = assignedJobsToProgrammers[programmer.id] || [];
                    const filterText = (filters[programmer.id] || '').toLowerCase();
                    const filteredJobsForProgrammer = !filterText ? jobsForProgrammer : jobsForProgrammer.filter(job => 
                        job.jobNumber.toLowerCase().includes(filterText) ||
                        job.customerName.toLowerCase().includes(filterText) ||
                        (job.programmingTargetDate && job.programmingTargetDate.includes(filterText))
                    );

                    return (
                        <div
                            key={programmer.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, programmer)}
                            onDragEnter={(e) => handleDragEnter(e, programmer.id)}
                            onDragLeave={handleDragLeave}
                            className={`bg-white rounded-xl shadow-lg border p-4 flex flex-col transition-colors duration-200 flex-shrink-0 w-80 ${draggedOverProgrammerId === programmer.id ? 'bg-indigo-50' : ''}`}
                        >
                            <div className="flex-shrink-0">
                                <div className="flex justify-between items-center mb-3 border-b pb-2">
                                    <h2 className="text-xl font-semibold text-indigo-700 truncate">{programmer.name} ({filteredJobsForProgrammer.length})</h2>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setProgrammerToRename(programmer)} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full" title="Rename"><EditIcon/></button>
                                        <button onClick={() => onRemoveProgrammer(programmer.id, programmer.name)} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full" title="Delete"><TrashIcon/></button>
                                    </div>
                                </div>
                                 <input
                                    type="text"
                                    placeholder="Filter by Job#, Customer..."
                                    value={filters[programmer.id] || ''}
                                    onChange={(e) => handleFilterChange(programmer.id, e.target.value)}
                                    className="w-full px-2 py-1 border rounded-md text-sm mb-2"
                                />
                            </div>
                            <div className={`flex-grow space-y-3 overflow-y-auto pr-2 border-2 border-dashed rounded-md p-2 relative ${draggedOverProgrammerId === programmer.id ? 'border-indigo-400' : 'border-gray-300'}`}>
                                 {filteredJobsForProgrammer.length > 0 ? (
                                    filteredJobsForProgrammer.map(job => (
                                        <AssignedJobCard
                                            key={job.id}
                                            job={job}
                                            onStartProgramming={onStartProgramming}
                                            onHoldProgramming={onHoldProgramming}
                                            onResumeProgramming={onResumeProgramming}
                                            onFinishProgramming={onFinishProgramming}
                                            isExpanded={!!expandedJobs[job.id]}
                                            onToggleExpand={() => toggleJobExpansion(job.id)}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 pt-10 pointer-events-none">
                                        <p>Drag jobs here to assign</p>
                                    </div>
                                )}
                                 {draggedOverProgrammerId === programmer.id && (
                                    <div className="absolute inset-0 flex items-center justify-center text-indigo-700 font-semibold bg-indigo-200 bg-opacity-75 rounded-md pointer-events-none">
                                        <p>Drop to Assign</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
                
                 {/* Add Programmer Button */}
                 <div className="flex-shrink-0 w-80 flex items-center justify-center">
                    <button 
                        onClick={() => setShowAddProgrammerModal(true)}
                        className="w-full h-full flex flex-col items-center justify-center bg-gray-200 border-2 border-dashed border-gray-400 rounded-xl text-gray-600 hover:bg-gray-300 hover:border-gray-500 transition-colors"
                    >
                        <PlusIcon />
                        <span className="mt-2 font-semibold">Add Programmer</span>
                    </button>
                </div>

                {/* Completed Programming Column */}
                 <div className="bg-white rounded-xl shadow-lg border p-4 flex flex-col flex-shrink-0 w-80">
                    <div className="flex-shrink-0">
                        <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">Completed Programming ({filteredCompletedJobs.length})</h2>
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
                                    isSentToPlanning={!!job.programmingCompleted}
                                    isExpanded={!!expandedJobs[job.id]}
                                    onToggleExpand={() => toggleJobExpansion(job.id)}
                                />
                            ))
                        ) : (
                            <div className="text-center text-gray-500 pt-10">
                                <p>No programs completed yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};
