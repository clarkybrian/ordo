import { motion } from 'framer-motion';

interface SocialNetwork {
  name: string;
  logo: string;
  fallbackIcon: string;
  color: string;
  bgColor: string;
}

const socialNetworks: SocialNetwork[] = [
  { 
    name: 'Gmail', 
    logo: '/providers/gmail-logo.png', 
    fallbackIcon: '📧', 
    color: 'text-red-600', 
    bgColor: 'bg-red-50' 
  },
  { 
    name: 'Outlook', 
    logo: '/providers/outlook-logo.png', 
    fallbackIcon: '📬', 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-50' 
  },
  { 
    name: 'Yahoo', 
    logo: '/providers/yahoo-logo.png', 
    fallbackIcon: '💜', 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50' 
  },
  { 
    name: 'LinkedIn', 
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg', 
    fallbackIcon: '💼', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50' 
  },
  { 
    name: 'Twitter', 
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg', 
    fallbackIcon: '🐦', 
    color: 'text-sky-500', 
    bgColor: 'bg-sky-50' 
  },
  { 
    name: 'Slack', 
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg', 
    fallbackIcon: '💬', 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50' 
  },
];

export const SocialCarousel: React.FC = () => {
  // Dupliquer le tableau pour créer un effet de boucle infinie
  const duplicatedNetworks = [...socialNetworks, ...socialNetworks];

  return (
    <div className="relative overflow-hidden flex-1 max-w-xs">
      <motion.div
        className="flex gap-2"
        animate={{
          x: ['0%', '-50%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ width: '200%' }}
      >
        {duplicatedNetworks.map((network, index) => (
          <motion.div
            key={`${network.name}-${index}`}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full border
              ${network.bgColor} ${network.color} border-current/20
              whitespace-nowrap flex-shrink-0 shadow-sm
            `}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={network.logo}
              alt={network.name}
              className="w-4 h-4 object-contain"
              onError={(e) => {
                // Fallback vers l'emoji si l'image ne charge pas
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLSpanElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <span 
              className="text-sm hidden"
              style={{ display: 'none' }}
            >
              {network.fallbackIcon}
            </span>
            <span className="text-xs font-medium">{network.name}</span>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Gradients de fondu sur les côtés pour effet fluide */}
      <div className="absolute left-0 top-0 w-6 h-full bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 w-6 h-full bg-gradient-to-l from-purple-50 via-purple-50/50 to-transparent pointer-events-none z-10" />
    </div>
  );
};
