

import React, { useMemo } from 'react';
import type { Job, Drawing, Process, OfficialStaff, Operator, PermissionArea } from '../../types';
import { XIcon, TrashIcon, PlayIcon, PauseIcon, ReworkIcon, EditIcon, PlusIcon, CheckIcon, SendToPlanningIcon, FileTextIcon } from '../Icons';

interface JobActionsModalProps {
    show: boolean;
    onClose: () => void;
    job: Job;
    department: string;
    qcEnabled: boolean;
    triggerDeleteJob: (jobId: string) => void;
    handleResumeDrawing: (jobId: string, drawingId: string) => void;
    handleHoldDrawing: (jobId: string, drawingId: string) => void;
    openReworkModal: (jobId: string, drawing: Drawing) => void;
    openEditDrawingModal: (jobId: string, drawing: Drawing, department: string) => void;
    triggerDeleteDrawing: (jobId: string, drawingId: string) => void;
    handleSetMaterialReady: (jobId: string, drawingId: string) => void;
    handleProcessCompletion: (jobId: string, drawingId: string, sequence: number, isCompleted: boolean) => void;
    handleQualityCheckCompletion: (jobId: string, drawingId: string, sequence: number, isCompleted: boolean) => void;
    handleQualityCheckCommentChange: (jobId: string, drawingId: string, sequence: number, comment: string) => void;
    handleFinalQcApproval: (jobId: string, drawingId: string, isApproved: boolean) => void;
    handleFinalQcCommentChange: (jobId: string, drawingId: string, comment: string) => void;
    handleReworkCompleted: (jobId: string, drawingId: string) => void;
    openAddDrawingModal: (jobId: string, department: string) => void;
    handleReadyForPlanning: (jobId: string) => void;
    handleSendDrawingToPlanning: (jobId: string, drawingId: string) => void;
    getDepartmentForProcess: (processName: string) => string | null;
    openMaterialStockModal: (jobId: string, drawingId: string) => void;
    openPlanningMaterialDelayModal: (jobId: string, drawingId: string) => void;
    currentUser: OfficialStaff | Operator | null;
    onOpenFinalReportModal: (job: Job, drawing: Drawing) => void;
}

const MaterialStatusDisplay: React.FC<{drawing: Drawing, jobId: string, onSetReady: () => void, onSetOutOfStock: () => void}> = ({ drawing, onSetReady, onSetOutOfStock }) => {
    
    if (drawing.materialStatus === 'Awaiting Stock') {
        const daysRemaining = drawing.expectedMaterialDate ? Math.ceil((new Date(drawing.expectedMaterialDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)) : null;
        let daysText = '';
        let textColor = 'text-yellow-800';
        if (daysRemaining !== null) {
            if (daysRemaining < 0) {
                daysText = `(Overdue by ${Math.abs(daysRemaining)} days)`;
                textColor = 'text-red-700';
            } else if (daysRemaining === 0) {
                daysText = '(Due today)';
            } else {
                daysText = `(${daysRemaining} days remaining)`;
            }
        }

        return (
            <div className="mt-2 space-y-2">
                <div className="p-2 bg-yellow-100 border border-yellow-300 rounded-md text-sm">
                    <p className="font-semibold text-yellow-800">Awaiting Stock</p>
                    <p className={`text-xs ${textColor}`}>Expected: {drawing.expectedMaterialDate} {daysText}</p>
                </div>
                 <label className="flex items-center cursor-pointer">
                    <input type="checkbox" id={`mat-ready-override-${drawing.id}`} onChange={onSetReady} className="h-4 w-4 text-indigo-600 rounded"/>
                    <label htmlFor={`mat-ready-override-${drawing.id}`} className="ml-2 text-sm font-medium">Material is Now Ready</label>
                </label>
            </div>
        );
    }

    // Default: 'Pending' status
    return (
        <div className="mt-2 flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
                <input type="checkbox" id={`mat-ready-${drawing.id}`} checked={drawing.materialStatus === 'Ready'} onChange={onSetReady} className="h-4 w-4 text-indigo-600 rounded"/>
                <label htmlFor={`mat-ready-${drawing.id}`} className="ml-2 text-sm font-medium">Material Ready</label>
            </label>
            <button onClick={onSetOutOfStock} className="px-3 py-1 text-xs bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
                Material Is Out of Stock
            </button>
        </div>
    );
};

export const JobActionsModal: React.FC<JobActionsModalProps> = (props) => {
    const { 
        show, onClose, job, department, qcEnabled, triggerDeleteJob, handleResumeDrawing, 
        handleHoldDrawing, openReworkModal, openEditDrawingModal, triggerDeleteDrawing, 
        handleSetMaterialReady, handleProcessCompletion, handleQualityCheckCompletion, 
        handleQualityCheckCommentChange, handleFinalQcApproval, handleFinalQcCommentChange, 
        handleReworkCompleted, openAddDrawingModal, handleReadyForPlanning, 
        handleSendDrawingToPlanning, getDepartmentForProcess, openMaterialStockModal,
        openPlanningMaterialDelayModal, currentUser, onOpenFinalReportModal
    } = props;

    const isHeadOfDesigner = useMemo(() => currentUser && 'permissions' in currentUser && currentUser.permissions.includes('Head Of Designer'), [currentUser]);
    const isDesigner = useMemo(() => currentUser && 'permissions' in currentUser && (currentUser.permissions.includes('Designer') || currentUser.permissions.includes('Head Of Designer')), [currentUser]);

    const isQCOnlyUser = useMemo(() => {
        if (!currentUser || !('permissions' in currentUser)) {
            return false;
        }
        const permissions = currentUser.permissions as PermissionArea[];
        return permissions.includes('Quality Assurance') && !permissions.includes('Production Floor');
    }, [currentUser]);

    if (!show || !job) return null;

    const drawingsInDept = (() => {
        if (department === 'Design') {
            return job.drawings.filter(d => d.currentDepartment === 'Design' || (!job.designCompleted && d.currentDepartment === 'Planning'));
        }
        if (department === 'Material Ready Pending') {
            return job.drawings.filter(d => d.materialStatus === 'Pending' || d.materialStatus === 'Awaiting Stock');
        }
        return job.drawings.filter(d => d.currentDepartment === department);
    })();
        
    const calculateTotalTime = (process: Process, quantity: number) => {
        const totalMinutes = (process.estimatedHours * 60 + process.estimatedMinutes) * quantity;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return { hours, minutes };
    };

    const isMaterialPendingDept = department === 'Material Ready Pending';
    const allMaterialsReadyForJob = (job.drawings || []).every(d => d.materialStatus === 'Ready');

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-3xl mx-auto w-full my-8">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div>
                        <h3 className="text-2xl font-bold text-indigo-700">{job.jobNumber}</h3>
                        <p className="text-sm text-gray-500">in {department}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-gray-100"><XIcon /></button>
                </div>
                
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {department === 'Design' && (
                        <button onClick={() => handleReadyForPlanning(job.id)} disabled={!isHeadOfDesigner} className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" title={!isHeadOfDesigner ? "Permission Denied" : ""}>
                            <CheckIcon /> Finish Design & Send All to Planning
                        </button>
                    )}

                    {drawingsInDept.map(drawing => {
                        const isPlanningDept = department === 'Planning';
                        const isMaterialPending = drawing.materialStatus === 'Pending';
                        const isMaterialAwaiting = drawing.materialStatus === 'Awaiting Stock';
                        const isPlanningLocked = isPlanningDept && (isMaterialPending || isMaterialAwaiting);

                        return (
                        <div key={drawing.id} className={`bg-gray-50 p-4 rounded-lg shadow-sm border ${drawing.isUnderRework ? 'border-dashed border-red-400 bg-red-50' : 'border-gray-200'}`}>
                            {drawing.replanRequired && (
                                <div className="p-2 mb-2 bg-orange-100 border border-orange-300 rounded-md text-sm">
                                    <p className="font-semibold text-orange-800">Reschedule Required</p>
                                    <p className="text-xs text-orange-700">
                                        Material availability has changed. Please edit this drawing to update process dates.
                                        New material date: <span className="font-bold">{drawing.expectedMaterialDate || 'N/A'}</span>.
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-2">
                                <h5 className="font-bold text-gray-800">{drawing.name} (Qty: {drawing.quantity})</h5>
                                <div className="flex space-x-2">
                                    {department === "Design" && <button onClick={() => handleSendDrawingToPlanning(job.id, drawing.id)} disabled={!isHeadOfDesigner} className="text-green-600 p-1 rounded-full hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed" title={!isHeadOfDesigner ? "Permission Denied" : "Send to Planning"}><SendToPlanningIcon /></button>}
                                    {department === "Hold" ? <button onClick={() => handleResumeDrawing(job.id, drawing.id)} className="text-green-600 p-1 rounded-full hover:bg-green-100" title="Resume"><PlayIcon /></button> 
                                    : !['Design', 'Completed', 'Final Quality Check', 'Material Ready Pending'].includes(department) && <button onClick={() => handleHoldDrawing(job.id, drawing.id)} disabled={isQCOnlyUser || !isDesigner} className="text-gray-600 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" title={!isDesigner ? "Permission Denied" : "Hold"}><PauseIcon /></button>}
                                    {!['Design', 'Completed', 'Material Ready Pending'].includes(department) && <button onClick={() => openReworkModal(job.id, drawing)} disabled={!isHeadOfDesigner} className="text-yellow-600 p-1 rounded-full hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed" title={!isHeadOfDesigner ? "Permission Denied" : "Rework"}><ReworkIcon /></button>}
                                    <button onClick={() => openEditDrawingModal(job.id, drawing, department)} disabled={isPlanningLocked || isQCOnlyUser || !isDesigner} className={`text-blue-500 p-1 rounded-full hover:bg-blue-100 ${(isPlanningLocked || isQCOnlyUser || !isDesigner) ? 'opacity-50 cursor-not-allowed' : ''}`} title={!isDesigner ? "Permission Denied" : isPlanningLocked ? "Material must be ready before planning" : "Edit"}><EditIcon /></button>
                                    <button onClick={() => triggerDeleteDrawing(job.id, drawing.id)} disabled={!isHeadOfDesigner} className="text-red-500 p-1 rounded-full hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed" title={!isHeadOfDesigner ? "Permission Denied" : "Delete"}><TrashIcon /></button>
                                </div>
                            </div>

                            {isPlanningLocked && (
                                <div className="mt-2 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 text-sm">
                                    <p className="font-bold">Planning Locked</p>
                                    {isMaterialPending && <p>Waiting for material status from Stores.</p>}
                                    {isMaterialAwaiting && (
                                        <>
                                            <p>Material is awaiting stock. Expected: <span className="font-semibold">{drawing.expectedMaterialDate || 'N/A'}</span>.</p>
                                            <button 
                                                onClick={() => openPlanningMaterialDelayModal(job.id, drawing.id)}
                                                className="mt-2 w-full px-3 py-1 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 font-semibold"
                                            >
                                                Request Finish Date Change from Sales
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                            
                             {(department === "Material Parting" || department === "Material Ready Pending") && (
                                <MaterialStatusDisplay 
                                    drawing={drawing}
                                    jobId={job.id}
                                    onSetReady={() => handleSetMaterialReady(job.id, drawing.id)}
                                    onSetOutOfStock={() => openMaterialStockModal(job.id, drawing.id)}
                                />
                            )}

                            <div className="mt-3 border-t pt-3">
                                <p className="text-sm font-semibold mb-2">Processes:</p>
                                <ul className="space-y-2">
                                    {drawing.processes.sort((a,b) => a.sequence - b.sequence).map((process, index, sortedArr) => {
                                        const totalTime = calculateTotalTime(process, drawing.quantity);
                                        const isCurrentDept = getDepartmentForProcess(process.name) === department;
                                        const isPrevComplete = index === 0 || (sortedArr[index-1].completed && sortedArr[index-1].qualityCheckCompleted);
                                        const isClickable = drawing.materialStatus === 'Ready' && isCurrentDept && isPrevComplete;
                                        
                                        const isCNCProcess = process.name === 'CNC Milling' || process.name === 'CNC Lathe';
                                        const isProgrammingIncomplete = isCNCProcess && process.programmingRequired && !job.programmingFinished;
                                        
                                        let tooltipText = '';
                                        if (isProgrammingIncomplete) {
                                            tooltipText = 'Programming is not yet complete for this job.';
                                        } else if (!isClickable) {
                                            tooltipText = 'Previous process must be completed or material is not ready.';
                                        }

                                        const isCheckboxDisabled = (isProgrammingIncomplete || !isClickable) && !process.completed;
                                        const isProcessCompletionDisabled = isCheckboxDisabled || isQCOnlyUser;
                                        const processCompletionTooltip = isQCOnlyUser ? "Permission Denied: Quality checkers can only perform QC actions." : tooltipText;


                                        return (
                                        <li key={process.sequence} className="flex flex-col text-sm p-2 rounded-md bg-white border">
                                            <div className="flex items-center justify-between">
                                                <div title={processCompletionTooltip} className="relative flex-grow">
                                                    <label className={`flex items-center ${isProcessCompletionDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                        <input type="checkbox" checked={process.completed} onChange={e => handleProcessCompletion(job.id, drawing.id, process.sequence, e.target.checked)} disabled={isProcessCompletionDisabled} className="h-4 w-4 text-indigo-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"/>
                                                        <div className="ml-2">
                                                            <div className={`flex items-center font-medium ${process.completed ? 'line-through' : ''} ${isProcessCompletionDisabled ? 'text-gray-400' : ''}`}>
                                                                <span>{process.sequence}. {process.name}</span>
                                                                {process.programmingRequired && (
                                                                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                                                        Programming
                                                                    </span>
                                                                )}
                                                                <span className="ml-1"> - <span className="text-indigo-600">{process.machine}</span></span>
                                                            </div>
                                                            <span className={`block text-xs ${isProcessCompletionDisabled ? 'text-gray-400' : 'text-gray-500'}`}>Total: {totalTime.hours}h {totalTime.minutes}m</span>
                                                        </div>
                                                    </label>
                                                </div>
                                                {process.completed && <CheckIcon className="w-4 h-4 text-green-600"/>}
                                            </div>
                                            {qcEnabled && (
                                                <div className="ml-6 mt-2 pt-2 border-t space-y-2">
                                                    <label className="flex items-center text-xs">
                                                        <input type="checkbox" checked={process.qualityCheckCompleted} onChange={e => handleQualityCheckCompletion(job.id, drawing.id, process.sequence, e.target.checked)} disabled={!process.completed} className="h-4 w-4 text-purple-600 rounded disabled:opacity-50"/>
                                                        <span className="ml-2">Quality Check OK</span>
                                                    </label>
                                                    <textarea value={process.qualityCheckComment} onChange={e => handleQualityCheckCommentChange(job.id, drawing.id, process.sequence, e.target.value)} rows={2} placeholder="QC Notes..." className="block w-full px-2 py-1 text-xs border rounded-md read-only:bg-gray-100"></textarea>
                                                </div>
                                            )}
                                        </li>
                                    )})}
                                </ul>
                            </div>
                            {drawing.isUnderRework && drawing.currentDepartment === department && (<button onClick={() => handleReworkCompleted(job.id, drawing.id)} className="mt-4 w-full p-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center gap-1"><CheckIcon /> Mark Rework Completed</button>)}
                             {qcEnabled && department === "Final Quality Check" && (
                                <div className="mt-3 border-t pt-3 space-y-2">
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={drawing.finalQcApproved} onChange={e => handleFinalQcApproval(job.id, drawing.id, e.target.checked)} className="h-4 w-4 text-green-600 rounded"/>
                                        <label className="ml-2 text-sm font-medium">Final QC Approved</label>
                                    </label>
                                    <textarea value={drawing.finalQcComment} onChange={e => handleFinalQcCommentChange(job.id, drawing.id, e.target.value)} rows={2} placeholder="Final QC notes..." className="block w-full px-2 py-1 text-xs border rounded-md"></textarea>
                                    {drawing.finalQcApproved && !drawing.finalReport && (
                                        <button 
                                            onClick={() => onOpenFinalReportModal(job, drawing)}
                                            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            <FileTextIcon /> Create Final Report
                                        </button>
                                    )}
                                     {drawing.finalReport && (
                                        <div className="mt-2 p-2 bg-green-100 text-green-800 text-sm rounded-md text-center font-semibold">
                                            Report has been created and saved.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )})}
                    {(department === "Planning" || department === "Design") && <button onClick={() => openAddDrawingModal(job.id, department)} disabled={(department === "Planning" && !allMaterialsReadyForJob && (job.drawings || []).length > 0) || !isDesigner} className={`mt-3 w-full p-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-1 ${((department === "Planning" && !allMaterialsReadyForJob && (job.drawings || []).length > 0) || !isDesigner) ? 'opacity-50 cursor-not-allowed' : ''}`} title={!isDesigner ? "Permission Denied" : department === 'Planning' && !allMaterialsReadyForJob && (job.drawings || []).length > 0 ? "All existing drawings must have material ready to add a new one." : "Add Drawing"}><PlusIcon /> Add Drawing</button>}
                </div>
                 <div className="mt-4 pt-4 border-t flex justify-end">
                    <button onClick={() => triggerDeleteJob(job.id)} disabled={!isHeadOfDesigner} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 disabled:bg-red-300 disabled:cursor-not-allowed"><TrashIcon /> Delete Job</button>
                </div>
            </div>
        </div>
    );
};