import React, { useState, useEffect, useRef } from 'react';
import type { Job, Drawing, Process, MachinesMap } from '../../types';
import { GripVerticalIcon, PlusIcon, TrashIcon, AlertTriangleIcon } from '../Icons';
import { ConfirmationModal } from './ConfirmationModal';

interface DrawingModalProps {
    onClose: () => void;
    onSave: (drawingName: string, quantity: number, processes: Process[]) => void;
    onDateConflict: (drawingName: string, quantity: number, processes: Process[]) => void;
    job: Job;
    drawingToEdit: Drawing | null;
    showModal: (message: string) => void;
    allMachines: MachinesMap;
    onUpdateMachines: (updatedMachines: MachinesMap) => void;
    allProcesses: string[];
    onUpdateProcesses: (updatedProcesses: string[]) => void;
    department: string;
}

export const DrawingModal: React.FC<DrawingModalProps> = ({ onClose, onSave, onDateConflict, job, drawingToEdit, showModal, allMachines, onUpdateMachines, allProcesses, onUpdateProcesses, department }) => {
    const [drawingName, setDrawingName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [processes, setProcesses] = useState<Process[]>([]);
    
    const [newProcessName, setNewProcessName] = useState('');
    const [newProcessSequence, setNewProcessSequence] = useState('');
    const [newProcessMachine, setNewProcessMachine] = useState('');
    const [newProcessHours, setNewProcessHours] = useState('');
    const [newProcessMinutes, setNewProcessMinutes] = useState('');
    const [newProcessProgrammingRequired, setNewProcessProgrammingRequired] = useState(false);
    const [newProcessDate, setNewProcessDate] = useState('');
    const [dateWarning, setDateWarning] = useState('');


    const [showNewMachineInput, setShowNewMachineInput] = useState(false);
    const [customMachineName, setCustomMachineName] = useState('');
    const [showMachineRemoveConfirm, setShowMachineRemoveConfirm] = useState(false);
    const [machineToRemove, setMachineToRemove] = useState<{ process: string; machine: string } | null>(null);

    const [showNewProcessInput, setShowNewProcessInput] = useState(false);
    const [customProcessName, setCustomProcessName] = useState('');

    const dragItemIndex = useRef<number | null>(null);
    const dragOverItemIndex = useRef<number | null>(null);

    useEffect(() => {
        if (drawingToEdit) {
            setDrawingName(drawingToEdit.name);
            setQuantity(drawingToEdit.quantity || 1);
            setProcesses(drawingToEdit.processes.sort((a, b) => a.sequence - b.sequence));
        } else {
            setDrawingName('');
            setQuantity(1);
            setProcesses([]);
        }
    }, [drawingToEdit]);

    useEffect(() => {
        if (newProcessName !== 'CNC Milling' && newProcessName !== 'CNC Lathe') {
            setNewProcessProgrammingRequired(false);
        }
    }, [newProcessName]);

    useEffect(() => {
        if (newProcessDate && job.finishDate) {
            if (new Date(newProcessDate) > new Date(job.finishDate)) {
                setDateWarning(`Warning: This date is after the job's finish date (${job.finishDate}).`);
            } else {
                setDateWarning('');
            }
        }
    }, [newProcessDate, job.finishDate]);

    const handleAddProcess = () => {
        if (!newProcessName) { showModal("Please select a process."); return; }
        const sequence = parseInt(newProcessSequence);
        if (isNaN(sequence) || sequence <= 0) { showModal("Please enter a valid, positive sequence number."); return; }
        if (processes.some(p => p.sequence === sequence)) { showModal("This sequence number is already in use."); return; }
        if (!newProcessMachine) { showModal("Please select or add a machine."); return; }
        const hours = parseInt(newProcessHours) || 0;
        const minutes = parseInt(newProcessMinutes) || 0;
        if (hours < 0 || minutes < 0 || minutes >= 60) { showModal("Please enter a valid time."); return; }
        if (!newProcessDate) { showModal("Please enter a planned date for the process."); return; }

        const newProcess: Process = {
            id: `proc-${Date.now()}`, name: newProcessName, sequence, machine: newProcessMachine,
            estimatedHours: hours, estimatedMinutes: minutes, completed: false,
            qualityCheckCompleted: false, qualityCheckComment: "",
            programmingRequired: newProcessProgrammingRequired,
            plannedDate: newProcessDate
        };
        setProcesses(prev => [...prev, newProcess].sort((a, b) => a.sequence - b.sequence));
        setNewProcessName(''); setNewProcessSequence(''); setNewProcessMachine(''); setNewProcessHours(''); setNewProcessMinutes(''); setNewProcessDate('');
        setNewProcessProgrammingRequired(false);
    };
    
    const handleRemoveProcess = (idToRemove: string) => {
        setProcesses(processes.filter(p => p.id !== idToRemove).map((p, index) => ({ ...p, sequence: index + 1 })));
    };
    
    const handleInternalSave = () => {
        if (!drawingName.trim()) { showModal("Drawing name cannot be empty."); return; }
        if (department !== 'Design' && processes.length === 0) { showModal("Please add at least one process."); return; }

        const latestPlannedDate = processes.reduce((maxDate, p) => {
            if (!p.plannedDate) return maxDate;
            return p.plannedDate > maxDate ? p.plannedDate : maxDate;
        }, '');

        if (latestPlannedDate && new Date(latestPlannedDate) > new Date(job.finishDate)) {
            onDateConflict(drawingName, quantity, processes);
        } else {
            onSave(drawingName, quantity, processes);
        }
    };

    const handleDragEnd = () => {
        const reSequenced = processes.map((p, index) => ({ ...p, sequence: index + 1 }));
        setProcesses(reSequenced);
        dragItemIndex.current = null;
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => { dragItemIndex.current = index; };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        if (dragItemIndex.current === null || dragItemIndex.current === index) return;
        const processesCopy = [...processes];
        const draggedItem = processesCopy.splice(dragItemIndex.current, 1)[0];
        processesCopy.splice(index, 0, draggedItem);
        dragItemIndex.current = index;
        setProcesses(processesCopy);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[60]">
            <ConfirmationModal show={showMachineRemoveConfirm} message={`Remove "${machineToRemove?.machine}" from "${machineToRemove?.process}"?`} onConfirm={() => {}} onCancel={() => setShowMachineRemoveConfirm(false)} />
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-5xl mx-auto w-full">
                <h3 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-3">{drawingToEdit ? 'Edit Drawing' : `Add Drawing to ${job.jobNumber}`}</h3>
                
                {drawingToEdit?.replanRequired && (
                     <div className="p-3 mb-4 bg-orange-100 border-l-4 border-orange-500 text-orange-800">
                        <div className="flex">
                            <div className="py-1"><AlertTriangleIcon className="w-5 h-5" /></div>
                            <div className="ml-3">
                                <p className="font-bold">Reschedule Required</p>
                                <p className="text-sm">
                                    Material availability has been delayed. Please review and update the planned dates for each process below.
                                    New material date is <span className="font-semibold">{drawingToEdit.expectedMaterialDate || 'N/A'}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Drawing Name</label>
                        <input type="text" value={drawingName} onChange={(e) => setDrawingName(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min="1" className="mt-1 block w-full px-4 py-2 border rounded-md" />
                    </div>
                </div>
                {department !== 'Design' && (
                    <>
                        <div className="bg-gray-50 p-4 rounded-lg border mb-6">
                            <h4 className="text-lg font-semibold mb-3">Add Process</h4>
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                <div>
                                    <label className="text-xs">Process</label>
                                    <select value={newProcessName} onChange={e => setNewProcessName(e.target.value)} className="mt-1 block w-full p-2 border rounded-md text-sm">
                                        <option value="">Select...</option>
                                        {allProcesses.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs">Machine</label>
                                    <select value={newProcessMachine} onChange={e => setNewProcessMachine(e.target.value)} disabled={!newProcessName} className="mt-1 block w-full p-2 border rounded-md text-sm">
                                        <option value="">Select...</option>
                                        {newProcessName && allMachines[newProcessName]?.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className="text-xs">Planned Date</label>
                                    <input type="date" value={newProcessDate} onChange={e => setNewProcessDate(e.target.value)} className="mt-1 block w-full p-2 border rounded-md text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs">Seq #</label>
                                    <input type="number" value={newProcessSequence} onChange={e => setNewProcessSequence(e.target.value)} placeholder="1" min="1" className="mt-1 block w-full p-2 border rounded-md text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs">Time/Piece</label>
                                    <div className="flex gap-2">
                                        <input type="number" value={newProcessHours} onChange={e => setNewProcessHours(e.target.value)} placeholder="Hrs" min="0" className="mt-1 w-full p-2 border rounded-md text-sm" />
                                        <input type="number" value={newProcessMinutes} onChange={e => setNewProcessMinutes(e.target.value)} placeholder="Mins" min="0" max="59" className="mt-1 w-full p-2 border rounded-md text-sm" />
                                    </div>
                                </div>
                                <button onClick={handleAddProcess} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-1"><PlusIcon /> Add</button>
                            </div>
                            {dateWarning && (
                                <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                    <AlertTriangleIcon className="w-4 h-4" /> {dateWarning}
                                </div>
                            )}
                            {(newProcessName === 'CNC Milling' || newProcessName === 'CNC Lathe') && (
                                <div className="mt-4 flex items-center">
                                    <input
                                        type="checkbox"
                                        id="programming-required"
                                        checked={newProcessProgrammingRequired}
                                        onChange={(e) => setNewProcessProgrammingRequired(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor="programming-required" className="ml-2 block text-sm text-gray-900">
                                        Programming Required
                                    </label>
                                </div>
                            )}
                        </div>
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold mb-3">Process Sequence</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-indigo-50 rounded-lg">
                                {processes.map((p, index) => {
                                    const isOverdue = p.plannedDate && new Date(p.plannedDate) > new Date(job.finishDate);
                                    return (
                                    <div key={p.id} draggable onDragStart={e => handleDragStart(e, index)} onDragEnter={e => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()} className={`flex items-center justify-between bg-white p-3 rounded-md shadow-sm ${isOverdue ? 'border-l-4 border-red-500' : ''}`}>
                                        <div className="flex items-center gap-4 flex-grow">
                                            <GripVerticalIcon />
                                            <span className="font-bold text-indigo-600 w-8 text-center">{p.sequence}.</span>
                                            <div>
                                                <div className="flex items-center">
                                                    <span className="font-semibold">{p.name}</span>
                                                    {p.programmingRequired && (
                                                        <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                                            Programming
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="block text-sm text-gray-500">{p.machine}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>Date: {p.plannedDate}</span>
                                            <span className="text-sm text-gray-600">Time: {p.estimatedHours}h {p.estimatedMinutes}m</span>
                                            <button onClick={() => handleRemoveProcess(p.id)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><TrashIcon /></button>
                                        </div>
                                    </div>
                                )})}
                                {processes.length === 0 && <p className="text-center text-gray-500 py-4">No processes added.</p>}
                            </div>
                        </div>
                    </>
                )}
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button onClick={handleInternalSave} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Drawing</button>
                </div>
            </div>
        </div>
    );
};