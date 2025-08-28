
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ChatMessage, OfficialStaff, Operator } from '../../types';
import { XIcon, LogOutIcon, SendToPlanningIcon } from '../Icons';

type User = OfficialStaff | Operator;

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    allUsers: User[];
    messages: ChatMessage[];
    onSendMessage: (recipient: User, text: string) => Promise<void>;
    onMarkAsRead: (participantId: string) => Promise<void>;
}

const UserSelection: React.FC<{ allUsers: User[], onSelect: (user: User) => void }> = ({ allUsers, onSelect }) => {
    const operators = allUsers.filter((u): u is Operator => 'department' in u);
    const staff = allUsers.filter((u): u is OfficialStaff => 'position' in u);

    return (
        <div className="p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold text-center mb-4">Who are you?</h2>
            <div className="overflow-y-auto flex-grow">
                <h3 className="font-semibold text-gray-600 mt-4 mb-2">Official Staff</h3>
                <div className="space-y-2">
                    {staff.map(user => (
                        <button key={user.id} onClick={() => onSelect(user)} className="w-full text-left p-2 rounded-md hover:bg-indigo-100">
                            {user.name} <span className="text-sm text-gray-500">- {user.position}</span>
                        </button>
                    ))}
                </div>
                <h3 className="font-semibold text-gray-600 mt-4 mb-2">Operators</h3>
                <div className="space-y-2">
                    {operators.map(user => (
                        <button key={user.id} onClick={() => onSelect(user)} className="w-full text-left p-2 rounded-md hover:bg-indigo-100">
                            {user.name} <span className="text-sm text-gray-500">- {user.department}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}


export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, currentUser, setCurrentUser, allUsers, messages, onSendMessage, onMarkAsRead }) => {
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [view, setView] = useState<'conversations' | 'newMessage'>('conversations');
    const [newMessageText, setNewMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversations = useMemo(() => {
        if (!currentUser) return [];
        const threads: { [key: string]: { otherUser: User, lastMessage: ChatMessage, unreadCount: number } } = {};
        
        messages.forEach(msg => {
            const otherUserId = msg.senderId === currentUser.id ? msg.recipientId : msg.senderId;
            if (!threads[otherUserId] || threads[otherUserId].lastMessage.timestamp < msg.timestamp) {
                const otherUser = allUsers.find(u => u.id === otherUserId);
                if (otherUser) {
                    threads[otherUserId] = {
                        otherUser,
                        lastMessage: msg,
                        unreadCount: 0
                    };
                }
            }
        });

        Object.keys(threads).forEach(otherUserId => {
            threads[otherUserId].unreadCount = messages.filter(m => m.senderId === otherUserId && m.recipientId === currentUser.id && !m.isRead).length;
        });

        return Object.values(threads).sort((a,b) => b.lastMessage.timestamp.localeCompare(a.lastMessage.timestamp));

    }, [messages, currentUser, allUsers]);

    const activeConversationMessages = useMemo(() => {
        if (!activeThreadId || !currentUser) return [];
        return messages.filter(m => m.participants.includes(activeThreadId) && m.participants.includes(currentUser.id))
                       .sort((a,b) => a.timestamp.localeCompare(b.timestamp));
    }, [messages, activeThreadId, currentUser]);
    
    const otherUserInActiveThread = useMemo(() => {
        if (!activeThreadId) return null;
        return allUsers.find(u => u.id === activeThreadId);
    }, [activeThreadId, allUsers]);

    useEffect(() => {
        if (activeThreadId) {
            onMarkAsRead(activeThreadId);
        }
    }, [activeThreadId, messages]);

     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeConversationMessages]);


    const handleSelectConversation = (otherUserId: string) => {
        setActiveThreadId(otherUserId);
        setView('conversations');
    }

    const handleSendMessage = () => {
        if (!newMessageText.trim() || !otherUserInActiveThread) return;
        onSendMessage(otherUserInActiveThread, newMessageText);
        setNewMessageText('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                {!currentUser ? (
                    <div className="h-full relative">
                         <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 p-1 rounded-full"><XIcon/></button>
                        <UserSelection allUsers={allUsers} onSelect={setCurrentUser} />
                    </div>
                ) : (
                    <>
                        <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-xl">{currentUser.name}</span>
                                <button onClick={() => setCurrentUser(null)} className="flex items-center gap-1 text-sm text-red-600 hover:underline">
                                    <LogOutIcon/> Logout
                                </button>
                            </div>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full"><XIcon/></button>
                        </header>
                        <div className="flex flex-grow overflow-hidden">
                            {/* Left Panel: Conversations or New Message List */}
                            <aside className="w-1/3 border-r flex flex-col">
                                <div className="p-2 border-b">
                                     <button onClick={() => setView('newMessage')} className="w-full p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                        New Message
                                    </button>
                                </div>
                                <div className="overflow-y-auto flex-grow">
                                    {view === 'conversations' ? (
                                        <ul>
                                            {conversations.map(conv => (
                                                <li key={conv.otherUser.id} onClick={() => handleSelectConversation(conv.otherUser.id)} className={`p-3 cursor-pointer border-l-4 ${activeThreadId === conv.otherUser.id ? 'bg-indigo-50 border-indigo-500' : 'border-transparent hover:bg-gray-50'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold">{conv.otherUser.name}</p>
                                                        {conv.unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{conv.unreadCount}</span>}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage.text}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <ul>
                                            {allUsers.filter(u => u.id !== currentUser.id).map(user => (
                                                <li key={user.id} onClick={() => handleSelectConversation(user.id)} className="p-3 cursor-pointer hover:bg-gray-50">
                                                    <p className="font-semibold">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{'department' in user ? user.department : ('position' in user ? user.position : '')}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </aside>

                            {/* Right Panel: Message View */}
                            <main className="w-2/3 flex flex-col">
                                {activeThreadId && otherUserInActiveThread ? (
                                     <>
                                        <div className="p-4 border-b flex-shrink-0">
                                            <h3 className="font-bold text-lg">{otherUserInActiveThread.name}</h3>
                                        </div>
                                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                                            {activeConversationMessages.map(msg => (
                                                <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                                        <p>{msg.text}</p>
                                                        <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-indigo-200' : 'text-gray-500'}`}>{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                        <div className="p-4 border-t flex-shrink-0">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text"
                                                    value={newMessageText}
                                                    onChange={e => setNewMessageText(e.target.value)}
                                                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                                    placeholder="Type a message..."
                                                    className="w-full p-2 border rounded-full px-4"
                                                />
                                                <button onClick={handleSendMessage} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700">
                                                    <SendToPlanningIcon/>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <p>Select a conversation or start a new message.</p>
                                    </div>
                                )}
                            </main>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
