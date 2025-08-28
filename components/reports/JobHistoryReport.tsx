import React, { useMemo, useState } from 'react';
import type { Job, Process } from '../../types';
import {
    ChevronLeftIcon, BriefcaseIcon, PaletteIcon, CodeIcon, CogIcon,
    Undo2Icon, ShieldCheckIcon, FlagIcon, TruckIcon, PauseIcon, PlayIcon, ChevronRightIcon, CheckIcon
} from '../Icons';
import { JobHistoryDetailModal } from '../modals/JobHistoryDetailModal';

interface JobHistoryReportProps {
    job: Job;
    onBack: () => void;
}

export interface TimelineEvent {
    timestamp: string;
    type: 'creation' | 'design' | 'programming' | 'process' | 'rework' | 'qc' | 'completion' | 'delivery' | 'hold-resume' | 'date-change';
    Icon: React.FC;
    color: string;
    title: string;
    details: React.ReactNode;
}

const calculateNetDuration = (start: string | null | undefined, end: string | null | undefined, holdHistory: { holdAt: string; resumeAt: string | null }[] | undefined): string => {
    if (!start || !end) return 'N/A';
    let holdDuration = 0;
    if (holdHistory) {
        holdHistory.forEach(h => {
            if (h.resumeAt) {
                holdDuration += new Date(h.resumeAt).getTime() - new Date(h.holdAt).getTime();
            }
        });
    }
    const totalDuration = new Date(end).getTime() - new Date(start).getTime();
    const netDuration = totalDuration - holdDuration;
    if (netDuration < 0) return '0 days';
    const days = Math.floor(netDuration / (1000 * 60 * 60 * 24));
    const hours = Math.floor((netDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days} day(s), ${hours} hr(s)`;
};

const calculateProcessNetDuration = (process: Process): string => {
    if (!process.startedAt || !process.completedAt) return 'In Progress';
    let holdDuration = 0;
    (process.operatorHoldHistory || []).forEach(h => {
        if (h.resumeAt) {
            holdDuration += new Date(h.resumeAt).getTime() - new Date(h.holdAt).getTime();
        }
    });
    const totalDuration = new Date(process.completedAt).getTime() - new Date(process.startedAt).getTime();
    const netDurationMs = totalDuration - holdDuration;
    if (netDurationMs < 0) return '0h 0m';
    
    const hours = Math.floor(netDurationMs / (1000 * 60 * 60));
    const minutes = Math.floor((netDurationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
};

const formatMsToHoursAndMinutes = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalHours = Math.floor(ms / (1000 * 60 * 60));
    const totalMinutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${totalHours}h ${totalMinutes}m`;
};


const KpiCard: React.FC<{ title: string; value: React.ReactNode; color?: string }> = ({ title, value, color = 'text-gray-800' }) => (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm border">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

const CategoryCard: React.FC<{ title: string; duration: string; icon: React.ReactNode; onClick: () => void; eventCount: number }> = ({ title, duration, icon, onClick, eventCount }) => (
    <div onClick={onClick} className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-gray-800">{title}</h4>
          <p className="text-sm text-gray-600">{duration}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-indigo-600">
        <span className="text-sm font-semibold">{eventCount} event(s)</span>
        <ChevronRightIcon />
      </div>
    </div>
  );


export const JobHistoryReport: React.FC<JobHistoryReportProps> = ({ job, onBack }) => {
    const [detailModalData, setDetailModalData] = useState<{ title: string; events: TimelineEvent[] } | null>(null);

    const { onTimeStatus, delayDays } = useMemo(() => {
        if (!job.completedAt) return { onTimeStatus: 'Processing', delayDays: null };
        const finishDate = new Date(job.finishDate);
        const completedDate = new Date(job.completedAt);
        finishDate.setHours(23, 59, 59, 999); 
        
        if (completedDate > finishDate) {
            const diffTime = completedDate.getTime() - finishDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { onTimeStatus: 'Delayed', delayDays: diffDays };
        }
        return { onTimeStatus: 'On-Time', delayDays: 0 };
    }, [job.completedAt, job.finishDate]);

    const totalOperatorNetTimeMs = useMemo(() => {
        let totalMs = 0;
        (job.drawings || []).forEach(d => {
            (d.processes || []).forEach(p => {
                if (p.operatorId && p.startedAt && p.completedAt) {
                    let holdDuration = 0;
                    (p.operatorHoldHistory || []).forEach(h => {
                        if (h.resumeAt) {
                            holdDuration += new Date(h.resumeAt).getTime() - new Date(h.holdAt).getTime();
                        }
                    });
                    const totalDuration = new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime();
                    totalMs += (totalDuration - holdDuration);
                }
            });
        });
        return totalMs;
    }, [job]);

    const categorizedEvents = useMemo(() => {
        const creation: TimelineEvent[] = [];
        const design: TimelineEvent[] = [];
        const programming: TimelineEvent[] = [];
        const workflow: TimelineEvent[] = [];
        const operatorWorkflow: TimelineEvent[] = [];
        const finalization: TimelineEvent[] = [];

        creation.push({ timestamp: job.createdAt, type: 'creation', Icon: BriefcaseIcon, color: 'text-blue-500', title: 'Job Created', details: `Job ${job.jobNumber} created by ${job.createdBy}.` });

        if (job.designerStartedAt) design.push({ timestamp: job.designerStartedAt, type: 'design', Icon: PaletteIcon, color: 'text-pink-500', title: 'Design Started', details: `Designer: ${job.designerName}` });
        (job.designerHoldHistory || []).forEach(h => {
            design.push({ timestamp: h.holdAt, type: 'hold-resume', Icon: PauseIcon, color: 'text-yellow-500', title: 'Design On Hold', details: `Reason: ${h.reason}` });
            if (h.resumeAt) design.push({ timestamp: h.resumeAt, type: 'hold-resume', Icon: PlayIcon, color: 'text-green-500', title: 'Design Resumed', details: '' });
        });
        if (job.designerFinishedAt) design.push({ timestamp: job.designerFinishedAt, type: 'design', Icon: PaletteIcon, color: 'text-pink-500', title: 'Design Finished', details: `Net Duration: ${calculateNetDuration(job.designerStartedAt, job.designerFinishedAt, job.designerHoldHistory)}` });

        if (job.programmerStartedAt) programming.push({ timestamp: job.programmerStartedAt, type: 'programming', Icon: CodeIcon, color: 'text-purple-500', title: 'Programming Started', details: `Programmer: ${job.programmerName}` });
        (job.programmerHoldHistory || []).forEach(h => {
            programming.push({ timestamp: h.holdAt, type: 'hold-resume', Icon: PauseIcon, color: 'text-yellow-500', title: 'Programming On Hold', details: `Reason: ${h.reason}` });
            if (h.resumeAt) programming.push({ timestamp: h.resumeAt, type: 'hold-resume', Icon: PlayIcon, color: 'text-green-500', title: 'Programming Resumed', details: '' });
        });
        if (job.programmerFinishedAt) programming.push({ timestamp: job.programmerFinishedAt, type: 'programming', Icon: CodeIcon, color: 'text-purple-500', title: 'Programming Finished', details: `Net Duration: ${calculateNetDuration(job.programmerStartedAt, job.programmerFinishedAt, job.programmerHoldHistory)}` });

        (job.drawings || []).forEach(d => {
            (d.processes || []).forEach(p => {
                if (p.completedAt) {
                    workflow.push({ timestamp: p.completedAt, type: 'process', Icon: CogIcon, color: 'text-gray-600', title: `Process Completed: ${p.name}`, details: `For drawing "${d.name}"` });
                }
                if (p.operatorId && p.operatorName) {
                    if (p.startedAt) {
                        operatorWorkflow.push({ timestamp: p.startedAt, type: 'process', Icon: PlayIcon, color: 'text-green-500', title: `Started: ${p.name}`, details: <div><p>Drawing: {d.name}</p><p>Operator: {p.operatorName}</p></div> });
                    }
                    (p.operatorHoldHistory || []).forEach(h => {
                        operatorWorkflow.push({ timestamp: h.holdAt, type: 'hold-resume', Icon: PauseIcon, color: 'text-yellow-500', title: `Held: ${p.name}`, details: <div><p>Operator: {p.operatorName}</p><p>Reason: {h.reason}</p></div> });
                        if (h.resumeAt) {
                             operatorWorkflow.push({ timestamp: h.resumeAt, type: 'hold-resume', Icon: PlayIcon, color: 'text-blue-500', title: `Resumed: ${p.name}`, details: `Operator: ${p.operatorName}` });
                        }
                    });
                    if (p.completedAt) {
                        operatorWorkflow.push({ timestamp: p.completedAt, type: 'process', Icon: CheckIcon, color: 'text-gray-600', title: `Finished: ${p.name}`, details: <div><p>Operator: {p.operatorName}</p><p>Net Duration: {calculateProcessNetDuration(p)}</p></div> });
                    }
                }
            });
            (d.reworkHistory || []).forEach(r => {
                workflow.push({ timestamp: r.timestamp, type: 'rework', Icon: Undo2Icon, color: 'text-red-500', title: `Rework #${r.reworkCount} Initiated`, details: <div><p>Drawing: {d.name}</p><p>Process: {r.processName}</p><p>Reason: {r.reason}</p></div> });
            });
            if (d.finalQcApprovedAt) {
                workflow.push({ timestamp: d.finalQcApprovedAt, type: 'qc', Icon: ShieldCheckIcon, color: 'text-teal-500', title: 'Final QC Approved', details: `For drawing "${d.name}"` });
            }
        });

        if (job.completedAt) finalization.push({ timestamp: job.completedAt, type: 'completion', Icon: FlagIcon, color: 'text-indigo-600', title: 'Job Completed', details: `Total duration: ${calculateNetDuration(job.createdAt, job.completedAt, [])}` });
        if (job.deliveredAt) finalization.push({ timestamp: job.deliveredAt, type: 'delivery', Icon: TruckIcon, color: 'text-green-600', title: 'Job Delivered', details: `Delivered on ${new Date(job.deliveredAt).toLocaleDateString()}` });
        
        const allEvents = [...creation, ...design, ...programming, ...workflow, ...finalization, ...operatorWorkflow].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const workflowStartTime = allEvents.find(e => e.type === 'process' || e.type === 'rework' || e.type === 'qc')?.timestamp;
        const workflowEndTime = allEvents.slice().reverse().find(e => e.type === 'process' || e.type === 'rework' || e.type === 'qc')?.timestamp;


        return { design, programming, workflow, operatorWorkflow, finalization, workflowStartTime, workflowEndTime };
    }, [job]);

    return (
        <>
        <JobHistoryDetailModal 
            show={!!detailModalData} 
            onClose={() => setDetailModalData(null)}
            title={detailModalData?.title || ''}
            events={detailModalData?.events || []}
        />
        <div>
            <button onClick={onBack} className="flex items-center gap-1 text-sm p-2 mb-4 bg-gray-200 rounded-md hover:bg-gray-300">
                <ChevronLeftIcon /> Back to Job List
            </button>

            <div className="bg-white rounded-xl shadow-lg border p-6">
                <div className="border-b pb-4 mb-4">
                    <h2 className="text-3xl font-bold text-indigo-700">{job.jobNumber}</h2>
                    <p className="text-lg text-gray-600">{job.customerName}</p>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Performance Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <KpiCard title="Status" value={onTimeStatus} color={onTimeStatus === 'Delayed' ? 'text-red-600' : 'text-green-600'} />
                    <KpiCard title="Delay" value={delayDays !== null ? `${delayDays} day(s)` : 'N/A'} />
                    <KpiCard title="Total Reworks" value={job.drawings?.reduce((sum, d) => sum + (d.reworkCount || 0), 0) || 0} />
                    <KpiCard title="Total Duration" value={calculateNetDuration(job.createdAt, job.completedAt, [])} />
                </div>
                
                {job.salesUpdateRequest && job.salesUpdateRequest.status === 'approved' && (
                     <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">Finish Date History</h3>
                         <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm">
                             <p><span className="font-semibold">Date Change Approved On:</span> {new Date(job.salesUpdateRequest.requestedAt).toLocaleString()}</p>
                             <p><span className="font-semibold">New Finish Date:</span> {job.finishDate}</p>
                             <p><span className="font-semibold">Reason:</span> {job.salesUpdateRequest.reason}</p>
                         </div>
                    </div>
                )}

                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Job Timeline Categories</h3>
                    <div className="space-y-3">
                        {job.designRequired && (
                            <CategoryCard
                                title="Design Phase"
                                duration={`Duration: ${calculateNetDuration(job.designerStartedAt, job.designerFinishedAt, job.designerHoldHistory)}`}
                                icon={<PaletteIcon />}
                                eventCount={categorizedEvents.design.length}
                                onClick={() => setDetailModalData({ title: 'Design Phase Details', events: categorizedEvents.design })}
                            />
                        )}
                        {job.programmingRequired && (
                             <CategoryCard
                                title="Programming Phase"
                                duration={`Duration: ${calculateNetDuration(job.programmerStartedAt, job.programmerFinishedAt, job.programmerHoldHistory)}`}
                                icon={<CodeIcon />}
                                eventCount={categorizedEvents.programming.length}
                                onClick={() => setDetailModalData({ title: 'Programming Phase Details', events: categorizedEvents.programming })}
                            />
                        )}
                         <CategoryCard
                            title="Production Milestones"
                            duration={`Duration: ${calculateNetDuration(categorizedEvents.workflowStartTime, categorizedEvents.workflowEndTime, [])}`}
                            icon={<CogIcon />}
                            eventCount={categorizedEvents.workflow.length}
                            onClick={() => setDetailModalData({ title: 'Production Milestone Details', events: categorizedEvents.workflow })}
                        />
                        <CategoryCard
                            title="Operator Workflow"
                            duration={`Total Net Time: ${formatMsToHoursAndMinutes(totalOperatorNetTimeMs)}`}
                            icon={<CogIcon />}
                            eventCount={categorizedEvents.operatorWorkflow.length}
                            onClick={() => setDetailModalData({ title: 'Operator Workflow Details', events: categorizedEvents.operatorWorkflow })}
                        />
                         <CategoryCard
                            title="Job Finalization"
                            duration={job.completedAt ? `Completed on ${new Date(job.completedAt).toLocaleDateString()}` : 'In Progress'}
                            icon={<FlagIcon />}
                            eventCount={categorizedEvents.finalization.length}
                            onClick={() => setDetailModalData({ title: 'Job Finalization Details', events: categorizedEvents.finalization })}
                        />
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};