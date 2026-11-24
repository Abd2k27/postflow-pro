import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Layers, 
  CheckCircle2, 
  Send, 
  ShieldCheck, 
  Zap, 
  LayoutDashboard, 
  Image as ImageIcon,
  Share2,
  Lock,
  ArrowRight,
  Globe,
  BarChart3,
  Users,
  Check
} from 'lucide-react';
import { useEffect } from 'react';

export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-background border shadow-sm">
              <img src="/Postflow_Pro.png" alt="PostFlow Pro Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight">PostFlow Pro</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium transition-colors hover:text-primary">Features</a>
            <a href="#tiktok" className="text-sm font-medium transition-colors hover:text-primary">TikTok Integration</a>
            <a href="#pricing" className="text-sm font-medium transition-colors hover:text-primary">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-sm font-medium">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="text-sm font-medium">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container relative overflow-hidden py-24 text-center md:py-32">
          {/* Decorative elements */}
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />
          
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium">
              <span className="mr-2 flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Now supporting TikTok Video Publishing
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-7xl">
              One Platform. <br />
              <span className="text-primary">Every Social Network.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              PostFlow Pro is the ultimate command center for creators. Schedule, manage, and publish high-impact content to TikTok, Instagram, YouTube, and more—all from a single, intuitive interface.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="h-12 px-8 text-lg font-semibold shadow-lg shadow-primary/20">
                  Start Publishing for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg font-semibold">
                  Explore Features
                </Button>
              </Link>
            </div>
            <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-50 grayscale">
              {/* Replace with actual platform logos if available */}
              <div className="flex items-center gap-2 font-bold text-xl"><Globe className="h-6 w-6" /> Multi-Platform</div>
              <div className="flex items-center gap-2 font-bold text-xl">TikTok</div>
              <div className="flex items-center gap-2 font-bold text-xl">Instagram</div>
              <div className="flex items-center gap-2 font-bold text-xl">YouTube</div>
              <div className="flex items-center gap-2 font-bold text-xl">X (Twitter)</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/30 py-24 md:py-32">
          <div className="container">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Built for Growth</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                We've built the tools you need to stay ahead of the curve and keep your audience engaged across every channel.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Unified Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Get a bird's-eye view of your entire social presence. Track performance, manage connections, and stay organized without switching tabs.
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Zap className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Smart Scheduling</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Post when your audience is most active. Our intelligent scheduling engine handles time zones and peak engagement windows automatically.
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Digital Asset Library</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Centralize your media. Upload videos and images once, then reuse them across multiple platforms with platform-specific optimizations.
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Advanced Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Understand what works. Dive deep into engagement metrics across all your profiles and refine your content strategy with data.
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Audience Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Know your followers. Gain valuable insights into audience demographics and behavior to create content that truly resonates.
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your accounts are safe with us. We use official APIs and industry-standard encryption to ensure your data and access remain secure.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* TikTok Integration Section */}
        <section id="tiktok" className="py-24 md:py-32">
          <div className="container">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div className="order-2 lg:order-1">
                <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  Official TikTok Integration
                </div>
                <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Amplify Your Reach on TikTok</h2>
                <p className="mb-8 text-lg text-muted-foreground">
                  PostFlow Pro is a verified TikTok partner, providing deep integration through the TikTok Login Kit and Share Kit to make your publishing workflow seamless.
                </p>
                
                <div className="space-y-8">
                  <div className="flex gap-5">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 shadow-sm">
                      <Lock className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-xl font-bold">TikTok Login Kit</h3>
                      <p className="text-muted-foreground">
                        Connect your TikTok profiles in seconds. Our secure authentication process uses TikTok's official Login Kit, ensuring we never handle your passwords while giving you full control over permissions.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 shadow-sm">
                      <Share2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-xl font-bold">TikTok Share Kit</h3>
                      <p className="text-muted-foreground">
                        Direct video publishing made easy. Use the Share Kit to upload your videos directly to TikTok from our media library. We handle the technical requirements so you can focus on creativity.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 shadow-sm">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-xl font-bold">Automated Workflows</h3>
                      <p className="text-muted-foreground">
                        Schedule your TikTok content for the exact moment your audience is online. Our background processors ensure your videos are delivered reliably, every time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative mx-auto max-w-[500px]">
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/20 to-secondary/20 blur-2xl" />
                  <div className="relative aspect-[9/16] overflow-hidden rounded-3xl border-8 border-muted bg-background shadow-2xl">
                     <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-muted to-background">
                        <div className="mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-background border shadow-xl">
                          <img src="/Postflow_Pro.png" alt="PostFlow Pro Logo" className="h-full w-full object-cover" />
                        </div>
                        <h4 className="text-2xl font-bold">PostFlow Pro</h4>
                        <p className="text-sm text-muted-foreground italic">Publishing to TikTok...</p>
                        
                        <div className="mt-12 w-full px-8 space-y-4">
                           <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full w-3/4 bg-primary rounded-full animate-pulse" />
                           </div>
                           <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Uploading Video</span>
                              <span>75%</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-muted/30 py-24 md:py-32">
          <div className="container">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Simple, Transparent Pricing</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Choose the plan that fits your needs. No hidden fees, cancel anytime.
              </p>
            </div>
            
            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              {/* Free Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Starter</CardTitle>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground italic">Perfect for new creators</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 2 Social Accounts</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 10 Posts per month</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Basic Analytics</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><Check className="h-4 w-4" /> Standard Support</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/signup" className="w-full">
                    <Button variant="outline" className="w-full">Get Started</Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Pro Plan */}
              <Card className="relative flex flex-col border-primary shadow-2xl scale-105">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  MOST POPULAR
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Pro</CardTitle>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground italic">For serious growth</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 font-medium"><Check className="h-4 w-4 text-primary" /> 10 Social Accounts</li>
                    <li className="flex items-center gap-2 font-medium"><Check className="h-4 w-4 text-primary" /> Unlimited Posts</li>
                    <li className="flex items-center gap-2 font-medium"><Check className="h-4 w-4 text-primary" /> Advanced Analytics</li>
                    <li className="flex items-center gap-2 font-medium"><Check className="h-4 w-4 text-primary" /> Priority Support</li>
                    <li className="flex items-center gap-2 font-medium"><Check className="h-4 w-4 text-primary" /> Custom Scheduling</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/signup" className="w-full">
                    <Button className="w-full">Go Pro</Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Enterprise Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Agency</CardTitle>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$99</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground italic">For teams and agencies</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 50 Social Accounts</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited Everything</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Team Collaboration</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> White-label Reports</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Dedicated Manager</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/signup" className="w-full">
                    <Button variant="outline" className="w-full">Contact Sales</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-primary py-24 text-primary-foreground md:py-32">
          {/* Decorative elements */}
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-black/10 blur-3xl" />

          <div className="container relative z-10 text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Ready to Simplify Your Social Workflow?</h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-primary-foreground/80">
              Join thousands of creators who use PostFlow Pro to save time and grow their audience. Start your free trial today.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-lg font-bold">
                  Get Started for Free
                </Button>
              </Link>
              <a href="mailto:hello@postflow-pro.com">
                <Button size="lg" variant="ghost" className="h-12 px-8 text-lg font-bold text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                  Contact Support
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 md:py-20">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-background border shadow-sm">
                  <img src="/Postflow_Pro.png" alt="PostFlow Pro Logo" className="h-full w-full object-cover" />
                </div>
                <span className="text-xl font-bold tracking-tight">PostFlow Pro</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The all-in-one social media publishing platform for modern creators and growth-focused businesses.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#tiktok" className="hover:text-primary transition-colors">TikTok Integration</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><Link to="/signup" className="hover:text-primary transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><a href="mailto:hello@postflow-pro.com" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/data-deletion" className="hover:text-primary transition-colors">Data Deletion</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">GDPR Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 border-t pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-muted-foreground">
              © 2026 PostFlow Pro. All rights reserved. TikTok is a trademark of ByteDance Ltd.
            </p>
            <div className="flex gap-6 grayscale opacity-50">
               {/* Placeholder for social media links */}
               <div className="h-5 w-5 bg-muted-foreground rounded-full" />
               <div className="h-5 w-5 bg-muted-foreground rounded-full" />
               <div className="h-5 w-5 bg-muted-foreground rounded-full" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
