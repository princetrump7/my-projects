from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    niche: Optional[str] = None
    tone_preference: Optional[str] = None
    platforms: Optional[List[str]] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    niche: Optional[str] = None
    tone_preference: str = "professional"
    platforms: List[str] = ["twitter"]
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[UUID] = None


# Post Schemas
class PostBase(BaseModel):
    content: str
    platform: str = "twitter"


class PostCreate(PostBase):
    idea: Optional[str] = None


class PostUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class PostResponse(PostBase):
    id: UUID
    user_id: UUID
    status: str = "draft"
    idea: Optional[str] = None
    viral_score: float = 0.0
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Content Generation Schemas
class ContentGenerationRequest(BaseModel):
    niche: str
    tone: str = "professional"
    platform: str = "twitter"
    count: int = Field(default=5, ge=1, le=10)
    topic: Optional[str] = None


class GeneratedPost(BaseModel):
    content: str
    idea: str
    viral_score: float = 0.0


class ContentGenerationResponse(BaseModel):
    posts: List[GeneratedPost]
    topic: str


# Metric Schemas
class MetricBase(BaseModel):
    likes: int = 0
    comments: int = 0
    shares: int = 0
    impressions: int = 0
    engagement_rate: float = 0.0


class MetricCreate(MetricBase):
    post_id: UUID


class MetricResponse(MetricBase):
    id: UUID
    post_id: UUID
    recorded_at: datetime
    
    class Config:
        from_attributes = True


# Insight Schemas
class InsightBase(BaseModel):
    best_topics: List[str] = []
    best_hooks: List[str] = []
    recommended_types: List[str] = []
    improvement_suggestions: Optional[str] = None


class InsightResponse(InsightBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# Analytics Schemas
class AnalyticsOverview(BaseModel):
    total_posts: int
    published_posts: int
    scheduled_posts: int
    draft_posts: int
    avg_engagement_rate: float
    total_likes: int
    total_comments: int
    total_shares: int
    total_impressions: int


class EngagementDataPoint(BaseModel):
    date: str
    likes: int
    comments: int
    shares: int
    impressions: int
    engagement_rate: float


class EngagementResponse(BaseModel):
    data: List[EngagementDataPoint]


# Scheduler Schemas
class ScheduleRequest(BaseModel):
    post_id: UUID
    scheduled_at: datetime


class RescheduleRequest(BaseModel):
    post_id: UUID
    new_scheduled_at: datetime
