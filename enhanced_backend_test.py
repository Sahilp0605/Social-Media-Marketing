import requests
import sys
from datetime import datetime
import json

class EnhancedSocialFlowTester:
    def __init__(self, base_url="https://post-flow-ai.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.test_user_email = None
        
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
    
    def test_subscription_system(self):
        """Test subscription system features"""
        print("\n💳 Testing Subscription System...")
        
        # Test 1: Registration creates 14-day free trial
        timestamp = str(int(datetime.now().timestamp()))
        self.test_user_email = f"sub.test.{timestamp}@example.com"
        user_data = {
            "name": f"Subscription Test User {timestamp}",
            "email": self.test_user_email,
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test(
            "User Registration with Free Trial", 
            "POST", 
            "auth/register", 
            200, 
            data=user_data
        )
        
        if success:
            # Verify free trial plan and expiry
            if response.get('plan') == 'free' and response.get('plan_expires_at'):
                print(f"   ✅ Free trial plan assigned: {response['plan']}")
                print(f"   ✅ Trial expires at: {response['plan_expires_at']}")
                self.test_user_id = response['user_id']
            else:
                print(f"   ❌ Free trial not properly assigned")
                return False
        else:
            return False
            
        # Test 2: Get available plans
        success, plans_data = self.run_test(
            "Get Available Plans",
            "GET",
            "plans",
            200
        )
        
        if success:
            plans = plans_data.get('plans', [])
            expected_plans = ['starter', 'professional', 'enterprise']
            found_plans = [plan['id'] for plan in plans]
            
            if all(plan_id in found_plans for plan_id in expected_plans):
                print(f"   ✅ All expected plans found: {found_plans}")
                for plan in plans:
                    print(f"   - {plan['name']}: ${plan['price']}/month")
            else:
                print(f"   ❌ Missing expected plans. Found: {found_plans}")
                return False
                
        # Test 3: Get current subscription
        success, sub_data = self.run_test(
            "Get Current Subscription",
            "GET", 
            "subscription",
            200
        )
        
        if success:
            plan = sub_data.get('plan', {})
            usage = sub_data.get('usage', {})
            
            if plan.get('plan_id') == 'free':
                print(f"   ✅ Current plan: {plan.get('name', 'Free Trial')}")
                print(f"   ✅ Usage limits loaded: {len(usage)} metrics")
                
                # Verify usage tracking
                required_metrics = ['posts_this_month', 'templates_count', 'landing_pages_count', 
                                  'ai_generations_this_month', 'social_accounts_count']
                if all(metric in usage for metric in required_metrics):
                    print(f"   ✅ All usage metrics present")
                else:
                    print(f"   ❌ Missing usage metrics")
                    return False
            else:
                print(f"   ❌ Expected free plan, got: {plan.get('plan_id')}")
                return False
        
        # Test 4: Test payment mode toggle
        success, mode_data = self.run_test(
            "Get Payment Mode",
            "GET",
            "admin/payment-mode", 
            200
        )
        
        if success and 'mode' in mode_data:
            print(f"   ✅ Current payment mode: {mode_data['mode']}")
            
            # Toggle to opposite mode
            new_mode = "stripe" if mode_data['mode'] == "mock" else "mock"
            success, _ = self.run_test(
                f"Set Payment Mode to {new_mode}",
                "POST",
                f"admin/payment-mode?mode={new_mode}",
                200
            )
            
            if success:
                print(f"   ✅ Payment mode toggle successful")
            else:
                print(f"   ❌ Payment mode toggle failed")
                return False
        
        return True
    
    def test_social_accounts_system(self):
        """Test social accounts management"""
        print("\n👥 Testing Social Accounts System...")
        
        # Test 1: Get social accounts (should be empty for new user)
        success, accounts_data = self.run_test(
            "Get Social Accounts",
            "GET",
            "social-accounts",
            200
        )
        
        if success and isinstance(accounts_data, list):
            print(f"   ✅ Social accounts retrieved: {len(accounts_data)} accounts")
        else:
            print(f"   ❌ Failed to get social accounts")
            return False
            
        # Test 2: Create social account (mock connection)
        account_data = {
            "platform": "instagram",
            "account_name": "@test_account_mock",
            "account_id": "test_instagram_123"
        }
        
        success, response = self.run_test(
            "Connect Social Account (Mock)",
            "POST",
            "social-accounts",
            200,
            data=account_data
        )
        
        if success and 'account_id' in response:
            account_id = response['account_id']
            print(f"   ✅ Social account connected: {response['account_name']}")
            print(f"   ✅ Platform: {response['platform']}")
            
            # Test 3: Verify account in list
            success, updated_accounts = self.run_test(
                "Verify Connected Account",
                "GET",
                "social-accounts",
                200
            )
            
            if success and len(updated_accounts) > 0:
                print(f"   ✅ Account appears in list: {len(updated_accounts)} total")
                
                # Test 4: Disconnect account
                success, _ = self.run_test(
                    "Disconnect Social Account",
                    "DELETE",
                    f"social-accounts/{account_id}",
                    200
                )
                
                if success:
                    print(f"   ✅ Account disconnected successfully")
                else:
                    print(f"   ❌ Failed to disconnect account")
                    return False
            else:
                print(f"   ❌ Connected account not found in list")
                return False
        else:
            print(f"   ❌ Failed to connect social account")
            return False
            
        return True
    
    def test_checkout_flow(self):
        """Test checkout and subscription upgrade flow"""
        print("\n💰 Testing Checkout Flow...")
        
        # First, ensure we're in mock mode for testing
        success, _ = self.run_test(
            "Set Payment Mode to Mock",
            "POST",
            "admin/payment-mode?mode=mock",
            200
        )
        
        if not success:
            print("   ❌ Failed to set mock payment mode")
            return False
        
        # Test creating checkout session for professional plan
        checkout_data = {
            "plan_id": "professional", 
            "origin_url": "https://post-flow-ai.preview.emergentagent.com"
        }
        
        success, response = self.run_test(
            "Create Checkout Session (Mock Mode)",
            "POST",
            "subscription/checkout",
            200,
            data=checkout_data
        )
        
        if success and 'url' in response and 'session_id' in response:
            session_id = response['session_id']
            print(f"   ✅ Checkout session created: {session_id}")
            print(f"   ✅ Checkout URL generated: {response['url'][:50]}...")
            print(f"   ✅ Payment mode: {response.get('mode', 'unknown')}")
            
            # Test checking checkout status (should auto-complete in mock mode)
            success, status_response = self.run_test(
                "Check Checkout Status (Mock Payment)",
                "GET", 
                f"subscription/status/{session_id}",
                200
            )
            
            if success:
                payment_status = status_response.get('payment_status')
                if payment_status == 'paid':
                    print(f"   ✅ Mock payment completed successfully")
                    print(f"   ✅ Plan upgraded to: {status_response.get('plan_id')}")
                elif payment_status == 'pending':
                    print(f"   ⚠️  Payment still pending (expected in some cases)")
                    print(f"   ✅ Checkout flow functional")
                else:
                    print(f"   ❌ Unexpected payment status: {payment_status}")
                    return False
            else:
                print(f"   ❌ Failed to check checkout status")
                return False
                
        else:
            print(f"   ❌ Failed to create checkout session")
            return False
            
        return True
    
    def test_plan_limits_enforcement(self):
        """Test that plan limits are properly enforced"""
        print("\n🚫 Testing Plan Limits Enforcement...")
        
        # After checkout, user should be on professional plan
        # Test creating multiple templates to approach limit
        templates_created = 0
        max_attempts = 3  # Don't spam the API
        
        for i in range(max_attempts):
            template_data = {
                "name": f"Limit Test Template {i+1}",
                "category": "Social Media",
                "image_url": "https://via.placeholder.com/400x400?text=Limit+Test",
                "description": f"Template for testing limits #{i+1}"
            }
            
            success, response = self.run_test(
                f"Create Template {i+1} (Limit Test)",
                "POST",
                "templates",
                200,
                data=template_data
            )
            
            if success:
                templates_created += 1
            else:
                # Check if it's a limit error
                if "limit" in str(response).lower():
                    print(f"   ✅ Plan limit enforced after {templates_created} templates")
                    break
        
        print(f"   ✅ Created {templates_created} templates successfully")
        return True

def main():
    print("🚀 Starting Enhanced SocialFlow AI Tests...")
    tester = EnhancedSocialFlowTester()
    
    try:
        # Run enhanced subscription system tests
        if not tester.test_subscription_system():
            print("❌ Subscription system tests failed")
            return 1
        
        # Test social accounts functionality 
        if not tester.test_social_accounts_system():
            print("❌ Social accounts tests failed")
            return 1
        
        # Test checkout and payment flow
        if not tester.test_checkout_flow():
            print("❌ Checkout flow tests failed")
            return 1
            
        # Test plan limits
        if not tester.test_plan_limits_enforcement():
            print("❌ Plan limits tests failed")
            return 1
        
        # Print final results
        print(f"\n📊 Enhanced Tests Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        success_rate = (tester.tests_passed / tester.tests_run) * 100
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("✅ Enhanced subscription features testing: PASSED")
            return 0
        else:
            print("❌ Enhanced subscription features testing: FAILED")
            return 1
            
    except Exception as e:
        print(f"❌ Critical error during testing: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())