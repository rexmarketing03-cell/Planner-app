import React, { useState, useEffect } from 'react';
import type { Job, Drawing, Process } from '../../types';

interface PreCncHoldModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: (newFinishDate: string) => void;
    job: Job;
    drawing: Drawing;
    process: Process;
}

export const PreCncHoldModal: React.FC<PreCncHoldModalProps> = ({ show, onClose, onConfirm, job, drawing, process }) => {
    const [newFinishDate, setNewFinishDate] = useState('');

    useEffect(() => {
        if (show) {
            setNewFinishDate(job.finishDate || new Date().toISOString().split('T')[0]);
        }
    }, [show, job.finishDate]);
    
    if (!show) return null;

    const handleConfirm = () => {
        if (newFinishDate) {
            onConfirm(newFinishDate);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[70]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg mx-auto">
                <h3 className="text-xl font-semibold text-yellow-700 mb-4">Programming Incomplete</h3>
                <p className="text-gray-700 mb-4">
                    Programming for the next step (<span className="font-semibold">CNC</span>) is not yet complete for job <span className="font-semibold">{job.jobNumber}</span>.
                </p>
                <p className="text-gray-700 mb-6">
                    You can complete the current process (<span className="font-semibold">{process.name} in {drawing.currentDepartment}</span>) and send it for Quality Checking now. The drawing will remain in <span className="font-semibold">{drawing.currentDepartment}</span> until programming is finished, at which point it will move automatically.
                </p>
                
                <div className="mb-6 p-4 bg-gray-50 rounded-md border">
                    <label htmlFor="newFinishDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm or update the job's finish date:
                    </label>
                    <input
                        type="date"
                        id="newFinishDate"
                        value={newFinishDate}
                        onChange={(e) => setNewFinishDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                </div>

                <div className="flex justify-end space-x-4">
                   <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!newFinishDate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Complete Process & Send to QC
                    </button>
                </div>
            </div>
        </div>
    );
};