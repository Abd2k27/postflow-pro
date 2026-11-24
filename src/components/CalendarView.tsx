import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlatformIcons } from '@/components/PlatformIcon';
import { Post, PLATFORM_CONFIG } from '@/types/post';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface CalendarViewProps {
  posts: Post[];
}

export function CalendarView({ posts }: CalendarViewProps) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [startDate, endDate]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getPostsForDay = (day: Date) => {
    return posts.filter(post => {
      if (!post.scheduledAt) return false;
      return isSameDay(parseISO(post.scheduledAt), day);
    });
  };

  const getStatusColor = (status: Post['status']) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'scheduled': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'failed': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'publishing': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <p className="text-xs text-muted-foreground">
              {posts.filter(p => p.status === 'scheduled').length} posts programmés ce mois
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="hidden sm:flex">
            Aujourd'hui
          </Button>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-none border-r">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden border-border/50 shadow-md">
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,_1fr)] divide-x divide-y border-l border-t">
          {calendarDays.map((day, idx) => {
            const dayPosts = getPostsForDay(day);
            const isDayInMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);

            return (
              <div
                key={idx}
                className={cn(
                  "relative p-2 transition-colors hover:bg-accent/50 group",
                  !isDayInMonth && "bg-muted/20 opacity-50",
                  isTodayDay && "bg-primary/[0.02]"
                )}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "flex h-7 w-7 items-center justify-center text-sm font-medium rounded-full transition-all",
                    isTodayDay ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground group-hover:text-foreground",
                    !isDayInMonth && "text-muted-foreground/30"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Posts List */}
                <div className="space-y-1 overflow-y-auto max-h-[100px] scrollbar-hide">
                  {dayPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => navigate(`/posts/${post.id}`)}
                      className={cn(
                        "w-full text-left p-1.5 rounded border text-[10px] font-medium truncate flex items-center gap-1.5 transition-transform active:scale-95 hover:shadow-sm",
                        getStatusColor(post.status)
                      )}
                    >
                      <div className="flex -space-x-1 shrink-0">
                        {post.platformPosts.map((pp, i) => {
                          const Icon = PlatformIcons[pp.platform];
                          return (
                            <div 
                              key={i} 
                              className="h-3.5 w-3.5 rounded-full bg-background border border-current flex items-center justify-center p-[1px]"
                              title={PLATFORM_CONFIG[pp.platform].label}
                            >
                              <Icon className="h-full w-full" />
                            </div>
                          );
                        })}
                      </div>
                      <span className="truncate flex-1">{post.caption}</span>
                      {post.scheduledAt && (
                        <span className="text-[8px] opacity-70 shrink-0">
                          {format(parseISO(post.scheduledAt), 'HH:mm')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
