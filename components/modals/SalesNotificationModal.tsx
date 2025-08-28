import React, { useState, useMemo, useEffect } from 'react';
import type { Job } from '../../types';
import { CheckIcon, XIcon } from '../Icons';

interface SalesNotificationModalProps {
    show: boolean;
    onClose: () => void;
    jobsWithRequests: Job[];
    onApprove: (jobId: string, newDate: string) => void;
    onReject: (jobId: string, reason: string) => void;
}

const RequestItem: React.FC<{ job: Job; onApprove: SalesNotificationModalProps['onApprove']; onReject: SalesNotificationModalProps['onReject']; }> = ({ job, onApprove, onReject }) => {
    const [finalDate, setFinalDate] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const suggestedDate = useMemo(() => {
        const request = job.salesUpdateRequest;
        if (!request?.requestedDate) return null;

        // If from planning, the planner's requested date is the suggestion
        if (request.source === 'planning') {
            return new Date(request.requestedDate);
        }

        // If from stores (or source is undefined for backward compatibility), calculate based on original duration
        if (!job.finishDate || !job.addedDate) return null;
        try {
            const originalDurationMs = new Date(job.finishDate).getTime() - new Date(job.addedDate).getTime();
            const materialReadyDate = new Date(request.requestedDate);
            materialReadyDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day
            const materialReadyMs = materialReadyDate.getTime();
            
            return new Date(materialReadyMs + originalDurationMs);
        } catch (e) {
            console.error("Error calculating date:", e);
            return null;
        }
    }, [job]);
    
    useEffect(() => {
        if (suggestedDate) {
            // Format to YYYY-MM-DD for the input
            const offset = suggestedDate.getTimezoneOffset();
            const adjustedDate = new Date(suggestedDate.getTime() - (offset*60*1000));
            setFinalDate(adjustedDate.toISOString().split('T')[0]);
        }
    }, [suggestedDate]);

    const handleApproveClick = () => {
        if (finalDate) {
            onApprove(job.id, finalDate);
        }
    };
    
    const handleRejectClick = () => {
        if (rejectionReason.trim()) {
            onReject(job.id, rejectionReason.trim());
        }
    };

    return (
        <li className="p-4 space-y-3">
            <div>
                <p className="font-bold text-indigo-700">{job.jobNumber}</p>
                <p className="text-sm text-gray-500 font-medium">{job.customerName}</p>
            </div>
            <div className="text-xs bg-gray-50 p-2 rounded-md border">
                <p className="font-semibold">Reason for Request ({job.salesUpdateRequest?.source || 'stores'}):</p>
                <p className="text-gray-600">{job.salesUpdateRequest?.reason}</p>
            </div>
            <div className="text-sm space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">Original Finish Date:</span>
                    <span className="font-semibold line-through">{job.finishDate}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">Requested/Needed Date:</span>
                    <span className="font-semibold">{job.salesUpdateRequest?.requestedDate}</span>
                </div>
                <div className="flex justify-between items-center text-blue-600">
                    <span className="text-gray-500">System Suggested Date:</span>
                    <span className="font-bold">{suggestedDate ? suggestedDate.toISOString().split('T')[0] : 'N/A'}</span>
                </div>
            </div>
            
            <div className="mt-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200 space-y-3">
                 <div className="flex justify-between items-center text-green-700">
                    <span className="text-sm font-semibold">New Finish Date:</span>
                    <input 
                        type="date" 
                        value={finalDate} 
                        onChange={e => setFinalDate(e.target.value)}
                        className="font-bold bg-white text-gray-800 p-1 border rounded-md text-sm"
                    />
                </div>
            </div>

            {!isRejecting ? (
                 <div className="mt-3 flex justify-end items-center gap-2">
                    <button onClick={() => setIsRejecting(true)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                        Reject
                    </button>
                    <button onClick={handleApproveClick} className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 text-sm">
                        <CheckIcon className="w-4 h-4" /> Approve & Update
                    </button>
                </div>
            ) : (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <label htmlFor={`reason-${job.id}`} className="text-sm font-medium text-red-800">Reason for Rejection</label>
                    <textarea
                        id={`reason-${job.id}`}
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        rows={2}
                        className="w-full mt-1 p-1 border rounded-md text-sm"
                        placeholder="Provide a reason..."
                    ></textarea>
                     <div className="mt-2 flex justify-end items-center gap-2">
                        <button onClick={() => setIsRejecting(false)} className="px-3 py-1 text-sm bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
                            Cancel
                        </button>
                        <button 
                            onClick={handleRejectClick} 
                            disabled={!rejectionReason.trim()}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400">
                            Confirm Rejection
                        </button>
                    </div>
                </div>
            )}
        </li>
    );
};


export const SalesNotificationModal: React.FC<SalesNotificationModalProps> = ({ show, onClose, jobsWithRequests, onApprove, onReject }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-transparent h-full w-full z-40" onClick={onClose}>
            <div className="absolute top-16 right-6 mt-2 w-[28rem] bg-white rounded-lg shadow-xl z-50 border border-gray-200" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-gray-800">Sales Approval Requests</h3>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-200 rounded-full"><XIcon/></button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                    {jobsWithRequests.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {jobsWithRequests.map(job => (
                                <RequestItem key={job.id} job={job} onApprove={onApprove} onReject={onReject} />
                            ))}
                        </ul>
                    ) : (
                        <p className="p-6 text-center text-gray-500">No pending requests.</p>
                    )}
                </div>
            </div>
        </div>
    );
};