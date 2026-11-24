import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlatformIcons } from '@/components/PlatformIcon';
import { PLATFORM_CONFIG, Platform } from '@/types/post';
import { useCompleteOnboarding } from '@/hooks/useProfile';
import { toast } from 'sonner';
import {
  Layers,
  ArrowRight,
  Check,
  Shield,
  Loader2,
  Rocket,
  Sparkles,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAccounts } from '@/hooks/useAccounts';
import { useOAuthErrorToast } from '@/hooks/useOAuthErrorToast';

const STEPS = ['welcome', 'connect', 'complete'] as const;
type Step = (typeof STEPS)[number];

export default function Onboarding() {
  useOAuthErrorToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const completeMutation = useCompleteOnboarding();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const step = STEPS[currentStep];

  // Initialize step based on URL or accounts status
  useEffect(() => {
    if (accountsLoading || initialized) return;

    const stepParam = searchParams.get('step') as Step | null;
    if (stepParam && STEPS.includes(stepParam)) {
      setCurrentStep(STEPS.indexOf(stepParam));
    } else if (accounts && accounts.length > 0) {
      // If user has accounts but no step param, skip welcome
      setCurrentStep(1);
    }
    setInitialized(true);
  }, [accounts, accountsLoading, initialized, searchParams]);

  // Sync step to URL
  useEffect(() => {
    if (initialized) {
      setSearchParams({ step: STEPS[currentStep] }, { replace: true });
    }
  }, [currentStep, initialized, setSearchParams]);

  const handleNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleConnect = async (platform: Platform) => {
    try {
      const { data, error } = await supabase.functions.invoke(`connect-${platform}`, {
        body: { redirect_path: '/onboarding?step=connect' }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error(`Could not connect to ${PLATFORM_CONFIG[platform].label}`);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await completeMutation.mutateAsync();
      // Ensure the profile query is invalidated and refetched before navigating
      toast.success("Setup complete!");
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err: any) {
      toast.error("Could not complete setup: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (accountsLoading && !initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">PostFlow Pro</span>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-24 pt-8">
        {/* ─── Welcome Step ───────────────────────────────── */}
        {step === 'welcome' && (
          <div className="space-y-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome to PostFlow Pro!
              </h1>
              <p className="mx-auto max-w-md text-lg text-muted-foreground">
                The all-in-one platform to manage, schedule and publish your social media content.
              </p>
            </div>

            <Card className="mx-auto max-w-lg border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Automatic Publishing</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Connect your accounts and schedule your posts in a few clicks. We take care of the rest.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Security & Privacy</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Access is secured through each platform's official OAuth login. We never see your passwords.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button size="lg" className="gap-2 px-8" onClick={handleNext}>
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Connect Step ───────────────────────────────── */}
        {step === 'connect' && (
          <div className="space-y-8 text-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Connect your accounts
              </h1>
              <p className="mx-auto max-w-md text-muted-foreground">
                Choose the platforms you want to use with PostFlow Pro.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(['facebook', 'instagram', 'twitter', 'tiktok', 'youtube'] as Platform[]).map((platform) => {
                const Icon = PlatformIcons[platform];
                const isConnected = accounts?.some((a) => a.platform === platform);
                return (
                  <Card key={platform} className={isConnected ? 'border-green-200 bg-green-50/50' : ''}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `hsl(var(--platform-${platform}) / 0.1)`,
                          color: `hsl(var(--platform-${platform}))`,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{PLATFORM_CONFIG[platform].label}</p>
                      </div>
                      {isConnected ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleConnect(platform)}>
                          Connect
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <Button size="lg" className="gap-2 px-8" onClick={handleNext}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Complete Step ──────────────────────────────── */}
        {step === 'complete' && (
          <div className="space-y-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/10">
              <Rocket className="h-10 w-10 text-green-600" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">
                You're all set!
              </h1>
              <p className="mx-auto max-w-md text-muted-foreground">
                Your account is ready. You can now start creating and scheduling your content.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <Button
                size="lg"
                className="gap-2 px-8"
                onClick={handleComplete}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                Go to dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
