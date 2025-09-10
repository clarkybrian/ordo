import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { 
  Mail, 
  User, 
  Menu,
  MessageCircle
} from 'lucide-react'
import { Button } from '../ui/button'
import { supabase } from '../../lib/supabase'
import { Sidebar } from '../Sidebar'
import { DesktopNavigation } from '../DesktopNavigation'
import ConversationAssistant from '../ConversationAssistant'
import { useWindowSize } from '../../hooks/useWindowSize'

interface LayoutProps {
  user: {
    email: string
    subscription_type: 'free' | 'pro' | 'premium'
  }
}

export function Layout({ user }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const navigate = useNavigate()
  const { isMobile, isTablet } = useWindowSize() // Détection responsive
  
  // N'utiliser le menu latéral que sur mobile/tablette
  const useResponsiveSidebar = isMobile || isTablet

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - seulement sur mobile/tablette */}
      {useResponsiveSidebar && (
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />
      )}
      
      {/* Contenu principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isAssistantOpen ? 'mr-112' : ''}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Menu et Logo */}
              <div className="flex items-center space-x-3">
                {useResponsiveSidebar && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="focus:outline-none"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Ordo</h1>
              </div>

              {/* Navigation Desktop */}
              {!useResponsiveSidebar && <DesktopNavigation className="mx-4" />}

              {/* Actions utilisateur */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                    className="relative"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1 pt-4 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Assistant de Conversation */}
      <ConversationAssistant 
        isMinimized={!isAssistantOpen}
        onToggleMinimize={() => setIsAssistantOpen(!isAssistantOpen)}
      />
    </div>
  )
}
