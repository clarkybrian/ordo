import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Mail, 
  Filter, 
  FolderOpen,
  RefreshCw,
  Plus,
  LogOut,
  Link2
} from 'lucide-react';
import { EmailCard } from '../components/EmailCard';
import { EmailModal } from '../components/EmailModal';
import { SyncProgressBar } from '../components/SyncProgressBar';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import { getCurrentUser, signOut } from '../services/auth';
import type { Email, Category, EmailProvider } from '../types';

// Composant pour les logos des providers email
const EmailProviderLogos: React.FC<{
  selectedProvider: EmailProvider;
  onProviderChange: (provider: EmailProvider) => void;
}> = ({ selectedProvider, onProviderChange }) => {
  const providers = [
    {
      id: 'gmail' as EmailProvider,
      name: 'Gmail',
      logo: '/providers/gmail-logo.png',
      fallbackIcon: '📧',
      color: 'hover:bg-red-50 hover:border-red-300'
    },
    {
      id: 'outlook' as EmailProvider,
      name: 'Outlook',
      logo: '/providers/outlook-logo.png',
      fallbackIcon: '📬',
      color: 'hover:bg-blue-50 hover:border-blue-300'
    },
    {
      id: 'yahoo' as EmailProvider,
      name: 'Yahoo',
      logo: '/providers/yahoo-logo.png',
      fallbackIcon: '💜',
      color: 'hover:bg-purple-50 hover:border-purple-300'
    }
  ];

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
      <div className="flex flex-col space-y-4 bg-white rounded-xl shadow-lg p-3 border border-gray-200">
        {providers.map((provider) => (
          <motion.button
            key={provider.id}
            onClick={() => onProviderChange(provider.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              relative w-14 h-14 rounded-lg border-2 transition-all duration-200 
              flex items-center justify-center group
              ${selectedProvider === provider.id 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 bg-white ' + provider.color
              }
            `}
            title={provider.name}
          >
            <img
              src={provider.logo}
              alt={provider.name}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                // Fallback vers l'emoji si l'image ne charge pas
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLSpanElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <span 
              className="text-2xl hidden"
              style={{ display: 'none' }}
            >
              {provider.fallbackIcon}
            </span>
            
            {/* Indicateur de sélection */}
            {selectedProvider === provider.id && (
              <motion.div
                layoutId="selectedProvider"
                className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Composant pour l'état vide (Outlook/Yahoo non connectés)
const EmptyProviderState: React.FC<{ provider: EmailProvider }> = ({ provider }) => {
  const providerConfig = {
    outlook: {
      name: 'Microsoft Outlook',
      color: 'from-blue-500 to-blue-600',
      icon: '/providers/outlook-logo.png',
      fallbackIcon: '📬'
    },
    yahoo: {
      name: 'Yahoo Mail',
      color: 'from-purple-500 to-purple-600',
      icon: '/providers/yahoo-logo.png',
      fallbackIcon: '💜'
    }
  };

  const config = providerConfig[provider as keyof typeof providerConfig];
  if (!config) return null;

  return (
    <div className="lg:col-span-3 col-span-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <img
              src={config.icon}
              alt={config.name}
              className="w-20 h-20 mx-auto mb-4 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLDivElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div className="text-6xl mb-4 hidden">{config.fallbackIcon}</div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {config.name} non connecté
          </h3>
          
          <p className="text-gray-600 mb-8">
            Connectez votre compte {config.name} pour voir vos emails ici
          </p>
          
          <Button 
            className={`bg-gradient-to-r ${config.color} text-white hover:shadow-lg transition-all duration-200`}
            size="lg"
          >
            <Link2 className="h-5 w-5 mr-2" />
            Connecter {config.name}
          </Button>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>🔒 Connexion sécurisée avec OAuth 2.0</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function Dashboard() {
  // États pour les emails et catégories
  const [emails, setEmails] = useState<Email[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // États pour les modals et UI
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // État pour le provider sélectionné
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider>('gmail');
  
  // Utilisateur actuel
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null);

  // Stats globales
  const [globalStats, setGlobalStats] = useState({
    totalEmails: 0,
    unreadEmails: 0,
    importantEmails: 0
  });

  // Chargement initial des données
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user?.email) return;
        
        setCurrentUser({ email: user.email, id: user.id });

        // Charger les catégories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id);

        if (categoriesData) {
          setCategories(categoriesData);
        }

        // Charger les emails seulement pour Gmail
        if (selectedProvider === 'gmail') {
          const { data: emailsData } = await supabase
            .from('emails')
            .select('*')
            .eq('user_id', user.id)
            .order('received_at', { ascending: false });

          if (emailsData) {
            setEmails(emailsData);
            calculateStats(emailsData);
          }
        } else {
          // Pour Outlook/Yahoo, pas d'emails car non connectés
          setEmails([]);
          setGlobalStats({ totalEmails: 0, unreadEmails: 0, importantEmails: 0 });
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedProvider]);

  // Calculer les statistiques
  const calculateStats = (emailsData: Email[]) => {
    setGlobalStats({
      totalEmails: emailsData.length,
      unreadEmails: emailsData.filter(email => !email.is_read).length,
      importantEmails: emailsData.filter(email => email.is_important).length
    });
  };

  // Filtrage des emails
  useEffect(() => {
    let filtered = emails;

    // Filtre par catégorie
    if (selectedCategory === 'unread') {
      filtered = filtered.filter(email => !email.is_read);
    } else if (selectedCategory === 'important') {
      filtered = filtered.filter(email => email.is_important);
    } else if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(email => email.category_id === selectedCategory);
    }

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(email => 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.body_text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEmails(filtered);
  }, [emails, selectedCategory, searchQuery]);

  // Gestion du clic sur un email
  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setIsEmailModalOpen(true);
  };

  // Synchronisation manuelle
  const handleManualSync = async () => {
    if (selectedProvider !== 'gmail') {
      alert(`Connectez-vous d'abord à ${selectedProvider}`);
      return;
    }

    setIsSyncing(true);
    setShowProgressBar(true);
    setSyncProgress(0);

    try {
      // Simulation de synchronisation
      for (let i = 0; i <= 100; i += 10) {
        setSyncProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Recharger les données après sync
      window.location.reload();
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
      setShowProgressBar(false);
      setSyncProgress(null);
    }
  };

  // Déconnexion
  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getProviderDisplayName = () => {
    const names = {
      gmail: 'Gmail',
      outlook: 'Outlook',
      yahoo: 'Yahoo'
    };
    return names[selectedProvider];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Mes Emails
            </h1>
            {currentUser && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>👤</span>
                <span>{currentUser.email}</span>
                <span>•</span>
                <span className="font-medium text-blue-600">{getProviderDisplayName()}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleManualSync}
              variant="outline"
              size="sm"
              disabled={isSyncing || selectedProvider !== 'gmail'}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Synchroniser
            </Button>
            
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle catégorie
            </Button>
            
            <Button 
              onClick={handleSignOut}
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Logos des providers - Position fixe à gauche */}
      <EmailProviderLogos 
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
      />

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto p-4 pl-24"> {/* pl-24 pour laisser place aux logos */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filtres et catégories - Toujours affiché */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardContent className="p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Filtres rapides</h2>
                
                <div className="space-y-2 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === null 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Tous les emails ({globalStats.totalEmails})
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedCategory('unread')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === 'unread' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Non lus ({globalStats.unreadEmails})
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedCategory('important')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === 'important' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Importants ({globalStats.importantEmails})
                  </motion.button>
                </div>
              </CardContent>
            </Card>

            {/* Catégories */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Catégories</h2>
                  <FolderOpen className="h-4 w-4 text-gray-500" />
                </div>
                
                <div className="space-y-2">
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span 
                            className="inline-block w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          ></span>
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {selectedProvider === 'gmail' ? (category.emails_count || 0) : 0}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal - Conditionnel selon le provider */}
          {selectedProvider === 'gmail' ? (
            // Interface Gmail complète
            <div className="lg:col-span-3 col-span-1">
              {/* Barre de recherche */}
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher des emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Liste des emails */}
              <div className="space-y-4">
                {isLoading ? (
                  // Skeleton loading
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <AnimatePresence>
                    {filteredEmails.length > 0 ? (
                      filteredEmails.map((email) => (
                        <EmailCard
                          key={email.id}
                          email={email}
                          onClick={() => handleEmailClick(email)}
                          onStarClick={() => console.log('Toggle important:', email.id)}
                          onMoveCategory={() => console.log('Déplacer email:', email.id)}
                        />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun email trouvé</h3>
                        <p className="text-gray-500">
                          {selectedCategory 
                            ? "Aucun email dans cette catégorie"
                            : "Essayez de modifier votre recherche"
                          }
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          ) : (
            // Interface vide pour Outlook/Yahoo
            <EmptyProviderState provider={selectedProvider} />
          )}
        </div>
      </div>

      {/* Barre de progression pour la synchronisation */}
      {showProgressBar && (
        <SyncProgressBar 
          isVisible={showProgressBar}
          progress={syncProgress ? { 
            stage: 'fetching' as const, 
            progress: syncProgress, 
            message: 'Synchronisation en cours...' 
          } : null}
          onComplete={() => {
            setShowProgressBar(false);
            setSyncProgress(null);
          }}
        />
      )}

      {/* Modal pour les détails de l'email */}
      <EmailModal
        email={selectedEmail}
        isOpen={isEmailModalOpen}
        onClose={() => {
          setSelectedEmail(null);
          setIsEmailModalOpen(false);
        }}
      />
    </div>
  );
}
