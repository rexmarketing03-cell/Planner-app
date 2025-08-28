
import React, { useState, useEffect } from 'react';
import type { OfficialStaff, PermissionArea } from '../../types';
import { PERMISSIONS_HIERARCHY } from '../../types';
import { FaceLockModal } from './FaceLockModal';
import { PatternLockModal } from './PatternLockModal';
import { XIcon, CameraIcon, KeyIcon, GridIcon, CheckIcon } from '../Icons';

interface EditOfficialStaffModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (staffId: string, data: Partial<OfficialStaff>) => void;
    staff: OfficialStaff | null;
}

const getDescendants = (nodeName: string, hierarchy: typeof PERMISSIONS_HIERARCHY): string[] => {
    const findNode = (name: string, nodes: typeof PERMISSIONS_HIERARCHY): typeof PERMISSIONS_HIERARCHY[0] | null => {
        for (const node of nodes) {
            if (node.name === name) return node;
            if (node.sub) {
                const found = findNode(name, node.sub);
                if (found) return found;
            }
        }
        return null;
    };
    
    const flatten = (node: typeof PERMISSIONS_HIERARCHY[0]): string[] => {
        let names: string[] = [];
        if (node.sub) {
            node.sub.forEach(child => {
                names.push(child.name);
                names = names.concat(flatten(child));
            });
        }
        return names;
    };
    
    const node = findNode(nodeName, hierarchy);
    return node ? flatten(node) : [];
};

const PermissionTree: React.FC<{
    nodes: typeof PERMISSIONS_HIERARCHY;
    selected: PermissionArea[];
    onToggle: (p: PermissionArea, c: boolean) => void;
    parentIsSelected?: boolean;
    level?: number;
}> = ({ nodes, selected, onToggle, parentIsSelected = true, level = 0 }) => {
    if (!parentIsSelected) return null;

    return (
        <div style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
            {nodes.map(node => {
                const isSelected = selected.includes(node.name as PermissionArea);
                return (
                    <div key={node.name}>
                        <label className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-md">
                            <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={e => onToggle(node.name as PermissionArea, e.target.checked)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span>{node.name}</span>
                        </label>
                        {node.sub && (
                            <PermissionTree nodes={node.sub} selected={selected} onToggle={onToggle} parentIsSelected={isSelected} level={level + 1} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};


export const EditOfficialStaffModal: React.FC<EditOfficialStaffModalProps> = ({ show, onClose, onSave, staff }) => {
    const [name, setName] = useState('');
    const [empNumber, setEmpNumber] = useState('');
    const [position, setPosition] = useState('');
    const [permissions, setPermissions] = useState<PermissionArea[]>([]);
    const [pin, setPin] = useState('');
    const [faceLockCode, setFaceLockCode] = useState('');
    const [patternLockCode, setPatternLockCode] = useState<number[]>([]);

    const [showFaceLockModal, setShowFaceLockModal] = useState(false);
    const [showPatternLockModal, setShowPatternLockModal] = useState(false);

    useEffect(() => {
        if (staff) {
            setName(staff.name);
            setEmpNumber(staff.empNumber);
            setPosition(staff.position);
            setPermissions(staff.permissions);
            setPin(staff.pin || '');
            setFaceLockCode(staff.faceLockCode || '');
            setPatternLockCode(staff.patternLockCode || []);
        }
    }, [staff]);
    
    const handlePermissionChange = (permission: PermissionArea, checked: boolean) => {
        setPermissions(prev => {
            if (checked) {
                return [...prev, permission];
            } else {
                const descendants = getDescendants(permission, PERMISSIONS_HIERARCHY);
                return prev.filter(p => p !== permission && !descendants.includes(p));
            }
        });
    };

    const handleSave = () => {
        if (!staff) return;

        if (!name.trim() || !empNumber.trim() || !position.trim()) {
            alert("Please fill in Name, Employee Number, and Position.");
            return;
        }

        const isEditingAdmin = staff.empNumber === 'Admin';
        
        // Use the current state of pin for validation, as it holds the original value for the disabled admin field.
        const currentPinValue = pin;

        if (!isEditingAdmin && currentPinValue && currentPinValue.length < 4) {
            alert("Password must be at least 4 characters long.");
            return;
        }

        if (!currentPinValue && !faceLockCode && patternLockCode.length === 0) {
            alert("Please set at least one security method (Password, Facelock, or Pattern Lock).");
            return;
        }

        const updatedData: Partial<OfficialStaff> = {
            name: name.trim(),
            empNumber: empNumber.trim(),
            position: position.trim(),
            permissions,
            faceLockCode: faceLockCode || undefined,
            patternLockCode: patternLockCode.length > 0 ? patternLockCode : undefined,
        };

        // Only include the pin if it's NOT the admin user.
        if (!isEditingAdmin) {
            updatedData.pin = pin || undefined;
        }
        
        onSave(staff.id, updatedData);
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

    if (!show || !staff) return null;

    const isEditingAdmin = staff.empNumber === 'Admin';

    return (
        <>
            <FaceLockModal show={showFaceLockModal} onClose={() => setShowFaceLockModal(false)} onSave={handleSaveFaceLock} />
            <PatternLockModal show={showPatternLockModal} onClose={() => setShowPatternLockModal(false)} onSave={handleSavePatternLock} />
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[70]">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 className="text-2xl font-bold text-indigo-700">Edit Staff Member</h3>
                        <button onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-gray-100"><XIcon /></button>
                    </div>

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div>
                                <label className="block text-sm font-medium">Employee Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Employee Number</label>
                                <input type="text" value={empNumber} onChange={e => setEmpNumber(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium">Position</label>
                                <input type="text" value={position} onChange={e => setPosition(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                            </div>
                             <div className="md:col-span-2 space-y-3">
                                <label className="block text-sm font-medium">Permissions</label>
                                <div className="p-2 border rounded-md bg-white">
                                    <PermissionTree nodes={PERMISSIONS_HIERARCHY} selected={permissions} onToggle={handlePermissionChange} />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-3 pt-2">
                                <label className="block text-sm font-medium">Security Options</label>
                                <div>
                                    <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                        <KeyIcon />
                                        <label className="font-semibold w-28">Password</label>
                                        <input
                                            type="password"
                                            value={pin}
                                            onChange={e => setPin(e.target.value)}
                                            className="flex-grow p-2 border rounded-md disabled:bg-gray-200 disabled:cursor-not-allowed"
                                            disabled={isEditingAdmin}
                                            title={isEditingAdmin ? "Admin password cannot be changed here." : ""}
                                        />
                                    </div>
                                    {isEditingAdmin && (
                                        <p className="text-xs text-gray-500 mt-2 pl-1">
                                            The Administrator password can only be changed via the "Change Password" option in the user profile menu.
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                    <CameraIcon />
                                    <label className="font-semibold w-28">Facelock</label>
                                    {faceLockCode ? (
                                        <div className="flex-grow flex justify-between items-center">
                                            <span className="text-green-600 flex items-center gap-1"><CheckIcon /> Configured</span>
                                            <button onClick={() => setFaceLockCode('')} className="text-xs text-red-500 hover:underline">Remove</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowFaceLockModal(true)} className="flex-grow p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm">Setup</button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                    <GridIcon />
                                    <label className="font-semibold w-28">Pattern Lock</label>
                                    {patternLockCode.length > 0 ? (
                                        <div className="flex-grow flex justify-between items-center">
                                            <span className="text-green-600 flex items-center gap-1"><CheckIcon /> Configured</span>
                                            <button onClick={() => setPatternLockCode([])} className="text-xs text-red-500 hover:underline">Remove</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowPatternLockModal(true)} className="flex-grow p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm">Setup</button>
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
