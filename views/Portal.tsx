





import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Job, Drawing, Process, MachinesMap, PortalSection, Product, Designer, ProductOrderItem, Programmer, Operator, OfficialStaff, PortalView, ChatMessage } from '../types';
import { HomeIcon, BellIcon, UsersIcon, MessageSquareIcon, UserIcon, LogOutIcon, KeyIcon } from '../components/Icons';
import { Workflow } from './Workflow';
import { Dashboard } from './Dashboard';
import { CreateJob } from './CreateJob';
import { Admin } from './Admin';
import { DesignAdvance } from './DesignAdvance';
import { QualityChecking } from './QualityChecking';
import { ProgrammingAdvance } from './ProgrammingAdvance';
import { WorkPlace } from './WorkPlace';
import { ChatModal } from '../components/chat/ChatModal';

interface PortalProps {
    portal: PortalSection;
    onGoHome: () => void;
    
    // Data props
    jobs: Job[];
    activeJobs: Job[];
    products: Product[];
    designers: Designer[];
    programmers: Programmer[];
    operators: Operator[];
    officialStaff: OfficialStaff[];
    allDepartments: string[];
    allMachines: MachinesMap;
    departmentProcessMap: { [key:string]: string };
    allProcesses: string[];
    notificationCounts: { [key: string]: number };
    userId: string | null;

    // Chat Props
    currentUser: OfficialStaff | Operator | null;
    setCurrentUser: (user: OfficialStaff | Operator | null) => void;
    messages: ChatMessage[];
    sendMessage: (recipient: OfficialStaff | Operator, text: string) => Promise<void>;
    markMessagesAsRead: (participantId: string) => Promise<void>;

    // Handlers
    showModal: (message: string) => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    createJobInFirestore: (jobData: Omit<Job, 'id'>) => void;
    deleteJobInFirestore: (jobId: string) => void;
    onProceedJob: (jobId: string) => void;
    updateSettingsInFirestore: (collection: 'machines' | 'settings' | 'settings', doc: string, data: any) => void;
    addProduct: (name: string, description: string) => void;
    removeProduct: (productId: string) => void;
    handleProductItemUpdate: (jobId: string, data: Partial<Job>) => void;
    addOperator: (operatorData: Omit<Operator, 'id'>) => void;
    removeOperator: (operatorId: string) => void;
    updateOperator: (operatorId: string, data: Partial<Operator>) => void;
    addOfficialStaff: (staffData: Omit<OfficialStaff, 'id'>) => void;
    removeOfficialStaff: (staffId: string) => void;
    updateOfficialStaff: (staffId: string, data: Partial<OfficialStaff>) => void;
    addDesigner: (name: string) => void;
    removeDesigner: (id: string, name: string) => void;
    handleRenameDesigner: (id: string, newName: string) => void;
    addProgrammer: (name: string) => void;
    removeProgrammer: (id: string, name: string) => void;
    handleRenameProgrammer: (id: string, newName: string) => void;
    openJobActionsModal: (job: Job, department: string, qcEnabled?: boolean) => void;
    openProductJobModal: (job: Job) => void;
    openJobDetailModal: (job: Job) => void;
    openCompletedJobReportModal: (job: Job) => void;
    getDepartmentForProcess: (processName: string) => string | null;
    openPrintModal: (department: string) => void;
    handleDropJobOnDesigner: (jobId: string, designer: Designer) => void;
    handleOpenFinishDesignModal: (jobId: string) => void;
    handleStartDesign: (jobId: string) => void;
    handleOpenDesignerHoldModal: (jobId: string) => void;
    handleResumeDesign: (jobId: string) => void;
    openDesignDetailModal: (jobId: string) => void;
    handleDropJobOnProgrammer: (jobId: string, programmer: Programmer) => void;
    handleFinishProgramming: (jobId: string) => void;
    handleStartProgramming: (jobId: string) => void;
    handleOpenProgrammerHoldModal: (jobId: string) => void;
    handleResumeProgramming: (jobId: string) => void;
    openProgrammingDetailModal: (jobId: string) => void;
    handleAssignOperatorToProcess: (jobId: string, drawingId: string, processId: string, operatorId: string | null, isOvertime?: boolean) => void;
    handleOperatorStartProcess: (jobId: string, drawingId: string, processId: string) => void;
    handleOperatorHoldProcess: (jobId: string, drawingId: string, processId: string, reason: string) => void;
    handleOperatorResumeProcess: (jobId: string, drawingId: string, processId: string) => void;
    handleProcessCompletion: (jobId: string, drawingId: string, sequence: number, isCompleted: boolean) => void;
    onOpenSalesNotifications: () => void;
    onOpenStaffChangePassword: () => void;
    onOpenMyProfile: () => void;
    isAdminPortalLocked: boolean;
    toggleAdminPortalLock: () => void;
}

interface PortalConfig {
    title: string;
    views: PortalView[];
}

// Fix: Explicitly type PORTAL_CONFIG to allow TypeScript to correctly infer view types.
const PORTAL_CONFIG: Record<PortalSection, PortalConfig> = {
    sales: { title: 'Sales & Quoting', views: ['dashboard', 'createJob'] },
    engineering: { title: 'Engineering', views: ['dashboard', 'design', 'programming'] },
    quality: { title: 'Quality Assurance', views: ['dashboard', 'qualityChecking'] },
    production: { title: 'Production Floor', views: ['dashboard', 'departmentWorkflow', 'workPlace'] },
    logistics: { title: 'Logistics & Inventory', views: ['dashboard', 'stores', 'product'] },
    admin: { title: 'Administration', views: ['dashboard', 'createJob', 'design', 'programming', 'stores', 'departmentWorkflow', 'qualityChecking', 'product', 'workPlace', 'admin'] },
    workPlace: { title: 'Operator Work Station', views: ['workPlace'] }
};

const VIEW_NAMES: { [key in PortalView]?: string } = {
    dashboard: 'Dashboard',
    createJob: 'Sales',
    design: 'Design',
    programming: 'Programming',
    stores: 'Stores',
    departmentWorkflow: 'Workflow',
    qualityChecking: 'Quality Checking',
    product: 'Product',
    workPlace: 'Work Place',
    admin: 'Admin'
};

export const Portal: React.FC<PortalProps> = (props) => {
    const { portal, onGoHome } = props;
    const [activeView, setActiveView] = useState<PortalView>('dashboard');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const portalUserRef = useRef<OfficialStaff | Operator | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const config = PORTAL_CONFIG[portal];
    
    useEffect(() => {
        if (config && config.views.length > 0) {
            setActiveView(config.views[0]);
        }
    }, [portal, config]);

    useEffect(() => {
        if (props.currentUser && !portalUserRef.current) {
            portalUserRef.current = props.currentUser;
        }
    }, [props.currentUser]);

    // Click outside handler for profile dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileRef]);

    const handleCloseChat = () => {
        setIsChatOpen(false);
        if (portalUserRef.current && props.currentUser?.id !== portalUserRef.current.id) {
            props.setCurrentUser(portalUserRef.current);
        }
    };

    const openChat = () => setIsChatOpen(true);

    const unreadCount = useMemo(() => {
        if (!props.currentUser) return 0;
        return props.messages.filter(m => m.recipientId === props.currentUser?.id && !m.isRead).length;
    }, [props.messages, props.currentUser]);

    const handleAdvanceClick = (department: string) => {
        if (department === 'Design') setActiveView('designAdvance');
        else if (department === 'Programming') setActiveView('programmingAdvance');
    };

    const handleStoresJobClick = (job: Job, department: string) => {
        if (['Completed', 'Delivered'].includes(department)) {
            props.openCompletedJobReportModal(job);
        } else {
            props.openJobActionsModal(job, department, false);
        }
    };
    
    const specialDepartments = useMemo(() => [
        "Design", "Programming", "Planning", "Products", "Material Ready Pending", 
        "Material Parting", "Final Quality Check", "Hold", "Completed", 
        "Delivered", "Urgent"
    ], []);

    const serviceWorkflowDepartments = useMemo(() => 
        ['Planning', ...props.allDepartments.filter(d => !specialDepartments.includes(d))]
    , [props.allDepartments, specialDepartments]);

    const storesDepartments = useMemo(() => 
        ['Material Ready Pending', ...props.allDepartments.filter(dep => dep === 'Material Parting' || dep === 'Completed' || dep === 'Delivered')]
    , [props.allDepartments]);

    const renderContent = () => {
        switch(activeView) {
            case 'dashboard': return <Dashboard jobs={props.jobs} onJobClick={(job) => job.completedAt ? props.openCompletedJobReportModal(job) : props.openJobDetailModal(job)} getDepartmentForProcess={props.getDepartmentForProcess} />;
            case 'createJob': return <CreateJob currentUser={props.currentUser} userId={props.userId} jobs={props.jobs} products={props.products} createJob={props.createJobInFirestore} showModal={props.showModal} salesRequestCount={props.notificationCounts.sales} onOpenNotifications={props.onOpenSalesNotifications} onProceedJob={props.onProceedJob} />;
            case 'design': return <Workflow departments={['Design']} jobs={props.activeJobs} fullScreenDepartment={null} setFullScreenDepartment={()=>{}} openPrintModal={props.openPrintModal} onJobClick={(job, dept) => props.openJobActionsModal(job, dept, false)} onProductJobClick={props.openProductJobModal} onAdvanceClick={handleAdvanceClick} onJobDetailClick={props.openCompletedJobReportModal} />;
            case 'programming': return <Workflow departments={['Programming']} jobs={props.activeJobs} fullScreenDepartment={null} setFullScreenDepartment={()=>{}} openPrintModal={props.openPrintModal} onJobClick={(job, dept) => props.openJobActionsModal(job, dept, false)} onProductJobClick={props.openProductJobModal} onAdvanceClick={handleAdvanceClick} onJobDetailClick={props.openCompletedJobReportModal} />;
            case 'stores': return <Workflow departments={storesDepartments} jobs={props.jobs} fullScreenDepartment={null} setFullScreenDepartment={()=>{}} openPrintModal={props.openPrintModal} onJobClick={handleStoresJobClick} onProductJobClick={props.openProductJobModal} onJobDetailClick={props.openCompletedJobReportModal} />;
            case 'departmentWorkflow': return <Workflow departments={serviceWorkflowDepartments} jobs={props.activeJobs} fullScreenDepartment={null} setFullScreenDepartment={()=>{}} openPrintModal={props.openPrintModal} onJobClick={(job, dept) => props.openJobActionsModal(job, dept, false)} onProductJobClick={props.openProductJobModal} onJobDetailClick={props.openCompletedJobReportModal} />;
            case 'qualityChecking': return <QualityChecking jobs={props.activeJobs} onJobClick={(job, dept) => props.openJobActionsModal(job, dept, true)} getDepartmentForProcess={props.getDepartmentForProcess} />;
            case 'product': return <Workflow departments={['Products']} jobs={props.activeJobs} fullScreenDepartment={null} setFullScreenDepartment={()=>{}} openPrintModal={props.openPrintModal} onJobClick={(job, dept) => props.openJobActionsModal(job, dept, false)} onProductJobClick={props.openProductJobModal} onJobDetailClick={props.openCompletedJobReportModal} />;
            case 'workPlace': return <WorkPlace 
                {...props} 
                onAssignOperator={props.handleAssignOperatorToProcess}
                onOperatorStartProcess={props.handleOperatorStartProcess}
                onOperatorHoldProcess={props.handleOperatorHoldProcess}
                onOperatorResumeProcess={props.handleOperatorResumeProcess}
                onOperatorFinishProcess={props.handleProcessCompletion}
                openChat={openChat} 
            />;
            case 'admin': return <Admin onClose={() => setActiveView('dashboard')} {...props} updateSettings={props.updateSettingsInFirestore} isAdminPortalLocked={props.isAdminPortalLocked} toggleAdminPortalLock={props.toggleAdminPortalLock} />;
            case 'designAdvance': return <DesignAdvance onBack={() => setActiveView('design')} jobs={props.activeJobs} designers={props.designers} onAddDesigner={props.addDesigner} onRemoveDesigner={props.removeDesigner} onRenameDesigner={props.handleRenameDesigner} onDropJobOnDesigner={props.handleDropJobOnDesigner} onFinishDesign={props.handleOpenFinishDesignModal} onStartDesign={props.handleStartDesign} onHoldDesign={props.handleOpenDesignerHoldModal} onResumeDesign={props.handleResumeDesign} onJobClick={props.openDesignDetailModal} currentUser={props.currentUser} officialStaff={props.officialStaff} />;
            // FIX: Corrected prop name from props.onResumeProgramming to props.handleResumeProgramming.
            case 'programmingAdvance': return <ProgrammingAdvance onBack={() => setActiveView('programming')} jobs={props.activeJobs} programmers={props.programmers} onAddProgrammer={props.addProgrammer} onRemoveProgrammer={props.removeProgrammer} onRenameProgrammer={props.handleRenameProgrammer} onDropJobOnProgrammer={props.handleDropJobOnProgrammer} onFinishProgramming={props.handleFinishProgramming} onStartProgramming={props.handleStartProgramming} onHoldProgramming={props.handleOpenProgrammerHoldModal} onResumeProgramming={props.handleResumeProgramming} onJobClick={props.openProgrammingDetailModal} officialStaff={props.officialStaff} />;
            default: return <div>Not implemented</div>
        }
    };
    
    return (
        <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 font-sans text-gray-800`}>
            <header className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onGoHome} className="p-2 bg-white rounded-full shadow-sm border hover:bg-gray-100" aria-label="Go to Home Screen">
                        <HomeIcon />
                    </button>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-800 drop-shadow-md">{config.title}</h1>
                        <p className="text-lg text-indigo-600 mt-1">Rex Industries Workflow Planner</p>
                    </div>
                </div>
                {props.currentUser && (
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:block text-gray-700 font-medium">Welcome, {props.currentUser.name}</span>
                        <div className="relative" ref={profileRef}>
                            <button 
                                onClick={() => setIsProfileOpen(prev => !prev)}
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border hover:bg-gray-100"
                                aria-label="Open user profile menu"
                                aria-expanded={isProfileOpen}
                            >
                                <UserIcon />
                            </button>
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                                    <button
                                        onClick={() => {
                                            props.onOpenMyProfile();
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <UserIcon /> My Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            props.onOpenStaffChangePassword();
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <KeyIcon className="w-4 h-4" /> Change Password
                                    </button>
                                    <button
                                        onClick={onGoHome}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <LogOutIcon /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>
            {config.views.length > 1 && (
                <nav className="mb-6 flex flex-wrap justify-center items-center gap-2 sm:gap-4 p-4 bg-white rounded-xl shadow-lg">
                    {(config.views as PortalView[]).map(view => {
                        const viewName = VIEW_NAMES[view];
                        if (!viewName) return null;

                        const notificationKey = view === 'createJob' ? 'sales' : view;
                        const count = props.notificationCounts[notificationKey as keyof typeof props.notificationCounts] || 0;

                        return (
                            <button
                                key={view}
                                onClick={() => setActiveView(view)}
                                className={`relative px-4 py-2 rounded-lg font-semibold ${activeView === view ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                {viewName}
                                {count > 0 && (
                                    <span className="absolute -top-2 -right-2 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{count}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            )}
            <main>
                {renderContent()}
            </main>

            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110 z-30"
                aria-label="Open Chat"
            >
                <MessageSquareIcon />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            <ChatModal
                isOpen={isChatOpen}
                onClose={handleCloseChat}
                currentUser={props.currentUser}
                setCurrentUser={props.setCurrentUser}
                allUsers={[...props.officialStaff, ...props.operators]}
                messages={props.messages}
                onSendMessage={props.sendMessage}
                onMarkAsRead={props.markMessagesAsRead}
            />
        </div>
    );
};