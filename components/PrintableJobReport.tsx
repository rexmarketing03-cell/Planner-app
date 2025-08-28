import React from 'react';
import type { Job } from '../types';

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    // Use toLocaleDateString for a more user-friendly date format
    return new Date(dateString).toLocaleDateString();
};

const calculateDurationInDays = (start: string | null | undefined, end: string | null | undefined): string => {
    if (!start || !end) return 'N/A';
    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        // Add 1 to be inclusive, as a job started and finished on the same day is 1 day.
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${diffDays} day(s)`;
    } catch (e) {
        return 'N/A';
    }
};

export const PrintableJobReport: React.FC<{ job: Job }> = ({ job }) => {
    const firstDrawing = job.drawings?.[0];
    const lastDrawing = job.drawings?.[job.drawings.length - 1];

    return (
        <div className="p-8 text-black bg-white font-sans text-sm">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 pb-4 border-black">
                <h1 className="text-4xl font-bold">Rex Industries</h1>
                <div className="text-right">
                    <h2 className="text-2xl font-semibold">Job Report</h2>
                    <p className="text-lg">{job.jobNumber}</p>
                </div>
            </div>

            {/* Summary */}
            <div className="my-6 p-4 border border-gray-300 rounded-lg bg-gray-50 page-break-inside-avoid">
                 <h3 className="text-xl font-bold mb-3">Job Summary</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <p><span className="font-semibold">Customer:</span> {job.customerName}</p>
                    <p><span className="font-semibold">Added Date:</span> {formatDate(job.addedDate)}</p>
                    <p><span className="font-semibold">Target Finish Date:</span> {formatDate(job.finishDate)}</p>
                    <p><span className="font-semibold">Completed Date:</span> {formatDate(job.completedAt)}</p>
                    <p className="col-span-2"><span className="font-semibold">Description:</span> {job.jobDescription}</p>
                    <p className="col-span-2 font-bold text-base"><span className="font-semibold">Total Duration:</span> {calculateDurationInDays(job.addedDate, job.completedAt)}</p>
                </div>
            </div>


            {/* Phases */}
            <div className="grid grid-cols-2 gap-6">
                {job.designRequired && (
                    <div className="p-4 border border-gray-300 rounded-lg bg-blue-50 page-break-inside-avoid">
                        <h3 className="text-xl font-bold mb-3">Design Phase</h3>
                        <p><span className="font-semibold">Designer:</span> {job.designerName || 'N/A'}</p>
                        <p><span className="font-semibold">Started:</span> {formatDate(job.designerStartedAt)}</p>
                        <p><span className="font-semibold">Finished:</span> {formatDate(job.designerFinishedAt)}</p>
                        <p className="font-bold"><span className="font-semibold">Duration:</span> {calculateDurationInDays(job.designerStartedAt, job.designerFinishedAt)}</p>
                    </div>
                )}
                 {job.programmingRequired && (
                    <div className="p-4 border border-gray-300 rounded-lg bg-purple-50 page-break-inside-avoid">
                        <h3 className="text-xl font-bold mb-3">Programming Phase</h3>
                        <p><span className="font-semibold">Programmer:</span> {job.programmerName || 'N/A'}</p>
                        <p><span className="font-semibold">Started:</span> {formatDate(job.programmerStartedAt)}</p>
                        <p><span className="font-semibold">Finished:</span> {formatDate(job.programmerFinishedAt)}</p>
                        <p className="font-bold"><span className="font-semibold">Duration:</span> {calculateDurationInDays(job.programmerStartedAt, job.programmerFinishedAt)}</p>
                    </div>
                )}
            </div>
            
            {/* Drawing Loop */}
            {job.drawings?.map(drawing => (
                <div key={drawing.id} className="mt-8 pt-6 border-t-2 border-gray-400 page-break-inside-avoid">
                    <h3 className="text-2xl font-bold text-indigo-700 mb-2">Drawing: {drawing.name} (Qty: {drawing.quantity})</h3>
                    
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold mb-2">Process Log</h4>
                        <table className="min-w-full border text-xs">
                             <thead className="bg-gray-200">
                                <tr>
                                    <th className="p-2 text-left font-semibold">Seq.</th>
                                    <th className="p-2 text-left font-semibold">Process</th>
                                    <th className="p-2 text-left font-semibold">Machine</th>
                                    <th className="p-2 text-left font-semibold">Completed On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {drawing.processes.sort((a, b) => a.sequence - b.sequence).map(p => (
                                    <tr key={p.id}>
                                        <td className="p-2">{p.sequence}</td>
                                        <td className="p-2">{p.name}</td>
                                        <td className="p-2">{p.machine}</td>
                                        <td className="p-2">{formatDate(p.completedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {drawing.reworkHistory && drawing.reworkHistory.length > 0 && (
                        <div className="mb-4 page-break-inside-avoid">
                            <h4 className="text-lg font-semibold mb-2">Rework History</h4>
                             <table className="min-w-full border text-xs">
                             <thead className="bg-yellow-100">
                                <tr>
                                    <th className="p-2 text-left font-semibold">Date</th>
                                    <th className="p-2 text-left font-semibold">Process</th>
                                    <th className="p-2 text-left font-semibold">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {drawing.reworkHistory.map((r, i) => (
                                    <tr key={i}>
                                        <td className="p-2">{formatDate(r.timestamp)}</td>
                                        <td className="p-2">{r.processName}</td>
                                        <td className="p-2">{r.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}

                    {drawing.finalReport && (
                        <div className="mt-6 page-break-inside-avoid">
                            <h4 className="text-lg font-bold bg-gray-200 p-2 rounded-t-md">Final QC Report</h4>
                            <div className="border border-t-0 p-3 rounded-b-md">
                                <div className="grid grid-cols-2 gap-x-4 mb-3">
                                    <p><span className="font-semibold">Checked By:</span> {drawing.finalReport.checkedBy}</p>
                                    <p><span className="font-semibold">Date & Time:</span> {drawing.finalReport.reportDate} at {drawing.finalReport.reportTime}</p>
                                </div>
                                {drawing.finalReport.jobDescription && <p className="italic text-xs mb-3">Notes: {drawing.finalReport.jobDescription}</p>}
                                
                                <table className="min-w-full border text-xs">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-1 text-left font-semibold border">Part #</th>
                                            <th className="p-1 text-left font-semibold border">Dimension</th>
                                            <th className="p-1 text-left font-semibold border">Note</th>
                                            <th className="p-1 text-center font-semibold border">#1</th>
                                            <th className="p-1 text-center font-semibold border">#2</th>
                                            <th className="p-1 text-center font-semibold border">#3</th>
                                            <th className="p-1 text-center font-semibold border">#4</th>
                                            <th className="p-1 text-center font-semibold border">#5</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {drawing.finalReport.readings.map((reading, idx) => (
                                            <tr key={idx}>
                                                <td className="p-1 border">{reading.partNumber}</td>
                                                <td className="p-1 border">{reading.dimension}</td>
                                                <td className="p-1 border">{reading.note}</td>
                                                {reading.samples.map((sample, sIdx) => (
                                                    <td key={sIdx} className="p-1 text-center border">{sample || '-'}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};