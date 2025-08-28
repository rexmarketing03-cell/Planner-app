
import React, { useState, useEffect } from 'react';

interface DesignerModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    title: string;
    initialValue?: string;
}

export const DesignerModal: React.FC<DesignerModalProps> = ({ show, onClose, onSave, title, initialValue = '' }) => {
    const [name, setName] = useState(initialValue);

    useEffect(() => {
        if (show) {
            setName(initialValue);
        }
    }, [show, initialValue]);

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[70]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="mb-6">
                    <label htmlFor="designerName" className="block text-sm font-medium text-gray-700 mb-1">Designer Name</label>
                    <input
                        type="text"
                        id="designerName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end space-x-4">
                   <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
