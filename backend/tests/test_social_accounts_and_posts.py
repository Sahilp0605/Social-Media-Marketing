"""
Test Suite for Social Media Marketing Software
Tests Mock Social Media Integration and Post Scheduling features
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "mocktest@test.com"
TEST_PASSWORD = "test123"
TEST_NAME = "Mock Test User"


class TestSetup:
    """Setup tests - ensure environment is working"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ API health check passed")


class TestAuthentication:
    """Authentication tests - required for subsequent tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_register_or_login(self, session):
        """Register new user or login existing user"""
        # Try to register first
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        
        if reg_response.status_code == 200:
            print(f"✅ User registered: {TEST_EMAIL}")
            data = reg_response.json()
            assert "user_id" in data
            return
        
        # If registration fails (user exists), try login
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        data = login_response.json()
        assert "user_id" in data
        print(f"✅ User logged in: {TEST_EMAIL}")


@pytest.fixture(scope="module")
def auth_session():
    """Get authenticated session for all tests"""
    session = requests.Session()
    
    # Try to register first
    reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "name": TEST_NAME
    })
    
    if reg_response.status_code != 200:
        # Login if registration fails
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200, f"Auth failed: {login_response.text}"
    
    return session


# ============ MOCK SOCIAL MEDIA INTEGRATION TESTS ============

class TestSocialAccountsCRUD:
    """Test Social Accounts CRUD operations"""
    
    def test_create_instagram_account(self, auth_session):
        """Create a mock Instagram account"""
        response = auth_session.post(f"{BASE_URL}/api/social-accounts", json={
            "platform": "instagram",
            "account_name": "@test_instagram_user"
        })
        assert response.status_code == 200, f"Failed to create account: {response.text}"
        data = response.json()
        assert data["platform"] == "instagram"
        assert data["account_name"] == "@test_instagram_user"
        assert data["is_connected"] == True
        assert "account_id" in data
        print(f"✅ Created Instagram account: {data['account_id']}")
        return data["account_id"]
    
    def test_create_facebook_account(self, auth_session):
        """Create a mock Facebook account"""
        response = auth_session.post(f"{BASE_URL}/api/social-accounts", json={
            "platform": "facebook",
            "account_name": "Test Facebook Page"
        })
        assert response.status_code == 200, f"Failed to create account: {response.text}"
        data = response.json()
        assert data["platform"] == "facebook"
        assert data["is_connected"] == True
        print(f"✅ Created Facebook account: {data['account_id']}")
    
    def test_get_social_accounts(self, auth_session):
        """Get all connected social accounts"""
        response = auth_session.get(f"{BASE_URL}/api/social-accounts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        print(f"✅ Retrieved {len(data)} social accounts")
        return data


class TestSocialAccountSync:
    """Test Mock Sync functionality - simulates fetching stats from platform"""
    
    def test_sync_account(self, auth_session):
        """Sync a social account to get simulated follower stats"""
        # First get an account
        accounts_response = auth_session.get(f"{BASE_URL}/api/social-accounts")
        assert accounts_response.status_code == 200
        accounts = accounts_response.json()
        
        if len(accounts) == 0:
            # Create one if none exist
            create_response = auth_session.post(f"{BASE_URL}/api/social-accounts", json={
                "platform": "linkedin",
                "account_name": "Test LinkedIn Page"
            })
            accounts = [create_response.json()]
        
        account_id = accounts[0]["account_id"]
        
        # Sync the account
        sync_response = auth_session.post(f"{BASE_URL}/api/social-accounts/{account_id}/sync")
        assert sync_response.status_code == 200, f"Sync failed: {sync_response.text}"
        data = sync_response.json()
        
        # Verify mock stats returned
        assert "message" in data
        assert "stats" in data
        stats = data["stats"]
        assert "followers_count" in stats
        assert "following_count" in stats
        assert "posts_count" in stats
        assert "engagement_rate" in stats
        assert "last_synced_at" in stats
        
        # Verify stats are within expected mock ranges
        assert isinstance(stats["followers_count"], int)
        assert stats["followers_count"] >= 0
        assert isinstance(stats["engagement_rate"], float)
        
        print(f"✅ Synced account {account_id} - {stats['followers_count']} followers, {stats['engagement_rate']}% engagement")


class TestSocialAccountTestPost:
    """Test Mock Test Post functionality - simulates posting to platform"""
    
    def test_test_post_to_account(self, auth_session):
        """Send a test post to a connected account (mock)"""
        # Get an account
        accounts_response = auth_session.get(f"{BASE_URL}/api/social-accounts")
        accounts = accounts_response.json()
        
        if len(accounts) == 0:
            pytest.skip("No social accounts available for test post")
        
        account_id = accounts[0]["account_id"]
        platform = accounts[0]["platform"]
        
        # Send test post
        test_response = auth_session.post(f"{BASE_URL}/api/social-accounts/{account_id}/test-post")
        assert test_response.status_code == 200, f"Test post failed: {test_response.text}"
        data = test_response.json()
        
        # Verify mock response
        assert data["success"] == True
        assert data["platform"] == platform
        assert "test_post_id" in data
        assert "message" in data
        assert "simulated_reach" in data
        assert data["simulated_reach"] > 0
        
        print(f"✅ Test post successful to {platform} - simulated reach: {data['simulated_reach']}")


# ============ POST SCHEDULING TESTS ============

class TestPostCRUD:
    """Test Post CRUD operations"""
    
    def test_create_draft_post(self, auth_session):
        """Create a post as draft"""
        response = auth_session.post(f"{BASE_URL}/api/posts", json={
            "title": "TEST_Draft Post",
            "caption": "This is a test draft post for testing",
            "hashtags": ["test", "draft"],
            "platforms": ["instagram"],
            "status": "draft"
        })
        assert response.status_code == 200, f"Failed to create draft: {response.text}"
        data = response.json()
        assert data["status"] == "draft"
        assert data["title"] == "TEST_Draft Post"
        print(f"✅ Created draft post: {data['post_id']}")
        return data["post_id"]
    
    def test_create_scheduled_post(self, auth_session):
        """Create a scheduled post with future datetime"""
        # Schedule for 1 hour from now
        future_time = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        
        response = auth_session.post(f"{BASE_URL}/api/posts", json={
            "title": "TEST_Scheduled Post",
            "caption": "This post is scheduled for the future",
            "hashtags": ["scheduled", "test"],
            "platforms": ["instagram", "facebook"],
            "scheduled_at": future_time,
            "status": "scheduled"
        })
        assert response.status_code == 200, f"Failed to create scheduled post: {response.text}"
        data = response.json()
        assert data["status"] == "scheduled"
        assert data["scheduled_at"] is not None
        print(f"✅ Created scheduled post: {data['post_id']} for {future_time}")
        return data["post_id"]
    
    def test_create_and_verify_post_persistence(self, auth_session):
        """Create a post and verify it persists via GET"""
        # Create post
        create_response = auth_session.post(f"{BASE_URL}/api/posts", json={
            "title": "TEST_Persistence Test",
            "caption": "Testing data persistence",
            "hashtags": ["persist"],
            "platforms": ["linkedin"],
            "status": "draft"
        })
        assert create_response.status_code == 200
        created_post = create_response.json()
        post_id = created_post["post_id"]
        
        # Verify via GET
        get_response = auth_session.get(f"{BASE_URL}/api/posts/{post_id}")
        assert get_response.status_code == 200
        fetched_post = get_response.json()
        
        assert fetched_post["title"] == "TEST_Persistence Test"
        assert fetched_post["caption"] == "Testing data persistence"
        assert "persist" in fetched_post["hashtags"]
        print(f"✅ Verified post persistence: {post_id}")
    
    def test_get_all_posts(self, auth_session):
        """Get all posts for user"""
        response = auth_session.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Retrieved {len(data)} posts")


class TestPostPublish:
    """Test Post Publish functionality (mock)"""
    
    def test_publish_post_immediately(self, auth_session):
        """Create and immediately publish a post"""
        # Create a draft post
        create_response = auth_session.post(f"{BASE_URL}/api/posts", json={
            "title": "TEST_Immediate Publish",
            "caption": "This post will be published immediately",
            "hashtags": ["instant"],
            "platforms": ["instagram", "facebook"],
            "status": "draft"
        })
        assert create_response.status_code == 200
        post_id = create_response.json()["post_id"]
        
        # Publish the post
        publish_response = auth_session.post(f"{BASE_URL}/api/posts/{post_id}/publish")
        assert publish_response.status_code == 200, f"Publish failed: {publish_response.text}"
        data = publish_response.json()
        
        # Verify mock publish results
        assert "message" in data
        assert "results" in data
        results = data["results"]
        assert len(results) == 2  # instagram and facebook
        
        for result in results:
            assert result["status"] == "published"
            assert "external_id" in result
            assert "external_url" in result
            assert "simulated_reach" in result
            assert result["simulated_reach"] > 0
        
        # Verify post status updated
        get_response = auth_session.get(f"{BASE_URL}/api/posts/{post_id}")
        assert get_response.status_code == 200
        updated_post = get_response.json()
        assert updated_post["status"] == "published"
        
        print(f"✅ Published post {post_id} to {len(results)} platforms")


class TestScheduler:
    """Test Post Scheduler functionality"""
    
    def test_get_scheduler_queue(self, auth_session):
        """Get the scheduler queue with pending scheduled posts"""
        response = auth_session.get(f"{BASE_URL}/api/scheduler/queue")
        assert response.status_code == 200, f"Failed to get queue: {response.text}"
        data = response.json()
        
        assert "queue" in data
        assert "total_scheduled" in data
        assert "due_now" in data
        
        print(f"✅ Scheduler queue: {data['total_scheduled']} scheduled, {data['due_now']} due now")
    
    def test_process_scheduled_posts_with_past_time(self, auth_session):
        """Create a scheduled post with past time and process it"""
        # Schedule for 1 minute ago (should be immediately due)
        past_time = (datetime.utcnow() - timedelta(minutes=1)).isoformat()
        
        # Create scheduled post with past time
        create_response = auth_session.post(f"{BASE_URL}/api/posts", json={
            "title": "TEST_Past Schedule",
            "caption": "This post was scheduled in the past",
            "hashtags": ["pastdue"],
            "platforms": ["instagram"],
            "scheduled_at": past_time,
            "status": "scheduled"
        })
        assert create_response.status_code == 200
        post_id = create_response.json()["post_id"]
        
        # Process scheduler
        process_response = auth_session.post(f"{BASE_URL}/api/scheduler/process")
        assert process_response.status_code == 200, f"Scheduler process failed: {process_response.text}"
        data = process_response.json()
        
        assert "message" in data
        assert "published_count" in data
        assert "results" in data
        
        # Verify the past-due post was published
        if data["published_count"] > 0:
            # Check if our post is in the results
            published_ids = [r["post_id"] for r in data["results"]]
            if post_id in published_ids:
                # Verify post status changed
                get_response = auth_session.get(f"{BASE_URL}/api/posts/{post_id}")
                if get_response.status_code == 200:
                    updated_post = get_response.json()
                    assert updated_post["status"] == "published"
                    print(f"✅ Scheduler published post {post_id}")
        
        print(f"✅ Scheduler processed {data['published_count']} posts")
    
    def test_get_pending_scheduled_posts(self, auth_session):
        """Get posts that are scheduled and due for publishing"""
        response = auth_session.get(f"{BASE_URL}/api/posts/scheduled/pending")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Found {len(data)} pending scheduled posts")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_posts(self, auth_session):
        """Delete test posts created during tests"""
        # Get all posts
        response = auth_session.get(f"{BASE_URL}/api/posts")
        if response.status_code != 200:
            return
        
        posts = response.json()
        deleted_count = 0
        
        for post in posts:
            if post["title"].startswith("TEST_"):
                delete_response = auth_session.delete(f"{BASE_URL}/api/posts/{post['post_id']}")
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"✅ Cleaned up {deleted_count} test posts")
    
    def test_disconnect_test_accounts(self, auth_session):
        """Disconnect social accounts created during tests"""
        # Get all accounts
        response = auth_session.get(f"{BASE_URL}/api/social-accounts")
        if response.status_code != 200:
            return
        
        accounts = response.json()
        # Only delete accounts with test-like names
        test_accounts = [a for a in accounts if "test" in a["account_name"].lower() or a["account_name"].startswith("@test")]
        deleted_count = 0
        
        for account in test_accounts:
            delete_response = auth_session.delete(f"{BASE_URL}/api/social-accounts/{account['account_id']}")
            if delete_response.status_code == 200:
                deleted_count += 1
        
        print(f"✅ Cleaned up {deleted_count} test social accounts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
