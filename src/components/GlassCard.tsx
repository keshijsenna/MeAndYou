import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../lib/utils';

interface GlassCardProps {
  width?: string | number;
  padding?: string | number;
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ width, padding, children, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ duration: 0.6, ease: [0.34, 1.2, 0.64, 1] }}
        whileHover={{
          scale: 1.01,
          borderColor: 'var(--border-active)',
          boxShadow: 'var(--shadow-card), 0 0 20px rgba(235,194,198,0.1)'
        }}
        style={{ width, padding }}
        className={cn(
          "rounded-[var(--radius-card)] border border-[var(--border-glass)]",
          "bg-[color:var(--bg-card)] backdrop-blur-[18px] backdrop-saturate-[180%]",
          "bg-[image:var(--gradient-card)] shadow-[var(--shadow-card)] mx-auto",
          className
        )}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";
