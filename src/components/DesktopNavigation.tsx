import type { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, FolderOpen, Settings, CreditCard, Send } from 'lucide-react';

interface DesktopNavigationProps {
  className?: string;
}

export const DesktopNavigation: FC<DesktopNavigationProps> = ({ className = '' }) => {
  const location = useLocation();
  
  const isCurrentPath = (path: string) => location.pathname === path || 
    (path !== '/dashboard' && location.pathname.startsWith(path));
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Mail },
    { name: 'Envoyés', href: '/sent-emails', icon: Send },
    { name: 'Catégories', href: '/categories', icon: FolderOpen },
    { name: 'Abonnement', href: '/subscription', icon: CreditCard },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ];
  
  return (
    <nav className={`flex items-center space-x-1 ${className}`}>
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isCurrentPath(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
};
