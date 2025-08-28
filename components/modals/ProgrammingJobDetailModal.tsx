import React from 'react';
import type { Job } from '../../types';
import { XIcon } from '../Icons';

interface ProgrammingJobDetailModalProps {
    show: boolean;
    job: Job;
    onClose: () => void;
}

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};

export const ProgrammingJobDetailModal: React.FC<ProgrammingJobDetailModalProps> = ({ show, job, onClose }) => {
    if (!show) return null;

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
                    <p><span className="font-semibold">Programmer:</span> {job.programmerName}</p>
                    <p><span className="font-semibold">Target Date:</span> {job.programmingTargetDate}</p>
                </div>

                <div className="mt-6 border-t pt-4">
                     <h4 className="text-lg font-semibold text-gray-800 mb-3">Programmer Activity Log</h4>
                     <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm">
                            <p><span className="font-semibold">Started:</span> {formatDate(job.programmerStartedAt)}</p>
                            <p><span className="font-semibold">Finished:</span> {formatDate(job.programmerFinishedAt)}</p>
                        </div>

                        {job.programmerHoldHistory && job.programmerHoldHistory.length > 0 && (
                             <div className="mt-3 pt-3 border-t">
                                <h5 className="font-semibold text-gray-600 mb-2">Hold History</h5>
                                <ul className="space-y-2 text-xs">
                                    {job.programmerHoldHistory.map((item, index) => (
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
                     <h4 className="text-lg font-semibold text-gray-800 mb-3">Programs/Drawings Created</h4>
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

            </div>
        </div>
    );
};