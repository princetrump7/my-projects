from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Post, Metric, Insight
from app.services.viral_scorer import calculate_engagement_score


# Topics that commonly perform well
HIGH_PERFORMING_TOPICS = {
    "saas": ["product-led growth", "churn reduction", "free trials", "pricing strategy"],
    "fitness": ["consistency", "calorie deficit", "recovery", "habit formation"],
    "crypto": ["accumulation strategy", "dollar cost averaging", "wallet security"],
    "marketing": ["email deliverability", "content repurposing", "conversion optimization"],
    "tech": ["TypeScript", "AI integration", "serverless", "API design"],
}


# Hook patterns that work well
HIGH_PERFORMING_HOOKS = [
    "hot take:",
    "question:",
    "stop",
    "i tried",
    "here's what",
    "truth about",
    "nobody talks about",
    "results below",
]


def extract_topics_from_posts(posts: List[Dict[str, Any]]) -> List[str]:
    """
    Extract common topics from a list of posts.
    """
    topic_counts = {}
    
    for post in posts:
        idea = post.get("idea", "")
        if idea:
            topic_counts[idea] = topic_counts.get(idea, 0) + 1
    
    # Sort by frequency and return top topics
    sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
    return [topic for topic, _ in sorted_topics[:10]]


def extract_hooks_from_content(posts: List[Dict[str, Any]]) -> List[str]:
    """
    Extract successful hook patterns from post content.
    """
    import re
    
    hooks_found = {}
    
    for post in posts:
        content = post.get("content", "").lower()
        
        for hook in HIGH_PERFORMING_HOOKS:
            if hook.lower() in content:
                hooks_found[hook] = hooks_found.get(hook, 0) + 1
    
    # Sort by frequency
    sorted_hooks = sorted(hooks_found.items(), key=lambda x: x[1], reverse=True)
    return [hook for hook, _ in sorted_hooks[:10]]


def identify_content_patterns(posts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Identify patterns in high-performing content.
    """
    patterns = {
        "avg_length": 0,
        "has_numbers": 0,
        "has_cta": 0,
        "has_question": 0,
        "has_emoji": 0,
    }
    
    import re
    
    for post in posts:
        content = post.get("content", "")
        
        patterns["avg_length"] += len(content)
        
        if re.search(r"\d+", content):
            patterns["has_numbers"] += 1
        
        cta_patterns = ["drop", "what do you think", "save this", "share", "follow"]
        if any(cta in content.lower() for cta in cta_patterns):
            patterns["has_cta"] += 1
        
        if "?" in content:
            patterns["has_question"] += 1
        
        if re.search(r"[\U0001F300-\U0001F9FF]", content):
            patterns["has_emoji"] += 1
    
    count = len(posts) or 1
    patterns["avg_length"] = patterns["avg_length"] / count
    patterns["has_numbers"] = patterns["has_numbers"] / count * 100
    patterns["has_cta"] = patterns["has_cta"] / count * 100
    patterns["has_question"] = patterns["has_question"] / count * 100
    patterns["has_emoji"] = patterns["has_emoji"] / count * 100
    
    return patterns


async def analyze_user_performance(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Analyze a user's post performance to identify patterns.
    """
    # Get user's posts with metrics
    result = await db.execute(
        select(Post, Metric)
        .join(Metric, Post.id == Metric.post_id)
        .where(Post.user_id == user_id)
        .order_by(Metric.engagement_rate.desc())
        .limit(limit)
    )
    
    rows = result.all()
    
    if not rows:
        return {
            "total_analyzed": 0,
            "best_topics": [],
            "best_hooks": [],
            "patterns": {},
            "suggestions": "Not enough data yet. Keep posting!"
        }
    
    # Build post data with metrics
    posts_with_metrics = []
    for post, metric in rows:
        posts_with_metrics.append({
            "content": post.content,
            "idea": post.idea,
            "viral_score": post.viral_score,
            "likes": metric.likes,
            "comments": metric.comments,
            "shares": metric.shares,
            "impressions": metric.impressions,
            "engagement_rate": metric.engagement_rate,
        })
    
    # Extract top 20% by engagement
    top_posts = posts_with_metrics[:len(posts_with_metrics) // 5 or 1]
    
    if not top_posts:
        top_posts = posts_with_metrics[:1]
    
    # Extract insights
    best_topics = extract_topics_from_posts(top_posts)
    best_hooks = extract_hooks_from_content(top_posts)
    patterns = identify_content_patterns(top_posts)
    
    # Generate suggestions
    suggestions = generate_improvement_suggestions(patterns, posts_with_metrics)
    
    return {
        "total_analyzed": len(posts_with_metrics),
        "best_topics": best_topics,
        "best_hooks": best_hooks,
        "patterns": patterns,
        "suggestions": suggestions,
    }


def generate_improvement_suggestions(
    patterns: Dict[str, Any],
    posts: List[Dict[str, Any]]
) -> str:
    """
    Generate improvement suggestions based on patterns.
    """
    suggestions = []
    
    # Analyze patterns and generate suggestions
    if patterns.get("avg_length", 0) > 280:
        suggestions.append("Your posts are too long. Try keeping them under 280 characters.")
    elif patterns.get("avg_length", 0) < 100:
        suggestions.append("Your posts are quite short. Try adding more value with 150-200 characters.")
    
    if patterns.get("has_cta", 0) < 50:
        suggestions.append("Add clear calls-to-action to encourage engagement.")
    
    if patterns.get("has_question", 0) < 30:
        suggestions.append("Questions perform well. Try asking your audience questions.")
    
    if patterns.get("has_numbers", 0) < 30:
        suggestions.append("Lists and numbers grab attention. Try structuring content with points or statistics.")
    
    # Calculate avg engagement
    total_engagement = sum(p.get("engagement_rate", 0) for p in posts)
    avg_engagement = total_engagement / len(posts) if posts else 0
    
    if avg_engagement > 5:
        suggestions.append("Great engagement! Your content resonates well.")
    elif avg_engagement > 2:
        suggestions.append("Decent engagement. Keep testing different hooks for improvement.")
    else:
        suggestions.append("Focus on stronger hooks and better timing. Study what works in your niche.")
    
    return " | ".join(suggestions)


async def update_user_insights(
    db: AsyncSession,
    user_id: UUID,
    insights_data: Dict[str, Any]
) -> Insight:
    """
    Update or create user insights based on analysis.
    """
    import uuid
    
    # Check if insights exist
    result = await db.execute(
        select(Insight).where(Insight.user_id == user_id)
    )
    existing_insight = result.scalar_one_or_none()
    
    if existing_insight:
        # Update existing
        existing_insight.best_topics = insights_data.get("best_topics", [])
        existing_insight.best_hooks = insights_data.get("best_hooks", [])
        existing_insight.recommended_types = insights_data.get("recommended_types", [])
        existing_insight.improvement_suggestions = insights_data.get("suggestions", "")
        await db.commit()
        await db.refresh(existing_insight)
        return existing_insight
    else:
        # Create new
        new_insight = Insight(
            id=uuid.uuid4(),
            user_id=user_id,
            best_topics=insights_data.get("best_topics", []),
            best_hooks=insights_data.get("best_hooks", []),
            recommended_types=insights_data.get("recommended_types", []),
            improvement_suggestions=insights_data.get("suggestions", ""),
        )
        db.add(new_insight)
        await db.commit()
        await db.refresh(new_insight)
        return new_insight


async def run_learning_loop(
    db: AsyncSession,
    user_id: UUID
) -> Dict[str, Any]:
    """
    Run the full learning loop - analyze performance and update insights.
    """
    # Analyze user performance
    insights_data = await analyze_user_performance(db, user_id)
    
    # Generate recommended content types based on patterns
    if insights_data.get("patterns"):
        patterns = insights_data["patterns"]
        recommended = []
        
        if patterns.get("has_numbers", 0) > 50:
            recommended.append("lists")
        if patterns.get("has_question", 0) > 40:
            recommended.append("questions")
        if patterns.get("has_cta", 0) > 60:
            recommended.append(" ctas")
        
        insights_data["recommended_types"] = recommended
    
    # Update insights in database
    await update_user_insights(db, user_id, insights_data)
    
    return insights_data
