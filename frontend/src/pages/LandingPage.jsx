import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  BarChart3, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Check,
  Instagram,
  Facebook,
  Linkedin,
  Calendar,
  Target,
  TrendingUp
} from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Smart Scheduling",
      description: "Schedule posts across all platforms with AI-powered timing recommendations."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI Content Generation",
      description: "Generate captions, hashtags, and images with cutting-edge AI technology."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Lead Capture",
      description: "Convert clicks into leads with customizable landing pages and forms."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Track engagement, clicks, and conversions in real-time."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "CRM Integration",
      description: "Manage leads, track status, and nurture prospects seamlessly."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Campaign Management",
      description: "Plan, execute, and monitor marketing campaigns from one place."
    }
  ];

  const platforms = [
    { icon: <Instagram className="w-8 h-8" />, name: "Instagram", color: "from-pink-500 to-orange-400" },
    { icon: <Facebook className="w-8 h-8" />, name: "Facebook", color: "from-blue-600 to-blue-500" },
    { icon: <Linkedin className="w-8 h-8" />, name: "LinkedIn", color: "from-blue-700 to-blue-600" },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      features: ["5 Social Accounts", "100 Posts/month", "Basic Analytics", "Email Support"],
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      price: "$79",
      period: "/month",
      features: ["15 Social Accounts", "Unlimited Posts", "AI Content Generation", "Lead Capture Pages", "Priority Support"],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      features: ["Unlimited Accounts", "Custom Integrations", "White Label", "Dedicated Manager", "API Access"],
      cta: "Contact Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 font-heading">SocialFlow AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium text-sm">Features</a>
              <a href="#platforms" className="text-slate-600 hover:text-slate-900 font-medium text-sm">Platforms</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 font-medium text-sm">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900" data-testid="login-nav-btn">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="signup-nav-btn">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Powered by AI
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 font-heading tracking-tight leading-tight">
              Social Media Marketing
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"> Made Simple</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
              Create, schedule, and analyze your social media content. Capture leads and grow your business with AI-powered marketing tools.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 text-base" data-testid="hero-cta-btn">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base border-slate-200" data-testid="hero-demo-btn">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1746470427577-3520a681deab?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxhYnN0cmFjdCUyMGRpZ2l0YWwlMjBuZXR3b3JrJTIwdGVjaG5vbG9neSUyMHB1cnBsZXxlbnwwfHx8fDE3NzE2Nzg4NTh8MA&ixlib=rb-4.1.0&q=85"
                alt="Dashboard Preview"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 font-heading">Connect All Your Platforms</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Manage all your social media accounts from one central dashboard.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {platforms.map((platform, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-white shadow-lg`}>
                  {platform.icon}
                </div>
                <span className="text-sm font-medium text-slate-700">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 font-heading">Everything You Need to Grow</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Powerful features to streamline your social media marketing workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 font-heading">{feature.title}</h3>
                <p className="mt-2 text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 font-heading">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-slate-600">Choose the plan that fits your needs. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`rounded-2xl p-8 ${plan.popular 
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white ring-4 ring-indigo-600/20 scale-105' 
                  : 'bg-white border border-slate-200'}`}
              >
                {plan.popular && (
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className={`text-xl font-bold font-heading ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`text-4xl font-bold font-heading ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? 'text-white/70' : 'text-slate-500'}>{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <Check className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-indigo-600'}`} />
                      <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-slate-600'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full mt-8 h-11 ${plan.popular 
                    ? 'bg-white text-indigo-600 hover:bg-white/90' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  data-testid={`pricing-${plan.name.toLowerCase()}-btn`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold font-heading">Ready to Transform Your Marketing?</h2>
            <p className="mt-4 text-white/80 max-w-xl mx-auto">
              Join thousands of businesses using SocialFlow AI to grow their social presence.
            </p>
            <Link to="/register">
              <Button size="lg" className="mt-8 bg-white text-indigo-600 hover:bg-white/90 h-12 px-8" data-testid="cta-btn">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 font-heading">SocialFlow AI</span>
          </div>
          <p className="text-sm text-slate-500">© 2024 SocialFlow AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
