"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center py-16">
      <div className="w-full max-w-3xl mx-auto px-4">
        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
          <CardContent className="p-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 text-center">Gradual - Privacy Policy</h1>
            <p className="text-gray-400 text-sm mb-8 text-center">Effective Date: 17/07/2025</p>
            <div className="text-gray-200 space-y-6 text-base leading-relaxed">
              <p>Your privacy is important to us. This Privacy Policy explains how Gradual collects, uses, and protects your personal data.</p>
              <ol className="list-decimal list-inside space-y-4">
                <li>
                  <strong>Data We Collect</strong><br />
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>Account Information: name, email, password</li>
                    <li>Profile Data: university, degree, GPA, interests, CV content</li>
                    <li>Usage Data: logs, interactions, IP address</li>
                    <li>Uploaded Files: text or PDF CVs you provide</li>
                  </ul>
                </li>
                <li>
                  <strong>How We Use Your Data</strong><br />
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>To provide and improve our services</li>
                    <li>To personalize your dashboard and suggestions</li>
                    <li>To analyze user trends (anonymized)</li>
                    <li>To communicate with you (confirmation emails, updates)</li>
                  </ul>
                </li>
                <li>
                  <strong>Data Sharing</strong><br />
                  We do not sell your personal data. We may share data with trusted service providers (e.g., Firebase, OpenAI, EmailJS) to operate the Platform.
                </li>
                <li>
                  <strong>Data Security</strong><br />
                  We implement appropriate technical and organizational safeguards to protect your data, including secure servers and encryption.
                </li>
                <li>
                  <strong>Your Rights</strong><br />
                  You may:
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>Access or update your profile data</li>
                    <li>Request deletion of your account</li>
                    <li>Opt out of communications at any time</li>
                  </ul>
                </li>
                <li>
                  <strong>Children's Privacy</strong><br />
                  We do not knowingly collect data from children under 13. If you are a parent or guardian and believe we have collected such data, please contact us.
                </li>
                <li>
                  <strong>International Users</strong><br />
                  Gradual is based in New Zealand but may be accessed globally. By using the Platform, you consent to data processing in accordance with New Zealand law.
                </li>
                <li>
                  <strong>Changes to This Policy</strong><br />
                  We may revise this Privacy Policy. Any updates will be posted on this page with a new effective date.
                </li>
                <li>
                  <strong>Contact</strong><br />
                  For privacy-related inquiries, email us at: <a href="mailto:krishantm7@gmail.com" className="text-blue-400 underline">krishantm7@gmail.com</a>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 