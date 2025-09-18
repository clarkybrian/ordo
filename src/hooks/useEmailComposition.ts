import { useState, useCallback, useRef } from 'react';
import { emailCompositionService, type EmailDraft, type CompositionState } from '../services/emailComposition';
import type { Contact } from '../services/contacts';
import { useToast } from './useToast';

export interface EmailCompositionHookResult {
  // État
  currentDraft: EmailDraft | null;
  compositionState: CompositionState;
  contactSuggestions: Contact[];
  showSuggestions: boolean;
  isProcessing: boolean;

  // Actions
  processMessage: (userId: string, message: string) => Promise<{
    response: string;
    showEmailDraft?: boolean;
    showContactSuggestions?: boolean;
  }>;
  selectContact: (contact: Contact) => Promise<string>;
  resetComposition: () => void;

  // Utilitaires
  setShowSuggestions: (show: boolean) => void;
}

export const useEmailComposition = (): EmailCompositionHookResult => {
  const [currentDraft, setCurrentDraft] = useState<EmailDraft | null>(null);
  const [compositionState, setCompositionState] = useState<CompositionState>('idle');
  const [contactSuggestions, setContactSuggestions] = useState<Contact[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addToast } = useToast();
  const processingRef = useRef(false);

  // Fonction helper pour afficher les toasts
  const showToast = useCallback((title: string, type: 'success' | 'error' | 'info' = 'info') => {
    addToast({ title, type });
  }, [addToast]);

  /**
   * Traiter un message utilisateur
   */
  const processMessage = useCallback(async (userId: string, message: string) => {
    if (processingRef.current) {
      return { response: 'Traitement en cours, veuillez patienter...' };
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      const result = await emailCompositionService.processUserInput(userId, message);
      const state = emailCompositionService.getCurrentState();

      // Mettre à jour les états
      setCurrentDraft(state.draft);
      setCompositionState(state.state);

      // Traiter selon le type de résultat
      switch (result.type) {
        case 'contact_search':
          if (Array.isArray(result.data)) {
            console.log('👥 Hook: Mise à jour des suggestions de contacts:', result.data.length);
            setContactSuggestions(result.data);
            setShowSuggestions(true);
            console.log('✅ Hook: Suggestions activées, showSuggestions=true');
            return {
              response: result.message,
              showContactSuggestions: true
            };
          }
          break;

        case 'email_composition':
          setShowSuggestions(false);
          return {
            response: result.message,
            showEmailDraft: true
          };

        case 'email_modification':
          return {
            response: result.message,
            showEmailDraft: true
          };

        case 'send_email':
          setShowSuggestions(false);
          if (result.data && typeof result.data === 'object' && 'success' in result.data) {
            if (result.data.success) {
              showToast('Email envoyé avec succès !', 'success');
              resetComposition();
            } else {
              showToast('Échec de l\'envoi de l\'email', 'error');
            }
          }
          return {
            response: result.message
          };

        default:
          setShowSuggestions(false);
          return {
            response: result.message
          };
      }

      return { response: result.message };

    } catch (error) {
      console.error('Erreur lors du traitement du message:', error);
      showToast('Une erreur s\'est produite', 'error');
      return { 
        response: 'Désolé, une erreur s\'est produite. Pouvez-vous réessayer ?' 
      };
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [showToast]);

  /**
   * Réinitialiser la composition
   */
  const resetComposition = useCallback(() => {
    emailCompositionService.resetDraft();
    setCurrentDraft(null);
    setCompositionState('idle');
    setContactSuggestions([]);
    setShowSuggestions(false);
    setIsProcessing(false);
    processingRef.current = false;
  }, []);

  /**
   * Sélectionner un contact
   */
  const selectContact = useCallback(async (contact: Contact): Promise<string> => {
    try {
      setIsProcessing(true);
      setShowSuggestions(false);

      const response = await emailCompositionService.selectContact(contact);
      const state = emailCompositionService.getCurrentState();

      setCurrentDraft(state.draft);
      setCompositionState(state.state);

      return response;
    } catch (error) {
      console.error('Erreur lors de la sélection du contact:', error);
      showToast('Erreur lors de la sélection du contact', 'error');
      return 'Erreur lors de la sélection du contact';
    } finally {
      setIsProcessing(false);
    }
  }, [showToast]);

  return {
    // État
    currentDraft,
    compositionState,
    contactSuggestions,
    showSuggestions,
    isProcessing,

    // Actions
    processMessage,
    selectContact,
    resetComposition,

    // Utilitaires
    setShowSuggestions
  };
};