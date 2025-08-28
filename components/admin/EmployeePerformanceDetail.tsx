import React, { useState, useMemo } from 'react';
import type { Operator, OfficialStaff, Job, Process } from '../../types';
import { ChevronLeftIcon } from '../Icons';
import { TaskTimelineModal } from '../modals/TaskTimelineModal';

interface EmployeePerformanceDetailProps {
    employee: Operator | OfficialStaff;
    jobs: Job[];
    onBack: () => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; subtext?: string }> = ({ title, value, subtext }) => (
    <div className="bg-indigo-50 p-4 rounded-lg text-center shadow-sm">
        <p className="text-sm text-indigo-800 font-semibold">{title}</p>
        <p className="text-3xl font-bold text-indigo-600">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
);

const calculateNetDuration = (start: string | null | undefined, end: string | null | undefined, holdHistory: { holdAt: string; resumeAt: string | null }[] | undefined): string => {
    if (!start || !end) return 'N/A';
    let holdDuration = (holdHistory || []).reduce((acc, h) => acc + (h.resumeAt ? new Date(h.resumeAt).getTime() - new Date(h.holdAt).getTime() : 0), 0);
    const netMs = (new Date(end).getTime() - new Date(start).getTime()) - holdDuration;
    if (netMs < 0) return '0d 0h';
    const days = Math.floor(netMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((netMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
};

const calculateProcessNetDuration = (process: Process): string => {
    if (!process.startedAt || !process.completedAt) return 'N/A';
    const holdDuration = (process.operatorHoldHistory || []).reduce((acc, h) => acc + (h.resumeAt ? new Date(h.resumeAt).getTime() - new Date(h.holdAt).getTime() : 0), 0);
    const netMs = (new Date(process.completedAt).getTime() - new Date(process.startedAt).getTime()) - holdDuration;
    if (netMs < 0) return '0h 0m';
    const hours = Math.floor(netMs / 3600000);
    const minutes = Math.floor((netMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
};

export const EmployeePerformanceDetail: React.FC<EmployeePerformanceDetailProps> = ({ employee, jobs, onBack }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<(Process & { jobNumber: string; drawingName: string; }) | null>(null);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [year, month] = e.target.value.split('-').map(Number);
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const isOperator = 'department' in employee;

    const performanceData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        if (isOperator) {
            const op = employee as Operator;
            let tasksCompleted = 0;
            let onTimeCount = 0;
            let reworksCaused = 0;
            const tasksInPeriod = [];
            const firstStartTimes: number[] = [];
            const workDays = new Map<string, number>();

            jobs.forEach(job => {
                job.drawings?.forEach(drawing => {
                    drawing.reworkHistory?.forEach(rework => {
                        const reworkDate = new Date(rework.timestamp);
                        if (reworkDate.getFullYear() === year && reworkDate.getMonth() === month) {
                            const processBeforeRework = drawing.processes.find(p => p.name === rework.processName);
                            if (processBeforeRework?.operatorId === op.id) reworksCaused++;
                        }
                    });

                    drawing.processes.forEach(p => {
                        if (p.operatorId === op.id && p.completedAt) {
                            const completedDate = new Date(p.completedAt);
                            if (completedDate.getFullYear() === year && completedDate.getMonth() === month) {
                                tasksCompleted++;
                                if (p.plannedDate && new Date(p.completedAt).setHours(0,0,0,0) <= new Date(p.plannedDate).getTime()) {
                                    onTimeCount++;
                                }
                                tasksInPeriod.push({ ...p, jobNumber: job.jobNumber, drawingName: drawing.name });
                            }
                        }

                        if(p.operatorId === op.id && p.startedAt) {
                            const startedDate = new Date(p.startedAt);
                            if (startedDate.getFullYear() === year && startedDate.getMonth() === month) {
                                const dayStr = startedDate.toISOString().split('T')[0];
                                if (!workDays.has(dayStr) || startedDate.getTime() < workDays.get(dayStr)!) {
                                    workDays.set(dayStr, startedDate.getTime());
                                }
                            }
                        }
                    });
                });
            });

            workDays.forEach(timestamp => {
                const date = new Date(timestamp);
                firstStartTimes.push(date.getHours() * 60 + date.getMinutes());
            });

            const avgMinutes = firstStartTimes.reduce((a, b) => a + b, 0) / (firstStartTimes.length || 1);
            const avgHour = Math.floor(avgMinutes / 60);
            const avgMin = Math.round(avgMinutes % 60);
            const avgStartTime = firstStartTimes.length > 0 ? `${String(avgHour).padStart(2, '0')}:${String(avgMin).padStart(2, '0')}` : 'N/A';
            const onTimeRate = tasksCompleted > 0 ? `${Math.round((onTimeCount / tasksCompleted) * 100)}%` : 'N/A';

            return { kpis: { tasksCompleted, reworksCaused, onTimeRate, avgStartTime }, tasks: tasksInPeriod.sort((a,b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()) };
        } else {
            // Official Staff (Designer/Programmer) Logic
            const staff = employee as OfficialStaff;
            let jobsCompleted = 0;
            let onTimeCount = 0;
            const jobsInPeriod = [];
            
            const type = staff.position.toLowerCase().includes('design') ? 'designer' : 'programmer';

            jobs.forEach(job => {
                const finishedAtStr = job[`${type}FinishedAt` as keyof Job] as string | undefined;
                const targetDateStr = job[`${type}TargetDate` as keyof Job] as string | undefined;

                if(finishedAtStr) {
                    const finishedDate = new Date(finishedAtStr);
                    if (finishedDate.getFullYear() === year && finishedDate.getMonth() === month && job[`${type}Id` as keyof Job] === staff.id) {
                        jobsCompleted++;
                        if (targetDateStr && new Date(finishedAtStr) <= new Date(targetDateStr)) {
                            onTimeCount++;
                        }
                        jobsInPeriod.push(job);
                    }
                }
            });

            const onTimeRate = jobsCompleted > 0 ? `${Math.round((onTimeCount / jobsCompleted) * 100)}%` : 'N/A';
            return { kpis: { jobsCompleted, onTimeRate }, tasks: jobsInPeriod.sort((a,b) => new Date(b[`${type}FinishedAt` as keyof Job] as string).getTime() - new Date(a[`${type}FinishedAt` as keyof Job] as string).getTime()) };
        }

    }, [employee, jobs, currentDate, isOperator]);

    return (
        <>
            <TaskTimelineModal
                show={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                task={selectedTask}
            />
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={onBack} className="flex items-center gap-1 text-sm p-2 bg-gray-200 rounded-md hover:bg-gray-300">
                        <ChevronLeftIcon /> Back to List
                    </button>
                    <div className="flex items-center gap-2">
                        <label htmlFor="month-picker" className="font-semibold">Select Month:</label>
                        <input 
                            type="month"
                            id="month-picker"
                            value={currentDate.toISOString().substring(0, 7)}
                            onChange={handleDateChange}
                            className="p-2 border rounded-md"
                        />
                    </div>
                </div>

                <div className="border-b pb-4 mb-4">
                    <h2 className="text-3xl font-bold text-indigo-700">{employee.name}</h2>
                    <p className="text-lg text-gray-600">{'position' in employee ? employee.position : employee.department}</p>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Monthly KPIs</h3>
                {isOperator ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <KpiCard title="Tasks Completed" value={(performanceData.kpis as any).tasksCompleted} />
                        <KpiCard title="Reworks Caused" value={(performanceData.kpis as any).reworksCaused} />
                        <KpiCard title="On-Time Rate" value={(performanceData.kpis as any).onTimeRate} />
                        <KpiCard title="Avg. Start Time" value={(performanceData.kpis as any).avgStartTime} subtext="Target: 07:30" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <KpiCard title="Jobs Completed" value={(performanceData.kpis as any).jobsCompleted} />
                        <KpiCard title="On-Time Rate" value={(performanceData.kpis as any).onTimeRate} />
                    </div>
                )}
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Completed Work Details</h3>
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            {isOperator ? (
                                <tr>
                                    <th className="px-3 py-2 text-left">Job / Task</th>
                                    <th className="px-3 py-2 text-left">Completed On</th>
                                    <th className="px-3 py-2 text-left">Net Duration</th>
                                    <th className="px-3 py-2 text-left">Status</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="px-3 py-2 text-left">Job Number</th>
                                    <th className="px-3 py-2 text-left">Target Date</th>
                                    <th className="px-3 py-2 text-left">Finished On</th>
                                    <th className="px-3 py-2 text-left">Net Duration</th>
                                    <th className="px-3 py-2 text-left">Status</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y">
                            {isOperator ? (
                                (performanceData.tasks as any[]).map(task => {
                                    const onTime = task.plannedDate && new Date(task.completedAt).setHours(0,0,0,0) <= new Date(task.plannedDate).getTime();
                                    return (
                                    <tr key={task.id} onClick={() => setSelectedTask(task)} className="cursor-pointer hover:bg-indigo-50">
                                        <td className="px-3 py-2"><div className="font-bold">{task.jobNumber}</div><div className="text-xs text-gray-500">{task.drawingName} - {task.name}</div></td>
                                        <td className="px-3 py-2">{new Date(task.completedAt!).toLocaleDateString()}</td>
                                        <td className="px-3 py-2 font-semibold">{calculateProcessNetDuration(task)}</td>
                                        <td className="px-3 py-2"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${onTime ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{onTime ? 'On-Time' : 'Delayed'}</span></td>
                                    </tr>
                                )})
                            ) : (
                                (performanceData.tasks as Job[]).map(job => {
                                    const type = (employee as OfficialStaff).position.toLowerCase().includes('design') ? 'designer' : 'programmer';
                                    const finishedAt = job[`${type}FinishedAt` as keyof Job] as string;
                                    const targetDate = job[`${type}TargetDate` as keyof Job] as string;
                                    const onTime = targetDate && new Date(finishedAt) <= new Date(targetDate);
                                    return (
                                        <tr key={job.id}>
                                            <td className="px-3 py-2 font-bold">{job.jobNumber}</td>
                                            <td className="px-3 py-2">{targetDate}</td>
                                            <td className="px-3 py-2">{new Date(finishedAt).toLocaleDateString()}</td>
                                            <td className="px-3 py-2 font-semibold">{calculateNetDuration(job[`${type}StartedAt` as keyof Job] as string, finishedAt, job[`${type}HoldHistory` as keyof Job] as any)}</td>
                                            <td className="px-3 py-2"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${onTime ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{onTime ? 'On-Time' : 'Delayed'}</span></td>
                                        </tr>
                                    )
                                })
                            )}
                            {performanceData.tasks.length === 0 && (
                                <tr><td colSpan={isOperator ? 4 : 5} className="text-center py-4 text-gray-500">No work completed in this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};