import React from 'react';
import { User, Bot } from 'lucide-react';
import ChatChart from './ChatChart';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  chartData?: any;
  chartType?: 'bar' | 'line' | 'pie';
  timestamp?: string;
}

const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffMs = now.getTime() - messageTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, chartData, chartType, timestamp }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser
          ? 'bg-blue-500 text-white'
          : 'bg-gradient-to-br from-slate-100 to-blue-100 text-slate-600'
      }`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 rounded-tl-sm shadow-sm'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div
              className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-900 prose-ul:text-slate-700"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>

        {chartData && chartType && !isUser && (
          <div className="mt-3">
            <ChatChart data={chartData} type={chartType} />
          </div>
        )}

        {timestamp && (
          <p className={`text-xs text-slate-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatRelativeTime(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
