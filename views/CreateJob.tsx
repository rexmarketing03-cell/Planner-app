import React, { useState, useMemo } from 'react';
import type { Job, Product, ProductOrderItem, OfficialStaff, Operator } from '../types';
import { PlusIcon, TrashIcon, SparklesIcon, PlayIcon, ChevronDownIcon, ChevronUpIcon } from '../components/Icons';
import { GoogleGenAI } from "@google/genai";
import { CreateJobHoldModal } from '../components/modals/CreateJobHoldModal';
import { API_KEY } from '../config';

interface CreateJobProps {
    currentUser: OfficialStaff | Operator | null;
    userId: string | null;
    jobs: Job[];
    products: Product[];
    createJob: (jobData: Omit<Job, 'id'>) => void;
    showModal: (message: string) => void;
    salesRequestCount: number;
    onOpenNotifications: () => void;
    onProceedJob: (jobId: string) => void;
}

interface NewDrawing {
    id: string;
    name: string;
    quantity: number;
}

// Temporary type for the order list before job creation
interface TempProductOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    motorRequirement: 'Single Phase' | '3 Phase' | '';
}

export const CreateJob: React.FC<CreateJobProps> = ({ currentUser, userId, jobs, products, createJob, showModal, salesRequestCount, onOpenNotifications, onProceedJob }) => {
    // Common state
    const [jobType, setJobType] = useState<'Service' | 'Product'>('Service');
    const [jobNumber, setJobNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [finishDate, setFinishDate] = useState('');
    const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Normal');

    // Service state
    const [jobDescription, setJobDescription] = useState('');
    const [designRequired, setDesignRequired] = useState(false);
    const [drawings, setDrawings] = useState<NewDrawing[]>([]);

    // Product state for multi-product orders
    const [productOrderList, setProductOrderList] = useState<TempProductOrderItem[]>([]);
    const [currentProductId, setCurrentProductId] = useState('');
    const [currentQuantity, setCurrentQuantity] = useState(1);
    const [currentMotorRequirement, setCurrentMotorRequirement] = useState<'Single Phase' | '3 Phase' | ''>('');
    const [specialRequirement, setSpecialRequirement] = useState('');
    
    // AI State
    const [isSuggesting, setIsSuggesting] = useState(false);
    
    // Hold state
    const [showCreateHoldModal, setShowCreateHoldModal] = useState(false);
    const [expandedHeldJobId, setExpandedHeldJobId] = useState<string | null>(null);

    const heldJobs = useMemo(() => jobs.filter(j => j.isHeldBySales), [jobs]);

    const handleSuggestJobNumber = async () => {
        if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
            showModal("Please add your Gemini API Key to the config.ts file to use this feature.");
            return;
        }
        if (!customerName.trim() && !jobDescription.trim()) {
            showModal("Please enter a customer name or description to get a suggestion.");
            return;
        }
        setIsSuggesting(true);
        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });

            const existingJobNumbers = jobs.map(j => j.jobNumber);
            
            const prompt = `You are an intelligent assistant for Rex Industries, a manufacturing company. Your task is to generate a unique job number.

Follow these rules strictly:
1. The job number format MUST be one of the following: XX-0000, XXX-0000, or XX-0000X (where X is a letter and 0 is a number).
2. The letters should be derived from the customer's name or the job type.
3. The generated job number MUST NOT be in the list of existing job numbers provided.
4. Respond with ONLY the generated job number and nothing else.

Here is the information for the new job:
- Customer Name: ${customerName || 'N/A'}
- Job Type: ${jobType}
- Job Description: ${jobDescription || 'N/A'}

Here is the list of job numbers that are already in use. Do not generate any of these:
- ${existingJobNumbers.join('\n- ')}

Generate a new, unique job number now.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const suggestedNumber = response.text.trim();
            
            if (/^[A-Z]{2,3}-\d{4}[A-Z]?$/i.test(suggestedNumber) && !existingJobNumbers.includes(suggestedNumber.toUpperCase())) {
                setJobNumber(suggestedNumber.toUpperCase());
            } else {
                console.warn("AI suggested an invalid or duplicate job number:", suggestedNumber);
                showModal("The AI suggestion was invalid or a duplicate. Please try again or enter one manually.");
            }

        } catch (error) {
            console.error("Error suggesting job number:", error);
            showModal("Could not get an AI suggestion at this time. Please check your API key and try again later.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleAddProductToOrder = () => {
        if (!currentProductId || currentQuantity < 1) {
            showModal("Please select a product and enter a valid quantity.");
            return;
        }
        if (productOrderList.some(p => p.productId === currentProductId)) {
            showModal("This product is already in the order list. You can remove it to add it again with different settings.");
            return;
        }
        const product = products.find(p => p.id === currentProductId);
        if (product) {
            setProductOrderList([...productOrderList, {
                productId: product.id,
                productName: product.name,
                quantity: currentQuantity,
                motorRequirement: currentMotorRequirement,
            }]);
            setCurrentProductId('');
            setCurrentQuantity(1);
            setCurrentMotorRequirement('');
        }
    };

    const handleRemoveProductFromOrder = (productId: string) => {
        setProductOrderList(productOrderList.filter(p => p.productId !== productId));
    };


    const handleAddDrawing = () => {
        setDrawings([...drawings, { id: `new-${Date.now()}`, name: '', quantity: 1 }]);
    };

    const handleRemoveDrawing = (id: string) => {
        setDrawings(drawings.filter(d => d.id !== id));
    };

    const handleDrawingChange = (id: string, field: 'name' | 'quantity', value: string | number) => {
        setDrawings(drawings.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const resetForm = () => {
        setJobNumber('');
        setCustomerName('');
        setFinishDate('');
        setPriority('Normal');
        setJobDescription('');
        setDesignRequired(false);
        setDrawings([]);
        setProductOrderList([]);
        setCurrentProductId('');
        setCurrentQuantity(1);
        setCurrentMotorRequirement('');
        setSpecialRequirement('');
    };

    const generateJobData = (): Omit<Job, 'id'> | null => {
        if (!/^[A-Z]{2,3}-\d{4}[A-Z]?$/i.test(jobNumber.trim())) { showModal("Invalid Job Number format. Use AA-0000 or AA-0000A."); return null; }
        if (jobs.some(j => j.jobNumber.toUpperCase() === jobNumber.trim().toUpperCase())) { showModal(`Job Number "${jobNumber.toUpperCase()}" already exists.`); return null; }
        if (!finishDate) { showModal("Please select a finish date."); return null; }
        if (!currentUser?.name) { showModal("Cannot create job without a logged-in user."); return null; }

        if (jobType === 'Service') {
            if (!designRequired && drawings.length === 0) { showModal("Please add at least one drawing."); return null; }
            return {
                jobType: 'Service',
                jobNumber: jobNumber.trim().toUpperCase(),
                customerName: customerName.trim(),
                jobDescription: jobDescription.trim(),
                addedDate: new Date().toISOString().split('T')[0],
                finishDate,
                priority,
                designRequired,
                programmingRequired: false,
                designCompleted: false,
                drawings: drawings.map(d => ({
                    ...d,
                    materialStatus: 'Pending',
                    processes: [],
                    currentDepartment: "Planning", // Default, will be updated on proceed
                    previousDepartment: null,
                    reworkCount: 0,
                    reworkHistory: [],
                    isUnderRework: false,
                    reworkOriginProcess: null,
                    designCompletedDate: null,
                    finalQcApproved: false,
                    finalQcComment: "",
                    finalQcApprovedAt: null,
                })),
                createdBy: currentUser.name,
                createdAt: new Date().toISOString(),
            };
        } else { // Product
            if (productOrderList.length === 0) { showModal("Please add at least one product to the job."); return null; }
            
            const productsToSave: ProductOrderItem[] = productOrderList.map(item => ({
                ...item,
                status: 'Pending Stock Check',
            }));

            return {
                jobType: 'Product',
                jobNumber: jobNumber.trim().toUpperCase(),
                customerName: customerName.trim(),
                jobDescription: `Product Order: ${productOrderList.map(p => p.productName).join(', ')}`,
                addedDate: new Date().toISOString().split('T')[0],
                finishDate,
                priority,
                createdBy: currentUser.name,
                createdAt: new Date().toISOString(),
                products: productsToSave,
                specialRequirement: specialRequirement.trim(),
            };
        }
    };

    const handleSubmit = () => {
        const jobData = generateJobData();
        if (jobData) {
            createJob(jobData);
            resetForm();
        }
    };
    
    const handleInitiateHold = () => {
        const jobData = generateJobData();
        if (jobData) {
            setShowCreateHoldModal(true);
        }
    };
    
    const handleConfirmHoldAndCreate = (reason: string) => {
        const jobData = generateJobData(); // Re-validate
        if (jobData) {
            const heldJobData = {
                ...jobData,
                isHeldBySales: true,
                salesHoldReason: reason,
                 // For held service jobs, drawings start in a non-workflow state
                drawings: jobData.jobType === 'Service' ? (jobData.drawings || []).map(d => ({...d, currentDepartment: 'Sales Hold'})) : [],
            };
            createJob(heldJobData);
            resetForm();
            setShowCreateHoldModal(false);
        }
    };

    const handleRequestsClick = () => {
        if (salesRequestCount > 0) {
            onOpenNotifications();
        } else {
            showModal("There are no pending requests.");
        }
    };

    return (
        <>
            <CreateJobHoldModal 
                show={showCreateHoldModal}
                onClose={() => setShowCreateHoldModal(false)}
                onConfirm={handleConfirmHoldAndCreate}
            />
            <section className="bg-white p-6 rounded-xl shadow-lg mb-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-5 border-b pb-3">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-indigo-700">Sales / Create New Job</h2>
                        <button 
                            onClick={handleRequestsClick}
                            className="relative px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm"
                        >
                            Requests
                            {salesRequestCount > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                    {salesRequestCount}
                                </span>
                            )}
                        </button>
                    </div>
                    <div className="flex bg-gray-200 rounded-lg p-1">
                        <button onClick={() => setJobType('Service')} className={`px-4 py-1 text-sm font-semibold rounded-md ${jobType === 'Service' ? 'bg-white text-indigo-700 shadow' : 'text-gray-600'}`}>Service</button>
                        <button onClick={() => setJobType('Product')} className={`px-4 py-1 text-sm font-semibold rounded-md ${jobType === 'Product' ? 'bg-white text-indigo-700 shadow' : 'text-gray-600'}`}>Product</button>
                    </div>
                </div>

                {jobType === 'Service' ? (
                    // SERVICE JOB FORM
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Number</label>
                                <div className="flex items-center gap-2">
                                    <input type="text" value={jobNumber} onChange={e => setJobNumber(e.target.value)} placeholder="e.g., SU-1234" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={handleSuggestJobNumber}
                                        disabled={isSuggesting}
                                        className="mt-1 p-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 disabled:bg-gray-200 disabled:cursor-wait flex-shrink-0"
                                        title="Suggest Job Number with AI"
                                    >
                                        {isSuggesting ? (
                                            <svg className="animate-spin h-5 w-5 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <SparklesIcon />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                                <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={2} placeholder="Brief description..." className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                                <input type="text" value={currentUser?.name || ''} readOnly className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Finish Date</label>
                                <input type="date" value={finishDate} onChange={e => setFinishDate(e.target.value)} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm">
                                    <option value="Normal">Normal</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-3">
                                <label className="block text-sm font-medium text-gray-700">Design Required?</label>
                                <input type="checkbox" checked={designRequired} onChange={e => setDesignRequired(e.target.checked)} className="h-5 w-5 text-indigo-600 rounded"/>
                            </div>
                        </div>

                        {!designRequired && (
                            <div className="mt-6 border-t pt-5">
                                <h3 className="text-xl font-semibold text-indigo-700 mb-4">Drawings</h3>
                                {drawings.map((d, i) => (
                                    <div key={d.id} className="bg-gray-50 p-4 rounded-lg border mb-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold">Drawing {i + 1}</h4>
                                            <button onClick={() => handleRemoveDrawing(d.id)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><TrashIcon /></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Drawing Name</label>
                                                <input type="text" value={d.name} onChange={e => handleDrawingChange(d.id, 'name', e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-md" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                                <input type="number" value={d.quantity} onChange={e => handleDrawingChange(d.id, 'quantity', parseInt(e.target.value) || 1)} min="1" className="mt-1 block w-full px-4 py-2 border rounded-md" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleAddDrawing} className="mt-3 w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-1"><PlusIcon /> Add Drawing</button>
                            </div>
                        )}
                    </div>
                ) : (
                    // PRODUCT JOB FORM
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Common fields for both job types */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Number</label>
                                <div className="flex items-center gap-2">
                                    <input type="text" value={jobNumber} onChange={e => setJobNumber(e.target.value)} placeholder="e.g., SU-1234" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={handleSuggestJobNumber}
                                        disabled={isSuggesting}
                                        className="mt-1 p-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 disabled:bg-gray-200 disabled:cursor-wait flex-shrink-0"
                                        title="Suggest Job Number with AI"
                                    >
                                        {isSuggesting ? (
                                            <svg className="animate-spin h-5 w-5 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <SparklesIcon />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                                <input type="text" value={currentUser?.name || ''} readOnly className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Finish Date</label>
                                <input type="date" value={finishDate} onChange={e => setFinishDate(e.target.value)} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm">
                                    <option value="Normal">Normal</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="mt-6 border-t pt-5">
                            <h3 className="text-xl font-semibold text-indigo-700 mb-4">Products in this Order</h3>
                            {/* List of added products */}
                            <div className="space-y-3 mb-4">
                                {productOrderList.map(item => (
                                    <div key={item.productId} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.productName}</p>
                                            <p className="text-sm text-gray-600">Qty: {item.quantity} | Motor: {item.motorRequirement || 'N/A'}</p>
                                        </div>
                                        <button onClick={() => handleRemoveProductFromOrder(item.productId)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><TrashIcon /></button>
                                    </div>
                                ))}
                                {productOrderList.length === 0 && <p className="text-gray-500 text-center">No products added yet.</p>}
                            </div>

                            {/* Form to add a new product to the order */}
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                                        <select value={currentProductId} onChange={e => setCurrentProductId(e.target.value)} className="mt-1 block w-full px-4 py-2 border rounded-md">
                                            <option value="">Select a Product...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                        <input type="number" value={currentQuantity} onChange={e => setCurrentQuantity(parseInt(e.target.value) || 1)} min="1" className="mt-1 block w-full px-4 py-2 border rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Motor Requirement</label>
                                        <select value={currentMotorRequirement} onChange={e => setCurrentMotorRequirement(e.target.value as any)} className="mt-1 block w-full px-4 py-2 border rounded-md">
                                            <option value="">Not Applicable</option>
                                            <option value="Single Phase">Single Phase</option>
                                            <option value="3 Phase">3 Phase</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={handleAddProductToOrder} className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-1"><PlusIcon /> Add Product to Order</button>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirement</label>
                            <textarea value={specialRequirement} onChange={e => setSpecialRequirement(e.target.value)} rows={3} placeholder="Add any special notes..." className="mt-1 block w-full px-4 py-2 border rounded-md"></textarea>
                        </div>
                    </div>
                )}
                
                <div className="mt-8 flex items-center justify-end gap-4">
                    <button onClick={handleInitiateHold} className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-md shadow-md hover:bg-yellow-600 flex items-center justify-center gap-2">
                        Create and Hold
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2">
                        <PlusIcon /> Create Job
                    </button>
                </div>
            </section>
            {heldJobs.length > 0 && (
                <section className="bg-white p-6 rounded-xl shadow-lg mt-8 max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold text-indigo-700 mb-5 border-b pb-3">Jobs on Hold</h3>
                    <div className="space-y-4">
                        {heldJobs.map(job => (
                            <div key={job.id} className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-800">{job.jobNumber} - {job.customerName}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <span className="font-semibold">Reason:</span> {job.salesHoldReason}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         {job.jobDescription && (
                                            <button 
                                                onClick={() => setExpandedHeldJobId(expandedHeldJobId === job.id ? null : job.id)}
                                                className="p-2 text-gray-600 rounded-md hover:bg-yellow-100"
                                                title={expandedHeldJobId === job.id ? "Hide Details" : "Show Details"}
                                            >
                                                {expandedHeldJobId === job.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                            </button>
                                         )}
                                        <button
                                            onClick={() => onProceedJob(job.id)}
                                            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 flex items-center gap-2"
                                        >
                                            <PlayIcon /> Proceed
                                        </button>
                                    </div>
                                </div>
                                {expandedHeldJobId === job.id && (
                                    <div className="mt-3 pt-3 border-t border-yellow-200">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                            <strong className="text-gray-800">Description:</strong> {job.jobDescription}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </>
    );
};