from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime
import uuid

from app.database import get_db, User, Post
from app.schemas import (
    PostCreate, PostUpdate, PostResponse,
    ContentGenerationRequest, ContentGenerationResponse
)
from app.api.auth import get_current_user
from app.services.content_generator import generate_posts
from app.services.viral_scorer import calculate_viral_score

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("/generate", response_model=ContentGenerationResponse)
async def generate_content(
    request: ContentGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate new marketing content using AI."""
    # Use template-based generation (or AI if API key configured)
    result = generate_posts(
        niche=request.niche,
        tone=request.tone,
        platform=request.platform,
        count=request.count,
        topic=request.topic
    )
    
    return result


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save a generated post as draft."""
    new_post = Post(
        id=uuid.uuid4(),
        user_id=current_user.id,
        content=post_data.content,
        platform=post_data.platform,
        status="draft",
        idea=post_data.idea,
        viral_score=calculate_viral_score(post_data.content),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    
    return PostResponse(
        id=new_post.id,
        user_id=new_post.user_id,
        content=new_post.content,
        platform=new_post.platform,
        status=new_post.status,
        idea=new_post.idea,
        viral_score=new_post.viral_score,
        scheduled_at=new_post.scheduled_at,
        published_at=new_post.published_at,
        created_at=new_post.created_at,
    )


@router.get("", response_model=list[PostResponse])
async def list_posts(
    status: str | None = None,
    platform: str | None = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's posts with optional filtering."""
    query = select(Post).where(Post.user_id == current_user.id)
    
    if status:
        query = query.where(Post.status == status)
    if platform:
        query = query.where(Post.platform == platform)
    
    query = query.order_by(Post.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    posts = result.scalars().all()
    
    return [
        PostResponse(
            id=p.id,
            user_id=p.user_id,
            content=p.content,
            platform=p.platform,
            status=p.status,
            idea=p.idea,
            viral_score=p.viral_score,
            scheduled_at=p.scheduled_at,
            published_at=p.published_at,
            created_at=p.created_at,
        )
        for p in posts
    ]


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single post by ID."""
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


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: UUID,
    post_update: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a post."""
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
    
    # Update fields if provided
    if post_update.content is not None:
        post.content = post_update.content
        post.viral_score = calculate_viral_score(post_update.content)
    if post_update.status is not None:
        post.status = post_update.status
    if post_update.scheduled_at is not None:
        post.scheduled_at = post_update.scheduled_at
    
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


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a post."""
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
    
    await db.delete(post)
    await db.commit()
    
    return None
