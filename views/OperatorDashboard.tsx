import React, { useMemo, useState } from 'react';
import type { Job, Operator, Process } from '../types';
import { UsersIcon, PlayIcon, PauseIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from '../components/Icons';

type ProcessWithJobInfo = Process & {
    jobId: string;
    drawingId: string;
    jobNumber: string;
    drawingName: string;
    jobFinishDate: string;
    jobDescription?: string;
};

interface OperatorDashboardProps {
    operators: Operator[];
    jobs: Job[];
    onLoginClick: () => void;
    onTriggerAction: (operatorId: string, action: 'hold' | 'resume' | 'finish', task: ProcessWithJobInfo) => void;
    onShowOperatorDetails: (operatorId: string) => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ operators, jobs, onLoginClick, onTriggerAction, onShowOperatorDetails }) => {
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    const activeTasks = useMemo(() => {
        const tasks: ProcessWithJobInfo[] = [];
        jobs.forEach(job => {
            job.drawings?.forEach(drawing => {
                drawing.processes.forEach(process => {
                    if (process.startedAt && !process.completedAt && process.operatorId) {
                         tasks.push({
                            ...process,
                            jobId: job.id,
                            drawingId: drawing.id,
                            jobNumber: job.jobNumber,
                            drawingName: drawing.name,
                            jobFinishDate: job.finishDate,
                            jobDescription: job.jobDescription,
                        });
                    }
                });
            });
        });
        tasks.sort((a,b) => a.jobFinishDate.localeCompare(b.jobFinishDate) || a.sequence - b.sequence);
        return tasks;
    }, [jobs]);

    const findOperator = (id: string) => operators.find(o => o.id === id);

    return (
        <div className="p-4 md:p-6">
            <header className="flex justify-between items-center mb-6 border-b pb-4">
                 <h2 className="text-3xl font-bold text-indigo-800">Shop Floor - Active Work</h2>
                 <button onClick={onLoginClick} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center gap-2">
                     <UsersIcon /> Operator Login
                 </button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTasks.map(task => {
                    const operator = findOperator(task.operatorId!);
                    if (!operator) return null;
                    
                    const action = task.isPaused ? 'resume' : 'hold';
                    const isExpanded = expandedTaskId === task.id;

                    return (
                        <div key={task.id} className={`p-4 rounded-lg shadow-lg border-l-8 ${task.isPaused ? 'border-yellow-500 bg-yellow-50' : 'border-green-500 bg-white'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <button 
                                        onClick={() => onShowOperatorDetails(operator.id)}
                                        className="text-sm font-semibold text-gray-500 hover:text-indigo-600 hover:underline text-left"
                                    >
                                        {operator.name}
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-bold text-indigo-800">{task.jobNumber}</p>
                                    </div>
                                    <p className="text-sm text-gray-700">{task.drawingName} - <span className="font-semibold">{task.name}</span></p>
                                    <p className="text-xs text-gray-500">Machine: {task.machine}</p>
                                </div>
                                {task.isPaused && (
                                    <div className="text-right flex-shrink-0">
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-200 text-yellow-800">ON HOLD</span>
                                        <p className="text-xs text-gray-600 mt-1 truncate max-w-[100px]" title={task.pauseReason}>{task.pauseReason}</p>
                                    </div>
                                )}
                            </div>
                            
                            {task.jobDescription && (
                                <>
                                    <div className="text-right mt-2">
                                        <button 
                                            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-auto"
                                        >
                                            {isExpanded ? 'Hide Details' : 'Show Details'}
                                            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                        </button>
                                    </div>
                                    {isExpanded && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 text-sm text-gray-600 whitespace-pre-wrap break-words">
                                            {task.jobDescription}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="mt-4 pt-3 border-t flex justify-end items-center gap-2">
                                <button onClick={() => onTriggerAction(operator.id, action, task)} className={`px-4 py-2 text-white rounded-md text-sm font-semibold flex items-center gap-2 ${task.isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                                    {task.isPaused ? <PlayIcon /> : <PauseIcon />}
                                    {task.isPaused ? 'Resume' : 'Hold'}
                                </button>
                                 <button onClick={() => onTriggerAction(operator.id, 'finish', task)} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700">
                                    <CheckIcon /> Finish
                                </button>
                            </div>
                        </div>
                    )
                })}
                 {activeTasks.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 font-semibold">No active tasks on the shop floor.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
