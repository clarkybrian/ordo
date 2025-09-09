import { motion, AnimatePresence } from 'framer-motion'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export interface SyncProgress {
  stage: 'connecting' | 'fetching' | 'classifying' | 'saving' | 'completed' | 'error'
  progress: number
  message: string
  current_email?: string
  emails_processed?: number
  total_emails?: number
}

interface ProgressBarProps {
  isVisible: boolean
  progress: SyncProgress | null
  onComplete?: () => void
}

const stageLabels = {
  connecting: 'Connexion à Gmail',
  fetching: 'Récupération des emails',
  classifying: 'Classification IA',
  saving: 'Sauvegarde',
  completed: 'Terminé',
  error: 'Erreur'
}

const stageIcons = {
  connecting: Loader2,
  fetching: Mail,
  classifying: Loader2,
  saving: Loader2,
  completed: CheckCircle,
  error: AlertCircle
}

export function SyncProgressBar({ isVisible, progress, onComplete }: ProgressBarProps) {
  if (!isVisible || !progress) return null

  const Icon = stageIcons[progress.stage]
  const isError = progress.stage === 'error'
  const isCompleted = progress.stage === 'completed'
  const isAnimating = ['connecting', 'fetching', 'classifying', 'saving'].includes(progress.stage)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-4 right-4 z-50 max-w-sm w-full"
      >
        <div className={`
          rounded-lg border shadow-lg backdrop-blur-sm p-4
          ${isError 
            ? 'bg-red-50/95 border-red-200' 
            : isCompleted 
              ? 'bg-green-50/95 border-green-200'
              : 'bg-white/95 border-gray-200'
          }
        `}>
          {/* En-tête avec icône et titre */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`
              p-2 rounded-full
              ${isError 
                ? 'bg-red-100 text-red-600' 
                : isCompleted 
                  ? 'bg-green-100 text-green-600'
                  : 'bg-blue-100 text-blue-600'
              }
            `}>
              <Icon 
                className={`h-4 w-4 ${isAnimating ? 'animate-spin' : ''}`} 
              />
            </div>
            
            <div className="flex-1">
              <h3 className={`
                font-medium text-sm
                ${isError 
                  ? 'text-red-800' 
                  : isCompleted 
                    ? 'text-green-800'
                    : 'text-gray-800'
                }
              `}>
                {stageLabels[progress.stage]}
              </h3>
              
              {progress.emails_processed !== undefined && progress.total_emails !== undefined && (
                <p className="text-xs text-gray-600 mt-1">
                  {progress.emails_processed} / {progress.total_emails} emails
                </p>
              )}
            </div>

            {/* Pourcentage */}
            <div className={`
              text-sm font-bold
              ${isError 
                ? 'text-red-600' 
                : isCompleted 
                  ? 'text-green-600'
                  : 'text-blue-600'
              }
            `}>
              {Math.round(progress.progress)}%
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`
                  h-full rounded-full
                  ${isError 
                    ? 'bg-red-500' 
                    : isCompleted 
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }
                `}
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {/* Message de statut */}
            <motion.p
              key={progress.message}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-gray-600 truncate"
            >
              {progress.message}
            </motion.p>

            {/* Email en cours de traitement */}
            {progress.current_email && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-l-2 border-blue-200"
              >
                <span className="font-medium">En cours:</span>
                <br />
                <span className="truncate block">{progress.current_email}</span>
              </motion.div>
            )}
          </div>

          {/* Animation de pulsation pour les états actifs */}
          {isAnimating && (
            <motion.div
              className="absolute inset-0 rounded-lg border-2 border-blue-300 pointer-events-none"
              animate={{
                opacity: [0, 0.5, 0],
                scale: [1, 1.02, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}

          {/* Bouton de fermeture pour les états terminés */}
          {(isCompleted || isError) && onComplete && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={onComplete}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
