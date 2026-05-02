"use client";

import { useState } from "react";
import { 
  User, 
  Mail, 
  Key, 
  Globe, 
  Palette,
  Twitter,
  Linkedin,
  Instagram,
  Save,
  CreditCard
} from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { cn } from "@/lib/utils";

const niches = [
  { value: "saas", label: "SaaS" },
  { value: "fitness", label: "Fitness" },
  { value: "crypto", label: "Crypto" },
  { value: "marketing", label: "Marketing" },
  { value: "tech", label: "Tech" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const tones = [
  { value: "professional", label: "Professional", description: "Clean, business-focused" },
  { value: "casual", label: "Casual", description: "Friendly and approachable" },
  { value: "funny", label: "Funny", description: "Witty and humorous" },
  { value: "educational", label: "Educational", description: " instructional and clear" },
];

const platforms = [
  { value: "twitter", label: "X (Twitter)", icon: Twitter },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "instagram", label: "Instagram", icon: Instagram, disabled: true },
];

export default function SettingsPage() {
  const { 
    selectedNiche, 
    setSelectedNiche, 
    selectedTone, 
    setSelectedTone,
    selectedPlatform,
    setSelectedPlatform,
  } = useAppStore();

  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Mock save
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Profile</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Preferences</h2>
        </div>
        
        {/* Niche */}
        <div className="mb-6">
          <label className="text-sm font-medium text-white mb-3 block">Niche</label>
          <div className="flex flex-wrap gap-2">
            {niches.map((niche) => (
              <button
                key={niche.value}
                onClick={() => setSelectedNiche(niche.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm transition-all",
                  selectedNiche === niche.value
                    ? "bg-primary text-white"
                    : "bg-secondary/50 text-muted-foreground hover:text-white"
                )}
              >
                {niche.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div className="mb-6">
          <label className="text-sm font-medium text-white mb-3 block">Tone</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tones.map((tone) => (
              <button
                key={tone.value}
                onClick={() => setSelectedTone(tone.value)}
                className={cn(
                  "p-4 rounded-lg text-left transition-all",
                  selectedTone === tone.value
                    ? "bg-primary/20 border border-primary"
                    : "bg-secondary/50 border border-transparent hover:border-border"
                )}
              >
                <p className="font-medium text-white">{tone.label}</p>
                <p className="text-sm text-muted-foreground">{tone.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Platforms */}
        <div>
          <label className="text-sm font-medium text-white mb-3 block">Platforms</label>
          <div className="space-y-2">
            {platforms.map((platform) => (
              <button
                key={platform.value}
                onClick={() => !platform.disabled && setSelectedPlatform(platform.value)}
                disabled={platform.disabled}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-lg transition-all",
                  selectedPlatform === platform.value
                    ? "bg-primary/20 border border-primary"
                    : "bg-secondary/50 border border-transparent hover:border-border",
                  platform.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  <platform.icon className="w-5 h-5" />
                  <span className="font-medium text-white">{platform.label}</span>
                </div>
                {platform.disabled && (
                  <span className="text-xs text-muted-foreground">Coming soon</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <Key className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">API Keys</h2>
        </div>
        
        <div>
          <label className="text-sm font-medium text-white mb-2 block">OpenAI API Key</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Required for AI content generation. Get your key from{" "}
            <a href="https://platform.openai.com" className="text-primary hover:underline">
              OpenAI Dashboard
            </a>
          </p>
        </div>
      </div>

      {/* Billing Section */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Billing</h2>
        </div>
        
        <div className="p-4 rounded-lg bg-gradient-to-r from-violet-600/20 to-pink-600/20 border border-violet-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Pro Plan</p>
              <p className="text-sm text-muted-foreground">Unlimited posts • Multi-platform • AI learning</p>
            </div>
            <span className="text-lg font-bold text-white">$29/mo</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="gradient-button px-6 py-3 rounded-lg font-medium flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
