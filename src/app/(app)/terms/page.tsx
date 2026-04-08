import { BackButton } from "@/components/ui/back-button";

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/" />
      <h1 className="text-2xl font-black text-white mb-6">Terms of Service</h1>
      <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
        <p className="text-zinc-400">Last updated: April 8, 2026</p>

        <h2 className="text-lg font-bold text-white mt-6">1. Agreement to Terms</h2>
        <p>By accessing or using NexGigs (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform.</p>

        <h2 className="text-lg font-bold text-white mt-6">2. Platform Description</h2>
        <p>NexGigs is a marketplace platform that connects people seeking services (&quot;Posters&quot;) with independent service providers (&quot;Giggers&quot;). NexGigs does NOT employ, supervise, control, or endorse any Gigger. All Giggers are independent contractors operating their own businesses.</p>

        <h2 className="text-lg font-bold text-white mt-6">3. User Eligibility</h2>
        <p>You must be at least 18 years old to use NexGigs. By creating an account, you represent that you are at least 18 years of age and have the legal capacity to enter into these terms.</p>

        <h2 className="text-lg font-bold text-white mt-6">4. Account Responsibilities</h2>
        <p>You are responsible for maintaining the security of your account credentials. You agree to provide accurate, current, and complete information. You may not create multiple accounts, impersonate others, or use the Platform for any illegal purpose.</p>

        <h2 className="text-lg font-bold text-white mt-6">5. Prohibited Activities</h2>
        <p>Users may NOT:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Post jobs or sell items involving illegal goods or services</li>
          <li>Harass, threaten, or discriminate against other users</li>
          <li>Attempt to circumvent the Platform&apos;s payment system (no off-platform payments)</li>
          <li>Post misleading, fraudulent, or deceptive content</li>
          <li>Scrape, crawl, or collect data from the Platform</li>
          <li>Use the Platform to distribute malware or spam</li>
          <li>Create fake reviews or manipulate ratings</li>
          <li>Sell pirated, counterfeit, or stolen goods</li>
          <li>Post adult content or services</li>
          <li>Engage in money laundering or financial fraud</li>
        </ul>

        <h2 className="text-lg font-bold text-white mt-6">6. Payments and Fees</h2>
        <p><strong className="text-white">Escrow:</strong> All job payments are held in escrow by Stripe until the Poster confirms job completion. Money is released to the Gigger only after confirmation.</p>
        <p><strong className="text-white">Platform fees:</strong> NexGigs charges a commission on completed gigs (3% free tier, 2% pro, 0% elite) and a service fee to Posters (7% free, 5% premium, 3% enterprise).</p>
        <p><strong className="text-white">Shop sales:</strong> A 10% commission is charged on all shop transactions.</p>
        <p><strong className="text-white">Subscriptions:</strong> Paid subscriptions are billed monthly through Stripe. You may cancel at any time. No refunds for partial months.</p>

        <h2 className="text-lg font-bold text-white mt-6">7. Taxes</h2>
        <p>Giggers are independent contractors and are solely responsible for reporting and paying all applicable taxes on their earnings. NexGigs will provide 1099-NEC forms (via Stripe) to users earning $600 or more in a calendar year, as required by IRS regulations.</p>

        <h2 className="text-lg font-bold text-white mt-6">8. Dispute Resolution</h2>
        <p>If a dispute arises between a Poster and a Gigger, users should first attempt to resolve it through in-app messaging. If unresolved, either party may request NexGigs mediation. NexGigs&apos; decision in mediation is final. For payment disputes, Stripe&apos;s dispute process applies.</p>

        <h2 className="text-lg font-bold text-white mt-6">9. Ghost Wall Policy</h2>
        <p>Users who no-show, abandon jobs, or stop responding may be reported. Three verified ghost reports within 90 days results in automatic placement on the public Ghost Wall of Shame. Ghost Wall placement is visible to all users and affects your reputation on the Platform.</p>

        <h2 className="text-lg font-bold text-white mt-6">10. Limitation of Liability</h2>
        <p>NexGigs is a marketplace platform ONLY. We are NOT liable for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The quality, safety, or legality of services performed</li>
          <li>The accuracy of user profiles, skills, or credentials</li>
          <li>Any damages, injuries, or losses resulting from gig services</li>
          <li>Any disputes between users</li>
          <li>Lost, stolen, or damaged property during service delivery</li>
        </ul>
        <p>Users hire service providers at their own risk. We strongly recommend hiring ID-verified and background-checked Giggers for in-person services.</p>

        <h2 className="text-lg font-bold text-white mt-6">11. Intellectual Property</h2>
        <p>Users retain ownership of content they create and upload (portfolio items, job descriptions, shop products). By posting content on NexGigs, you grant us a non-exclusive license to display that content on the Platform.</p>

        <h2 className="text-lg font-bold text-white mt-6">12. Account Termination</h2>
        <p>NexGigs reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or receive excessive ghost reports. Users may delete their account at any time through Settings.</p>

        <h2 className="text-lg font-bold text-white mt-6">13. Modifications</h2>
        <p>We may update these terms at any time. Continued use of the Platform after changes constitutes acceptance. We will notify users of significant changes via email or in-app notification.</p>

        <h2 className="text-lg font-bold text-white mt-6">14. Contact</h2>
        <p>For questions about these terms, contact us at <strong className="text-brand-orange">dev@nexgigs.com</strong>.</p>

        <p className="text-zinc-500 mt-8 pt-4 border-t border-zinc-800">NexGigs. Milwaukee, WI.</p>
      </div>
    </div>
  );
}
