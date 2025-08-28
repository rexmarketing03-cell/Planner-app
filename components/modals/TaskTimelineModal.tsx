import React, { useMemo } from 'react';
import type { Process } from '../../types';
import { XIcon, PlayIcon, PauseIcon, CheckIcon } from '../Icons';

type ProcessWithJobInfo = Process & {
    jobNumber: string;
    drawingName: string;
};

interface TaskTimelineModalProps {
    show: boolean;
    onClose: () => void;
    task: ProcessWithJobInfo | null;
}

interface TimelineEvent {
    timestamp: string;
    type: 'Start' | 'Hold' | 'Resume' | 'Finish';
    details: string;
    Icon: React.FC;
    color: string;
}

const formatMsToHoursAndMinutes = (ms: number) => {
    if (ms < 0) ms = 0;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.round((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
};

const calculateNetDuration = (task: ProcessWithJobInfo): string => {
    if (!task.startedAt || !task.completedAt) return 'N/A';
    const holdMs = (task.operatorHoldHistory || []).reduce((acc, h) => acc + (h.resumeAt ? new Date(h.resumeAt).getTime() - new Date(h.holdAt).getTime() : 0), 0);
    const netMs = (new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()) - holdMs;
    return formatMsToHoursAndMinutes(netMs);
};

const calculateTotalHoldTime = (task: ProcessWithJobInfo): string => {
    const holdMs = (task.operatorHoldHistory || []).reduce((acc, h) => acc + (h.resumeAt ? new Date(h.resumeAt).getTime() - new Date(h.holdAt).getTime() : 0), 0);
    return formatMsToHoursAndMinutes(holdMs);
};

export const TaskTimelineModal: React.FC<TaskTimelineModalProps> = ({ show, onClose, task }) => {
    
    const timelineEvents = useMemo(() => {
        if (!task) return [];
        const events: TimelineEvent[] = [];
        if (task.startedAt) events.push({ timestamp: task.startedAt, type: 'Start', details: 'Task started.', Icon: PlayIcon, color: 'text-green-500' });
        (task.operatorHoldHistory || []).forEach(h => {
            events.push({ timestamp: h.holdAt, type: 'Hold', details: `Reason: ${h.reason}`, Icon: PauseIcon, color: 'text-yellow-500' });
            if (h.resumeAt) events.push({ timestamp: h.resumeAt, type: 'Resume', details: 'Task resumed.', Icon: PlayIcon, color: 'text-blue-500' });
        });
        if (task.completedAt) events.push({ timestamp: task.completedAt, type: 'Finish', details: 'Task finished.', Icon: CheckIcon, color: 'text-indigo-500' });
        return events.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [task]);

    if (!show || !task) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[80] p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div>
                        <h3 className="text-xl font-bold text-indigo-700">Task Timeline</h3>
                        <p className="text-sm text-gray-500">{task.jobNumber} / {task.drawingName} / {task.name}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-100 p-3 rounded-lg text-center">
                        <p className="text-sm font-semibold text-gray-600">Net Working Time</p>
                        <p className="text-2xl font-bold text-gray-800">{calculateNetDuration(task)}</p>
                    </div>
                     <div className="bg-gray-100 p-3 rounded-lg text-center">
                        <p className="text-sm font-semibold text-gray-600">Total Hold Time</p>
                        <p className="text-2xl font-bold text-gray-800">{calculateTotalHoldTime(task)}</p>
                    </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto pr-4">
                    <div className="relative border-l-2 border-gray-200 pl-8 space-y-8">
                        {timelineEvents.map((event, index) => (
                            <div key={index} className="relative">
                                <div className={`absolute -left-[3.2rem] top-1 h-8 w-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center ${event.color}`}>
                                    <event.Icon />
                                </div>
                                <p className="text-xs text-gray-500 font-semibold">{new Date(event.timestamp).toLocaleString()}</p>
                                <h4 className="font-bold text-gray-800">{event.type}</h4>
                                <p className="text-sm text-gray-600">{event.details}</p>
                            </div>
                        ))}
                    </div>
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