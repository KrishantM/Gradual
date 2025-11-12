'use client';

import { motion } from 'framer-motion';
import { Loader2, Sparkles, Brain, TrendingUp } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  variant?: 'default' | 'sparkles' | 'brain' | 'trending';
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  variant = 'default',
  size = 'md'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const renderIcon = () => {
    switch (variant) {
      case 'sparkles':
        return <Sparkles className={iconSizeClasses[size]} />;
      case 'brain':
        return <Brain className={iconSizeClasses[size]} />;
      case 'trending':
        return <TrendingUp className={iconSizeClasses[size]} />;
      default:
        return <Loader2 className={sizeClasses[size]} />;
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center space-y-4"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={{ 
          rotate: variant === 'default' ? 360 : 0,
          scale: [1, 1.1, 1],
          y: variant !== 'default' ? [0, -5, 0] : 0
        }}
        transition={{ 
          rotate: { duration: 1, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        }}
        className={`text-blue-400 ${variant !== 'default' ? 'animate-pulse' : ''}`}
      >
        {renderIcon()}
      </motion.div>
      
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.p 
          className="text-gray-300 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="loading-dots"></span>
          </motion.span>
        </motion.p>
      </motion.div>

      {variant !== 'default' && (
        <motion.div
          className="flex space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

