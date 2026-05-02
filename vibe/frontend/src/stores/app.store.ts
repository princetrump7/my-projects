import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string | null;
  niche: string | null;
  tone_preference: string;
  platforms: string[];
  avatar_url: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  platform: string;
  status: string;
  idea: string | null;
  viral_score: number;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

export interface GeneratedPost {
  content: string;
  idea: string;
  viral_score: number;
}

export interface AnalyticsData {
  total_posts: number;
  published_posts: number;
  scheduled_posts: number;
  draft_posts: number;
  avg_engagement_rate: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_impressions: number;
}

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Posts state
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, data: Partial<Post>) => void;
  deletePost: (id: string) => void;
  
  // Generated posts
  generatedPosts: GeneratedPost[];
  setGeneratedPosts: (posts: GeneratedPost[]) => void;
  
  // Analytics state
  analytics: AnalyticsData | null;
  setAnalytics: (data: AnalyticsData) => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Selected niche, tone, platform
  selectedNiche: string;
  setSelectedNiche: (niche: string) => void;
  selectedTone: string;
  setSelectedTone: (tone: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (platform: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  
  // Posts state
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  updatePost: (id, data) => set((state) => ({
    posts: state.posts.map((p) => (p.id === id ? { ...p, ...data } : p)),
  })),
  deletePost: (id) => set((state) => ({
    posts: state.posts.filter((p) => p.id !== id),
  })),
  
  // Generated posts
  generatedPosts: [],
  setGeneratedPosts: (posts) => set({ generatedPosts: posts }),
  
  // Analytics state
  analytics: null,
  setAnalytics: (data) => set({ analytics: data }),
  
  // UI state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  // Selected niche, tone, platform
  selectedNiche: "saas",
  setSelectedNiche: (niche) => set({ selectedNiche: niche }),
  selectedTone: "professional",
  setSelectedTone: (tone) => set({ selectedTone: tone }),
  selectedPlatform: "twitter",
  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
}));
