import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Edit3, User, X } from 'lucide-react';
import { Button } from './ui/button';
import type { EmailDraft } from '../services/emailComposition';

interface EmailDraftPreviewProps {
  draft: EmailDraft | null;
  isVisible: boolean;
  onModify?: (instruction: string) => void;
  onSend?: () => void;
  onClose?: () => void;
  className?: string;
}

export const EmailDraftPreview: React.FC<EmailDraftPreviewProps> = ({
  draft,
  isVisible,
  onModify,
  onSend,
  onClose,
  className = ''
}) => {
  if (!isVisible || !draft || !draft.body) {
    return null;
  }

  const handleQuickModification = (instruction: string) => {
    if (onModify) {
      onModify(instruction);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-full">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Aperçu de l'email
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Prêt à envoyer
              </p>
            </div>
          </div>
          
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Email Content */}
        <div className="p-4">
          {/* Recipient */}
          {draft.recipient && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {draft.recipient.avatar_url ? (
                  <img
                    src={draft.recipient.avatar_url}
                    alt={draft.recipient.name || draft.recipient.email}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  À: {draft.recipient.name || draft.recipient.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {draft.recipient.email}
                </p>
              </div>
            </div>
          )}

          {/* Subject */}
          {draft.subject && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Objet
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {draft.subject}
              </p>
            </div>
          )}

          {/* Body */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Message
            </label>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="prose prose-sm max-w-none text-gray-900 dark:text-white">
                {draft.body.split('\n').map((line, index) => (
                  <p key={index} className="mb-2 last:mb-0">
                    {line || <br />}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Modification Buttons */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Modifications rapides
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleQuickModification('Rends ce message plus formel et professionnel')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Plus formel
              </Button>
              <Button
                onClick={() => handleQuickModification('Rends ce message plus décontracté et amical')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Plus décontracté
              </Button>
              <Button
                onClick={() => handleQuickModification('Raccourcis ce message pour qu\'il soit plus concis')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Plus concis
              </Button>
              <Button
                onClick={() => handleQuickModification('Ajoute plus de détails et d\'explications')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Plus détaillé
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button
              onClick={onSend}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer l'email
            </Button>
            
            {onModify && (
              <Button
                onClick={() => onModify('Modifie cet email selon mes instructions')}
                variant="outline"
                size="sm"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Vous pouvez aussi me demander de modifier l'email en tapant vos instructions
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmailDraftPreview;