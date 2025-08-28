

import React, { useState, useEffect } from 'react';
import type { Operator } from '../../types';
import { FaceLockModal } from './FaceLockModal';
import { PatternLockModal } from './PatternLockModal';
import { XIcon, CameraIcon, KeyIcon, GridIcon, CheckIcon } from '../Icons';

interface EditOperatorModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (operatorId: string, data: Partial<Operator>) => void;
    operator: Operator | null;
    allDepartments: string[];
}

export const EditOperatorModal: React.FC<EditOperatorModalProps> = ({ show, onClose, onSave, operator, allDepartments }) => {
    const [name, setName] = useState('');
    const [empNumber, setEmpNumber] = useState('');
    const [department, setDepartment] = useState('');
    const [role, setRole] = useState<'Section Head' | 'Worker'>('Worker');
    const [pin, setPin] = useState('');
    const [faceLockCode, setFaceLockCode] = useState('');
    const [patternLockCode, setPatternLockCode] = useState<number[]>([]);

    const [showFaceLockModal, setShowFaceLockModal] = useState(false);
    const [showPatternLockModal, setShowPatternLockModal] = useState(false);

    useEffect(() => {
        if (operator) {
            setName(operator.name);
            setEmpNumber(operator.empNumber);
            setDepartment(operator.department);
            setRole(operator.role || 'Worker');
            setPin(operator.pin || '');
            setFaceLockCode(operator.faceLockCode || '');
            setPatternLockCode(operator.patternLockCode || []);
        }
    }, [operator]);

    const handleSave = () => {
        if (!operator) return;

        if (!name.trim() || !empNumber.trim() || !department) {
            alert("Please fill in Operator Name, Employee Number, and Department.");
            return;
        }
        if (pin && !/^\d{4}$/.test(pin)) {
            alert("PIN must be exactly 4 digits.");
            return;
        }
        if (!pin && !faceLockCode && patternLockCode.length === 0) {
            alert("Please set at least one security method (PIN, Facelock, or Pattern Lock).");
            return;
        }

        const updatedData: Partial<Operator> = {
            name: name.trim(),
            empNumber: empNumber.trim(),
            department,
            role,
            pin: pin || undefined,
            faceLockCode: faceLockCode || undefined,
            patternLockCode: patternLockCode.length > 0 ? patternLockCode : undefined,
        };
        
        onSave(operator.id, updatedData);
        onClose();
    };
    
    const handleSaveFaceLock = (faceData: string) => {
        setFaceLockCode(faceData);
        setShowFaceLockModal(false);
    };
    
    const handleSavePatternLock = (pattern: number[]) => {
        setPatternLockCode(pattern);
        setShowPatternLockModal(false);
    };

    if (!show || !operator) return null;

    return (
        <>
            <FaceLockModal show={showFaceLockModal} onClose={() => setShowFaceLockModal(false)} onSave={handleSaveFaceLock} />
            <PatternLockModal show={showPatternLockModal} onClose={() => setShowPatternLockModal(false)} onSave={handleSavePatternLock} />
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[70]">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 className="text-2xl font-bold text-indigo-700">Edit Operator</h3>
                        <button onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-gray-100"><XIcon /></button>
                    </div>

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div>
                                <label className="block text-sm font-medium">Operator Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Employee Number</label>
                                <input type="text" value={empNumber} onChange={e => setEmpNumber(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Working Department</label>
                                <select value={department} onChange={e => setDepartment(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white">
                                    <option value="">Select Department...</option>
                                    {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Role</label>
                                <select value={role} onChange={e => setRole(e.target.value as 'Section Head' | 'Worker')} className="mt-1 w-full p-2 border rounded-md bg-white">
                                    <option value="Worker">Worker</option>
                                    <option value="Section Head">Section Head</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-3 pt-2">
                                <label className="block text-sm font-medium">Security Options (At least one required)</label>
                                {/* PIN */}
                                <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                    <KeyIcon />
                                    <label className="font-semibold w-28">PIN (4 digits)</label>
                                    <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0,4))} maxLength={4} className="flex-grow p-2 border rounded-md" />
                                </div>
                                {/* Facelock */}
                                <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                    <CameraIcon />
                                    <label className="font-semibold w-28">Facelock</label>
                                    {faceLockCode ? (
                                        <div className="flex-grow flex justify-between items-center">
                                            <span className="text-green-600 font-semibold flex items-center gap-1"><CheckIcon /> Configured</span>
                                            <button onClick={() => setFaceLockCode('')} className="text-xs text-red-500 hover:underline">Remove</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowFaceLockModal(true)} className="flex-grow p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm">Setup Facelock</button>
                                    )}
                                </div>
                                {/* Pattern Lock */}
                                <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                    <GridIcon />
                                    <label className="font-semibold w-28">Pattern Lock</label>
                                    {patternLockCode.length > 0 ? (
                                        <div className="flex-grow flex justify-between items-center">
                                            <span className="text-green-600 font-semibold flex items-center gap-1"><CheckIcon /> Configured</span>
                                            <button onClick={() => setPatternLockCode([])} className="text-xs text-red-500 hover:underline">Remove</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowPatternLockModal(true)} className="flex-grow p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm">Setup Pattern</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <button onClick={onClose} className="px-5 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Changes</button>
                    </div>
                </div>
            </div>
        </>
    );
};