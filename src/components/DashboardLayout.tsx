import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Bell, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              {profile && (
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {profile.displayName}
                </span>
              )}
              <Button
                size="sm"
                onClick={() => navigate('/compose')}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                New Post
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
