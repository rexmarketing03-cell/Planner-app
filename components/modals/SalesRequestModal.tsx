import React, { useState } from 'react';

interface SalesRequestModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

export const SalesRequestModal: React.FC<SalesRequestModalProps> = ({ show, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason.trim());
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[80]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Finish Date Change</h3>
                <div className="mb-6">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Delay
                    </label>
                    <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        placeholder="Explain why the finish date needs to be changed (e.g., 'Supplier delay for raw material X')..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end space-x-4">
                   <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!reason.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                        Send Request
                    </button>
                </div>
            </div>
        </div>
    );
};