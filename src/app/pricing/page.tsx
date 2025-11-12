'use client';

/**
 * Pricing Page - Subscription Tiers and Costs
 * 
 * This page showcases Gradual's subscription tiers with clear pricing,
 * features, and benefits for both students and recruiters.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Check, 
  X, 
  Crown, 
  Building, 
  Eye, 
  Mail, 
  Download, 
  BarChart3,
  Zap,
  Shield,
  TrendingUp,
  Bookmark,
  Globe,
  ArrowRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isRecruiter, setIsRecruiter] = useState(false);

  // Check if user is a recruiter
  useEffect(() => {
    const checkUserRole = async () => {
      if (user && !authLoading) {
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/recruiter/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setIsRecruiter(response.ok);
        } catch (error) {
          console.error('Error checking recruiter status:', error);
          setIsRecruiter(false);
        }
      } else {
        setIsRecruiter(false);
      }
    };
    
    checkUserRole();
  }, [user, authLoading]);

  const recruiterTiers = [
    {
      name: 'Free',
      description: 'Explore our platform',
      price: { monthly: 0, yearly: 0 },
      popular: false,
      features: [
        'Browse student profiles',
        'Basic CV score viewing',
        'Create 1 shortlist',
        'View up to 10 profiles/day',
        'Email support'
      ],
      limitations: [
        'Limited profile views',
        'No direct contact',
        'Basic filtering options'
      ],
      cta: 'Start Free',
      ctaAction: () => router.push('/recruiter-onboarding'),
      icon: Eye,
      color: 'blue'
    },
    {
      name: 'Basic',
      description: 'For growing teams',
      price: { monthly: 49, yearly: 490 },
      popular: true,
      features: [
        'View up to 50 profiles/day',
        'Advanced filtering & search',
        'Create up to 5 shortlists',
        'View achievement data',
        'Basic analytics',
        'Email contact (10/month)',
        'Priority support',
        'Team collaboration tools'
      ],
      limitations: [
        'Limited monthly contacts',
        'Basic analytics only'
      ],
      cta: 'Start Basic',
      ctaAction: () => router.push('/recruiter-onboarding?tier=basic'),
      icon: Building,
      color: 'green'
    },
    {
      name: 'Premium',
      description: 'For established companies',
      price: { monthly: 99, yearly: 990 },
      popular: false,
      features: [
        'View up to 200 profiles/day',
        'Unlimited shortlists',
        'Direct student contact (50/month)',
        'Advanced analytics & insights',
        'Export candidate data',
        'Custom branding',
        'API access',
        'Dedicated account manager',
        'Priority support'
      ],
      limitations: [
        'Monthly contact limits apply'
      ],
      cta: 'Go Premium',
      ctaAction: () => router.push('/recruiter-onboarding?tier=premium'),
      icon: TrendingUp,
      color: 'purple'
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      price: { monthly: 199, yearly: 1990 },
      popular: false,
      features: [
        'Unlimited profile views',
        'Unlimited contacts',
        'Advanced analytics dashboard',
        'Custom integrations',
        'White-label solution',
        'Dedicated support team',
        'Custom reporting',
        'Bulk operations',
        'Advanced security features',
        'SLA guarantee'
      ],
      limitations: [],
      cta: 'Contact Sales',
      ctaAction: () => router.push('/contact?type=enterprise'),
      icon: Shield,
      color: 'gold'
    }
  ];


  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return billingCycle === 'yearly' 
      ? `$${price}/year` 
      : `$${price}/month`;
  };

  const getSavings = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return null;
    const yearlyPrice = monthlyPrice * 10; // 2 months free
    const savings = (monthlyPrice * 12) - yearlyPrice;
    return `Save $${savings}/year`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      {/* Back Button for Recruiters */}
      {isRecruiter && (
        <div className="max-w-6xl mx-auto px-4 pt-8">
          <Button
            variant="outline"
            onClick={() => router.push('/recruiter-dashboard')}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      )}
      
      {/* Header */}
      <div className="text-center py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-yellow-400 mr-3" />
            <h1 className="text-5xl font-bold text-white">Simple, Transparent Pricing</h1>
          </div>
          <p className="text-xl text-gray-300 mb-8">
            Choose the perfect plan for your recruitment needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <span className={`mr-3 ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                Save 17%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
          {recruiterTiers.map((tier, index) => (
            <Card 
              key={tier.name}
              className={`relative bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 ${
                tier.popular 
                  ? 'ring-2 ring-blue-500 scale-105 shadow-2xl' 
                  : 'hover:scale-105'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                  tier.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                  tier.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  tier.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <tier.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">{tier.name}</CardTitle>
                <p className="text-gray-400 mt-2">{tier.description}</p>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-white">
                    {formatPrice(tier.price[billingCycle])}
                  </div>
                  {tier.price[billingCycle] > 0 && billingCycle === 'yearly' && (
                    <div className="text-sm text-green-400 mt-1">
                      {getSavings(tier.price.monthly)}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4 mb-8">
                  <div className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {tier.limitations.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-white/10">
                      {tier.limitations.map((limitation, limitIndex) => (
                        <div key={limitIndex} className="flex items-start">
                          <X className="h-4 w-4 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-400 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={tier.ctaAction}
                  className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                    tier.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                      : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-300">Everything you need to know about our pricing</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Can I change plans anytime?</h3>
              <p className="text-gray-300">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any billing differences.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Is there a free trial?</h3>
              <p className="text-gray-300">
                All paid plans come with a 14-day free trial. No credit card required to start your trial.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-300">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Can I cancel anytime?</h3>
              <p className="text-gray-300">
                Absolutely! Cancel anytime with no cancellation fees. You'll retain access until the end of your billing period.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16 text-center">
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to accelerate your career?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Join thousands of students and recruiters who are already using Gradual to achieve their goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
              >
                Start Free Trial
              </Button>
              <Button
                onClick={() => router.push('/contact')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg"
              >
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
