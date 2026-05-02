import re
from typing import Dict, Any


# Weights for viral scoring
ENGAGEMENT_WEIGHT = 0.4
SHARE_WEIGHT = 0.35
IMPRESSION_WEIGHT = 0.25


def calculate_viral_score(content: str) -> float:
    """
    Calculate a viral score (0-100) for a piece of content.
    Based on various engagement factors.
    """
    score = 50.0  # Base score
    
    # Length scoring (optimal range)
    length = len(content)
    if 100 <= length <= 200:
        score += 15
    elif 200 < length <= 280:
        score += 10
    elif length < 100:
        score -= 5
    else:
        score -= 10
    
    # Hook patterns (questions, "hot takes", etc.)
    hooks = [
        r"\?",  # Questions
        r"hot take",
        r"unpopular opinion",
        r"truth about",
        r"nobody talks about",
        r"question:",
        r"here's what",
        r"stop",
        r"start",
    ]
    
    hook_count = sum(1 for hook in hooks if re.search(hook, content.lower()))
    score += hook_count * 5
    
    # Call-to-action presence
    cta_patterns = [
        r"drop your",
        r"what do you think",
        r"save this",
        r"read this",
        r"share",
        r"follow",
        r"comment below",
        r"↓",
    ]
    
    has_cta = any(re.search(cta, content.lower()) for cta in cta_patterns)
    if has_cta:
        score += 10
    
    # Emoji presence (moderate is good)
    emoji_count = len(re.findall(r"[\U0001F300-\U0001F9FF]", content))
    if 1 <= emoji_count <= 3:
        score += 5
    elif emoji_count > 5:
        score -= 5
    
    # Numbers/list format performs well
    if re.search(r"^\d+[\.\)]", content, re.MULTILINE):
        score += 10
    if re.search(r"\d+ (things|tips|lessons|ways|reasons)", content.lower()):
        score += 15
    
    # Engagement triggers
    engagement_triggers = [
        r"i tried",
        r"i spent",
        r"here's how",
        r"results below",
        r"transformation",
        r"doubled",
        r"10x",
    ]
    
    trigger_count = sum(1 for trigger in engagement_triggers if re.search(trigger, content.lower()))
    score += trigger_count * 5
    
    # Cap score between 0 and 100
    score = max(0.0, min(100.0, score))
    
    return round(score, 1)


def calculate_engagement_score(metrics: Dict[str, Any]) -> float:
    """
    Calculate engagement score from actual metrics.
    engagement_rate = (likes + comments + shares) / impressions
    """
    likes = metrics.get("likes", 0)
    comments = metrics.get("comments", 0)
    shares = metrics.get("shares", 0)
    impressions = metrics.get("impressions", 0)
    
    if impressions == 0:
        return 0.0
    
    engagement_rate = (likes + comments + shares) / impressions
    
    # Calculate weighted score
    score = (
        ENGAGEMENT_WEIGHT * engagement_rate * 100 +
        SHARE_WEIGHT * (shares / impressions if impressions > 0 else 0) * 200 +
        IMPRESSION_WEIGHT * min(impressions / 1000, 10) * 10
    )
    
    return round(score, 1)


def get_score_grade(score: float) -> str:
    """
    Get a letter grade for a viral score.
    """
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"


def get_improvement_tips(score: float) -> list:
    """
    Get suggested improvements based on viral score.
    """
    tips = []
    
    if score < 60:
        tips.extend([
            "Add a stronger hook (question or controversial take)",
            "Include a clear call-to-action",
            "Keep it in the optimal length range (100-200 chars)",
        ])
    elif score < 80:
        tips.extend([
            "Try adding numbers or lists",
            "Include more engagement triggers",
            "Add an emoji or two",
        ])
    
    if not tips:
        tips.append("Great score! Consider varying your content style.")
    
    return tips
