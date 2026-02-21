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

## What's Been Implemented (MVP - Feb 2026)

### Backend (FastAPI + MongoDB)
- ✅ User authentication (JWT + Emergent Google OAuth)
- ✅ Posts CRUD API with platforms support
- ✅ Templates CRUD API
- ✅ Landing Pages CRUD API with slug generation
- ✅ Lead capture API (public endpoint)
- ✅ Campaigns CRUD API
- ✅ Analytics overview API
- ✅ AI content generation (Gemini 3 Flash for captions/hashtags)
- ✅ AI image generation (Gemini Nano Banana)

### Frontend (React + Tailwind)
- ✅ Landing page with features, pricing, platforms
- ✅ Login/Register with Google OAuth support
- ✅ Dashboard with analytics overview
- ✅ Post Creator with AI caption/hashtag generation
- ✅ Templates gallery with AI image generation
- ✅ Landing Pages builder with live preview
- ✅ Public landing pages with lead capture forms
- ✅ Leads management CRM with status updates
- ✅ Campaigns manager with calendar dates
- ✅ Analytics dashboard with charts (Recharts)
- ✅ Settings page

### Integrations
- ✅ Gemini 3 Flash - AI text generation
- ✅ Gemini Nano Banana - AI image generation
- ✅ Emergent Google OAuth
- ⏸️ Social media posting APIs (MOCKED for MVP)
- ⏸️ WhatsApp Business API (Skip for MVP)

## Prioritized Backlog

### P0 - Critical (Next Sprint)
1. Social media API integration (Instagram Business, Facebook Pages)
2. Post scheduling and publishing
3. Real-time engagement tracking

### P1 - High Priority
1. WhatsApp Business API integration
2. Bulk scheduling feature
3. Email notifications for new leads
4. Template drag-drop editor
5. UTM parameter tracking for landing pages

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
4. White-label support
5. Mobile app

## Tech Stack
- **Backend**: FastAPI, MongoDB, Motor (async driver)
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Recharts
- **AI**: Gemini 3 Flash (text), Gemini Nano Banana (images)
- **Auth**: JWT + Emergent Google OAuth
- **Deployment**: Kubernetes (Emergent)

## API Endpoints Summary
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/session - OAuth session exchange
GET  /api/auth/me - Get current user
POST /api/auth/logout - Logout

GET/POST /api/posts - Posts CRUD
GET/PUT/DELETE /api/posts/{id}

GET/POST /api/templates - Templates CRUD
DELETE /api/templates/{id}

GET/POST /api/landing-pages - Landing pages CRUD
GET/DELETE /api/landing-pages/{id}
GET /api/p/{slug} - Public landing page

POST /api/leads - Create lead (public)
GET /api/leads - Get user's leads
PUT /api/leads/{id}/status - Update lead status

GET/POST /api/campaigns - Campaigns CRUD
DELETE /api/campaigns/{id}

GET /api/analytics/overview - Dashboard analytics

POST /api/ai/generate - Generate caption/hashtags
POST /api/ai/generate-image - Generate AI image
```

## Next Tasks
1. Connect Instagram Business API for real posting
2. Implement post scheduling queue
3. Add email notifications (SendGrid/Resend)
4. Build template drag-drop editor
5. Add UTM tracking to landing page URLs
