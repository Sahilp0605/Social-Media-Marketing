from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Literal
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import base64
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'socialflow_secret_key')
JWT_ALGORITHM = "HS256"

# Payment Configuration
PAYMENT_MODE = os.environ.get('PAYMENT_MODE', 'mock')  # 'mock' or 'stripe'
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# Meta (Facebook/Instagram) Configuration
META_APP_ID = os.environ.get('META_APP_ID', '')
META_APP_SECRET = os.environ.get('META_APP_SECRET', '')
META_REDIRECT_URI = os.environ.get('META_REDIRECT_URI', '')

# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER_ID = os.environ.get('WHATSAPP_PHONE_NUMBER_ID', '')
WHATSAPP_ACCESS_TOKEN = os.environ.get('WHATSAPP_ACCESS_TOKEN', '')

# Create the main app
app = FastAPI(title="SocialFlow AI API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================== WORKSPACE ROLES ==================

class WorkspaceRole(str, Enum):
    OWNER = "owner"      # Full access
    ADMIN = "admin"      # Manage campaigns & leads
    EDITOR = "editor"    # Create posts
    VIEWER = "viewer"    # Read-only analytics

ROLE_PERMISSIONS = {
    WorkspaceRole.OWNER: ["*"],  # All permissions
    WorkspaceRole.ADMIN: ["read", "write", "manage_campaigns", "manage_leads", "manage_members", "view_analytics"],
    WorkspaceRole.EDITOR: ["read", "write", "create_posts", "create_templates", "view_analytics"],
    WorkspaceRole.VIEWER: ["read", "view_analytics"]
}

# ================== PLAN CONFIGURATION ==================

PLANS = {
    "free": {
        "name": "Free Trial",
        "price": 0,
        "duration_days": 14,
        "limits": {
            "social_accounts": 15,
            "posts_per_month": -1,  # unlimited during trial
            "templates": 50,
            "landing_pages": 20,
            "ai_generations_per_month": 100,
            "ai_content": True,
            "lead_capture": True,
            "analytics": "advanced",
            "support": "priority"
        }
    },
    "starter": {
        "name": "Starter",
        "price": 29.00,
        "limits": {
            "social_accounts": 5,
            "posts_per_month": 100,
            "templates": 10,
            "landing_pages": 5,
            "ai_generations_per_month": 0,
            "ai_content": False,
            "lead_capture": False,
            "analytics": "basic",
            "support": "email"
        }
    },
    "professional": {
        "name": "Professional",
        "price": 79.00,
        "limits": {
            "social_accounts": 15,
            "posts_per_month": -1,  # unlimited
            "templates": 50,
            "landing_pages": 20,
            "ai_generations_per_month": 100,
            "ai_content": True,
            "lead_capture": True,
            "analytics": "advanced",
            "support": "priority"
        }
    },
    "enterprise": {
        "name": "Enterprise",
        "price": 199.00,
        "limits": {
            "social_accounts": -1,  # unlimited
            "posts_per_month": -1,
            "templates": -1,
            "landing_pages": -1,
            "ai_generations_per_month": -1,
            "ai_content": True,
            "lead_capture": True,
            "analytics": "advanced",
            "white_label": True,
            "api_access": True,
            "support": "dedicated"
        }
    }
}

# ================== MODELS ==================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"
    plan: str = "free"
    plan_expires_at: Optional[str] = None
    created_at: str

class PostCreate(BaseModel):
    title: str
    caption: str
    hashtags: List[str] = []
    platforms: List[str] = []
    image_url: Optional[str] = None
    scheduled_at: Optional[str] = None
    status: str = "draft"

class PostResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    post_id: str
    user_id: str
    title: str
    caption: str
    hashtags: List[str]
    platforms: List[str]
    image_url: Optional[str]
    scheduled_at: Optional[str]
    status: str
    views: int = 0
    clicks: int = 0
    likes: int = 0
    shares: int = 0
    created_at: str

class TemplateCreate(BaseModel):
    name: str
    category: str
    image_url: str
    description: Optional[str] = None
    canvas_data: Optional[str] = None  # JSON string for fabric.js canvas

class TemplateResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    template_id: str
    user_id: str
    name: str
    category: str
    image_url: str
    description: Optional[str]
    canvas_data: Optional[str] = None
    is_ai_generated: bool = False
    created_at: str

class LandingPageCreate(BaseModel):
    name: str
    headline: str
    description: str
    cta_text: str = "Get Started"
    template_id: Optional[str] = None
    background_color: str = "#4F46E5"
    text_color: str = "#FFFFFF"

class LandingPageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    page_id: str
    user_id: str
    name: str
    headline: str
    description: str
    cta_text: str
    template_id: Optional[str]
    background_color: str
    text_color: str
    slug: str
    views: int = 0
    conversions: int = 0
    created_at: str

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: Optional[str] = None
    page_id: str

class LeadResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    lead_id: str
    page_id: str
    name: str
    email: str
    phone: Optional[str]
    message: Optional[str]
    status: str = "new"
    created_at: str

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: str
    end_date: str
    platforms: List[str] = []
    budget: Optional[float] = None

class CampaignResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    campaign_id: str
    user_id: str
    name: str
    description: Optional[str]
    start_date: str
    end_date: str
    platforms: List[str]
    budget: Optional[float]
    status: str = "active"
    created_at: str

class SocialAccountCreate(BaseModel):
    platform: str
    account_name: str
    account_id: Optional[str] = None

class SocialAccountResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    account_id: str
    user_id: str
    platform: str
    account_name: str
    external_id: Optional[str]
    is_connected: bool = True
    followers_count: Optional[int] = 0
    following_count: Optional[int] = 0
    posts_count: Optional[int] = 0
    engagement_rate: Optional[float] = 0.0
    last_synced_at: Optional[str] = None
    created_at: str

class AIGenerateRequest(BaseModel):
    prompt: str
    type: str  # "caption", "hashtags", "image"

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class UsageResponse(BaseModel):
    posts_this_month: int
    posts_limit: int
    templates_count: int
    templates_limit: int
    landing_pages_count: int
    landing_pages_limit: int
    ai_generations_this_month: int
    ai_generations_limit: int
    social_accounts_count: int
    social_accounts_limit: int

# ================== WORKSPACE MODELS ==================

class CompanyCreate(BaseModel):
    name: str
    industry: Optional[str] = None

class CompanyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    company_id: str
    name: str
    industry: Optional[str]
    owner_id: str
    plan: str = "free"
    plan_expires_at: Optional[str] = None
    created_at: str

class WorkspaceMemberCreate(BaseModel):
    email: EmailStr
    role: str = "viewer"

class WorkspaceMemberResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    member_id: str
    company_id: str
    user_id: str
    email: str
    name: str
    role: str
    invited_by: str
    status: str = "active"
    created_at: str

class WorkspaceInviteCreate(BaseModel):
    email: EmailStr
    role: str = "viewer"

class WorkspaceInviteResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    invite_id: str
    company_id: str
    email: str
    role: str
    invited_by: str
    status: str = "pending"
    created_at: str
    expires_at: str

# ================== META OAUTH MODELS ==================

class MetaOAuthCallback(BaseModel):
    code: str
    state: Optional[str] = None

class MetaPageSelect(BaseModel):
    page_id: str
    page_name: str
    access_token: str
    instagram_business_id: Optional[str] = None

# ================== WHATSAPP MODELS ==================

class WhatsAppTemplateMessage(BaseModel):
    to_phone: str
    template_name: str
    language_code: str = "en"
    components: Optional[List[Dict]] = None

class WhatsAppNotificationSettings(BaseModel):
    enabled: bool = True
    on_new_lead: bool = True
    on_post_published: bool = False
    template_name: str = "lead_notification"

# ================== AUTH HELPERS ==================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    # Check cookie first, then Authorization header
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check session in database
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Get user's active company context
    company_id = user.get("active_company_id")
    if company_id:
        membership = await db.workspace_members.find_one(
            {"user_id": user["user_id"], "company_id": company_id, "status": "active"},
            {"_id": 0}
        )
        if membership:
            user["company_id"] = company_id
            user["workspace_role"] = membership.get("role", "viewer")
        else:
            # User no longer has access to this company
            user["company_id"] = None
            user["workspace_role"] = None
    
    return user

async def get_current_user_with_company(request: Request) -> dict:
    """Get current user and ensure they have an active company"""
    user = await get_current_user(request)
    if not user.get("company_id"):
        raise HTTPException(status_code=400, detail="No active workspace. Please create or join a company.")
    return user

def check_permission(user: dict, permission: str) -> bool:
    """Check if user has specific permission in current workspace"""
    role = user.get("workspace_role")
    if not role:
        return False
    
    role_enum = WorkspaceRole(role) if role in [r.value for r in WorkspaceRole] else None
    if not role_enum:
        return False
    
    permissions = ROLE_PERMISSIONS.get(role_enum, [])
    return "*" in permissions or permission in permissions

def require_permission(permission: str):
    """Dependency to require specific permission"""
    async def check(user: dict = Depends(get_current_user_with_company)):
        if not check_permission(user, permission):
            raise HTTPException(status_code=403, detail=f"Permission denied: {permission}")
        return user
    return check

# ================== PLAN HELPERS ==================

async def get_user_plan(user: dict) -> dict:
    """Get user's current plan with limits"""
    plan_id = user.get("plan", "free")
    plan_expires_at = user.get("plan_expires_at")
    
    # Check if plan has expired
    if plan_expires_at:
        if isinstance(plan_expires_at, str):
            plan_expires_at = datetime.fromisoformat(plan_expires_at)
        if plan_expires_at.tzinfo is None:
            plan_expires_at = plan_expires_at.replace(tzinfo=timezone.utc)
        
        if plan_expires_at < datetime.now(timezone.utc):
            # Plan expired, revert to limited free
            plan_id = "expired"
            return {
                "plan_id": "expired",
                "name": "Expired",
                "limits": {
                    "social_accounts": 1,
                    "posts_per_month": 10,
                    "templates": 3,
                    "landing_pages": 1,
                    "ai_generations_per_month": 0,
                    "ai_content": False,
                    "lead_capture": False,
                    "analytics": "basic",
                    "support": "email"
                }
            }
    
    plan = PLANS.get(plan_id, PLANS["free"])
    return {"plan_id": plan_id, **plan}

async def get_user_usage(user_id: str) -> dict:
    """Get user's current usage stats"""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Count posts this month
    posts_count = await db.posts.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": month_start.isoformat()}
    })
    
    # Count templates
    templates_count = await db.templates.count_documents({"user_id": user_id})
    
    # Count landing pages
    landing_pages_count = await db.landing_pages.count_documents({"user_id": user_id})
    
    # Count AI generations this month
    ai_generations = await db.ai_usage.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": month_start.isoformat()}
    })
    
    # Count social accounts
    social_accounts_count = await db.social_accounts.count_documents({"user_id": user_id})
    
    return {
        "posts_this_month": posts_count,
        "templates_count": templates_count,
        "landing_pages_count": landing_pages_count,
        "ai_generations_this_month": ai_generations,
        "social_accounts_count": social_accounts_count
    }

async def check_plan_limit(user: dict, resource: str, current_count: int = None) -> bool:
    """Check if user can perform action based on plan limits"""
    plan = await get_user_plan(user)
    limits = plan.get("limits", {})
    
    if resource == "posts":
        limit = limits.get("posts_per_month", 0)
        if limit == -1:
            return True
        usage = await get_user_usage(user["user_id"])
        return usage["posts_this_month"] < limit
    
    elif resource == "templates":
        limit = limits.get("templates", 0)
        if limit == -1:
            return True
        if current_count is not None:
            return current_count < limit
        usage = await get_user_usage(user["user_id"])
        return usage["templates_count"] < limit
    
    elif resource == "landing_pages":
        limit = limits.get("landing_pages", 0)
        if limit == -1:
            return True
        if current_count is not None:
            return current_count < limit
        usage = await get_user_usage(user["user_id"])
        return usage["landing_pages_count"] < limit
    
    elif resource == "ai_generations":
        limit = limits.get("ai_generations_per_month", 0)
        if limit == -1:
            return True
        if not limits.get("ai_content", False):
            return False
        usage = await get_user_usage(user["user_id"])
        return usage["ai_generations_this_month"] < limit
    
    elif resource == "social_accounts":
        limit = limits.get("social_accounts", 0)
        if limit == -1:
            return True
        if current_count is not None:
            return current_count < limit
        usage = await get_user_usage(user["user_id"])
        return usage["social_accounts_count"] < limit
    
    elif resource == "lead_capture":
        return limits.get("lead_capture", False)
    
    return False

async def track_ai_usage(user_id: str, usage_type: str):
    """Track AI generation usage"""
    await db.ai_usage.insert_one({
        "user_id": user_id,
        "type": usage_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    company_id = f"company_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    # Set free trial expiry (14 days)
    trial_expires = (now + timedelta(days=14)).isoformat()
    
    # Create user's default company (workspace)
    company_doc = {
        "company_id": company_id,
        "name": f"{user_data.name}'s Workspace",
        "industry": None,
        "owner_id": user_id,
        "plan": "free",
        "plan_expires_at": trial_expires,
        "whatsapp_settings": {
            "enabled": False,
            "on_new_lead": True,
            "on_post_published": False,
            "template_name": "lead_notification"
        },
        "created_at": now.isoformat()
    }
    await db.companies.insert_one(company_doc)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "role": "user",
        "plan": "free",
        "plan_expires_at": trial_expires,
        "active_company_id": company_id,
        "created_at": now.isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Add user as owner of the company
    member_doc = {
        "member_id": f"member_{uuid.uuid4().hex[:12]}",
        "company_id": company_id,
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": "owner",
        "invited_by": user_id,
        "status": "active",
        "created_at": now.isoformat()
    }
    await db.workspace_members.insert_one(member_doc)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (now + timedelta(days=7)).isoformat(),
        "created_at": now.isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "picture": None,
        "role": "user",
        "plan": "free",
        "plan_expires_at": trial_expires,
        "company_id": company_id,
        "workspace_role": "owner",
        "created_at": now.isoformat()
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc).isoformat()
    session_doc = {
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": now
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    # Get workspace role if user has active company
    company_id = user.get("active_company_id")
    workspace_role = None
    if company_id:
        membership = await db.workspace_members.find_one(
            {"user_id": user["user_id"], "company_id": company_id, "status": "active"},
            {"_id": 0}
        )
        if membership:
            workspace_role = membership.get("role")
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "role": user.get("role", "user"),
        "plan": user.get("plan", "free"),
        "plan_expires_at": user.get("plan_expires_at"),
        "company_id": company_id,
        "workspace_role": workspace_role,
        "created_at": user["created_at"]
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent OAuth session_id for session token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent OAuth to get user data
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if res.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        oauth_data = res.json()
    
    # Check if user exists, create if not
    user = await db.users.find_one({"email": oauth_data["email"]}, {"_id": 0})
    now = datetime.now(timezone.utc)
    
    company_id = None
    workspace_role = None
    
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        company_id = f"company_{uuid.uuid4().hex[:12]}"
        trial_expires = (now + timedelta(days=14)).isoformat()
        
        # Create default company for OAuth user
        company_doc = {
            "company_id": company_id,
            "name": f"{oauth_data['name']}'s Workspace",
            "industry": None,
            "owner_id": user_id,
            "plan": "free",
            "plan_expires_at": trial_expires,
            "whatsapp_settings": {
                "enabled": False,
                "on_new_lead": True,
                "on_post_published": False,
                "template_name": "lead_notification"
            },
            "created_at": now.isoformat()
        }
        await db.companies.insert_one(company_doc)
        
        user = {
            "user_id": user_id,
            "email": oauth_data["email"],
            "name": oauth_data["name"],
            "picture": oauth_data.get("picture"),
            "role": "user",
            "plan": "free",
            "plan_expires_at": trial_expires,
            "active_company_id": company_id,
            "created_at": now.isoformat()
        }
        await db.users.insert_one(user)
        
        # Add user as owner of the company
        member_doc = {
            "member_id": f"member_{uuid.uuid4().hex[:12]}",
            "company_id": company_id,
            "user_id": user_id,
            "email": oauth_data["email"],
            "name": oauth_data["name"],
            "role": "owner",
            "invited_by": user_id,
            "status": "active",
            "created_at": now.isoformat()
        }
        await db.workspace_members.insert_one(member_doc)
        workspace_role = "owner"
    else:
        user_id = user["user_id"]
        company_id = user.get("active_company_id")
        # Update picture if changed
        if oauth_data.get("picture") != user.get("picture"):
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"picture": oauth_data.get("picture")}}
            )
            user["picture"] = oauth_data.get("picture")
        
        # Get workspace role
        if company_id:
            membership = await db.workspace_members.find_one(
                {"user_id": user_id, "company_id": company_id, "status": "active"},
                {"_id": 0}
            )
            if membership:
                workspace_role = membership.get("role")
    
    # Create local session
    session_token = oauth_data.get("session_token", f"session_{uuid.uuid4().hex}")
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (now + timedelta(days=7)).isoformat(),
        "created_at": now.isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user_id,
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "role": user.get("role", "user"),
        "plan": user.get("plan", "free"),
        "plan_expires_at": user.get("plan_expires_at"),
        "company_id": company_id,
        "workspace_role": workspace_role,
        "created_at": user["created_at"]
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "role": user.get("role", "user"),
        "plan": user.get("plan", "free"),
        "plan_expires_at": user.get("plan_expires_at"),
        "company_id": user.get("company_id"),
        "workspace_role": user.get("workspace_role"),
        "created_at": user["created_at"]
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ================== SUBSCRIPTION ROUTES ==================

@api_router.get("/plans")
async def get_plans():
    """Get all available plans"""
    return {
        "plans": [
            {"id": "starter", **PLANS["starter"]},
            {"id": "professional", **PLANS["professional"]},
            {"id": "enterprise", **PLANS["enterprise"]}
        ],
        "payment_mode": PAYMENT_MODE
    }

@api_router.get("/subscription")
async def get_subscription(user: dict = Depends(get_current_user)):
    """Get user's current subscription"""
    plan = await get_user_plan(user)
    usage = await get_user_usage(user["user_id"])
    limits = plan.get("limits", {})
    
    return {
        "plan": plan,
        "usage": {
            "posts_this_month": usage["posts_this_month"],
            "posts_limit": limits.get("posts_per_month", 0),
            "templates_count": usage["templates_count"],
            "templates_limit": limits.get("templates", 0),
            "landing_pages_count": usage["landing_pages_count"],
            "landing_pages_limit": limits.get("landing_pages", 0),
            "ai_generations_this_month": usage["ai_generations_this_month"],
            "ai_generations_limit": limits.get("ai_generations_per_month", 0),
            "social_accounts_count": usage["social_accounts_count"],
            "social_accounts_limit": limits.get("social_accounts", 0)
        },
        "expires_at": user.get("plan_expires_at")
    }

@api_router.post("/subscription/checkout")
async def create_checkout(req: CheckoutRequest, request: Request, user: dict = Depends(get_current_user)):
    """Create checkout session for plan upgrade"""
    if req.plan_id not in PLANS or req.plan_id == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = PLANS[req.plan_id]
    amount = plan["price"]
    
    now = datetime.now(timezone.utc)
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    
    if PAYMENT_MODE == "mock":
        # Mock payment - create pending transaction
        await db.payment_transactions.insert_one({
            "transaction_id": transaction_id,
            "user_id": user["user_id"],
            "plan_id": req.plan_id,
            "amount": amount,
            "currency": "usd",
            "status": "pending",
            "payment_status": "pending",
            "session_id": f"mock_session_{uuid.uuid4().hex[:8]}",
            "created_at": now.isoformat()
        })
        
        # Return mock checkout URL
        success_url = f"{req.origin_url}/subscription/success?session_id={transaction_id}"
        return {
            "url": success_url,
            "session_id": transaction_id,
            "mode": "mock"
        }
    else:
        # Stripe payment
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        success_url = f"{req.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{req.origin_url}/subscription"
        
        checkout_req = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user["user_id"],
                "plan_id": req.plan_id,
                "transaction_id": transaction_id
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_req)
        
        # Create pending transaction
        await db.payment_transactions.insert_one({
            "transaction_id": transaction_id,
            "user_id": user["user_id"],
            "plan_id": req.plan_id,
            "amount": amount,
            "currency": "usd",
            "status": "pending",
            "payment_status": "pending",
            "session_id": session.session_id,
            "created_at": now.isoformat()
        })
        
        return {
            "url": session.url,
            "session_id": session.session_id,
            "mode": "stripe"
        }

@api_router.get("/subscription/status/{session_id}")
async def get_checkout_status(session_id: str, user: dict = Depends(get_current_user)):
    """Get checkout session status and activate plan if paid"""
    # Find transaction
    transaction = await db.payment_transactions.find_one(
        {"$or": [{"session_id": session_id}, {"transaction_id": session_id}]},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check if already processed
    if transaction.get("payment_status") == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "plan_id": transaction.get("plan_id")
        }
    
    if PAYMENT_MODE == "mock":
        # Mock mode - auto-complete payment
        now = datetime.now(timezone.utc)
        plan_expires = (now + timedelta(days=30)).isoformat()
        
        # Update transaction
        await db.payment_transactions.update_one(
            {"transaction_id": transaction.get("transaction_id", session_id)},
            {"$set": {"status": "complete", "payment_status": "paid"}}
        )
        
        # Upgrade user plan
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {
                "plan": transaction["plan_id"],
                "plan_expires_at": plan_expires
            }}
        )
        
        return {
            "status": "complete",
            "payment_status": "paid",
            "plan_id": transaction["plan_id"]
        }
    else:
        # Stripe - check actual status
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        
        if status.payment_status == "paid":
            now = datetime.now(timezone.utc)
            plan_expires = (now + timedelta(days=30)).isoformat()
            
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "complete", "payment_status": "paid"}}
            )
            
            # Upgrade user plan
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {
                    "plan": transaction["plan_id"],
                    "plan_expires_at": plan_expires
                }}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "plan_id": transaction["plan_id"] if status.payment_status == "paid" else None
        }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    if PAYMENT_MODE == "mock":
        return {"status": "ignored"}
    
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            # Find and update transaction
            transaction = await db.payment_transactions.find_one(
                {"session_id": event.session_id},
                {"_id": 0}
            )
            
            if transaction and transaction.get("payment_status") != "paid":
                now = datetime.now(timezone.utc)
                plan_expires = (now + timedelta(days=30)).isoformat()
                
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"status": "complete", "payment_status": "paid"}}
                )
                
                await db.users.update_one(
                    {"user_id": transaction["user_id"]},
                    {"$set": {
                        "plan": transaction["plan_id"],
                        "plan_expires_at": plan_expires
                    }}
                )
        
        return {"status": "processed"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

@api_router.get("/admin/payment-mode")
async def get_payment_mode():
    """Get current payment mode"""
    return {"mode": PAYMENT_MODE}

@api_router.post("/admin/payment-mode")
async def set_payment_mode(mode: str):
    """Set payment mode (mock/stripe) - Admin only"""
    global PAYMENT_MODE
    if mode not in ["mock", "stripe"]:
        raise HTTPException(status_code=400, detail="Invalid mode")
    PAYMENT_MODE = mode
    # Also update .env file
    return {"mode": PAYMENT_MODE}

# ================== SOCIAL ACCOUNTS ROUTES ==================

@api_router.post("/social-accounts", response_model=SocialAccountResponse)
async def create_social_account(account: SocialAccountCreate, user: dict = Depends(get_current_user)):
    # Check plan limit
    if not await check_plan_limit(user, "social_accounts"):
        raise HTTPException(status_code=403, detail="Social accounts limit reached. Please upgrade your plan.")
    
    account_id = f"sa_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    account_doc = {
        "account_id": account_id,
        "user_id": user["user_id"],
        "platform": account.platform,
        "account_name": account.account_name,
        "external_id": account.account_id or f"mock_{uuid.uuid4().hex[:8]}",
        "is_connected": True,
        "access_token": f"mock_token_{uuid.uuid4().hex[:16]}",  # Mock token
        "followers_count": 0,  # Will be updated by mock sync
        "last_synced_at": now,
        "created_at": now
    }
    await db.social_accounts.insert_one(account_doc)
    return SocialAccountResponse(**account_doc)

@api_router.get("/social-accounts", response_model=List[SocialAccountResponse])
async def get_social_accounts(user: dict = Depends(get_current_user)):
    accounts = await db.social_accounts.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return [SocialAccountResponse(**a) for a in accounts]

@api_router.delete("/social-accounts/{account_id}")
async def delete_social_account(account_id: str, user: dict = Depends(get_current_user)):
    result = await db.social_accounts.delete_one({"account_id": account_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account disconnected"}

@api_router.post("/social-accounts/{account_id}/sync")
async def sync_social_account(account_id: str, user: dict = Depends(get_current_user)):
    """Mock sync social account - simulates fetching latest stats from platform"""
    account = await db.social_accounts.find_one(
        {"account_id": account_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Simulate API response with random stats
    import random
    mock_stats = {
        "followers_count": random.randint(100, 50000),
        "following_count": random.randint(50, 1000),
        "posts_count": random.randint(10, 500),
        "engagement_rate": round(random.uniform(1.5, 8.5), 2),
        "last_synced_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.social_accounts.update_one(
        {"account_id": account_id},
        {"$set": mock_stats}
    )
    
    return {
        "message": "Account synced successfully (mock)",
        "stats": mock_stats
    }

@api_router.post("/social-accounts/{account_id}/test-post")
async def test_post_to_account(account_id: str, user: dict = Depends(get_current_user)):
    """Mock test post - simulates posting a test message to the platform"""
    account = await db.social_accounts.find_one(
        {"account_id": account_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Simulate successful test post
    import random
    mock_response = {
        "success": True,
        "platform": account["platform"],
        "account_name": account["account_name"],
        "test_post_id": f"test_{uuid.uuid4().hex[:12]}",
        "message": f"Test post to {account['platform']} successful!",
        "simulated_reach": random.randint(100, 5000),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    return mock_response

# ================== POSTS ROUTES ==================

@api_router.post("/posts", response_model=PostResponse)
async def create_post(post: PostCreate, user: dict = Depends(get_current_user)):
    # Check plan limit
    if not await check_plan_limit(user, "posts"):
        raise HTTPException(status_code=403, detail="Posts limit reached. Please upgrade your plan.")
    
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Determine status based on scheduled_at
    status = post.status
    if post.scheduled_at:
        # Parse scheduled time and check if it's in the future
        try:
            scheduled_dt = datetime.fromisoformat(post.scheduled_at.replace('Z', '+00:00'))
            if scheduled_dt.tzinfo is None:
                scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
            if scheduled_dt > datetime.now(timezone.utc):
                status = "scheduled"
        except (ValueError, TypeError):
            pass  # Keep original status if parsing fails
    
    post_doc = {
        "post_id": post_id,
        "user_id": user["user_id"],
        "title": post.title,
        "caption": post.caption,
        "hashtags": post.hashtags,
        "platforms": post.platforms,
        "image_url": post.image_url,
        "scheduled_at": post.scheduled_at,
        "status": status,
        "views": 0,
        "clicks": 0,
        "likes": 0,
        "shares": 0,
        "created_at": now
    }
    await db.posts.insert_one(post_doc)
    return PostResponse(**post_doc)

@api_router.get("/posts", response_model=List[PostResponse])
async def get_posts(user: dict = Depends(get_current_user)):
    posts = await db.posts.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [PostResponse(**p) for p in posts]

@api_router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: str, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"post_id": post_id, "user_id": user["user_id"]}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostResponse(**post)

@api_router.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(post_id: str, post: PostCreate, user: dict = Depends(get_current_user)):
    existing = await db.posts.find_one({"post_id": post_id, "user_id": user["user_id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    
    update_data = post.model_dump()
    await db.posts.update_one({"post_id": post_id}, {"$set": update_data})
    updated = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    return PostResponse(**updated)

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    result = await db.posts.delete_one({"post_id": post_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted"}

@api_router.post("/posts/{post_id}/publish")
async def publish_post(post_id: str, user: dict = Depends(get_current_user)):
    """Mock publish post to social platforms"""
    post = await db.posts.find_one({"post_id": post_id, "user_id": user["user_id"]}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get user's connected accounts for selected platforms
    connected_accounts = await db.social_accounts.find(
        {"user_id": user["user_id"], "platform": {"$in": post.get("platforms", [])}},
        {"_id": 0}
    ).to_list(100)
    
    # Mock publishing - simulate API calls
    import random
    results = []
    for platform in post.get("platforms", []):
        # Find connected account for this platform
        account = next((a for a in connected_accounts if a["platform"] == platform), None)
        
        # Simulate successful publishing
        results.append({
            "platform": platform,
            "status": "published",
            "account_name": account["account_name"] if account else "Demo Account",
            "external_id": f"{platform}_{uuid.uuid4().hex[:8]}",
            "external_url": f"https://{platform}.com/p/{uuid.uuid4().hex[:12]}",
            "simulated_reach": random.randint(500, 10000),
            "published_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Update post status
    await db.posts.update_one(
        {"post_id": post_id},
        {"$set": {
            "status": "published",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "publish_results": results
        }}
    )
    
    return {
        "message": "Post published successfully (mock)",
        "results": results
    }

@api_router.get("/posts/scheduled/pending")
async def get_pending_scheduled_posts(user: dict = Depends(get_current_user)):
    """Get posts that are scheduled and pending publication"""
    now = datetime.now(timezone.utc).isoformat()
    posts = await db.posts.find({
        "user_id": user["user_id"],
        "status": "scheduled",
        "scheduled_at": {"$lte": now}
    }, {"_id": 0}).to_list(100)
    return [PostResponse(**p) for p in posts]

@api_router.post("/scheduler/process")
async def process_scheduled_posts(user: dict = Depends(get_current_user)):
    """Process and publish all due scheduled posts for the user"""
    now = datetime.now(timezone.utc)
    
    # Find posts that are scheduled and due
    posts = await db.posts.find({
        "user_id": user["user_id"],
        "status": "scheduled",
        "scheduled_at": {"$ne": None}
    }, {"_id": 0}).to_list(1000)
    
    published_count = 0
    results = []
    
    for post in posts:
        scheduled_at = post.get("scheduled_at")
        if not scheduled_at:
            continue
            
        try:
            if isinstance(scheduled_at, str):
                # Handle various datetime formats
                scheduled_dt = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
            else:
                scheduled_dt = scheduled_at
                
            if scheduled_dt.tzinfo is None:
                scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
            
            # Check if post is due
            if scheduled_dt <= now:
                # Get connected accounts for platforms
                connected_accounts = await db.social_accounts.find(
                    {"user_id": user["user_id"], "platform": {"$in": post.get("platforms", [])}},
                    {"_id": 0}
                ).to_list(100)
                
                # Mock publish results
                import random
                publish_results = []
                for platform in post.get("platforms", []):
                    account = next((a for a in connected_accounts if a["platform"] == platform), None)
                    publish_results.append({
                        "platform": platform,
                        "status": "published",
                        "account_name": account["account_name"] if account else "Demo Account",
                        "external_id": f"{platform}_{uuid.uuid4().hex[:8]}",
                        "external_url": f"https://{platform}.com/p/{uuid.uuid4().hex[:12]}",
                        "simulated_reach": random.randint(500, 10000),
                        "published_at": now.isoformat()
                    })
                
                # Update post status
                await db.posts.update_one(
                    {"post_id": post["post_id"]},
                    {"$set": {
                        "status": "published",
                        "published_at": now.isoformat(),
                        "publish_results": publish_results
                    }}
                )
                
                published_count += 1
                results.append({
                    "post_id": post["post_id"],
                    "title": post["title"],
                    "platforms": post.get("platforms", []),
                    "publish_results": publish_results
                })
                
        except (ValueError, TypeError) as e:
            logger.error(f"Error processing scheduled post {post['post_id']}: {e}")
            continue
    
    return {
        "message": f"Processed {published_count} scheduled posts (mock)",
        "published_count": published_count,
        "results": results
    }

@api_router.get("/scheduler/queue")
async def get_scheduler_queue(user: dict = Depends(get_current_user)):
    """Get all scheduled posts with their due times"""
    posts = await db.posts.find({
        "user_id": user["user_id"],
        "status": "scheduled"
    }, {"_id": 0}).sort("scheduled_at", 1).to_list(100)
    
    now = datetime.now(timezone.utc)
    queue = []
    
    for post in posts:
        scheduled_at = post.get("scheduled_at")
        if not scheduled_at:
            continue
            
        try:
            if isinstance(scheduled_at, str):
                scheduled_dt = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
            else:
                scheduled_dt = scheduled_at
                
            if scheduled_dt.tzinfo is None:
                scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
            
            is_due = scheduled_dt <= now
            time_until = (scheduled_dt - now).total_seconds() if not is_due else 0
            
            queue.append({
                "post_id": post["post_id"],
                "title": post["title"],
                "platforms": post.get("platforms", []),
                "scheduled_at": scheduled_at,
                "is_due": is_due,
                "time_until_due_seconds": max(0, time_until)
            })
        except (ValueError, TypeError):
            continue
    
    return {
        "queue": queue,
        "total_scheduled": len(queue),
        "due_now": len([q for q in queue if q["is_due"]])
    }

# ================== TEMPLATES ROUTES ==================

@api_router.post("/templates", response_model=TemplateResponse)
async def create_template(template: TemplateCreate, user: dict = Depends(get_current_user)):
    # Check plan limit
    if not await check_plan_limit(user, "templates"):
        raise HTTPException(status_code=403, detail="Templates limit reached. Please upgrade your plan.")
    
    template_id = f"tpl_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    template_doc = {
        "template_id": template_id,
        "user_id": user["user_id"],
        "name": template.name,
        "category": template.category,
        "image_url": template.image_url,
        "description": template.description,
        "canvas_data": template.canvas_data,
        "is_ai_generated": False,
        "created_at": now
    }
    await db.templates.insert_one(template_doc)
    return TemplateResponse(**template_doc)

@api_router.get("/templates", response_model=List[TemplateResponse])
async def get_templates(user: dict = Depends(get_current_user)):
    templates = await db.templates.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    return [TemplateResponse(**t) for t in templates]

@api_router.get("/templates/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str, user: dict = Depends(get_current_user)):
    template = await db.templates.find_one({"template_id": template_id, "user_id": user["user_id"]}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return TemplateResponse(**template)

@api_router.put("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(template_id: str, template: TemplateCreate, user: dict = Depends(get_current_user)):
    existing = await db.templates.find_one({"template_id": template_id, "user_id": user["user_id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template.model_dump()
    await db.templates.update_one({"template_id": template_id}, {"$set": update_data})
    updated = await db.templates.find_one({"template_id": template_id}, {"_id": 0})
    return TemplateResponse(**updated)

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user: dict = Depends(get_current_user)):
    result = await db.templates.delete_one({"template_id": template_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

# ================== LANDING PAGES ROUTES ==================

@api_router.post("/landing-pages", response_model=LandingPageResponse)
async def create_landing_page(page: LandingPageCreate, user: dict = Depends(get_current_user)):
    # Check plan limit
    plan = await get_user_plan(user)
    if not plan.get("limits", {}).get("lead_capture", False):
        raise HTTPException(status_code=403, detail="Lead capture pages not available on your plan. Please upgrade.")
    
    if not await check_plan_limit(user, "landing_pages"):
        raise HTTPException(status_code=403, detail="Landing pages limit reached. Please upgrade your plan.")
    
    page_id = f"page_{uuid.uuid4().hex[:12]}"
    slug = f"{page.name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}"
    now = datetime.now(timezone.utc).isoformat()
    
    page_doc = {
        "page_id": page_id,
        "user_id": user["user_id"],
        "name": page.name,
        "headline": page.headline,
        "description": page.description,
        "cta_text": page.cta_text,
        "template_id": page.template_id,
        "background_color": page.background_color,
        "text_color": page.text_color,
        "slug": slug,
        "views": 0,
        "conversions": 0,
        "created_at": now
    }
    await db.landing_pages.insert_one(page_doc)
    return LandingPageResponse(**page_doc)

@api_router.get("/landing-pages", response_model=List[LandingPageResponse])
async def get_landing_pages(user: dict = Depends(get_current_user)):
    pages = await db.landing_pages.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    return [LandingPageResponse(**p) for p in pages]

@api_router.get("/landing-pages/{page_id}", response_model=LandingPageResponse)
async def get_landing_page(page_id: str, user: dict = Depends(get_current_user)):
    page = await db.landing_pages.find_one({"page_id": page_id, "user_id": user["user_id"]}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return LandingPageResponse(**page)

@api_router.delete("/landing-pages/{page_id}")
async def delete_landing_page(page_id: str, user: dict = Depends(get_current_user)):
    result = await db.landing_pages.delete_one({"page_id": page_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return {"message": "Landing page deleted"}

# Public landing page view
@api_router.get("/p/{slug}")
async def view_public_landing_page(slug: str):
    page = await db.landing_pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Increment views
    await db.landing_pages.update_one({"slug": slug}, {"$inc": {"views": 1}})
    
    return {
        "page_id": page["page_id"],
        "headline": page["headline"],
        "description": page["description"],
        "cta_text": page["cta_text"],
        "background_color": page["background_color"],
        "text_color": page["text_color"]
    }

# ================== LEADS ROUTES ==================

@api_router.post("/leads", response_model=LeadResponse)
async def create_lead(lead: LeadCreate):
    """Public endpoint for lead capture"""
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Get landing page to get company_id
    landing_page = await db.landing_pages.find_one({"page_id": lead.page_id}, {"_id": 0})
    
    lead_doc = {
        "lead_id": lead_id,
        "page_id": lead.page_id,
        "company_id": landing_page.get("company_id") if landing_page else None,
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "message": lead.message,
        "status": "new",
        "created_at": now
    }
    await db.leads.insert_one(lead_doc)
    
    # Increment conversions on landing page
    await db.landing_pages.update_one({"page_id": lead.page_id}, {"$inc": {"conversions": 1}})
    
    # Send WhatsApp notification if configured
    if landing_page:
        try:
            await send_lead_whatsapp_notification(lead_doc, landing_page)
        except Exception as e:
            logger.error(f"WhatsApp notification failed: {e}")
    
    return LeadResponse(**lead_doc)

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads(user: dict = Depends(get_current_user)):
    # Get user's landing pages
    pages = await db.landing_pages.find({"user_id": user["user_id"]}, {"page_id": 1, "_id": 0}).to_list(1000)
    page_ids = [p["page_id"] for p in pages]
    
    # Get leads for those pages
    leads = await db.leads.find({"page_id": {"$in": page_ids}}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [LeadResponse(**lead) for lead in leads]

@api_router.put("/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, status: str, user: dict = Depends(get_current_user)):
    # Verify ownership
    lead = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    page = await db.landing_pages.find_one({"page_id": lead["page_id"], "user_id": user["user_id"]}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.leads.update_one({"lead_id": lead_id}, {"$set": {"status": status}})
    return {"message": "Status updated"}

# ================== CAMPAIGNS ROUTES ==================

@api_router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(campaign: CampaignCreate, user: dict = Depends(get_current_user)):
    campaign_id = f"camp_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    campaign_doc = {
        "campaign_id": campaign_id,
        "user_id": user["user_id"],
        "name": campaign.name,
        "description": campaign.description,
        "start_date": campaign.start_date,
        "end_date": campaign.end_date,
        "platforms": campaign.platforms,
        "budget": campaign.budget,
        "status": "active",
        "created_at": now
    }
    await db.campaigns.insert_one(campaign_doc)
    return CampaignResponse(**campaign_doc)

@api_router.get("/campaigns", response_model=List[CampaignResponse])
async def get_campaigns(user: dict = Depends(get_current_user)):
    campaigns = await db.campaigns.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    return [CampaignResponse(**c) for c in campaigns]

@api_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user: dict = Depends(get_current_user)):
    result = await db.campaigns.delete_one({"campaign_id": campaign_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign deleted"}

# ================== ANALYTICS ROUTES ==================

@api_router.get("/analytics/overview")
async def get_analytics_overview(user: dict = Depends(get_current_user)):
    # Get posts stats
    posts = await db.posts.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    total_posts = len(posts)
    total_views = sum(p.get("views", 0) for p in posts)
    total_clicks = sum(p.get("clicks", 0) for p in posts)
    total_likes = sum(p.get("likes", 0) for p in posts)
    total_shares = sum(p.get("shares", 0) for p in posts)
    
    # Get landing pages stats
    pages = await db.landing_pages.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    total_pages = len(pages)
    page_views = sum(p.get("views", 0) for p in pages)
    conversions = sum(p.get("conversions", 0) for p in pages)
    
    # Get leads stats
    page_ids = [p["page_id"] for p in pages]
    leads = await db.leads.find({"page_id": {"$in": page_ids}}, {"_id": 0}).to_list(1000)
    total_leads = len(leads)
    new_leads = len([lead for lead in leads if lead.get("status") == "new"])
    
    # Get campaigns
    campaigns = await db.campaigns.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    active_campaigns = len([c for c in campaigns if c.get("status") == "active"])
    
    # Get scheduled posts
    scheduled_posts = len([p for p in posts if p.get("status") == "scheduled"])
    
    return {
        "posts": {
            "total": total_posts,
            "views": total_views,
            "clicks": total_clicks,
            "likes": total_likes,
            "shares": total_shares,
            "scheduled": scheduled_posts
        },
        "landing_pages": {
            "total": total_pages,
            "views": page_views,
            "conversions": conversions,
            "conversion_rate": round(conversions / page_views * 100, 2) if page_views > 0 else 0
        },
        "leads": {
            "total": total_leads,
            "new": new_leads
        },
        "campaigns": {
            "total": len(campaigns),
            "active": active_campaigns
        }
    }

# ================== AI ROUTES ==================

@api_router.post("/ai/generate")
async def generate_ai_content(req: AIGenerateRequest, user: dict = Depends(get_current_user)):
    # Check plan limit
    if not await check_plan_limit(user, "ai_generations"):
        raise HTTPException(status_code=403, detail="AI generation not available or limit reached. Please upgrade your plan.")
    
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    if req.type == "caption":
        system_msg = "You are a social media marketing expert. Generate engaging, professional captions for social media posts. Keep them concise but impactful. Include relevant emojis where appropriate."
        user_msg = f"Generate a social media caption for: {req.prompt}"
    elif req.type == "hashtags":
        system_msg = "You are a social media hashtag expert. Generate relevant, trending hashtags that maximize reach and engagement."
        user_msg = f"Generate 10-15 relevant hashtags for: {req.prompt}. Return only hashtags separated by spaces, starting each with #."
    else:
        raise HTTPException(status_code=400, detail="Invalid type. Use 'caption' or 'hashtags'")
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ai_{user['user_id']}_{uuid.uuid4().hex[:8]}",
            system_message=system_msg
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        
        response = await chat.send_message(UserMessage(text=user_msg))
        
        # Track AI usage
        await track_ai_usage(user["user_id"], req.type)
        
        return {"result": response, "type": req.type}
    except Exception as e:
        logger.error(f"AI generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@api_router.post("/ai/generate-image")
async def generate_ai_image(req: AIGenerateRequest, user: dict = Depends(get_current_user)):
    # Check plan limit
    if not await check_plan_limit(user, "ai_generations"):
        raise HTTPException(status_code=403, detail="AI generation not available or limit reached. Please upgrade your plan.")
    
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"img_{user['user_id']}_{uuid.uuid4().hex[:8]}",
            system_message="You are a professional graphic designer creating marketing visuals."
        )
        chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        prompt = f"Create a professional social media marketing image for: {req.prompt}. Make it visually appealing, modern, and suitable for Instagram/Facebook."
        
        text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
        
        # Track AI usage
        await track_ai_usage(user["user_id"], "image")
        
        if images and len(images) > 0:
            img = images[0]
            return {
                "image_data": img['data'],
                "mime_type": img['mime_type'],
                "text": text
            }
        else:
            return {"text": text, "message": "No image generated"}
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

# ================== HEALTH CHECK ==================

@api_router.get("/")
async def root():
    return {"message": "SocialFlow AI API", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ================== WORKSPACE ROUTES ==================

@api_router.get("/workspace")
async def get_workspace(user: dict = Depends(get_current_user)):
    """Get current user's active workspace/company"""
    company_id = user.get("active_company_id")
    if not company_id:
        return {"company": None, "members": [], "role": None}
    
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0})
    if not company:
        return {"company": None, "members": [], "role": None}
    
    members = await db.workspace_members.find(
        {"company_id": company_id, "status": "active"},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "company": company,
        "members": members,
        "role": user.get("workspace_role")
    }

@api_router.post("/workspace", response_model=CompanyResponse)
async def create_workspace(company_data: CompanyCreate, user: dict = Depends(get_current_user)):
    """Create a new workspace/company"""
    company_id = f"company_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    trial_expires = (now + timedelta(days=14)).isoformat()
    
    company_doc = {
        "company_id": company_id,
        "name": company_data.name,
        "industry": company_data.industry,
        "owner_id": user["user_id"],
        "plan": "free",
        "plan_expires_at": trial_expires,
        "whatsapp_settings": {
            "enabled": False,
            "on_new_lead": True,
            "on_post_published": False,
            "template_name": "lead_notification"
        },
        "created_at": now.isoformat()
    }
    await db.companies.insert_one(company_doc)
    
    # Add user as owner
    member_doc = {
        "member_id": f"member_{uuid.uuid4().hex[:12]}",
        "company_id": company_id,
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": "owner",
        "invited_by": user["user_id"],
        "status": "active",
        "created_at": now.isoformat()
    }
    await db.workspace_members.insert_one(member_doc)
    
    # Set as active company
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"active_company_id": company_id}}
    )
    
    return CompanyResponse(**company_doc)

@api_router.put("/workspace/{company_id}")
async def update_workspace(company_id: str, company_data: CompanyCreate, user: dict = Depends(get_current_user)):
    """Update workspace details (Owner/Admin only)"""
    # Check permissions
    membership = await db.workspace_members.find_one(
        {"user_id": user["user_id"], "company_id": company_id, "status": "active"},
        {"_id": 0}
    )
    if not membership or membership.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    await db.companies.update_one(
        {"company_id": company_id},
        {"$set": {"name": company_data.name, "industry": company_data.industry}}
    )
    
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0})
    return company

@api_router.post("/workspace/switch/{company_id}")
async def switch_workspace(company_id: str, user: dict = Depends(get_current_user)):
    """Switch to a different workspace"""
    # Check if user is member
    membership = await db.workspace_members.find_one(
        {"user_id": user["user_id"], "company_id": company_id, "status": "active"},
        {"_id": 0}
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"active_company_id": company_id}}
    )
    
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0})
    return {"message": "Switched workspace", "company": company, "role": membership.get("role")}

@api_router.get("/workspace/list")
async def list_workspaces(user: dict = Depends(get_current_user)):
    """List all workspaces user is a member of"""
    memberships = await db.workspace_members.find(
        {"user_id": user["user_id"], "status": "active"},
        {"_id": 0}
    ).to_list(100)
    
    workspaces = []
    for m in memberships:
        company = await db.companies.find_one({"company_id": m["company_id"]}, {"_id": 0})
        if company:
            workspaces.append({
                "company": company,
                "role": m.get("role"),
                "is_active": company["company_id"] == user.get("active_company_id")
            })
    
    return {"workspaces": workspaces}

@api_router.post("/workspace/invite")
async def invite_member(invite: WorkspaceInviteCreate, user: dict = Depends(get_current_user)):
    """Invite a user to the workspace"""
    company_id = user.get("active_company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="No active workspace")
    
    # Check permissions
    if not check_permission(user, "manage_members"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check if already a member
    existing = await db.workspace_members.find_one(
        {"company_id": company_id, "email": invite.email, "status": "active"},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")
    
    # Check for pending invite
    pending = await db.workspace_invites.find_one(
        {"company_id": company_id, "email": invite.email, "status": "pending"},
        {"_id": 0}
    )
    if pending:
        raise HTTPException(status_code=400, detail="Invite already pending")
    
    now = datetime.now(timezone.utc)
    invite_id = f"invite_{uuid.uuid4().hex[:12]}"
    
    invite_doc = {
        "invite_id": invite_id,
        "company_id": company_id,
        "email": invite.email,
        "role": invite.role,
        "invited_by": user["user_id"],
        "status": "pending",
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(days=7)).isoformat()
    }
    await db.workspace_invites.insert_one(invite_doc)
    
    return WorkspaceInviteResponse(**invite_doc)

@api_router.get("/workspace/invites")
async def list_invites(user: dict = Depends(get_current_user)):
    """List pending invites for the workspace"""
    company_id = user.get("active_company_id")
    if not company_id:
        return {"invites": []}
    
    invites = await db.workspace_invites.find(
        {"company_id": company_id, "status": "pending"},
        {"_id": 0}
    ).to_list(100)
    
    return {"invites": invites}

@api_router.post("/workspace/invites/{invite_id}/accept")
async def accept_invite(invite_id: str, user: dict = Depends(get_current_user)):
    """Accept a workspace invite"""
    invite = await db.workspace_invites.find_one(
        {"invite_id": invite_id, "email": user["email"], "status": "pending"},
        {"_id": 0}
    )
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or already processed")
    
    # Check if expired
    expires_at = datetime.fromisoformat(invite["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        await db.workspace_invites.update_one(
            {"invite_id": invite_id},
            {"$set": {"status": "expired"}}
        )
        raise HTTPException(status_code=400, detail="Invite has expired")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Add as member
    member_doc = {
        "member_id": f"member_{uuid.uuid4().hex[:12]}",
        "company_id": invite["company_id"],
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": invite["role"],
        "invited_by": invite["invited_by"],
        "status": "active",
        "created_at": now
    }
    await db.workspace_members.insert_one(member_doc)
    
    # Update invite status
    await db.workspace_invites.update_one(
        {"invite_id": invite_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Switch user to this workspace
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"active_company_id": invite["company_id"]}}
    )
    
    return {"message": "Invite accepted", "company_id": invite["company_id"]}

@api_router.put("/workspace/members/{member_id}/role")
async def update_member_role(member_id: str, role: str, user: dict = Depends(get_current_user)):
    """Update a member's role (Owner only)"""
    company_id = user.get("active_company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="No active workspace")
    
    # Only owners can change roles
    if user.get("workspace_role") != "owner":
        raise HTTPException(status_code=403, detail="Only owners can change roles")
    
    # Validate role
    if role not in [r.value for r in WorkspaceRole]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Cannot change owner's role
    member = await db.workspace_members.find_one(
        {"member_id": member_id, "company_id": company_id},
        {"_id": 0}
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if member.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Cannot change owner's role")
    
    await db.workspace_members.update_one(
        {"member_id": member_id},
        {"$set": {"role": role}}
    )
    
    return {"message": "Role updated", "role": role}

@api_router.delete("/workspace/members/{member_id}")
async def remove_member(member_id: str, user: dict = Depends(get_current_user)):
    """Remove a member from the workspace"""
    company_id = user.get("active_company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="No active workspace")
    
    # Check permissions
    if user.get("workspace_role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    member = await db.workspace_members.find_one(
        {"member_id": member_id, "company_id": company_id},
        {"_id": 0}
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Cannot remove owner
    if member.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove workspace owner")
    
    await db.workspace_members.update_one(
        {"member_id": member_id},
        {"$set": {"status": "removed"}}
    )
    
    return {"message": "Member removed"}

# ================== META GRAPH API OAUTH ==================

@api_router.get("/oauth/meta/url")
async def get_meta_oauth_url(user: dict = Depends(get_current_user)):
    """Get Meta OAuth URL for Facebook/Instagram connection"""
    if not META_APP_ID:
        raise HTTPException(status_code=500, detail="Meta integration not configured. Set META_APP_ID in environment.")
    
    company_id = user.get("active_company_id") or user.get("company_id")
    state = f"{user['user_id']}:{company_id}"
    
    # Scopes for Facebook/Instagram posting
    scopes = [
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "instagram_basic",
        "instagram_content_publish",
        "business_management"
    ]
    
    redirect_uri = META_REDIRECT_URI or f"{os.environ.get('REACT_APP_BACKEND_URL', '')}/api/oauth/meta/callback"
    
    oauth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={META_APP_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&state={state}"
        f"&scope={','.join(scopes)}"
        f"&response_type=code"
    )
    
    return {"url": oauth_url, "configured": True}

@api_router.get("/oauth/meta/callback")
async def meta_oauth_callback(code: str, state: str = None, request: Request = None):
    """Handle Meta OAuth callback"""
    if not META_APP_ID or not META_APP_SECRET:
        raise HTTPException(status_code=500, detail="Meta integration not configured")
    
    redirect_uri = META_REDIRECT_URI or f"{os.environ.get('REACT_APP_BACKEND_URL', '')}/api/oauth/meta/callback"
    
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "redirect_uri": redirect_uri,
                "code": code
            }
        )
        
        if token_response.status_code != 200:
            logger.error(f"Meta token exchange failed: {token_response.text}")
            raise HTTPException(status_code=400, detail="Failed to exchange OAuth code")
        
        token_data = token_response.json()
        short_lived_token = token_data.get("access_token")
        
        # Exchange for long-lived token
        long_token_response = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "fb_exchange_token": short_lived_token
            }
        )
        
        if long_token_response.status_code == 200:
            long_token_data = long_token_response.json()
            access_token = long_token_data.get("access_token", short_lived_token)
        else:
            access_token = short_lived_token
        
        # Get user's Facebook pages
        pages_response = await client.get(
            "https://graph.facebook.com/v18.0/me/accounts",
            params={"access_token": access_token}
        )
        
        pages = []
        if pages_response.status_code == 200:
            pages_data = pages_response.json()
            for page in pages_data.get("data", []):
                page_info = {
                    "page_id": page["id"],
                    "page_name": page["name"],
                    "access_token": page["access_token"],
                    "instagram_business_id": None
                }
                
                # Check if page has Instagram Business account
                ig_response = await client.get(
                    f"https://graph.facebook.com/v18.0/{page['id']}",
                    params={
                        "fields": "instagram_business_account",
                        "access_token": page["access_token"]
                    }
                )
                if ig_response.status_code == 200:
                    ig_data = ig_response.json()
                    if "instagram_business_account" in ig_data:
                        page_info["instagram_business_id"] = ig_data["instagram_business_account"]["id"]
                
                pages.append(page_info)
    
    # Parse state to get user_id and company_id
    user_id = None
    company_id = None
    if state:
        parts = state.split(":")
        user_id = parts[0] if len(parts) > 0 else None
        company_id = parts[1] if len(parts) > 1 else None
    
    # Store pages temporarily for selection
    if user_id:
        await db.meta_oauth_pending.update_one(
            {"user_id": user_id},
            {"$set": {
                "user_id": user_id,
                "company_id": company_id,
                "pages": pages,
                "user_token": access_token,
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
    
    # Redirect to frontend page selection
    frontend_url = os.environ.get('REACT_APP_BACKEND_URL', '').replace('/api', '')
    return Response(
        status_code=302,
        headers={"Location": f"{frontend_url}/social-accounts?meta_connected=true"}
    )

@api_router.get("/oauth/meta/pages")
async def get_meta_pages(user: dict = Depends(get_current_user)):
    """Get available Facebook/Instagram pages from OAuth flow"""
    pending = await db.meta_oauth_pending.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not pending:
        return {"pages": [], "message": "No pending OAuth connection"}
    
    return {"pages": pending.get("pages", [])}

@api_router.post("/oauth/meta/connect-page")
async def connect_meta_page(page_data: MetaPageSelect, user: dict = Depends(get_current_user)):
    """Connect a Facebook/Instagram page to the workspace"""
    company_id = user.get("active_company_id") or user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="No active workspace")
    
    # Check plan limits
    if not await check_plan_limit(user, "social_accounts"):
        raise HTTPException(status_code=403, detail="Social accounts limit reached")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create Facebook page account
    fb_account_id = f"sa_{uuid.uuid4().hex[:12]}"
    fb_account = {
        "account_id": fb_account_id,
        "user_id": user["user_id"],
        "company_id": company_id,
        "platform": "facebook",
        "account_name": page_data.page_name,
        "external_id": page_data.page_id,
        "access_token": page_data.access_token,
        "is_connected": True,
        "is_real_connection": True,
        "followers_count": 0,
        "last_synced_at": now,
        "created_at": now
    }
    await db.social_accounts.insert_one(fb_account)
    
    # Create Instagram account if available
    ig_account = None
    if page_data.instagram_business_id:
        ig_account_id = f"sa_{uuid.uuid4().hex[:12]}"
        ig_account = {
            "account_id": ig_account_id,
            "user_id": user["user_id"],
            "company_id": company_id,
            "platform": "instagram",
            "account_name": f"{page_data.page_name} (Instagram)",
            "external_id": page_data.instagram_business_id,
            "access_token": page_data.access_token,
            "facebook_page_id": page_data.page_id,
            "is_connected": True,
            "is_real_connection": True,
            "followers_count": 0,
            "last_synced_at": now,
            "created_at": now
        }
        await db.social_accounts.insert_one(ig_account)
    
    # Clean up pending OAuth
    await db.meta_oauth_pending.delete_one({"user_id": user["user_id"]})
    
    return {
        "message": "Page connected successfully",
        "facebook_account": SocialAccountResponse(**fb_account),
        "instagram_account": SocialAccountResponse(**ig_account) if ig_account else None
    }

@api_router.post("/social-accounts/{account_id}/publish-real")
async def publish_to_real_account(account_id: str, post_id: str, user: dict = Depends(get_current_user)):
    """Publish a post to a real connected social media account"""
    account = await db.social_accounts.find_one(
        {"account_id": account_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if not account.get("is_real_connection"):
        raise HTTPException(status_code=400, detail="This is a mock account. Use /publish for mock posting.")
    
    post = await db.posts.find_one({"post_id": post_id, "user_id": user["user_id"]}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    access_token = account.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token available")
    
    platform = account.get("platform")
    external_id = account.get("external_id")
    
    try:
        async with httpx.AsyncClient() as client:
            if platform == "facebook":
                # Post to Facebook Page
                response = await client.post(
                    f"https://graph.facebook.com/v18.0/{external_id}/feed",
                    params={
                        "message": f"{post['caption']}\n\n{' '.join(['#' + h for h in post.get('hashtags', [])])}",
                        "access_token": access_token
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Facebook post failed: {response.text}")
                    raise HTTPException(status_code=400, detail=f"Facebook posting failed: {response.text}")
                
                result = response.json()
                return {
                    "success": True,
                    "platform": "facebook",
                    "post_id": result.get("id"),
                    "message": "Posted to Facebook successfully"
                }
            
            elif platform == "instagram":
                # Instagram requires image URL for posting
                if not post.get("image_url"):
                    raise HTTPException(status_code=400, detail="Instagram posts require an image URL")
                
                # Step 1: Create media container
                container_response = await client.post(
                    f"https://graph.facebook.com/v18.0/{external_id}/media",
                    params={
                        "image_url": post["image_url"],
                        "caption": f"{post['caption']}\n\n{' '.join(['#' + h for h in post.get('hashtags', [])])}",
                        "access_token": access_token
                    }
                )
                
                if container_response.status_code != 200:
                    logger.error(f"Instagram container creation failed: {container_response.text}")
                    raise HTTPException(status_code=400, detail=f"Instagram posting failed: {container_response.text}")
                
                container_data = container_response.json()
                creation_id = container_data.get("id")
                
                # Step 2: Publish the container
                publish_response = await client.post(
                    f"https://graph.facebook.com/v18.0/{external_id}/media_publish",
                    params={
                        "creation_id": creation_id,
                        "access_token": access_token
                    }
                )
                
                if publish_response.status_code != 200:
                    logger.error(f"Instagram publish failed: {publish_response.text}")
                    raise HTTPException(status_code=400, detail=f"Instagram publish failed: {publish_response.text}")
                
                result = publish_response.json()
                return {
                    "success": True,
                    "platform": "instagram",
                    "post_id": result.get("id"),
                    "message": "Posted to Instagram successfully"
                }
            
            else:
                raise HTTPException(status_code=400, detail=f"Real posting not supported for {platform}")
    
    except httpx.RequestError as e:
        logger.error(f"Network error during posting: {e}")
        raise HTTPException(status_code=500, detail="Network error during posting")

# ================== WHATSAPP BUSINESS API ==================

@api_router.get("/whatsapp/status")
async def get_whatsapp_status(user: dict = Depends(get_current_user)):
    """Get WhatsApp integration status"""
    company_id = user.get("active_company_id") or user.get("company_id")
    if not company_id:
        return {"configured": False, "enabled": False}
    
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0})
    settings = company.get("whatsapp_settings", {}) if company else {}
    
    return {
        "configured": bool(WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN),
        "enabled": settings.get("enabled", False),
        "settings": settings
    }

@api_router.put("/whatsapp/settings")
async def update_whatsapp_settings(settings: WhatsAppNotificationSettings, user: dict = Depends(get_current_user)):
    """Update WhatsApp notification settings"""
    company_id = user.get("active_company_id") or user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="No active workspace")
    
    # Check permissions
    if not check_permission(user, "manage_campaigns"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    await db.companies.update_one(
        {"company_id": company_id},
        {"$set": {"whatsapp_settings": settings.model_dump()}}
    )
    
    return {"message": "Settings updated", "settings": settings.model_dump()}

@api_router.post("/whatsapp/send-template")
async def send_whatsapp_template(message: WhatsAppTemplateMessage, user: dict = Depends(get_current_user)):
    """Send a WhatsApp template message"""
    if not WHATSAPP_PHONE_NUMBER_ID or not WHATSAPP_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="WhatsApp not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.")
    
    # Format phone number (remove + and spaces)
    phone = message.to_phone.replace("+", "").replace(" ", "").replace("-", "")
    
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": message.template_name,
            "language": {
                "code": message.language_code
            }
        }
    }
    
    if message.components:
        payload["template"]["components"] = message.components
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages",
                headers={
                    "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"WhatsApp send failed: {response.text}")
                return {
                    "success": False,
                    "error": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                }
            
            result = response.json()
            return {
                "success": True,
                "message_id": result.get("messages", [{}])[0].get("id"),
                "response": result
            }
    
    except httpx.RequestError as e:
        logger.error(f"WhatsApp network error: {e}")
        raise HTTPException(status_code=500, detail="Network error sending WhatsApp message")

@api_router.post("/whatsapp/test")
async def test_whatsapp_connection(user: dict = Depends(get_current_user)):
    """Test WhatsApp API connection"""
    if not WHATSAPP_PHONE_NUMBER_ID or not WHATSAPP_ACCESS_TOKEN:
        return {
            "configured": False,
            "message": "WhatsApp not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in environment."
        }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}",
                headers={"Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "configured": True,
                    "connected": True,
                    "phone_number": data.get("display_phone_number"),
                    "verified_name": data.get("verified_name")
                }
            else:
                return {
                    "configured": True,
                    "connected": False,
                    "error": response.text
                }
    except httpx.RequestError as e:
        return {
            "configured": True,
            "connected": False,
            "error": str(e)
        }

# Helper function to send WhatsApp notification on lead capture
async def send_lead_whatsapp_notification(lead: dict, landing_page: dict):
    """Send WhatsApp notification when a new lead is captured"""
    if not WHATSAPP_PHONE_NUMBER_ID or not WHATSAPP_ACCESS_TOKEN:
        return
    
    # Get company settings
    company = await db.companies.find_one({"company_id": landing_page.get("company_id")}, {"_id": 0})
    if not company:
        return
    
    settings = company.get("whatsapp_settings", {})
    if not settings.get("enabled") or not settings.get("on_new_lead"):
        return
    
    # Get owner's phone (would need to be stored in company settings)
    owner_phone = company.get("notification_phone")
    if not owner_phone:
        return
    
    try:
        payload = {
            "messaging_product": "whatsapp",
            "to": owner_phone.replace("+", "").replace(" ", ""),
            "type": "template",
            "template": {
                "name": settings.get("template_name", "lead_notification"),
                "language": {"code": "en"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": lead.get("name", "New Lead")},
                            {"type": "text", "text": lead.get("email", "")},
                            {"type": "text", "text": landing_page.get("name", "Landing Page")}
                        ]
                    }
                ]
            }
        }
        
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages",
                headers={
                    "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification: {e}")

# ================== ANALYTICS ROUTES (ADVANCED) ==================

@api_router.get("/analytics/detailed")
async def get_detailed_analytics(
    user: dict = Depends(get_current_user),
    period: str = Query("30d", regex="^(7d|30d|90d|all)$")
):
    """Get detailed analytics with breakdowns"""
    company_id = user.get("active_company_id") or user.get("company_id")
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    else:
        start_date = datetime(2020, 1, 1, tzinfo=timezone.utc)
    
    start_iso = start_date.isoformat()
    
    # Get posts with date filter
    post_query = {"user_id": user["user_id"]}
    if company_id:
        post_query["company_id"] = company_id
    
    posts = await db.posts.find(post_query, {"_id": 0}).to_list(10000)
    
    # Filter by date
    filtered_posts = [p for p in posts if p.get("created_at", "") >= start_iso]
    
    # Calculate metrics
    total_posts = len(filtered_posts)
    published_posts = len([p for p in filtered_posts if p.get("status") == "published"])
    scheduled_posts = len([p for p in filtered_posts if p.get("status") == "scheduled"])
    draft_posts = len([p for p in filtered_posts if p.get("status") == "draft"])
    
    total_views = sum(p.get("views", 0) for p in filtered_posts)
    total_clicks = sum(p.get("clicks", 0) for p in filtered_posts)
    total_likes = sum(p.get("likes", 0) for p in filtered_posts)
    total_shares = sum(p.get("shares", 0) for p in filtered_posts)
    
    # Platform breakdown
    platform_stats = {}
    for post in filtered_posts:
        for platform in post.get("platforms", []):
            if platform not in platform_stats:
                platform_stats[platform] = {"posts": 0, "views": 0, "clicks": 0, "likes": 0}
            platform_stats[platform]["posts"] += 1
            platform_stats[platform]["views"] += post.get("views", 0)
            platform_stats[platform]["clicks"] += post.get("clicks", 0)
            platform_stats[platform]["likes"] += post.get("likes", 0)
    
    # Landing page analytics
    page_query = {"user_id": user["user_id"]}
    if company_id:
        page_query["company_id"] = company_id
    
    pages = await db.landing_pages.find(page_query, {"_id": 0}).to_list(1000)
    
    total_page_views = sum(p.get("views", 0) for p in pages)
    total_conversions = sum(p.get("conversions", 0) for p in pages)
    conversion_rate = (total_conversions / total_page_views * 100) if total_page_views > 0 else 0
    
    # Top performing pages
    top_pages = sorted(pages, key=lambda p: p.get("conversions", 0), reverse=True)[:5]
    
    # Lead analytics
    page_ids = [p["page_id"] for p in pages]
    leads = await db.leads.find({"page_id": {"$in": page_ids}}, {"_id": 0}).to_list(10000)
    filtered_leads = [l for l in leads if l.get("created_at", "") >= start_iso]
    
    lead_status_breakdown = {}
    for lead in filtered_leads:
        status = lead.get("status", "new")
        lead_status_breakdown[status] = lead_status_breakdown.get(status, 0) + 1
    
    # Daily trend (last 7 days)
    daily_trend = []
    for i in range(7):
        day = now - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_posts = len([p for p in filtered_posts if p.get("created_at", "").startswith(day_str)])
        day_leads = len([l for l in filtered_leads if l.get("created_at", "").startswith(day_str)])
        daily_trend.append({
            "date": day_str,
            "posts": day_posts,
            "leads": day_leads
        })
    
    return {
        "period": period,
        "posts": {
            "total": total_posts,
            "published": published_posts,
            "scheduled": scheduled_posts,
            "drafts": draft_posts,
            "engagement": {
                "views": total_views,
                "clicks": total_clicks,
                "likes": total_likes,
                "shares": total_shares,
                "ctr": round(total_clicks / total_views * 100, 2) if total_views > 0 else 0
            }
        },
        "platforms": platform_stats,
        "landing_pages": {
            "total": len(pages),
            "views": total_page_views,
            "conversions": total_conversions,
            "conversion_rate": round(conversion_rate, 2),
            "top_performing": [
                {"name": p.get("name"), "views": p.get("views", 0), "conversions": p.get("conversions", 0)}
                for p in top_pages
            ]
        },
        "leads": {
            "total": len(filtered_leads),
            "by_status": lead_status_breakdown
        },
        "daily_trend": list(reversed(daily_trend))
    }

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
