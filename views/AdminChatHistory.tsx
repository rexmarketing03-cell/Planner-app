
import React from 'react';

export const AdminChatHistory: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold mb-4 text-indigo-600">Chat History</h3>
            <div className="text-center py-10 text-gray-500">
                <p className="font-semibold text-lg">Chat Feature Disabled</p>
                <p>This feature requires a database connection, which is currently disconnected for development mode.</p>
            </div>
        </div>
    );
};