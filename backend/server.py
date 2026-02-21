from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'socialflow_secret_key')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="SocialFlow AI API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    created_at: str

class TemplateCreate(BaseModel):
    name: str
    category: str
    image_url: str
    description: Optional[str] = None

class TemplateResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    template_id: str
    user_id: str
    name: str
    category: str
    image_url: str
    description: Optional[str]
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

class AIGenerateRequest(BaseModel):
    prompt: str
    type: str  # "caption", "hashtags", "image"

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
    
    return user

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "role": "user",
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_id,
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
    
    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "picture": None,
        "role": "user",
        "created_at": now
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
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "role": user.get("role", "user"),
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
    now = datetime.now(timezone.utc).isoformat()
    
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": oauth_data["email"],
            "name": oauth_data["name"],
            "picture": oauth_data.get("picture"),
            "role": "user",
            "created_at": now
        }
        await db.users.insert_one(user)
    else:
        user_id = user["user_id"]
        # Update picture if changed
        if oauth_data.get("picture") != user.get("picture"):
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"picture": oauth_data.get("picture")}}
            )
            user["picture"] = oauth_data.get("picture")
    
    # Create local session
    session_token = oauth_data.get("session_token", f"session_{uuid.uuid4().hex}")
    session_doc = {
        "user_id": user_id,
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
    
    return {
        "user_id": user_id,
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "role": user.get("role", "user"),
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
        "created_at": user["created_at"]
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ================== POSTS ROUTES ==================

@api_router.post("/posts", response_model=PostResponse)
async def create_post(post: PostCreate, user: dict = Depends(get_current_user)):
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    post_doc = {
        "post_id": post_id,
        "user_id": user["user_id"],
        "title": post.title,
        "caption": post.caption,
        "hashtags": post.hashtags,
        "platforms": post.platforms,
        "image_url": post.image_url,
        "scheduled_at": post.scheduled_at,
        "status": post.status,
        "views": 0,
        "clicks": 0,
        "created_at": now
    }
    await db.posts.insert_one(post_doc)
    return PostResponse(**post_doc)

@api_router.get("/posts", response_model=List[PostResponse])
async def get_posts(user: dict = Depends(get_current_user)):
    posts = await db.posts.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
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

# ================== TEMPLATES ROUTES ==================

@api_router.post("/templates", response_model=TemplateResponse)
async def create_template(template: TemplateCreate, user: dict = Depends(get_current_user)):
    template_id = f"tpl_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    template_doc = {
        "template_id": template_id,
        "user_id": user["user_id"],
        "name": template.name,
        "category": template.category,
        "image_url": template.image_url,
        "description": template.description,
        "is_ai_generated": False,
        "created_at": now
    }
    await db.templates.insert_one(template_doc)
    return TemplateResponse(**template_doc)

@api_router.get("/templates", response_model=List[TemplateResponse])
async def get_templates(user: dict = Depends(get_current_user)):
    templates = await db.templates.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    return [TemplateResponse(**t) for t in templates]

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user: dict = Depends(get_current_user)):
    result = await db.templates.delete_one({"template_id": template_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

# ================== LANDING PAGES ROUTES ==================

@api_router.post("/landing-pages", response_model=LandingPageResponse)
async def create_landing_page(page: LandingPageCreate, user: dict = Depends(get_current_user)):
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
    
    lead_doc = {
        "lead_id": lead_id,
        "page_id": lead.page_id,
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
    
    return LeadResponse(**lead_doc)

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads(user: dict = Depends(get_current_user)):
    # Get user's landing pages
    pages = await db.landing_pages.find({"user_id": user["user_id"]}, {"page_id": 1, "_id": 0}).to_list(1000)
    page_ids = [p["page_id"] for p in pages]
    
    # Get leads for those pages
    leads = await db.leads.find({"page_id": {"$in": page_ids}}, {"_id": 0}).to_list(1000)
    return [LeadResponse(**l) for l in leads]

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
    
    # Get landing pages stats
    pages = await db.landing_pages.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    total_pages = len(pages)
    page_views = sum(p.get("views", 0) for p in pages)
    conversions = sum(p.get("conversions", 0) for p in pages)
    
    # Get leads stats
    page_ids = [p["page_id"] for p in pages]
    leads = await db.leads.find({"page_id": {"$in": page_ids}}, {"_id": 0}).to_list(1000)
    total_leads = len(leads)
    new_leads = len([l for l in leads if l.get("status") == "new"])
    
    # Get campaigns
    campaigns = await db.campaigns.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    active_campaigns = len([c for c in campaigns if c.get("status") == "active"])
    
    return {
        "posts": {
            "total": total_posts,
            "views": total_views,
            "clicks": total_clicks
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
        return {"result": response, "type": req.type}
    except Exception as e:
        logger.error(f"AI generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@api_router.post("/ai/generate-image")
async def generate_ai_image(req: AIGenerateRequest, user: dict = Depends(get_current_user)):
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
        
        if images and len(images) > 0:
            # Return first image as base64 data URL
            img = images[0]
            return {
                "image_url": f"data:{img['mime_type']};base64,{img['data'][:100]}...",
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
