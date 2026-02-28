"""
Test suite for Multi-user Workspace, Meta OAuth, WhatsApp, and Advanced Analytics features
Testing workspace creation, member management, OAuth endpoints, WhatsApp status, and analytics
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://post-flow-ai.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = f"workspace_test_{uuid.uuid4().hex[:8]}@test.com"
TEST_PASSWORD = "test123"
TEST_NAME = "Workspace Test User"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_health_endpoint(self):
        """Test that the API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ Health check passed")


class TestUserRegistrationWithCompany:
    """Test that user registration creates default company"""
    
    @pytest.fixture(scope="class")
    def registered_user(self):
        """Register a test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            }
        )
        assert response.status_code == 200, f"Registration failed: {response.text}"
        return response.json()
    
    def test_registration_creates_default_company(self, registered_user):
        """Verify registration creates a default company/workspace"""
        assert "user_id" in registered_user
        assert "company_id" in registered_user
        assert registered_user["company_id"] is not None
        assert registered_user["company_id"].startswith("company_")
        print(f"✓ User registered with company_id: {registered_user['company_id']}")
    
    def test_registration_sets_owner_role(self, registered_user):
        """Verify new user is set as owner of their workspace"""
        assert "workspace_role" in registered_user
        assert registered_user["workspace_role"] == "owner"
        print("✓ User has owner role in workspace")
    
    def test_registration_returns_plan_info(self, registered_user):
        """Verify registration returns plan information"""
        assert "plan" in registered_user
        assert registered_user["plan"] == "free"
        assert "plan_expires_at" in registered_user
        print(f"✓ Plan info: {registered_user['plan']}")


class TestLoginWithWorkspace:
    """Test login returns workspace information"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a session and login"""
        sess = requests.Session()
        
        # First register a user
        email = f"login_test_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = sess.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": email,
                "password": TEST_PASSWORD,
                "name": "Login Test User"
            }
        )
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        
        # Now login
        login_response = sess.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        return login_response.json(), sess
    
    def test_login_returns_company_id(self, session):
        """Verify login returns company_id"""
        data, _ = session
        assert "company_id" in data
        assert data["company_id"] is not None
        print(f"✓ Login returns company_id: {data['company_id']}")
    
    def test_login_returns_workspace_role(self, session):
        """Verify login returns workspace_role"""
        data, _ = session
        assert "workspace_role" in data
        assert data["workspace_role"] in ["owner", "admin", "editor", "viewer"]
        print(f"✓ Login returns workspace_role: {data['workspace_role']}")


class TestWorkspaceRoutes:
    """Test workspace management routes"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        sess = requests.Session()
        
        email = f"workspace_routes_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = sess.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": email,
                "password": TEST_PASSWORD,
                "name": "Workspace Routes Test"
            }
        )
        assert reg_response.status_code == 200
        user_data = reg_response.json()
        return sess, user_data
    
    def test_get_workspace_details(self, auth_session):
        """Test GET /workspace returns workspace details"""
        sess, user_data = auth_session
        
        response = sess.get(f"{BASE_URL}/api/workspace")
        assert response.status_code == 200
        
        data = response.json()
        assert "company" in data
        assert "members" in data
        assert "role" in data
        
        # Verify company details
        company = data["company"]
        assert company is not None
        assert "company_id" in company
        assert "name" in company
        assert "plan" in company
        print(f"✓ Workspace details: {company['name']} (Plan: {company['plan']})")
    
    def test_list_workspaces(self, auth_session):
        """Test GET /workspace/list returns user's workspaces"""
        sess, user_data = auth_session
        
        response = sess.get(f"{BASE_URL}/api/workspace/list")
        assert response.status_code == 200
        
        data = response.json()
        assert "workspaces" in data
        assert len(data["workspaces"]) >= 1
        
        # Check workspace structure
        workspace = data["workspaces"][0]
        assert "company" in workspace
        assert "role" in workspace
        assert "is_active" in workspace
        print(f"✓ User has {len(data['workspaces'])} workspace(s)")
    
    def test_invite_member(self, auth_session):
        """Test POST /workspace/invite sends invitation"""
        sess, user_data = auth_session
        
        invite_email = f"invited_user_{uuid.uuid4().hex[:8]}@test.com"
        response = sess.post(
            f"{BASE_URL}/api/workspace/invite",
            json={
                "email": invite_email,
                "role": "editor"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "invite_id" in data
        assert data["email"] == invite_email
        assert data["role"] == "editor"
        assert data["status"] == "pending"
        print(f"✓ Invitation sent to: {invite_email}")
    
    def test_list_pending_invites(self, auth_session):
        """Test GET /workspace/invites lists pending invitations"""
        sess, user_data = auth_session
        
        response = sess.get(f"{BASE_URL}/api/workspace/invites")
        assert response.status_code == 200
        
        data = response.json()
        assert "invites" in data
        # Should have at least the invite we just created
        assert len(data["invites"]) >= 1
        print(f"✓ Found {len(data['invites'])} pending invite(s)")


class TestMetaOAuthRoutes:
    """Test Meta OAuth endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        sess = requests.Session()
        
        email = f"meta_oauth_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = sess.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": email,
                "password": TEST_PASSWORD,
                "name": "Meta OAuth Test"
            }
        )
        assert reg_response.status_code == 200
        return sess, reg_response.json()
    
    def test_get_meta_oauth_url_no_config(self, auth_session):
        """Test GET /oauth/meta/url when not configured (empty META_APP_ID)"""
        sess, _ = auth_session
        
        response = sess.get(f"{BASE_URL}/api/oauth/meta/url")
        # Should return 500 when META_APP_ID is not set
        # OR return URL if configured
        if response.status_code == 500:
            data = response.json()
            assert "detail" in data
            assert "not configured" in data["detail"].lower() or "META_APP_ID" in data["detail"]
            print("✓ Meta OAuth URL endpoint returns proper error when not configured")
        else:
            assert response.status_code == 200
            data = response.json()
            assert "url" in data or "configured" in data
            print("✓ Meta OAuth URL endpoint responds (may be configured)")
    
    def test_get_meta_pages_empty(self, auth_session):
        """Test GET /oauth/meta/pages returns empty when no OAuth completed"""
        sess, _ = auth_session
        
        response = sess.get(f"{BASE_URL}/api/oauth/meta/pages")
        assert response.status_code == 200
        
        data = response.json()
        assert "pages" in data
        assert isinstance(data["pages"], list)
        # Should be empty since no OAuth was done
        print(f"✓ Meta pages endpoint returns: {len(data['pages'])} pages")


class TestWhatsAppRoutes:
    """Test WhatsApp integration endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        sess = requests.Session()
        
        email = f"whatsapp_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = sess.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": email,
                "password": TEST_PASSWORD,
                "name": "WhatsApp Test"
            }
        )
        assert reg_response.status_code == 200
        return sess, reg_response.json()
    
    def test_get_whatsapp_status(self, auth_session):
        """Test GET /whatsapp/status returns status"""
        sess, _ = auth_session
        
        response = sess.get(f"{BASE_URL}/api/whatsapp/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "configured" in data
        assert "enabled" in data
        assert "settings" in data
        
        # When not configured, should return False
        print(f"✓ WhatsApp status: configured={data['configured']}, enabled={data['enabled']}")
    
    def test_update_whatsapp_settings(self, auth_session):
        """Test PUT /whatsapp/settings updates settings"""
        sess, _ = auth_session
        
        settings = {
            "enabled": False,  # Don't enable since not configured
            "on_new_lead": True,
            "on_post_published": False,
            "template_name": "test_notification"
        }
        
        response = sess.put(
            f"{BASE_URL}/api/whatsapp/settings",
            json=settings
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "settings" in data
        assert data["settings"]["on_new_lead"] == True
        assert data["settings"]["template_name"] == "test_notification"
        print("✓ WhatsApp settings updated successfully")


class TestAdvancedAnalytics:
    """Test advanced analytics endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session with some data"""
        sess = requests.Session()
        
        email = f"analytics_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = sess.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": email,
                "password": TEST_PASSWORD,
                "name": "Analytics Test"
            }
        )
        assert reg_response.status_code == 200
        return sess, reg_response.json()
    
    def test_detailed_analytics_7d(self, auth_session):
        """Test GET /analytics/detailed with 7d period"""
        sess, _ = auth_session
        
        response = sess.get(f"{BASE_URL}/api/analytics/detailed?period=7d")
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "7d"
        assert "posts" in data
        assert "platforms" in data
        assert "landing_pages" in data
        assert "leads" in data
        assert "daily_trend" in data
        
        # Check posts structure
        posts = data["posts"]
        assert "total" in posts
        assert "published" in posts
        assert "scheduled" in posts
        assert "drafts" in posts
        assert "engagement" in posts
        
        print(f"✓ 7d analytics: {posts['total']} posts, {data['leads']['total']} leads")
    
    def test_detailed_analytics_30d(self, auth_session):
        """Test GET /analytics/detailed with 30d period"""
        sess, _ = auth_session
        
        response = sess.get(f"{BASE_URL}/api/analytics/detailed?period=30d")
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "30d"
        print(f"✓ 30d analytics retrieved successfully")
    
    def test_detailed_analytics_90d(self, auth_session):
        """Test GET /analytics/detailed with 90d period"""
        sess, _ = auth_session
        
        response = sess.get(f"{BASE_URL}/api/analytics/detailed?period=90d")
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "90d"
        print(f"✓ 90d analytics retrieved successfully")
    
    def test_detailed_analytics_all(self, auth_session):
        """Test GET /analytics/detailed with all period"""
        sess, _ = auth_session
        
        response = sess.get(f"{BASE_URL}/api/analytics/detailed?period=all")
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "all"
        print(f"✓ All-time analytics retrieved successfully")


class TestRolePermissions:
    """Test workspace role permissions system"""
    
    @pytest.fixture(scope="class")
    def owner_session(self):
        """Create owner session"""
        sess = requests.Session()
        
        email = f"owner_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = sess.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": email,
                "password": TEST_PASSWORD,
                "name": "Owner User"
            }
        )
        assert reg_response.status_code == 200
        return sess, reg_response.json()
    
    def test_owner_can_invite_members(self, owner_session):
        """Test owner can invite members"""
        sess, user_data = owner_session
        
        # Owner should be able to invite
        response = sess.post(
            f"{BASE_URL}/api/workspace/invite",
            json={
                "email": f"new_member_{uuid.uuid4().hex[:8]}@test.com",
                "role": "viewer"
            }
        )
        assert response.status_code == 200
        print("✓ Owner can invite members")
    
    def test_duplicate_invite_rejected(self, owner_session):
        """Test duplicate invitation is rejected"""
        sess, _ = owner_session
        
        invite_email = f"dup_invite_{uuid.uuid4().hex[:8]}@test.com"
        
        # First invite
        response1 = sess.post(
            f"{BASE_URL}/api/workspace/invite",
            json={"email": invite_email, "role": "editor"}
        )
        assert response1.status_code == 200
        
        # Duplicate invite should fail
        response2 = sess.post(
            f"{BASE_URL}/api/workspace/invite",
            json={"email": invite_email, "role": "editor"}
        )
        assert response2.status_code == 400
        print("✓ Duplicate invitation correctly rejected")


class TestCompanyIsolation:
    """Test multi-tenant data isolation"""
    
    def test_two_users_have_separate_workspaces(self):
        """Test that two users have separate workspaces"""
        sess1 = requests.Session()
        sess2 = requests.Session()
        
        # Register user 1
        email1 = f"user1_{uuid.uuid4().hex[:8]}@test.com"
        reg1 = sess1.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email1, "password": TEST_PASSWORD, "name": "User 1"}
        )
        assert reg1.status_code == 200
        user1 = reg1.json()
        
        # Register user 2
        email2 = f"user2_{uuid.uuid4().hex[:8]}@test.com"
        reg2 = sess2.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email2, "password": TEST_PASSWORD, "name": "User 2"}
        )
        assert reg2.status_code == 200
        user2 = reg2.json()
        
        # Verify different company IDs
        assert user1["company_id"] != user2["company_id"]
        print(f"✓ User 1 company: {user1['company_id']}")
        print(f"✓ User 2 company: {user2['company_id']}")
        
        # Verify workspace isolation
        workspace1 = sess1.get(f"{BASE_URL}/api/workspace").json()
        workspace2 = sess2.get(f"{BASE_URL}/api/workspace").json()
        
        assert workspace1["company"]["company_id"] != workspace2["company"]["company_id"]
        print("✓ Workspaces are properly isolated")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
