import React, { useState } from 'react';
import CreateWorkflowModal from './CreateWorkflowModal';
import {
    LayoutDashboard,
    Code,
    Settings2,
    Activity,
    Workflow,
    Play,
    Zap,
    Plus,
    Upload
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWorkflows } from '../App';
import logo from '../assets/vi.png';

const navigation = [
    { name: "Workflows", href: "/workflows", icon: Workflow },
    { name: "Scripts", href: "/scripts", icon: Code },
    { name: "Variables", href: "/variables", icon: Settings2 },
    { name: "Monitoring", href: "/monitoring", icon: Activity },
    { name: "File Upload", href: "/file-upload", icon: Upload },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { workflows, loading } = useWorkflows();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleNewWorkflow = () => setIsCreateModalOpen(true);

    const handleWorkflowCreated = (workflow) => {
        console.log('✅ New workflow created:', workflow);
        navigate(`/workflow-builder/${workflow.id}`);
    };

    return (
<div className="flex flex-col h-full bg-black text-gray-200 w-64 shadow-xl p-4 border border-gray-700">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
                <img
                    src={logo}
                    alt="Logo"
                    className="h-16 w-auto object-contain"
                />
            </div>

            {/* New Workflow Button */}
            <div className="mb-6 px-2">
                <button
                    onClick={handleNewWorkflow}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.03]"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Workflow</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col space-y-2">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.href)}
                            className={`
                                flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${isActive
                                    ? "bg-purple-700 text-white shadow-inner"
                                    : "hover:bg-purple-800/30 hover:text-white"}
                                transform hover:scale-[1.02] duration-150
                            `}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Modal */}
            <CreateWorkflowModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onWorkflowCreated={handleWorkflowCreated}
            />
        </div>
    );
}
