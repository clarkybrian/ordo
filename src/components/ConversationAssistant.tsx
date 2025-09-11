import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Minimize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { openaiService } from '../services/openai';
import { Button } from './ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'info' | 'data' | 'error' | 'success';
}

interface AssistantUsage {
  question_count: number;
  remaining_questions: number;
  last_reset_date: string;
}

interface ConversationAssistantProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export default function ConversationAssistant({ isMinimized, onToggleMinimize }: ConversationAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: '✨ Salut ! Je suis votre assistant email intelligent Orton ! 🤖\n\n🧠 Je connais tous vos emails par cœur et peux vous aider avec :\n\n📋 **Résumés détaillés** de vos derniers emails\n✍️ **Aide à la rédaction** de réponses personnalisées\n🔍 **Recherche avancée** dans toute votre boîte mail\n📊 **Analyses complètes** de vos habitudes email\n🎯 **Priorisation** des emails importants\n📅 **Gestion** de votre planning email\n💡 **Conseils** pour optimiser votre productivité\n\n💎 **4 questions par jour** - Utilisez-les bien ! 🚀\n\n🎉 Que puis-je faire pour vous aujourd\'hui ?',
      isUser: false,
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<AssistantUsage>({
    question_count: 0,
    remaining_questions: 4,
    last_reset_date: new Date().toISOString().split('T')[0]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadUsage();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_or_create_assistant_usage', { user_uuid: user.id });

      if (error) throw error;
      if (data && data.length > 0) {
        setUsage({
          question_count: data[0].question_count,
          remaining_questions: data[0].remaining_questions,
          last_reset_date: data[0].last_reset_date
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'usage:', error);
    }
  };

  const incrementUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('increment_assistant_usage', { user_uuid: user.id });

      if (error) throw error;
      if (data && data.length > 0) {
        setUsage(prev => ({
          ...prev,
          question_count: data[0].question_count,
          remaining_questions: data[0].remaining_questions
        }));
      }
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation de l\'usage:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Vérifier s'il reste des questions
    if (usage.remaining_questions <= 0) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: '❌ Vous avez atteint votre limite de 4 questions par jour. Revenez demain pour poser de nouvelles questions !',
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

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
      // Incrémenter l'usage avant d'envoyer la question
      await incrementUsage();

      // Appeler l'API OpenAI avec l'historique de conversation
      const conversationHistory = messages
        .filter(m => m.isUser || m.type !== 'info')
        .slice(-6) // Garde les 6 derniers messages pour le contexte
        .map(m => ({
          role: m.isUser ? 'user' as const : 'assistant' as const,
          content: m.content
        }));

      const response = await openaiService.getAdvancedEmailResponse(
        inputValue,
        conversationHistory
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        isUser: false,
        timestamp: new Date(),
        type: response.type || 'success'
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: '❌ Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.',
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-[110]"
      >
        <Button
          onClick={onToggleMinimize}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 bottom-0 w-112 bg-white shadow-2xl border-l border-gray-200 z-[100] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Assistant Orton</h3>
              <p className="text-xs text-blue-100">Assistant IA avancé</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="text-white hover:bg-white/20"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Compteur de questions */}
        <div className="mt-3 bg-white/10 rounded-lg p-2">
          <div className="flex items-center justify-between text-xs">
            <span>Questions aujourd'hui</span>
            <span className="font-semibold">{usage.question_count}/4</span>
          </div>
          <div className="mt-1 bg-white/20 rounded-full h-1.5">
            <div 
              className="bg-white rounded-full h-1.5 transition-all duration-300"
              style={{ width: `${(usage.question_count / 4) * 100}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-blue-100">
            {usage.remaining_questions} questions restantes
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2 bg-gray-50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[95%] ${message.isUser ? 'order-2' : 'order-1'}`}>
                <div className="flex items-start space-x-1.5">
                  {!message.isUser && (
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                  )}
                  
                  <div className={`
                    rounded-xl px-3 py-2 shadow-sm
                    ${message.isUser 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                      : message.type === 'error'
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : message.type === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-white border border-gray-200 text-gray-800'
                    }
                  `}>
                    <div className="text-xs leading-snug">
                      {message.isUser ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
                        <MarkdownRenderer 
                          content={message.content}
                          className={
                            message.type === 'error' ? 'prose-red' :
                            message.type === 'success' ? 'prose-green' : 'prose-gray'
                          }
                        />
                      )}
                    </div>
                    <div className={`text-xs mt-1 opacity-60 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.isUser && (
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="h-3 w-3 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-1.5">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-2 py-3 bg-white border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={usage.remaining_questions > 0 ? "Posez-moi une question sur vos emails..." : "Plus de questions aujourd'hui"}
              disabled={isLoading || usage.remaining_questions <= 0}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-24 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              rows={1}
              style={{ minHeight: '36px' }}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || usage.remaining_questions <= 0}
            className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {usage.remaining_questions <= 0 && (
          <div className="mt-1.5 text-xs text-red-600 text-center">
            Limite quotidienne atteinte. Revenez demain !
          </div>
        )}
      </div>
    </motion.div>
  );
}
