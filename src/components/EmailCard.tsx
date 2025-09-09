import { motion } from 'framer-motion'
import { Calendar, User, Paperclip, Star, MoreVertical } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import type { Email } from '../types'
import { cn } from '../lib/utils'

interface EmailCardProps {
  email: Email
  onClick?: () => void
  onStarClick?: () => void
  onMoveCategory?: () => void
}

export function EmailCard({ email, onClick, onStarClick, onMoveCategory }: EmailCardProps) {
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
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-lg",
          !email.is_read && "border-l-4 border-l-primary",
          email.is_important && "ring-2 ring-yellow-200"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* En-tête avec expéditeur et date */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {email.sender_name}
                  </span>
                  {email.category && (
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${email.category.color}20`,
                        color: email.category.color 
                      }}
                    >
                      {email.category.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(email.received_at)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onStarClick?.()
                    }}
                  >
                    <Star 
                      className={cn(
                        "h-3 w-3",
                        email.is_important ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
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
                "text-sm mb-2 line-clamp-1",
                !email.is_read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
              )}>
                {email.subject || "(Aucun sujet)"}
              </h3>

              {/* Aperçu du contenu */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
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
