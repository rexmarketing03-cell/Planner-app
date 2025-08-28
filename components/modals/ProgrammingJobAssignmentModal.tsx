import React, { useState } from 'react';
import type { Job, Programmer } from '../../types';

interface ProgrammingJobAssignmentModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: (targetDate: string) => void;
    job: Job;
    programmer: Programmer;
}

export const ProgrammingJobAssignmentModal: React.FC<ProgrammingJobAssignmentModalProps> = ({ show, onClose, onConfirm, job, programmer }) => {
    const [targetDate, setTargetDate] = useState('');
    const [error, setError] = useState('');

    const handleDateChange = (date: string) => {
        setTargetDate(date);
        if (date && job.finishDate && new Date(date) > new Date(job.finishDate)) {
            setError(`Target date cannot be after the job finish date (${job.finishDate}).`);
        } else {
            setError('');
        }
    };

    const handleConfirm = () => {
        if (!isConfirmDisabled) {
            onConfirm(targetDate);
        }
    };

    if (!show) return null;

    const isConfirmDisabled = !targetDate || !!error;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[60]">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg mx-auto w-full">
                <h3 className="text-2xl font-bold text-indigo-700 mb-2">Assign Programming Job</h3>
                <p className="text-sm text-gray-600 mb-4 ">
                    Assigning job <span className="font-semibold">{job.jobNumber}</span> to programmer <span className="font-semibold">{programmer.name}</span>.
                </p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">Set Target Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="targetDate"
                            value={targetDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                    <button onClick={onClose} className="px-5 py-2 border rounded-md">Cancel</button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={isConfirmDisabled}
                        className={`px-5 py-2 text-white rounded-md shadow-md ${isConfirmDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        Confirm Assignment
                    </button>
                </div>
            </div>
        </div>
    );
};
