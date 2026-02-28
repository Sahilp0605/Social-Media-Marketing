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

### Multi-User Workspace (NEW)
- ✅ **Multi-tenant architecture** with company_id isolation
- ✅ **Workspace roles**: Owner, Admin, Editor, Viewer
- ✅ **Role-based permissions**: Full access, manage campaigns/leads, create content, read-only
- ✅ User registration creates default company/workspace
- ✅ Invite team members via email
- ✅ Accept/decline workspace invitations
- ✅ Switch between multiple workspaces
- ✅ Update member roles (Owner only)
- ✅ Remove members from workspace

### Meta Graph API OAuth (NEW)
- ✅ OAuth flow endpoint (`/api/oauth/meta/url`)
- ✅ OAuth callback handler (`/api/oauth/meta/callback`)
- ✅ Long-lived token exchange
- ✅ Fetch Facebook Pages with Instagram Business accounts
- ✅ Connect Facebook/Instagram pages to workspace
- ✅ Real posting to Facebook Pages
- ✅ Real posting to Instagram Business (requires image URL)
- **Note**: Requires META_APP_ID, META_APP_SECRET, META_REDIRECT_URI in .env

### WhatsApp Business API (NEW)
- ✅ WhatsApp status endpoint
- ✅ WhatsApp settings management per workspace
- ✅ Send template messages to phone numbers
- ✅ Auto-notification on new lead capture
- ✅ Test WhatsApp connection
- **Note**: Requires WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN in .env

### Advanced Analytics (NEW)
- ✅ Detailed analytics with period filters (7d, 30d, 90d, all)
- ✅ Posts breakdown: total, published, scheduled, drafts
- ✅ Engagement metrics: views, clicks, likes, shares, CTR
- ✅ Platform breakdown by post count and engagement
- ✅ Landing page analytics: views, conversions, conversion rate
- ✅ Top performing landing pages
- ✅ Lead analytics by status
- ✅ Daily trend chart (7-day)

### Backend (FastAPI + MongoDB)
- ✅ User authentication (JWT + Emergent Google OAuth)
- ✅ Subscription system with 3 plans (Starter, Professional, Enterprise)
- ✅ 14-day Professional free trial for new users
- ✅ Plan-based feature limits
- ✅ Mock/Stripe payment toggle
- ✅ Posts CRUD API with platforms support + scheduling
- ✅ Templates CRUD API with canvas_data for editor
- ✅ Landing Pages CRUD API with slug generation
- ✅ Lead capture API (public endpoint) with WhatsApp notification
- ✅ Mock Social Accounts API - Connect, Sync, Test posting
- ✅ Post Scheduler API - Queue management, process scheduled posts
- ✅ Campaigns CRUD API
- ✅ AI content generation (Gemini 3 Flash)
- ✅ AI image generation (Gemini Nano Banana)

### Frontend (React + Tailwind)
- ✅ Landing page with features, pricing, platforms
- ✅ Login/Register with Google OAuth support
- ✅ Dashboard with analytics overview
- ✅ Subscription page with plan management
- ✅ Post Creator with AI caption/hashtag generation, scheduling
- ✅ Templates gallery with AI image generation
- ✅ Template Editor with Fabric.js (drag-drop)
- ✅ Landing Pages builder with live preview
- ✅ Public landing pages with lead capture forms
- ✅ Leads management CRM with status updates
- ✅ **Social Accounts** page with Mock + Real Meta OAuth
- ✅ **Workspace Settings** page with team management
- ✅ Campaigns manager
- ✅ **Advanced Analytics** dashboard with charts
- ✅ Settings page

### Environment Variables Required
```
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database

# Auth
JWT_SECRET=your_jwt_secret
EMERGENT_LLM_KEY=sk-emergent-xxx

# Payments
STRIPE_API_KEY=sk_test_xxx
PAYMENT_MODE=mock

# Meta (Facebook/Instagram)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://your-domain/api/oauth/meta/callback

# WhatsApp Business
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
```

### Subscription Plans
| Plan | Price | Limits |
|------|-------|--------|
| Free Trial | $0 (14 days) | 15 accounts, unlimited posts, 50 templates, 20 landing pages, 100 AI generations |
| Starter | $29/mo | 5 accounts, 100 posts/mo, 10 templates, 5 landing pages, No AI |
| Professional | $79/mo | 15 accounts, unlimited posts, 50 templates, 20 landing pages, 100 AI generations |
| Enterprise | $199/mo | Unlimited everything, White label, API access |

### Workspace Roles
| Role | Permissions |
|------|-------------|
| Owner | Full access, manage billing, transfer ownership |
| Admin | Manage campaigns, leads, invite members |
| Editor | Create posts, templates, schedule content |
| Viewer | Read-only analytics |

## API Endpoints Summary
```
# Auth
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout

# Workspace (NEW)
GET  /api/workspace
POST /api/workspace
PUT  /api/workspace/{company_id}
POST /api/workspace/switch/{company_id}
GET  /api/workspace/list
POST /api/workspace/invite
GET  /api/workspace/invites
POST /api/workspace/invites/{invite_id}/accept
PUT  /api/workspace/members/{member_id}/role
DELETE /api/workspace/members/{member_id}

# Meta OAuth (NEW)
GET  /api/oauth/meta/url
GET  /api/oauth/meta/callback
GET  /api/oauth/meta/pages
POST /api/oauth/meta/connect-page
POST /api/social-accounts/{id}/publish-real

# WhatsApp (NEW)
GET  /api/whatsapp/status
PUT  /api/whatsapp/settings
POST /api/whatsapp/send-template
POST /api/whatsapp/test

# Analytics (ENHANCED)
GET  /api/analytics/overview
GET  /api/analytics/detailed?period=7d|30d|90d|all

# Social Accounts
GET/POST /api/social-accounts
DELETE /api/social-accounts/{id}
POST /api/social-accounts/{id}/sync
POST /api/social-accounts/{id}/test-post

# Posts & Scheduler
GET/POST /api/posts
POST /api/posts/{id}/publish
GET  /api/scheduler/queue
POST /api/scheduler/process

# Templates, Landing Pages, Leads, Campaigns
(See previous documentation)
```

## Prioritized Backlog

### P0 - Critical (Next Sprint)
1. ~~Real social media API integration (Meta Graph API)~~ ✅ DONE
2. ~~Multi-user workspace support~~ ✅ DONE
3. ~~WhatsApp Business API integration~~ ✅ DONE
4. Auto-publish scheduled posts (background job/cron)
5. Email notifications for new leads (SendGrid/Resend)

### P1 - High Priority
1. Bulk scheduling feature
2. Template drag-drop improvements (layers, undo/redo)
3. UTM parameter tracking for landing pages
4. ~~Advanced analytics~~ ✅ DONE

### P2 - Medium Priority
1. Role-based UI restrictions (hide features based on role)
2. Activity logs per workspace
3. Advanced analytics (demographics, device data)
4. QR code generation for landing pages
5. A/B testing for landing pages

### P3 - Future Enhancements
1. Automation engine (if lead captured → send WhatsApp)
2. AI posting time recommendations
3. Shopify/CRM integrations
4. White-label support (Enterprise)
5. Mobile app

## Architecture Notes
- Backend: `server.py` is a monolith (~2800 lines). Consider splitting into modules:
  - `routers/auth.py`
  - `routers/workspace.py`
  - `routers/social.py`
  - `routers/posts.py`
  - `routers/analytics.py`
- Frontend: React with Tailwind + Shadcn UI components
- Database: MongoDB with collections:
  - users, companies, workspace_members, workspace_invites
  - posts, templates, landing_pages, leads
  - social_accounts, campaigns, ai_usage, payment_transactions
  - meta_oauth_pending

## Test Reports
- `/app/test_reports/iteration_1.json` through `iteration_5.json`
- All features tested with 100% pass rate
