import React, { useState, useEffect } from 'react';

interface CreateJobHoldModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

export const CreateJobHoldModal: React.FC<CreateJobHoldModalProps> = ({ show, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!show) {
            setReason('');
        }
    }, [show]);

    const handleConfirm = () => {
        if (!reason.trim()) {
            alert("A reason is required to put the job on hold.");
            return;
        }
        onConfirm(reason.trim());
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reason for Hold</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Please provide a reason for creating this job in a "held" state. The job will not proceed to other departments until released.
                </p>
                <div className="mb-4">
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., Awaiting final confirmation from customer..."
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">
                        Confirm & Create Held Job
                    </button>
                </div>
            </div>
        </div>
    );
};
