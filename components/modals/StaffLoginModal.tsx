
import React, { useState, useEffect } from 'react';
import { KeyIcon, UserIcon, AlertTriangleIcon } from '../Icons';

interface StaffLoginModalProps {
    show: boolean;
    onClose: () => void;
    onLogin: (employeeNumber: string, pin: string) => { success: boolean; message?: string };
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({ show, onClose, onLogin }) => {
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleLoginClick = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!employeeNumber.trim() || !pin.trim()) {
            setError('Both fields are required.');
            return;
        }
        const result = onLogin(employeeNumber, pin);
        if (!result.success) {
            setError(result.message || 'Invalid credentials. Please try again.');
        }
    };
    
    // Reset state on close
    useEffect(() => {
        if (!show) {
            setEmployeeNumber('');
            setPin('');
            setError('');
        }
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[70]">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
                <h1 className="text-2xl font-bold text-indigo-800 mb-2">Portal Access</h1>
                <p className="text-gray-500 mb-6">Please enter your credentials to continue.</p>

                <form onSubmit={handleLoginClick}>
                    <div className="mb-4 text-left">
                        <label htmlFor="empNumber" className="block text-sm font-medium text-gray-700 mb-1">Employee Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon />
                            </div>
                            <input
                                id="empNumber"
                                type="text"
                                value={employeeNumber}
                                onChange={(e) => setEmployeeNumber(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="e.g., REX101"
                                autoFocus
                            />
                        </div>
                    </div>
                     <div className="mb-6 text-left">
                        <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <KeyIcon />
                            </div>
                            <input
                                id="pin"
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="Enter password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 flex items-center justify-center gap-2 text-red-600 bg-red-100 p-2 rounded-md">
                            <AlertTriangleIcon className="w-5 h-5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                         <button type="button" onClick={onClose} className="w-full px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" className="w-full px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700">
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
