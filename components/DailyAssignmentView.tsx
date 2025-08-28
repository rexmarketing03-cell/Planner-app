import React, { useState, useMemo } from 'react';
import type { Job, Operator, Process } from '../types';
import { ChevronLeftIcon } from './Icons';
import { AssignmentConflictModal } from './modals/AssignmentConflictModal';

interface DailyAssignmentViewProps {
    selectedDate: string;
    jobs: Job[];
    operators: Operator[];
    onAssignOperator: (jobId: string, drawingId: string, processId: string, operatorId: string | null, isOvertime?: boolean) => void;
    onBack: () => void;
    getDepartmentForProcess: (processName: string) => string | null;
    allDepartments: string[];
}

type ProcessWithJobInfo = Process & {
    jobId: string;
    drawingId: string;
    jobNumber: string;
    drawingName: string;
};

// New data structure type
type JobsForDateMap = Map<string, { 
    jobNumber: string; 
    customerName: string; 
    drawings: Map<string, { 
        drawingName: string; 
        processes: ProcessWithJobInfo[] 
    }> 
}>;


export const DailyAssignmentView: React.FC<DailyAssignmentViewProps> = ({ selectedDate, jobs, operators, onAssignOperator, onBack, getDepartmentForProcess }) => {
    
    const [conflictData, setConflictData] = useState<{
        jobId: string;
        drawingId: string;
        processId: string;
        operator: Operator;
        processDurationHours: number;
        currentHours: number;
        alternativeOperators: Operator[];
        jobNumber: string;
        drawingName: string;
    } | null>(null);

    // NEW: Restructure data by Job and then by Drawing
    const jobsForDate = useMemo((): JobsForDateMap => {
        const jobsMap: JobsForDateMap = new Map();
        
        jobs.forEach(job => {
            job.drawings?.forEach(drawing => {
                const processesOnDate = drawing.processes.filter(p => p.plannedDate === selectedDate);
                
                if (processesOnDate.length > 0) {
                    if (!jobsMap.has(job.id)) {
                        jobsMap.set(job.id, {
                            jobNumber: job.jobNumber,
                            customerName: job.customerName,
                            drawings: new Map()
                        });
                    }
                    
                    const jobEntry = jobsMap.get(job.id)!;
                    
                    const processesWithInfo = processesOnDate.map(p => ({
                        ...p,
                        jobId: job.id,
                        drawingId: drawing.id,
                        jobNumber: job.jobNumber,
                        drawingName: drawing.name,
                    }));
                    
                    jobEntry.drawings.set(drawing.id, {
                        drawingName: drawing.name,
                        processes: processesWithInfo.sort((a,b) => a.sequence - b.sequence)
                    });
                }
            });
        });

        return new Map([...jobsMap.entries()].sort((a, b) => a[1].jobNumber.localeCompare(b[1].jobNumber)));
    }, [selectedDate, jobs]);


    const calculateOperatorHoursForDate = (operatorId: string, date: string): number => {
        let totalMinutes = 0;
        jobs.forEach(job => {
            job.drawings?.forEach(drawing => {
                drawing.processes.forEach(process => {
                    if (process.plannedDate === date && process.operatorId === operatorId) {
                        totalMinutes += (process.estimatedHours * 60) + process.estimatedMinutes;
                    }
                });
            });
        });
        return totalMinutes / 60;
    };

    const handleAssign = (process: ProcessWithJobInfo, operatorId: string) => {
        const operator = operators.find(o => o.id === operatorId);
        if (!operator) {
            if (operatorId === '') { // This means unassigning
               onAssignOperator(process.jobId, process.drawingId, process.id, null);
           }
            return;
        }

        const currentHours = calculateOperatorHoursForDate(operatorId, selectedDate);
        const processDurationHours = (process.estimatedHours * 60 + process.estimatedMinutes) / 60;

        if (currentHours + processDurationHours > 8) {
            const processDept = getDepartmentForProcess(process.name);
            const alternativeOperators = operators.filter(op => op.department === processDept && op.id !== operator.id);
            setConflictData({
                jobId: process.jobId,
                drawingId: process.drawingId,
                processId: process.id,
                operator,
                processDurationHours,
                currentHours,
                alternativeOperators,
                jobNumber: process.jobNumber,
                drawingName: process.drawingName,
            });
        } else {
            onAssignOperator(process.jobId, process.drawingId, process.id, operatorId, false);
        }
    };

    const handleConfirmOvertime = () => {
        if (!conflictData) return;
        onAssignOperator(conflictData.jobId, conflictData.drawingId, conflictData.processId, conflictData.operator.id, true);
        setConflictData(null);
    };

    return (
        <div>
            <AssignmentConflictModal 
                show={!!conflictData}
                onClose={() => setConflictData(null)}
                onConfirmOvertime={handleConfirmOvertime}
                conflictData={conflictData}
                calculateOperatorHoursForDate={calculateOperatorHoursForDate}
                selectedDate={selectedDate}
                onSelectAlternative={(opId) => {
                    if (!conflictData) return;
                    // Find the process associated with the conflict
                    const job = jobs.find(j => j.id === conflictData.jobId);
                    const drawing = job?.drawings?.find(d => d.id === conflictData.drawingId);
                    const process = drawing?.processes.find(p => p.id === conflictData.processId);

                    if (process) {
                         const processWithJobInfo: ProcessWithJobInfo = {
                            ...process,
                            jobId: conflictData.jobId,
                            drawingId: conflictData.drawingId,
                            jobNumber: conflictData.jobNumber,
                            drawingName: conflictData.drawingName,
                        };
                        handleAssign(processWithJobInfo, opId);
                    }
                    setConflictData(null); // Close modal after re-assigning
                }}
            />
            <button onClick={onBack} className="flex items-center gap-1 text-sm p-2 mb-4 bg-gray-200 rounded-md hover:bg-gray-300">
                <ChevronLeftIcon /> Back to Calendar
            </button>
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">Daily Assignments for {selectedDate}</h2>
            
            <div className="space-y-6">
                {Array.from(jobsForDate.entries()).map(([jobId, jobData]) => (
                    <div key={jobId} className="bg-gray-50 p-4 rounded-lg border">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">{jobData.jobNumber} - <span className="text-base font-normal">{jobData.customerName}</span></h3>
                        
                        <div className="space-y-4">
                            {Array.from(jobData.drawings.entries()).map(([drawingId, drawingData]) => (
                                <div key={drawingId} className="bg-white p-3 rounded-md shadow-sm">
                                    <h4 className="font-bold text-indigo-700 mb-2">{drawingData.drawingName}</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Process</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Department</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Duration</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Assign Operator</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {drawingData.processes.map(p => {
                                                    const processDept = getDepartmentForProcess(p.name);
                                                    const availableOperators = operators.filter(op => op.department === processDept);
                                                    
                                                    return (
                                                        <tr key={p.id}>
                                                            <td className="px-4 py-2 font-semibold">{p.name}</td>
                                                            <td className="px-4 py-2">{processDept}</td>
                                                            <td className="px-4 py-2">{p.estimatedHours}h {p.estimatedMinutes}m</td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <select 
                                                                        value={p.operatorId || ''}
                                                                        onChange={(e) => handleAssign(p, e.target.value)}
                                                                        className={`w-full p-2 border rounded-md ${p.isOvertime ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-gray-300'}`}
                                                                    >
                                                                        <option value="">Unassigned</option>
                                                                        {availableOperators.map(op => (
                                                                            <option key={op.id} value={op.id}>{op.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    {p.isPaused && (
                                                                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-200 text-yellow-800 flex-shrink-0">
                                                                            On Hold
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {p.isOvertime && <div className="text-xs text-yellow-700 font-semibold mt-1">Overtime</div>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {jobsForDate.size === 0 && (
                    <div className="text-center p-8 bg-white rounded-lg border">
                        <p className="text-gray-500">No work scheduled for this date.</p>
                    </div>
                )}
            </div>
        </div>
    );
};