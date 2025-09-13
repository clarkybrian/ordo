import React, { useState } from 'react';

interface BulkUnsubscribeProps {
  categoryId: string;
  categoryName: string;
  userId: string;
  emailCount: number;
  size?: 'normal' | 'small'; // Nouvelle prop pour la taille
  onSuccess?: () => void;
}
import { UserMinus, Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Modal } from './ui/modal';
import { Progress } from './ui/progress';
import { unsubscribeService } from '../services/unsubscribe';

interface BulkUnsubscribeProps {
  categoryId: string;
  categoryName: string;
  userId: string;
  emailCount: number;
  size?: 'normal' | 'small'; // Nouvelle prop pour la taille
  onSuccess?: () => void;
}

interface BulkUnsubscribeState {
  showConfirmModal: boolean;
  isProcessing: boolean;
  progress: number;
  currentEmail: string;
  results: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    details: Array<{ emailId: string; success: boolean; message: string; }>;
  } | null;
  showResultsModal: boolean;
}

export function BulkUnsubscribeButton({ 
  categoryId, 
  categoryName, 
  userId, 
  emailCount,
  size = 'normal',
  onSuccess 
}: BulkUnsubscribeProps) {
  const [state, setState] = useState<BulkUnsubscribeState>({
    showConfirmModal: false,
    isProcessing: false,
    progress: 0,
    currentEmail: '',
    results: null,
    showResultsModal: false
  });

  const handleBulkUnsubscribe = async () => {
    setState(prev => ({ ...prev, showConfirmModal: true }));
  };

  const handleConfirmBulkUnsubscribe = async () => {
    setState(prev => ({
      ...prev,
      showConfirmModal: false,
      isProcessing: true,
      progress: 0
    }));

    try {
      // Simuler le progrès pendant le traitement
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 5, 95)
        }));
      }, 500);

      const results = await unsubscribeService.bulkUnsubscribeFromCategory(
        categoryId,
        userId
      );

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        results: {
          ...results,
          details: results.results
        },
        showResultsModal: true
      }));

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        results: {
          total: 0,
          processed: 0,
          successful: 0,
          failed: 1,
          details: [{
            emailId: 'error',
            success: false,
            message: `Erreur globale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
          }]
        },
        showResultsModal: true
      }));
    }
  };

  const resetState = () => {
    setState({
      showConfirmModal: false,
      isProcessing: false,
      progress: 0,
      currentEmail: '',
      results: null,
      showResultsModal: false
    });
  };

  // Ne pas afficher pour les catégories qui ne sont probablement pas des newsletters
  const isLikelyNewsletterCategory = categoryName.toLowerCase().includes('publicité') ||
                                    categoryName.toLowerCase().includes('marketing') ||
                                    categoryName.toLowerCase().includes('newsletter');

  if (!isLikelyNewsletterCategory) {
    return null;
  }

  return (
    <>
      {/* Bouton de désabonnement groupé - avec support des tailles */}
      <Button
        variant="outline"
        size={size === 'small' ? 'xs' : 'sm'}
        onClick={handleBulkUnsubscribe}
        disabled={state.isProcessing}
        className={`
          bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100
          ${size === 'small' 
            ? 'h-6 px-2 text-xs' 
            : ''
          }
        `}
        title={`Se désabonner de tous les emails de ${categoryName}`}
      >
        <UserMinus className={`${size === 'small' ? 'h-3 w-3' : 'h-4 w-4'} ${size === 'small' ? '' : 'mr-2'}`} />
        {size === 'normal' && 'Désabonnement massif'}
      </Button>

      {/* Modal de confirmation */}
      <Modal
        isOpen={state.showConfirmModal}
        onClose={resetState}
        title="Désabonnement massif"
        size="md"
      >
        <div className="p-6">
          <div className="flex items-start space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 mb-2">
                Attention : Action irréversible
              </p>
              <p className="text-gray-700 text-sm mb-3">
                Cette action va tenter de vous désabonner automatiquement de toutes les newsletters 
                détectées dans la catégorie <strong>"{categoryName}"</strong>.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg text-sm mb-3">
                <p><strong>Total d'emails :</strong> {emailCount}</p>
                <p><strong>Newsletters estimées :</strong> À déterminer pendant le processus</p>
                <p className="mt-2 text-gray-600">
                  ⏱️ Cette opération peut prendre plusieurs minutes.
                </p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  🎯 Types de désabonnement typiques :
                </p>
                <div className="text-blue-800 space-y-1">
                  <p>• Newsletters commerciales (e-commerce, services)</p>
                  <p>• Notifications marketing (promotions, offres)</p>
                  <p>• Bulletins d'information (actualités, blogs)</p>
                  <p>• Emails promotionnels récurrents</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-yellow-800">
              💡 <strong>Note :</strong> Certains désabonnements peuvent échouer selon la configuration 
              du serveur email de l'expéditeur. Vous pourrez voir le détail des résultats à la fin.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={resetState}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmBulkUnsubscribe}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Lancer le désabonnement massif
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de progression */}
      <Modal
        isOpen={state.isProcessing}
        onClose={() => {}} // Pas de fermeture pendant le traitement
        title="Désabonnement en cours..."
        size="md"
      >
        <div className="p-6">
          <div className="mb-4">
            <Progress value={state.progress} className="w-full mb-2" />
            <p className="text-sm text-gray-600 text-center">
              {state.progress}% terminé
            </p>
          </div>
          
          {state.currentEmail && (
            <p className="text-sm text-gray-700 text-center">
              Traitement en cours: {state.currentEmail}
            </p>
          )}
          
          <div className="flex justify-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        </div>
      </Modal>

      {/* Modal de résultats */}
      <Modal
        isOpen={state.showResultsModal}
        onClose={resetState}
        title="Résultats du désabonnement massif"
        size="lg"
      >
        <div className="p-6">
          {state.results && (
            <>
              {/* Statistiques globales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{state.results.total}</p>
                  <p className="text-sm text-blue-800">Newsletters trouvées</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-gray-600">{state.results.processed}</p>
                  <p className="text-sm text-gray-800">Traitées</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{state.results.successful}</p>
                  <p className="text-sm text-green-800">Réussies</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{state.results.failed}</p>
                  <p className="text-sm text-red-800">Échouées</p>
                </div>
              </div>

              {/* Message de synthèse */}
              <div className={`p-4 rounded-lg mb-4 ${
                state.results.successful > state.results.failed
                  ? 'bg-green-50 text-green-800'
                  : state.results.failed > 0
                  ? 'bg-yellow-50 text-yellow-800'
                  : 'bg-gray-50 text-gray-800'
              }`}>
                <div className="flex items-center">
                  {state.results.successful > state.results.failed ? (
                    <Check className="h-5 w-5 mr-2 text-green-600" />
                  ) : state.results.failed > 0 ? (
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  ) : (
                    <X className="h-5 w-5 mr-2 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {state.results.successful > state.results.failed
                        ? 'Désabonnement majoritairement réussi !'
                        : state.results.failed > 0
                        ? 'Désabonnement partiellement réussi'
                        : 'Aucun désabonnement réussi'
                      }
                    </p>
                    <p className="text-sm mt-1">
                      {state.results.successful > 0 && 
                        `${state.results.successful} désabonnements ont été traités avec succès. `
                      }
                      {state.results.failed > 0 &&
                        `${state.results.failed} ont échoué (voir détails ci-dessous).`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Détails des échecs (si applicable) */}
              {state.results.failed > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Détails des échecs :</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {state.results.details
                      .filter(detail => !detail.success)
                      .map((detail, index) => (
                        <div key={index} className="text-sm bg-red-50 p-2 rounded text-red-800">
                          {detail.message}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Rappel :</strong> Les désabonnements peuvent prendre quelques jours à être effectifs. 
                  Si vous continuez à recevoir des emails de ces expéditeurs, marquez-les comme spam.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={resetState}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
