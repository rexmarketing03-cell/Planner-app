import React, { useState, useMemo, useEffect } from 'react';
import type { OfficialStaff, Programmer } from '../../types';

interface AddEligibleProgrammerModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    officialStaff: OfficialStaff[];
    programmers: Programmer[];
}

export const AddEligibleProgrammerModal: React.FC<AddEligibleProgrammerModalProps> = ({ show, onClose, onSave, officialStaff, programmers }) => {
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');

    const eligibleStaff = useMemo(() => {
        const programmerNames = new Set(programmers.map(p => p.name.trim().toLowerCase()));
        return officialStaff.filter(staff => {
            const permissions = new Set(staff.permissions);
            const hasRequiredPermissions = 
                permissions.has('Engineering') &&
                permissions.has('Programming') &&
                permissions.has('Programmer');
            
            return hasRequiredPermissions && !programmerNames.has(staff.name.trim().toLowerCase());
        });
    }, [officialStaff, programmers]);

    useEffect(() => {
        // Reset selection when modal is shown or eligible staff changes
        if (show && eligibleStaff.length > 0) {
            setSelectedStaffId(eligibleStaff[0].id);
        } else if (show) {
            setSelectedStaffId('');
        }
    }, [show, eligibleStaff]);

    const handleSave = () => {
        const selected = eligibleStaff.find(s => s.id === selectedStaffId);
        if (selected) {
            onSave(selected.name);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[70]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Eligible Programmer</h3>
                
                {eligibleStaff.length > 0 ? (
                    <>
                        <p className="text-sm text-gray-600 mb-4">Select a staff member with the correct permissions to add as a programmer.</p>
                        <div className="mb-6">
                            <label htmlFor="programmerSelect" className="block text-sm font-medium text-gray-700 mb-1">Eligible Staff</label>
                            <select
                                id="programmerSelect"
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {eligibleStaff.map(staff => (
                                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-4">
                           <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                Add Programmer
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-gray-600 mb-4">
                            There are no staff members with the required permissions ('Engineering', 'Programming', 'Programmer') who are not already in the programmer list.
                        </p>
                         <div className="flex justify-end">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                Close
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
