import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Star } from 'lucide-react';
import type { Contact } from '../services/contacts';

interface ContactSuggestionsProps {
  contacts: Contact[];
  isVisible: boolean;
  onSelectContact: (contact: Contact) => void;
  className?: string;
}

export const ContactSuggestions: React.FC<ContactSuggestionsProps> = ({
  contacts,
  isVisible,
  onSelectContact,
  className = ''
}) => {
  // Ne rien afficher si suggestions cachées
  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={`absolute z-50 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden ${className}`}
        style={{ top: '100%', left: 0, marginTop: '4px' }}
      >
        <div className="py-2">
          <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {contacts.length === 0 ? 'Aucun contact trouvé' : 'Contacts suggérés'}
          </div>
          
          {contacts.length === 0 ? (
            <div className="px-3 py-3 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Vous n'avez pas encore de contacts ou une erreur s'est produite.
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Essayez ces commandes: <code>/contacts-debug</code> ou <code>/contacts-fix</code>
              </div>
            </div>
          ) : (
            contacts.map((contact, index) => (
            <motion.button
              key={`${contact.email}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectContact(contact)}
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors group"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {contact.avatar_url ? (
                  <img
                    src={contact.avatar_url}
                    alt={contact.name || contact.email}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              {/* Informations du contact */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {contact.name || 'Contact'}
                  </p>
                  {contact.is_favorite && (
                    <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </div>
              </div>

              {/* Indicateur de fréquence */}
              {contact.interaction_count > 0 && (
                <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {contact.interaction_count} échanges
                </div>
              )}

              {/* Indicateur de récence */}
              {contact.last_interaction && (
                <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {formatLastInteraction(contact.last_interaction)}
                </div>
              )}
            </motion.button>
          ))
          )}
        </div>

        {/* Footer avec hint */}
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Sélectionnez un contact pour commencer la rédaction
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Formater la date de dernière interaction
 */
function formatLastInteraction(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `${diffDays}j`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}sem`;
    } else {
      return `${Math.floor(diffDays / 30)}mois`;
    }
  } catch {
    return '';
  }
}

export default ContactSuggestions;