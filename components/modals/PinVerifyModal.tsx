import React, { useState } from 'react';
import { XIcon } from '../Icons';

interface PinVerifyModalProps {
    show: boolean;
    onClose: () => void;
    onVerify: (pin: string) => void;
}

export const PinVerifyModal: React.FC<PinVerifyModalProps> = ({ show, onClose, onVerify }) => {
    const [pin, setPin] = useState('');

    const handleKeyPress = (key: string) => {
        if (pin.length < 4) {
            const newPin = pin + key;
            setPin(newPin);
            if (newPin.length === 4) {
                onVerify(newPin);
                setPin('');
            }
        }
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xs text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter PIN</h3>
                <div className="flex justify-center items-center space-x-3 h-12 mb-4 bg-gray-100 rounded-md">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} onClick={() => handleKeyPress(String(num))} className="p-4 bg-gray-200 rounded-lg text-xl font-semibold hover:bg-gray-300">
                            {num}
                        </button>
                    ))}
                     <button onClick={onClose} className="p-4 bg-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300 text-red-600">
                        Cancel
                    </button>
                    <button onClick={() => handleKeyPress('0')} className="p-4 bg-gray-200 rounded-lg text-xl font-semibold hover:bg-gray-300">
                        0
                    </button>
                    <button onClick={handleBackspace} className="p-4 bg-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300">
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
};