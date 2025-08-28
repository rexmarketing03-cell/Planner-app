
import React, { useState } from 'react';
import type { Job } from '../../types';
import { PlusIcon, TrashIcon } from '../Icons';

interface NewDrawingData {
    id: string;
    name: string;
    quantity: number;
}

interface FinishDesignModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: (jobId: string, drawings: {name: string, quantity: number}[]) => void;
    job: Job;
}

export const FinishDesignModal: React.FC<FinishDesignModalProps> = ({ show, onClose, onConfirm, job }) => {
    const [drawings, setDrawings] = useState<NewDrawingData[]>([{ id: `new-${Date.now()}`, name: '', quantity: 1 }]);

    const handleAddDrawing = () => {
        setDrawings([...drawings, { id: `new-${Date.now()}`, name: '', quantity: 1 }]);
    };

    const handleRemoveDrawing = (id: string) => {
        if (drawings.length > 1) {
            setDrawings(drawings.filter(d => d.id !== id));
        }
    };
    
    const handleDrawingChange = (id: string, field: 'name' | 'quantity', value: string | number) => {
        setDrawings(drawings.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const handleInternalConfirm = () => {
        const validDrawings = drawings.filter(d => d.name.trim() !== '' && d.quantity > 0);
        if (validDrawings.length === 0) {
            alert("Please add at least one valid drawing.");
            return;
        }
        onConfirm(job.id, validDrawings.map(({name, quantity}) => ({name, quantity})));
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[60]">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl mx-auto w-full">
                <h3 className="text-2xl font-bold text-green-700 mb-4 border-b pb-3">Finish Design for {job.jobNumber}</h3>
                <p className="text-sm text-gray-600 mb-4">Add the drawing numbers that have been created for this job.</p>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {drawings.map((d, i) => (
                        <div key={d.id} className="bg-gray-50 p-3 rounded-lg flex items-center gap-4">
                            <span className="font-bold text-gray-500">{i + 1}.</span>
                            <div className="flex-grow">
                                <label className="block text-xs font-medium text-gray-600">Drawing Name/Number</label>
                                <input type="text" value={d.name} onChange={e => handleDrawingChange(d.id, 'name', e.target.value)} className="w-full p-2 border rounded-md" />
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-medium text-gray-600">Quantity</label>
                                <input type="number" value={d.quantity} onChange={e => handleDrawingChange(d.id, 'quantity', parseInt(e.target.value) || 1)} min="1" className="w-full p-2 border rounded-md" />
                            </div>
                            <button 
                                onClick={() => handleRemoveDrawing(d.id)} 
                                disabled={drawings.length <= 1}
                                className="text-red-500 p-2 mt-4 rounded-full hover:bg-red-100 self-center disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed">
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
                
                <button onClick={handleAddDrawing} className="mt-4 w-full p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center justify-center gap-1"><PlusIcon /> Add Another Drawing</button>
                
                <div className="flex justify-end space-x-3 mt-8">
                    <button onClick={onClose} className="px-5 py-2 border rounded-md">Cancel</button>
                    <button onClick={handleInternalConfirm} className="px-5 py-2 bg-green-600 text-white rounded-md">Complete Design</button>
                </div>
            </div>
        </div>
    );
};