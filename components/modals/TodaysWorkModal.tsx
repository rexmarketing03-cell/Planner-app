import React, { useMemo } from 'react';
import type { Operator, Job, Process } from '../../types';
import { XIcon, PlayIcon, UserIcon } from '../Icons';

type ProcessWithJobInfo = Process & {
    jobId: string;
    drawingId: string;
    jobNumber: string;
    drawingName: string;
    machine: string;
};

interface TodaysWorkModalProps {
    show: boolean;
    onClose: () => void;
    operator: Operator | null;
    jobs: Job[];
    onStartProcess: (jobId: string, drawingId: string, processId: string) => void;
    onResumeProcess: (jobId: string, drawingId: string, processId: string) => void;
    onShowProfile: () => void;
}

export const TodaysWorkModal: React.FC<TodaysWorkModalProps> = ({ show, onClose, operator, jobs, onStartProcess, onResumeProcess, onShowProfile }) => {
    
    const todaysTasks = useMemo(() => {
        if (!operator) return [];
        const todayStr = new Date().toISOString().split('T')[0];
        const tasks: ProcessWithJobInfo[] = [];

        jobs.forEach(job => {
            job.drawings?.forEach(drawing => {
                drawing.processes.forEach(process => {
                    // Find tasks assigned to this operator for today that are not completed
                    if (process.operatorId === operator.id && process.plannedDate === todayStr && !process.completed) {
                        tasks.push({
                            ...process,
                            jobId: job.id,
                            drawingId: drawing.id,
                            jobNumber: job.jobNumber,
                            drawingName: drawing.name,
                            machine: process.machine,
                        });
                    }
                });
            });
        });

        // Show unstarted tasks first, then paused, then in-progress
        tasks.sort((a, b) => {
            const aStarted = !!a.startedAt;
            const bStarted = !!b.startedAt;
            if (aStarted !== bStarted) {
                return aStarted ? 1 : -1;
            }
            if(a.isPaused !== b.isPaused) {
                return a.isPaused ? -1 : 1;
            }
            return (a.sequence || 0) - (b.sequence || 0);
        });

        return tasks;
    }, [operator, jobs]);

    const handleStart = (task: ProcessWithJobInfo) => {
        onStartProcess(task.jobId, task.drawingId, task.id);
        onClose();
    };
    
    const handleResume = (task: ProcessWithJobInfo) => {
        onResumeProcess(task.jobId, task.drawingId, task.id);
        onClose();
    };

    if (!show || !operator) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[80]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Today's Work for {operator.name}</h3>
                        <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onShowProfile} 
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-semibold flex items-center gap-2"
                        >
                           <UserIcon /> Profile
                        </button>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon /></button>
                    </div>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
                    {todaysTasks.length > 0 ? (
                        todaysTasks.map(task => (
                            <div key={task.id} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-indigo-700">{task.jobNumber}</p>
                                    <p className="text-sm">{task.drawingName} - <span className="font-semibold">{task.name}</span></p>
                                    <p className="text-xs text-gray-500">Machine: {task.machine}</p>
                                </div>
                                {!task.startedAt && (
                                     <button onClick={() => handleStart(task)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold flex items-center gap-1">
                                         <PlayIcon /> Start
                                     </button>
                                )}
                                {task.startedAt && task.isPaused && (
                                    <button onClick={() => handleResume(task)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-semibold flex items-center gap-1">
                                        <PlayIcon /> Resume
                                    </button>
                                )}
                                {task.startedAt && !task.isPaused && (
                                    <span className="px-3 py-1 text-sm rounded-full font-semibold bg-green-100 text-green-800">
                                        In Progress
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8">No tasks assigned for today.</p>
                    )}
                </div>
                 <div className="mt-4 pt-4 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};