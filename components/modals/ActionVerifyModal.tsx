import React, { useState } from 'react';
import type { Operator } from '../../types';
import { PinVerifyModal } from './PinVerifyModal';
import { PatternLockVerifyModal } from './PatternLockVerifyModal';
import { KeyIcon, GridIcon } from '../Icons';

interface ActionVerifyModalProps {
    show: boolean;
    onClose: () => void;
    operator: Operator | null;
    onSuccess: () => void;
    actionTitle: string; 
}

export const ActionVerifyModal: React.FC<ActionVerifyModalProps> = ({ show, onClose, operator, onSuccess, actionTitle }) => {
    const [showPinModal, setShowPinModal] = useState(false);
    const [showPatternModal, setShowPatternModal] = useState(false);
    
    const handleVerifyPin = (pin: string) => {
        if (operator?.pin === pin) {
            onSuccess();
        } else {
            alert("Incorrect PIN.");
        }
        setShowPinModal(false);
    };

    const handleVerifyPattern = (pattern: number[]) => {
        const storedPattern = operator?.patternLockCode;
        if (storedPattern && pattern.length === storedPattern.length && pattern.every((val, index) => val === storedPattern[index])) {
            onSuccess();
        } else {
            alert("Incorrect Pattern.");
        }
        setShowPatternModal(false);
    };
    
    const handleClose = () => {
        // Ensure sub-modals are also closed
        setShowPinModal(false);
        setShowPatternModal(false);
        onClose();
    };

    if (!show || !operator) return null;

    const getTitle = () => {
        switch(actionTitle) {
            case 'login': return 'Login';
            case 'hold': return 'Hold Task';
            case 'finish': return 'Finish Task';
            case 'viewDetails': return 'View Details';
            default: return 'Confirm Action';
        }
    };


    return (
        <>
            <PinVerifyModal show={showPinModal} onClose={() => setShowPinModal(false)} onVerify={handleVerifyPin} />
            <PatternLockVerifyModal show={showPatternModal} onClose={() => setShowPatternModal(false)} onVerify={handleVerifyPattern} />

            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[90]">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">{getTitle()}</h3>
                    <p className="text-gray-600 mb-6">Please verify it's you, <span className="font-semibold">{operator.name}</span>.</p>
                    
                    <div className="space-y-3">
                        {operator.pin && (
                            <button onClick={() => setShowPinModal(true)} className="w-full flex items-center justify-center gap-3 p-4 bg-gray-100 hover:bg-indigo-100 rounded-lg font-semibold text-lg">
                                <KeyIcon className="text-indigo-600" /> Verify with PIN
                            </button>
                        )}
                        {operator.patternLockCode && operator.patternLockCode.length > 0 && (
                            <button onClick={() => setShowPatternModal(true)} className="w-full flex items-center justify-center gap-3 p-4 bg-gray-100 hover:bg-indigo-100 rounded-lg font-semibold text-lg">
                                <GridIcon className="text-indigo-600" /> Verify with Pattern
                            </button>
                        )}
                    </div>

                    <button onClick={handleClose} className="mt-6 text-sm text-gray-600 hover:underline">
                        Cancel Action
                    </button>
                </div>
            </div>
        </>
    );
};
