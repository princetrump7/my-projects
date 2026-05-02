# Vibe Marketing Engine - SaaS v1 Specification

## 1. Project Overview

**Project Name:** Vibe Marketing Engine  
**Type:** SaaS Web Application  
**Core Functionality:** AI-powered marketing platform that generates, schedules, posts, and improves marketing content automatically using feedback loops  
**Target Users:** Content creators, marketers, SaaS founders, influencers

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14 (React)
- **Styling:** TailwindCSS
- **UI Components:** ShadCN UI
- **State Management:** Zustand
- **Charts:** Recharts

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (via SQLAlchemy)
- **Cache/Queue:** Redis
- **AI:** OpenAI API / Anthropic Claude

### Database Schema
```sql
-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    niche VARCHAR(100),
    tone_preference VARCHAR(50),
    platforms JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    content TEXT,
    platform VARCHAR(20),
    status VARCHAR(20), -- draft, scheduled, published
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    viral_score FLOAT,
    created_at TIMESTAMP
);

-- metrics table
CREATE TABLE metrics (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id),
    likes INTEGER,
    comments INTEGER,
    shares INTEGER,
    impressions INTEGER,
    engagement_rate FLOAT,
    recorded_at TIMESTAMP
);

-- insights table
CREATE TABLE insights (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    best_topics JSONB,
    best_hooks JSONB,
    recommended_types JSONB,
    improvement_suggestions TEXT,
    created_at TIMESTAMP
);
```

---

## 3. UI/UX Specification

### Color Palette
- **Background Primary:** #0A0A0F (deep black)
- **Background Secondary:** #121218 (card background)
- **Background Tertiary:** #1A1A24 (elevated surfaces)
- **Accent Primary:** #8B5CF6 (violet)
- **Accent Secondary:** #A78BFA (light violet)
- **Accent Gradient:** linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)
- **Success:** #10B981 (emerald)
- **Warning:** #F59E0B (amber)
- **Error:** #EF4444 (red)
- **Text Primary:** #FFFFFF
- **Text Secondary:** #A1A1AA (zinc-400)
- **Text Muted:** #71717A (zinc-500)
- **Border:** #27272A (zinc-800)

### Typography
- **Font Family:** "Geist Sans", "Inter", system-ui
- **Headings:** 
  - H1: 36px, font-weight: 700
  - H2: 28px, font-weight: 600
  - H3: 22px, font-weight: 600
  - H4: 18px, font-weight: 500
- **Body:** 16px, font-weight: 400
- **Small:** 14px, font-weight: 400
- **Caption:** 12px, font-weight: 400

### Spacing System
- **Base unit:** 4px
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96

### Layout Structure
- **Sidebar:** 280px fixed width, collapsible to 80px
- **Main content:** Fluid, max-width 1400px
- **Cards:** Border-radius: 12px, padding: 24px
- **Buttons:** Border-radius: 8px, height: 40px (default), 48px (large)

### Pages & Components

#### 1. Dashboard Page
- **Header:** "Dashboard" title with date
- **Stats Cards Row:** 4 cards showing:
  - Total Posts (this month)
  - Engagement Rate (average)
  - Best Performing Post
  - Active Streak (days)
- **Today's Insights Panel:**
  - Best performing hook style
  - Worst performing topic
  - Recommended post idea
- **Growth Chart:** Line chart showing engagement over time
- **Quick Actions:** Generate, Schedule, Analyze buttons

#### 2. Content Studio Page
- **Left Panel:** Niche selector, Tone slider, Platform toggles
- **Main Area:**AI-generated content display
- **Right Panel:** History of generated posts
- **Actions:** Regenerate, Edit, Save, Schedule

#### 3. Scheduler Page
- **Calendar View:** Month/Week/Day toggle
- **Scheduled Posts:** Drag-and-drop cards
- **Time Slots:** Visual timeline
- **Platform Filter:** Filter by platform

#### 4. Analytics Page
- **Metrics Overview:** Key metrics cards
- **Charts:** 
  - Engagement over time (line)
  - Platform distribution (pie)
  - Top performing posts (bar)
- **Insights Table:** Sortable table of all posts with metrics

#### 5. Settings Page
- **Profile Section:** Name, email, avatar
- **Preferences:** Niche, tone, platforms
- **API Keys:** OpenAI, platform APIs
- **Billing:** Plan info (placeholder)

---

## 4. Functionality Specification

### Core Flows

#### 1. User Onboarding
```
User enters:
→ niche (dropdown: SaaS, Fitness, Crypto, E-commerce, Education, Health, Tech, Finance, Marketing, Other)
→ tone (slider: Professional → Casual → Funny)
→ platforms (checkboxes: X, LinkedIn, Instagram)
```

#### 2. Content Generation
```
Input: user_profile (niche, tone, platforms)
Process:
1. AI generates 5-10 content ideas based on niche
2. For each idea, generate full post with appropriate tone
3. Calculate viral score for each post
4. Return ranked posts to user

Output: List of generated posts with viral scores
```

#### 3. Viral Scoring System
```
viral_score = (
    0.4 * engagement_rate +
    0.35 * shares +
    0.25 * impressions / 1000
)
Score range: 0-100
```

#### 4. Learning Loop
```
Process:
1. Fetch user's published posts with metrics
2. Identify top 20% performing posts
3. Extract patterns:
   - Common topics
   - Hook styles
   - Content lengths
   - Tone variations
4. Generate improvement insights
5. Save insights to database
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

#### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile

#### Posts
- `POST /api/posts/generate` - Generate new posts
- `GET /api/posts` - List user's posts
- `GET /api/posts/{id}` - Get single post
- `PUT /api/posts/{id}` - Update post
- `DELETE /api/posts/{id}` - Delete post

#### Scheduler
- `POST /api/scheduler/schedule` - Schedule a post
- `GET /api/scheduler/calendar` - Get calendar view
- `PUT /api/scheduler/reschedule` - Reschedule post

#### Analytics
- `GET /api/analytics/overview` - Get metrics overview
- `GET /api/analytics/engagement` - Get engagement data
- `GET /api/analytics/insights` - Get AI insights

---

## 5. Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme applied consistently across all pages
- [ ] Violet accent color visible in buttons, links, highlights
- [ ] Sidebar navigation functional with active states
- [ ] All cards have proper border-radius and subtle borders
- [ ] Typography hierarchy clear and consistent

### Functional Checkpoints
- [ ] User can set niche, tone, and platforms
- [ ] Content generation returns 5+ post options
- [ ] Posts can be scheduled to specific times
- [ ] Viral scores displayed on generated posts
- [ ] Dashboard shows accurate stats
- [ ] Analytics charts render with mock data
- [ ] Settings page saves user preferences

### Technical Checkpoints
- [ ] FastAPI backend starts without errors
- [ ] Next.js frontend builds successfully
- [ ] Database models sync correctly
- [ ] API routes return proper responses
- [ ] No console errors on page load

---

## 6. File Structure

```
vibe/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├���─ config.py            # Configuration
│   │   ├── database.py          # DB connection
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # Auth routes
│   │   │   ├── users.py         # User routes
│   │   │   ├── posts.py         # Post routes
│   │   │   ├── scheduler.py     # Scheduler routes
│   │   │   └── analytics.py     # Analytics routes
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── content_generator.py
│   │       ├── viral_scorer.py
│   │       └── learning_engine.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── dashboard/
│   │   │   ├── studio/
│   │   │   ├── scheduler/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── components/
│   │   │   ├── ui/              # ShadCN components
│   │   │   ├── layout/
│   │   │   └── dashboard/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── stores/
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.js
├── SPEC.md
└── TODO.md
