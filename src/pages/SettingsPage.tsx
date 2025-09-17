import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Bell, 
  CreditCard, 
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Crown,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../components/Toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  subscription_type: 'free' | 'pro' | 'premium';
}

interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  dark_mode: boolean;
  language: string;
  auto_sync_frequency: string;
  sound_enabled: boolean;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: false,
    dark_mode: false,
    language: 'fr',
    auto_sync_frequency: '1hour',
    sound_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Charger les données utilisateur
  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Charger le profil utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile({
          id: profile.id,
          email: user.email!,
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          subscription_type: profile.subscription_type || 'free'
        });
      }

      // Charger les paramètres utilisateur (simulé pour l'instant)
      // TODO: Implémenter une vraie table user_settings
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      showToast('Profil mis à jour avec succès', 'success');
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      showToast('Erreur lors de la mise à jour du profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'accounts', name: 'Comptes', icon: Mail },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'subscription', name: 'Abonnement', icon: CreditCard }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="mt-2 text-gray-600">Gérez vos préférences et paramètres de compte</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              {/* Onglet Profil */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations du profil</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {userProfile?.full_name?.charAt(0) || userProfile?.email?.charAt(0) || 'U'}
                        </div>
                        <button className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                          <Upload className="h-4 w-4" />
                        </button>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {userProfile?.full_name || 'Nom non défini'}
                        </h3>
                        <p className="text-gray-600">{userProfile?.email}</p>
                        <div className="flex items-center mt-2">
                          <Crown className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            Plan {userProfile?.subscription_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          value={userProfile?.full_name || ''}
                          onChange={(e) => setUserProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Votre nom complet"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse email
                        </label>
                        <input
                          type="email"
                          value={userProfile?.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {saving ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Enregistrer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet Comptes */}
              {activeTab === 'accounts' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Comptes connectés</h2>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Gmail</h3>
                            <p className="text-sm text-gray-600">{userProfile?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Connecté
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showToast('Fonctionnalité en cours de développement', 'error')}
                          >
                            Déconnecter
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Outlook</h3>
                            <p className="text-sm text-gray-600">Non connecté</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showToast('Fonctionnalité en cours de développement', 'error')}
                        >
                          Connecter
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">À propos de la synchronisation</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Vos emails sont synchronisés automatiquement toutes les heures. 
                          La prochaine synchronisation aura lieu dans 45 minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet Notifications */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Préférences de notification</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <h3 className="font-medium text-gray-900">Notifications push</h3>
                        <p className="text-sm text-gray-600">Recevoir des notifications dans le navigateur</p>
                      </div>
                      <button
                        onClick={() => setUserSettings(prev => ({...prev, push_notifications: !prev.push_notifications}))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          userSettings.push_notifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          userSettings.push_notifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <h3 className="font-medium text-gray-900">Notifications email</h3>
                        <p className="text-sm text-gray-600">Recevoir un résumé quotidien par email</p>
                      </div>
                      <button
                        onClick={() => setUserSettings(prev => ({...prev, email_notifications: !prev.email_notifications}))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          userSettings.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          userSettings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <h3 className="font-medium text-gray-900">Sons de notification</h3>
                        <p className="text-sm text-gray-600">Jouer un son lors de nouvelles notifications</p>
                      </div>
                      <button
                        onClick={() => setUserSettings(prev => ({...prev, sound_enabled: !prev.sound_enabled}))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          userSettings.sound_enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          userSettings.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fréquence de synchronisation
                      </label>
                      <select
                        value={userSettings.auto_sync_frequency}
                        onChange={(e) => setUserSettings(prev => ({...prev, auto_sync_frequency: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="15min">Toutes les 15 minutes</option>
                        <option value="30min">Toutes les 30 minutes</option>
                        <option value="1hour">Toutes les heures</option>
                        <option value="2hours">Toutes les 2 heures</option>
                        <option value="manual">Manuelle uniquement</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet Abonnement */}
              {activeTab === 'subscription' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Abonnement et facturation</h2>
                  
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900">Plan actuel</h3>
                          <p className="text-sm text-gray-600">Gérez votre abonnement</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Crown className="h-5 w-5 text-yellow-500" />
                          <span className="font-medium text-gray-900 capitalize">
                            {userProfile?.subscription_type || 'Free'}
                          </span>
                        </div>
                      </div>

                      {userProfile?.subscription_type === 'free' ? (
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Passez au plan Pro !</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• Classification illimitée d'emails</li>
                              <li>• Support prioritaire</li>
                              <li>• Statistiques avancées</li>
                              <li>• API d'intégration</li>
                            </ul>
                          </div>
                          <Button
                            onClick={() => navigate('/pricing')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Améliorer mon plan
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Statut:</span>
                              <span className="ml-2 text-green-600 font-medium">Actif</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Prochaine facturation:</span>
                              <span className="ml-2 font-medium">15 octobre 2025</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => showToast('Fonctionnalité en cours de développement', 'error')}
                            >
                              Gérer l'abonnement
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => showToast('Fonctionnalité en cours de développement', 'error')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger facture
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Historique de facturation</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Consultez votre historique de paiements et téléchargez vos factures.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => showToast('Fonctionnalité en cours de développement', 'error')}
                      >
                        Voir l'historique
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          id="settings-toast"
          title={toast.type === 'success' ? 'Succès' : 'Erreur'}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}