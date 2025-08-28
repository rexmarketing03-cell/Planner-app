import React, { useState, useEffect } from 'react';
import type { Job, ProductOrderItem } from '../../types';
import { XIcon, CheckIcon } from '../Icons';

interface ProductJobModalProps {
    show: boolean;
    onClose: () => void;
    job: Job;
    onUpdate: (jobId: string, data: Partial<Job>) => void;
    onRequestDateChange: (productId: string, availabilityDate: string) => void;
}

const ProductItem: React.FC<{
    item: ProductOrderItem;
    jobFinishDate: string;
    onItemUpdate: (productId: string, updates: Partial<ProductOrderItem>) => void;
    onRequestDateChange: (productId: string, availabilityDate: string) => void;
}> = ({ item, jobFinishDate, onItemUpdate, onRequestDateChange }) => {
    const [stockCheckStep, setStockCheckStep] = useState<'initial' | 'date_entry'>('initial');
    const [availabilityDate, setAvailabilityDate] = useState(item.availabilityDate || '');
    const [qcComment, setQcComment] = useState(item.qcComment || '');

    const handleStockAvailable = () => {
        onItemUpdate(item.productId, { status: 'Ready for QC', readyForQcAt: new Date().toISOString() });
    };

    const handleConfirmOutOfStock = () => {
        if (!availabilityDate) {
            alert("Please select an availability date.");
            return;
        }

        if (new Date(availabilityDate) > new Date(jobFinishDate)) {
            // This will trigger the sales request flow in App.tsx
            onRequestDateChange(item.productId, availabilityDate);
        } else {
            // No delay, just update the item status directly
            onItemUpdate(item.productId, { status: 'Awaiting Stock', availabilityDate });
        }
    };

    const handleMarkAsReady = () => {
        onItemUpdate(item.productId, { status: 'Ready for QC', readyForQcAt: new Date().toISOString() });
    };

    const handleMarkAsDelivered = () => {
        onItemUpdate(item.productId, { status: 'Completed', qcApprovedAt: new Date().toISOString(), qcComment });
    };

    const getDaysRemaining = () => {
        if (!item.availabilityDate) return null;
        const diffDays = Math.ceil((new Date(item.availabilityDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
        return diffDays;
    };
    const daysRemaining = getDaysRemaining();

    return (
        <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-bold text-gray-800">{item.productName}</h4>
            <div className="text-sm text-gray-600">
                <span>Qty: {item.quantity}</span> | <span>Motor: {item.motorRequirement || 'N/A'}</span>
            </div>

            <div className="mt-3">
                {item.status === 'Pending Stock Check' && (
                     <div className="p-2 bg-white rounded-lg">
                        {stockCheckStep === 'initial' ? (
                            <div className="flex space-x-2">
                                <button onClick={handleStockAvailable} className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">In Stock</button>
                                <button onClick={() => setStockCheckStep('date_entry')} className="flex-1 px-3 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700">Out of Stock</button>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Expected Date:</label>
                                <div className="flex items-center space-x-2">
                                    <input type="date" value={availabilityDate} onChange={e => setAvailabilityDate(e.target.value)} className="flex-grow p-2 text-sm border rounded-md" />
                                    <button onClick={handleConfirmOutOfStock} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Confirm</button>
                                </div>
                                <button onClick={() => setStockCheckStep('initial')} className="text-xs text-gray-600 hover:underline mt-2"> &larr; Back</button>
                            </div>
                        )}
                    </div>
                )}

                {item.status === 'Awaiting Stock' && (
                    <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-300 text-sm">
                        <p className="text-yellow-800">Awaiting stock. Expected: <span className="font-bold">{item.availabilityDate}</span></p>
                        {daysRemaining !== null && (
                            <p className={`font-bold mt-1 ${daysRemaining <= 3 ? 'text-red-600' : 'text-yellow-800'}`}>
                                {daysRemaining >= 0 ? `${daysRemaining} days left` : 'Overdue'}
                            </p>
                        )}
                        <button onClick={handleMarkAsReady} className="mt-2 w-full px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700">Mark as Ready</button>
                    </div>
                )}
                
                {item.status === 'Ready for QC' && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-semibold text-blue-800 text-sm mb-2">Ready for Collection</h5>
                        <textarea value={qcComment} onChange={e => setQcComment(e.target.value)} rows={2} placeholder="Delivery notes..." className="block w-full text-xs p-1 border rounded-md"></textarea>
                        <button onClick={handleMarkAsDelivered} className="mt-2 w-full px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 flex items-center justify-center gap-1">
                            <CheckIcon className="w-4 h-4" /> Mark as Delivered
                        </button>
                    </div>
                )}

                {item.status === 'Completed' && (
                     <div className="p-3 bg-green-100 rounded-lg border border-green-300 text-sm">
                        <p className="font-semibold text-green-800 flex items-center gap-2"><CheckIcon className="w-5 h-5"/> Delivered</p>
                        {item.qcComment && <p className="text-xs text-gray-600 mt-1">Notes: {item.qcComment}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};


export const ProductJobModal: React.FC<ProductJobModalProps> = ({ show, onClose, job, onUpdate, onRequestDateChange }) => {
    
    useEffect(() => {
        // If the job is loaded and all its products are complete, close the modal automatically.
        if (show && job && job.products && job.products.every(p => p.status === 'Completed')) {
            onClose();
        }
    }, [job, show, onClose]); // This effect runs whenever the job data changes.

    if (!show) return null;
    
    const handleItemUpdate = (productId: string, updates: Partial<ProductOrderItem>) => {
        const newProducts = job.products?.map(p => 
            p.productId === productId ? { ...p, ...updates } : p
        ) || [];
        onUpdate(job.id, { products: newProducts });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div>
                        <h3 className="text-2xl font-bold text-indigo-700">{job.jobNumber}</h3>
                        <p className="text-sm text-gray-500">Managing Products</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-gray-100"><XIcon /></button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {job.products?.map(item => (
                        <ProductItem
                            key={item.productId}
                            item={item}
                            jobFinishDate={job.finishDate}
                            onItemUpdate={handleItemUpdate}
                            onRequestDateChange={onRequestDateChange}
                        />
                    ))}
                </div>
                 <div className="mt-6 pt-4 border-t flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Close</button>
                </div>
            </div>
        </div>
    );
};