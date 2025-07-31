"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center py-16">
      <div className="w-full max-w-3xl mx-auto px-4">
        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
          <CardContent className="p-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 text-center">Gradual - Terms of Service</h1>
            <p className="text-gray-400 text-sm mb-8 text-center">Effective Date: 17/07/2025</p>
            <div className="text-gray-200 space-y-6 text-base leading-relaxed">
              <p>Welcome to Gradual! By accessing or using our website and services (the &quot;Platform&quot;), you agree to comply with and be bound by the following Terms of Service (&quot;Terms&quot;). Please read these Terms carefully.</p>
              <ol className="list-decimal list-inside space-y-4">
                <li>
                  <strong>Use of the Platform</strong><br />
                  Gradual provides tools to help students and professionals improve their career prospects, including CV scoring, career suggestions, and personal dashboards. You agree to use the Platform only for lawful purposes and in accordance with these Terms.
                </li>
                <li>
                  <strong>User Accounts</strong><br />
                  To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities under your account.
                </li>
                <li>
                  <strong>Eligibility</strong><br />
                  You must be at least 13 years old to use Gradual. If you are under 18, you may only use the Platform with parental or guardian consent.
                </li>
                <li>
                  <strong>Intellectual Property</strong><br />
                  All content on Gradual, including designs, logos, code, text, and graphics, are the property of Gradual or its licensors. You may not copy, modify, distribute, or reverse engineer any part of the Platform without written consent.
                </li>
                <li>
                  <strong>User Content</strong><br />
                  By submitting CVs or other personal information, you grant Gradual a non-exclusive license to use this data to provide platform features. We do not claim ownership of your content.
                </li>
                <li>
                  <strong>Prohibited Conduct</strong><br />
                  You agree not to:
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>Use the Platform for any unlawful purpose</li>
                    <li>Attempt to gain unauthorized access to other accounts or systems</li>
                    <li>Upload or transmit viruses or malicious code</li>
                    <li>Use bots or scripts to abuse functionality</li>
                  </ul>
                </li>
                <li>
                  <strong>Termination</strong><br />
                  We reserve the right to suspend or terminate your access if you violate these Terms or misuse the Platform.
                </li>
                <li>
                  <strong>Limitation of Liability</strong><br />
                  Gradual is provided on an &quot;as-is&quot; basis. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform.
                </li>
                <li>
                  <strong>Changes to Terms</strong><br />
                  We may update these Terms from time to time. Changes will be effective once posted. Continued use of the Platform means you accept the new Terms.
                </li>
                <li>
                  <strong>Contact</strong><br />
                  If you have questions, contact us at: <a href="mailto:admin@gradual.co.nz" className="text-blue-400 underline">admin@gradual.co.nz</a>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 