import { LegalSection, type LegalSectionContent, PublicLegalLayout } from '@/components/PublicLegalLayout';
import { SUPPORT_EMAIL } from '@/lib/site';

const lastUpdated = 'November 24, 2026';

const sections: LegalSectionContent[] = [
  {
    title: '1. Delete your account and all your data',
    paragraphs: [
      'You can permanently delete your PostFlow Pro account and all associated data at any time, directly from the app:',
    ],
    items: [
      'Sign in to PostFlow Pro.',
      'Open Settings from the sidebar.',
      'In the "Danger Zone" section, click "Delete Account", then "Yes, delete my account".',
    ],
  },
  {
    title: '2. What is deleted',
    paragraphs: [
      'Deletion is immediate and cannot be undone. It removes:',
    ],
    items: [
      'Your PostFlow Pro account and profile.',
      'All connected social accounts (Facebook, Instagram, TikTok, YouTube, X), including the access and refresh tokens we stored for them.',
      'All your posts, drafts, schedules and publishing history.',
      'All media files (images and videos) you uploaded to PostFlow Pro.',
    ],
  },
  {
    title: '3. Content already published on social platforms',
    paragraphs: [
      'Posts that were already published to Facebook, Instagram, TikTok, YouTube or X belong to your accounts on those platforms and are not removed by deleting your PostFlow Pro account. You can delete them directly on each platform.',
    ],
  },
  {
    title: '4. Disconnect a single platform',
    paragraphs: [
      'To revoke access for one platform only, open Connected Accounts in PostFlow Pro and click "Disconnect". The stored tokens for that platform are deleted.',
      'You can also remove PostFlow Pro from the platform itself: on Facebook and Instagram, go to Settings & privacy > Settings > Apps and websites (or Business Integrations) and remove PostFlow Pro; on TikTok, go to Settings and privacy > Security > Apps and services and remove PostFlow Pro.',
    ],
  },
];

export default function DataDeletion() {
  return (
    <PublicLegalLayout
      title="User Data Deletion"
      description="How to delete your PostFlow Pro account and all data we store about you, including data received from Facebook, Instagram and TikTok."
      lastUpdated={lastUpdated}
    >
      <div className="space-y-8">
        {sections.map((section) => (
          <LegalSection key={section.title} section={section} />
        ))}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">5. Request deletion by email</h2>
          <p className="leading-7 text-muted-foreground">
            If you can no longer sign in, you can ask us to delete your data
            {SUPPORT_EMAIL ? (
              <>
                {' '}by emailing{' '}
                <a className="font-medium text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}?subject=Data%20deletion%20request`}>
                  {SUPPORT_EMAIL}
                </a>{' '}
                from the email address of your account.
              </>
            ) : (
              ' by contacting our support team from the email address of your account.'
            )}{' '}
            We process requests within 30 days and confirm by email once deletion is complete.
          </p>
        </section>
      </div>
    </PublicLegalLayout>
  );
}
