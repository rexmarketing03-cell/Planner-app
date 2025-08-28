import React, { useState, useMemo } from 'react';
import type { Job, Process } from '../../types';
import { AlertTriangleIcon } from '../Icons';

interface PlanningDelayRequestModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: (newFinishDate: string, reason: string) => void;
    job: Job;
    drawingName: string;
    processes: Process[];
}

export const PlanningDelayRequestModal: React.FC<PlanningDelayRequestModalProps> = ({ show, onClose, onConfirm, job, drawingName, processes }) => {
    const [newFinishDate, setNewFinishDate] = useState('');
    const [reason, setReason] = useState('');

    const conflictingProcess = useMemo(() => {
        if (!show) return null;
        const sortedProcesses = [...processes].sort((a, b) => (b.plannedDate || '').localeCompare(a.plannedDate || ''));
        return sortedProcesses.find(p => p.plannedDate && new Date(p.plannedDate) > new Date(job.finishDate)) || null;
    }, [show, processes, job.finishDate]);

    if (!show || !conflictingProcess) return null;

    const handleConfirm = () => {
        if (newFinishDate && reason.trim()) {
            onConfirm(newFinishDate, reason.trim());
        }
    };

    const isConfirmDisabled = !newFinishDate || !reason.trim() || (conflictingProcess.plannedDate && new Date(newFinishDate) < new Date(conflictingProcess.plannedDate));

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[80]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg mx-auto w-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Request Finish Date Change</h3>
                
                <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 mb-6">
                    <div className="flex">
                        <div className="py-1"><AlertTriangleIcon /></div>
                        <div className="ml-3">
                            <p className="font-bold">Scheduling Conflict Detected</p>
                            <p className="text-sm">
                                Process "<span className="font-semibold">{conflictingProcess.name}</span>" is planned for <span className="font-semibold">{conflictingProcess.plannedDate}</span>, which is after the job's current finish date of <span className="font-semibold">{job.finishDate}</span>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="newFinishDate" className="block text-sm font-medium text-gray-700 mb-1">
                            New Proposed Finish Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="newFinishDate"
                            value={newFinishDate}
                            onChange={(e) => setNewFinishDate(e.target.value)}
                            min={conflictingProcess.plannedDate}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        {newFinishDate && conflictingProcess.plannedDate && new Date(newFinishDate) < new Date(conflictingProcess.plannedDate) && (
                             <p className="text-xs text-red-600 mt-1">The new finish date must be on or after the conflicting process date.</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Delay <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Explain why this extension is necessary..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                   <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                        Save Drawing & Send Request
                    </button>
                </div>
            </div>
        </div>
    );
};