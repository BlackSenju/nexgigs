/**
 * Legal disclaimers and terms used throughout NexGigs.
 */

export const DISCLAIMERS = {
  /** Shown when hiring an unverified gigger */
  hiringUnverified: `This gigger has not completed identity verification or a background check. NexGigs is a marketplace that connects people — we do not employ, endorse, or guarantee any service provider. By hiring an unverified user, you acknowledge that you do so at your own risk. We strongly recommend hiring Verified or Verified Pro giggers for in-person services.`,

  /** Shown when hiring any gigger (general) */
  hiringGeneral: `NexGigs is a platform that connects service seekers with independent service providers. NexGigs does not employ, supervise, or control any gigger. All giggers are independent contractors. You are responsible for evaluating the qualifications, experience, and suitability of any gigger you hire. NexGigs is not liable for any damages, injuries, or losses resulting from services performed.`,

  /** Shown for licensed trades (electrical, plumbing, etc.) */
  licensedTrades: `This category requires a valid professional license. NexGigs displays license information as provided by the gigger but does not independently verify all licenses. For licensed work (electrical, plumbing, HVAC, contracting), you should independently verify the gigger's license with your state licensing board before hiring.`,

  /** Shown on signup / terms acceptance */
  termsAcceptance: `By creating an account, you agree to NexGigs' Terms of Service and Privacy Policy. You acknowledge that NexGigs is a marketplace platform and does not employ or endorse any user. All services are performed by independent contractors at their own discretion.`,

  /** Shown in safety center */
  safetyDisclaimer: `While NexGigs provides safety tools including ID verification, in-app messaging, GPS tracking, and a panic button, we cannot guarantee your safety in all situations. Always meet in public places when possible, tell someone where you're going, and trust your instincts. If you feel unsafe, leave immediately and contact 911.`,

  /** Shown on payment / escrow */
  paymentDisclaimer: `Payments are processed by Stripe. NexGigs holds funds in escrow until the poster confirms job completion. NexGigs is not responsible for the quality of work performed. Disputes should be raised within 48 hours of job completion.`,

  /** Footer disclaimer */
  platformDisclaimer: `NexGigs is a marketplace platform that connects people seeking services with independent service providers. NexGigs does not employ, recommend, or endorse any service provider and is not responsible for any service provider's actions, conduct, or work product. Users hire service providers at their own risk.`,
} as const;

export const VERIFICATION_TIERS = {
  basic: {
    label: "Basic",
    description: "Email verified only",
    color: "zinc",
    trustLevel: "low",
  },
  verified: {
    label: "ID Verified",
    description: "Government ID + selfie verified via Persona",
    color: "orange",
    trustLevel: "medium",
  },
  verified_pro: {
    label: "Verified Pro",
    description: "ID verified + background check cleared",
    color: "green",
    trustLevel: "high",
  },
} as const;
