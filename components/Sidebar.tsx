import React from 'react';
import {
  TrendingUp,
  LayoutDashboard,
  UploadCloud,
  Database,
  Bot,
  Sparkles,
  FileText,
  MessageSquare
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
    { id: AppTab.CHAT_AI, label: 'Chat IA', icon: MessageSquare },
    { id: AppTab.REPORTS_HISTORY, label: 'Historial', icon: FileText },
    { id: AppTab.UPLOAD, label: 'Cargar Datos', icon: UploadCloud },
    { id: AppTab.DATA, label: 'Datos Brutos', icon: Database },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-700/50 shadow-2xl z-20">
      <div className="p-6 border-b border-slate-700/50 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SodiAnalytics</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Cloud Edition
            </p>
          </div>
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
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 animate-pulse"></div>
              )}
              <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="font-semibold text-sm relative z-10">{item.label}</span>
              {item.id === AppTab.AI_REPORT && (
                <span className="ml-auto bg-gradient-to-r from-emerald-500 to-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md text-white shadow-lg shadow-emerald-500/50 relative z-10">
                  IA
                </span>
              )}
              {item.id === AppTab.CHAT_AI && (
                <span className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-[10px] font-bold px-2 py-1 rounded-md text-white shadow-lg shadow-purple-500/50 relative z-10">
                  NUEVO
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50 space-y-3">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="font-bold text-slate-300 mb-2 text-sm relative z-10">Estado del Sistema</p>
          <div className="space-y-2 relative z-10">
            <div className="flex items-center space-x-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Supabase Cloud</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-lg shadow-blue-500/50"></span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Motor IA Activo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
