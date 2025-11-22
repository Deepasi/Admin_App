
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BenefitCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ title, description, icon, className }) => {
  return (
    <motion.div 
      className={cn(
        "glass-panel p-6 h-full flex flex-col",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-4 text-brand-red">{icon}</div>
      <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </motion.div>
  );
};

export default BenefitCard;
