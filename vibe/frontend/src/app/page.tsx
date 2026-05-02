"use client";

import { useEffect } from "react";
import { 
  FileText, 
  TrendingUp, 
  Zap, 
  Calendar,
  ChevronRight,
  Sparkles,
  Lightbulb,
  AlertTriangle
} from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import Link from "next/link";
import { formatNumber, formatPercentage } from "@/lib/utils";

export default function DashboardPage() {
  const { 
    analytics, 
    setAnalytics,
    user,
    selectedNiche 
  } = useAppStore();

  // Mock data for demo
  useEffect(() => {
    // In production, fetch from API
    setAnalytics({
      total_posts: 47,
      published_posts: 32,
      scheduled_posts: 8,
      draft_posts: 7,
      avg_engagement_rate: 4.2,
      total_likes: 2847,
      total_comments: 423,
      total_shares: 156,
      total_impressions: 89420,
    });
  }, [setAnalytics]);

  const stats = [
    {
      name: "Total Posts",
      value: analytics?.total_posts || 0,
      icon: FileText,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      name: "Engagement Rate",
      value: formatPercentage(analytics?.avg_engagement_rate || 0),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      name: "Best Score",
      value: "87",
      icon: Zap,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      name: "Scheduled",
      value: analytics?.scheduled_posts || 0,
      icon: Calendar,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  const insights = [
    {
      type: "success",
      title: "Best performing hook",
      content: "Questions with '↓' CTA performing 3x better",
      icon: Lightbulb,
    },
    {
      type: "warning",
      title: "Worst performing topic",
      content: "Technical threads need more value props",
      icon: AlertTriangle,
    },
    {
      type: "tip",
      title: "Recommended",
      content: "Try 'hot takes' about your niche this week",
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s your marketing overview.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { 
              weekday: "long", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.name}
            className={`card-glow p-6 rounded-xl bg-card border border-border animate-fade-in animation-delay-${i}00`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Insights */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-white mb-4">Today&apos;s Insights</h2>
          <div className="space-y-4">
            {insights.map((insight, i) => (
              <div
                key={insight.title}
                className={`p-4 rounded-lg bg-secondary/50 flex items-start gap-4 animate-slide-in animation-delay-${i}00`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  insight.type === "success" ? "bg-emerald-500/10" :
                  insight.type === "warning" ? "bg-amber-500/10" :
                  "bg-violet-500/10"
                }`}>
                  <insight.icon className={`w-5 h-5 ${
                    insight.type === "success" ? "text-emerald-400" :
                    insight.type === "warning" ? "text-amber-400" :
                    "text-violet-400"
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-white">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{insight.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/studio"
              className="flex items-center justify-between p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
            >
              <span className="font-medium">Generate Posts</span>
              <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/scheduler"
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <span className="font-medium">Schedule Posts</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/analytics"
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <span className="font-medium">View Analytics</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Growth Chart (Placeholder) */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <h2 className="text-lg font-semibold text-white mb-4">Engagement Over Time</h2>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Connect your metrics to see the chart</p>
            <p className="text-sm mt-1">Manual metric entry coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
