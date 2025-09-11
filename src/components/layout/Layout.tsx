import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { 
  Menu,
  MessageCircle,
  LogOut
} from 'lucide-react'
import { Button } from '../ui/button'
import { supabase } from '../../lib/supabase'
import Sidebar from '../Sidebar'
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
    <div className={`min-h-screen bg-gray-50 flex transition-all duration-300 ${isAssistantOpen ? 'mr-112' : ''} ${useResponsiveSidebar ? 'overflow-x-hidden' : ''}`}>
      {/* Sidebar - seulement sur mobile/tablette */}
      {useResponsiveSidebar && (
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />
      )}
      
      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Menu et Logo */}
              <div className="flex items-center space-x-3 min-w-0">
                {useResponsiveSidebar && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="focus:outline-none flex-shrink-0"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                
                <div className="bg-white p-1 rounded-xl shadow-sm flex-shrink-0">
                  <img 
                    src="/providers/logo-ordo.png" 
                    alt="Orton" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold text-gray-900 truncate">Orton</h1>
              </div>

              {/* Navigation Desktop */}
              {!useResponsiveSidebar && <DesktopNavigation className="mx-4" />}

              {/* Actions utilisateur */}
              <div className="flex items-center space-x-3 flex-shrink-0">
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-sm text-gray-600 truncate max-w-32">{user.email}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                    className="relative flex-shrink-0"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">Déconnexion</span>
                  </Button>
                </div>
                
                {/* Actions mobiles */}
                {useResponsiveSidebar && (
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                      className="relative"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleLogout}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 min-w-0 overflow-x-hidden">
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
