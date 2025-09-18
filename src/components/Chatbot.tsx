import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { openaiService, type ChatbotResponse } from '../services/openai';
import { useEmailComposition } from '../hooks/useEmailComposition';
import { ContactSuggestions } from './ContactSuggestions';
import { EmailDraftPreview } from './EmailDraftPreview';
import { ContactsInitializer } from '../services/contactsInitializer';
import { ContactsDebugService } from '../services/contactsDebug';
import { Button } from './ui/button';
import type { Contact } from '../services/contacts';

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
      content: '👋 Salut ! Je suis Orton, votre assistant email intelligent !\n\n🧠 Je connais tous vos emails et je suis là pour vous aider intelligemment :\n• 📊 Résumés des emails importants (pas tout !)\n• 🔍 Recherches dans vos messages  \n• 📧 Aide à la rédaction et envoi d\'emails\n• 👥 Utilisez @ pour sélectionner des contacts\n\n💬 N\'hésitez pas à me parler naturellement ! Que puis-je faire pour vous ? 😊',
      isUser: false,
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(false);
  const [stats, setStats] = useState({
    categoriesCount: 0,
    usedCategoriesCount: 0,
    emailsCount: 0,
    lastSync: null as Date | null
  });

  // Hook de composition d'emails
  const emailComposition = useEmailComposition();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
      loadRecentMessages();
      inputRef.current?.focus();
      
      // Rafraîchir les statistiques toutes les 30 secondes
      const statsInterval = setInterval(loadStats, 30000);
      
      // Démarrer le nettoyage automatique
      // chatbotCleanupService.startAutoCleanup();
      
      // Nettoyage lors de la fermeture
      return () => {
        clearInterval(statsInterval);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    // Nettoyage lors du démontage du composant
    return () => {
      // chatbotCleanupService.stopAutoCleanup();
    };
  }, []);

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

      // Récupérer le nombre total de catégories
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id);

      // Récupérer le nombre total d'emails et le dernier
      const { data: emails } = await supabase
        .from('emails')
        .select('id, category_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Calculer les catégories utilisées
      const usedCategoryIds = new Set(
        emails?.filter(email => email.category_id).map(email => email.category_id) || []
      );

      setStats({
        categoriesCount: categories?.length || 0,
        usedCategoriesCount: usedCategoryIds.size,
        emailsCount: emails?.length || 0,
        lastSync: emails?.[0]?.created_at ? new Date(emails[0].created_at) : null
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const loadRecentMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les messages de la dernière heure
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentMessages } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: true });

      if (recentMessages && recentMessages.length > 0) {
        const formattedMessages: ChatMessage[] = recentMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at),
          type: msg.is_user ? undefined : ('info' as const)
        }));

        // Ajouter les messages récents après le message d'accueil
        setMessages(prev => [prev[0], ...formattedMessages]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages récents:', error);
    }
  };

  // Fonction pour détecter automatiquement @ et déclencher la recherche
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Détecter le symbole @ pour déclencher la recherche de contacts
    if (value.includes('@')) {
      console.log('🔍 Détection @ dans l\'input:', value);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('👤 Utilisateur trouvé:', user.id);
          const atIndex = value.lastIndexOf('@');
          const searchTerm = value.substring(atIndex + 1);
          console.log('🔎 Terme de recherche:', searchTerm);
          
          // Déclencher la recherche même avec un terme vide pour afficher les contacts favoris
          if (searchTerm.length >= 0) {
            console.log('⚡ Lancement de la recherche de contacts...');
            const result = await emailComposition.processMessage(user.id, value);
            console.log('📧 Résultat de la recherche:', result);
            console.log('👥 Suggestions visibles:', emailComposition.showSuggestions);
            console.log('📋 Nombre de contacts:', emailComposition.contactSuggestions.length);
            
            // Si aucun contact n'est trouvé, créer des contacts de secours automatiquement
            if (emailComposition.contactSuggestions.length === 0 && emailComposition.showSuggestions) {
              console.log('⚠️ Aucun contact trouvé, tentative de réparation automatique...');
              
              // Vérifier l'état des contacts
              const health = await ContactsDebugService.checkContactsHealth(user.id);
              
              if (health.contactsCount === 0) {
                console.log('🔧 Aucun contact trouvé, création automatique de contacts...');
                const fixResult = await ContactsDebugService.createEmergencyContacts(user.id);
                
                if (fixResult.success) {
                  // Relancer la recherche
                  console.log('🔄 Contacts créés, relancement de la recherche...');
                  await emailComposition.processMessage(user.id, value);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la recherche de contacts:', error);
      }
    } else {
      // Cacher les suggestions si pas de @
      emailComposition.setShowSuggestions(false);
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
    const messageContent = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Détecter les commandes spéciales
      if (messageContent.startsWith('/')) {
        const commandResult = await handleSpecialCommands(messageContent, user.id);
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: commandResult,
          isUser: false,
          timestamp: new Date(),
          type: 'info'
        };
        setMessages(prev => [...prev, botMessage]);
        return;
      }

      // Traiter d'abord avec le système de composition d'emails
      const emailResult = await emailComposition.processMessage(user.id, messageContent);
      
      // Si c'est une recherche de contacts, on affiche les suggestions et on traite différemment
      if (emailResult.showContactSuggestions) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: emailResult.response,
          isUser: false,
          timestamp: new Date(),
          type: 'info'
        };
        setMessages(prev => [...prev, botMessage]);
      }
      // Si c'est une composition ou modification d'email, on affiche le résultat
      else if (emailResult.showEmailDraft || emailResult.response.includes('📧') || emailResult.response.includes('✏️')) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: emailResult.response,
          isUser: false,
          timestamp: new Date(),
          type: 'info'
        };
        setMessages(prev => [...prev, botMessage]);
      }
      // Sinon, traitement normal avec le chatbot
      else {
        const response: ChatbotResponse = await openaiService.handleChatbotQuery(messageContent, user.id);
        
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.message,
          isUser: false,
          timestamp: new Date(),
          type: response.type
        };

        setMessages(prev => [...prev, botMessage]);
      }

      // Sauvegarder la conversation en base si c'est un message normal
      if (!emailResult.showContactSuggestions && !emailResult.showEmailDraft) {
        await saveChatMessage(userMessage, { 
          ...messages[messages.length - 1], 
          content: emailResult.response 
        });
      }

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

  // Gestion des commandes spéciales
  const handleSpecialCommands = async (command: string, userId: string): Promise<string> => {
    const commandName = command.toLowerCase();

    switch (commandName) {
      case '/contacts-stats':
        try {
          const stats = await ContactsInitializer.getContactsStats(userId);
          return `📊 **Statistiques de vos contacts**\n\n` +
            `📧 **Total:** ${stats.totalContacts} contacts\n` +
            `⭐ **Favoris:** ${stats.favoriteContacts} contacts\n` +
            `🕐 **Récents (7j):** ${stats.recentContacts} contacts\n` +
            `🟢 **Actifs (30j):** ${stats.activeContacts} contacts\n\n` +
            `💡 *Les contacts sont automatiquement synchronisés lors de la synchronisation des emails*`;
        } catch (error) {
          return `❌ Erreur lors de la récupération des statistiques: ${error}`;
        }
        
      case '/contacts-debug':
        try {
          const health = await ContactsDebugService.checkContactsHealth(userId);
          return `🔍 **Diagnostic des contacts**\n\n` +
            `📊 **Nombre de contacts :** ${health.contactsCount}\n` +
            `🟢 **État :** ${health.hasError ? 'Erreur' : 'OK'}\n` +
            `📝 **Message :** ${health.message}\n\n` +
            `💡 *Utilisez /contacts-fix pour créer des contacts de test si nécessaire*`;
        } catch (error) {
          return `❌ Erreur lors du diagnostic des contacts: ${error}`;
        }
        
      case '/contacts-fix':
        try {
          const result = await ContactsDebugService.createEmergencyContacts(userId);
          return `🛠️ **Réparation des contacts**\n\n` +
            `✅ **Succès :** ${result.success ? 'Oui' : 'Non'}\n` +
            `📊 **Contacts créés :** ${result.contactsCreated}\n` +
            `📝 **Message :** ${result.message}\n\n` +
            `💡 *Essayez maintenant de taper @ pour voir vos contacts*`;
        } catch (error) {
          return `❌ Erreur lors de la réparation des contacts: ${error}`;
        }

      case '/help':
      case '/aide':
        return `🤖 **Commandes disponibles:**\n\n` +
          `**📧 Composition d'emails:**\n` +
          `• Tapez @ pour sélectionner un contact\n` +
          `• "Écris un email à @john pour..." pour composer\n` +
          `• "Rends-le plus formel/décontracté" pour modifier\n` +
          `• "vas-y envoie-le" pour envoyer\n\n` +
          `**👥 Gestion des contacts:**\n` +
          `• \`/contacts-stats\` - Voir les statistiques de vos contacts\n` +
          `• \`/contacts-debug\` - Diagnostiquer les problèmes de contacts\n` +
          `• \`/contacts-fix\` - Créer des contacts de test si nécessaire\n` +
          `• *Les contacts sont automatiquement synchronisés depuis Gmail*\n\n` +
          `**ℹ️ Aide:**\n` +
          `• \`/help\` ou \`/aide\` - Afficher cette aide`;

      default:
        return `❓ Commande non reconnue: ${command}\n\nTapez \`/help\` pour voir les commandes disponibles.`;
    }
  };

  const handleContactSelect = async (contact: Contact) => {
    try {
      const response = await emailComposition.selectContact(contact);
      
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
        type: 'info'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erreur lors de la sélection du contact:', error);
    }
  };

  const handleEmailModification = async (instruction: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await emailComposition.processMessage(user.id, instruction);
      
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        content: result.response,
        isUser: false,
        timestamp: new Date(),
        type: 'info'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erreur lors de la modification de l\'email:', error);
    }
  };

  const handleEmailSend = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await emailComposition.processMessage(user.id, 'vas-y envoie-le');
      
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        content: result.response,
        isUser: false,
        timestamp: new Date(),
        type: result.response.includes('✅') ? 'info' : 'error'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
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

      // Limiter le nombre de messages pour éviter l'accumulation
      // await chatbotCleanupService.limitUserMessages(user.id, 100);

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
    "Résume mes derniers emails importants",
    "Quels emails demandent une action de ma part ?",
    "Résume mes emails par catégorie",
    "Montre-moi le contenu de mes emails non lus",
    "Analyse mes emails reçus aujourd'hui",
    "Quels expéditeurs sont les plus actifs ?",
    "Récapitulatif des emails avec pièces jointes"
  ];

  return (
    <>
      {/* Bouton flottant */}
      <motion.div
        className="fixed bottom-6 right-6 z-[110]"
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
          {stats.usedCategoriesCount > 0 && !isOpen && (
            <motion.div
              className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5 }}
            >
              {stats.usedCategoriesCount}
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
                    <h3 className="font-semibold">Assistant Orton</h3>
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
                  <div className="font-semibold">{stats.usedCategoriesCount}/{stats.categoriesCount}</div>
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

            {/* Email Draft Preview */}
            {emailComposition.currentDraft && emailComposition.currentDraft.body && (
              <div className="px-4 pb-4">
                <EmailDraftPreview
                  draft={emailComposition.currentDraft}
                  isVisible={true}
                  onModify={handleEmailModification}
                  onSend={handleEmailSend}
                />
              </div>
            )}

            {/* Questions rapides - Apparaissent uniquement au focus */}
            {showQuickQuestions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-2 bg-gray-50 border-t border-gray-100 max-h-32 overflow-y-auto"
              >
                <div className="text-xs text-gray-500 mb-2 pt-2">Questions rapides :</div>
                <div className="grid grid-cols-1 gap-1">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputValue(question);
                        setShowQuickQuestions(false);
                        inputRef.current?.focus();
                      }}
                      className="text-left text-xs bg-white hover:bg-blue-50 hover:text-blue-700 p-2 rounded-lg transition-colors border border-gray-200"
                      disabled={isLoading}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="relative">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setShowQuickQuestions(true)}
                    onBlur={() => {
                      // Délai pour permettre le clic sur les questions et contacts
                      setTimeout(() => {
                        setShowQuickQuestions(false);
                        emailComposition.setShowSuggestions(false);
                      }, 200);
                    }}
                    placeholder="Posez votre question... Utilisez @ pour sélectionner un contact"
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

                {/* Contact Suggestions */}
                <ContactSuggestions
                  contacts={emailComposition.contactSuggestions}
                  isVisible={emailComposition.showSuggestions}
                  onSelectContact={handleContactSelect}
                  className="mt-1"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
