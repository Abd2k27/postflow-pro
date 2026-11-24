import { LegalSection, type LegalSectionContent, PublicLegalLayout } from '@/components/PublicLegalLayout';

const lastUpdated = 'March 15, 2026';

const sections: LegalSectionContent[] = [
  {
    title: '1. Acceptance of These Terms',
    paragraphs: [
      'These Terms of Service govern your access to and use of PostFlow Pro, including our website, web application, integrations, APIs, and publishing tools, which we refer to collectively as the Service.',
      'By creating an account, accessing, or using the Service, you agree to be bound by these Terms. If you use the Service on behalf of a company or other organization, you represent that you have authority to bind that organization to these Terms.',
    ],
  },
  {
    title: '2. Eligibility and Account Responsibilities',
    paragraphs: [
      'You must be legally capable of entering into a binding agreement and must provide accurate, current, and complete registration information.',
      'You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You must promptly notify us if you believe your account or a connected platform has been compromised.',
    ],
  },
  {
    title: '3. Connected Platforms and Third-Party Services',
    paragraphs: [
      'The Service allows you to connect and manage third-party social media accounts and related services. When you connect a third-party account, you authorize us to access and use the permissions you grant in order to provide scheduling, publishing, and account management features.',
      'Your use of any connected third-party platform remains subject to that platform\'s own terms, community rules, privacy policy, API policies, and technical limitations. We are not responsible for outages, moderation decisions, policy changes, or API restrictions imposed by third parties.',
    ],
  },
  {
    title: '4. Your Content',
    paragraphs: [
      'You retain ownership of the text, media, drafts, captions, and other materials you upload or submit to the Service. You grant us a limited, non-exclusive license to host, store, reproduce, process, format, and transmit that content solely as necessary to operate, secure, improve, and support the Service.',
      'You represent and warrant that you own or control all rights necessary to upload, schedule, publish, and distribute your content, and that your content and use of the Service do not violate any law, regulation, contract, intellectual property right, privacy right, publicity right, or platform rule.',
    ],
  },
  {
    title: '5. Acceptable Use',
    paragraphs: [
      'You may not misuse the Service, interfere with its normal operation, or use it in a way that creates legal, security, or platform-enforcement risk for us or others.',
    ],
    items: [
      'Upload, schedule, or distribute unlawful, infringing, deceptive, defamatory, hateful, harassing, abusive, or malicious content.',
      'Attempt to gain unauthorized access to the Service, other user accounts, or third-party systems.',
      'Circumvent rate limits, access controls, or technical restrictions, or use bots or scripts in ways that impair the Service.',
      'Transmit malware, harmful code, spam, or fraudulent campaigns.',
      'Use the Service in violation of export controls, sanctions laws, advertising rules, or platform-specific requirements.',
    ],
  },
  {
    title: '6. Scheduling, Publishing, and Availability',
    paragraphs: [
      'We will use commercially reasonable efforts to process your scheduling instructions and publish your content to connected platforms, but publication timing and delivery can be affected by network interruptions, platform review queues, API errors, token expiration, or third-party service changes.',
      'You remain responsible for reviewing your scheduled content, confirming publication results, maintaining backups of important material, and ensuring that your connected accounts remain in good standing and properly authorized.',
    ],
  },
  {
    title: '7. Fees and Paid Features',
    paragraphs: [
      'Some features of the Service may require payment now or in the future. If you purchase a paid plan or add-on, the applicable pricing, billing cadence, taxes, trial terms, and renewal conditions will be presented to you at the time of purchase and will become part of these Terms.',
      'We may suspend or limit access to paid features for overdue amounts, chargeback risk, or billing abuse, subject to applicable law.',
    ],
  },
  {
    title: '8. Intellectual Property and Feedback',
    paragraphs: [
      'The Service, including its software, design, branding, documentation, and all related intellectual property, is owned by us or our licensors and is protected by applicable law. Except for the limited rights expressly granted in these Terms, no rights are transferred to you.',
      'If you provide feedback, ideas, or suggestions about the Service, you grant us the right to use them without restriction or obligation to you.',
    ],
  },
  {
    title: '9. Suspension and Termination',
    paragraphs: [
      'We may suspend, restrict, or terminate your access to the Service, remove content, or disconnect integrations if we reasonably believe that you have breached these Terms, created legal or security risk, misused the Service, or exposed us or our providers to third-party enforcement action.',
      'You may stop using the Service at any time. Termination does not relieve either party of obligations that by their nature should survive termination, including payment obligations, intellectual property protections, disclaimers, limitations of liability, and dispute-related provisions.',
    ],
  },
  {
    title: '10. Disclaimers and Limitation of Liability',
    paragraphs: [
      'The Service is provided on an as is and as available basis to the maximum extent permitted by law. We do not warrant that the Service will be uninterrupted, error-free, secure, compatible with every third-party platform, or suitable for your particular needs.',
      'To the maximum extent permitted by law, we will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, revenues, goodwill, data, or business opportunities arising out of or related to your use of the Service.',
      'To the maximum extent permitted by law, our aggregate liability for claims arising out of or relating to the Service will not exceed the amounts you paid us for the Service during the twelve months preceding the event giving rise to the claim.',
    ],
  },
  {
    title: '11. Changes to the Service or These Terms',
    paragraphs: [
      'We may update the Service and these Terms from time to time to reflect product changes, legal requirements, security needs, or operational improvements. When we make material changes, we may provide notice by posting the updated Terms in the Service and revising the Last updated date.',
      'Your continued use of the Service after the effective date of updated Terms constitutes acceptance of the revised Terms.',
    ],
  },
  {
    title: '12. Contact',
    paragraphs: [
      'Questions about these Terms should be sent through the support or contact channel made available through the Service or our official website.',
    ],
  },
];

export default function Terms() {
  return (
    <PublicLegalLayout
      title="Terms of Service"
      description="Official terms governing access to and use of PostFlow Pro and its connected publishing features."
      lastUpdated={lastUpdated}
    >
      <section className="space-y-4 rounded-2xl border bg-muted/40 p-5">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Important</p>
        <p className="leading-7 text-muted-foreground">
          Please read these Terms carefully before using the Service. If you do not agree to
          these Terms, you must not use PostFlow Pro.
        </p>
      </section>

      <div className="space-y-8">
        {sections.map((section) => (
          <LegalSection key={section.title} section={section} />
        ))}
      </div>
    </PublicLegalLayout>
  );
}
