from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from datetime import datetime
from typing import List, Optional

from app.database import get_db, User, Post
from app.schemas import PostResponse, ScheduleRequest, RescheduleRequest
from app.api.auth import get_current_user

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])


@router.get("/calendar", response_model=List[dict])
async def get_calendar(
    year: int,
    month: int,
    platform: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get calendar view of scheduled posts."""
    from datetime import date
    
    # Get start and end of month
    if month == 12:
        end_month = 1
        end_year = year + 1
    else:
        end_month = month + 1
        end_year = year
    
    start_date = datetime(year, month, 1)
    end_date = datetime(end_year, end_month, 1)
    
    # Query scheduled posts
    query = select(Post).where(
        and_(
            Post.user_id == current_user.id,
            Post.status == "scheduled",
            Post.scheduled_at >= start_date,
            Post.scheduled_at < end_date
        )
    )
    
    if platform:
        query = query.where(Post.platform == platform)
    
    result = await db.execute(query.order_by(Post.scheduled_at))
    posts = result.scalars().all()
    
    # Format calendar data
    calendar_data = []
    for post in posts:
        calendar_data.append({
            "id": str(post.id),
            "content": post.content,
            "platform": post.platform,
            "scheduled_at": post.scheduled_at.isoformat() if post.scheduled_at else None,
            "viral_score": post.viral_score,
        })
    
    return calendar_data


@router.post("/schedule", response_model=PostResponse)
async def schedule_post(
    request: ScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Schedule a post for publishing."""
    # Get post
    result = await db.execute(
        select(Post).where(
            Post.id == request.post_id,
            Post.user_id == current_user.id
        )
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post already published"
        )
    
    # Update post status
    post.status = "scheduled"
    post.scheduled_at = request.scheduled_at
    post.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(post)
    
    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        content=post.content,
        platform=post.platform,
        status=post.status,
        idea=post.idea,
        viral_score=post.viral_score,
        scheduled_at=post.scheduled_at,
        published_at=post.published_at,
        created_at=post.created_at,
    )


@router.put("/reschedule", response_model=PostResponse)
async def reschedule_post(
    request: RescheduleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reschedule a post to a new time."""
    # Get post
    result = await db.execute(
        select(Post).where(
            Post.id == request.post_id,
            Post.user_id == current_user.id
        )
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.status != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post is not scheduled"
        )
    
    # Update scheduled time
    post.scheduled_at = request.new_scheduled_at
    post.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(post)
    
    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        content=post.content,
        platform=post.platform,
        status=post.status,
        idea=post.idea,
        viral_score=post.viral_score,
        scheduled_at=post.scheduled_at,
        published_at=post.published_at,
        created_at=post.created_at,
    )


@router.post("/publish/{post_id}", response_model=PostResponse)
async def publish_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Immediately publish a post (or mark as published for testing)."""
    # Get post
    result = await db.execute(
        select(Post).where(
            Post.id == post_id,
            Post.user_id == current_user.id
        )
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post already published"
        )
    
    # In production, this would call the platform APIs
    # For MVP, we just mark as published
    post.status = "published"
    post.published_at = datetime.utcnow()
    post.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(post)
    
    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        content=post.content,
        platform=post.platform,
        status=post.status,
        idea=post.idea,
        viral_score=post.viral_score,
        scheduled_at=post.scheduled_at,
        published_at=post.published_at,
        created_at=post.created_at,
    )
