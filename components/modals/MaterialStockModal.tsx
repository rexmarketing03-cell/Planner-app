import React, { useState, useMemo } from 'react';
import type { Job, Drawing } from '../../types';
import { AlertTriangleIcon } from '../Icons';

interface MaterialStockModalProps {
    show: boolean;
    onClose: () => void;
    job: Job;
    drawing: Drawing;
    onSave: (jobId: string, drawingId: string, expectedDate: string) => void;
    onReturnToPlanning: (jobId: string, drawingId: string, expectedDate: string) => void;
}

export const MaterialStockModal: React.FC<MaterialStockModalProps> = ({ show, onClose, job, drawing, onSave, onReturnToPlanning }) => {
    const [expectedDate, setExpectedDate] = useState('');

    const isDateAfterFinishDate = useMemo(() => {
        if (!expectedDate || !job.finishDate) return false;
        return new Date(expectedDate) > new Date(job.finishDate);
    }, [expectedDate, job.finishDate]);

    const handleSave = () => {
        if (expectedDate && !isDateAfterFinishDate) {
            onSave(job.id, drawing.id, expectedDate);
        }
    };
    
    const handleReturnToPlanning = () => {
        if (expectedDate && isDateAfterFinishDate) {
            onReturnToPlanning(job.id, drawing.id, expectedDate);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[70]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Material Status</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Marking material for <span className="font-semibold">{drawing.name}</span> as out of stock.
                </p>
                <div className="mb-4">
                    <label htmlFor="expectedDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Material Availability Date
                    </label>
                    <input
                        type="date"
                        id="expectedDate"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                </div>

                {isDateAfterFinishDate && (
                    <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 mb-4">
                        <div className="flex">
                            <div className="py-1"><AlertTriangleIcon className="h-5 w-5 text-yellow-500" /></div>
                            <div className="ml-3">
                                <p className="font-bold">Potential Delay</p>
                                <p className="text-sm">This date is after the job's finish date ({job.finishDate}). The job will be returned to Planning for rescheduling.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-4 mt-6">
                   <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
                        Cancel
                    </button>
                    {isDateAfterFinishDate ? (
                        <button onClick={handleReturnToPlanning} disabled={!expectedDate} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400">
                            Return to Planning
                        </button>
                    ) : (
                        <button onClick={handleSave} disabled={!expectedDate} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                            Save
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};