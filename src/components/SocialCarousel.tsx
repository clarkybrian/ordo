import { motion } from 'framer-motion';

interface SocialNetwork {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

const socialNetworks: SocialNetwork[] = [
  { name: 'Gmail', icon: '📧', color: 'text-red-600', bgColor: 'bg-red-50' },
  { name: 'LinkedIn', icon: '💼', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { name: 'Twitter', icon: '🐦', color: 'text-sky-500', bgColor: 'bg-sky-50' },
  { name: 'Slack', icon: '💬', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { name: 'Teams', icon: '👥', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { name: 'Discord', icon: '🎮', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { name: 'Outlook', icon: '📬', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { name: 'Instagram', icon: '�', color: 'text-pink-500', bgColor: 'bg-pink-50' },
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
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ width: '200%' }}
      >
        {duplicatedNetworks.map((network, index) => (
          <motion.div
            key={`${network.name}-${index}`}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full border
              ${network.bgColor} ${network.color} border-current/20
              whitespace-nowrap flex-shrink-0 shadow-sm
            `}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-xs">{network.icon}</span>
            <span className="text-xs font-medium">{network.name}</span>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Gradients de fondu sur les côtés pour effet fluide */}
      <div className="absolute left-0 top-0 w-4 h-full bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 w-4 h-full bg-gradient-to-l from-purple-50 via-purple-50/50 to-transparent pointer-events-none z-10" />
    </div>
  );
};
