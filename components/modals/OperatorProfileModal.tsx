
import React, { useState, useMemo } from 'react';
import type { Operator, Job, Process, ChatMessage, OfficialStaff } from '../../types';
import { XIcon, MessageSquareIcon } from '../Icons';
import { ChangePasswordModal } from './ChangePasswordModal';

type ProcessWithJobInfo = Process & {
    jobId: string;
    drawingId: string;
    jobNumber: string;
    drawingName: string;
};

interface OperatorProfileModalProps {
    show: boolean;
    onClose: () => void;
    operator: Operator | null;
    jobs: Job[];
    messages: ChatMessage[];
    openChat: () => void;
    setCurrentUser: (user: Operator | OfficialStaff | null) => void;
    updateOperator: (operatorId: string, data: Partial<Operator>) => void;
}

const calculateNetDuration = (process: Process): string => {
    if (!process.startedAt || !process.completedAt) return 'N/A';
    let holdDuration = 0;
    (process.operatorHoldHistory || []).forEach(h => {
        if (h.resumeAt) holdDuration += new Date(h.resumeAt).getTime() - new Date(h.holdAt).getTime();
    });
    const netMs = (new Date(process.completedAt).getTime() - new Date(process.startedAt).getTime()) - holdDuration;
    if (netMs < 0) return '0h 0m';
    const hours = Math.floor(netMs / 3600000);
    const minutes = Math.floor((netMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
};

const KpiCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-indigo-50 p-3 rounded-lg text-center">
        <p className="text-sm text-indigo-800 font-semibold">{title}</p>
        <p className="text-2xl font-bold text-indigo-600">{value}</p>
    </div>
);

export const OperatorProfileModal: React.FC<OperatorProfileModalProps> = ({ show, onClose, operator, jobs, messages, openChat, setCurrentUser, updateOperator }) => {
    const [activeTab, setActiveTab] = useState<'history' | 'messages'>('history');
    const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'all'>('month');
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    const unreadMessages = useMemo(() => {
        if (!operator) return [];
        return messages.filter(m => m.recipientId === operator.id && !m.isRead)
                       .sort((a,b) => b.timestamp.localeCompare(a.timestamp));
    }, [operator, messages]);
    
    const operatorData = useMemo(() => {
        if (!operator) return { completedTasks: [], totalReworks: 0 };

        const startDate = new Date();
        if (dateFilter === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (dateFilter === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const completedTasks: ProcessWithJobInfo[] = [];
        let totalReworks = 0;

        jobs.forEach(job => {
            job.drawings?.forEach(drawing => {
                // Check for reworks associated with this operator
                drawing.reworkHistory?.forEach(rework => {
                    const processBeforeRework = drawing.processes.find(p => p.name === rework.processName);
                    if (processBeforeRework?.operatorId === operator.id) {
                         const reworkDate = new Date(rework.timestamp);
                         if (dateFilter === 'all' || reworkDate >= startDate) {
                            totalReworks++;
                         }
                    }
                });

                drawing.processes.forEach(process => {
                    if (process.operatorId === operator.id && process.completed && process.completedAt) {
                         const completedDate = new Date(process.completedAt);
                         if (dateFilter === 'all' || completedDate >= startDate) {
                            completedTasks.push({
                                ...process,
                                jobId: job.id,
                                drawingId: drawing.id,
                                jobNumber: job.jobNumber,
                                drawingName: drawing.name,
                            });
                         }
                    }
                });
            });
        });

        completedTasks.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
        return { completedTasks, totalReworks };
    }, [operator, jobs, dateFilter]);
    
    const handleOpenChat = () => {
        setCurrentUser(operator);
        openChat();
        onClose();
    };


    if (!show || !operator) return null;

    const renderHistory = () => (
        <div className="p-4 space-y-4">
            <div className="flex justify-center bg-gray-100 rounded-lg p-1">
                <button onClick={() => setDateFilter('week')} className={`px-3 py-1 text-sm font-semibold rounded-md ${dateFilter === 'week' ? 'bg-white shadow' : ''}`}>This Week</button>
                <button onClick={() => setDateFilter('month')} className={`px-3 py-1 text-sm font-semibold rounded-md ${dateFilter === 'month' ? 'bg-white shadow' : ''}`}>This Month</button>
                <button onClick={() => setDateFilter('all')} className={`px-3 py-1 text-sm font-semibold rounded-md ${dateFilter === 'all' ? 'bg-white shadow' : ''}`}>All Time</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <KpiCard title="Tasks Completed" value={operatorData.completedTasks.length} />
                <KpiCard title="Reworks" value={operatorData.totalReworks} />
            </div>
            <div className="max-h-80 overflow-y-auto border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0"><tr>
                        <th className="px-3 py-2 text-left">Job / Task</th>
                        <th className="px-3 py-2 text-left">Completed On</th>
                        <th className="px-3 py-2 text-left">Net Duration</th>
                    </tr></thead>
                    <tbody className="divide-y">
                        {operatorData.completedTasks.map(task => (
                            <tr key={task.id}>
                                <td className="px-3 py-2">
                                    <div className="font-bold">{task.jobNumber}</div>
                                    <div className="text-xs text-gray-500">{task.drawingName} - {task.name}</div>
                                </td>
                                <td className="px-3 py-2">{new Date(task.completedAt!).toLocaleDateString()}</td>
                                <td className="px-3 py-2 font-semibold">{calculateNetDuration(task)}</td>
                            </tr>
                        ))}
                        {operatorData.completedTasks.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-gray-500">No completed tasks in this period.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderMessages = () => (
        <div className="p-4 space-y-3">
             <button onClick={handleOpenChat} className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                <MessageSquareIcon /> Open Full Chat
            </button>
            <div className="max-h-[26rem] overflow-y-auto space-y-3">
                {unreadMessages.length > 0 ? (
                    unreadMessages.map(msg => (
                        <div key={msg.id} className="bg-gray-100 p-3 rounded-lg border">
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                                <span className="font-semibold">{msg.senderName}</span>
                                <span>{new Date(msg.timestamp).toLocaleString()}</span>
                            </div>
                            <p>{msg.text}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-8">No unread messages.</p>
                )}
            </div>
        </div>
    );

    return (
        <>
            <ChangePasswordModal
                show={showChangePasswordModal}
                onClose={() => setShowChangePasswordModal(false)}
                operator={operator}
                updateOperator={updateOperator}
            />
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-2 rounded-lg shadow-xl w-full max-w-2xl">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-xl font-bold text-indigo-700">Profile: {operator.name}</h3>
                        <div className="flex items-center gap-2">
                             <button
                                onClick={() => setShowChangePasswordModal(true)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-semibold"
                            >
                                Change PIN
                            </button>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon /></button>
                        </div>
                    </div>
                    
                    <div className="flex border-b">
                        <button onClick={() => setActiveTab('history')} className={`flex-1 p-3 font-semibold relative ${activeTab === 'history' ? 'text-indigo-600' : 'text-gray-500'}`}>
                            Work History
                            {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
                        </button>
                        <button onClick={() => setActiveTab('messages')} className={`flex-1 p-3 font-semibold relative flex items-center justify-center gap-2 ${activeTab === 'messages' ? 'text-indigo-600' : 'text-gray-500'}`}>
                            Messages
                            {unreadMessages.length > 0 && <span className="h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadMessages.length}</span>}
                            {activeTab === 'messages' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
                        </button>
                    </div>
                    
                    <div>
                        {activeTab === 'history' ? renderHistory() : renderMessages()}
                    </div>

                </div>
            </div>
        </>
    );
};
