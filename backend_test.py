import requests
import sys
from datetime import datetime
import json

class SocialFlowAPITester:
    def __init__(self, base_url="https://post-flow-ai.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers:
            self.session.headers.update(headers)
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}
    
    def test_health_check(self):
        """Test health endpoints"""
        success1, _ = self.run_test("Health Check", "GET", "", 200)
        success2, _ = self.run_test("Health Check API", "GET", "health", 200)
        return success1 and success2
    
    def test_user_registration(self):
        """Test user registration"""
        timestamp = str(int(datetime.now().timestamp()))
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"test.user.{timestamp}@example.com",
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test(
            "User Registration", 
            "POST", 
            "auth/register", 
            200, 
            data=user_data
        )
        
        if success and 'user_id' in response:
            self.test_user_id = response['user_id']
            print(f"   User ID: {self.test_user_id}")
            return True, response
        return False, {}
    
    def test_user_login(self):
        """Test user login"""
        if not self.test_user_id:
            print("❌ No test user available for login test")
            return False
        
        # We need to use the same email from registration
        timestamp = str(int(datetime.now().timestamp()))
        login_data = {
            "email": f"test.user.{timestamp}@example.com",
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login", 
            200,
            data=login_data
        )
        return success
    
    def test_protected_endpoints(self):
        """Test protected endpoints that require authentication"""
        endpoints_to_test = [
            ("Get Current User", "GET", "auth/me", 200),
            ("Get Posts", "GET", "posts", 200),
            ("Get Templates", "GET", "templates", 200), 
            ("Get Landing Pages", "GET", "landing-pages", 200),
            ("Get Leads", "GET", "leads", 200),
            ("Get Campaigns", "GET", "campaigns", 200),
            ("Get Analytics", "GET", "analytics/overview", 200)
        ]
        
        all_passed = True
        for name, method, endpoint, expected in endpoints_to_test:
            success, _ = self.run_test(name, method, endpoint, expected)
            if not success:
                all_passed = False
        
        return all_passed
    
    def test_post_creation(self):
        """Test creating a new post"""
        post_data = {
            "title": "Test Social Media Post",
            "caption": "This is a test post created by automated testing",
            "hashtags": ["test", "automation", "socialflow"],
            "platforms": ["instagram", "facebook"],
            "status": "draft"
        }
        
        success, response = self.run_test(
            "Create Post",
            "POST",
            "posts", 
            200,
            data=post_data
        )
        
        if success and 'post_id' in response:
            # Test getting the created post
            post_id = response['post_id']
            success2, _ = self.run_test(
                "Get Created Post",
                "GET",
                f"posts/{post_id}",
                200
            )
            return success and success2
        return False
    
    def test_template_creation(self):
        """Test creating a template"""
        template_data = {
            "name": "Test Template",
            "category": "Social Media",
            "image_url": "https://via.placeholder.com/400x400?text=Test+Template",
            "description": "Automated test template"
        }
        
        success, response = self.run_test(
            "Create Template",
            "POST",
            "templates",
            200,
            data=template_data
        )
        return success
    
    def test_landing_page_creation(self):
        """Test creating a landing page"""
        page_data = {
            "name": "Test Landing Page", 
            "headline": "Welcome to Our Test Page",
            "description": "This is a test landing page for lead capture",
            "cta_text": "Sign Up Now",
            "background_color": "#4F46E5",
            "text_color": "#FFFFFF"
        }
        
        success, response = self.run_test(
            "Create Landing Page",
            "POST",
            "landing-pages",
            200,
            data=page_data
        )
        
        if success and 'slug' in response:
            # Test public landing page access
            slug = response['slug']
            success2, _ = self.run_test(
                "Access Public Landing Page",
                "GET",
                f"p/{slug}",
                200
            )
            
            # Test lead submission
            lead_data = {
                "name": "Test Lead",
                "email": "test.lead@example.com",
                "page_id": response['page_id'],
                "message": "Test lead submission"
            }
            success3, _ = self.run_test(
                "Submit Lead",
                "POST",
                "leads",
                200,
                data=lead_data
            )
            
            return success and success2 and success3
        return False
    
    def test_campaign_creation(self):
        """Test creating a campaign"""
        campaign_data = {
            "name": "Test Campaign",
            "description": "Automated test campaign", 
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "platforms": ["instagram", "facebook"],
            "budget": 1000.0
        }
        
        success, _ = self.run_test(
            "Create Campaign",
            "POST",
            "campaigns",
            200,
            data=campaign_data
        )
        return success
    
    def test_ai_generation(self):
        """Test AI content generation"""
        # Test caption generation
        caption_request = {
            "prompt": "Coffee shop morning vibes",
            "type": "caption"
        }
        
        success1, _ = self.run_test(
            "AI Caption Generation",
            "POST",
            "ai/generate",
            200,
            data=caption_request
        )
        
        # Test hashtag generation
        hashtag_request = {
            "prompt": "Coffee shop morning vibes", 
            "type": "hashtags"
        }
        
        success2, _ = self.run_test(
            "AI Hashtag Generation",
            "POST",
            "ai/generate",
            200,
            data=hashtag_request
        )
        
        return success1 and success2

def main():
    print("🚀 Starting SocialFlow AI API Tests...")
    tester = SocialFlowAPITester()
    
    try:
        # Test health endpoints
        if not tester.test_health_check():
            print("❌ Health check failed, stopping tests")
            return 1
        
        # Test registration and login
        if not tester.test_user_registration():
            print("❌ User registration failed, stopping tests")
            return 1
        
        if not tester.test_user_login():
            print("❌ User login failed, stopping tests")
            return 1
        
        # Test protected endpoints
        print("\n📋 Testing Protected Endpoints...")
        if not tester.test_protected_endpoints():
            print("❌ Some protected endpoints failed")
        
        # Test CRUD operations
        print("\n📝 Testing CRUD Operations...")
        tester.test_post_creation()
        tester.test_template_creation()
        tester.test_landing_page_creation()
        tester.test_campaign_creation()
        
        # Test AI features
        print("\n🤖 Testing AI Features...")
        tester.test_ai_generation()
        
        # Print final results
        print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        success_rate = (tester.tests_passed / tester.tests_run) * 100
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("✅ Overall API testing: PASSED")
            return 0
        else:
            print("❌ Overall API testing: FAILED")
            return 1
            
    except Exception as e:
        print(f"❌ Critical error during testing: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())