
import React from 'react';
import type { Job } from '../types';

interface PrintLayoutProps {
    jobs: Job[];
    department: string;
}

export const PrintLayout = React.forwardRef<HTMLDivElement, PrintLayoutProps>(({ jobs, department }, ref) => {
    const today = new Date().toLocaleDateString();
    return (
        <div ref={ref} className="p-8 text-black">
            <h1 className="text-2xl font-bold mb-2">Rex Industries</h1>
            <h2 className="text-xl font-semibold mb-1">Work Order: {department}</h2>
            <p className="text-sm mb-6">Date: {today}</p>
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="border p-2 text-left bg-gray-200">Job Number</th>
                        <th className="border p-2 text-left bg-gray-200">Finish Date</th>
                    </tr>
                </thead>
                <tbody>
                    {jobs.map(job => (
                        <tr key={job.id}>
                            <td className="border p-2">{job.jobNumber}</td>
                            <td className="border p-2">{job.finishDate}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});