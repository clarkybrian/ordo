import { motion } from 'framer-motion'
import { Calendar, User, Paperclip, Star, X, Reply, Forward, Archive } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import type { Email, EmailAttachment } from '../types'

interface EmailDetailPanelProps {
  email: Email
  onClose: () => void
}

export function EmailDetailPanel({ email, onClose }: EmailDetailPanelProps) {
  console.log(`🎬 EmailDetailPanel rendu pour:`, email.subject);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatContent = (content: string) => {
    // Remplace les \n par des <br> pour l'affichage HTML
    return content.replace(/\n/g, '<br>')
  }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-1/2 bg-white shadow-2xl z-[9999] flex flex-col border-l"
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: '50%'
      }}
    >
      {/* Header avec actions */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold truncate">Détails de l'email</h2>
              {email.is_important && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
              {!email.is_read && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Non lu
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions rapides */}
          <div className="flex items-center space-x-2 pt-2">
            <Button variant="outline" size="sm">
              <Reply className="h-4 w-4 mr-2" />
              Répondre
            </Button>
            <Button variant="outline" size="sm">
              <Forward className="h-4 w-4 mr-2" />
              Transférer
            </Button>
            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <Card className="rounded-none border-x-0 border-t-0">
          <CardContent className="p-6">
            {/* Métadonnées de l'email */}
            <div className="space-y-4 mb-6">
              {/* Sujet */}
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  {email.subject || "(Aucun sujet)"}
                </h1>
              </div>

              {/* Expéditeur et date */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {email.sender_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {email.sender_email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(email.received_at)}
                  </div>
                </div>
              </div>

              {/* Catégorie */}
              {email.category && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Catégorie :</span>
                  <span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${email.category.color}20`,
                      color: email.category.color 
                    }}
                  >
                    {email.category.name}
                  </span>
                </div>
              )}

              {/* Pièces jointes */}
              {email.attachments && email.attachments.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Paperclip className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {email.attachments.length} pièce{email.attachments.length > 1 ? 's' : ''} jointe{email.attachments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {email.attachments.map((attachment: EmailAttachment, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <Paperclip className="h-3 w-3" />
                        <span>{attachment.filename || `Pièce jointe ${index + 1}`}</span>
                        {attachment.size && (
                          <span className="text-gray-400">({attachment.size} bytes)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contenu de l'email */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Contenu de l'email</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {email.body_text ? (
                  <div 
                    className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: formatContent(email.body_text)
                    }}
                  />
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    {email.snippet || "Aucun contenu disponible"}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
