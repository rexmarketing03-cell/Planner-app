import React, { useMemo } from 'react';
import type { Operator, Job, Process } from '../../types';
import { XIcon } from '../Icons';

type ProcessWithJobInfo = Process & {
    jobId: string;
    drawingId: string;
    jobNumber: string;
    drawingName: string;
};

interface OperatorDetailsModalProps {
    show: boolean;
    onClose: () => void;
    operator: Operator | null;
    jobs: Job[];
}

const calculateNetDuration = (process: Process): string => {
    if (!process.startedAt || !process.completedAt) return 'N/A';
    
    let holdDuration = 0;
    (process.operatorHoldHistory || []).forEach(h => {
        if (h.resumeAt) {
            holdDuration += new Date(h.resumeAt).getTime() - new Date(h.holdAt).getTime();
        }
    });
    
    const totalDuration = new Date(process.completedAt).getTime() - new Date(process.startedAt).getTime();
    const netDurationMs = totalDuration - holdDuration;

    if (netDurationMs < 0) return '0h 0m';
    
    const hours = Math.floor(netDurationMs / (1000 * 60 * 60));
    const minutes = Math.floor((netDurationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
};


export const OperatorDetailsModal: React.FC<OperatorDetailsModalProps> = ({ show, onClose, operator, jobs }) => {

    const operatorTasks = useMemo(() => {
        if (!operator) return { assigned: [], inProgress: [], completed: [] };

        const assigned: ProcessWithJobInfo[] = [];
        const inProgress: ProcessWithJobInfo[] = [];
        const completed: ProcessWithJobInfo[] = [];

        jobs.forEach(job => {
            job.drawings?.forEach(drawing => {
                drawing.processes.forEach(process => {
                    if (process.operatorId === operator.id) {
                        const task: ProcessWithJobInfo = {
                            ...process,
                            jobId: job.id,
                            drawingId: drawing.id,
                            jobNumber: job.jobNumber,
                            drawingName: drawing.name,
                        };

                        if (process.completed) {
                            completed.push(task);
                        } else if (process.startedAt) {
                            inProgress.push(task);
                        } else {
                            assigned.push(task);
                        }
                    }
                });
            });
        });
        
        completed.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
        assigned.sort((a, b) => (a.plannedDate || '').localeCompare(b.plannedDate || ''));

        return { assigned, inProgress, completed };
    }, [operator, jobs]);

    if (!show || !operator) return null;

    const renderTaskTable = (tasks: ProcessWithJobInfo[], title: string) => (
        <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{title} ({tasks.length})</h4>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-left">Job</th>
                            <th className="px-3 py-2 text-left">Task</th>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-left">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {tasks.map(task => (
                            <tr key={task.id}>
                                <td className="px-3 py-2">
                                    <div className="font-bold">{task.jobNumber}</div>
                                    <div className="text-xs text-gray-500">{task.drawingName}</div>
                                </td>
                                <td className="px-3 py-2">
                                    <div className="font-semibold">{task.name}</div>
                                    <div className="text-xs text-gray-500">{task.machine}</div>
                                </td>
                                <td className="px-3 py-2">
                                    {title === 'Completed Tasks' 
                                        ? (task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A')
                                        : task.plannedDate
                                    }
                                </td>
                                <td className="px-3 py-2">
                                     {title === 'Completed Tasks' ? calculateNetDuration(task) : `${task.estimatedHours}h ${task.estimatedMinutes}m`}
                                </td>
                            </tr>
                        ))}
                         {tasks.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-4 text-gray-500">No tasks in this category.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[80]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold text-indigo-700">Operator Details: {operator.name}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon /></button>
                </div>

                <div className="space-y-6">
                    {renderTaskTable(operatorTasks.inProgress, 'In Progress')}
                    {renderTaskTable(operatorTasks.assigned, 'Assigned Tasks')}
                    {renderTaskTable(operatorTasks.completed, 'Completed Tasks')}
                </div>

                <div className="mt-6 pt-4 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
