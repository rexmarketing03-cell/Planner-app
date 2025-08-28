import React from 'react';
import type { Process } from '../../types';

interface ReworkModalProps {
    onClose: () => void;
    onRework: () => void;
    jobNumber: string;
    drawingName: string;
    reworkableProcesses: Process[];
    reworkProcessName: string;
    setReworkProcessName: (name: string) => void;
    reworkReason: string;
    setReworkReason: (reason: string) => void;
    reworkType: 'in-department' | 'cross-department';
    setReworkType: (type: 'in-department' | 'cross-department') => void;
    reworkTargetDepartment: string;
    setReworkTargetDepartment: (dept: string) => void;
    allDepartments: string[];
}

export const ReworkModal: React.FC<ReworkModalProps> = ({
    onClose, onRework, jobNumber, drawingName, reworkableProcesses,
    reworkProcessName, setReworkProcessName, reworkReason, setReworkReason,
    reworkType, setReworkType, reworkTargetDepartment, setReworkTargetDepartment,
    allDepartments
}) => {
    const availableReworkDepts = allDepartments.filter(
        dep => !["Planning", "Completed", "Urgent", "Final Quality Check", "Design"].includes(dep)
    );

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[60]">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md mx-auto w-full">
                <h3 className="text-2xl font-bold text-red-700 mb-6 border-b pb-3">Initiate Rework</h3>
                <p className="mb-4">Job: <span className="font-semibold">{jobNumber}</span> / <span className="font-semibold">{drawingName}</span></p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Process to Rework</label>
                    <select value={reworkProcessName} onChange={(e) => setReworkProcessName(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                        {reworkableProcesses.map(p => (
                            <option key={p.sequence} value={p.name}>{p.sequence}. {p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Rework Type</label>
                    <div className="flex space-x-4">
                        <label><input type="radio" value="in-department" checked={reworkType === 'in-department'} onChange={() => setReworkType('in-department')} /> In-department</label>
                        <label><input type="radio" value="cross-department" checked={reworkType === 'cross-department'} onChange={() => setReworkType('cross-department')} /> Send to another</label>
                    </div>
                </div>

                {reworkType === 'cross-department' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Target Department</label>
                        <select value={reworkTargetDepartment} onChange={(e) => setReworkTargetDepartment(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                            <option value="">Select Department</option>
                            {availableReworkDepts.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                        </select>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Reason for Rework</label>
                    <textarea value={reworkReason} onChange={(e) => setReworkReason(e.target.value)} rows={3} placeholder="Describe why..." className="mt-1 block w-full p-2 border rounded-md"></textarea>
                </div>

                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2 border rounded-md">Cancel</button>
                    <button onClick={onRework} className="px-5 py-2 bg-red-600 text-white rounded-md">Confirm Rework</button>
                </div>
            </div>
        </div>
    );
};