import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
  name: string;
  role: string;
  track: string;
  content: string;
  rating?: number;
  className?: string;
}

export default function TestimonialCard({
  name,
  role,
  track,
  content,
  rating = 5,
  className,
}: TestimonialCardProps) {
  return (
    <Card className={cn('border border-slate-200 shadow-sm bg-white rounded-xl', className)}>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="mb-6 leading-relaxed text-slate-700">"{content}"</p>
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-sm text-slate-600">{role}</p>
          <p className="text-sm mt-1 text-slate-500">{track}</p>
        </div>
      </CardContent>
    </Card>
  );
}

