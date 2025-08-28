import React, { useState, useMemo } from 'react';
import type { Job, Drawing } from '../../types';

interface PlanningMaterialDelayModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: (newFinishDate: string, reason: string) => void;
    job: Job;
    drawing: Drawing;
}

export const PlanningMaterialDelayModal: React.FC<PlanningMaterialDelayModalProps> = ({ show, onClose, onConfirm, job, drawing }) => {
    const [newFinishDate, setNewFinishDate] = useState('');
    const [reason, setReason] = useState('');

    const expectedMaterialDate = useMemo(() => {
        return drawing.expectedMaterialDate || '';
    }, [drawing.expectedMaterialDate]);

    if (!show) return null;

    const handleConfirm = () => {
        if (newFinishDate && reason.trim()) {
            onConfirm(newFinishDate, reason.trim());
        }
    };

    const isConfirmDisabled = !newFinishDate || !reason.trim() || (expectedMaterialDate && new Date(newFinishDate) < new Date(expectedMaterialDate));

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[80]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg mx-auto w-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Request Date Change Due to Material Delay</h3>
                
                <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 mb-6">
                    <p className="font-bold">Material Awaiting Stock</p>
                    <p className="text-sm">
                        Material for "<span className="font-semibold">{drawing.name}</span>" is expected on <span className="font-semibold">{expectedMaterialDate}</span>.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="newFinishDate" className="block text-sm font-medium text-gray-700 mb-1">
                            New Proposed Job Finish Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="newFinishDate"
                            value={newFinishDate}
                            onChange={(e) => setNewFinishDate(e.target.value)}
                            min={expectedMaterialDate}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        {newFinishDate && expectedMaterialDate && new Date(newFinishDate) < new Date(expectedMaterialDate) && (
                             <p className="text-xs text-red-600 mt-1">The new finish date must be on or after the material availability date.</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Request <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="e.g., Rescheduling project due to supplier delay for required material."
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
                        Send Request to Sales
                    </button>
                </div>
            </div>
        </div>
    );
};