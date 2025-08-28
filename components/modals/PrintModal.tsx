
import React, { useState, useEffect } from 'react';
import type { Job } from '../../types';
import { PrinterIcon } from '../Icons';

interface PrintModalProps {
    show: boolean;
    onClose: () => void;
    jobs: Job[];
    department: string;
    onPrint: (jobsToPrint: Job[]) => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ show, onClose, jobs, department, onPrint }) => {
    const [selectedJobs, setSelectedJobs] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (show) {
            const initialSelection = jobs.reduce((acc, job) => {
                acc[job.id] = true;
                return acc;
            }, {} as { [key: string]: boolean });
            setSelectedJobs(initialSelection);
        }
    }, [jobs, show]);

    const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        const newSelection = jobs.reduce((acc, job) => {
            acc[job.id] = isChecked;
            return acc;
        }, {} as { [key: string]: boolean });
        setSelectedJobs(newSelection);
    };

    const handleToggleJob = (jobId: string) => {
        setSelectedJobs(prev => ({
            ...prev,
            [jobId]: !prev[jobId]
        }));
    };

    const handlePrintClick = () => {
        const jobsToPrint = jobs.filter(job => selectedJobs[job.id]);
        onPrint(jobsToPrint);
    };

    if (!show) return null;

    const allSelected = jobs.length > 0 && jobs.every(job => selectedJobs[job.id]);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg mx-auto w-full">
                <h3 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-3">Print Jobs for {department}</h3>
                <div className="mb-4 border-b pb-2">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={allSelected} onChange={handleToggleAll} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                        <span className="ml-2 font-semibold text-gray-700">Select All</span>
                    </label>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto mb-6">
                    {jobs.map(job => (
                        <div key={job.id}>
                            <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                <input type="checkbox" checked={!!selectedJobs[job.id]} onChange={() => handleToggleJob(job.id)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                <span className="ml-3 text-gray-800">{job.jobNumber}</span>
                            </label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button onClick={handlePrintClick} className="px-5 py-2 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 flex items-center gap-2">
                        <PrinterIcon /> Print Selected
                    </button>
                </div>
            </div>
        </div>
    );
};