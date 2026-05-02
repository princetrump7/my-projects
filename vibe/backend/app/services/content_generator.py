import os
import json
import random
from typing import List, Optional
from app.schemas import GeneratedPost, ContentGenerationResponse
from app.services.viral_scorer import calculate_viral_score


# Content templates per niche
CONTENT_TEMPLATES = {
    "saas": [
        "Stop building features. Start solving problems. Here’s what actually matters: {topic}",
        "I just saved 10 hours this week using {topic}. Here's how:",
        "The best SaaS founders I know do this one thing differently: {topic}",
        "Hot take: {topic} is overrated. Here's why:",
        "5 lessons from building a {topic} that hit $100K MRR",
        "Nobody talks about {topic}, but it’s the key to growth.",
        "Question: Is {topic} worth your time? My take ↓",
        "The {topic} framework that doubled our conversion rate:",
        "I was wrong about {topic}. Here’s what I learned:",
        "If you’re serious about {topic}, read this.",
    ],
    "fitness": [
        "Stop overcomplicating fitness. {topic}",
        "I tried {topic} for 30 days. Here’s what happened:",
        "The fitness industry doesn't want you to know: {topic}",
        "Hot take: {topic} is killing your progress.",
        "5 truths about {topic} they won’t tell you at the gym.",
        "I was scared to try {topic}. Glad I did.",
        "The {topic} mistake that cost me 2 years of progress.",
        "Question: Are you {topic} correctly? Most aren’t.",
        "My {topic} transformation took 90 days. Here’s the plan:",
        "Stop waiting for Monday. Start {topic} today.",
    ],
    "crypto": [
        "{topic} is the narrative. Here’s the alpha:",
        "I’ve been in crypto for 10 years. Here’s the truth about {topic}:",
        "Unpopular opinion: {topic}",
        "The {topic} play that made me 10x (not financial advice)",
        "5 things I wish I knew about {topic} earlier:",
        "Why {topic} will matter in the next bull run:",
        "The market is wrong about {topic}. Here’s why:",
        "I’m accumulation {topic}. Here’s my thesis:",
        "Don’t sleep on {topic}. Here’s the play:",
        "After {topic}, I’m more bullish than ever.",
    ],
    "marketing": [
        "Stop guessing. Start testing. {topic}",
        "The {topic} strategy that got me 10K leads:",
        "Hot take: {topic} is a waste of money.",
        "I spent $50K on {topic}. Here’s what actually worked:",
        "5 {topic} myths that are killing your conversions:",
        "Question: Is {topic} working for you? Probably not.",
        "The {topic} framework used by top 1% marketers:",
        "Everybody talks about {topic}. Nobody understands it.",
        "My {topic} campaign ROI: 3400%. Here’s the breakdown:",
        "Stop copying what works for others. {topic}",
    ],
    "tech": [
        "The {topic} problem no one talks about:",
        "I built {topic} in a weekend. Here’s how:",
        "Why {topic} is the future of software:",
        "Hot take: {topic} is overrated in 2024.",
        "5 lessons from building {topic} at scale:",
        "The {topic} stack that powers $1M ARR:",
        "Stop using {topic}. Here’s what to use instead:",
        "Question: Are you {topic} correctly?",
        "I spent 6 months doing {topic} wrong. Don’t be me.",
        "{topic} is the missing piece in your architecture.",
    ],
    "default": [
        "Here’s the truth about {topic}:",
        "I tried {topic} for 30 days. Results below ↓",
        "Question: What do you think about {topic}?",
        "5 things I learned about {topic}:",
        "The {topic} approach that changed everything:",
        "Stop overthinking {topic}. Start doing.",
        "Hot take: {topic}",
        "I was wrong about {topic}. Here’s what I know now:",
        "If you’re serious about {topic}, read this:",
        "The {topic} framework that works:",
    ],
}

# Topics per niche
NICHE_TOPICS = {
    "saas": [
        "product-led growth", "free trials", "freemium models", "churn reduction",
        "onboarding flows", "feature prioritization", "pricing strategy",
        "self-serve vs sales", "viral loops", "community building"
    ],
    "fitness": [
        "calorie deficit", "progressive overload", "recovery",
        "sleep optimization", "nutrition timing", "zone 2 training",
        "strength standards", "mobility work", "habit formation", "consistency"
    ],
    "crypto": [
        "accumulation strategy", "dollar cost averaging", "wallet security",
        "DeFi yields", "NFT utility", "layer 2 solutions", "fork trades",
        "custody solutions", "tax optimization", "market cycles"
    ],
    "marketing": [
        "email deliverability", "content repurposing", "SEO strategy",
        "social proof", "referral programs", "launch sequences",
        "retargeting", "conversion optimization", "brand voice", "viral loops"
    ],
    "tech": [
        "TypeScript", "serverless", "AI integration", "edge computing",
        "containerization", "API design", "database optimization",
        "CI/CD pipelines", "technical debt", "developer experience"
    ],
}

# Tone variations
TONE_MODIFIERS = {
    "professional": {
        "intro": "Let's discuss",
        "cta": "What are your thoughts?",
        "style": "direct and informative"
    },
    "casual": {
        "intro": "Real talk",
        "cta": "Drop your thoughts below",
        "style": "conversational and friendly"
    },
    "funny": {
        "intro": "Plot twist",
        "cta": "You're welcome",
        "style": "witty and humorous"
    },
    "educational": {
        "intro": "Let's learn about",
        "cta": "Save this for later",
        "style": " instructional and clear"
    },
}


def get_templates_for_niche(niche: str) -> List[str]:
    """Get content templates for a specific niche."""
    return CONTENT_TEMPLATES.get(niche.lower(), CONTENT_TEMPLATES["default"])


def get_topics_for_niche(niche: str, custom_topic: Optional[str] = None) -> List[str]:
    """Get topic suggestions for a niche or use custom topic."""
    if custom_topic:
        return [custom_topic]
    return NICHE_TOPICS.get(niche.lower(), ["this"])


def generate_posts(
    niche: str,
    tone: str = "professional",
    platform: str = "twitter",
    count: int = 5,
    topic: Optional[str] = None
) -> ContentGenerationResponse:
    """
    Generate marketing posts using template-based generation.
    In production, this would call OpenAI/Claude API.
    """
    templates = get_templates_for_niche(niche)
    topics = get_topics_for_niche(niche, topic)
    tone_mod = TONE_MODIFIERS.get(tone.lower(), TONE_MODIFIERS["professional"])
    
    generated_posts = []
    max_length = 280 if platform.lower() == "twitter" else 3000
    
    # Shuffle and pick templates
    random.shuffle(templates)
    used_templates = templates[:count]
    
    for i, template in enumerate(used_templates):
        # Pick a topic (cycle through available topics)
        current_topic = topics[i % len(topics)] if topics else "this"
        
        # Format the content
        try:
            content = template.format(topic=current_topic)
        except ValueError:
            content = template.replace("{topic}", current_topic)
        
        # Apply tone modification
        if tone_mod["style"] != "direct and informative":
            # Add tone-appropriate intro/cta
            if "↓" not in content and len(content) < max_length - 50:
                content = f"{content}\n\n{tone_mod['cta']}"
        
        # Trim if too long
        if len(content) > max_length:
            content = content[:max_length - 3] + "..."
        
        # Calculate viral score
        viral_score = calculate_viral_score(content)
        
        generated_posts.append(GeneratedPost(
            content=content,
            idea=current_topic,
            viral_score=viral_score
        ))
    
    # Sort by viral score (highest first)
    generated_posts.sort(key=lambda x: x.viral_score, reverse=True)
    
    return ContentGenerationResponse(
        posts=generated_posts,
        topic=topic or random.choice(topics) if topics else "general"
    )


async def generate_posts_ai(
    niche: str,
    tone: str = "professional",
    platform: str = "twitter",
    count: int = 5,
    topic: Optional[str] = None
) -> ContentGenerationResponse:
    """
    AI-powered content generation using OpenAI API.
    This is the production version when API key is available.
    """
    from openai import AsyncOpenAI
    from app.config import settings
    
    # Check if API key is available
    if not settings.OPENAI_API_KEY:
        # Fallback to template-based generation
        return generate_posts(niche, tone, platform, count, topic)
    
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    templates = get_templates_for_niche(niche)
    topics = get_topics_for_niche(niche, topic)
    tone_mod = TONE_MODIFIERS.get(tone.lower(), TONE_MODIFIERS["professional"])
    
    max_length = 280 if platform.lower() == "twitter" else 3000
    
    # Build prompt for AI
    prompt = f"""Generate {count} engaging social media posts about {topic or random.choice(topics)}.
    
Style: {tone_mod['style']}
Platform: {platform}
Niche: {niche}
Max length: {max_length} characters

For each post, provide:
1. The main content (engaging, valuable)
2. The core idea/topic it addresses

Format as JSON array with objects containing:
- content: the post text
- idea: the topic/hook"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.8,
        )
        
        result = json.loads(response.choices[0].message.content)
        posts_data = result.get("posts", [result])[:count]
        
        generated_posts = []
        for post_data in posts_data:
            content = post_data.get("content", "")
            idea = post_data.get("idea", topic or "general")
            
            # Calculate viral score
            viral_score = calculate_viral_score(content)
            
            generated_posts.append(GeneratedPost(
                content=content,
                idea=idea,
                viral_score=viral_score
            ))
        
        return ContentGenerationResponse(
            posts=generated_posts,
            topic=topic or random.choice(topics) if topics else "general"
        )
    
    except Exception as e:
        # Fallback to template-based on any error
        print(f"AI generation failed: {e}. Using template-based generation.")
        return generate_posts(niche, tone, platform, count, topic)
