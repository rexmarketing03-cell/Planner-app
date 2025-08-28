import React, { useState, useMemo } from 'react';
import type { Job } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CalendarViewProps {
    jobs: Job[];
    onDateSelect: (date: string) => void;
    getDepartmentForProcess: (processName: string) => string | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ jobs, onDateSelect, getDepartmentForProcess }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const scheduledWorkByDate = useMemo(() => {
        const workMap = new Map<string, Set<string>>();
        jobs.forEach(job => {
            job.drawings?.forEach(drawing => {
                drawing.processes.forEach(process => {
                    if (process.plannedDate) {
                        const dateStr = process.plannedDate; // YYYY-MM-DD
                        if (!workMap.has(dateStr)) {
                            workMap.set(dateStr, new Set());
                        }
                        const dept = getDepartmentForProcess(process.name);
                        if (dept) {
                            workMap.get(dateStr)!.add(dept);
                        }
                    }
                });
            });
        });
        return workMap;
    }, [jobs, getDepartmentForProcess]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        const today = new Date();
        today.setHours(0,0,0,0);

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="border-r border-b p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const workDepts = scheduledWorkByDate.get(dateStr);
            const isToday = date.getTime() === today.getTime();

            days.push(
                <div 
                    key={day} 
                    className={`border-r border-b p-2 min-h-[120px] flex flex-col ${workDepts ? 'cursor-pointer hover:bg-indigo-50' : 'bg-gray-50'}`}
                    onClick={() => workDepts && onDateSelect(dateStr)}
                >
                    <span className={`font-semibold ${isToday ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day}</span>
                    {workDepts && (
                        <div className="mt-1 space-y-1 text-xs overflow-hidden">
                            {Array.from(workDepts).slice(0, 3).map(dept => (
                                <div key={dept} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate">{dept}</div>
                            ))}
                            {workDepts.size > 3 && <div className="text-gray-500 font-bold">...</div>}
                        </div>
                    )}
                </div>
            );
        }
        return days;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-gray-100"><ChevronLeftIcon /></button>
                <h2 className="text-2xl font-bold text-indigo-700">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-gray-100"><ChevronRightIcon /></button>
            </div>
            <div className="grid grid-cols-7 border-t border-l">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-bold p-2 border-r border-b bg-gray-100">{day}</div>
                ))}
                {renderCalendar()}
            </div>
        </div>
    );
};
