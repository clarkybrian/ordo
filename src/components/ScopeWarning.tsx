import React from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { signOut } from '../services/auth';
import { Button } from './ui/button';

interface ScopeWarningProps {
  message: string;
  onClose?: () => void;
}

export default function ScopeWarning({ message, onClose }: ScopeWarningProps) {
  const handleReconnect = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Forcer le rechargement de la page
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Permissions insuffisantes
          </h3>
        </div>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleReconnect}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se reconnecter
          </Button>
          
          {onClose && (
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Plus tard
            </Button>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Pourquoi ?</strong> Pour envoyer des emails, nous avons besoin 
            de permissions supplémentaires que vous pouvez accorder en vous reconnectant.
          </p>
        </div>
      </div>
    </div>
  );
}
