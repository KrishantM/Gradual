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
          className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-white/5"
        >
          <button
            onClick={() => toggle(index)}
            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-slate-900 dark:text-white"
          >
            <span className="font-medium">{item.question}</span>
            <ChevronDown
              className={cn(
                'h-5 w-5 transition-transform flex-shrink-0',
                openIndex === index 
                  ? 'transform rotate-180 text-amber-600 dark:text-amber-400' 
                  : 'text-slate-400 dark:text-slate-500'
              )}
            />
          </button>
          {openIndex === index && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

