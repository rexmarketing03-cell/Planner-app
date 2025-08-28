import React, { useState } from 'react';
import { AlertTriangleIcon } from '../components/Icons';

interface OperatorLoginProps {
    onInitiateLogin: (empNumber: string) => void;
}

export const OperatorLogin: React.FC<OperatorLoginProps> = ({ onInitiateLogin }) => {
    const [empNumberInput, setEmpNumberInput] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!empNumberInput.trim()) {
            setError('Please enter your Employee Number.');
            return;
        }
        onInitiateLogin(empNumberInput.trim());
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center mx-auto">
            <h1 className="text-3xl font-bold text-indigo-800 mb-2">Operator Login</h1>
            <p className="text-gray-500 mb-6">Welcome to the Shop Floor</p>

            <form onSubmit={handleLogin}>
                <label htmlFor="empNumber" className="block text-sm font-medium text-gray-700 mb-2">Enter Your Employee Number</label>
                <input
                    id="empNumber"
                    type="text"
                    value={empNumberInput}
                    onChange={(e) => setEmpNumberInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-center text-lg"
                    placeholder="e.g., REX001"
                    autoFocus
                />
                {error && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-red-600">
                        <AlertTriangleIcon className="w-5 h-5" />
                        <p>{error}</p>
                    </div>
                )}
                <button type="submit" className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700">
                    Login
                </button>
            </form>
        </div>
    );
};
