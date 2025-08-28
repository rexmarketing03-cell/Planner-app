
import React from 'react';
import type { TimelineEvent } from '../reports/JobHistoryReport';
import { XIcon } from '../Icons';

interface JobHistoryDetailModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    events: TimelineEvent[];
}

const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
};

export const JobHistoryDetailModal: React.FC<JobHistoryDetailModalProps> = ({ show, onClose, title, events }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-[70]">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl mx-auto w-full my-8">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold text-indigo-700">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><XIcon /></button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                    <div className="relative border-l-2 border-gray-200 pl-8 space-y-6">
                        {events.map((event, index) => (
                            <div key={index} className="relative">
                                <div className={`absolute -left-[3.2rem] top-1 h-8 w-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center ${event.color}`}>
                                    <event.Icon />
                                </div>
                                <p className="text-xs text-gray-500 font-semibold">{formatDate(event.timestamp)}</p>
                                <h4 className="font-bold text-gray-800">{event.title}</h4>
                                <div className="text-sm text-gray-600">{event.details}</div>
                            </div>
                        ))}
                         {events.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No events recorded for this phase.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
