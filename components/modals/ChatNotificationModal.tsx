import React from 'react';
import { BellIcon } from '../Icons';

interface ChatNotificationModalProps {
    show: boolean;
    operatorName: string;
    unreadCount: number;
    onDismiss: () => void;
    onViewMessages: () => void;
}

export const ChatNotificationModal: React.FC<ChatNotificationModalProps> = ({ show, operatorName, unreadCount, onDismiss, onViewMessages }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                    <BellIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Welcome, {operatorName}!</h3>
                <p className="text-gray-600 my-2">
                    You have <span className="font-bold text-indigo-600">{unreadCount}</span> unread message{unreadCount > 1 ? 's' : ''}.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                    <button
                        onClick={onViewMessages}
                        className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700"
                    >
                        View Messages
                    </button>
                    <button
                        onClick={onDismiss}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};
