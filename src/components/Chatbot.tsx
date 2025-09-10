import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { openaiService, type ChatbotResponse } from '../services/openai';
import { Button } from './ui/button';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'info' | 'data' | 'error' | 'warning';
}

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Chatbot({ isOpen, onToggle }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: '👋 Salut ! Je suis votre assistant Ordo. Je peux vous aider avec vos emails et catégories. Que souhaitez-vous savoir ?',
      isUser: false,
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    categoriesCount: 0,
    emailsCount: 0,
    lastSync: null as Date | null
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [categoriesResult, emailsResult] = await Promise.all([
        supabase.from('categories').select('id').eq('user_id', user.id),
        supabase.from('emails').select('id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
      ]);

      setStats({
        categoriesCount: categoriesResult.data?.length || 0,
        emailsCount: emailsResult.data?.length || 0,
        lastSync: emailsResult.data?.[0]?.created_at ? new Date(emailsResult.data[0].created_at) : null
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const response: ChatbotResponse = await openaiService.handleChatbotQuery(inputValue, user.id);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        type: response.type
      };

      setMessages(prev => [...prev, botMessage]);

      // Sauvegarder la conversation en base
      await saveChatMessage(userMessage, botMessage);

    } catch (error) {
      console.error('Erreur chatbot:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChatMessage = async (userMessage: ChatMessage, botMessage: ChatMessage) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionId = crypto.randomUUID();

      await supabase.from('chatbot_messages').insert([
        {
          user_id: user.id,
          content: userMessage.content,
          is_user: true,
          session_id: sessionId
        },
        {
          user_id: user.id,
          content: botMessage.content,
          is_user: false,
          session_id: sessionId
        }
      ]);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageTypeIcon = (type?: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'data': return '📊';
      default: return '🤖';
    }
  };

  const getMessageTypeColor = (type?: string) => {
    switch (type) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'data': return 'text-blue-600';
      default: return 'text-gray-700';
    }
  };

  const quickQuestions = [
    "Combien de catégories j'ai créées ?",
    "Quels sont mes derniers emails ?",
    "Résume mes emails par catégorie",
    "Quand a eu lieu ma dernière synchronisation ?"
  ];

  return (
    <>
      {/* Bouton flottant */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
      >
        <Button
          onClick={onToggle}
          className={`relative w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${
            isOpen 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          aria-label={isOpen ? 'Fermer le chatbot' : 'Ouvrir le chatbot'}
        >
          <motion.span
            className="text-2xl"
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? '✕' : '🤖'}
          </motion.span>
          
          {/* Badge de notification */}
          {stats.categoriesCount > 0 && !isOpen && (
            <motion.div
              className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5 }}
            >
              {stats.categoriesCount}
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Interface du chatbot */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-semibold">Assistant Ordo</h3>
                    <p className="text-xs opacity-80">Votre aide intelligente</p>
                  </div>
                </div>
                <Button
                  onClick={onToggle}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  ✕
                </Button>
              </div>
              
              {/* Stats rapides */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white/20 rounded-lg p-2 text-center">
                  <div className="font-semibold">{stats.categoriesCount}</div>
                  <div className="opacity-80">Catégories</div>
                </div>
                <div className="bg-white/20 rounded-lg p-2 text-center">
                  <div className="font-semibold">{stats.emailsCount}</div>
                  <div className="opacity-80">Emails</div>
                </div>
                <div className="bg-white/20 rounded-lg p-2 text-center">
                  <div className="font-semibold">
                    {stats.lastSync ? '✅' : '⏳'}
                  </div>
                  <div className="opacity-80">Sync</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {!message.isUser && (
                      <div className={`text-xs mb-1 ${getMessageTypeColor(message.type)}`}>
                        {getMessageTypeIcon(message.type)} Assistant
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Questions rapides */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <div className="text-xs text-gray-500 mb-2">Questions rapides :</div>
                <div className="grid grid-cols-1 gap-1">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(question)}
                      className="text-left text-xs bg-gray-50 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Posez votre question..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="px-4"
                >
                  📤
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
