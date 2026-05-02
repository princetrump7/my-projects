from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db, User
from app.schemas import UserResponse, UserUpdate
from app.api.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile."""
    # Update fields if provided
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.niche is not None:
        current_user.niche = user_update.niche
    if user_update.tone_preference is not None:
        current_user.tone_preference = user_update.tone_preference
    if user_update.platforms is not None:
        current_user.platforms = user_update.platforms
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID (public profile for display purposes)."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Return only public fields
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        niche=user.niche,
        tone_preference=user.tone_preference,
        platforms=user.platforms,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        created_at=user.created_at,
    )
