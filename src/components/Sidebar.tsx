import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Settings, X, CreditCard, FolderOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { emailSyncService } from '../services/emailSync'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'

interface SidebarCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  emails_count?: number;
}

interface SubmenuItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
  color?: string;
  count?: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    email: string;
    subscription_type: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user }) => {
  const [categories, setCategories] = useState<SidebarCategory[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('dashboard');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('🚫 Utilisateur non connecté pour charger les catégories');
          return;
        }

        // Utiliser le service emailSync pour récupérer les catégories avec fallback
        const categoriesData = await emailSyncService.getUserCategories(user.id);
        setCategories(categoriesData);
        console.log('📁 Catégories chargées dans la sidebar:', categoriesData?.length || 0, categoriesData);
      } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: <img src="/providers/logo-ordo.png" alt="Orton" className="h-6 w-6 object-contain" />,
      path: '/dashboard',
      submenu: [
        { name: 'Tous les emails', path: '/dashboard?filter=all', count: categories.reduce((sum, cat) => sum + (cat.emails_count || 0), 0) },
        { name: 'Non lus', path: '/dashboard?filter=unread', count: 22 }, // On pourrait récupérer le vrai nombre en base
        { name: 'Importants', path: '/dashboard?filter=important', count: 0 },
        // Ajouter les catégories directement ici
        ...categories.map((cat: SidebarCategory) => ({
          name: cat.name,
          path: `/dashboard?category=${cat.id}`,
          icon: <span className="text-lg">{cat.icon}</span>,
          color: cat.color,
          count: cat.emails_count
        }))
      ] as SubmenuItem[]
    },
    {
      id: 'categories',
      name: 'Catégories',
      icon: <FolderOpen className="h-5 w-5" />,
      path: '/categories'
      // Pas de submenu - lien direct vers la page de gestion des catégories
    },
    {
      id: 'subscription',
      name: 'Abonnement',
      icon: <CreditCard className="h-5 w-5" />,
      path: '/subscription'
    },
    {
      id: 'settings',
      name: 'Paramètres',
      icon: <Settings className="h-5 w-5" />,
      path: '/settings'
    }
  ];

  // Gestion du state de l'accordéon par le composant Accordion lui-même

  const sidebarVariants: Variants = {
    hidden: {
      x: -100,
      opacity: 0
    },
    visible: {
      x: 0,
      opacity: 1
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay pour fermer en cliquant en dehors */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-lg z-50 flex flex-col"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-1 rounded-xl shadow-sm">
                  <img 
                    src="/providers/logo-ordo.png" 
                    alt="Orton" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Orton</h1>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-2 py-4">
              <div className="mb-6 px-3">
                <h2 className="text-lg font-bold text-gray-800 mb-1">Mes Emails</h2>
                <p className="text-sm text-gray-500">23 emails au total • 22 non lus</p>
              </div>
              <Accordion
                type="single"
                collapsible
                value={expandedSection || undefined}
                onValueChange={(value) => setExpandedSection(value)}
                className="w-full"
              >
                {menuItems.map((item) => (
                  <AccordionItem key={item.id} value={item.id} className="border-b-0">
                    <div className="flex">
                      {item.submenu && item.submenu.length > 0 ? (
                        <AccordionTrigger className="flex-1 px-3 py-3 hover:bg-gray-100 rounded-md font-medium">
                          <div className="flex items-center space-x-3">
                            {item.icon}
                            <span>{item.name}</span>
                          </div>
                        </AccordionTrigger>
                      ) : (
                        <Link 
                          to={item.path}
                          className="flex-1 px-3 py-3 flex items-center justify-between hover:bg-gray-100 rounded-md font-medium"
                          onClick={onClose}
                        >
                          <div className="flex items-center space-x-3">
                            {item.icon}
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      )}
                    </div>
                    
                    {item.submenu && item.submenu.length > 0 && (
                      <AccordionContent>
                        <div className="pl-10 space-y-1">
                          {item.submenu.map((subItem, index) => (
                            <Link
                              key={index}
                              to={subItem.path}
                              className="flex items-center justify-between px-3 py-3 text-sm hover:bg-gray-100 rounded-md"
                              onClick={onClose}
                            >
                              <div className="flex items-center space-x-2">
                                {subItem.icon && (
                                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                    {subItem.icon}
                                  </div>
                                )}
                                <span>{subItem.name}</span>
                              </div>
                              {subItem.count !== undefined && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">
                                  {subItem.count}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            
            {/* User info */}
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    Plan {user.subscription_type.charAt(0).toUpperCase() + user.subscription_type.slice(1)}
                  </p>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="px-4 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 rounded-md"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
