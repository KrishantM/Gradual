import type { Metadata } from 'next';
import ConsultingNavbar from '@/components/consulting/ConsultingNavbar';
import ConsultingFooter from '@/components/consulting/ConsultingFooter';

export const metadata: Metadata = {
  title: 'Gradual Consulting - Premium Career Guidance & Pathway Planning',
  description: 'Expert career consulting for high school, university, and early career professionals. Get clarity, a strategic plan, and actionable next steps.',
};

export default function ConsultingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <ConsultingNavbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <ConsultingFooter />
    </div>
  );
}
