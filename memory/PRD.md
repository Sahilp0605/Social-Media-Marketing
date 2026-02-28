# SocialFlow AI - Product Requirements Document

## Original Problem Statement
Build a Social Media Marketing Software platform where businesses can:
- Upload & publish posts/ads directly to Instagram / WhatsApp / Facebook / etc.
- Track engagement & user activity
- Capture leads from template/image clicks
- Redirect users to landing portal
- Store contact info in database
- Manage campaigns centrally

## User Personas
1. **Marketing Manager**: Needs to create, schedule, and analyze social media posts across platforms
2. **Small Business Owner**: Wants to capture leads and manage marketing campaigns without technical expertise
3. **Social Media Agency**: Manages multiple clients' social media presence from one dashboard

## Core Requirements (Static)
- User authentication (JWT + Google OAuth)
- Post creation with AI-powered captions and hashtags
- Template management (manual upload + AI generation)
- Landing page builder for lead capture
- Lead management CRM
- Campaign management
- Analytics dashboard
- Subscription plans with feature gating

## What's Been Implemented (Feb 28, 2026)

### Backend (FastAPI + MongoDB)
- ✅ User authentication (JWT + Emergent Google OAuth)
- ✅ Subscription system with 3 plans (Starter, Professional, Enterprise)
- ✅ 14-day Professional free trial for new users
- ✅ Plan-based feature limits (posts, templates, landing pages, AI generations, social accounts)
- ✅ Mock/Stripe payment toggle
- ✅ Posts CRUD API with platforms support + scheduling
- ✅ Templates CRUD API with canvas_data for editor
- ✅ Landing Pages CRUD API with slug generation
- ✅ Lead capture API (public endpoint)
- ✅ **Mock Social Accounts API** - Connect, Sync with simulated stats, Test posting
- ✅ **Post Scheduler API** - Queue management, process scheduled posts
- ✅ Campaigns CRUD API
- ✅ Analytics overview API
- ✅ AI content generation (Gemini 3 Flash for captions/hashtags)
- ✅ AI image generation (Gemini Nano Banana)

### Frontend (React + Tailwind)
- ✅ Landing page with features, pricing, platforms
- ✅ Login/Register with Google OAuth support
- ✅ Dashboard with analytics overview
- ✅ **Subscription page** with plan management, usage stats, payment mode toggle
- ✅ **Post Creator** with AI caption/hashtag generation, scheduling, and publish buttons
- ✅ Templates gallery with AI image generation
- ✅ **Template Editor** with Fabric.js (drag-drop text, shapes, images)
- ✅ Landing Pages builder with live preview
- ✅ Public landing pages with lead capture forms
- ✅ Leads management CRM with status updates
- ✅ **Social Accounts** page with Sync, Test Post, and Demo Mode notice
- ✅ Campaigns manager with calendar dates
- ✅ Analytics dashboard with charts (Recharts)
- ✅ Settings page

### Subscription Plans
| Plan | Price | Limits |
|------|-------|--------|
| Free Trial | $0 (14 days) | 15 accounts, unlimited posts, 50 templates, 20 landing pages, 100 AI generations |
| Starter | $29/mo | 5 accounts, 100 posts/mo, 10 templates, 5 landing pages, No AI |
| Professional | $79/mo | 15 accounts, unlimited posts, 50 templates, 20 landing pages, 100 AI generations |
| Enterprise | $199/mo | Unlimited everything, White label, API access |

### Mock Social Media Integration (NEW - Feb 28, 2026)
- ✅ Connect accounts for Instagram, Facebook, LinkedIn, X (Twitter)
- ✅ **Sync Account** - Returns simulated follower count (100-50K), engagement rate (1.5-8.5%)
- ✅ **Test Post** - Returns simulated success with reach (100-5K)
- ✅ Demo Mode notice visible on Social Accounts page
- ✅ Mock tokens generated for connected accounts

### Post Scheduling Backend (NEW - Feb 28, 2026)
- ✅ Posts auto-set to "scheduled" status when future datetime provided
- ✅ **Scheduler Queue** - Shows all scheduled posts with due status
- ✅ **Process Scheduler** - Manually trigger publishing of due posts
- ✅ Mock publish results include platform, account name, external URL, simulated reach
- ✅ Frontend "Process Scheduled (X)" button visible when posts are scheduled

### Integrations
- ✅ Gemini 3 Flash - AI text generation
- ✅ Gemini Nano Banana - AI image generation
- ✅ Emergent Google OAuth
- ✅ Stripe (with mock mode toggle)
- ✅ **Social media posting APIs (MOCKED for MVP)**
- ⏸️ WhatsApp Business API (Skip for MVP)

## Prioritized Backlog

### P0 - Critical (Next Sprint)
1. **Real social media API integration** (Instagram Business, Facebook Pages via Meta Graph API)
2. Auto-publish scheduled posts (background job/cron)
3. Email notifications for new leads (SendGrid/Resend)

### P1 - High Priority
1. WhatsApp Business API integration
2. Bulk scheduling feature
3. Template drag-drop improvements (layers, undo/redo)
4. UTM parameter tracking for landing pages

### P2 - Medium Priority
1. Multi-user workspace support
2. Role-based access control
3. Advanced analytics (demographics, device data)
4. QR code generation for landing pages
5. A/B testing for landing pages

### P3 - Future Enhancements
1. Automation engine (if lead captured → send WhatsApp)
2. AI posting time recommendations
3. Shopify/CRM integrations
4. White-label support (Enterprise)
5. Mobile app

## API Endpoints Summary
```
# Auth
POST /api/auth/register
POST /api/auth/login
POST /api/auth/session
GET  /api/auth/me
POST /api/auth/logout

# Subscription
GET  /api/plans
GET  /api/subscription
POST /api/subscription/checkout
GET  /api/subscription/status/{session_id}
GET  /api/admin/payment-mode
POST /api/admin/payment-mode

# Social Accounts (NEW)
GET/POST /api/social-accounts
DELETE /api/social-accounts/{id}
POST /api/social-accounts/{id}/sync      # Mock sync with simulated stats
POST /api/social-accounts/{id}/test-post # Mock test post

# Posts
GET/POST /api/posts
GET/PUT/DELETE /api/posts/{id}
POST /api/posts/{id}/publish

# Scheduler (NEW)
GET  /api/posts/scheduled/pending
POST /api/scheduler/process
GET  /api/scheduler/queue

# Templates
GET/POST /api/templates
GET/PUT/DELETE /api/templates/{id}

# Landing Pages
GET/POST /api/landing-pages
GET/DELETE /api/landing-pages/{id}
GET /api/p/{slug}

# Leads
POST /api/leads
GET /api/leads
PUT /api/leads/{id}/status

# Campaigns
GET/POST /api/campaigns
DELETE /api/campaigns/{id}

# Analytics
GET /api/analytics/overview

# AI
POST /api/ai/generate
POST /api/ai/generate-image
```

## Next Tasks
1. ⏳ Connect Instagram Business API for real posting (Meta Graph API)
2. ⏳ Implement background job for auto-publishing scheduled posts (cron/celery)
3. ⏳ Add email notifications for new leads (SendGrid/Resend)
4. ⏳ Enhance template editor with layers and undo/redo
5. ⏳ Add UTM tracking to landing page URLs

## Architecture Notes
- Backend: `server.py` is a monolith (~1600 lines). Consider splitting into modules (`routers/auth.py`, `routers/posts.py`, etc.)
- Frontend: React with Tailwind + Shadcn UI components
- Database: MongoDB with collections for users, posts, templates, landing_pages, leads, social_accounts, campaigns, ai_usage, payment_transactions
