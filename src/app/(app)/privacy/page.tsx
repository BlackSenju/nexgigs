import { BackButton } from "@/components/ui/back-button";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/" />
      <h1 className="text-2xl font-black text-white mb-6">Privacy Policy</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-4 text-zinc-300 text-sm leading-relaxed">
        <p className="text-zinc-400">Last updated: April 3, 2026</p>

        <h2 className="text-lg font-bold text-white mt-6">1. Introduction</h2>
        <p>NexGigs (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the NexGigs platform at nexgigs.com and the NexGigs mobile application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>

        <h2 className="text-lg font-bold text-white mt-6">2. Information We Collect</h2>
        <p><strong className="text-white">Account Information:</strong> When you create an account, we collect your first name, last initial, email address, city, state, and zip code. If you sign in with Google, we receive your name and email from Google.</p>
        <p><strong className="text-white">Profile Information:</strong> Skills, portfolio images/videos, bio, and profile photos you choose to upload.</p>
        <p><strong className="text-white">Identity Verification:</strong> If you choose to verify your identity, our partner Persona collects government ID images and selfie photos for verification purposes only.</p>
        <p><strong className="text-white">Payment Information:</strong> Payment processing is handled by Stripe. We do not store your credit card numbers. Stripe collects payment details in accordance with their privacy policy.</p>
        <p><strong className="text-white">Location Data:</strong> We collect city and zip code at signup. During active jobs, GPS location may be shared between the poster and gigger with consent. Location data is used to show nearby jobs and for safety features.</p>
        <p><strong className="text-white">Camera Access:</strong> The app may request camera access for uploading profile photos, portfolio images, and identity verification selfies. Camera access is only used when you initiate these actions.</p>
        <p><strong className="text-white">Usage Data:</strong> We collect information about how you use the platform, including pages visited, jobs viewed, and interactions.</p>

        <h2 className="text-lg font-bold text-white mt-6">3. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide and maintain the NexGigs platform</li>
          <li>Connect you with local job opportunities and service providers</li>
          <li>Process payments between posters and giggers</li>
          <li>Verify user identities for trust and safety</li>
          <li>Send notifications about jobs, messages, and account activity</li>
          <li>Improve the platform and user experience</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2 className="text-lg font-bold text-white mt-6">4. Information Sharing</h2>
        <p>We do not sell your personal information. We share information with:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-white">Other Users:</strong> Your public profile (first name, last initial, city, skills, ratings) is visible to other users.</li>
          <li><strong className="text-white">Service Providers:</strong> Stripe (payments), Persona (identity verification), Supabase (data storage), Mapbox (maps), Resend (email).</li>
          <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect rights and safety.</li>
        </ul>

        <h2 className="text-lg font-bold text-white mt-6">5. Data Security</h2>
        <p>We implement industry-standard security measures including encryption, secure authentication (MFA support), rate limiting, and audit logging. However, no method of electronic transmission is 100% secure.</p>

        <h2 className="text-lg font-bold text-white mt-6">6. Your Rights</h2>
        <p>You may:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access and update your profile information at any time</li>
          <li>Request deletion of your account and associated data</li>
          <li>Opt out of marketing communications</li>
          <li>Request a copy of your data</li>
        </ul>

        <h2 className="text-lg font-bold text-white mt-6">7. Data Retention</h2>
        <p>We retain your data as long as your account is active. Payment records are retained for 7 years per IRS requirements. You may request deletion of your account at any time.</p>

        <h2 className="text-lg font-bold text-white mt-6">8. Children&apos;s Privacy</h2>
        <p>NexGigs is not intended for users under 18 years of age. We do not knowingly collect information from children.</p>

        <h2 className="text-lg font-bold text-white mt-6">9. Changes to This Policy</h2>
        <p>We may update this policy from time to time. We will notify you of significant changes via email or in-app notification.</p>

        <h2 className="text-lg font-bold text-white mt-6">10. Contact Us</h2>
        <p>For privacy-related questions, contact us at privacy@nexgigs.com.</p>

        <p className="text-zinc-500 mt-8 pt-4 border-t border-zinc-800">NexGigs is a marketplace platform that connects people seeking services with independent service providers.</p>
      </div>
    </div>
  );
}
