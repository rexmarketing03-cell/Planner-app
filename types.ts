

export interface Process {
    id: string;
    sequence: number;
    name: string;
    machine: string;
    estimatedHours: number;
    estimatedMinutes: number;
    completed: boolean;
    startedAt?: string | null;
    completedAt?: string | null;
    qualityCheckCompleted: boolean;
    qualityCheckComment: string;
    programmingRequired?: boolean;
    plannedDate?: string;
    // New fields for operator assignment
    operatorId?: string;
    operatorName?: string;
    isOvertime?: boolean;
    // New fields for operator actions
    isPaused?: boolean;
    pauseReason?: string;
    operatorHoldHistory?: { holdAt: string; resumeAt: string | null; reason: string }[];
}

export interface ReworkHistoryItem {
    timestamp: string;
    processName: string;
    reason: string;
    reworkType: 'in-department' | 'cross-department';
    targetDepartment?: string | null;
    reworkCount: number;
}

export interface FinalReportReading {
    id: string;
    partNumber: string;
    dimension: string;
    note: string;
    samples: [string, string, string, string, string];
}

export interface FinalReport {
    checkedBy: string;
    reportDate: string;
    reportTime: string;
    jobDescription: string;
    readings: FinalReportReading[];
}


export interface Drawing {
    id: string;
    name: string;
    quantity: number;
    materialStatus: 'Pending' | 'Ready' | 'Awaiting Stock';
    expectedMaterialDate?: string | null;
    processes: Process[];
    currentDepartment: string;
    previousDepartment: string | null;
    reworkCount: number;
    reworkHistory: ReworkHistoryItem[];
    isUnderRework: boolean;
    reworkOriginProcess: string | null;
    designCompletedDate: string | null;
    finalQcApproved: boolean;
    finalQcComment: string;
    finalQcApprovedAt: string | null;
    holdReason?: string;
    replanRequired?: boolean;
    // New fields for designer assignment
    designerId?: string;
    designerName?: string;
    assignmentTargetDate?: string;
    assignmentDescription?: string;
    finalReport?: FinalReport;
}

export interface Product {
    id: string;
    name: string;
    description: string;
}

// New interface for items within a product job
export interface ProductOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    motorRequirement: 'Single Phase' | '3 Phase' | '';
    status: 'Pending Stock Check' | 'Awaiting Stock' | 'Ready for QC' | 'Completed';
    availabilityDate?: string | null;
    readyForQcAt?: string | null;
    qcApprovedAt?: string | null;
    qcComment?: string;
}

export interface Job {
    id: string;
    jobNumber: string;
    customerName: string;
    jobDescription: string;
    addedDate: string;
    finishDate: string;
    priority: 'Normal' | 'Urgent';
    createdBy: string;
    createdAt: string;
    
    jobType: 'Service' | 'Product';

    // Service-specific fields
    designRequired?: boolean;
    designCompleted?: boolean; // True when sent to planning
    drawings?: Drawing[];
    designerId?: string;
    designerName?: string;
    designTargetDate?: string;

    // New detailed designer tracking
    designerStatus?: 'Pending' | 'In Progress' | 'On Hold';
    designerStartedAt?: string | null;
    designerFinishedAt?: string | null;
    designerHoldHistory?: { holdAt: string; resumeAt: string | null; reason: string }[];
    designFinished?: boolean; // True when design is done, before planning

    // New Programming fields
    programmingRequired?: boolean;
    programmingCompleted?: boolean;
    programmerId?: string;
    programmerName?: string;
    programmingTargetDate?: string;
    programmerStatus?: 'Pending' | 'In Progress' | 'On Hold';
    programmerStartedAt?: string | null;
    programmerFinishedAt?: string | null;
    programmerHoldHistory?: { holdAt: string; resumeAt: string | null; reason: string }[];
    programmingFinished?: boolean;

    // Product-specific fields
    products?: ProductOrderItem[]; // Replaces single product fields
    specialRequirement?: string;

    // Sales update request
    salesUpdateRequest?: {
        requestedDate: string;
        reason: string;
        requestedAt: string;
        status: 'pending' | 'approved' | 'rejected';
        salesNote?: string;
        source?: 'stores' | 'planning';
        drawingId?: string;
        productId?: string;
    };

    // Sales Hold on Create
    isHeldBySales?: boolean;
    salesHoldReason?: string;

    // Final lifecycle tracking
    completedAt?: string | null;
    deliveredAt?: string | null;
}

export interface Designer {
    id: string;
    name: string;
}

export interface Programmer {
    id: string;
    name: string;
}

export interface Operator {
    id: string;
    name: string;
    empNumber: string;
    department: string;
    role: 'Section Head' | 'Worker';
    pin?: string;
    faceLockCode?: string; // Base64 encoded image
    patternLockCode?: number[]; // Sequence of dots, e.g., [1, 4, 7, 8]
}


interface PermissionNode {
    name: string;
    sub?: PermissionNode[];
}

export const PERMISSIONS_HIERARCHY: PermissionNode[] = [
    { name: 'Sales & Quoting' },
    { 
        name: 'Engineering', 
        sub: [
            { 
                name: 'Design', 
                sub: [
                    { name: 'Head Of Designer' },
                    { name: 'Designer' }
                ] 
            },
            { 
                name: 'Programming',
                sub: [
                    { name: 'Head of Programmer' },
                    { name: 'Programmer' }
                ]
            }
        ]
    },
    { name: 'Quality Assurance' },
    { 
        name: 'Production Floor',
        sub: [
            { name: 'Team Leader' },
            { name: 'Assistant Team Leader' },
            { name: 'Intern' }
        ]
    },
    { name: 'Logistics & Inventory' },
    { name: 'Administration' }
];

const flattenPermissions = (nodes: PermissionNode[]): string[] => {
    let names: string[] = [];
    for (const node of nodes) {
        names.push(node.name);
        if (node.sub) {
            names = names.concat(flattenPermissions(node.sub));
        }
    }
    return names;
};

export const ALL_PERMISSIONS = flattenPermissions(PERMISSIONS_HIERARCHY);

// Keep old constant name for compatibility where a simple list is still needed, but derive from the new hierarchy.
// FIX: A 'const' assertion can only be applied to literals, not variables. Removing it makes `PermissionArea` of type `string`.
export const PERMISSION_AREAS = ALL_PERMISSIONS;

export type PermissionArea = typeof PERMISSION_AREAS[number];


export interface OfficialStaff {
    id: string;
    name: string;
    empNumber: string;
    position: string;
    permissions: PermissionArea[];
    pin?: string;
    faceLockCode?: string; // Base64 encoded image
    patternLockCode?: number[]; // Sequence of dots, e.g., [1, 4, 7, 8]
}


export interface MachinesMap {
    [processName: string]: string[];
}

export type PortalView = 'dashboard' | 'createJob' | 'design' | 'departmentWorkflow' | 'product' | 'admin' | 'designAdvance' | 'stores' | 'qualityChecking' | 'programming' | 'programmingAdvance' | 'workPlace';
export type PortalSection = 'sales' | 'engineering' | 'quality' | 'production' | 'logistics' | 'admin' | 'workPlace';

export interface NotificationItem {
    type: 'Service' | 'Product';
    jobId: string;
    jobNumber: string;
    customerName: string;
    title: string;
    subtitle: string;
    department: string;
    // Optional fields for service jobs
    drawingId?: string;
    processSequence?: number;
    // Optional field for product jobs, identifying the specific item
    productId?: string;
}

export interface PlanningMaterialDelayData {
    job: Job;
    drawing: Drawing;
}

export interface ChatMessage {
    id: string;
    participants: string[]; // [userId1, userId2] sorted alphabetically
    senderId: string;
    senderName: string;
    recipientId: string;
    recipientName: string;
    text: string;
    timestamp: string; // ISO string
    isRead: boolean;
}