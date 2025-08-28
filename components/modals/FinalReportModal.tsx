import React, { useState, useEffect } from 'react';
import type { Job, Drawing, FinalReport, FinalReportReading, OfficialStaff, Operator } from '../../types';
import { PlusIcon, TrashIcon } from '../Icons';

interface ReadingRow extends FinalReportReading {
    localId: string; // for React keys
}

interface FinalReportModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (jobId: string, drawingId: string, report: FinalReport) => void;
    job: Job | null;
    drawing: Drawing | null;
    currentUser: OfficialStaff | Operator | null;
    reportToEdit?: FinalReport | null;
}

export const FinalReportModal: React.FC<FinalReportModalProps> = ({ show, onClose, onSave, job, drawing, currentUser, reportToEdit }) => {
    const [reportDate, setReportDate] = useState('');
    const [reportTime, setReportTime] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [readings, setReadings] = useState<ReadingRow[]>([]);

    useEffect(() => {
        if (show && job && drawing) {
            if (reportToEdit) {
                // Edit mode
                setReportDate(reportToEdit.reportDate);
                setReportTime(reportToEdit.reportTime);
                setJobDescription(reportToEdit.jobDescription);
                setReadings(reportToEdit.readings.map(r => ({ ...r, localId: `row-${Date.now()}-${Math.random()}` })));
            } else {
                // Create mode
                const now = new Date();
                setReportDate(now.toISOString().split('T')[0]);
                setReportTime(now.toTimeString().split(' ')[0].substring(0, 5));
                setJobDescription('');
                setReadings([{ id: '', localId: `row-${Date.now()}`, partNumber: drawing.name, dimension: '', note: '', samples: ['', '', '', '', ''] }]);
            }
        }
    }, [show, job, drawing, reportToEdit]);

    if (!show || !job || !drawing || !currentUser) return null;

    const handleReadingChange = (localId: string, field: keyof ReadingRow, value: string, sampleIndex?: number) => {
        setReadings(prev => prev.map(row => {
            if (row.localId === localId) {
                if (field === 'samples' && sampleIndex !== undefined) {
                    const newSamples = [...row.samples] as [string, string, string, string, string];
                    newSamples[sampleIndex] = value;
                    return { ...row, samples: newSamples };
                }
                return { ...row, [field]: value };
            }
            return row;
        }));
    };
    
    const addReadingRow = () => {
        setReadings(prev => [...prev, { id: '', localId: `row-${Date.now()}`, partNumber: '', dimension: '', note: '', samples: ['', '', '', '', ''] }]);
    };

    const removeReadingRow = (localId: string) => {
        setReadings(prev => prev.filter(row => row.localId !== localId));
    };

    const handleSaveAndComplete = () => {
        // Simple validation
        if (readings.some(r => !r.partNumber.trim() || !r.dimension.trim())) {
            alert("Please fill in at least 'Part Number' and 'Dimension' for each reading row.");
            return;
        }

        const report: FinalReport = {
            checkedBy: currentUser.name,
            reportDate,
            reportTime,
            jobDescription: jobDescription.trim(),
            readings: readings.map(({ localId, ...rest}) => ({...rest, id: rest.id || `reading-${Date.now()}-${Math.random()}`})),
        };
        onSave(job.id, drawing.id, report);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-[60]">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-6xl mx-auto w-full my-8">
                <h3 className="text-2xl font-bold text-indigo-700 mb-4 border-b pb-3">{reportToEdit ? 'Edit Final Report' : 'Final Quality Control Report'}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <p><span className="font-semibold">Job Number:</span> {job.jobNumber}</p>
                    <p><span className="font-semibold">Customer:</span> {job.customerName}</p>
                    <p><span className="font-semibold">Drawing:</span> {drawing.name}</p>
                    <p><span className="font-semibold">Checked By:</span> {currentUser.name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <input type="time" value={reportTime} onChange={e => setReportTime(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-gray-700">Job Description/Notes</label>
                        <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={1} className="mt-1 w-full p-2 border rounded-md"></textarea>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[50vh] border rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-2 text-left">Part Number</th>
                                <th className="p-2 text-left">Dimension</th>
                                <th className="p-2 text-left">Note</th>
                                <th className="p-2 text-left" colSpan={5}>Sample Readings</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {readings.map(row => (
                                <tr key={row.localId}>
                                    <td className="p-1"><input type="text" value={row.partNumber} onChange={e => handleReadingChange(row.localId, 'partNumber', e.target.value)} className="w-full p-1 border rounded" /></td>
                                    <td className="p-1"><input type="text" value={row.dimension} onChange={e => handleReadingChange(row.localId, 'dimension', e.target.value)} className="w-full p-1 border rounded" /></td>
                                    <td className="p-1"><input type="text" value={row.note} onChange={e => handleReadingChange(row.localId, 'note', e.target.value)} className="w-full p-1 border rounded" /></td>
                                    {row.samples.map((sample, i) => (
                                        <td key={i} className="p-1"><input type="text" placeholder={`#${i+1}`} value={sample} onChange={e => handleReadingChange(row.localId, 'samples', e.target.value, i)} className="w-20 p-1 border rounded" /></td>
                                    ))}
                                    <td className="p-1 text-center">
                                        <button onClick={() => removeReadingRow(row.localId)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><TrashIcon className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button onClick={addReadingRow} className="mt-3 w-full p-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-md hover:bg-blue-200 flex items-center justify-center gap-1">
                    <PlusIcon /> Add Reading
                </button>

                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="px-5 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSaveAndComplete} className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        {reportToEdit ? 'Save Changes' : 'Save & Complete'}
                    </button>
                </div>
            </div>
        </div>
    );
};