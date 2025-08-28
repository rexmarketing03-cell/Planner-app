import React from 'react';
import type { Job, Drawing, ProductOrderItem } from '../../types';
import { XIcon } from '../Icons';

interface JobDetailModalProps {
    job: Job | null;
    onClose: () => void;
}

const getStatusColor = (status: ProductOrderItem['status']) => {
    switch (status) {
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'Ready for QC': return 'bg-blue-100 text-blue-800';
        case 'Awaiting Stock': return 'bg-yellow-100 text-yellow-800';
        case 'Pending Stock Check': return 'bg-gray-200 text-gray-800';
        default: return 'bg-gray-100 text-gray-700';
    }
};

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose }) => {
    if (!job) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl mx-auto w-full my-8">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-2xl font-bold text-indigo-700">{job.jobNumber}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon /></button>
                </div>
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p><span className="font-semibold">Customer:</span> {job.customerName}</p>
                    <p><span className="font-semibold">Description:</span> {job.jobDescription}</p>
                    <p><span className="font-semibold">Finish Date:</span> {job.finishDate}</p>
                    <p><span className="font-semibold">Priority:</span> <span className={`font-bold ${job.priority === 'Urgent' ? 'text-red-600' : 'text-green-600'}`}>{job.priority}</span></p>
                    {job.jobType === 'Product' && job.specialRequirement && (
                         <p><span className="font-semibold">Special Requirement:</span> {job.specialRequirement}</p>
                    )}
                </div>

                {job.jobType === 'Service' ? (
                    <>
                        <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Drawings</h4>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                            {job.drawings?.map(drawing => (
                                <div key={drawing.id} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-gray-800">{drawing.name} (Qty: {drawing.quantity})</p>
                                        {(drawing.reworkCount > 0 || drawing.isUnderRework) && (
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${drawing.isUnderRework ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                                {drawing.isUnderRework ? 'Reworking' : `Reworked (${drawing.reworkCount})`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span>Current: <span className="font-bold text-indigo-600">{drawing.currentDepartment}</span></span>
                                    </div>
                                    {drawing.finalQcApprovedAt && (
                                        <p className="text-xs text-green-700 font-semibold mt-1">QC Approved: {new Date(drawing.finalQcApprovedAt).toLocaleString()}</p>
                                    )}
                                    <div className="mt-2 pt-2 border-t">
                                        <h5 className="text-xs font-bold text-gray-600 mb-1">Process Log:</h5>
                                        <ul className="space-y-1 text-xs">
                                            {drawing.processes.sort((a, b) => a.sequence - b.sequence).map(process => (
                                                <li key={process.sequence} className="flex justify-between items-center">
                                                    <span>{process.sequence}. {process.name}</span>
                                                    {process.completedAt ? <span className="font-semibold text-green-600">{new Date(process.completedAt).toLocaleDateString()}</span> : <span className="font-semibold text-yellow-600">Pending</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {drawing.reworkHistory && drawing.reworkHistory.length > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                            <h5 className="text-xs font-bold text-gray-600 mb-1">Rework History:</h5>
                                            <ul className="space-y-2 text-xs">
                                                {drawing.reworkHistory.map((item, index) => (
                                                    <li key={index} className="bg-yellow-100 p-2 rounded-md">
                                                        <p><span className="font-semibold">Rework #{item.reworkCount}</span> on {new Date(item.timestamp).toLocaleString()}</p>
                                                        <p>Reason: {item.reason}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(job.drawings?.length || 0) === 0 && <p className="text-gray-500 text-center py-4">No drawings for this job.</p>}
                        </div>
                    </>
                ) : (
                    <>
                        <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Products</h4>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                             {job.products?.map(product => (
                                <div key={product.productId} className="bg-gray-50 p-3 rounded-lg border">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-gray-800">{product.productName}</p>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(product.status)}`}>
                                            {product.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        <p>Quantity: {product.quantity}</p>
                                        <p>Motor: {product.motorRequirement || 'N/A'}</p>
                                    </div>
                                    {product.status === 'Awaiting Stock' && product.availabilityDate && (
                                        <p className="text-xs text-yellow-700 font-semibold mt-1">
                                            Available on: {new Date(product.availabilityDate).toLocaleDateString()}
                                        </p>
                                    )}
                                    {product.qcApprovedAt && (
                                        <p className="text-xs text-green-700 font-semibold mt-1">
                                            QC Approved: {new Date(product.qcApprovedAt).toLocaleString()}
                                        </p>
                                    )}
                                    {product.qcComment && (
                                        <p className="text-xs text-gray-500 mt-1 italic">Notes: {product.qcComment}</p>
                                    )}
                                </div>
                             ))}
                             {(job.products?.length || 0) === 0 && <p className="text-gray-500 text-center py-4">No products for this job.</p>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};