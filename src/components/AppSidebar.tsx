import {
  LayoutDashboard,
  PenSquare,
  History,
  Link2,
  Image,
  Settings,
  Layers,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useProfile } from '@/hooks/useProfile';
import { useStats } from '@/hooks/useStats';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Create Post', url: '/compose', icon: PenSquare },
  { title: 'Post History', url: '/history', icon: History },
  { title: 'Connected Accounts', url: '/accounts', icon: Link2 },
  { title: 'Media Library', url: '/media', icon: Image },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { data: profile } = useProfile();
  const { data: stats } = useStats();

  const plan = profile?.plan ?? 'free';
  const postLimit = profile?.postLimit ?? 10;
  const totalPosts = stats?.totalPosts ?? 0;
  const pct = postLimit > 0 ? Math.min((totalPosts / postLimit) * 100, 100) : 0;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background border shadow-sm">
            <img src="/Postflow_Pro.png" alt="PostFlow Pro Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-accent-foreground">
              PostFlow Pro
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="rounded-lg bg-sidebar-accent p-3">
            <p className="text-xs text-sidebar-foreground">
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan · {totalPosts}/{postLimit} posts
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-sidebar-border">
              <div
                className="h-full rounded-full bg-sidebar-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
