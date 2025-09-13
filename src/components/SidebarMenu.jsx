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
import { Link, useLocation, useNavigate } from "react-router-dom"; // ✅ navigate için
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
    const navigate = useNavigate(); // ✅ yönlendirme için
    const { workflows, loading, error, refreshWorkflows } = useWorkflows();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // ✅ Fonksiyonlar component içinde
    const handleNewWorkflow = () => {
        setIsCreateModalOpen(true);
    };

    const handleWorkflowCreated = (workflow) => {
        console.log('✅ New workflow created:', workflow);
        navigate(`/workflow-builder/${workflow.id}`);
    };

    return (
        <div  >
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 px-6 py-6 ">
                <img
                    src={logo}
                    alt="Logo"
                    className="h-12 w-24 sm:h-16 sm:w-32 md:h-20 md:w-40 lg:h-13 lg:w-40 object-contain"
                />
            </div>

       

             <div className="px-4 py-4">
                <button
                    onClick={handleNewWorkflow}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Workflow</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.href)}
                            className={`flex items-center w-full justify-start gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors
                                ${isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300"
                                }
                                hover:scale-[1.03] hover:shadow-md duration-150`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </button>
                    );
                })}
            </nav>
                 <CreateWorkflowModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onWorkflowCreated={handleWorkflowCreated}
            />
        </div>
    );
}
