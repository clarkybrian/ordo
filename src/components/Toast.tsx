import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from './ui/button';
import type { ToastProps } from '../hooks/useToast';

export const Toast: React.FC<ToastProps & { onClose?: () => void }> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  progress
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, type]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'loading':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'loading':
        return 'border-l-blue-500';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          className={`
            relative max-w-sm w-full bg-white border-l-4 ${getBorderColor()} 
            rounded-lg shadow-lg pointer-events-auto overflow-hidden
          `}
        >
          {/* Barre de progression */}
          {progress !== undefined && (
            <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-300"
                 style={{ width: `${progress}%` }} />
          )}
          
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {title}
                </p>
                {message && (
                  <p className="mt-1 text-sm text-gray-500">
                    {message}
                  </p>
                )}
                {progress !== undefined && (
                  <div className="mt-2 text-xs text-gray-400">
                    {Math.round(progress)}% terminé
                  </div>
                )}
              </div>
              
              {type !== 'loading' && (
                <div className="ml-4 flex-shrink-0 flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsVisible(false);
                      setTimeout(() => onClose?.(), 300);
                    }}
                    className="p-1 h-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Container pour gérer plusieurs toasts
export const ToastContainer: React.FC<{ 
  toasts: ToastProps[]; 
  onRemove: (id: string) => void 
}> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};
