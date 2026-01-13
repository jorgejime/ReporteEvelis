import React from 'react';
import { 
  TrendingUp, 
  LayoutDashboard, 
  UploadCloud, 
  Database, 
  Bot 
} from 'lucide-react';
import { AppTab } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: AppTab.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppTab.AI_REPORT, label: 'Reporte IA', icon: Bot },
    { id: AppTab.UPLOAD, label: 'Cargar Datos', icon: UploadCloud },
    { id: AppTab.DATA, label: 'Datos Brutos', icon: Database },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 shadow-xl z-20">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">SodiAnalytics</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Enterprise AI</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="font-medium text-sm">{item.label}</span>
              {item.id === AppTab.AI_REPORT && (
                <span className="ml-auto bg-indigo-500 text-[10px] font-bold px-2 py-0.5 rounded text-white animate-pulse">
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">Status del Sistema</p>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Motor IA Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
