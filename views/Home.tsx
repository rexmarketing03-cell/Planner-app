
import React from 'react';
import type { PortalSection } from '../types';
import { SalesIcon, EngineeringIcon, QualityIcon, ProductionIcon, InventoryIcon, AdminIcon, UsersIcon } from '../components/Icons';

interface HomeProps {
    onSelectPortal: (portal: PortalSection) => void;
}

const portalData: { id: PortalSection; title: string; description: string; Icon: React.FC; color: string }[] = [
    { id: 'sales', title: 'Sales & Quoting', description: 'Create new jobs and manage customer requests.', Icon: SalesIcon, color: 'from-blue-400 to-blue-600' },
    { id: 'engineering', title: 'Engineering', description: 'Handle design and programming for service jobs.', Icon: EngineeringIcon, color: 'from-purple-400 to-purple-600' },
    { id: 'quality', title: 'Quality Assurance', description: 'Perform quality checks on completed processes.', Icon: QualityIcon, color: 'from-green-400 to-green-600' },
    { id: 'production', title: 'Production Floor', description: 'View workflow and manage operator assignments.', Icon: ProductionIcon, color: 'from-pink-400 to-pink-600' },
    { id: 'logistics', title: 'Logistics & Inventory', description: 'Manage material stock and product orders.', Icon: InventoryIcon, color: 'from-yellow-400 to-yellow-600' },
    { id: 'workPlace', title: 'Operator Work Station', description: 'Login for operators to view and manage assigned tasks.', Icon: UsersIcon, color: 'from-teal-400 to-teal-600' },
    { id: 'admin', title: 'Administration', description: 'Manage all settings and view comprehensive reports.', Icon: AdminIcon, color: 'from-gray-400 to-gray-600' },
];

export const Home: React.FC<HomeProps> = ({ onSelectPortal }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 sm:p-6">
            <header className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-800 drop-shadow-md">Rex Industries Workflow Planner</h1>
                <p className="text-lg text-indigo-600 mt-2">Please select your department portal to begin.</p>
            </header>
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                {portalData.map(({ id, title, description, Icon, color }) => (
                    <div
                        key={id}
                        onClick={() => onSelectPortal(id)}
                        className={`bg-gradient-to-br ${color} text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between p-8`}
                    >
                        <div className="flex justify-start">
                            <div className="bg-white bg-opacity-20 p-4 rounded-full">
                                <Icon />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mt-4">{title}</h2>
                            <p className="mt-2 text-white text-opacity-90">{description}</p>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
};