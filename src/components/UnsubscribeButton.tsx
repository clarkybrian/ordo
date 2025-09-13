import { useState } from 'react';
import { UserX, Loader2, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Modal } from './ui/modal';
import { unsubscribeService, type UnsubscribeLink, type UnsubscribeResult } from '../services/unsubscribe';
import type { Email } from '../types';

interface UnsubscribeButtonProps {
  email: Email;
  userId: string;
}

interface UnsubscribeState {
  isDetecting: boolean;
  unsubscribeLinks: UnsubscribeLink[];
  showConfirmModal: boolean;
  isExecuting: boolean;
  result: UnsubscribeResult | null;
  showResultModal: boolean;
}

export function UnsubscribeButton({ email, userId }: UnsubscribeButtonProps) {
  const [state, setState] = useState<UnsubscribeState>({
    isDetecting: false,
    unsubscribeLinks: [],
    showConfirmModal: false,
    isExecuting: false,
    result: null,
    showResultModal: false
  });

  // Vérifier si c'est une newsletter
  const isNewsletter = unsubscribeService.isNewsletter(email);
  
  // Ne pas afficher le bouton si ce n'est pas une newsletter
  if (!isNewsletter) {
    return null;
  }

  const handleUnsubscribeClick = async () => {
    setState(prev => ({ ...prev, isDetecting: true }));

    try {
      const links = unsubscribeService.detectUnsubscribeLinks(email);
      
      if (links.length === 0) {
        setState(prev => ({
          ...prev,
          isDetecting: false,
          result: {
            success: false,
            message: 'Aucun lien de désabonnement trouvé dans cet email',
            method_used: 'none'
          },
          showResultModal: true
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        isDetecting: false,
        unsubscribeLinks: links,
        showConfirmModal: true
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isDetecting: false,
        result: {
          success: false,
          message: `Erreur lors de la détection: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          method_used: 'none'
        },
        showResultModal: true
      }));
    }
  };

  const handleConfirmUnsubscribe = async () => {
    const bestLink = state.unsubscribeLinks[0]; // Prendre le lien avec la plus haute confiance
    
    setState(prev => ({
      ...prev,
      showConfirmModal: false,
      isExecuting: true
    }));

    try {
      const result = await unsubscribeService.executeUnsubscribe(bestLink, email.id, userId);
      
      setState(prev => ({
        ...prev,
        isExecuting: false,
        result,
        showResultModal: true
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isExecuting: false,
        result: {
          success: false,
          message: `Erreur lors du désabonnement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          method_used: 'error'
        },
        showResultModal: true
      }));
    }
  };

  const resetState = () => {
    setState({
      isDetecting: false,
      unsubscribeLinks: [],
      showConfirmModal: false,
      isExecuting: false,
      result: null,
      showResultModal: false
    });
  };

  return (
    <>
      {/* Bouton de désabonnement */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnsubscribeClick}
        disabled={state.isDetecting}
        className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300"
      >
        {state.isDetecting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <UserX className="h-4 w-4 mr-2" />
        )}
        {state.isDetecting ? 'Détection...' : 'Se désabonner'}
      </Button>

      {/* Modal de confirmation */}
      <Modal
        isOpen={state.showConfirmModal}
        onClose={resetState}
        title="Confirmer le désabonnement"
        size="md"
      >
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Voulez-vous vraiment vous désabonner de cette newsletter ?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Expéditeur :</strong> {email.sender_email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Sujet :</strong> {email.subject}
              </p>
            </div>
          </div>

          {state.unsubscribeLinks.length > 0 && (
            <div className="mb-4 bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Méthode détectée :</strong>
              </p>
              <p className="text-xs text-blue-600 font-mono break-all">
                {state.unsubscribeLinks[0].url}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Confiance: {(state.unsubscribeLinks[0].confidence * 100).toFixed(0)}% 
                ({state.unsubscribeLinks[0].type})
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={resetState}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmUnsubscribe}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Confirmer le désabonnement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de résultat */}
      <Modal
        isOpen={state.showResultModal}
        onClose={resetState}
        title={state.result?.success ? 'Désabonnement réussi' : 'Erreur de désabonnement'}
        size="md"
      >
        <div className="p-6">
          <div className={`flex items-center mb-4 p-4 rounded-lg ${
            state.result?.success 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {state.result?.success ? (
              <Check className="h-5 w-5 mr-3 text-green-600" />
            ) : (
              <X className="h-5 w-5 mr-3 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                {state.result?.success ? 'Succès !' : 'Échec'}
              </p>
              <p className="text-sm mt-1">
                {state.result?.message}
              </p>
              {state.result?.method_used && (
                <p className="text-xs mt-1 opacity-75">
                  Méthode utilisée: {state.result.method_used}
                </p>
              )}
            </div>
          </div>

          {state.result?.success && (
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-yellow-800">
                💡 <strong>Note :</strong> Il peut falloir quelques jours pour que le désabonnement soit effectif. 
                Si vous continuez à recevoir des emails, vous pouvez les signaler comme spam.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={resetState}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Loading overlay pendant l'exécution */}
      {state.isExecuting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-gray-800">Désabonnement en cours...</p>
          </div>
        </div>
      )}
    </>
  );
}
