import React, { useState } from 'react';
import type { Job, Operator, Process, ChatMessage, OfficialStaff } from '../types';
import { CalendarView } from '../components/CalendarView';
import { DailyAssignmentView } from '../components/DailyAssignmentView';
import { OperatorLogin } from './OperatorLogin';
import { OperatorDashboard } from './OperatorDashboard';
import { ChevronLeftIcon } from '../components/Icons';
import { TodaysWorkModal } from '../components/modals/TodaysWorkModal';
import { ActionVerifyModal } from '../components/modals/ActionVerifyModal';
import { ProcessHoldModal } from '../components/modals/ProcessHoldModal';
import { OperatorDetailsModal } from '../components/modals/OperatorDetailsModal';
import { ChatNotificationModal } from '../components/modals/ChatNotificationModal';
import { OperatorProfileModal } from '../components/modals/OperatorProfileModal';

interface WorkPlaceProps {
    jobs: Job[];
    operators: Operator[];
    onAssignOperator: (jobId: string, drawingId: string, processId: string, operatorId: string | null, isOvertime?: boolean) => void;
    getDepartmentForProcess: (processName: string) => string | null;
    allDepartments: string[];
    showModal: (message: string) => void;
    onOperatorStartProcess: (jobId: string, drawingId: string, processId: string) => void;
    onOperatorHoldProcess: (jobId: string, drawingId: string, processId: string, reason: string) => void;
    onOperatorResumeProcess: (jobId: string, drawingId: string, processId: string) => void;
    onOperatorFinishProcess: (jobId: string, drawingId: string, sequence: number, isCompleted: boolean) => void;
    // New props for chat notifications
    messages: ChatMessage[];
    setCurrentUser: (user: OfficialStaff | Operator | null) => void;
    openChat: () => void;
    updateOperator: (operatorId: string, data: Partial<Operator>) => void;
}

type ProcessWithJobInfo = Process & {
    jobId: string;
    drawingId: string;
    jobNumber: string;
    drawingName: string;
    jobFinishDate: string;
};

export const WorkPlace: React.FC<WorkPlaceProps> = (props) => {
    const [view, setView] = useState<'selector' | 'teamLeader' | 'operatorLogin' | 'operatorDashboard'>('selector');
    const [teamLeaderSubView, setTeamLeaderSubView] = useState<'calendar' | 'dailyAssignment'>('calendar');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    
    // State for the new operator flow
    const [showTodaysWorkModalFor, setShowTodaysWorkModalFor] = useState<Operator | null>(null);
    const [actionToVerify, setActionToVerify] = useState<{
        operator: Operator;
        action: 'hold' | 'resume' | 'finish' | 'login' | 'viewDetails';
        task?: ProcessWithJobInfo;
    } | null>(null);
    const [holdTask, setHoldTask] = useState<ProcessWithJobInfo | null>(null);
    const [operatorForDetails, setOperatorForDetails] = useState<Operator | null>(null);
    const [chatNotification, setChatNotification] = useState<{ operator: Operator; count: number } | null>(null);
    const [operatorForProfile, setOperatorForProfile] = useState<Operator | null>(null);


    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
        setTeamLeaderSubView('dailyAssignment');
    };

    const handleBackToCalendar = () => {
        setTeamLeaderSubView('calendar');
        setSelectedDate(null);
    };
    
    // Called from TodaysWorkModal or if operator has no tasks today
    const handleLoginComplete = (operator: Operator) => {
        setShowTodaysWorkModalFor(operator);
        setView('operatorDashboard'); // Set the background view to the dashboard
    };

    // Called from OperatorLogin when EMP No is submitted
    const handleInitiateLogin = (empNumber: string) => {
        const operator = props.operators.find(o => o.empNumber.toLowerCase() === empNumber.toLowerCase());
        if (operator) {
            setActionToVerify({ operator, action: 'login' });
        } else {
            props.showModal("Employee Number not found.");
        }
    };
    
    // Called from dashboard to view an operator's details
    const handleShowOperatorDetails = (operatorId: string) => {
        const operator = props.operators.find(o => o.id === operatorId);
        if (operator) {
            setActionToVerify({ operator, action: 'viewDetails' });
        }
    };

    // Called from dashboard when Hold/Finish is clicked
    const handleTriggerAction = (operatorId: string, action: 'hold' | 'resume' | 'finish', task: ProcessWithJobInfo) => {
        const operator = props.operators.find(o => o.id === operatorId);
        if (operator) {
            if (action === 'resume') { 
                props.onOperatorResumeProcess(task.jobId, task.drawingId, task.id);
            } else {
                setActionToVerify({ operator, action, task });
            }
        }
    };
    
    // Called after ActionVerifyModal succeeds
    const handleActionSuccess = () => {
        if (!actionToVerify) return;
        const { action, task, operator } = actionToVerify;

        if (action === 'login') {
            const unreadCount = props.messages.filter(m => m.recipientId === operator.id && !m.isRead).length;
            if (unreadCount > 0) {
                setChatNotification({ operator, count: unreadCount });
            }
            handleLoginComplete(operator);
        } else if (action === 'viewDetails') {
            setOperatorForDetails(operator);
        } else if (action === 'hold' && task) {
            setHoldTask(task);
        } else if (action === 'finish' && task) {
            props.onOperatorFinishProcess(task.jobId, task.drawingId, task.sequence, true);
        }
        setActionToVerify(null); // Close verification modal
    };

    // Called after reason is provided in ProcessHoldModal
    const handleConfirmHold = (reason: string) => {
        if (holdTask) {
            props.onOperatorHoldProcess(holdTask.jobId, holdTask.drawingId, holdTask.id, reason);
            setHoldTask(null);
        }
    };

    const handleViewMessages = () => {
        if (chatNotification) {
            props.setCurrentUser(chatNotification.operator);
            props.openChat();
            setChatNotification(null);
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'operatorLogin':
                return <OperatorLogin onInitiateLogin={handleInitiateLogin} />;

            case 'operatorDashboard':
                return <OperatorDashboard 
                    operators={props.operators} 
                    jobs={props.jobs} 
                    onLoginClick={() => setView('operatorLogin')}
                    onTriggerAction={handleTriggerAction}
                    onShowOperatorDetails={handleShowOperatorDetails}
                />;
            
            case 'teamLeader':
                return (
                    <div>
                        <button onClick={() => setView('selector')} className="flex items-center gap-1 text-sm p-2 mb-4 bg-gray-200 rounded-md hover:bg-gray-300">
                            <ChevronLeftIcon /> Back to Main Menu
                        </button>
                        {teamLeaderSubView === 'calendar' ? (
                            <CalendarView jobs={props.jobs} onDateSelect={handleDateSelect} getDepartmentForProcess={props.getDepartmentForProcess} />
                        ) : (
                            <DailyAssignmentView 
                                selectedDate={selectedDate!} 
                                jobs={props.jobs} 
                                operators={props.operators} 
                                onAssignOperator={props.onAssignOperator} 
                                onBack={handleBackToCalendar} 
                                getDepartmentForProcess={props.getDepartmentForProcess}
                                allDepartments={props.allDepartments}
                            />
                        )}
                    </div>
                );

            case 'selector':
            default:
                return (
                    <div className="text-center p-10">
                        <h2 className="text-3xl font-bold text-indigo-700 mb-8">Work Place Selection</h2>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
                            <button 
                                onClick={() => setView('operatorDashboard')}
                                className="p-8 bg-blue-600 text-white rounded-lg text-xl font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform text-center"
                            >
                                <h3>Operator View</h3>
                                <p className="text-sm font-normal mt-2">(Shared Shop Floor Display)</p>
                            </button>
                            <button 
                                onClick={() => setView('teamLeader')} 
                                className="p-8 bg-indigo-600 text-white rounded-lg text-xl font-semibold hover:bg-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform text-center"
                            >
                                <h3>Team Leader View</h3>
                                <p className="text-sm font-normal mt-2">(Assign & Manage Tasks)</p>
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            <ChatNotificationModal
                show={!!chatNotification}
                operatorName={chatNotification?.operator.name || ''}
                unreadCount={chatNotification?.count || 0}
                onDismiss={() => setChatNotification(null)}
                onViewMessages={handleViewMessages}
            />
            <TodaysWorkModal 
                show={!!showTodaysWorkModalFor} 
                operator={showTodaysWorkModalFor} 
                onClose={() => setShowTodaysWorkModalFor(null)} 
                jobs={props.jobs} 
                onStartProcess={props.onOperatorStartProcess} 
                onResumeProcess={props.onOperatorResumeProcess}
                onShowProfile={() => setOperatorForProfile(showTodaysWorkModalFor)}
            />
             <ActionVerifyModal 
                show={!!actionToVerify} 
                onClose={() => setActionToVerify(null)} 
                operator={actionToVerify?.operator || null} 
                onSuccess={handleActionSuccess} 
                actionTitle={`${actionToVerify?.action || ''}`}
            />
            <ProcessHoldModal 
                show={!!holdTask}
                onClose={() => setHoldTask(null)}
                onConfirm={handleConfirmHold}
            />
            <OperatorDetailsModal
                show={!!operatorForDetails}
                onClose={() => setOperatorForDetails(null)}
                operator={operatorForDetails}
                jobs={props.jobs}
            />
            <OperatorProfileModal
                show={!!operatorForProfile}
                onClose={() => setOperatorForProfile(null)}
                operator={operatorForProfile}
                jobs={props.jobs}
                messages={props.messages}
                openChat={props.openChat}
                setCurrentUser={props.setCurrentUser}
                updateOperator={props.updateOperator}
            />
            <section className="bg-white p-6 rounded-xl shadow-lg mb-8 max-w-full mx-auto">
                {renderContent()}
            </section>
        </>
    );
};