import React from 'react';
import type { NotificationItem } from '../../types';

interface NotificationsModalProps {
    show: boolean;
    onClose: () => void;
    items: NotificationItem[];
    onItemClick: (item: NotificationItem) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ show, onClose, items, onItemClick }) => {
    if (!show) return null;

    return (
        <div className="absolute top-16 right-6 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Pending Quality Checks</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {items.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                        {items.map((item, index) => (
                            <li key={index} onClick={() => onItemClick(item)} className="p-4 hover:bg-gray-50 cursor-pointer">
                                <p className="font-bold text-indigo-700">{item.jobNumber}</p>
                                <p className="text-sm text-gray-500 font-medium">{item.customerName}</p>
                                <p className="text-sm text-gray-700 mt-1">{item.title}</p>
                                <p className="text-sm text-gray-500">{item.subtitle} in <span className="font-semibold">{item.department}</span></p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-4 text-gray-500">No pending quality checks.</p>
                )}
            </div>
            <div className="p-2 border-t bg-gray-50 text-right">
                <button onClick={onClose} className="text-sm text-indigo-600 hover:underline">Close</button>
            </div>
        </div>
    );
};