import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Category } from '../types';

interface CategoriesCarouselProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  globalStats: {
    totalEmails: number;
    unreadEmails: number;
    importantEmails: number;
  };
}

export function CategoriesCarousel({ 
  categories, 
  selectedCategory, 
  onCategorySelect,
  globalStats 
}: CategoriesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 120;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  // Catégories par défaut + catégories utilisateur
  const defaultCategories = [
    {
      id: null,
      name: 'Tous',
      icon: '📧',
      color: '#3b82f6',
      emails_count: globalStats.totalEmails
    },
    {
      id: 'unread',
      name: 'Non lus',
      icon: '🔴',
      color: '#ef4444', 
      emails_count: globalStats.unreadEmails
    },
    {
      id: 'important',
      name: 'Importants',
      icon: '⭐',
      color: '#f59e0b',
      emails_count: globalStats.importantEmails
    }
  ];

  const allCategories = [
    ...defaultCategories,
    ...categories.filter(cat => (cat.emails_count || 0) > 0)
  ];

  return (
    <div className="relative flex items-center max-w-[200px]">
      {/* Bouton scroll gauche */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 z-10 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
        style={{ transform: 'translateX(-50%)' }}
      >
        <ChevronLeft className="w-3 h-3 text-gray-600" />
      </button>

      {/* Carrousel des catégories */}
      <div
        ref={scrollRef}
        className="flex space-x-2 overflow-x-auto scrollbar-hide px-6"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {allCategories.map((category) => (
          <motion.button
            key={category.id || 'all'}
            onClick={() => onCategorySelect(category.id)}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
              ${selectedCategory === category.id
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <span className="text-xs">{category.icon}</span>
            <span className="whitespace-nowrap">{category.name}</span>
            <span className={`
              px-1.5 py-0.5 rounded-full text-xs font-semibold
              ${selectedCategory === category.id
                ? 'bg-blue-200 text-blue-900'
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {category.emails_count}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Bouton scroll droite */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 z-10 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
        style={{ transform: 'translateX(50%)' }}
      >
        <ChevronRight className="w-3 h-3 text-gray-600" />
      </button>
    </div>
  );
}
