import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Plus, Save, Trash2, Loader2, Send, Sparkles,
  Search, Bookmark, Clock
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import { backend } from '../services/backend';
import { askQuestion } from '../services/chatService';
import { ChatConversation, ChatMessage as ChatMessageType } from '../types';

interface ChatAIProps {
  hasData: boolean;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

const SUGGESTED_QUESTIONS = [
  '¿Cuáles son las 5 tiendas con mayores ventas?',
  '¿Cuál es la tendencia de ventas del último mes?',
  '¿Qué productos se venden más?',
  '¿Cuánto se ha vendido este mes?'
];

const ChatAI: React.FC<ChatAIProps> = ({ hasData, onShowToast }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    const data = await backend.getChatConversations();
    setConversations(data);
  };

  const loadMessages = async (conversationId: string) => {
    const data = await backend.getChatMessages(conversationId);
    setMessages(data);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputValue('');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading || !hasData) return;

    const userQuestion = inputValue.trim();
    setInputValue('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let conversationId = activeConversationId;

    if (!conversationId) {
      const title = userQuestion.slice(0, 50);
      conversationId = await backend.createChatConversation(title);

      if (!conversationId) {
        onShowToast('Error al crear la conversación', 'error');
        return;
      }

      setActiveConversationId(conversationId);
      await loadConversations();
    }

    const tempUserMessage: ChatMessageType = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: userQuestion,
      chart_data: null,
      metadata: {},
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMessage]);
    setLoading(true);

    await backend.saveChatMessage(conversationId, 'user', userQuestion);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await askQuestion(userQuestion, conversationHistory);

      const assistantMessage: ChatMessageType = {
        id: `temp-assistant-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: response.content,
        chart_data: response.chartData || null,
        metadata: { chartType: response.chartType },
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      await backend.saveChatMessage(
        conversationId,
        'assistant',
        response.content,
        response.chartData,
        { chartType: response.chartType }
      );

      await loadConversations();
    } catch (error: any) {
      onShowToast(error.message || 'Error al procesar la pregunta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConversation = async () => {
    if (!activeConversationId || !saveTitle.trim()) return;

    const success = await backend.markConversationAsSaved(activeConversationId, saveTitle.trim());

    if (success) {
      onShowToast('Conversación guardada exitosamente', 'success');
      setShowSaveModal(false);
      setSaveTitle('');
      await loadConversations();
    } else {
      onShowToast('Error al guardar la conversación', 'error');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta conversación?')) return;

    const success = await backend.deleteChatConversation(conversationId);

    if (success) {
      onShowToast('Conversación eliminada', 'success');

      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }

      await loadConversations();
    } else {
      onShowToast('Error al eliminar la conversación', 'error');
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in fade-in duration-500">
        <div className="bg-gradient-to-br from-slate-100 to-blue-100 p-8 rounded-3xl mb-6">
          <MessageSquare className="w-16 h-16 text-slate-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-700 mb-2">Chat IA no disponible</h3>
        <p className="text-slate-500 max-w-md">
          Primero debes cargar datos de ventas para poder hacer preguntas al asistente de IA.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)] animate-in fade-in duration-500">
      <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={handleNewConversation}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            Nueva Conversación
          </button>

          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              No hay conversaciones
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all mb-2 group ${
                  activeConversationId === conv.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {conv.saved && (
                        <Bookmark size={14} className="text-blue-500 flex-shrink-0" />
                      )}
                      <p className="font-medium text-sm text-slate-700 truncate">
                        {conv.title}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(conv.created_at).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {activeConversationId ? (
          <>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {activeConversation?.title || 'Conversación'}
                  </h3>
                  <p className="text-xs text-slate-500">Asistente de Ventas IA</p>
                </div>
              </div>

              {activeConversation && !activeConversation.saved && (
                <button
                  onClick={() => {
                    setSaveTitle(activeConversation.title);
                    setShowSaveModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all font-medium text-sm"
                >
                  <Save size={16} />
                  Guardar
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  chartData={msg.chart_data}
                  chartType={msg.metadata?.chartType}
                  timestamp={msg.created_at}
                />
              ))}

              {loading && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center">
                    <Loader2 className="animate-spin text-slate-600" size={18} />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-slate-500 text-sm">Analizando datos...</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregunta sobre tus datos de ventas..."
                  className="flex-1 resize-none px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] max-h-[120px]"
                  rows={1}
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || loading}
                  className="px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg">
              <Sparkles className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              Asistente de Ventas IA
            </h3>
            <p className="text-slate-500 mb-8 text-center max-w-md">
              Pregunta cualquier cosa sobre tus datos de ventas en lenguaje natural
            </p>

            <div className="w-full max-w-xl space-y-3">
              <p className="text-sm font-semibold text-slate-600 mb-3">Preguntas sugeridas:</p>
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    setInputValue(question);
                    const conversationId = await backend.createChatConversation(question.slice(0, 50));
                    if (conversationId) {
                      setActiveConversationId(conversationId);
                      await loadConversations();
                    }
                  }}
                  className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-sm text-slate-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Guardar Conversación</h3>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Título de la conversación"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveTitle('');
                }}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConversation}
                disabled={!saveTitle.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAI;
