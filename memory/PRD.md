# SocialFlow AI - Product Requirements Document

## Original Problem Statement
Build a Social Media Marketing Software platform where businesses can:
- Upload & publish posts/ads directly to Instagram / WhatsApp / Facebook / etc.
- Track engagement & user activity
- Capture leads from template/image clicks
- Redirect users to landing portal
- Store contact info in database
- Manage campaigns centrally

## What's Been Implemented (Feb 28, 2026)

### Subscription-Based Access Control (NEW)
- ✅ **Subscription status check** on all protected routes
- ✅ **SubscriptionGuard component** blocks expired users with upgrade prompt
- ✅ **Team member limits per plan**:
  - Free Trial: 3 members
  - Starter: 2 members
  - Professional: 10 members
  - Enterprise: Unlimited
- ✅ **Workspace invite checks** both subscription status AND team limit
- ✅ **Frontend displays** team member usage (X/Y format)
- ✅ **Invite button disabled** when limit reached with upgrade prompt
- ✅ **Bypass for Subscription/Settings pages** (allow expired users to upgrade)

### Multi-User Workspace
- ✅ Multi-tenant architecture with company_id isolation
- ✅ Workspace roles: Owner, Admin, Editor, Viewer
- ✅ Role-based permissions
- ✅ Invite members, accept/decline invites
- ✅ Switch workspaces, manage team

### Meta Graph API OAuth (Instagram/Facebook)
- ✅ OAuth flow for Facebook Pages + Instagram Business
- ✅ Long-lived token exchange
- ✅ Real posting endpoints
- **Note**: Requires META_APP_ID, META_APP_SECRET, META_REDIRECT_URI

### WhatsApp Business API
- ✅ Send template messages
- ✅ Auto-notification on lead capture
- **Note**: Requires WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN

### Core Features
- ✅ User authentication (JWT + Google OAuth)
- ✅ Subscription system (Starter $29, Professional $79, Enterprise $199)
- ✅ 14-day free trial
- ✅ Mock/Stripe payment toggle
- ✅ Posts with scheduling
- ✅ Templates with Fabric.js editor
- ✅ Landing pages with lead capture
- ✅ Lead management CRM
- ✅ Social accounts (mock + real OAuth)
- ✅ Advanced analytics
- ✅ AI content generation (Gemini)

### Subscription Plans
| Plan | Price | Team Members | Posts | Templates | Landing Pages | AI |
|------|-------|--------------|-------|-----------|---------------|-----|
| Free Trial | $0 (14 days) | 3 | Unlimited | 50 | 20 | 100/mo |
| Starter | $29/mo | 2 | 100/mo | 10 | 5 | None |
| Professional | $79/mo | 10 | Unlimited | 50 | 20 | 100/mo |
| Enterprise | $199/mo | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited |

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

## Key API Endpoints
```
# Subscription
GET  /api/subscription - Returns plan, subscription_status, usage (including team_members)
GET  /api/plans - Returns all plans with team_members limits

# Workspace
POST /api/workspace/invite - Checks subscription + team limit before inviting

# All protected routes check subscription via SubscriptionGuard
```

## Prioritized Backlog

### P0 - Critical
1. ~~Subscription-based access control~~ ✅ DONE
2. Auto-publish scheduled posts (background job)
3. Email notifications for new leads

### P1 - High Priority
1. Role-based UI restrictions (hide features based on role)
2. Bulk scheduling feature
3. Template editor improvements

### P2 - Medium Priority
1. Activity logs per workspace
2. Advanced analytics (demographics)
3. QR codes for landing pages

## Test Reports
- `/app/test_reports/iteration_1.json` through `iteration_6.json`
- All features tested with 100% pass rate
