import { motion } from 'framer-motion'
import { Calendar, User, Paperclip, Star, MoreVertical } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import type { Email } from '../types'
import { cn } from '../lib/utils'

interface EmailCardProps {
  email: Email
  onClick?: () => void
  onStarClick?: (emailId: string) => void
  onMoveCategory?: () => void
  onMarkAsRead?: (emailId: string) => void
}

export function EmailCard({ email, onClick, onStarClick, onMoveCategory, onMarkAsRead }: EmailCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 jours
      return date.toLocaleDateString('fr-FR', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="mb-3"
    >
      <Card 
        className={cn(
          "transition-all duration-200 overflow-hidden", // Ajout overflow-hidden pour responsive
          "cursor-pointer hover:shadow-lg",
          !email.is_read && "border-l-4 border-l-blue-500 bg-blue-50/30",
          email.is_read && "border-l-4 border-l-gray-300 bg-gray-50/50",
          email.is_important && "ring-2 ring-yellow-200"
        )}
        onClick={() => {
          // Marquer comme lu quand on clique
          if (!email.is_read && onMarkAsRead) {
            onMarkAsRead(email.id);
          }
          if (onClick) onClick();
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2"> {/* Ajout gap pour espacement */}
            <div className="flex-1 min-w-0 overflow-hidden"> {/* Ajout overflow-hidden */}
              {/* En-tête avec expéditeur et date */}
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1"> {/* Ajout min-w-0 flex-1 */}
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {email.sender_name}
                  </span>
                  {email.category && (
                    <span 
                      className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
                      style={{ 
                        backgroundColor: `${email.category.color}20`,
                        color: email.category.color 
                      }}
                    >
                      {email.category.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0"> {/* Ajout flex-shrink-0 */}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(email.received_at)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-yellow-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onStarClick) onStarClick(email.id)
                    }}
                  >
                    <Star 
                      className={cn(
                        "h-3 w-3 transition-colors",
                        email.is_important ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400"
                      )} 
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveCategory?.()
                    }}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Sujet */}
              <h3 className={cn(
                "text-sm mb-2 line-clamp-1 break-words", // Ajout break-words
                !email.is_read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
              )}>
                {email.subject || "(Aucun sujet)"}
              </h3>

              {/* Aperçu du contenu */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2 break-words"> {/* Ajout break-words */}
                {email.snippet || email.body_text?.substring(0, 120) + "..."}
              </p>

              {/* Pièces jointes */}
              {email.attachments && email.attachments.length > 0 && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                  <span>{email.attachments.length} pièce{email.attachments.length > 1 ? 's' : ''} jointe{email.attachments.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
