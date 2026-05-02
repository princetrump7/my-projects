"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock,
  Twitter,
  Linkedin,
  Edit,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock scheduled posts
const scheduledPosts = [
  {
    id: "1",
    content: "Stop building features. Start solving problems. Here's what actually matters...",
    platform: "twitter",
    scheduled_at: "2024-02-15T10:00:00",
    viral_score: 87,
  },
  {
    id: "2",
    content: "Hot take: Your freemium model is bleeding you dry...",
    platform: "twitter",
    scheduled_at: "2024-02-16T14:00:00",
    viral_score: 82,
  },
  {
    id: "3",
    content: "5 lessons from building a pricing page that hit $100K MRR...",
    platform: "linkedin",
    scheduled_at: "2024-02-18T09:00:00",
    viral_score: 75,
  },
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function SchedulerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getPostsForDay = (day: number) => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduled_at);
      return postDate.getDate() === day && 
        postDate.getMonth() === month && 
        postDate.getFullYear() === year;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Scheduler</h1>
          <p className="text-muted-foreground mt-1">
            Plan and schedule your content
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-white">
              {months[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const posts = getPostsForDay(day);
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "h-24 p-2 rounded-lg border transition-all cursor-pointer",
                    selectedDate === day
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-secondary/50",
                    posts.length > 0 && "bg-violet-500/5"
                  )}
                >
                  <span className="text-sm font-medium">{day}</span>
                  {posts.length > 0 && (
                    <div className="mt-1">
                      {posts.slice(0, 2).map(post => (
                        <div
                          key={post.id}
                          className={cn(
                            "text-xs truncate px-1 py-0.5 rounded mt-1",
                            post.platform === "twitter" 
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-blue-700/20 text-blue-300"
                          )}
                        >
                          {post.platform === "twitter" ? "🐦" : "📱"} {post.content.slice(0, 20)}...
                        </div>
                      ))}
                      {posts.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{posts.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scheduled Posts List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Scheduled Posts</h3>
          {scheduledPosts.length === 0 ? (
            <div className="p-8 rounded-xl bg-card border border-border text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No scheduled posts</p>
            </div>
          ) : (
            scheduledPosts.map(post => (
              <div
                key={post.id}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {post.platform === "twitter" ? (
                      <Twitter className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Linkedin className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-sm text-muted-foreground capitalize">
                      {post.platform}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 rounded hover:bg-secondary transition-colors">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-1 rounded hover:bg-secondary transition-colors">
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-white line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(post.scheduled_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
