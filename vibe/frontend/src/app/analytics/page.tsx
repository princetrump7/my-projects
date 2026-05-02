"use client";

import { useEffect } from "react";
import { 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye,
  BarChart3,
  PieChart,
  Twitter,
  Linkedin
} from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { formatNumber, formatPercentage } from "@/lib/utils";

export default function AnalyticsPage() {
  const { analytics, setAnalytics } = useAppStore();

  useEffect(() => {
    // Mock data
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

  const metrics = [
    {
      name: "Total Impressions",
      value: formatNumber(analytics?.total_impressions || 0),
      icon: Eye,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      name: "Total Likes",
      value: formatNumber(analytics?.total_likes || 0),
      icon: Heart,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      name: "Total Comments",
      value: formatNumber(analytics?.total_comments || 0),
      icon: MessageCircle,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      name: "Total Shares",
      value: formatNumber(analytics?.total_shares || 0),
      icon: Share2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  const topPosts = [
    {
      id: "1",
      content: "Stop building features. Start solving problems...",
      platform: "twitter",
      likes: 234,
      comments: 45,
      shares: 23,
      engagement: 4.8,
    },
    {
      id: "2",
      content: "Hot take: Your freemium model is bleeding you dry...",
      platform: "twitter",
      likes: 189,
      comments: 67,
      shares: 34,
      engagement: 5.2,
    },
    {
      id: "3",
      content: "5 lessons from building a pricing page...",
      platform: "linkedin",
      likes: 456,
      comments: 89,
      shares: 67,
      engagement: 6.1,
    },
  ];

  const platformDistribution = [
    { name: "Twitter", value: 65, color: "#1DA1F2" },
    { name: "LinkedIn", value: 35, color: "#0A66C2" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your content performance
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <div
            key={metric.name}
            className={`p-6 rounded-xl bg-card border border-border animate-fade-in animation-delay-${i}00`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{metric.name}</p>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${metric.bg} flex items-center justify-center`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Over Time */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-white mb-4">Engagement Over Time</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Connect your metrics to see trends</p>
            </div>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-white mb-4">Platform Distribution</h2>
          <div className="space-y-4">
            {platformDistribution.map((platform) => (
              <div key={platform.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="text-sm text-muted-foreground">{platform.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${platform.value}%`,
                        backgroundColor: platform.color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{platform.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <h2 className="text-lg font-semibold text-white mb-4">Top Performing Posts</h2>
        <div className="space-y-4">
          {topPosts.map((post, i) => (
            <div
              key={post.id}
              className="p-4 rounded-lg bg-secondary/50 flex items-center justify-between animate-slide-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {post.platform === "twitter" ? (
                    <Twitter className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Linkedin className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-xs text-muted-foreground capitalize">
                    {post.platform}
                  </span>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {post.engagement}% eng
                  </span>
                </div>
                <p className="text-sm text-white truncate">{post.content}</p>
              </div>
              <div className="flex items-center gap-4 ml-4 text-sm">
                <div className="flex items-center gap-1 text-pink-400">
                  <Heart className="w-4 h-4" />
                  <span>{post.likes}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Share2 className="w-4 h-4" />
                  <span>{post.shares}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
