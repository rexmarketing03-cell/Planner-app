import React, { useState, useEffect } from 'react';
import type { Operator } from '../../types';
import { XIcon } from '../Icons';

interface ChangePasswordModalProps {
    show: boolean;
    onClose: () => void;
    operator: Operator | null;
    updateOperator: (operatorId: string, data: Partial<Operator>) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ show, onClose, operator, updateOperator }) => {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (show) {
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            setError('');
            setSuccess('');
        }
    }, [show]);

    const handleSave = () => {
        setError('');
        setSuccess('');

        if (!operator) {
            setError('Operator not found.');
            return;
        }

        if (operator.pin !== currentPin) {
            setError('Current PIN is incorrect.');
            return;
        }
        
        if (!/^\d{4}$/.test(newPin)) {
            setError('New PIN must be exactly 4 digits.');
            return;
        }

        if (newPin !== confirmPin) {
            setError('New PINs do not match.');
            return;
        }

        updateOperator(operator.id, { pin: newPin });
        setSuccess('PIN changed successfully!');
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[80]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Change PIN</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Current PIN</label>
                        <input
                            type="password"
                            maxLength={4}
                            value={currentPin}
                            onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                            className="mt-1 w-full p-2 border rounded-md"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New PIN</label>
                        <input
                            type="password"
                            maxLength={4}
                            value={newPin}
                            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                            className="mt-1 w-full p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm New PIN</label>
                        <input
                            type="password"
                            maxLength={4}
                            value={confirmPin}
                            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                            className="mt-1 w-full p-2 border rounded-md"
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                {success && <p className="text-green-600 text-sm mt-4">{success}</p>}

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};