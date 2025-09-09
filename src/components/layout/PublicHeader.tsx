import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Menu, X } from 'lucide-react'

interface PublicHeaderProps {
  onLogin: () => void
}

export function PublicHeader({ onLogin }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'Fonctionnalités', href: '/features' },
    { name: 'Tarifs', href: '/pricing' },
    { name: 'À propos', href: '/about' },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Carrousel de marques en haut */}
      <div className="bg-gray-50 border-b border-gray-100 overflow-hidden">
        <div className="relative">
          <motion.div
            className="flex items-center space-x-8 py-3"
            animate={{ x: [0, -1920] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {/* Première série de logos */}
            <div className="flex items-center space-x-8 min-w-max">
              <img src="https://via.placeholder.com/120x40/000/fff?text=Gmail" alt="Gmail" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Outlook" alt="Outlook" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Yahoo" alt="Yahoo" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Apple" alt="Apple Mail" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Thunderbird" alt="Thunderbird" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=ProtonMail" alt="ProtonMail" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Mailchimp" alt="Mailchimp" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Zoho" alt="Zoho" className="h-8 opacity-60" />
            </div>
            {/* Deuxième série pour la continuité */}
            <div className="flex items-center space-x-8 min-w-max">
              <img src="https://via.placeholder.com/120x40/000/fff?text=Gmail" alt="Gmail" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Outlook" alt="Outlook" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Yahoo" alt="Yahoo" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Apple" alt="Apple Mail" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Thunderbird" alt="Thunderbird" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=ProtonMail" alt="ProtonMail" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Mailchimp" alt="Mailchimp" className="h-8 opacity-60" />
              <img src="https://via.placeholder.com/120x40/000/fff?text=Zoho" alt="Zoho" className="h-8 opacity-60" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Header principal */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ordo
              </span>
            </Link>

            {/* Navigation desktop */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors relative ${
                    isActive(item.href)
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* CTA et menu mobile */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onLogin}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Se connecter
              </button>

              {/* Bouton menu mobile */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-600" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </header>
    </>
  )
}
