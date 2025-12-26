import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export default function Section({ children, className, id, style }: SectionProps) {
  return (
    <section id={id} className={cn('py-16 md:py-20', className)} style={style}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

