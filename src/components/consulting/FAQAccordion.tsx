'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

export default function FAQAccordion({ items, className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="border border-white/10 rounded-lg overflow-hidden bg-white/5 backdrop-blur-md"
        >
          <button
            onClick={() => toggle(index)}
            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-white/10 transition-colors text-white"
          >
            <span className="font-medium">{item.question}</span>
            <div className={cn('relative inline-block', openIndex === index && '')}>
              {openIndex === index && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
              )}
              <ChevronDown
                className={cn(
                  'h-5 w-5 transition-transform relative',
                  openIndex === index 
                    ? 'transform rotate-180 text-amber-400' 
                    : 'text-gray-400'
                )}
                style={openIndex === index ? { filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' } : {}}
              />
            </div>
          </button>
          {openIndex === index && (
            <div className="px-6 py-4 bg-white/5 border-t border-white/10">
              <p className="text-gray-300 leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

