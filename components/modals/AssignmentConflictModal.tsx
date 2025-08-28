import React from 'react';
import type { Operator } from '../../types';
import { AlertTriangleIcon } from '../Icons';

interface AssignmentConflictModalProps {
    show: boolean;
    onClose: () => void;
    onConfirmOvertime: () => void;
    conflictData: {
        operator: Operator;
        processDurationHours: number;
        currentHours: number;
        alternativeOperators: Operator[];
    } | null;
    calculateOperatorHoursForDate: (operatorId: string, date: string) => number;
    selectedDate: string;
    onSelectAlternative: (operatorId: string) => void;
}

export const AssignmentConflictModal: React.FC<AssignmentConflictModalProps> = ({ 
    show, 
    onClose, 
    onConfirmOvertime, 
    conflictData,
    calculateOperatorHoursForDate,
    selectedDate,
    onSelectAlternative,
}) => {
    if (!show || !conflictData) return null;

    const { operator, processDurationHours, currentHours, alternativeOperators } = conflictData;
    const newTotalHours = currentHours + processDurationHours;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-[90]">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-lg mx-auto w-full">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangleIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Operator Schedule Conflict</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Assigning this task will put <span className="font-semibold">{operator.name}</span> at <span className="font-bold">{newTotalHours.toFixed(2)} hours</span> for today.
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                (Current: {currentHours.toFixed(2)}h + Task: {processDurationHours.toFixed(2)}h)
                            </p>
                        </div>
                    </div>
                </div>

                {alternativeOperators.length > 0 && (
                     <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-gray-700 mb-2">Alternative Operators in this Department:</h4>
                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {alternativeOperators.map(altOp => {
                                const hours = calculateOperatorHoursForDate(altOp.id, selectedDate);
                                return (
                                    <li key={altOp.id} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
                                        <div>
                                            <p className="font-medium">{altOp.name}</p>
                                            <p className="text-xs text-gray-600">Current Hours: <span className="font-bold">{hours.toFixed(2)}h</span></p>
                                        </div>
                                        <button 
                                            onClick={() => onSelectAlternative(altOp.id)}
                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                                        >
                                            Assign
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={onConfirmOvertime}
                    >
                        Assign as Overtime
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
