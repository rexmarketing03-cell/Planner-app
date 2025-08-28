import React, { useState } from 'react';
import type { Job, Drawing, Designer } from '../../types';

interface AssignmentModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: (targetDate: string, description: string) => void;
    job: Job;
    drawings: Drawing[];
    designer: Designer;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ show, onClose, onConfirm, job, drawings, designer }) => {
    const [targetDate, setTargetDate] = useState('');
    const [description, setDescription] = useState('');

    if (!show) return null;

    const isConfirmDisabled = !targetDate;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[60]">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg mx-auto w-full">
                <h3 className="text-2xl font-bold text-indigo-700 mb-2">Assign Drawings</h3>
                <p className="text-sm text-gray-600 mb-4 ">
                    Assigning {drawings.length} drawing(s) from job <span className="font-semibold">{job.jobNumber}</span> to <span className="font-semibold">{designer.name}</span>.
                </p>
                <div className="mb-4 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-md border">
                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                        {drawings.map(d => <li key={d.id}><span className="font-semibold">{d.name}</span></li>)}
                    </ul>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">Target Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="targetDate"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Add any specific instructions for the designer..."
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                    <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button 
                        onClick={() => { /* onConfirm(targetDate, description) */ }} 
                        disabled={isConfirmDisabled}
                        className={`px-5 py-2 text-white rounded-md shadow-md transition-colors ${isConfirmDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        Confirm Assignment
                    </button>
                </div>
            </div>
        </div>
    );
};