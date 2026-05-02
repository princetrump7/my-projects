"use client";

import { useState } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  Save, 
  Calendar,
  Copy,
  Check,
  Zap,
  Twitter,
  Linkedin
} from "lucide-react";
import { useAppStore, GeneratedPost } from "@/stores/app.store";
import { cn } from "@/lib/utils";

const niches = [
  { value: "saas", label: "SaaS" },
  { value: "fitness", label: "Fitness" },
  { value: "crypto", label: "Crypto" },
  { value: "marketing", label: "Marketing" },
  { value: "tech", label: "Tech" },
];

const tones = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "funny", label: "Funny" },
  { value: "educational", label: "Educational" },
];

const platforms = [
  { value: "twitter", label: "X (Twitter)", icon: Twitter },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
];

export default function StudioPage() {
  const { 
    selectedNiche, 
    setSelectedNiche, 
    selectedTone, 
    setSelectedTone,
    selectedPlatform,
    setSelectedPlatform,
    generatedPosts,
    setGeneratedPosts,
    isLoading,
    setIsLoading,
  } = useAppStore();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Mock generation function
  const generateContent = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock generated posts
    const mockPosts: GeneratedPost[] = [
      {
        content: "Stop building features. Start solving problems. Here's what actually matters in SaaS: user outcomes, not code. 👇",
        idea: "product-led growth",
        viral_score: 87,
      },
      {
        content: "Hot take: Your freemium model is bleeding you dry. Most SaaS companies offer too much for free. Here's the fix:",
        idea: "free trials",
        viral_score: 82,
      },
      {
        content: "Question: Is your churn reduction strategy working? The best founders I know do this one thing differently... They obsess over the first 7 days.",
        idea: "churn reduction",
        viral_score: 79,
      },
      {
        content: "5 lessons from building a pricing page that hit $100K MRR:\n1. Show value, not features\n2. Social proof = trust\n3. Anchor pricing works\n4. Annual = growth\n5. Test relentlessly",
        idea: "pricing strategy",
        viral_score: 75,
      },
      {
        content: "Nobody talks about onboarding flows, but it's the key to retention. Here's the framework that saved us 20% churn:",
        idea: "onboarding flows",
        viral_score: 71,
      },
    ];
    
    setGeneratedPosts(mockPosts);
    setIsLoading(false);
  };

  const copyToClipboard = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 bg-amber-500/10";
    return "text-red-400 bg-red-500/10";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Studio</h1>
          <p className="text-muted-foreground mt-1">
            Generate AI-powered marketing content
          </p>
        </div>
        <button
          onClick={generateContent}
          disabled={isLoading}
          className="gradient-button px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" />
          {isLoading ? "Generating..." : "Generate Posts"}
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Niche */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <label className="text-sm font-medium text-white mb-3 block">Niche</label>
            <div className="space-y-2">
              {niches.map((niche) => (
                <button
                  key={niche.value}
                  onClick={() => setSelectedNiche(niche.value)}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg text-sm text-left transition-all",
                    selectedNiche === niche.value
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/50 text-muted-foreground hover:text-white"
                  )}
                >
                  {niche.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <label className="text-sm font-medium text-white mb-3 block">Tone</label>
            <div className="space-y-2">
              {tones.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => setSelectedTone(tone.value)}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg text-sm text-left transition-all",
                    selectedTone === tone.value
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/50 text-muted-foreground hover:text-white"
                  )}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <label className="text-sm font-medium text-white mb-3 block">Platform</label>
            <div className="space-y-2">
              {platforms.map((platform) => (
                <button
                  key={platform.value}
                  onClick={() => setSelectedPlatform(platform.value)}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all",
                    selectedPlatform === platform.value
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/50 text-muted-foreground hover:text-white"
                  )}
                >
                  <platform.icon className="w-4 h-4" />
                  {platform.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generated Posts */}
        <div className="lg:col-span-3 space-y-4">
          {generatedPosts.length === 0 ? (
            <div className="p-12 rounded-xl bg-card border border-border text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-white mb-2">No content yet</h3>
              <p className="text-muted-foreground">
                Select your niche and tone, then hit "Generate Posts"
              </p>
            </div>
          ) : (
            generatedPosts.map((post, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-card border border-border animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1",
                      getScoreColor(post.viral_score)
                    )}>
                      <Zap className="w-3 h-3" />
                      {post.viral_score}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.idea}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(post.content, index)}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <Save className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <p className="text-white whitespace-pre-wrap">{post.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
