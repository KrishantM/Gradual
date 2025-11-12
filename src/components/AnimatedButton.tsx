'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonProps } from '@/components/ui/button';

interface AnimatedButtonProps extends Omit<ButtonProps, 'variant'> {
  children: ReactNode;
  variant?: 'default' | 'gradient' | 'glow' | 'pulse';
  animationType?: 'scale' | 'lift' | 'glow' | 'wiggle';
}

export default function AnimatedButton({ 
  children, 
  variant = 'default',
  animationType = 'scale',
  className = '',
  ...props 
}: AnimatedButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white';
      case 'glow':
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25';
      case 'pulse':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      default:
        return '';
    }
  };

  const getAnimationProps = () => {
    switch (animationType) {
      case 'lift':
        return {
          whileHover: { y: -2, scale: 1.02 },
          whileTap: { y: 0, scale: 0.98 }
        };
      case 'glow':
        return {
          whileHover: { 
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
            scale: 1.05 
          },
          whileTap: { scale: 0.95 }
        };
      case 'wiggle':
        return {
          whileHover: { 
            rotate: [0, -2, 2, 0],
            scale: 1.05 
          },
          whileTap: { scale: 0.95 }
        };
      default:
        return {
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 }
        };
    }
  };

  const animationProps = getAnimationProps();

  return (
    <motion.div
      {...animationProps}
      transition={{ duration: 0.2 }}
    >
      <Button
        className={`${getVariantClasses()} ${className}`}
        {...props}
      >
        {variant === 'pulse' && (
          <motion.div
            className="absolute inset-0 rounded-md"
            animate={{ 
              boxShadow: [
                "0 0 0px rgba(147, 51, 234, 0)",
                "0 0 20px rgba(147, 51, 234, 0.5)",
                "0 0 0px rgba(147, 51, 234, 0)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <motion.span
          animate={variant === 'pulse' ? { 
            textShadow: [
              "0 0 0px rgba(255, 255, 255, 0)",
              "0 0 10px rgba(255, 255, 255, 0.5)",
              "0 0 0px rgba(255, 255, 255, 0)"
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {children}
        </motion.span>
      </Button>
    </motion.div>
  );
}

