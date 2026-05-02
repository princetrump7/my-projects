from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from uuid import UUID
from datetime import datetime, timedelta
from typing import Optional, List

from app.database import get_db, User, Post, Metric, Insight
from app.schemas import (
    AnalyticsOverview, EngagementResponse, 
    EngagementDataPoint, InsightResponse
)
from app.api.auth import get_current_user
from app.services.learning_engine import run_learning_loop

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
async def get_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get analytics overview for current user."""
    # Get total posts count
    total_result = await db.execute(
        select(func.count(Post.id)).where(Post.user_id == current_user.id)
    )
    total_posts = total_result.scalar() or 0
    
    # Get posts by status
    published_result = await db.execute(
        select(func.count(Post.id)).where(
            and_(Post.user_id == current_user.id, Post.status == "published")
        )
    )
    published_posts = published_result.scalar() or 0
    
    scheduled_result = await db.execute(
        select(func.count(Post.id)).where(
            and_(Post.user_id == current_user.id, Post.status == "scheduled")
        )
    )
    scheduled_posts = scheduled_result.scalar() or 0
    
    draft_posts = total_posts - published_posts - scheduled_posts
    
    # Get metrics sums
    metrics_result = await db.execute(
        select(
            func.coalesce(func.sum(Metric.likes), 0),
            func.coalesce(func.sum(Metric.comments), 0),
            func.coalesce(func.sum(Metric.shares), 0),
            func.coalesce(func.sum(Metric.impressions), 0),
            func.coalesce(func.avg(Metric.engagement_rate), 0)
        )
        .join(Post, Metric.post_id == Post.id)
        .where(Post.user_id == current_user.id)
    )
    metrics_row = metrics_result.one()
    
    total_likes = metrics_row[0]
    total_comments = metrics_row[1]
    total_shares = metrics_row[2]
    total_impressions = metrics_row[3]
    avg_engagement = float(metrics_row[4]) if metrics_row[4] else 0.0
    
    return AnalyticsOverview(
        total_posts=total_posts,
        published_posts=published_posts,
        scheduled_posts=scheduled_posts,
        draft_posts=draft_posts,
        avg_engagement_rate=round(avg_engagement, 2),
        total_likes=total_likes,
        total_comments=total_comments,
        total_shares=total_shares,
        total_impressions=total_impressions,
    )


@router.get("/engagement", response_model=EngagementResponse)
async def get_engagement(
    days: int = 30,
    platform: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get engagement data over time."""
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Query metrics with posts
    query = select(
        Metric,
        Post
    ).join(Post, Metric.post_id == Post.id).where(
        and_(
            Post.user_id == current_user.id,
            Metric.recorded_at >= start_date
        )
    )
    
    if platform:
        query = query.where(Post.platform == platform)
    
    result = await db.execute(query.order_by(Metric.recorded_at))
    rows = result.all()
    
    # Group by date
    daily_data = {}
    for metric, post in rows:
        date_key = metric.recorded_at.strftime("%Y-%m-%d")
        if date_key not in daily_data:
            daily_data[date_key] = {
                "likes": 0,
                "comments": 0,
                "shares": 0,
                "impressions": 0,
                "engagement_rate": 0.0,
                "count": 0
            }
        
        daily_data[date_key]["likes"] += metric.likes
        daily_data[date_key]["comments"] += metric.comments
        daily_data[date_key]["shares"] += metric.shares
        daily_data[date_key]["impressions"] += metric.impressions
        daily_data[date_key]["count"] += 1
    
    # Calculate engagement rates and format
    data_points = []
    for date_key, data in daily_data.items():
        if data["impressions"] > 0:
            engagement_rate = (
                (data["likes"] + data["comments"] + data["shares"]) 
                / data["impressions"] * 100
            )
        else:
            engagement_rate = 0.0
        
        data_points.append(EngagementDataPoint(
            date=date_key,
            likes=data["likes"],
            comments=data["comments"],
            shares=data["shares"],
            impressions=data["impressions"],
            engagement_rate=round(engagement_rate, 2)
        ))
    
    # Sort by date
    data_points.sort(key=lambda x: x.date)
    
    return EngagementResponse(data=data_points)


@router.get("/insights", response_model=InsightResponse)
async def get_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-generated insights for user."""
    # Get or create insights
    result = await db.execute(
        select(Insight).where(Insight.user_id == current_user.id)
    )
    insight = result.scalar_one_or_none()
    
    if not insight:
        # Run learning loop to generate insights
        insights_data = await run_learning_loop(db, current_user.id)
        
        return InsightResponse(
            id=insights_data.get("id", UUID(int=0)),
            user_id=current_user.id,
            best_topics=insights_data.get("best_topics", []),
            best_hooks=insights_data.get("best_hooks", []),
            recommended_types=insights_data.get("recommended_types", []),
            improvement_suggestions=insights_data.get("suggestions", ""),
            created_at=datetime.utcnow(),
        )
    
    return InsightResponse(
        id=insight.id,
        user_id=insight.user_id,
        best_topics=insight.best_topics,
        best_hooks=insight.best_hooks,
        recommended_types=insight.recommended_types,
        improvement_suggestions=insight.improvement_suggestions,
        created_at=insight.created_at,
    )


@router.post("/learn")
async def trigger_learning(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger the learning loop to update insights."""
    insights_data = await run_learning_loop(db, current_user.id)
    
    return {
        "message": "Learning loop completed",
        "insights": insights_data
    }
