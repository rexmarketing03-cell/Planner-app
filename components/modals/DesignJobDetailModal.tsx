
import React, { useMemo } from 'react';
import type { Job, OfficialStaff, Operator } from '../../types';
import { XIcon, SendToPlanningIcon, CheckIcon } from '../Icons';

interface DesignJobDetailModalProps {
    show: boolean;
    job: Job;
    onClose: () => void;
    onSendToPlanning: (jobId: string) => void;
    currentUser: OfficialStaff | Operator | null;
}

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};

export const DesignJobDetailModal: React.FC<DesignJobDetailModalProps> = ({ show, job, onClose, onSendToPlanning, currentUser }) => {
    if (!show) return null;

    const isHeadOfDesigner = useMemo(() => {
        if (!currentUser || !('permissions' in currentUser)) {
            return false;
        }
        return currentUser.permissions.includes('Head Of Designer');
    }, [currentUser]);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl mx-auto w-full my-8">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-2xl font-bold text-indigo-700">{job.jobNumber}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon /></button>
                </div>

                <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p><span className="font-semibold">Customer:</span> {job.customerName}</p>
                    <p><span className="font-semibold">Finish Date:</span> {job.finishDate}</p>
                    <p><span className="font-semibold">Designer:</span> {job.designerName}</p>
                    <p><span className="font-semibold">Target Date:</span> {job.designTargetDate}</p>
                </div>

                <div className="mt-6 border-t pt-4">
                     <h4 className="text-lg font-semibold text-gray-800 mb-3">Designer Activity Log</h4>
                     <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm">
                            <p><span className="font-semibold">Started:</span> {formatDate(job.designerStartedAt)}</p>
                            <p><span className="font-semibold">Finished:</span> {formatDate(job.designerFinishedAt)}</p>
                        </div>

                        {job.designerHoldHistory && job.designerHoldHistory.length > 0 && (
                             <div className="mt-3 pt-3 border-t">
                                <h5 className="font-semibold text-gray-600 mb-2">Hold History</h5>
                                <ul className="space-y-2 text-xs">
                                    {job.designerHoldHistory.map((item, index) => (
                                        <li key={index} className="bg-yellow-100 p-2 rounded-md">
                                            <p><span className="font-semibold">Hold:</span> {formatDate(item.holdAt)}</p>
                                            <p><span className="font-semibold">Resume:</span> {formatDate(item.resumeAt)}</p>
                                            <p className="mt-1"><span className="font-semibold">Reason:</span> {item.reason}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                     </div>
                </div>
                
                 <div className="mt-6 border-t pt-4">
                     <h4 className="text-lg font-semibold text-gray-800 mb-3">Drawings Created</h4>
                      <div className="space-y-2 max-h-[20vh] overflow-y-auto pr-2 bg-gray-50 p-3 rounded-lg">
                        <ul className="list-disc list-inside">
                             {job.drawings?.map(d => (
                                <li key={d.id} className="text-sm">
                                    <span className="font-semibold">{d.name}</span> - Quantity: {d.quantity}
                                </li>
                            ))}
                        </ul>
                      </div>
                 </div>


                <div className="mt-8 pt-4 border-t flex justify-end">
                    {job.designCompleted ? (
                        <div className="px-5 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md flex items-center justify-center gap-2">
                            <CheckIcon className="w-5 h-5 text-green-600" />
                            Already Sent to Planning
                        </div>
                    ) : (
                        <button 
                            onClick={() => onSendToPlanning(job.id)}
                            disabled={!isHeadOfDesigner}
                            title={!isHeadOfDesigner ? "Permission Denied" : ""}
                            className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <SendToPlanningIcon /> Send to Planning
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
