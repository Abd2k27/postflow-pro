import { LegalSection, type LegalSectionContent, PublicLegalLayout } from '@/components/PublicLegalLayout';

const lastUpdated = 'March 15, 2026';

const sections: LegalSectionContent[] = [
  {
    title: '1. Scope of This Policy',
    paragraphs: [
      'This Privacy Policy explains how PostFlow Pro collects, uses, stores, shares, and protects personal information when you access or use our website, application, integrations, and related services.',
      'This Policy applies to information we collect directly from you, automatically through your use of the Service, and from third-party platforms or providers that you choose to connect.',
    ],
  },
  {
    title: '2. Information We Collect',
    paragraphs: [
      'We collect information necessary to operate the Service, authenticate users, connect third-party accounts, schedule content, secure the platform, and comply with law.',
    ],
    items: [
      'Account and profile data, such as your name, email address, login identifiers, authentication metadata, and account preferences.',
      'Connected account data, such as social platform identifiers, usernames, page or channel metadata, access tokens, refresh tokens, and permission scopes granted to the Service.',
      'Content and media data, such as drafts, captions, publishing instructions, uploads, scheduling choices, and media assets you submit through the Service.',
      'Usage, device, and diagnostic data, such as IP address, browser type, operating system, timestamps, referral information, error logs, and feature interaction events.',
      'Cookie and local storage data used for session management, remembering preferences, security checks, and maintaining basic product functionality.',
    ],
  },
  {
    title: '3. How We Use Personal Information',
    paragraphs: [
      'We use personal information to provide, maintain, secure, and improve the Service, including creating and managing accounts, connecting social profiles, storing drafts, scheduling and publishing content, troubleshooting issues, preventing abuse, and sending transactional communications.',
      'We may also use information to monitor platform performance, develop new features, enforce our terms and policies, respond to legal requests, and protect our rights, users, service providers, and the public.',
    ],
  },
  {
    title: '4. Legal Bases for Processing',
    paragraphs: [
      'Depending on your location, we process personal information on one or more of the following legal bases: performance of a contract with you, our legitimate interests in operating and securing the Service, compliance with legal obligations, and your consent where consent is required.',
      'When consent is the legal basis, you may withdraw it at any time, although doing so will not affect prior lawful processing.',
    ],
  },
  {
    title: '5. How We Share Information',
    paragraphs: [
      'We do not sell personal information. We share personal information only as reasonably necessary to operate the Service, fulfill your instructions, or comply with law.',
    ],
    items: [
      'Service providers that support hosting, authentication, storage, infrastructure, customer support, security, and other operational functions.',
      'Third-party social networks and APIs that you explicitly connect, solely to carry out the actions you request through the Service.',
      'Professional advisors, auditors, regulators, law enforcement, or courts when disclosure is necessary to comply with legal obligations or protect rights and safety.',
      'A successor entity in connection with a merger, acquisition, financing, reorganization, or sale of all or part of our business, subject to appropriate confidentiality and legal safeguards.',
    ],
  },
  {
    title: '6. Data Retention',
    paragraphs: [
      'We retain personal information for as long as reasonably necessary to provide the Service, maintain account functionality, satisfy legal, accounting, security, and compliance obligations, resolve disputes, and enforce agreements.',
      'Retention periods vary depending on the type of information, your account status, legal requirements, and whether data remains necessary for operational or security purposes. Connected platform tokens are retained until they expire, are revoked, or you disconnect the related integration.',
    ],
  },
  {
    title: '7. Security',
    paragraphs: [
      'We implement administrative, technical, and organizational measures designed to protect personal information against unauthorized access, loss, misuse, or alteration. These measures include access controls, credential protections, and secure service-provider infrastructure.',
      'No method of transmission over the internet or method of electronic storage is completely secure, so we cannot guarantee absolute security.',
    ],
  },
  {
    title: '8. International Data Transfers',
    paragraphs: [
      'Your information may be processed in countries other than the one in which you live. Where required, we take steps designed to provide appropriate safeguards for cross-border transfers, including contractual or technical protections.',
    ],
  },
  {
    title: '9. Your Rights and Choices',
    paragraphs: [
      'Depending on your location, you may have rights to access, correct, delete, export, or restrict the processing of your personal information, to object to certain processing, and to withdraw consent where processing is based on consent.',
      'You may also disconnect linked social accounts, update profile information, or delete your account and all associated data at any time from Settings. Step-by-step instructions are available on our User Data Deletion page at /data-deletion. You may have the right to lodge a complaint with your local data protection authority.',
    ],
  },
  {
    title: '10. Children\'s Privacy',
    paragraphs: [
      'The Service is not directed to children, and we do not knowingly collect personal information from anyone below the minimum age required to use the Service in their jurisdiction. If we learn that we have collected such information without appropriate authorization, we will take steps to delete it.',
    ],
  },
  {
    title: '11. TikTok Integration',
    paragraphs: [
      'PostFlow Pro uses TikTok\'s official APIs (Login Kit and Share Kit) to provide integration features. Your use of TikTok through our Service is subject to TikTok\'s Terms of Service and Privacy Policy.',
      'We access your TikTok basic profile information (username, avatar) to personalize your experience and your "video.publish" permission to enable direct video uploading. You can revoke our access to your TikTok account at any time through your TikTok settings or by disconnecting your account within PostFlow Pro.',
    ],
  },
  {
    title: '12. Changes to This Privacy Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time to reflect changes in the Service, our data practices, or legal requirements. When we do, we will post the revised version and update the Last updated date.',
      'Your continued use of the Service after the effective date of an updated Privacy Policy is subject to the revised Policy.',
    ],
  },
  {
    title: '13. Contact',
    paragraphs: [
      'If you have questions, requests, or concerns about this Privacy Policy or our privacy practices, please contact us through the support or contact channel made available through the Service or our official website.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <PublicLegalLayout
      title="Privacy Policy"
      description="Official privacy policy describing how PostFlow Pro handles account data, connected social profiles, content, and usage information."
      lastUpdated={lastUpdated}
    >
      <section className="space-y-4 rounded-2xl border bg-muted/40 p-5">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Privacy commitment</p>
        <p className="leading-7 text-muted-foreground">
          We use personal information only as needed to operate, secure, and improve the Service
          and to fulfill the publishing actions you request.
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
