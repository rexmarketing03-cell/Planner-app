import React, { useState } from 'react';

interface ProcessHoldModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

export const ProcessHoldModal: React.FC<ProcessHoldModalProps> = ({ show, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason.trim());
        } else {
            alert("Please provide a reason for putting the task on hold.");
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[90]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hold Task</h3>
                <div className="mb-4">
                    <label htmlFor="holdReason" className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Hold
                    </label>
                    <textarea
                        id="holdReason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., Waiting for tool, machine issue..."
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">
                        Confirm Hold
                    </button>
                </div>
            </div>
        </div>
    );
};