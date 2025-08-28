


import React, { useState, useMemo } from 'react';
import type { MachinesMap, Product, Job, Designer, Programmer, Operator, OfficialStaff, PermissionArea } from '../types';
import { PERMISSIONS_HIERARCHY } from '../types';
import { TrashIcon, ChevronLeftIcon, CameraIcon, CheckIcon, KeyIcon, GridIcon, XIcon, EditIcon, FingerprintIcon, TrendingUpIcon, ShieldCheckIcon } from '../components/Icons';
import { Reports } from './Reports';
import { JobHistoryReport } from '../components/reports/JobHistoryReport';
import { FaceLockModal } from '../components/modals/FaceLockModal';
import { PatternLockModal } from '../components/modals/PatternLockModal';
import { EditOperatorModal } from '../components/modals/EditOperatorModal';
import { VerifyLockModal } from '../components/modals/VerifyLockModal';
import { EditOfficialStaffModal } from '../components/modals/EditOfficialStaffModal';
import { VerifyStaffLockModal } from '../components/modals/VerifyStaffLockModal';
import { AdminChatHistory } from './AdminChatHistory';
import { PerformanceDashboard } from '../components/admin/PerformanceDashboard';
import { EmployeePerformanceDetail } from '../components/admin/EmployeePerformanceDetail';

interface AdminProps {
    onClose: () => void;
    allDepartments: string[];
    allProcesses: string[];
    allMachines: MachinesMap;
    departmentProcessMap: { [key:string]: string };
    products: Product[];
    jobs: Job[];
    designers: Designer[];
    programmers: Programmer[];
    operators: Operator[];
    officialStaff: OfficialStaff[];
    showConfirmation: (message: string, onConfirm: () => void) => void;
    updateSettings: (collection: 'machines' | 'settings' | 'settings', doc: string, data: any) => void;
    addProduct: (name: string, description: string) => void;
    removeProduct: (productId: string) => void;
    addOperator: (operatorData: Omit<Operator, 'id'>) => void;
    removeOperator: (operatorId: string) => void;
    updateOperator: (operatorId: string, data: Partial<Operator>) => void;
    addOfficialStaff: (staffData: Omit<OfficialStaff, 'id'>) => void;
    removeOfficialStaff: (staffId: string) => void;
    updateOfficialStaff: (staffId: string, data: Partial<OfficialStaff>) => void;
    isAdminPortalLocked: boolean;
    toggleAdminPortalLock: () => void;
}

type AdminSubView = 'processes' | 'machines' | 'departments' | 'products' | 'reports' | 'operators' | 'staff' | 'chatHistory' | 'performance' | 'security';

const getJobStatus = (job: Job) => {
    if (job.deliveredAt) return { text: 'Delivered', color: 'bg-green-100 text-green-800' };
    if (job.completedAt) return { text: 'Completed', color: 'bg-blue-100 text-blue-800' };
    return { text: 'Processing', color: 'bg-yellow-100 text-yellow-800' };
};

const getDescendants = (nodeName: string, hierarchy: typeof PERMISSIONS_HIERARCHY): string[] => {
    const findNode = (name: string, nodes: typeof PERMISSIONS_HIERARCHY): typeof PERMISSIONS_HIERARCHY[0] | null => {
        for (const node of nodes) {
            if (node.name === name) return node;
            if (node.sub) {
                const found = findNode(name, node.sub);
                if (found) return found;
            }
        }
        return null;
    };
    
    const flatten = (node: typeof PERMISSIONS_HIERARCHY[0]): string[] => {
        let names: string[] = [];
        if (node.sub) {
            node.sub.forEach(child => {
                names.push(child.name);
                names = names.concat(flatten(child));
            });
        }
        return names;
    };
    
    const node = findNode(nodeName, hierarchy);
    return node ? flatten(node) : [];
};

const PermissionTree: React.FC<{
    nodes: typeof PERMISSIONS_HIERARCHY;
    selected: PermissionArea[];
    onToggle: (p: PermissionArea, c: boolean) => void;
    parentIsSelected?: boolean;
    level?: number;
}> = ({ nodes, selected, onToggle, parentIsSelected = true, level = 0 }) => {
    if (!parentIsSelected) return null;

    return (
        <div style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
            {nodes.map(node => {
                const isSelected = selected.includes(node.name as PermissionArea);
                return (
                    <div key={node.name}>
                        <label className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-md">
                            <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={e => onToggle(node.name as PermissionArea, e.target.checked)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span>{node.name}</span>
                        </label>
                        {node.sub && (
                            <PermissionTree nodes={node.sub} selected={selected} onToggle={onToggle} parentIsSelected={isSelected} level={level + 1} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};


export const Admin: React.FC<AdminProps> = ({ 
    onClose, allDepartments, allProcesses, allMachines, departmentProcessMap, 
    products, jobs, designers, programmers, operators, officialStaff, showConfirmation, 
    updateSettings, addProduct, removeProduct, addOperator, removeOperator, updateOperator,
    addOfficialStaff, removeOfficialStaff, updateOfficialStaff, isAdminPortalLocked, toggleAdminPortalLock
}) => {
    const [subView, setSubView] = useState<AdminSubView>('departments');
    const [reportView, setReportView] = useState<'main' | 'jobList'>('main');
    const [selectedJobForHistory, setSelectedJobForHistory] = useState<Job | null>(null);
    const [jobListFilter, setJobListFilter] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<Operator | OfficialStaff | null>(null);

    // State for forms
    const [newProcessName, setNewProcessName] = useState('');
    const [newProcessDepartment, setNewProcessDepartment] = useState('');
    const [newMachineName, setNewMachineName] = useState('');
    const [selectedProcessForMachine, setSelectedProcessForMachine] = useState('');
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [newProductName, setNewProductName] = useState('');
    const [newProductDescription, setNewProductDescription] = useState('');
    
    // States for Operator form
    const [newOperatorName, setNewOperatorName] = useState('');
    const [newOperatorEmp, setNewOperatorEmp] = useState('');
    const [newOperatorDept, setNewOperatorDept] = useState('');
    const [newOperatorRole, setNewOperatorRole] = useState<'Section Head' | 'Worker'>('Worker');
    const [newOperatorPin, setNewOperatorPin] = useState('');
    const [newOperatorFaceLockCode, setNewOperatorFaceLockCode] = useState('');
    const [newOperatorPatternLockCode, setNewOperatorPatternLockCode] = useState<number[]>([]);
    const [showOperatorFaceLockModal, setShowOperatorFaceLockModal] = useState(false);
    const [showOperatorPatternLockModal, setShowOperatorPatternLockModal] = useState(false);
    const [operatorToEdit, setOperatorToEdit] = useState<Operator | null>(null);
    const [operatorToVerify, setOperatorToVerify] = useState<Operator | null>(null);
    const [operatorNameFilter, setOperatorNameFilter] = useState('');
    const [operatorDeptFilter, setOperatorDeptFilter] = useState('');

    // States for Staff form
    const [newStaffName, setNewStaffName] = useState('');
    const [newStaffEmp, setNewStaffEmp] = useState('');
    const [newStaffPosition, setNewStaffPosition] = useState('');
    const [newStaffPermissions, setNewStaffPermissions] = useState<PermissionArea[]>([]);
    const [newStaffPin, setNewStaffPin] = useState('');
    const [newStaffFaceLockCode, setNewStaffFaceLockCode] = useState('');
    const [newStaffPatternLockCode, setNewStaffPatternLockCode] = useState<number[]>([]);
    const [showStaffFaceLockModal, setShowStaffFaceLockModal] = useState(false);
    const [showStaffPatternLockModal, setShowStaffPatternLockModal] = useState(false);
    const [staffToEdit, setStaffToEdit] = useState<OfficialStaff | null>(null);
    const [staffToVerify, setStaffToVerify] = useState<OfficialStaff | null>(null);


    const handleAddDepartment = () => {
        const trimmedName = newDepartmentName.trim();
        if (!trimmedName) { return; }
        if (allDepartments.some(d => d.toLowerCase() === trimmedName.toLowerCase())) {
            alert("This department already exists.");
            return;
        }
        const updatedDepartments = [...allDepartments, trimmedName].sort();
        updateSettings('settings', 'appConfig', { departments: updatedDepartments });
        setNewDepartmentName('');
    };

    const handleRemoveDepartment = (deptToRemove: string) => {
        showConfirmation(`Are you sure you want to remove the department "${deptToRemove}"?`, () => {
            const updatedDepartments = allDepartments.filter(d => d !== deptToRemove);
            updateSettings('settings', 'appConfig', { departments: updatedDepartments });
        });
    };

    const handleAddProcess = () => {
        const trimmedName = newProcessName.trim();
        if (!trimmedName || !newProcessDepartment) { return; }
        if (allProcesses.some(p => p.toLowerCase() === trimmedName.toLowerCase())) {
            alert("This process already exists.");
            return;
        }
        const updatedProcesses = [...allProcesses, trimmedName].sort();
        const updatedMachines = { ...allMachines, [trimmedName]: [] };
        const updatedMap = { ...departmentProcessMap, [trimmedName]: newProcessDepartment };
        
        updateSettings('settings', 'processConfig', { processes: updatedProcesses, departmentMap: updatedMap });
        updateSettings('machines', 'machineList', updatedMachines);

        setNewProcessName('');
        setNewProcessDepartment('');
    };

    const handleRemoveProcess = (processToRemove: string) => {
        showConfirmation(`Remove process "${processToRemove}"?`, () => {
            const updatedProcesses = allProcesses.filter(p => p !== processToRemove);
            const { [processToRemove]: _, ...updatedMachines } = allMachines;
            const { [processToRemove]: __, ...updatedMap } = departmentProcessMap;

            updateSettings('settings', 'processConfig', { processes: updatedProcesses, departmentMap: updatedMap });
            updateSettings('machines', 'machineList', updatedMachines);
        });
    };

    const handleAddMachine = () => {
        if (!selectedProcessForMachine || !newMachineName.trim()) { return; }
        const updatedMachines = { ...allMachines };
        if (!updatedMachines[selectedProcessForMachine].includes(newMachineName.trim())) {
            updatedMachines[selectedProcessForMachine].push(newMachineName.trim());
            updateSettings('machines', 'machineList', updatedMachines);
            setNewMachineName('');
        } else {
            alert("Machine already exists for this process.");
        }
    };
    
    const handleRemoveMachine = (process: string, machine: string) => {
        showConfirmation(`Remove machine "${machine}" from "${process}"?`, () => {
            const updatedMachines = { ...allMachines };
            updatedMachines[process] = updatedMachines[process].filter(m => m !== machine);
            updateSettings('machines', 'machineList', updatedMachines);
        });
    };
    
    const handleAddProduct = () => {
        if (!newProductName.trim()) {
            alert("Product name cannot be empty.");
            return;
        }
        addProduct(newProductName.trim(), newProductDescription.trim());
        setNewProductName('');
        setNewProductDescription('');
    };
    
    const resetOperatorForm = () => {
        setNewOperatorName('');
        setNewOperatorEmp('');
        setNewOperatorDept('');
        setNewOperatorRole('Worker');
        setNewOperatorPin('');
        setNewOperatorFaceLockCode('');
        setNewOperatorPatternLockCode([]);
    };

    const handleAddOperator = () => {
        if (!newOperatorName.trim() || !newOperatorEmp.trim() || !newOperatorDept) {
            alert("Please fill in Operator Name, Employee Number, and Department.");
            return;
        }
        if (newOperatorPin && !/^\d{4}$/.test(newOperatorPin)) {
            alert("PIN must be exactly 4 digits.");
            return;
        }
        if (!newOperatorPin && !newOperatorFaceLockCode && newOperatorPatternLockCode.length === 0) {
            alert("Please set at least one security method (PIN, Facelock, or Pattern Lock).");
            return;
        }

        const operatorData: Omit<Operator, 'id'> = {
            name: newOperatorName.trim(),
            empNumber: newOperatorEmp.trim(),
            department: newOperatorDept,
            role: newOperatorRole,
        };
        if (newOperatorPin) operatorData.pin = newOperatorPin;
        if (newOperatorFaceLockCode) operatorData.faceLockCode = newOperatorFaceLockCode;
        if (newOperatorPatternLockCode.length > 0) operatorData.patternLockCode = newOperatorPatternLockCode;

        addOperator(operatorData);
        resetOperatorForm();
    };

    const handleSaveOperatorFaceLock = (faceData: string) => {
        setNewOperatorFaceLockCode(faceData);
        setShowOperatorFaceLockModal(false);
    };
    
    const handleSaveOperatorPatternLock = (pattern: number[]) => {
        setNewOperatorPatternLockCode(pattern);
        setShowOperatorPatternLockModal(false);
    };

    const handlePermissionChange = (permission: PermissionArea, checked: boolean) => {
        setNewStaffPermissions(prev => {
            if (checked) {
                return [...prev, permission];
            } else {
                const descendants = getDescendants(permission, PERMISSIONS_HIERARCHY);
                return prev.filter(p => p !== permission && !descendants.includes(p));
            }
        });
    };

    const resetStaffForm = () => {
        setNewStaffName('');
        setNewStaffEmp('');
        setNewStaffPosition('');
        setNewStaffPermissions([]);
        setNewStaffPin('');
        setNewStaffFaceLockCode('');
        setNewStaffPatternLockCode([]);
    };

    const handleAddStaff = () => {
        if (!newStaffName.trim() || !newStaffEmp.trim() || !newStaffPosition.trim()) {
            alert("Please fill in Name, Employee Number, and Position.");
            return;
        }
        if (newStaffPin && newStaffPin.length < 4) {
            alert("Password must be at least 4 characters long.");
            return;
        }
        if (!newStaffPin && !newStaffFaceLockCode && newStaffPatternLockCode.length === 0) {
            alert("Please set at least one security method (Password, Facelock, or Pattern Lock).");
            return;
        }

        const staffData: Omit<OfficialStaff, 'id'> = {
            name: newStaffName.trim(),
            empNumber: newStaffEmp.trim(),
            position: newStaffPosition.trim(),
            permissions: newStaffPermissions,
        };

        if (newStaffPin) staffData.pin = newStaffPin;
        if (newStaffFaceLockCode) staffData.faceLockCode = newStaffFaceLockCode;
        if (newStaffPatternLockCode.length > 0) staffData.patternLockCode = newStaffPatternLockCode;


        addOfficialStaff(staffData);
        resetStaffForm();
    };
    
    const handleSaveStaffFaceLock = (faceData: string) => {
        setNewStaffFaceLockCode(faceData);
        setShowStaffFaceLockModal(false);
    };
    
    const handleSaveStaffPatternLock = (pattern: number[]) => {
        setNewStaffPatternLockCode(pattern);
        setShowStaffPatternLockModal(false);
    };

    const filteredJobs = useMemo(() => {
        if (!jobListFilter) return jobs;
        const filter = jobListFilter.toLowerCase();
        return jobs.filter(job => 
            job.jobNumber.toLowerCase().includes(filter) ||
            job.customerName.toLowerCase().includes(filter)
        );
    }, [jobs, jobListFilter]);

    const filteredOperators = useMemo(() => {
        let tempOperators = [...operators];
        if (operatorNameFilter) {
            tempOperators = tempOperators.filter(op =>
                op.name.toLowerCase().includes(operatorNameFilter.toLowerCase())
            );
        }
        if (operatorDeptFilter) {
            tempOperators = tempOperators.filter(op =>
                op.department === operatorDeptFilter
            );
        }
        return tempOperators;
    }, [operators, operatorNameFilter, operatorDeptFilter]);

    const renderReportsView = () => {
        if (selectedJobForHistory) {
            return <JobHistoryReport job={selectedJobForHistory} onBack={() => setSelectedJobForHistory(null)} />;
        }

        if (reportView === 'jobList') {
            return (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setReportView('main')} className="flex items-center gap-1 text-sm p-2 bg-gray-200 rounded-md hover:bg-gray-300">
                                <ChevronLeftIcon /> Back to Analytics
                            </button>
                            <h4 className="text-2xl font-bold text-indigo-600">All Jobs</h4>
                        </div>
                        <input
                            type="text"
                            value={jobListFilter}
                            onChange={e => setJobListFilter(e.target.value)}
                            placeholder="Filter by job number or customer..."
                            className="w-1/3 px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto bg-white rounded-xl shadow-lg border">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredJobs.map(job => {
                                    const status = getJobStatus(job);
                                    return (
                                        <tr key={job.id} onClick={() => setSelectedJobForHistory(job)} className="hover:bg-gray-50 cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{job.jobNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{job.customerName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>{status.text}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap">{job.completedAt ? new Date(job.completedAt).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        // FIX: Removed `designers` and `programmers` props as they are not expected by the Reports component.
        return <Reports jobs={jobs} onShowJobDetails={() => setReportView('jobList')} />;
    };

    return (
        <>
            <style>{`
              /* Simple toggle switch styles for the Admin Security panel */
              input:checked ~ .dot {
                transform: translateX(100%);
                background-color: #4f46e5; /* indigo-600 */
              }
              input:checked ~ .block {
                background-color: #a5b4fc; /* indigo-300 */
              }
              .dot {
                transition: transform 0.3s ease;
              }
            `}</style>
            <FaceLockModal show={showOperatorFaceLockModal} onClose={() => setShowOperatorFaceLockModal(false)} onSave={handleSaveOperatorFaceLock} />
            <PatternLockModal show={showOperatorPatternLockModal} onClose={() => setShowOperatorPatternLockModal(false)} onSave={handleSaveOperatorPatternLock} />
            <EditOperatorModal
                show={!!operatorToEdit}
                onClose={() => setOperatorToEdit(null)}
                onSave={updateOperator}
                operator={operatorToEdit}
                allDepartments={allDepartments}
            />
            <VerifyLockModal 
                show={!!operatorToVerify} 
                onClose={() => setOperatorToVerify(null)} 
                operator={operatorToVerify} 
            />
            <FaceLockModal show={showStaffFaceLockModal} onClose={() => setShowStaffFaceLockModal(false)} onSave={handleSaveStaffFaceLock} />
            <PatternLockModal show={showStaffPatternLockModal} onClose={() => setShowStaffPatternLockModal(false)} onSave={handleSaveStaffPatternLock} />
            <EditOfficialStaffModal 
                show={!!staffToEdit}
                onClose={() => setStaffToEdit(null)}
                onSave={updateOfficialStaff}
                staff={staffToEdit}
            />
             <VerifyStaffLockModal 
                show={!!staffToVerify} 
                onClose={() => setStaffToVerify(null)} 
                staff={staffToVerify} 
            />
            <div className="h-screen bg-gray-100 flex font-sans">
                <aside className="w-64 bg-white shadow-md flex flex-col p-4">
                    <button onClick={onClose} className="self-start mb-6 flex items-center gap-2 px-3 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300">
                        <ChevronLeftIcon />
                        Back to App
                    </button>
                    <nav className="flex flex-col space-y-2">
                        <button onClick={() => setSubView('departments')} className={`p-2 rounded-md text-left font-semibold ${subView === 'departments' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>Departments</button>
                        <button onClick={() => setSubView('processes')} className={`p-2 rounded-md text-left font-semibold ${subView === 'processes' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>Processes</button>
                        <button onClick={() => setSubView('machines')} className={`p-2 rounded-md text-left font-semibold ${subView === 'machines' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>Machines</button>
                        <button onClick={() => setSubView('products')} className={`p-2 rounded-md text-left font-semibold ${subView === 'products' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>Products</button>
                        <button onClick={() => setSubView('operators')} className={`p-2 rounded-md text-left font-semibold ${subView === 'operators' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>Machine Operators</button>
                        <button onClick={() => setSubView('staff')} className={`p-2 rounded-md text-left font-semibold ${subView === 'staff' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>Official Staff</button>
                        <button onClick={() => { setSubView('reports'); setReportView('main'); setSelectedJobForHistory(null); }} className={`p-2 rounded-md text-left font-semibold ${subView === 'reports' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>Reports</button>
                        <button onClick={() => setSubView('chatHistory')} className={`p-2 rounded-md text-left font-semibold ${subView === 'chatHistory' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>Chat History</button>
                        <button onClick={() => { setSubView('performance'); setSelectedEmployee(null); }} className={`p-2 rounded-md text-left font-semibold flex items-center gap-2 ${subView === 'performance' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>
                            <TrendingUpIcon /> Performance
                        </button>
                        <button onClick={() => setSubView('security')} className={`p-2 rounded-md text-left font-semibold flex items-center gap-2 ${subView === 'security' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>
                            <ShieldCheckIcon /> Security
                        </button>
                    </nav>
                </aside>
                <main className="flex-1 p-8 overflow-y-auto">
                    {subView === 'departments' && (
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-2xl font-bold mb-4 text-indigo-600">Manage Departments</h3>
                            <div className="grid grid-cols-2 gap-4 items-end mb-6 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium">New Department Name</label>
                                    <input type="text" value={newDepartmentName} onChange={e => setNewDepartmentName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                                </div>
                                <button onClick={handleAddDepartment} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 h-10">Add Department</button>
                            </div>
                            <ul className="space-y-2">
                                {allDepartments.map(dept => (
                                    <li key={dept} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
                                        <span>{dept}</span>
                                        <button onClick={() => handleRemoveDepartment(dept)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><TrashIcon /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {subView === 'processes' && (
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-2xl font-bold mb-4 text-indigo-600">Manage Processes</h3>
                            <div className="grid grid-cols-3 gap-4 items-end mb-6 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium">New Process Name</label>
                                    <input type="text" value={newProcessName} onChange={e => setNewProcessName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Assign to Department</label>
                                    <select value={newProcessDepartment} onChange={e => setNewProcessDepartment(e.target.value)} className="mt-1 w-full p-2 border rounded-md">
                                        <option value="">Select Department...</option>
                                        {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleAddProcess} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 h-10">Add Process</button>
                            </div>
                            <ul className="space-y-2">
                                {allProcesses.map(proc => (
                                    <li key={proc} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
                                        <span>{proc} ({departmentProcessMap[proc] || 'Unassigned'})</span>
                                        <button onClick={() => handleRemoveProcess(proc)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><TrashIcon /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {subView === 'machines' && (
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-2xl font-bold mb-4 text-indigo-600">Manage Machines</h3>
                            <div className="grid grid-cols-3 gap-4 items-end mb-6 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium">Process</label>
                                    <select value={selectedProcessForMachine} onChange={e => setSelectedProcessForMachine(e.target.value)} className="mt-1 w-full p-2 border rounded-md">
                                        <option value="">Select Process...</option>
                                        {allProcesses.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">New Machine Name</label>
                                    <input type="text" value={newMachineName} onChange={e => setNewMachineName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                                </div>
                                <button onClick={handleAddMachine} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 h-10">Add Machine</button>
                            </div>
                            <div className="space-y-4">
                                {allProcesses.map(proc => (
                                    <div key={proc}>
                                        <h4 className="font-semibold">{proc}</h4>
                                        <ul className="pl-4 list-disc list-inside">
                                            {allMachines[proc]?.map(machine => (
                                                <li key={machine} className="flex items-center gap-4">
                                                    <span>{machine}</span>
                                                    <button onClick={() => handleRemoveMachine(proc, machine)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><TrashIcon className="w-4 h-4" /></button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {subView === 'products' && (
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-2xl font-bold mb-4 text-indigo-600">Manage Products</h3>
                            <div className="grid grid-cols-3 gap-4 items-end mb-6 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium">Product Name</label>
                                    <input type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Description (optional)</label>
                                    <input type="text" value={newProductDescription} onChange={e => setNewProductDescription(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                                </div>
                                <button onClick={handleAddProduct} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 h-10">Add Product</button>
                            </div>
                            <ul className="space-y-2">
                                {products.map(prod => (
                                    <li key={prod.id} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
                                        <div>
                                            <p className="font-semibold">{prod.name}</p>
                                            <p className="text-sm text-gray-500">{prod.description}</p>
                                        </div>
                                        <button onClick={() => removeProduct(prod.id)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><TrashIcon /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {subView === 'operators' && (
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-2xl font-bold mb-4 text-indigo-600">Manage Machine Operators</h3>
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <div>
                                        <label className="block text-sm font-medium">Operator Name</label>
                                        <input type="text" value={newOperatorName} onChange={e => setNewOperatorName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Employee Number</label>
                                        <input type="text" value={newOperatorEmp} onChange={e => setNewOperatorEmp(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Working Department</label>
                                        <select value={newOperatorDept} onChange={e => setNewOperatorDept(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white">
                                            <option value="">Select Department...</option>
                                            {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium">Role</label>
                                        <select value={newOperatorRole} onChange={e => setNewOperatorRole(e.target.value as 'Section Head' | 'Worker')} className="mt-1 w-full p-2 border rounded-md bg-white">
                                            <option value="Worker">Worker</option>
                                            <option value="Section Head">Section Head</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="block text-sm font-medium">Security Options (At least one required)</label>
                                        {/* PIN */}
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                            <KeyIcon />
                                            <label className="font-semibold w-28">PIN (4 digits)</label>
                                            <input type="password" value={newOperatorPin} onChange={e => setNewOperatorPin(e.target.value.replace(/\D/g, '').slice(0,4))} maxLength={4} className="flex-grow p-2 border rounded-md" />
                                        </div>
                                        {/* Facelock */}
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                             <CameraIcon />
                                             <label className="font-semibold w-28">Facelock</label>
                                             {newOperatorFaceLockCode ? (
                                                <div className="flex-grow flex justify-between items-center">
                                                    <span className="text-green-600 font-semibold flex items-center gap-1"><CheckIcon /> Configured</span>
                                                    <button onClick={() => setNewOperatorFaceLockCode('')} className="text-xs text-red-500 hover:underline">Remove</button>
                                                </div>
                                             ) : (
                                                <button onClick={() => setShowOperatorFaceLockModal(true)} className="flex-grow p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm">Setup Facelock</button>
                                             )}
                                        </div>
                                         {/* Pattern Lock */}
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                             <GridIcon />
                                             <label className="font-semibold w-28">Pattern Lock</label>
                                             {newOperatorPatternLockCode.length > 0 ? (
                                                <div className="flex-grow flex justify-between items-center">
                                                    <span className="text-green-600 font-semibold flex items-center gap-1"><CheckIcon /> Configured</span>
                                                    <button onClick={() => setNewOperatorPatternLockCode([])} className="text-xs text-red-500 hover:underline">Remove</button>
                                                </div>
                                             ) : (
                                                <button onClick={() => setShowOperatorPatternLockModal(true)} className="flex-grow p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm">Setup Pattern</button>
                                             )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleAddOperator} className="mt-4 w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 h-10">Add Operator</button>
                            </div>
                            <h4 className="text-xl font-semibold mb-3 text-gray-700">Existing Operators</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input
                                    type="text"
                                    placeholder="Filter by operator name..."
                                    value={operatorNameFilter}
                                    onChange={e => setOperatorNameFilter(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                />
                                <select
                                    value={operatorDeptFilter}
                                    onChange={e => setOperatorDeptFilter(e.target.value)}
                                    className="w-full p-2 border rounded-md bg-white"
                                >
                                    <option value="">All Departments</option>
                                    {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <ul className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredOperators.map(op => (
                                    <li key={op.id} className="flex justify-between items-center p-3 bg-gray-100 rounded-md">
                                        <div>
                                            <p className="font-semibold">{op.name} <span className="text-sm font-normal text-gray-500">(EMP: {op.empNumber})</span></p>
                                            <p className="text-xs text-gray-600">Department: {op.department} | Role: <span className="font-semibold">{op.role || 'Worker'}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            {op.pin && <span title="PIN enabled"><KeyIcon /></span>}
                                            {op.faceLockCode && <span title="Facelock enabled"><CameraIcon /></span>}
                                            {op.patternLockCode && op.patternLockCode.length > 0 && <span title="Pattern Lock enabled"><GridIcon /></span>}
                                            <button onClick={() => setOperatorToVerify(op)} className="text-gray-500 p-1 rounded-full hover:bg-gray-200" title="Test Security"><FingerprintIcon /></button>
                                            <button onClick={() => setOperatorToEdit(op)} className="text-blue-500 p-1 rounded-full hover:bg-blue-100" title="Edit Operator"><EditIcon /></button>
                                            <button onClick={() => removeOperator(op.id)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><TrashIcon /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {subView === 'staff' && (
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-2xl font-bold mb-4 text-indigo-600">Manage Official Staff</h3>
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <div>
                                        <label className="block text-sm font-medium">Employee Name</label>
                                        <input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Employee Number</label>
                                        <input type="text" value={newStaffEmp} onChange={e => setNewStaffEmp(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium">Position</label>
                                        <input 
                                            type="text" 
                                            value={newStaffPosition} 
                                            onChange={e => setNewStaffPosition(e.target.value)}
                                            placeholder="e.g., Sales Manager, Lead Designer"
                                            className="mt-1 w-full p-2 border rounded-md" 
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="block text-sm font-medium">Permissions</label>
                                        <div className="p-2 border rounded-md bg-white">
                                            <PermissionTree nodes={PERMISSIONS_HIERARCHY} selected={newStaffPermissions} onToggle={handlePermissionChange} />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="block text-sm font-medium">Security Options (At least one required)</label>
                                        {/* PIN */}
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                            <KeyIcon />
                                            <label className="font-semibold w-28">Password</label>
                                            <input type="password" value={newStaffPin} onChange={e => setNewStaffPin(e.target.value)} className="flex-grow p-2 border rounded-md" />
                                        </div>
                                        {/* Facelock */}
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                             <CameraIcon />
                                             <label className="font-semibold w-28">Facelock</label>
                                             {newStaffFaceLockCode ? (
                                                <div className="flex-grow flex justify-between items-center">
                                                    <span className="text-green-600 font-semibold flex items-center gap-1"><CheckIcon /> Configured</span>
                                                    <button onClick={() => setNewStaffFaceLockCode('')} className="text-xs text-red-500 hover:underline">Remove</button>
                                                </div>
                                             ) : (
                                                <button onClick={() => setShowStaffFaceLockModal(true)} className="flex-grow p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm">Setup Facelock</button>
                                             )}
                                        </div>
                                         {/* Pattern Lock */}
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-md border">
                                             <GridIcon />
                                             <label className="font-semibold w-28">Pattern Lock</label>
                                             {newStaffPatternLockCode.length > 0 ? (
                                                <div className="flex-grow flex justify-between items-center">
                                                    <span className="text-green-600 font-semibold flex items-center gap-1"><CheckIcon /> Configured</span>
                                                    <button onClick={() => setNewStaffPatternLockCode([])} className="text-xs text-red-500 hover:underline">Remove</button>
                                                </div>
                                             ) : (
                                                <button onClick={() => setShowStaffPatternLockModal(true)} className="flex-grow p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm">Setup Pattern</button>
                                             )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleAddStaff} className="mt-4 w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 h-10">Add Staff</button>
                            </div>
                            <h4 className="text-xl font-semibold mb-3 text-gray-700">Existing Staff</h4>
                            <ul className="space-y-2 max-h-96 overflow-y-auto">
                                {officialStaff.map(staff => (
                                    <li key={staff.id} className="flex justify-between items-center p-3 bg-gray-100 rounded-md">
                                        <div>
                                            <p className="font-semibold">{staff.name} <span className="text-sm font-normal text-gray-500">(EMP: {staff.empNumber})</span></p>
                                            <p className="text-xs text-gray-600">Position: {staff.position}</p>
                                            <p className="text-xs text-gray-600 mt-1">Permissions: <span className="font-medium">{staff.permissions.join(', ')}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            {staff.pin && <span title="Password enabled"><KeyIcon /></span>}
                                            {staff.faceLockCode && <span title="Facelock enabled"><CameraIcon /></span>}
                                            {staff.patternLockCode && staff.patternLockCode.length > 0 && <span title="Pattern Lock enabled"><GridIcon /></span>}
                                            <button onClick={() => setStaffToVerify(staff)} className="text-gray-500 p-1 rounded-full hover:bg-gray-200" title="Test Security"><FingerprintIcon /></button>
                                            <button onClick={() => setStaffToEdit(staff)} className="text-blue-500 p-1 rounded-full hover:bg-blue-100" title="Edit Staff"><EditIcon /></button>
                                            <button onClick={() => removeOfficialStaff(staff.id)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><TrashIcon /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {subView === 'reports' && renderReportsView()}
                    {subView === 'chatHistory' && <AdminChatHistory />}
                    {subView === 'performance' && (
                        <>
                            {selectedEmployee ? (
                                <EmployeePerformanceDetail 
                                    employee={selectedEmployee} 
                                    jobs={jobs} 
                                    onBack={() => setSelectedEmployee(null)} 
                                />
                            ) : (
                                <PerformanceDashboard 
                                    operators={operators} 
                                    officialStaff={officialStaff} 
                                    onSelectEmployee={setSelectedEmployee} 
                                />
                            )}
                        </>
                    )}
                    {subView === 'security' && (
                         <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-2xl font-bold mb-4 text-indigo-600">Security Settings</h3>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                <div>
                                    <p className="font-semibold">Lock Administration Portal</p>
                                    <p className="text-sm text-gray-600">
                                        When locked, access to the Admin portal will require manual login, even if already logged into another portal.
                                    </p>
                                </div>
                                <label htmlFor="toggle" className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input type="checkbox" id="toggle" className="sr-only" checked={isAdminPortalLocked} onChange={toggleAdminPortalLock} />
                                        <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition`}></div>
                                    </div>
                                    <div className="ml-3 text-gray-700 font-medium">
                                        {isAdminPortalLocked ? 'Locked' : 'Unlocked'}
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};