import React, { useState } from 'react';
import type { Job } from '../../types';
import { XIcon, PrinterIcon } from '../Icons';

interface CompletedJobReportModalProps {
    show: boolean;
    job: Job;
    onClose: () => void;
    onMarkAsDelivered: (jobId: string, deliveryDate: string) => void;
    onPrint: (job: Job) => void;
}

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};

const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

const calculateDurationInDays = (start: string | null | undefined, end: string | null | undefined): string => {
    if (!start || !end) return 'N/A';
    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} day(s)`;
    } catch (e) {
        return 'N/A';
    }
};

export const CompletedJobReportModal: React.FC<CompletedJobReportModalProps> = ({ show, job, onClose, onMarkAsDelivered, onPrint }) => {
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);

    if (!show) return null;

    const firstDrawing = job.drawings?.[0];
    const lastDrawing = job.drawings?.[job.drawings.length - 1];

    const handleConfirmDelivery = () => {
        if (deliveryDate) {
            onMarkAsDelivered(job.id, deliveryDate);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-4xl mx-auto w-full my-8">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div>
                        <h3 className="text-2xl font-bold text-indigo-700">Job Report: {job.jobNumber}</h3>
                        <p className={`text-sm font-bold ${job.deliveredAt ? 'text-green-600' : 'text-blue-600'}`}>
                            {job.deliveredAt ? `Delivered on ${formatDateOnly(job.deliveredAt)}` : 'Completed, Awaiting Delivery'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon /></button>
                </div>
                
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                    {/* Main Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div><span className="font-semibold">Customer:</span> {job.customerName}</div>
                        <div><span className="font-semibold">Finish Date:</span> {formatDateOnly(job.finishDate)}</div>
                        <div className="md:col-span-2"><span className="font-semibold">Description:</span> {job.jobDescription}</div>
                        <div><span className="font-semibold">Job Added:</span> {formatDateOnly(job.addedDate)}</div>
                        <div><span className="font-semibold">Job Completed:</span> {formatDateOnly(job.completedAt)}</div>
                        <div className="md:col-span-2 font-bold text-indigo-800"><span className="font-semibold">Total Duration:</span> {calculateDurationInDays(job.addedDate, job.completedAt)}</div>
                    </div>

                    {/* Design Details */}
                    {job.designRequired && (
                        <div className="mt-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Design Phase</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 p-4 bg-blue-50 rounded-lg">
                                <div><span className="font-semibold">Designer:</span> {job.designerName || 'N/A'}</div>
                                <div><span className="font-semibold">Target Date:</span> {formatDateOnly(job.designTargetDate)}</div>
                                <div><span className="font-semibold">Started:</span> {formatDate(job.designerStartedAt)}</div>
                                <div><span className="font-semibold">Finished:</span> {formatDate(job.designerFinishedAt)}</div>
                                <div className="md:col-span-2 font-bold text-blue-800"><span className="font-semibold">Design Duration:</span> {calculateDurationInDays(job.designerStartedAt, job.designerFinishedAt)}</div>
                             </div>
                        </div>
                    )}

                     {/* Key Milestones */}
                     <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Key Milestones</h4>
                        <div className="text-sm text-gray-700 p-4 bg-green-50 rounded-lg space-y-2">
                           <p><span className="font-semibold">Sent to Planning:</span> {formatDate(firstDrawing?.designCompletedDate)}</p>
                           <p><span className="font-semibold">Final QC Approved:</span> {formatDate(lastDrawing?.finalQcApprovedAt)}</p>
                        </div>
                    </div>

                    {/* Drawings & Processes */}
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Drawings & Processes</h4>
                        <div className="space-y-3">
                            {job.drawings?.map(d => (
                                <div key={d.id} className="bg-gray-50 p-3 rounded-lg border">
                                    <p className="font-semibold">{d.name} (Qty: {d.quantity})</p>
                                    <ul className="list-disc list-inside pl-4 mt-2 text-xs space-y-1">
                                        {d.processes.sort((a,b) => a.sequence - b.sequence).map(p => (
                                            <li key={p.id}>
                                                {p.name} on {p.machine} - <span className="font-semibold text-green-700">Completed at {formatDate(p.completedAt)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                     {d.finalReport && (
                                        <div className="mt-3 pt-3 border-t">
                                            <h5 className="text-sm font-bold text-gray-700 mb-2">Final QC Report</h5>
                                            <div className="text-xs space-y-2 bg-white p-2 rounded border">
                                                <div className="grid grid-cols-2 gap-x-4">
                                                    <p><span className="font-semibold">Checked By:</span> {d.finalReport.checkedBy}</p>
                                                    <p><span className="font-semibold">Date:</span> {d.finalReport.reportDate} at {d.finalReport.reportTime}</p>
                                                </div>
                                                {d.finalReport.jobDescription && <p className="italic mt-1">Notes: {d.finalReport.jobDescription}</p>}
                                                
                                                <div className="mt-2 overflow-x-auto">
                                                    <table className="min-w-full mt-2 border text-xs">
                                                        <thead className="bg-gray-200">
                                                            <tr>
                                                                <th className="p-1 text-left font-semibold">Part</th>
                                                                <th className="p-1 text-left font-semibold">Dimension</th>
                                                                <th className="p-1 text-left font-semibold">Note</th>
                                                                <th className="p-1 text-center font-semibold">#1</th>
                                                                <th className="p-1 text-center font-semibold">#2</th>
                                                                <th className="p-1 text-center font-semibold">#3</th>
                                                                <th className="p-1 text-center font-semibold">#4</th>
                                                                <th className="p-1 text-center font-semibold">#5</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {d.finalReport.readings.map((reading, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="p-1">{reading.partNumber}</td>
                                                                    <td className="p-1">{reading.dimension}</td>
                                                                    <td className="p-1">{reading.note}</td>
                                                                    {reading.samples.map((sample, sIdx) => (
                                                                        <td key={sIdx} className="p-1 text-center">{sample || '-'}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t flex items-center justify-between">
                     <button 
                        onClick={() => onPrint(job)}
                        className="px-5 py-2 bg-gray-600 text-white rounded-md shadow-md hover:bg-gray-700 flex items-center gap-2">
                        <PrinterIcon /> Print to PDF
                    </button>
                    {!job.deliveredAt ? (
                        <div className="flex items-center justify-end gap-4">
                            <div>
                                <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                                <input
                                    type="date"
                                    id="deliveryDate"
                                    value={deliveryDate}
                                    onChange={e => setDeliveryDate(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                />
                            </div>
                            <button 
                                onClick={handleConfirmDelivery}
                                disabled={!deliveryDate}
                                className="px-5 py-2 mt-5 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 disabled:bg-gray-400">
                                Mark as Delivered
                            </button>
                        </div>
                    ) : ( <div></div> )}
                </div>
            </div>
        </div>
    );
};