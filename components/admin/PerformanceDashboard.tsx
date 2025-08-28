import React, { useState } from 'react';
import type { Operator, OfficialStaff } from '../../types';

interface PerformanceDashboardProps {
    operators: Operator[];
    officialStaff: OfficialStaff[];
    onSelectEmployee: (employee: Operator | OfficialStaff) => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ operators, officialStaff, onSelectEmployee }) => {
    const [activeTab, setActiveTab] = useState<'staff' | 'operators'>('operators');
    const [filterText, setFilterText] = useState('');

    const lowerCaseFilter = filterText.toLowerCase();

    const filteredStaff = officialStaff.filter(s => 
        s.name.toLowerCase().includes(lowerCaseFilter) || 
        s.empNumber.toLowerCase().includes(lowerCaseFilter)
    );

    const filteredOperators = operators.filter(o => 
        o.name.toLowerCase().includes(lowerCaseFilter) || 
        o.empNumber.toLowerCase().includes(lowerCaseFilter)
    );

    const EmployeeList: React.FC<{ employees: (OfficialStaff | Operator)[] }> = ({ employees }) => (
        <ul className="space-y-2">
            {employees.map(employee => (
                <li key={employee.id}>
                    <button 
                        onClick={() => onSelectEmployee(employee)}
                        className="w-full text-left flex justify-between items-center p-3 bg-gray-100 rounded-md hover:bg-indigo-100 hover:shadow-sm transition-all"
                    >
                        <div>
                            <p className="font-semibold">{employee.name}</p>
                            <p className="text-xs text-gray-600">
                                EMP: {employee.empNumber} | {'position' in employee ? employee.position : employee.department}
                            </p>
                        </div>
                        <span className="text-xs font-semibold text-indigo-600">View Details &rarr;</span>
                    </button>
                </li>
            ))}
            {employees.length === 0 && (
                <li className="text-center text-gray-500 py-4">No employees match the filter.</li>
            )}
        </ul>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold mb-4 text-indigo-600">Employee Performance</h3>
            
            <div className="mb-4">
                <input
                    type="text"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    placeholder="Search by name or employee number..."
                    className="w-full p-2 border rounded-md"
                />
            </div>

            <div className="flex border-b mb-4">
                <button 
                    onClick={() => setActiveTab('operators')}
                    className={`px-4 py-2 font-semibold ${activeTab === 'operators' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                >
                    Operators ({filteredOperators.length})
                </button>
                <button 
                    onClick={() => setActiveTab('staff')}
                    className={`px-4 py-2 font-semibold ${activeTab === 'staff' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                >
                    Official Staff ({filteredStaff.length})
                </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto pr-2">
                {activeTab === 'operators' ? <EmployeeList employees={filteredOperators} /> : <EmployeeList employees={filteredStaff} />}
            </div>
        </div>
    );
};