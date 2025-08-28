
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
    db, 
    auth,
    collection,
    onSnapshot,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    deleteField,
    query,
    where,
    getDocs,
    setDoc,
    signInAnonymously,
    onAuthStateChanged
} from './services/firebase';
import { ConfirmationModal, InfoModal } from './components/modals/ConfirmationModal';
import { HoldModal, ResumeModal } from './components/modals/HoldResumeModals';
import { PrintModal } from './components/modals/PrintModal';
import { DrawingModal } from './components/modals/DrawingModal';
import { JobActionsModal } from './components/modals/JobActionsModal';
import { JobDetailModal } from './components/modals/JobDetailModal';
import { ReworkModal } from './components/modals/ReworkModal';
import { ProductJobModal } from './components/modals/ProductJobModal';
import { AssignmentModal } from './components/modals/AssignmentModal';
import { JobAssignmentModal } from './components/modals/JobAssignmentModal';
import { FinishDesignModal } from './components/modals/FinishDesignModal';
import { DesignJobDetailModal } from './components/modals/DesignJobDetailModal';
import { CompletedJobReportModal } from './components/modals/CompletedJobReportModal';
import { PrintLayout } from './components/PrintLayout';
import type { Job, Drawing, Process, MachinesMap, PortalSection, Product, Designer, ProductOrderItem, Programmer, Operator, PlanningMaterialDelayData, OfficialStaff, ChatMessage, PermissionArea, FinalReport } from './types';
import { PERMISSIONS_HIERARCHY } from './types';
import { DEFAULT_DEPARTMENT_CARDS, DEFAULT_DEPARTMENT_PROCESS_MAP, DEFAULT_PROCESSES, DEFAULT_MACHINES } from './constants';
import { Home } from './views/Home';
import { Portal } from './views/Portal';
import { ProgrammingJobAssignmentModal } from './components/modals/ProgrammingJobAssignmentModal';
import { ProgrammingJobDetailModal } from './components/modals/ProgrammingJobDetailModal';
import { MaterialStockModal } from './components/modals/MaterialStockModal';
import { SalesRequestModal } from './components/modals/SalesRequestModal';
import { SalesNotificationModal } from './components/modals/SalesNotificationModal';
import { PlanningDelayRequestModal } from './components/modals/PlanningDelayRequestModal';
import { PreCncHoldModal } from './components/modals/PreCncHoldModal';
import { PlanningMaterialDelayModal } from './components/modals/PlanningMaterialDelayModal';
import { ProductDelayRequestModal } from './components/modals/ProductDelayRequestModal';
import { StaffLoginModal } from './components/modals/StaffLoginModal';
import { StaffChangePasswordModal } from './components/modals/StaffChangePasswordModal';
import { MyProfile } from './views/MyProfile';
import { FinalReportModal } from './components/modals/FinalReportModal';
import { PrintableJobReport } from './components/PrintableJobReport';

function App() {
    // Authentication State
    const [userId, setUserId] = useState<string | null>(null);

    // Data State from Firestore
    const [jobs, setJobs] = useState<Job[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [designers, setDesigners] = useState<Designer[]>([]);
    const [programmers, setProgrammers] = useState<Programmer[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [officialStaff, setOfficialStaff] = useState<OfficialStaff[]>([]);
    
    // Global App State
    const [activePortal, setActivePortal] = useState<PortalSection | null>(null);
    const [currentUser, setCurrentUser] = useState<OfficialStaff | Operator | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isAdminPortalLocked, setIsAdminPortalLocked] = useState(false);

    // Modal States
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
    
    const [showDrawingModal, setShowDrawingModal] = useState(false);
    const [currentJobForDrawing, setCurrentJobForDrawing] = useState<Job | null>(null);
    const [currentDrawingToEdit, setCurrentDrawingToEdit] = useState<Drawing | null>(null);
    const [drawingModalDepartment, setDrawingModalDepartment] = useState<string | null>(null);

    const [showJobActionsModal, setShowJobActionsModal] = useState(false);
    const [jobActionsModalData, setJobActionsModalData] = useState<{ jobId: string | null, department: string | null, qcEnabled: boolean }>({ jobId: null, department: null, qcEnabled: false });
    
    const [showProductJobModal, setShowProductJobModal] = useState(false);
    const [selectedProductJobId, setSelectedProductJobId] = useState<string | null>(null);

    const [showJobDetailModal, setShowJobDetailModal] = useState(false);
    const [selectedJobForDetail, setSelectedJobForDetail] = useState<Job | null>(null);

    const [showHoldModal, setShowHoldModal] = useState(false);
    const [holdReason, setHoldReason] = useState('');
    const [jobToHold, setJobToHold] = useState<{ jobId: string, drawingId: string } | null>(null);
    
    const [showDesignerHoldModal, setShowDesignerHoldModal] = useState(false);
    const [designerHoldReason, setDesignerHoldReason] = useState('');
    const [jobToHoldDesign, setJobToHoldDesign] = useState<Job | null>(null);
    
    const [showProgrammerHoldModal, setShowProgrammerHoldModal] = useState(false);
    const [programmerHoldReason, setProgrammerHoldReason] = useState('');
    const [jobToHoldProgramming, setJobToHoldProgramming] = useState<Job | null>(null);


    const [showResumeModal, setShowResumeModal] = useState(false);
    const [newFinishDate, setNewFinishDate] = useState('');
    const [jobToResume, setJobToResume] = useState<{ jobId: string, drawingId: string } | null>(null);
    
    const [showReworkModal, setShowReworkModal] = useState(false);
    const [reworkJobId, setReworkJobId] = useState<string | null>(null);
    const [reworkDrawingId, setReworkDrawingId] = useState<string | null>(null);
    const [reworkProcessName, setReworkProcessName] = useState('');
    const [reworkReason, setReworkReason] = useState('');
    const [reworkType, setReworkType] = useState<'in-department' | 'cross-department'>('in-department');
    const [reworkTargetDepartment, setReworkTargetDepartment] = useState('');
    const [reworkableProcesses, setReworkableProcesses] = useState<Process[]>([]);

    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [assignmentData, setAssignmentData] = useState<{jobId: string; drawingIds: string[]; designer: Designer} | null>(null);
    
    const [showJobAssignmentModal, setShowJobAssignmentModal] = useState(false);
    const [jobAssignmentData, setJobAssignmentData] = useState<{job: Job, designer: Designer} | null>(null);
    
    const [showProgrammingJobAssignmentModal, setShowProgrammingJobAssignmentModal] = useState(false);
    const [jobAssignmentDataProg, setJobAssignmentDataProg] = useState<{job: Job, programmer: Programmer} | null>(null);


    const [showFinishDesignModal, setShowFinishDesignModal] = useState(false);
    const [jobToFinishDesign, setJobToFinishDesign] = useState<Job | null>(null);

    const [showDesignDetailModal, setShowDesignDetailModal] = useState(false);
    const [selectedDesignJob, setSelectedDesignJob] = useState<Job | null>(null);
    
    const [showProgrammingDetailModal, setShowProgrammingDetailModal] = useState(false);
    const [selectedProgrammingJob, setSelectedProgrammingJob] = useState<Job | null>(null);

    const [showCompletedJobReportModal, setShowCompletedJobReportModal] = useState(false);
    const [selectedJobForReport, setSelectedJobForReport] = useState<Job | null>(null);

    // New Material Stock Modals
    const [showMaterialStockModal, setShowMaterialStockModal] = useState(false);
    const [stockModalData, setStockModalData] = useState<{ job: Job; drawing: Drawing } | null>(null);
    const [showSalesRequestModal, setShowSalesRequestModal] = useState(false);
    const [salesRequestData, setSalesRequestData] = useState<{ job: Job; drawing: Drawing; requestedDate: string } | null>(null);
    const [showSalesNotificationModal, setShowSalesNotificationModal] = useState(false);
    
    // New Planning Delay Modal
    const [showPlanningDelayModal, setShowPlanningDelayModal] = useState(false);
    const [planningDelayData, setPlanningDelayData] = useState<{ job: Job; drawingName: string; quantity: number; processes: Process[]; drawingToEdit: Drawing | null; } | null>(null);
    
    // New Pre-CNC Hold Modal
    const [showPreCncHoldModal, setShowPreCncHoldModal] = useState(false);
    const [preCncHoldModalData, setPreCncHoldModalData] = useState<{ job: Job; drawing: Drawing; process: Process } | null>(null);
    
    // New Planning Material Delay Modal
    const [showPlanningMaterialDelayModal, setShowPlanningMaterialDelayModal] = useState(false);
    const [planningMaterialDelayData, setPlanningMaterialDelayData] = useState<PlanningMaterialDelayData | null>(null);

    // New Product Delay Modal
    const [showProductDelayModal, setShowProductDelayModal] = useState(false);
    const [productDelayData, setProductDelayData] = useState<{ job: Job; productItem: ProductOrderItem; availabilityDate: string } | null>(null);

    // New Staff Login Modal State
    const [showStaffLoginModal, setShowStaffLoginModal] = useState(false);
    const [portalToAccess, setPortalToAccess] = useState<PortalSection | null>(null);
    
    // New Staff Change Password Modal State
    const [showStaffChangePasswordModal, setShowStaffChangePasswordModal] = useState(false);

    // My Profile view state
    const [showMyProfile, setShowMyProfile] = useState(false);
    
    // Final Report Modal State
    const [showFinalReportModal, setShowFinalReportModal] = useState(false);
    const [reportModalData, setReportModalData] = useState<{ job: Job; drawing: Drawing, reportToEdit?: FinalReport | null } | null>(null);

    // --- Print State ---
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [departmentForPrinting, setDepartmentForPrinting] = useState('');
    const [jobsToPrintInModal, setJobsToPrintInModal] = useState<Job[]>([]);
    const [printContent, setPrintContent] = useState<React.ReactNode | null>(null);
    const printComponentRef = useRef<HTMLDivElement>(null);
    
    // Settings State from Firestore
    const [allMachines, setAllMachines] = useState<MachinesMap>(DEFAULT_MACHINES);
    const [allProcesses, setAllProcesses] = useState<string[]>(DEFAULT_PROCESSES);
    const [departmentProcessMap, setDepartmentProcessMap] = useState<{ [key: string]: string }>(DEFAULT_DEPARTMENT_PROCESS_MAP);
    const [allDepartments, setAllDepartments] = useState<string[]>(DEFAULT_DEPARTMENT_CARDS);
    
    // Notifications
    const [notificationCounts, setNotificationCounts] = useState({ design: 0, stores: 0, product: 0, workflow: 0, qualityChecking: 0, programming: 0, sales: 0 });
    
    const activeJobs = useMemo(() => jobs.filter(job => !job.completedAt && !job.isHeldBySales), [jobs]);
    const salesRequestJobs = useMemo(() => jobs.filter(job => job.salesUpdateRequest?.status === 'pending'), [jobs]);

    // Helper to show info modal
    const showModal = useCallback((message: string) => {
        setModalMessage(message);
        setShowInfoModal(true);
    }, []);

    // Helper to show confirmation modal
    const showConfirmation = useCallback((message: string, onConfirm: () => void) => {
        setConfirmationMessage(message);
        setOnConfirmAction(() => onConfirm);
        setShowConfirmationModal(true);
    }, []);

    const handleConfirm = () => {
        if (onConfirmAction) onConfirmAction();
        setShowConfirmationModal(false);
        setOnConfirmAction(null);
    };

    const handleCancel = () => {
        setShowConfirmationModal(false);
        setOnConfirmAction(null);
    };
    
    // Firebase Anonymous Auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed:", error);
                });
            }
        });
        return () => unsubscribe();
    }, []);
    
    // Firestore Listeners
    useEffect(() => {
        const listeners = [
            onSnapshot(collection(db, 'jobs'), snapshot => setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)))),
            onSnapshot(collection(db, 'products'), snapshot => setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)))),
            onSnapshot(collection(db, 'designers'), snapshot => setDesigners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Designer)))),
            onSnapshot(collection(db, 'programmers'), snapshot => setProgrammers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Programmer)))),
            onSnapshot(collection(db, 'operators'), snapshot => setOperators(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Operator)))),
            onSnapshot(collection(db, 'officialStaff'), snapshot => setOfficialStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfficialStaff)))),
            onSnapshot(collection(db, 'messages'), snapshot => setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)))),
            onSnapshot(doc(db, 'machines', 'machineList'), docSnap => docSnap.exists() && setAllMachines(docSnap.data() as MachinesMap)),
            onSnapshot(doc(db, 'settings', 'processConfig'), docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data && data.processes) setAllProcesses(data.processes);
                    if (data && data.departmentMap) setDepartmentProcessMap(data.departmentMap);
                }
            }),
            onSnapshot(doc(db, 'settings', 'appConfig'), docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data && data.departments) setAllDepartments(data.departments);
                }
            }),
        ];
        return () => listeners.forEach(unsubscribe => unsubscribe());
    }, []);

    const getDepartmentForProcess = useCallback((processName: string): string | null => {
        if (!processName) return null;
        const lowerCaseProcessName = processName.toLowerCase();
        const mapKey = Object.keys(departmentProcessMap).find(k => k.toLowerCase() === lowerCaseProcessName);
        return mapKey ? departmentProcessMap[mapKey] : null;
    }, [departmentProcessMap]);
    
     // Calculate notification counts for nav badges
    useEffect(() => {
        const counts = { design: 0, stores: 0, product: 0, workflow: 0, qualityChecking: 0, programming: 0, sales: 0 };
        const planningJobs = new Set<string>();
        const storesJobs = new Set<string>();
        const qcJobs = new Set<string>();
    
        activeJobs.forEach(job => {
            if (job.salesUpdateRequest?.status === 'pending') counts.sales++;
            if (job.jobType === 'Service') {
                if (job.designRequired && !job.designerId && !job.designCompleted) counts.design++;
                if (job.programmingRequired && !job.programmerId && !job.programmingCompleted) counts.programming++;
                if (job.drawings) {
                    let needsProcessQc = false, needsFinalQc = false;
                    job.drawings.forEach(d => {
                        if (d.materialStatus === 'Pending' || d.materialStatus === 'Awaiting Stock') storesJobs.add(job.id);
                        if (d.currentDepartment === "Planning") planningJobs.add(job.id);
                        if (d.currentDepartment === 'Final Quality Check') needsFinalQc = true;
                        d.processes.forEach(p => { if (p.completed && !p.qualityCheckCompleted) needsProcessQc = true; });
                    });
                    if (needsProcessQc || needsFinalQc) qcJobs.add(job.id);
                }
                if (job.designCompleted === true && (!job.drawings || job.drawings.length === 0)) planningJobs.add(job.id);
            }
            if (job.jobType === 'Product' && job.products?.some(p => p.status === 'Pending Stock Check')) counts.product++;
        });
    
        counts.workflow = planningJobs.size;
        counts.stores = storesJobs.size;
        counts.qualityChecking = qcJobs.size;
        setNotificationCounts(counts);
    }, [activeJobs]);


    // --- Firestore Update Functions ---
    const updateJobInFirestore = useCallback(async (jobId: string, updatedData: { [key: string]: any }) => {
        try {
            const jobRef = doc(db, 'jobs', jobId);
            const payload = { ...updatedData };
            for (const key in payload) {
                if (payload[key] === 'DELETE_FIELD') {
                    payload[key] = deleteField();
                }
            }
            await updateDoc(jobRef, payload);
        } catch (error) {
            console.error("Error updating job:", error);
            showModal("Failed to save data. Please check connection and permissions.");
        }
    }, [showModal]);

    const createJobInFirestore = useCallback(async (jobData: Omit<Job, 'id'>) => {
        try {
            await addDoc(collection(db, 'jobs'), jobData);
            showModal("Job created successfully!");
        } catch (error) {
            console.error("Error creating job:", error);
            showModal("Failed to create job. Please check connection and permissions.");
        }
    }, [showModal]);

    const deleteJobInFirestore = useCallback((jobId: string) => {
        showConfirmation("Are you sure you want to permanently delete this job?", async () => {
            try {
                await deleteDoc(doc(db, 'jobs', jobId));
                setShowJobActionsModal(false);
            } catch (error) {
                console.error("Error deleting job:", error);
                showModal("Failed to delete job. Please check permissions.");
            }
        });
    }, [showConfirmation, showModal]);
    
    const updateSettingsInFirestore = useCallback(async (collectionName: 'machines' | 'settings', docName: string, data: any) => {
        try {
            await setDoc(doc(db, collectionName, docName), data, { merge: true });
        } catch (error) {
            console.error("Error updating settings:", error);
            showModal("Failed to update settings. Please check permissions.");
        }
    }, [showModal]);

    const addProduct = useCallback(async (name: string, description: string) => {
        try {
            await addDoc(collection(db, 'products'), { name, description });
            showModal(`Product "${name}" added successfully.`);
        } catch (error) {
            console.error("Error adding product:", error);
            showModal("Failed to add product.");
        }
    }, [showModal]);

    const removeProduct = useCallback((productId: string) => {
        showConfirmation("Are you sure you want to permanently delete this product?", async () => {
            try {
                await deleteDoc(doc(db, 'products', productId));
            } catch (error) {
                console.error("Error removing product:", error);
                showModal("Failed to remove product.");
            }
        });
    }, [showConfirmation, showModal]);

    const addOperator = useCallback(async (operatorData: Omit<Operator, 'id'>) => {
        try {
            await addDoc(collection(db, 'operators'), operatorData);
            showModal(`Operator "${operatorData.name}" added successfully.`);
        } catch (error) {
            console.error("Error adding operator:", error);
            showModal("Failed to add operator.");
        }
    }, [showModal]);

    const removeOperator = useCallback((operatorId: string) => {
        showConfirmation("Are you sure you want to permanently delete this operator?", async () => {
            try {
                await deleteDoc(doc(db, 'operators', operatorId));
            } catch (error) {
                console.error("Error removing operator:", error);
                showModal("Failed to remove operator.");
            }
        });
    }, [showConfirmation, showModal]);

    const updateOperator = useCallback(async (operatorId: string, data: Partial<Operator>) => {
        try {
            await updateDoc(doc(db, 'operators', operatorId), data);
            showModal(`Operator details updated successfully.`);
        } catch (error) {
            console.error("Error updating operator:", error);
            showModal("Failed to update operator details.");
        }
    }, [showModal]);
    
    const addOfficialStaff = useCallback(async (staffData: Omit<OfficialStaff, 'id'>) => {
        try {
            await addDoc(collection(db, 'officialStaff'), staffData);
            const hasDesignPermission = staffData.permissions.includes('Designer') || staffData.permissions.includes('Head Of Designer');
            if (hasDesignPermission && !designers.some(d => d.name.trim().toLowerCase() === staffData.name.trim().toLowerCase())) {
                await addDoc(collection(db, 'designers'), { name: staffData.name.trim() });
            }
            showModal(`Staff "${staffData.name}" added successfully.`);
        } catch (error) {
            console.error("Error adding staff:", error);
            showModal("Failed to add staff member.");
        }
    }, [showModal, designers]);
    
    const removeOfficialStaff = useCallback((staffId: string) => {
        showConfirmation("Are you sure you want to permanently delete this staff member?", async () => {
            try {
                await deleteDoc(doc(db, 'officialStaff', staffId));
            } catch (error) {
                console.error("Error removing staff:", error);
                showModal("Failed to remove staff member.");
            }
        });
    }, [showConfirmation, showModal]);

    const updateOfficialStaff = useCallback(async (staffId: string, data: Partial<OfficialStaff>): Promise<boolean> => {
        try {
            await updateDoc(doc(db, 'officialStaff', staffId), data);
            return true;
        } catch (error) {
            console.error("Error updating staff:", error);
            showModal(`Failed to update staff details for ${data.name}.`);
            return false;
        }
    }, [showModal]);

    const addDesigner = useCallback(async (name: string) => {
        if (!name.trim()) return;
        try {
            await addDoc(collection(db, 'designers'), { name: name.trim() });
        } catch (error) {
            console.error("Error adding designer:", error);
            showModal("Failed to add designer.");
        }
    }, [showModal]);
    
    const removeDesigner = useCallback((designerId: string, designerName: string) => {
        showConfirmation(`Are you sure you want to remove designer "${designerName}"?`, async () => {
            try {
                await deleteDoc(doc(db, 'designers', designerId));
                const q = query(collection(db, "jobs"), where("designerId", "==", designerId));
                const querySnapshot = await getDocs(q);
                const batch = writeBatch(db);
                querySnapshot.forEach((jobDoc) => {
                    batch.update(doc(db, 'jobs', jobDoc.id), { designerId: deleteField(), designerName: deleteField() });
                });
                await batch.commit();
            } catch (error) {
                console.error("Error removing designer:", error);
                showModal("Failed to remove designer.");
            }
        });
    }, [showConfirmation, showModal]);

    const handleRenameDesigner = useCallback(async (designerId: string, newName: string) => {
        try {
            await updateDoc(doc(db, 'designers', designerId), { name: newName.trim() });
            const q = query(collection(db, "jobs"), where("designerId", "==", designerId));
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.forEach((jobDoc) => {
                batch.update(doc(db, 'jobs', jobDoc.id), { designerName: newName.trim() });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error renaming designer:", error);
            showModal("Failed to rename designer.");
        }
    }, [showModal]);

    const addProgrammer = useCallback(async (name: string) => {
        if (!name.trim()) return;
        try {
            await addDoc(collection(db, 'programmers'), { name: name.trim() });
        } catch (error) {
            console.error("Error adding programmer:", error);
            showModal("Failed to add programmer.");
        }
    }, [showModal]);
    
    const removeProgrammer = useCallback((programmerId: string, programmerName: string) => {
        showConfirmation(`Are you sure you want to remove programmer "${programmerName}"?`, async () => {
            try {
                await deleteDoc(doc(db, 'programmers', programmerId));
                const q = query(collection(db, "jobs"), where("programmerId", "==", programmerId));
                const querySnapshot = await getDocs(q);
                const batch = writeBatch(db);
                querySnapshot.forEach((jobDoc) => {
                    batch.update(doc(db, 'jobs', jobDoc.id), { programmerId: deleteField(), programmerName: deleteField() });
                });
                await batch.commit();
            } catch (error) {
                console.error("Error removing programmer:", error);
                showModal("Failed to remove programmer.");
            }
        });
    }, [showConfirmation, showModal]);

    const handleRenameProgrammer = useCallback(async (programmerId: string, newName: string) => {
        try {
            await updateDoc(doc(db, 'programmers', programmerId), { name: newName.trim() });
            const q = query(collection(db, "jobs"), where("programmerId", "==", programmerId));
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.forEach((jobDoc) => {
                batch.update(doc(db, 'jobs', jobDoc.id), { programmerName: newName.trim() });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error renaming programmer:", error);
            showModal("Failed to rename programmer.");
        }
    }, [showModal]);

    // --- Chat Functions ---
    const sendMessage = async (recipient: OfficialStaff | Operator, text: string) => {
        if (!currentUser || !text.trim()) return;
        try {
            const newMessage = {
                participants: [currentUser.id, recipient.id].sort(),
                senderId: currentUser.id, senderName: currentUser.name,
                recipientId: recipient.id, recipientName: recipient.name,
                text: text.trim(),
                timestamp: new Date().toISOString(), isRead: false,
            };
            await addDoc(collection(db, 'messages'), newMessage);
        } catch (error) {
            console.error("Error sending message:", error);
            showModal("Failed to send message.");
        }
    };

    const markMessagesAsRead = async (participantId: string) => {
        if (!currentUser) return;
        try {
            const q = query(collection(db, 'messages'),
                where('recipientId', '==', currentUser.id),
                where('senderId', '==', participantId),
                where('isRead', '==', false));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return;
            const batch = writeBatch(db);
            snapshot.docs.forEach(docSnap => batch.update(docSnap.ref, { isRead: true }));
            await batch.commit();
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };


    // --- Core Application Logic ---
    // Note: The rest of the application logic remains largely the same, as it manipulates the local state
    // which is now being kept in sync with Firestore by the onSnapshot listeners.
    // The core change is that all mutation functions now write to Firestore, which then triggers the
    // onSnapshot listeners to update the local state, completing the data loop.

    // --- Modal Closing Handlers (Wrapped in useCallback for stability) ---
    const closeJobActionsModal = useCallback(() => setShowJobActionsModal(false), []);
    const closeDrawingModal = useCallback(() => setShowDrawingModal(false), []);
    const closeProductJobModal = useCallback(() => {
        setShowProductJobModal(false);
        setSelectedProductJobId(null);
    }, []);
    const closeJobDetailModal = useCallback(() => setShowJobDetailModal(false), []);
    const closeReworkModal = useCallback(() => setShowReworkModal(false), []);
    const closeAssignmentModal = useCallback(() => setShowAssignmentModal(false), []);

    const closeJobAssignmentModal = useCallback(() => {
        setShowJobAssignmentModal(false);
        setJobAssignmentData(null);
    }, []);

    const closeProgrammingJobAssignmentModal = useCallback(() => {
        setShowProgrammingJobAssignmentModal(false);
        setJobAssignmentDataProg(null);
    }, []);

    const closeFinishDesignModal = useCallback(() => {
        setShowFinishDesignModal(false);
        setJobToFinishDesign(null);
    }, []);
    
    const closeDesignDetailModal = useCallback(() => {
        setShowDesignDetailModal(false);
        setSelectedDesignJob(null);
    }, []);
    
    const closeProgrammingDetailModal = useCallback(() => {
        setShowProgrammingDetailModal(false);
        setSelectedProgrammingJob(null);
    }, []);


    const closeCompletedJobReportModal = useCallback(() => {
        setShowCompletedJobReportModal(false);
        setSelectedJobForReport(null);
    }, []);
    
    const closeMaterialStockModal = useCallback(() => {
        setShowMaterialStockModal(false);
        setStockModalData(null);
    }, []);
    
    const closeSalesRequestModal = useCallback(() => {
        setShowSalesRequestModal(false);
        setSalesRequestData(null);
    }, []);

    const closePlanningDelayModal = useCallback(() => {
        setShowPlanningDelayModal(false);
        setPlanningDelayData(null);
    }, []);
    
    const closePreCncHoldModal = useCallback(() => {
        setShowPreCncHoldModal(false);
        setPreCncHoldModalData(null);
    }, []);

    const closePlanningMaterialDelayModal = useCallback(() => {
        setShowPlanningMaterialDelayModal(false);
        setPlanningMaterialDelayData(null);
    }, []);
    
    const closeProductDelayModal = useCallback(() => {
        setShowProductDelayModal(false);
        setProductDelayData(null);
    }, []);
    
    const closeFinalReportModal = useCallback(() => {
        setShowFinalReportModal(false);
        setReportModalData(null);
    }, []);


    // --- Modal Opening Handlers ---
    const openJobActionsModal = (job: Job, department: string, qcEnabled: boolean = false) => {
        setJobActionsModalData({ jobId: job.id, department, qcEnabled });
        setShowJobActionsModal(true);
    };

    const openProductJobModal = (job: Job) => {
        setSelectedProductJobId(job.id);
        setShowProductJobModal(true);
    };

    const openJobDetailModal = (job: Job) => {
        setSelectedJobForDetail(job);
        setShowJobDetailModal(true);
    };

    const openCompletedJobReportModal = (job: Job) => {
        setSelectedJobForReport(job);
        setShowCompletedJobReportModal(true);
    };
    
    const openAddDrawingModal = (jobId: string, department: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (job) {
            setCurrentJobForDrawing(job);
            setCurrentDrawingToEdit(null);
            setDrawingModalDepartment(department);
            setShowDrawingModal(true);
        }
    };
    const openEditDrawingModal = (jobId: string, drawing: Drawing, department: string) => {
        const job = jobs.find(j => j.id === jobId);
         if (job) {
            setCurrentJobForDrawing(job);
            setCurrentDrawingToEdit(drawing);
            setDrawingModalDepartment(department);
            setShowDrawingModal(true);
        }
    };
    
    const openMaterialStockModal = (jobId: string, drawingId: string) => {
        const job = jobs.find(j => j.id === jobId);
        const drawing = job?.drawings?.find(d => d.id === drawingId);
        if (job && drawing) {
            setStockModalData({ job, drawing });
            setShowMaterialStockModal(true);
        }
    };

    const openPlanningMaterialDelayModal = (jobId: string, drawingId: string) => {
        const job = jobs.find(j => j.id === jobId);
        const drawing = job?.drawings?.find(d => d.id === drawingId);
        if (job && drawing) {
            setPlanningMaterialDelayData({ job, drawing });
            setShowPlanningMaterialDelayModal(true);
        }
    };
    
    const openProductDelayModal = useCallback((jobId: string, productId: string, availabilityDate: string) => {
        const job = jobs.find(j => j.id === jobId);
        const productItem = job?.products?.find(p => p.productId === productId);
        if (job && productItem) {
            setProductDelayData({ job, productItem, availabilityDate });
            setShowProductDelayModal(true);
            closeProductJobModal();
        }
    }, [jobs, closeProductJobModal]);

    const handleOpenFinalReportModal = (job: Job, drawing: Drawing) => {
        setReportModalData({ job, drawing, reportToEdit: null });
        setShowFinalReportModal(true);
    };

    const handleOpenEditFinalReportModal = (job: Job, drawing: Drawing) => {
        if (drawing.finalReport) {
            setReportModalData({ job, drawing, reportToEdit: drawing.finalReport });
            setShowFinalReportModal(true);
        }
    };

    // --- Core Application Logic Handlers ---
    const getUpdatedDrawingStatus = useCallback((drawing: Drawing, job: Job): string => {
        if (drawing.replanRequired) return 'Planning';

        const sortedProcesses = [...(drawing.processes || [])].sort((a, b) => a.sequence - b.sequence);

        const request = job.salesUpdateRequest;
        if (request?.source === 'planning' && request.drawingId === drawing.id) {
            if (request.status === 'pending' || request.status === 'rejected') {
                return 'Planning';
            }
        }
        
        if (drawing.isUnderRework) return drawing.currentDepartment;
        if (drawing.currentDepartment === "Hold") return "Hold";
        if (drawing.currentDepartment === "Design") return "Design";

        if (drawing.materialStatus !== 'Ready') {
            return "Planning";
        }

        if (sortedProcesses.length === 0) return "Planning";
        
        const firstIncompleteProcess = sortedProcesses.find(p => !p.completed || !p.qualityCheckCompleted);
        if (firstIncompleteProcess) {
            return getDepartmentForProcess(firstIncompleteProcess.name) || "Planning";
        }

        return drawing.finalQcApproved ? "Final Quality Check" : "Final Quality Check";
    }, [getDepartmentForProcess]);

    const handleSaveDrawing = useCallback((drawingName: string, quantity: number, processesToSave: Process[]) => {
        if (!currentJobForDrawing) return;
        const job = jobs.find(j => j.id === currentJobForDrawing.id);
        if (!job) return;

        setShowDrawingModal(false);

        const drawingProcesses = processesToSave.map(p => {
            const existing = currentDrawingToEdit?.processes.find(ep => ep.sequence === p.sequence);
            return { ...(existing || {}), ...p };
        });

        let updatedDrawings;
        if (currentDrawingToEdit) { // Edit
            updatedDrawings = (job.drawings || []).map(d => {
                if (d.id === currentDrawingToEdit.id) {
                    const temp = { ...d, name: drawingName.trim(), quantity, processes: drawingProcesses, replanRequired: false };
                    return { ...temp, currentDepartment: getUpdatedDrawingStatus(temp, job) };
                }
                return d;
            });
        } else { // Add
            const newDrawing: Drawing = {
                id: `id-${Date.now()}`, name: drawingName.trim(), quantity, materialStatus: 'Pending',
                processes: drawingProcesses, currentDepartment: job.designRequired ? "Design" : "Planning",
                previousDepartment: null, reworkCount: 0, reworkHistory: [], isUnderRework: false,
                reworkOriginProcess: null, designCompletedDate: null, finalQcApproved: false,
                finalQcComment: "", finalQcApprovedAt: null,
            };
            updatedDrawings = [...(job.drawings || []), newDrawing];
        }

        const needsProgramming = updatedDrawings.some(d =>
            d.processes.some(p => p.programmingRequired)
        );
    
        const updatePayload: { [key: string]: any } = { drawings: updatedDrawings };
        if (needsProgramming) {
            updatePayload.programmingRequired = true;
        }

        const drawingIdBeingSaved = currentDrawingToEdit?.id;
        if (drawingIdBeingSaved && job.salesUpdateRequest?.status === 'rejected' && job.salesUpdateRequest.drawingId === drawingIdBeingSaved) {
            updatePayload.salesUpdateRequest = 'DELETE_FIELD';
        }

        updateJobInFirestore(job.id, updatePayload);
    }, [jobs, currentJobForDrawing, currentDrawingToEdit, updateJobInFirestore, getUpdatedDrawingStatus]);

    const handleDrawingDateConflict = (job: Job, drawingToEdit: Drawing | null, drawingName: string, quantity: number, processes: Process[]) => {
        setPlanningDelayData({ job, drawingName, quantity, processes, drawingToEdit });
        setShowPlanningDelayModal(true);
        closeDrawingModal();
    };

    const handleSendPlanningDelayRequest = useCallback(async (newFinishDate: string, reason: string) => {
        if (!planningDelayData) return;
        const { job, drawingName, quantity, processes, drawingToEdit } = planningDelayData;
    
        const drawingProcesses = processes.map(p => ({ ...(drawingToEdit?.processes.find(ep => ep.sequence === p.sequence) || {}), ...p }));

        let updatedDrawings;
        let drawingIdForRequest: string;

        if (drawingToEdit) { // Edit
            drawingIdForRequest = drawingToEdit.id;
            updatedDrawings = job.drawings.map(d => {
                if (d.id === drawingToEdit.id) {
                    const temp = { ...d, name: drawingName.trim(), quantity, processes: drawingProcesses, replanRequired: false };
                    return { ...temp, currentDepartment: getUpdatedDrawingStatus(temp, { ...job, salesUpdateRequest: { status: 'pending' } } as Job) };
                }
                return d;
            });
        } else { // Add
            const newDrawing: Drawing = {
                id: `id-${Date.now()}`, name: drawingName.trim(), quantity, materialStatus: 'Pending',
                processes: drawingProcesses, currentDepartment: job.designRequired ? "Design" : "Planning",
                previousDepartment: null, reworkCount: 0, reworkHistory: [], isUnderRework: false,
                reworkOriginProcess: null, designCompletedDate: null, finalQcApproved: false,
                finalQcComment: "", finalQcApprovedAt: null,
            };
            drawingIdForRequest = newDrawing.id;
            updatedDrawings = [...(job.drawings || []), newDrawing];
        }

        const salesRequest: Job['salesUpdateRequest'] = {
            requestedDate: newFinishDate, reason, requestedAt: new Date().toISOString(), status: 'pending', source: 'planning', drawingId: drawingIdForRequest
        };

        const needsProgramming = updatedDrawings.some(d => d.processes.some(p => p.programmingRequired));
    
        await updateJobInFirestore(job.id, { drawings: updatedDrawings, salesUpdateRequest: salesRequest, programmingRequired: needsProgramming || job.programmingRequired });
        closePlanningDelayModal();
    }, [planningDelayData, updateJobInFirestore, getUpdatedDrawingStatus, closePlanningDelayModal]);
    
    const handleSendMaterialDelayRequestFromPlanning = useCallback(async (newFinishDate: string, reason: string) => {
        if (!planningMaterialDelayData) return;
        const { job, drawing } = planningMaterialDelayData;
        const salesRequest: Job['salesUpdateRequest'] = {
            requestedDate: newFinishDate, reason, requestedAt: new Date().toISOString(), status: 'pending', source: 'planning', drawingId: drawing.id
        };
        await updateJobInFirestore(job.id, { salesUpdateRequest: salesRequest });
        closePlanningMaterialDelayModal();
    }, [planningMaterialDelayData, updateJobInFirestore, closePlanningMaterialDelayModal]);

    const handleSendProductDelayRequest = useCallback(async (newFinishDate: string, reason: string) => {
        if (!productDelayData) return;
        const { job, productItem, availabilityDate } = productDelayData;
        const salesRequest: Job['salesUpdateRequest'] = {
            requestedDate: newFinishDate, reason, requestedAt: new Date().toISOString(), status: 'pending', source: 'stores', productId: productItem.productId
        };
        const updatedProducts = job.products!.map(p => p.productId === productItem.productId ? { ...p, status: 'Awaiting Stock' as const, availabilityDate } : p );
        await updateJobInFirestore(job.id, { salesUpdateRequest: salesRequest, products: updatedProducts });
        closeProductDelayModal();
    }, [productDelayData, updateJobInFirestore, closeProductDelayModal]);

    const deleteDrawing = useCallback((jobId: string, drawingId: string) => {
         showConfirmation("Are you sure you want to delete this drawing?", async () => {
            const job = jobs.find(j => j.id === jobId);
            if (job && job.drawings) {
                const updatedDrawings = job.drawings.filter(d => d.id !== drawingId);
                await updateJobInFirestore(jobId, { drawings: updatedDrawings });
            }
        });
    }, [jobs, updateJobInFirestore, showConfirmation]);

    const handleProcessCompletion = useCallback(async (jobId: string, drawingId: string, sequence: number, isCompleted: boolean) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.drawings) return;
        const drawing = job.drawings.find(d => d.id === drawingId);
        if (!drawing) return;

        const processToComplete = drawing.processes.find(p => p.sequence === sequence);
        if (isCompleted && processToComplete && (processToComplete.name === 'CNC Milling' || processToComplete.name === 'CNC Lathe') && processToComplete.programmingRequired && job.programmingFinished !== true) {
            showModal("Programming for this CNC process is not yet complete. The CNC process cannot be marked as finished.");
            return;
        }

        if (isCompleted) {
            const sortedProcesses = [...drawing.processes].sort((a, b) => a.sequence - b.sequence);
            const currentProcessIndex = sortedProcesses.findIndex(p => p.sequence === sequence);
            
            if (currentProcessIndex > -1 && currentProcessIndex + 1 < sortedProcesses.length) {
                const nextProcess = sortedProcesses[currentProcessIndex + 1];
                if ((nextProcess.name === 'CNC Milling' || nextProcess.name === 'CNC Lathe') && nextProcess.programmingRequired && job.programmingFinished !== true) {
                    const currentProcess = drawing.processes.find(p => p.sequence === sequence);
                    if (currentProcess) {
                        setPreCncHoldModalData({ job, drawing, process: currentProcess });
                        setShowPreCncHoldModal(true);
                        return;
                    }
                }
            }
        }
        
        const updatedDrawings = job.drawings.map(d => {
            if (d.id === drawingId) {
                const updatedProcesses = d.processes.map(p => p.sequence === sequence ? { ...p, completed: isCompleted, completedAt: isCompleted ? new Date().toISOString() : null, qualityCheckCompleted: isCompleted ? p.qualityCheckCompleted : false } : p);
                const temp = { ...d, processes: updatedProcesses };
                return { ...temp, currentDepartment: getUpdatedDrawingStatus(temp, job) };
            }
            return d;
        });
        await updateJobInFirestore(jobId, { drawings: updatedDrawings });
    }, [jobs, updateJobInFirestore, getUpdatedDrawingStatus, showModal]);

    const handlePreCncCompletion = useCallback(async (newFinishDate: string) => {
        if (!preCncHoldModalData) return;
        const { job, drawing, process } = preCncHoldModalData;
    
        const updatedDrawings = job.drawings.map(d => {
            if (d.id === drawing.id) {
                const updatedProcesses = d.processes.map(p => p.sequence === process.sequence ? { ...p, completed: true, completedAt: new Date().toISOString() } : p);
                const tempDrawing = { ...d, processes: updatedProcesses };
                const newDepartment = getUpdatedDrawingStatus(tempDrawing, job);
                return { ...tempDrawing, currentDepartment: newDepartment };
            }
            return d;
        });
    
        await updateJobInFirestore(job.id, { drawings: updatedDrawings, finishDate: newFinishDate });
        closePreCncHoldModal();
    }, [preCncHoldModalData, updateJobInFirestore, getUpdatedDrawingStatus, closePreCncHoldModal]);

    const handleQualityCheckCompletion = useCallback(async (jobId: string, drawingId: string, sequence: number, isChecked: boolean) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.drawings) return;
        const updatedDrawings = job.drawings.map(d => {
            if (d.id === drawingId) {
                const updatedProcesses = d.processes.map(p => p.sequence === sequence ? { ...p, qualityCheckCompleted: isChecked } : p);
                 const temp = { ...d, processes: updatedProcesses };
                return { ...temp, currentDepartment: getUpdatedDrawingStatus(temp, job) };
            }
            return d;
        });
        await updateJobInFirestore(jobId, { drawings: updatedDrawings });
    }, [jobs, updateJobInFirestore, getUpdatedDrawingStatus]);
    
    const handleSetMaterialReady = useCallback(async (jobId: string, drawingId: string) => {
        const jobToUpdate = jobs.find(job => job.id === jobId);
        if (!jobToUpdate || !jobToUpdate.drawings) return;
        let drawingToUpdate = jobToUpdate.drawings.find(d => d.id === drawingId);
        if (!drawingToUpdate) return;
    
        drawingToUpdate = { ...drawingToUpdate, materialStatus: 'Ready', expectedMaterialDate: null };
        drawingToUpdate.currentDepartment = getUpdatedDrawingStatus(drawingToUpdate, jobToUpdate);
        
        const updatedDrawings = jobToUpdate.drawings.map(d => d.id === drawingId ? drawingToUpdate : d);
        await updateJobInFirestore(jobId, { drawings: updatedDrawings });
    }, [jobs, updateJobInFirestore, getUpdatedDrawingStatus]);

    const handleSetMaterialAwaiting = useCallback(async (jobId: string, drawingId: string, expectedDate: string) => {
        const jobToUpdate = jobs.find(job => job.id === jobId);
        if (!jobToUpdate || !jobToUpdate.drawings) return;
        const updatedDrawings = jobToUpdate.drawings.map(d => d.id === drawingId ? { ...d, materialStatus: 'Awaiting Stock', expectedMaterialDate: expectedDate } : d);
        await updateJobInFirestore(jobId, { drawings: updatedDrawings });
        closeMaterialStockModal();
    }, [jobs, updateJobInFirestore, closeMaterialStockModal]);
    
    const handleMaterialDelayReturnToPlanning = useCallback(async (jobId: string, drawingId: string, expectedDate: string) => {
        const jobToUpdate = jobs.find(job => job.id === jobId);
        if (!jobToUpdate || !jobToUpdate.drawings) return;
        const updatedDrawings = jobToUpdate.drawings.map(d => d.id === drawingId ? { ...d, materialStatus: 'Awaiting Stock', expectedMaterialDate: expectedDate, currentDepartment: 'Planning', replanRequired: true } : d);
        await updateJobInFirestore(jobId, { drawings: updatedDrawings });
        closeMaterialStockModal();
    }, [jobs, updateJobInFirestore, closeMaterialStockModal]);

    const handleApproveSalesRequest = useCallback(async (jobId: string, newFinishDate: string) => {
        const jobToUpdate = jobs.find(j => j.id === jobId);
        if (!jobToUpdate || !jobToUpdate.salesUpdateRequest) return;
        showConfirmation(`Approve finish date change for ${jobToUpdate.jobNumber} to ${newFinishDate}?`, async () => {
            const request = jobToUpdate.salesUpdateRequest;
            const updatePayload: Partial<Job> = { finishDate: newFinishDate, salesUpdateRequest: { ...request, status: 'approved' } };
            if (request.source === 'planning' && request.drawingId) {
                const drawingToUpdate = jobToUpdate.drawings?.find(d => d.id === request.drawingId);
                if (drawingToUpdate) {
                    const latestProcessDate = drawingToUpdate.processes.reduce((max, p) => (p.plannedDate && p.plannedDate > max ? p.plannedDate : max), '');
                    if (!latestProcessDate || new Date(newFinishDate) >= new Date(latestProcessDate)) {
                        const newJobStateForEval: Job = { ...jobToUpdate, finishDate: newFinishDate, salesUpdateRequest: { ...request, status: 'approved' } };
                        const newDepartment = getUpdatedDrawingStatus(drawingToUpdate, newJobStateForEval);
                        if (newDepartment !== drawingToUpdate.currentDepartment) {
                            const updatedDrawings = jobToUpdate.drawings!.map(d => d.id === request.drawingId ? { ...d, currentDepartment: newDepartment } : d );
                            updatePayload.drawings = updatedDrawings;
                            showModal("Job finish date updated and workflow advanced.");
                        } else {
                            showModal("Job finish date has been updated.");
                        }
                    } else {
                        showModal(`Date updated to ${newFinishDate}. The planner must revise the process schedule to meet this new deadline.`);
                    }
                }
            } else {
                 showModal("Job finish date has been updated.");
            }
            await updateJobInFirestore(jobId, updatePayload);
        });
    }, [jobs, updateJobInFirestore, showConfirmation, showModal, getUpdatedDrawingStatus]);

    const handleRejectSalesRequest = useCallback(async (jobId: string, reason: string) => {
        const jobToUpdate = jobs.find(j => j.id === jobId);
        if (!jobToUpdate || !jobToUpdate.salesUpdateRequest) return;

        showConfirmation(`Reject this date change request for ${jobToUpdate.jobNumber}?`, async () => {
             await updateJobInFirestore(jobId, { 'salesUpdateRequest.status': 'rejected', 'salesUpdateRequest.salesNote': reason });
            showModal("Request has been rejected.");
        });
    }, [jobs, updateJobInFirestore, showConfirmation, showModal]);
    
    const handleQualityCheckCommentChange = useCallback((jobId: string, drawingId: string, processSequence: number, comment: string) => {
        const jobToUpdate = jobs.find(job => job.id === jobId);
        if (!jobToUpdate || !jobToUpdate.drawings) return;
        const updatedDrawings = jobToUpdate.drawings.map(drawing => {
            if (drawing.id === drawingId) {
                const updatedProcesses = drawing.processes.map(p => p.sequence === processSequence ? { ...p, qualityCheckComment: comment } : p);
                return { ...drawing, processes: updatedProcesses };
            }
            return drawing;
        });
        updateJobInFirestore(jobId, { drawings: updatedDrawings });
    }, [jobs, updateJobInFirestore]);
    
    const handleFinalQcApproval = useCallback(async (jobId: string, drawingId: string, isApproved: boolean) => {
        const jobToUpdate = jobs.find(job => job.id === jobId);
        if (!jobToUpdate || !jobToUpdate.drawings) return;
        const updatedDrawings = jobToUpdate.drawings.map(d => d.id === drawingId ? { ...d, finalQcApproved: isApproved, finalQcApprovedAt: isApproved ? new Date().toISOString() : null } : d );
        await updateJobInFirestore(jobId, { drawings: updatedDrawings });
    }, [jobs, updateJobInFirestore]);
    
    const handleFinalQcCommentChange = useCallback((jobId: string, drawingId: string, comment: string) => {
        const jobToUpdate = jobs.find(job => job.id === jobId);
        if (!jobToUpdate || !jobToUpdate.drawings) return;
        const updatedDrawings = jobToUpdate.drawings.map(d => d.id === drawingId ? { ...d, finalQcComment: comment } : d);
        updateJobInFirestore(jobId, { drawings: updatedDrawings });
    }, [jobs, updateJobInFirestore]);
    
    const handleSaveFinalReport = useCallback(async (jobId: string, drawingId: string, report: FinalReport) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.drawings) return;

        let allDrawingsComplete = true;
        const updatedDrawings = job.drawings.map(d => {
            if (d.id === drawingId) {
                const updatedDrawing = { ...d, finalReport: report, currentDepartment: "Completed" };
                 if (updatedDrawing.currentDepartment !== 'Completed') {
                    allDrawingsComplete = false;
                }
                return updatedDrawing;
            }
            if (d.currentDepartment !== 'Completed') {
                allDrawingsComplete = false;
            }
            return d;
        });

        const updatePayload: Partial<Job> = { drawings: updatedDrawings };
        if (allDrawingsComplete) {
            updatePayload.completedAt = new Date().toISOString();
        }

        await updateJobInFirestore(jobId, updatePayload);
        closeFinalReportModal();
        closeJobActionsModal();
        showModal("Report saved successfully.");
    }, [jobs, updateJobInFirestore, closeFinalReportModal, closeJobActionsModal, showModal]);
    
    const handleReadyForPlanning = useCallback(async (jobId: string) => {
        if (currentUser && 'permissions' in currentUser && !currentUser.permissions.includes('Head Of Designer')) {
            showModal("Access Denied: Only the Head of Designer can send a job to planning.");
            return;
        }
        const jobToUpdate = jobs.find(job => job.id === jobId);
        if (!jobToUpdate || !jobToUpdate.drawings || jobToUpdate.drawings.length === 0) {
            showModal("Please add at least one drawing before sending to Planning.");
            return;
        }
        const updatedDrawings = jobToUpdate.drawings.map(d => ({ ...d, currentDepartment: "Planning", designCompletedDate: d.designCompletedDate || new Date().toISOString() }));
        await updateJobInFirestore(jobId, { drawings: updatedDrawings, designCompleted: true });
        closeJobActionsModal();
    }, [jobs, updateJobInFirestore, closeJobActionsModal, showModal, currentUser]);
    
    const handleSendDrawingToPlanning = useCallback(async (jobId: string, drawingId: string) => {
        if (currentUser && 'permissions' in currentUser && !currentUser.permissions.includes('Head Of Designer')) {
            showModal("Access Denied: Only the Head of Designer can send a drawing to planning.");
            return;
        }
        const jobToUpdate = jobs.find(job => job.id === jobId);
        if (!jobToUpdate || !jobToUpdate.drawings) return;
        const updatedDrawings = jobToUpdate.drawings.map(d => d.id === drawingId ? { ...d, currentDepartment: "Planning", designCompletedDate: new Date().toISOString() } : d);
        const allDrawingsOutOfDesign = updatedDrawings.every(d => d.currentDepartment !== "Design");
        await updateJobInFirestore(jobId, { drawings: updatedDrawings, designCompleted: allDrawingsOutOfDesign });
    }, [jobs, updateJobInFirestore, currentUser, showModal]);
    
    const openReworkModal = (jobId: string, drawing: Drawing) => {
        setReworkJobId(jobId); setReworkDrawingId(drawing.id); setReworkReason('');
        setReworkType('in-department'); setReworkTargetDepartment('');
        const completed = drawing.processes.filter(p => p.completed && p.qualityCheckCompleted).sort((a, b) => a.sequence - b.sequence);
        if (completed.length === 0) {
            showModal("No fully completed processes are available for rework.");
            return;
        }
        setReworkableProcesses(completed); setReworkProcessName(completed[0]?.name || ''); setShowReworkModal(true);
    };
    
    const handleReworkSubmission = useCallback(() => {
        if (!reworkProcessName || !reworkReason.trim() || (reworkType === 'cross-department' && !reworkTargetDepartment)) {
            showModal("Process, reason, and target department (if applicable) are required.");
            return;
        }
        const job = jobs.find(j => j.id === reworkJobId);
        if (!job || !job.drawings) return;
        setShowReworkModal(false);
        const updatedDrawings = job.drawings.map(d => {
            if (d.id === reworkDrawingId) {
                const reworkIdx = d.processes.findIndex(p => p.name === reworkProcessName);
                const processes = d.processes.map((p, i) => i >= reworkIdx ? { ...p, completed: false, completedAt: null, qualityCheckCompleted: false } : p);
                const newCount = (d.reworkCount || 0) + 1;
                const newHistory = { timestamp: new Date().toISOString(), processName: reworkProcessName, reason: reworkReason.trim(), reworkType, targetDepartment: reworkType === 'cross-department' ? reworkTargetDepartment : null, reworkCount: newCount };
                return { ...d, processes, reworkCount: newCount, reworkHistory: [...(d.reworkHistory || []), newHistory], isUnderRework: reworkType === 'cross-department', reworkOriginProcess: reworkType === 'cross-department' ? reworkProcessName : null, finalQcApproved: false, currentDepartment: reworkType === 'cross-department' ? reworkTargetDepartment : (getDepartmentForProcess(reworkProcessName) || d.currentDepartment) };
            }
            return d;
        });
        updateJobInFirestore(reworkJobId!, { drawings: updatedDrawings });
    }, [jobs, reworkJobId, reworkDrawingId, reworkProcessName, reworkReason, reworkType, reworkTargetDepartment, getDepartmentForProcess, showModal, updateJobInFirestore]);
    
    const handleReworkCompleted = useCallback(async (jobId: string, drawingId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.drawings) return;
        const updatedDrawings = job.drawings.map(d => {
            if (d.id === drawingId) {
                const temp = { ...d, isUnderRework: false, reworkOriginProcess: null };
                return { ...temp, currentDepartment: getUpdatedDrawingStatus(temp, job) };
            }
            return d;
        });
        await updateJobInFirestore(jobId, { drawings: updatedDrawings });
        closeJobActionsModal();
    }, [jobs, updateJobInFirestore, getUpdatedDrawingStatus, closeJobActionsModal]);
    
    const handleDropJobOnDesigner = (jobId: string, designer: Designer) => {
        const job = jobs.find(j => j.id === jobId);
        if (job) {
            setJobAssignmentData({ job, designer });
            setShowJobAssignmentModal(true);
        }
    };

    const handleConfirmJobAssignment = useCallback((targetDate: string) => {
        if (!jobAssignmentData) return;
        const { job, designer } = jobAssignmentData;
        setShowJobAssignmentModal(false); setJobAssignmentData(null);
        updateJobInFirestore(job.id, { designerId: designer.id, designerName: designer.name, designTargetDate: targetDate, designerStatus: 'Pending', designerHoldHistory: [] });
    }, [jobAssignmentData, updateJobInFirestore]);
    
    const handleStartDesign = (jobId: string) => updateJobInFirestore(jobId, { designerStatus: 'In Progress', designerStartedAt: new Date().toISOString() });
    
    const handleOpenDesignerHoldModal = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (job) {
            setJobToHoldDesign(job); setDesignerHoldReason(''); setShowDesignerHoldModal(true);
        }
    };

    const handleConfirmDesignerHold = useCallback(() => {
        if (!jobToHoldDesign || !designerHoldReason.trim()) return showModal("A reason is required to put the design on hold.");
        const newHistoryEntry = { holdAt: new Date().toISOString(), resumeAt: null, reason: designerHoldReason.trim() };
        updateJobInFirestore(jobToHoldDesign.id, { designerStatus: 'On Hold', designerHoldHistory: [...(jobToHoldDesign.designerHoldHistory || []), newHistoryEntry] });
        setShowDesignerHoldModal(false); setJobToHoldDesign(null); setDesignerHoldReason('');
    }, [jobToHoldDesign, designerHoldReason, showModal, updateJobInFirestore]);

    const handleResumeDesign = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.designerHoldHistory) return;
        const updatedHistory = [...job.designerHoldHistory];
        const lastHold = updatedHistory[updatedHistory.length - 1];
        if (lastHold && !lastHold.resumeAt) lastHold.resumeAt = new Date().toISOString();
        updateJobInFirestore(jobId, { designerStatus: 'In Progress', designerHoldHistory: updatedHistory });
    };
    
    const handleOpenFinishDesignModal = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (job) { setJobToFinishDesign(job); setShowFinishDesignModal(true); }
    };

    const handleConfirmFinishDesign = useCallback((jobId: string, newDrawingsData: {name: string, quantity: number}[]) => {
        setShowFinishDesignModal(false); setJobToFinishDesign(null);
        const finalDrawings: Drawing[] = newDrawingsData.map(d => ({
            id: `id-${Date.now()}-${Math.random()}`, name: d.name, quantity: d.quantity, materialStatus: 'Pending', processes: [],
            currentDepartment: "Planning", previousDepartment: "Design", reworkCount: 0, reworkHistory: [], isUnderRework: false,
            reworkOriginProcess: null, designCompletedDate: new Date().toISOString(), finalQcApproved: false, finalQcComment: "", finalQcApprovedAt: null,
        }));
        updateJobInFirestore(jobId, { drawings: finalDrawings, designFinished: true, designerStatus: 'DELETE_FIELD', designerFinishedAt: new Date().toISOString() });
    }, [updateJobInFirestore]);
    
    const handleSendJobToPlanning = (jobId: string) => updateJobInFirestore(jobId, { designCompleted: true });
    
    const openDesignDetailModal = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (job) { setSelectedDesignJob(job); setShowDesignDetailModal(true); }
    };

    // --- Programming Advance Handlers ---
    const handleDropJobOnProgrammer = (jobId: string, programmer: Programmer) => {
        const job = jobs.find(j => j.id === jobId);
        if (job) { setJobAssignmentDataProg({ job, programmer }); setShowProgrammingJobAssignmentModal(true); }
    };

    const handleConfirmProgrammerJobAssignment = useCallback((targetDate: string) => {
        if (!jobAssignmentDataProg) return;
        const { job, programmer } = jobAssignmentDataProg;
        setShowProgrammingJobAssignmentModal(false); setJobAssignmentDataProg(null);
        updateJobInFirestore(job.id, { programmerId: programmer.id, programmerName: programmer.name, programmingTargetDate: targetDate, programmerStatus: 'Pending', programmerHoldHistory: [] });
    }, [jobAssignmentDataProg, updateJobInFirestore]);
    
    const handleStartProgramming = (jobId: string) => updateJobInFirestore(jobId, { programmerStatus: 'In Progress', programmerStartedAt: new Date().toISOString() });

    const handleOpenProgrammerHoldModal = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (job) { setJobToHoldProgramming(job); setProgrammerHoldReason(''); setShowProgrammerHoldModal(true); }
    };

    const handleConfirmProgrammerHold = useCallback(() => {
        if (!jobToHoldProgramming || !programmerHoldReason.trim()) return showModal("A reason is required to put programming on hold.");
        const newHistoryEntry = { holdAt: new Date().toISOString(), resumeAt: null, reason: programmerHoldReason.trim() };
        updateJobInFirestore(jobToHoldProgramming.id, { programmerStatus: 'On Hold', programmerHoldHistory: [...(jobToHoldProgramming.programmerHoldHistory || []), newHistoryEntry] });
        setShowProgrammerHoldModal(false); setJobToHoldProgramming(null); setProgrammerHoldReason('');
    }, [jobToHoldProgramming, programmerHoldReason, showModal, updateJobInFirestore]);

    const handleResumeProgramming = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.programmerHoldHistory) return;
        const updatedHistory = [...job.programmerHoldHistory];
        const lastHold = updatedHistory[updatedHistory.length - 1];
        if (lastHold && !lastHold.resumeAt) lastHold.resumeAt = new Date().toISOString();
        updateJobInFirestore(jobId, { programmerStatus: 'In Progress', programmerHoldHistory: updatedHistory });
    };
    
    const handleFinishProgramming = (jobId: string) => {
        showConfirmation("Are you sure you want to mark programming as complete for this job?", async () => {
            await updateJobInFirestore(jobId, { programmingFinished: true, programmerStatus: 'DELETE_FIELD', programmerFinishedAt: new Date().toISOString() });
            // The onSnapshot listener for jobs will automatically re-evaluate drawing statuses.
        });
    };
    
    const openProgrammingDetailModal = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (job) { setSelectedProgrammingJob(job); setShowProgrammingDetailModal(true); }
    };

    // --- Product Handlers ---
    const handleProductItemUpdate = useCallback(async (jobId: string, data: Partial<Job>) => {
        const updatePayload: Partial<Job> = { ...data };
        if (data.products?.every(p => p.status === 'Completed')) {
            updatePayload.completedAt = new Date().toISOString();
        }
        await updateJobInFirestore(jobId, updatePayload);
    }, [updateJobInFirestore]);

    const handleMarkAsDelivered = useCallback((jobId: string, deliveredDate: string) => {
        updateJobInFirestore(jobId, { deliveredAt: deliveredDate });
        closeCompletedJobReportModal();
    }, [updateJobInFirestore, closeCompletedJobReportModal]);

    // --- Work Place Handlers ---
    const handleAssignOperatorToProcess = useCallback(async (jobId: string, drawingId: string, processId: string, operatorId: string | null, isOvertime: boolean = false) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.drawings) return;
        const operator = operatorId ? operators.find(o => o.id === operatorId) : null;
        const updatedDrawings = job.drawings.map(d => {
            if (d.id === drawingId) {
                const updatedProcesses = d.processes.map(p => {
                    if (p.id === processId) {
                        if (operator) return { ...p, operatorId: operator.id, operatorName: operator.name, isOvertime };
                        const { operatorId: _operatorId, operatorName: _operatorName, isOvertime: _isOvertime, ...rest } = p; return rest;
                    }
                    return p;
                });
                return { ...d, processes: updatedProcesses };
            }
            return d;
        });
        await updateJobInFirestore(jobId, { drawings: updatedDrawings });
    }, [jobs, operators, updateJobInFirestore]);
    
    const handleOperatorStartProcess = useCallback((jobId: string, drawingId: string, processId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.drawings) return;
        const updatedDrawings = job.drawings.map(d => d.id === drawingId ? { ...d, processes: d.processes.map(p => p.id === processId ? { ...p, startedAt: new Date().toISOString(), isPaused: false } : p) } : d );
        updateJobInFirestore(jobId, { drawings: updatedDrawings });
    }, [jobs, updateJobInFirestore]);

    const handleOperatorHoldProcess = useCallback((jobId: string, drawingId: string, processId: string, reason: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.drawings) return;
        const updatedDrawings = job.drawings.map(d => {
            if (d.id === drawingId) {
                const updatedProcesses = d.processes.map(p => {
                    if (p.id === processId) {
                        const newHistoryEntry = { holdAt: new Date().toISOString(), resumeAt: null, reason: reason };
                        return { ...p, isPaused: true, pauseReason: reason, operatorHoldHistory: [...(p.operatorHoldHistory || []), newHistoryEntry] };
                    }
                    return p;
                });
                return { ...d, processes: updatedProcesses };
            }
            return d;
        });
        updateJobInFirestore(jobId, { drawings: updatedDrawings });
    }, [jobs, updateJobInFirestore]);
    
    const handleOperatorResumeProcess = useCallback((jobId: string, drawingId: string, processId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.drawings) return;
        const updatedDrawings = job.drawings.map(d => {
            if (d.id === drawingId) {
                const updatedProcesses = d.processes.map(p => {
                    if (p.id === processId) {
                        const updatedHistory = [...(p.operatorHoldHistory || [])];
                        if (updatedHistory.length > 0) updatedHistory[updatedHistory.length - 1].resumeAt = new Date().toISOString();
                        const { pauseReason, ...rest } = p;
                        return { ...rest, isPaused: false, operatorHoldHistory: updatedHistory };
                    }
                    return p;
                });
                return { ...d, processes: updatedProcesses };
            }
            return d;
        });
        updateJobInFirestore(jobId, { drawings: updatedDrawings });
    }, [jobs, updateJobInFirestore]);


    // --- Other Handlers ---
    const handleHoldDrawing = (jobId: string, drawingId: string) => { setJobToHold({ jobId, drawingId }); setShowHoldModal(true); };
    
    const confirmHoldDrawing = useCallback(() => {
        if (!jobToHold || !holdReason.trim()) return showModal("Reason is required.");
        const { jobId, drawingId } = jobToHold;
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.drawings) return;
        setShowHoldModal(false);
        const updatedDrawings = job.drawings.map(d => d.id === drawingId ? { ...d, previousDepartment: d.currentDepartment, currentDepartment: "Hold", holdReason: holdReason.trim() } : d);
        updateJobInFirestore(jobId, { drawings: updatedDrawings });
        setHoldReason(''); setJobToHold(null);
    }, [jobToHold, holdReason, jobs, updateJobInFirestore, showModal]);

    const handleResumeDrawing = (jobId: string, drawingId: string) => {
        setNewFinishDate(jobs.find(j => j.id === jobId)?.finishDate || '');
        setJobToResume({ jobId, drawingId }); setShowResumeModal(true);
    };
    
    const confirmResumeDrawing = useCallback(() => {
        if (!jobToResume || !newFinishDate) return showModal("New finish date is required.");
        const { jobId, drawingId } = jobToResume;
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.drawings) return;
        setShowResumeModal(false);
        const updatedDrawings = job.drawings.map(d => d.id === drawingId ? { ...d, currentDepartment: d.previousDepartment || "Planning", previousDepartment: null, holdReason: undefined } : d);
        updateJobInFirestore(jobId, { drawings: updatedDrawings, finishDate: newFinishDate });
        setNewFinishDate(''); setJobToResume(null);
    }, [jobToResume, newFinishDate, jobs, updateJobInFirestore, showModal]);

    const handleProceedSalesHoldJob = useCallback((jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return;
        const nextDepartment = job.designRequired ? "Design" : "Planning";
        const updatedDrawings = (job.drawings || []).map(d => ({ ...d, currentDepartment: nextDepartment }));
        updateJobInFirestore(jobId, { drawings: updatedDrawings, isHeldBySales: deleteField(), salesHoldReason: deleteField() });
        showModal(`Job ${job.jobNumber} has been released to ${nextDepartment}.`);
    }, [jobs, updateJobInFirestore, showModal]);

    // --- Print Handlers ---
    const openPrintModal = (department: string) => {
        const jobsInDept = activeJobs.filter(job => job.drawings && job.drawings.some(d => d.currentDepartment === department));
        setJobsToPrintInModal(jobsInDept);
        setDepartmentForPrinting(department);
        setShowPrintModal(true);
    };
    const handlePrintWorkOrder = (selectedJobs: Job[]) => {
        setPrintContent(<PrintLayout jobs={selectedJobs} department={departmentForPrinting} />);
        setShowPrintModal(false);
    };
    const handlePrintJobReport = (job: Job) => setPrintContent(<PrintableJobReport job={job} />);
    
    useEffect(() => {
        if (printContent) {
            const timer = setTimeout(() => { window.print(); setPrintContent(null); }, 100);
            return () => clearTimeout(timer);
        }
    }, [printContent]);

    const handlePortalSelection = (portal: PortalSection) => {
        if (portal === 'admin' && isAdminPortalLocked) {
            setPortalToAccess(portal);
            setShowStaffLoginModal(true);
        } else if (portal === 'admin') {
            const adminUser = officialStaff.find(s => s.empNumber === 'Admin');
            if (adminUser) {
                setCurrentUser(adminUser);
                setActivePortal('admin');
            } else {
                showModal("Admin user not found. Please log in manually.");
                setPortalToAccess(portal);
                setShowStaffLoginModal(true);
            }
        } else if (['sales', 'engineering', 'quality', 'production', 'logistics'].includes(portal)) {
            setPortalToAccess(portal);
            setShowStaffLoginModal(true);
        } else {
            setActivePortal(portal);
        }
    };

    const toggleAdminPortalLock = useCallback(() => {
        setIsAdminPortalLocked(prev => !prev);
        showModal(`Administration portal is now ${isAdminPortalLocked ? 'unlocked' : 'locked'}.`);
    }, [isAdminPortalLocked, showModal]);

    const hasPortalAccess = useCallback((userPermissions: PermissionArea[], portal: PortalSection): boolean => {
        const portalPermissionMap: { [key in PortalSection]?: string } = {
            sales: 'Sales & Quoting', engineering: 'Engineering', quality: 'Quality Assurance',
            production: 'Production Floor', logistics: 'Logistics & Inventory', admin: 'Administration',
        };
        const requiredPermission = portalPermissionMap[portal];
        if (!requiredPermission) return true;
        const getSelfAndDescendants = (nodeName: string, hierarchy: typeof PERMISSIONS_HIERARCHY): string[] => {
            const findNode = (name: string, nodes: typeof PERMISSIONS_HIERARCHY): (typeof PERMISSIONS_HIERARCHY[0]) | null => {
                for (const node of nodes) {
                    if (node.name === name) return node;
                    if (node.sub) { const found = findNode(name, node.sub); if (found) return found; }
                }
                return null;
            };
            const flatten = (node: typeof PERMISSIONS_HIERARCHY[0]): string[] => {
                let names: string[] = [node.name];
                if (node.sub) node.sub.forEach(child => { names = names.concat(flatten(child)); });
                return names;
            };
            const node = findNode(nodeName, hierarchy);
            return node ? flatten(node) : [nodeName];
        };
        const allowedPermissions = getSelfAndDescendants(requiredPermission, PERMISSIONS_HIERARCHY);
        return userPermissions.some(p => allowedPermissions.includes(p as PermissionArea));
    }, []);

    const handleStaffLogin = useCallback((employeeNumber: string, pin: string): { success: boolean; message?: string; } => {
        const staffMember = officialStaff.find(s => s.empNumber.toLowerCase() === employeeNumber.toLowerCase().trim());
        if (!staffMember || staffMember.pin !== pin) return { success: false, message: 'Invalid credentials.' };
        if (portalToAccess && !hasPortalAccess(staffMember.permissions, portalToAccess)) return { success: false, message: 'Access denied.' };
        setCurrentUser(staffMember);
        if (portalToAccess) setActivePortal(portalToAccess);
        setShowStaffLoginModal(false); setPortalToAccess(null);
        return { success: true };
    }, [officialStaff, portalToAccess, hasPortalAccess]);
    
    const handleOpenStaffChangePassword = () => setShowStaffChangePasswordModal(true);

    const onOpenMyProfile = () => setShowMyProfile(true);

    const handleUpdateStaffPassword = useCallback(async (currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
        if (!currentUser || !('position' in currentUser) || currentUser.pin !== currentPass) {
            return { success: false, message: 'Current password is incorrect.' };
        }
        const success = await updateOfficialStaff(currentUser.id, { pin: newPass });
        if(success) {
            setCurrentUser(prev => prev ? { ...prev, pin: newPass } : null);
            showModal('Password updated successfully!');
            return { success: true, message: 'Password updated successfully!' };
        } else {
            return { success: false, message: 'Failed to update password.' };
        }
    }, [currentUser, updateOfficialStaff, showModal]);


    const jobForActionsModal = jobActionsModalData.jobId ? jobs.find(j => j.id === jobActionsModalData.jobId) : null;
    const drawingsForAssignmentModal = assignmentData ? jobs.find(j => j.id === assignmentData.jobId)?.drawings?.filter(d => assignmentData.drawingIds.includes(d.id)) : null;
    const selectedProductJob = jobs.find(j => j.id === selectedProductJobId);

    const commonPortalProps = {
        jobs, products, designers, programmers, operators, officialStaff,
        activeJobs, allDepartments, allMachines, departmentProcessMap, allProcesses,
        notificationCounts, userId, showModal, showConfirmation, currentUser, setCurrentUser, messages, sendMessage, markMessagesAsRead,
        createJobInFirestore, deleteJobInFirestore, onProceedJob: handleProceedSalesHoldJob,
        updateSettingsInFirestore, addProduct, removeProduct, handleProductItemUpdate,
        addOperator, removeOperator, updateOperator, addOfficialStaff, removeOfficialStaff, updateOfficialStaff,
        addDesigner, removeDesigner, handleRenameDesigner, addProgrammer, removeProgrammer, handleRenameProgrammer,
        openJobActionsModal, openProductJobModal, openJobDetailModal, openCompletedJobReportModal,
        openAddDrawingModal, openEditDrawingModal, openMaterialStockModal, openPlanningMaterialDelayModal,
        openProductDelayModal, getDepartmentForProcess, openPrintModal,
        handleDropJobOnDesigner, handleOpenFinishDesignModal, handleStartDesign, handleOpenDesignerHoldModal,
        handleResumeDesign, openDesignDetailModal, handleDropJobOnProgrammer, handleFinishProgramming,
        handleStartProgramming, handleOpenProgrammerHoldModal, handleResumeProgramming, openProgrammingDetailModal,
        handleAssignOperatorToProcess, handleOperatorStartProcess, handleOperatorHoldProcess,
        handleOperatorResumeProcess, handleProcessCompletion, 
        onOpenStaffChangePassword: handleOpenStaffChangePassword, 
        onOpenMyProfile,
        isAdminPortalLocked, toggleAdminPortalLock,
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50 font-sans">
                <style>{`
                  @media print { 
                    body * { visibility: hidden; } 
                    .printable-area, .printable-area * { visibility: visible; } 
                    .printable-area { position: absolute; left: 0; top: 0; width: 100%; } 
                    .page-break-inside-avoid { page-break-inside: avoid; }
                  }
                `}</style>
                
                <InfoModal show={showInfoModal} message={modalMessage} onClose={() => setShowInfoModal(false)} />
                <ConfirmationModal show={showConfirmationModal} message={confirmationMessage} onConfirm={handleConfirm} onCancel={handleCancel} />
                <HoldModal show={showHoldModal} onClose={() => setShowHoldModal(false)} onConfirm={confirmHoldDrawing} holdReason={holdReason} setHoldReason={setHoldReason} />
                <HoldModal show={showDesignerHoldModal} onClose={() => setShowDesignerHoldModal(false)} onConfirm={handleConfirmDesignerHold} holdReason={designerHoldReason} setHoldReason={setDesignerHoldReason} />
                <HoldModal show={showProgrammerHoldModal} onClose={() => setShowProgrammerHoldModal(false)} onConfirm={handleConfirmProgrammerHold} holdReason={programmerHoldReason} setHoldReason={setProgrammerHoldReason} />
                <ResumeModal show={showResumeModal} onClose={() => setShowResumeModal(false)} onConfirm={confirmResumeDrawing} newFinishDate={newFinishDate} setNewFinishDate={setNewFinishDate} />
                <PrintModal show={showPrintModal} onClose={() => setShowPrintModal(false)} jobs={jobsToPrintInModal} department={departmentForPrinting} onPrint={handlePrintWorkOrder} />
                {showDrawingModal && <DrawingModal onClose={closeDrawingModal} onSave={handleSaveDrawing} onDateConflict={(drawingName, quantity, processes) => handleDrawingDateConflict(currentJobForDrawing!, currentDrawingToEdit, drawingName, quantity, processes)} job={currentJobForDrawing!} drawingToEdit={currentDrawingToEdit} showModal={showModal} allMachines={allMachines} onUpdateMachines={(data) => updateSettingsInFirestore('machines', 'machineList', data)} allProcesses={allProcesses} onUpdateProcesses={(data) => updateSettingsInFirestore('settings', 'processConfig', {processes: data})} department={drawingModalDepartment!} />}
                {showJobActionsModal && jobForActionsModal && <JobActionsModal show={showJobActionsModal} onClose={closeJobActionsModal} job={jobForActionsModal} department={jobActionsModalData.department!} qcEnabled={jobActionsModalData.qcEnabled} triggerDeleteJob={deleteJobInFirestore} handleResumeDrawing={handleResumeDrawing} handleHoldDrawing={handleHoldDrawing} openReworkModal={openReworkModal} openEditDrawingModal={openEditDrawingModal} triggerDeleteDrawing={deleteDrawing} handleSetMaterialReady={handleSetMaterialReady} handleProcessCompletion={handleProcessCompletion} handleQualityCheckCompletion={handleQualityCheckCompletion} handleQualityCheckCommentChange={handleQualityCheckCommentChange} handleFinalQcApproval={handleFinalQcApproval} handleFinalQcCommentChange={handleFinalQcCommentChange} handleReworkCompleted={handleReworkCompleted} openAddDrawingModal={openAddDrawingModal} handleReadyForPlanning={handleReadyForPlanning} handleSendDrawingToPlanning={handleSendDrawingToPlanning} getDepartmentForProcess={getDepartmentForProcess} openMaterialStockModal={openMaterialStockModal} openPlanningMaterialDelayModal={openPlanningMaterialDelayModal} currentUser={currentUser} onOpenFinalReportModal={handleOpenFinalReportModal} />}
                {showProductJobModal && selectedProductJob && <ProductJobModal show={showProductJobModal} onClose={closeProductJobModal} job={selectedProductJob} onUpdate={handleProductItemUpdate} onRequestDateChange={(productId, availabilityDate) => openProductDelayModal(selectedProductJob.id, productId, availabilityDate)} />}
                {showJobDetailModal && <JobDetailModal job={selectedJobForDetail} onClose={closeJobDetailModal} />}
                {showReworkModal && <ReworkModal allDepartments={allDepartments} onClose={closeReworkModal} onRework={handleReworkSubmission} jobNumber={jobs.find(j => j.id === reworkJobId)?.jobNumber || ''} drawingName={jobs.find(j => j.id === reworkJobId)?.drawings?.find(d => d.id === reworkDrawingId)?.name || ''} reworkableProcesses={reworkableProcesses} reworkProcessName={reworkProcessName} setReworkProcessName={setReworkProcessName} reworkReason={reworkReason} setReworkReason={setReworkReason} reworkType={reworkType} setReworkType={setReworkType} reworkTargetDepartment={reworkTargetDepartment} setReworkTargetDepartment={setReworkTargetDepartment} />}
                {showAssignmentModal && assignmentData && drawingsForAssignmentModal && <AssignmentModal show={showAssignmentModal} onClose={closeAssignmentModal} onConfirm={() => {}} job={jobs.find(j => j.id === assignmentData.jobId)!} drawings={drawingsForAssignmentModal} designer={assignmentData.designer} />}
                {showJobAssignmentModal && jobAssignmentData && <JobAssignmentModal show={showJobAssignmentModal} onClose={closeJobAssignmentModal} onConfirm={handleConfirmJobAssignment} job={jobAssignmentData.job} designer={jobAssignmentData.designer} />}
                {showProgrammingJobAssignmentModal && jobAssignmentDataProg && <ProgrammingJobAssignmentModal show={showProgrammingJobAssignmentModal} onClose={closeProgrammingJobAssignmentModal} onConfirm={handleConfirmProgrammerJobAssignment} job={jobAssignmentDataProg.job} programmer={jobAssignmentDataProg.programmer} />}
                {showFinishDesignModal && jobToFinishDesign && <FinishDesignModal show={showFinishDesignModal} onClose={closeFinishDesignModal} onConfirm={handleConfirmFinishDesign} job={jobToFinishDesign} />}
                {showDesignDetailModal && selectedDesignJob && <DesignJobDetailModal show={showDesignDetailModal} onClose={closeDesignDetailModal} job={selectedDesignJob} onSendToPlanning={handleSendJobToPlanning} currentUser={currentUser} />}
                {showProgrammingDetailModal && selectedProgrammingJob && <ProgrammingJobDetailModal show={showProgrammingDetailModal} onClose={closeProgrammingDetailModal} job={selectedProgrammingJob} />}
                {showCompletedJobReportModal && selectedJobForReport && <CompletedJobReportModal show={showCompletedJobReportModal} job={selectedJobForReport} onClose={closeCompletedJobReportModal} onMarkAsDelivered={handleMarkAsDelivered} onPrint={handlePrintJobReport} />}
                {showMaterialStockModal && stockModalData && <MaterialStockModal show={showMaterialStockModal} onClose={closeMaterialStockModal} job={stockModalData.job} drawing={stockModalData.drawing} onSave={handleSetMaterialAwaiting} onReturnToPlanning={handleMaterialDelayReturnToPlanning} />}
                {showSalesRequestModal && salesRequestData && <SalesRequestModal show={showSalesRequestModal} onClose={closeSalesRequestModal} onConfirm={(reason) => { /* Logic to be implemented */ }} />}
                {showSalesNotificationModal && <SalesNotificationModal show={showSalesNotificationModal} onClose={() => setShowSalesNotificationModal(false)} jobsWithRequests={salesRequestJobs} onApprove={handleApproveSalesRequest} onReject={handleRejectSalesRequest} />}
                {showPlanningDelayModal && planningDelayData && <PlanningDelayRequestModal show={showPlanningDelayModal} onClose={closePlanningDelayModal} onConfirm={handleSendPlanningDelayRequest} job={planningDelayData.job} drawingName={planningDelayData.drawingName} processes={planningDelayData.processes} />}
                {showPreCncHoldModal && preCncHoldModalData && <PreCncHoldModal show={showPreCncHoldModal} onClose={closePreCncHoldModal} onConfirm={handlePreCncCompletion} job={preCncHoldModalData.job} drawing={preCncHoldModalData.drawing} process={preCncHoldModalData.process} />}
                {showPlanningMaterialDelayModal && planningMaterialDelayData && <PlanningMaterialDelayModal show={showPlanningMaterialDelayModal} onClose={closePlanningMaterialDelayModal} onConfirm={handleSendMaterialDelayRequestFromPlanning} job={planningMaterialDelayData.job} drawing={planningMaterialDelayData.drawing} />}
                {showProductDelayModal && productDelayData && <ProductDelayRequestModal show={showProductDelayModal} onClose={closeProductDelayModal} onConfirm={handleSendProductDelayRequest} job={productDelayData.job} productItem={productDelayData.productItem} availabilityDate={productDelayData.availabilityDate} />}
                {showStaffLoginModal && <StaffLoginModal show={showStaffLoginModal} onClose={() => setShowStaffLoginModal(false)} onLogin={handleStaffLogin} />}
                <StaffChangePasswordModal show={showStaffChangePasswordModal} onClose={() => setShowStaffChangePasswordModal(false)} onSave={handleUpdateStaffPassword} />
                {showFinalReportModal && reportModalData && <FinalReportModal show={showFinalReportModal} onClose={closeFinalReportModal} onSave={handleSaveFinalReport} job={reportModalData.job} drawing={reportModalData.drawing} currentUser={currentUser} reportToEdit={reportModalData.reportToEdit} />}
                
                <div className="hidden"><div className="printable-area" ref={printComponentRef}>{printContent}</div></div>
                
                {showMyProfile ? (
                    <MyProfile currentUser={currentUser} jobs={jobs} messages={messages} onBack={() => setShowMyProfile(false)} onOpenEditReport={handleOpenEditFinalReportModal} />
                ) : activePortal ? (
                    <Portal 
                        portal={activePortal} 
                        onGoHome={() => {
                            setActivePortal(null);
                            setCurrentUser(null);
                        }}
                        {...commonPortalProps}
                        onOpenSalesNotifications={() => setShowSalesNotificationModal(true)}
                    />
                ) : (
                    <Home onSelectPortal={handlePortalSelection} />
                )}
            </div>
        </>
    );
}

export default App;
