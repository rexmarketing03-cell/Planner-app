
import React, { useState } from 'react';
import type { Operator } from '../types';
import { KeyIcon, CameraIcon, GridIcon, AlertTriangleIcon } from '../components/Icons';
import { PinVerifyModal } from '../components/modals/PinVerifyModal';
import { FaceLockVerifyModal } from '../components/modals/FaceLockVerifyModal';
import { PatternLockVerifyModal } from '../components/modals/PatternLockVerifyModal';

interface LoginProps {
    operators: Operator[];
    onLogin: (operator: Operator) => void;
    showModal: (message: string) => void;
}

export const Login: React.FC<LoginProps> = ({ operators, onLogin, showModal }) => {
    const [empNumberInput, setEmpNumberInput] = useState('');
    const [foundOperator, setFoundOperator] = useState<Operator | null>(null);
    const [error, setError] = useState('');

    // Modal states
    const [showPinModal, setShowPinModal] = useState(false);
    const [showPatternModal, setShowPatternModal] = useState(false);
    const [showFaceLockModal, setShowFaceLockModal] = useState(false);

    const handleFindOperator = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const operator = operators.find(op => op.empNumber.toLowerCase() === empNumberInput.trim().toLowerCase());
        if (operator) {
            setFoundOperator(operator);
        } else {
            setError('Employee Number not found.');
            setFoundOperator(null);
        }
    };

    const handleVerifyPin = (pin: string) => {
        if (foundOperator?.pin === pin) {
            onLogin(foundOperator);
        } else {
            showModal("Incorrect PIN.");
        }
        setShowPinModal(false);
    };

    const handleVerifyPattern = (pattern: number[]) => {
        const storedPattern = foundOperator?.patternLockCode;
        if (storedPattern && pattern.length === storedPattern.length && pattern.every((val, index) => val === storedPattern[index])) {
            onLogin(foundOperator);
        } else {
            showModal("Incorrect Pattern.");
        }
        setShowPatternModal(false);
    };

    const handleVerifyFaceLock = (success: boolean) => {
        if (success && foundOperator) {
            onLogin(foundOperator);
        } else {
            showModal("Facelock verification failed.");
        }
        setShowFaceLockModal(false);
    };

    const handleBack = () => {
        setFoundOperator(null);
        setEmpNumberInput('');
        setError('');
    };

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <>
            <PinVerifyModal show={showPinModal} onClose={() => setShowPinModal(false)} onVerify={handleVerifyPin} />
            <PatternLockVerifyModal show={showPatternModal} onClose={() => setShowPatternModal(false)} onVerify={handleVerifyPattern} />
            <FaceLockVerifyModal show={showFaceLockModal} onClose={() => setShowFaceLockModal(false)} onVerify={handleVerifyFaceLock} />

            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
                <h1 className="text-3xl font-bold text-indigo-800 mb-2">Operator Login</h1>
                <p className="text-gray-500 mb-6">Welcome to Rex Industries Workflow Planner</p>

                {!foundOperator ? (
                    <form onSubmit={handleFindOperator}>
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
                            Find Me
                        </button>
                    </form>
                ) : (
                    <div>
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-20 h-20 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-3xl font-bold mb-3">
                                {getInitials(foundOperator.name)}
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">{foundOperator.name}</h2>
                            <p className="text-gray-500">{foundOperator.department}</p>
                        </div>
                        
                        <div className="space-y-3">
                            {foundOperator.pin && (
                                <button onClick={() => setShowPinModal(true)} className="w-full flex items-center justify-center gap-3 p-4 bg-gray-100 hover:bg-indigo-100 rounded-lg font-semibold text-lg">
                                    <KeyIcon className="text-indigo-600" /> Unlock with PIN
                                </button>
                            )}
                            {foundOperator.patternLockCode && foundOperator.patternLockCode.length > 0 && (
                                <button onClick={() => setShowPatternModal(true)} className="w-full flex items-center justify-center gap-3 p-4 bg-gray-100 hover:bg-indigo-100 rounded-lg font-semibold text-lg">
                                    <GridIcon className="text-indigo-600" /> Unlock with Pattern
                                </button>
                            )}
                            {foundOperator.faceLockCode && (
                                <button onClick={() => setShowFaceLockModal(true)} className="w-full flex items-center justify-center gap-3 p-4 bg-gray-100 hover:bg-indigo-100 rounded-lg font-semibold text-lg">
                                    <CameraIcon className="text-indigo-600" /> Unlock with Facelock
                                </button>
                            )}
                        </div>

                        <button onClick={handleBack} className="mt-8 text-sm text-gray-600 hover:underline">
                            Not you? Go back.
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
