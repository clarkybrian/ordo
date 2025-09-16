import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Minimize2, Crown, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { openaiService } from '../services/openai';
import { subscriptionService } from '../services/subscription';
import { Button } from './ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useWindowSize } from '../hooks/useWindowSize';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'info' | 'data' | 'error' | 'success';
}

interface UserPlan {
  type: 'free' | 'pro' | 'premium';
  questionsLimit: number | null;
  questionsUsed: number;
  aiModel: string;
}

interface ConversationAssistantProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export default function ConversationAssistant({ isMinimized, onToggleMinimize }: ConversationAssistantProps) {
  const { isMobile } = useWindowSize();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Bonjour ! Assistant Orton à votre service. Comment puis-je vous aider avec vos emails ?',
      isUser: false,
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan>({
    type: 'free',
    questionsLimit: 3,
    questionsUsed: 0,
    aiModel: 'gpt-3.5-turbo'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadUserPlan();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const plan = await subscriptionService.getUserPlan(user.id);
      setUserPlan(plan);
    } catch (error) {
      console.error('Erreur lors du chargement du plan:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Vérifier s'il peut encore poser des questions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const canAsk = await subscriptionService.canAskQuestion(user.id);
    if (!canAsk) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: userPlan.type === 'free' 
          ? '❌ Vous avez atteint votre limite de 3 questions par mois. Passez au plan Pro pour poser jusqu\'à 20 questions !'
          : '❌ Vous avez atteint votre limite mensuelle. Contactez-nous pour en savoir plus.',
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Afficher le bouton upgrade après le message d'erreur
      setTimeout(() => showUpgradeButton(), 1000);
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
      // Enregistrer l'utilisation de la question
      await subscriptionService.recordQuestionUsed(user.id);
      
      // Recharger le plan pour mettre à jour le compteur
      await loadUserPlan();

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

      // Détecter si c'est un message de limite atteinte
      if (response.content === 'UPGRADE_LIMIT_REACHED') {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: userPlan.type === 'free' 
            ? '⚠️ Vous avez atteint votre limite de 3 questions par mois !'
            : '⚠️ Vous avez atteint votre limite mensuelle !',
          isUser: false,
          timestamp: new Date(),
          type: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
        
        // Afficher le bouton upgrade immédiatement
        setTimeout(() => showUpgradeButton(), 500);
        return;
      }

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

  const showUpgradeButton = () => {
    const upgradeMessage: ChatMessage = {
      id: `upgrade-${Date.now()}`,
      content: 'UPGRADE_BUTTON', // Message spécial pour afficher le bouton
      isUser: false,
      timestamp: new Date(),
      type: 'info'
    };
    setMessages(prev => [...prev, upgradeMessage]);
  };

  const handleUpgrade = () => {
    navigate('/subscription');
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
    <div>
      {/* Backdrop overlay pour mobile */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[99]"
          onClick={onToggleMinimize}
        />
      )}
      
      <motion.div
        initial={{ x: isMobile ? '100%' : 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: isMobile ? '100%' : 400, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`fixed z-[100] bg-white shadow-2xl flex flex-col ${
          isMobile 
            ? 'inset-0 top-16' // Plein écran sur mobile, mais en dessous du header
            : 'top-0 right-0 bottom-0 w-112 border-l border-gray-200' // Sidebar sur desktop
        }`}
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
            <span>Questions ce mois</span>
            <span className="font-semibold">
              {userPlan.questionsUsed}/{userPlan.questionsLimit || '∞'}
            </span>
          </div>
          <div className="mt-1 bg-white/20 rounded-full h-1.5">
            <div 
              className="bg-white rounded-full h-1.5 transition-all duration-300"
              style={{ 
                width: userPlan.questionsLimit 
                  ? `${Math.min((userPlan.questionsUsed / userPlan.questionsLimit) * 100, 100)}%` 
                  : '100%'
              }}
            />
          </div>
          <div className="mt-1 text-xs text-blue-100">
            {userPlan.questionsLimit 
              ? `${Math.max(0, userPlan.questionsLimit - userPlan.questionsUsed)} questions restantes`
              : 'Questions illimitées'
            }
          </div>
          <div className="mt-1 text-xs text-blue-200 opacity-75">
            Plan {userPlan.type === 'free' ? 'Gratuit' : userPlan.type === 'pro' ? 'Pro' : 'Premium'} • 
            IA {userPlan.aiModel.includes('gpt-4') ? 'GPT-4' : 'GPT-3.5'}
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
                      ) : message.content === 'UPGRADE_BUTTON' ? (
                        <div className="text-center py-2">
                          <Button
                            onClick={handleUpgrade}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center space-x-2 mx-auto"
                          >
                            <Crown className="h-4 w-4" />
                            <span>Passer à {userPlan.type === 'free' ? 'Pro' : 'Premium'}</span>
                            <Zap className="h-4 w-4" />
                          </Button>
                          <p className="text-xs text-gray-600 mt-2">
                            Débloquez {userPlan.type === 'free' ? '20 questions/mois + GPT-4o Mini' : 'questions illimitées + GPT-4'}
                          </p>
                        </div>
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
                    {message.content !== 'UPGRADE_BUTTON' && (
                      <div className={`text-xs mt-1 opacity-60 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    )}
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
              placeholder={
                userPlan.questionsLimit && userPlan.questionsUsed >= userPlan.questionsLimit
                  ? "Limite mensuelle atteinte"
                  : "Posez-moi une question sur vos emails..."
              }
              disabled={isLoading || (userPlan.questionsLimit && userPlan.questionsUsed >= userPlan.questionsLimit)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-24 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              rows={1}
              style={{ minHeight: '36px' }}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || (userPlan.questionsLimit && userPlan.questionsUsed >= userPlan.questionsLimit)}
            className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {userPlan.questionsLimit && userPlan.questionsUsed >= userPlan.questionsLimit && (
          <div className="mt-1.5 text-center">
            <button
              onClick={handleUpgrade}
              className="text-xs text-red-600 hover:text-red-800 underline hover:no-underline transition-all duration-200 font-medium"
            >
              Limite mensuelle atteinte. Passez à un plan supérieur !
            </button>
          </div>
        )}
      </div>
    </motion.div>
    </div>
  );
}
