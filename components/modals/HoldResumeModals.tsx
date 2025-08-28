
import React from 'react';

interface HoldModalProps {
    onClose: () => void;
    onConfirm: () => void;
    holdReason: string;
    setHoldReason: (reason: string) => void;
    show: boolean;
}

export const HoldModal: React.FC<HoldModalProps> = ({ onClose, onConfirm, holdReason, setHoldReason, show }) => {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[60]">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md mx-auto w-full">
                <h3 className="text-2xl font-bold text-yellow-700 mb-6 border-b pb-3">Hold Job</h3>
                <div className="mb-6">
                    <label htmlFor="holdReason" className="block text-sm font-medium text-gray-700 mb-1">Reason for Hold</label>
                    <textarea
                        id="holdReason"
                        value={holdReason}
                        onChange={(e) => setHoldReason(e.target.value)}
                        rows={3}
                        placeholder="Describe why this job is being put on hold..."
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm resize-y"
                    ></textarea>
                </div>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button onClick={onConfirm} className="px-5 py-2 bg-yellow-600 text-white rounded-md shadow-md hover:bg-yellow-700">Confirm Hold</button>
                </div>
            </div>
        </div>
    );
};

interface ResumeModalProps {
    onClose: () => void;
    onConfirm: () => void;
    newFinishDate: string;
    setNewFinishDate: (date: string) => void;
    show: boolean;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({ onClose, onConfirm, newFinishDate, setNewFinishDate, show }) => {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[60]">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md mx-auto w-full">
                <h3 className="text-2xl font-bold text-green-700 mb-6 border-b pb-3">Resume Job</h3>
                <div className="mb-6">
                    <label htmlFor="newFinishDate" className="block text-sm font-medium text-gray-700 mb-1">New Finish Date</label>
                    <input
                        type="date"
                        id="newFinishDate"
                        value={newFinishDate}
                        onChange={(e) => setNewFinishDate(e.target.value)}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                </div>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button onClick={onConfirm} className="px-5 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700">Confirm Resume</button>
                </div>
            </div>
        </div>
    );
};