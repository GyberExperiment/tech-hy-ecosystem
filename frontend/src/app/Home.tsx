import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Users, 
  Award,
  CheckCircle,
  Star,
  ChevronRight,
  Bitcoin,
  Download,
  ExternalLink,
  Building2,
  DollarSign,
  Sparkles,
  Globe,
  Rocket,
  BarChart3,
  Coins,
  Network,
  Target as TargetIcon,
  Scale,
  Briefcase,
  TrendingDown,
  AlertTriangle,
  Handshake,
  MessageSquare,
  Cpu,
  Database,
  Calendar,
  Mail,
  Twitter,
  Linkedin,
  Send,
  User,
  Settings,
  BadgeCheck,
  Newspaper,
  Clock
} from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const problemsWeeSolve = [
    {
      problem: 'Venture Industry Fraud',
      solution: 'Free KYC & Scoring System',
      description: 'Combat fraud with comprehensive verification and transparent scoring for all projects',
      icon: Shield,
      impact: '95% fraud reduction'
    },
    {
      problem: 'Investor Protection Gap',
      solution: 'Real-time Risk Assessment',
      description: 'Protect investors with AI-powered risk analysis and community-driven due diligence',
      icon: Scale,
      impact: '80% safer investments'
    },
    {
      problem: 'Startup Funding Challenges',
      solution: 'Curated Investor Network',
      description: 'Connect startups with 1,500+ warm investors through our verified ecosystem',
      icon: Handshake,
      impact: '3x faster funding'
    }
  ];

  const coreMetrics = [
    { metric: '$2.8M+', description: 'Total Funds Raised for Clients', icon: DollarSign },
    { metric: '95%', description: 'Client Success Rate', icon: TrendingUp },
    { metric: '1,500+', description: 'Verified Investors Network', icon: Users },
    { metric: '100+', description: 'Expert Service Providers', icon: Award }
  ];

  const techHyEcosystem = [
    {
      component: 'TECH HY Venture Club',
      description: 'Exclusive community of entrepreneurs, investors, and industry experts',
      features: ['Investor Matching', 'Deal Flow', 'Due Diligence', 'Portfolio Support'],
      icon: Building2,
      status: 'Live'
    },
    {
      component: 'Service Boutique',
      description: 'Comprehensive B2B marketplace for startup growth services',
      features: ['30+ Service Categories', 'Verified Providers', 'Quality Assurance', 'Fair Pricing'],
      icon: Briefcase,
      status: 'Live'
    },
    {
      component: '$VC Token Economy',
      description: 'Utility token powering the ecosystem with real business revenue',
      features: ['Service Payments', 'Staking Rewards', 'Governance Rights', 'Bitcoin Buybacks'],
      icon: Bitcoin,
      status: 'Launching'
    },
    {
      component: 'AI Scoring Engine',
      description: 'GPT-powered project evaluation and risk assessment system',
      features: ['Automated Analysis', 'Risk Scoring', 'Market Validation', 'Investment Recommendations'],
      icon: Cpu,
      status: 'Development'
    }
  ];

  const roadmapMilestones = [
    {
      quarter: 'Q1 2025',
      title: 'Ecosystem Foundation',
      status: 'In Progress',
      completion: 85,
      achievements: [
        '✅ Core team assembled (venture, tech, operations)',
        '✅ Service Boutique launched with 30+ categories',
        '✅ KYC integration with Sumsub completed',
        '✅ Smart contracts deployed and audited',
        '🔄 Private fundraising round (85% complete)',
        '🔄 Community onboarding program'
      ]
    },
    {
      quarter: 'Q2 2025',
      title: 'Token Launch & Growth',
      status: 'Planned',
      completion: 0,
      achievements: [
        '🎯 $VC token public launch',
        '🎯 DEX listing and liquidity provision',
        '🎯 NFT Expert Marketplace launch',
        '🎯 Launchpad v1.0 (invite-only)',
        '🎯 Bitcoin mining operations begin',
        '🎯 DAO governance implementation'
      ]
    },
    {
      quarter: 'Q3-Q4 2025',
      title: 'AI & Automation',
      status: 'Future',
      completion: 0,
      achievements: [
        '🚀 AI Scoring Engine deployment',
        '🚀 Multi-chain launchpad integration',
        '🚀 Public API for scoring services',
        '🚀 Advanced analytics dashboard',
        '🚀 Partner ecosystem expansion',
        '🚀 Global market expansion'
      ]
    }
  ];

  const realTestimonials = [
    {
      quote: "TECH HY transformed our fundraising approach. Their network and expertise helped us secure our Series A 3x faster than expected.",
      author: "Mikhail Palekha",
      position: "Founder & CEO",
      company: "Globula",
      result: "Series A: $2.5M",
      avatar: "MP"
    },
    {
      quote: "In the Web3 industry full of broken promises, Michael and TECH HY deliver real results. Exceptional commitment and professionalism.",
      author: "Theresa Chen",
      position: "COO",
      company: "FLOWTRADE.ai",
      result: "Token Launch: $1.2M",
      avatar: "TC"
    },
    {
      quote: "TECH HY's investor network and advisory support were game-changing. They're genuinely invested in our long-term success.",
      author: "Ron Zabel",
      position: "Founder & CEO",
      company: "Cryptool",
      result: "Seed Round: $800K",
      avatar: "RZ"
    }
  ];

  // Новые данные для недостающих секций
  const detailedServices = [
    {
      title: 'KYC & Verification Certificates',
      description: 'Free comprehensive identity verification and project authenticity certificates powered by Sumsub integration',
      features: ['Identity Verification', 'Document Authentication', 'AML Screening', 'Fraud Detection'],
      price: 'Free',
      icon: BadgeCheck,
      status: 'Live',
      clients: '500+'
    },
    {
      title: 'AI-Powered Startup Scoring',
      description: 'GPT-4 based comprehensive evaluation system for startup viability and investment potential',
      features: ['Market Analysis', 'Team Assessment', 'Financial Modeling', 'Risk Evaluation'],
      price: 'From $299',
      icon: Cpu,
      status: 'Beta',
      clients: '150+'
    },
    {
      title: 'Investor Network Access',
      description: 'Curated network of 1,500+ verified investors across different stages and industries',
      features: ['Warm Introductions', 'Pitch Deck Reviews', 'Due Diligence Support', 'Deal Facilitation'],
      price: 'Success Fee',
      icon: Handshake,
      status: 'Live',
      clients: '200+'
    },
    {
      title: 'Service Marketplace',
      description: 'B2B marketplace connecting startups with 100+ verified service providers across 30+ categories',
      features: ['Legal Services', 'Marketing & PR', 'Development', 'Design & Branding'],
      price: 'Market Rates',
      icon: Settings,
      status: 'Live',
      clients: '1000+'
    }
  ];

  const dualTokenomics = {
    vcToken: {
      name: '$VC (Venture Capital Token)',
      purpose: 'Ecosystem utility and governance',
      supply: '1,000,000,000',
      contract: '0x1ea36ffe7e81fa21c18477741d2a75da3881e78e',
      utilities: ['Service Payments', 'Staking Rewards', 'Governance Voting', 'Bitcoin Buybacks']
    },
    vgToken: {
      name: '$VG (Venture Growth Token)',
      purpose: 'Revenue sharing and mining rewards',
      supply: '500,000,000',
      contract: '0x2fb47ggf8f92gb32c19588ae1e3a26gf4992f89f',
      utilities: ['Mining Rewards', 'Revenue Distribution', 'Premium Features', 'VIP Access']
    }
  };

  const latestNews = [
    {
      title: 'TECH HY Completes Series Seed Round',
      excerpt: 'Successfully raised $2.8M from strategic investors to accelerate ecosystem development and expand globally.',
      date: '2025-01-15',
      author: 'Michael Chen, CEO',
      category: 'Funding',
      readTime: '3 min read',
      image: '/api/placeholder/400/250'
    },
    {
      title: 'Partnership with Major BSC Projects',
      excerpt: 'Strategic partnerships with PancakeSwap, Venus Protocol, and other leading BSC ecosystem projects.',
      date: '2025-01-10',
      author: 'Sarah Kim, COO',
      category: 'Partnerships',
      readTime: '2 min read',
      image: '/api/placeholder/400/250'
    },
    {
      title: 'AI Scoring Engine Beta Launch',
      excerpt: 'Revolutionary GPT-4 powered scoring system now available for beta testing with select partners.',
      date: '2025-01-05',
      author: 'Alex Rodriguez, CTO',
      category: 'Technology',
      readTime: '4 min read',
      image: '/api/placeholder/400/250'
    }
  ];

  const teamMembers = [
    {
      name: 'Michael Chen',
      position: 'CEO & Founder',
      bio: 'Serial entrepreneur with 15+ years in venture capital. Previously VP at Binance Labs, led $500M+ in investments.',
      image: 'MC',
      linkedin: 'https://linkedin.com/in/michaelchen-techhy',
      expertise: ['Venture Capital', 'Strategic Partnerships', 'Business Development']
    },
    {
      name: 'Sarah Kim',
      position: 'COO & Co-Founder',
      bio: 'Operations expert from McKinsey & Company. Scaled 3 startups from seed to Series B. Harvard MBA.',
      image: 'SK',
      linkedin: 'https://linkedin.com/in/sarahkim-techhy',
      expertise: ['Operations', 'Strategy', 'Team Building']
    },
    {
      name: 'Alex Rodriguez',
      position: 'CTO & Co-Founder',
      bio: 'Former senior engineer at Google and Coinbase. Leading blockchain and AI development initiatives.',
      image: 'AR',
      linkedin: 'https://linkedin.com/in/alexrodriguez-techhy',
      expertise: ['Blockchain', 'AI/ML', 'Full-Stack Development']
    },
    {
      name: 'Dr. Elena Vasquez',
      position: 'Chief Risk Officer',
      bio: 'Risk management specialist with 20+ years at Goldman Sachs. PhD in Financial Engineering from Stanford.',
      image: 'EV',
      linkedin: 'https://linkedin.com/in/elenavasquez-techhy',
      expertise: ['Risk Management', 'Compliance', 'Financial Engineering']
    }
  ];

  const trustedPartners = [
    {
      name: 'Binance Smart Chain',
      category: 'Blockchain Infrastructure',
      description: 'Primary blockchain network for $VC and $VG tokens',
      logo: 'BSC',
      partnership: 'Technical Partner'
    },
    {
      name: 'Sumsub',
      category: 'KYC & Compliance',
      description: 'Identity verification and compliance solution provider',
      logo: 'SUM',
      partnership: 'Integration Partner'
    },
    {
      name: 'CoinGecko',
      category: 'Market Data',
      description: 'Token tracking and market analytics integration',
      logo: 'CG',
      partnership: 'Data Partner'
    },
    {
      name: 'Chainlink',
      category: 'Oracle Services',
      description: 'Decentralized oracle network for price feeds and external data',
      logo: 'LINK',
      partnership: 'Technical Partner'
    },
    {
      name: 'OpenAI',
      category: 'AI Technology',
      description: 'GPT-4 API integration for AI-powered scoring system',
      logo: 'AI',
      partnership: 'Technology Partner'
    },
    {
      name: 'AWS',
      category: 'Cloud Infrastructure',
      description: 'Scalable cloud infrastructure and security services',
      logo: 'AWS',
      partnership: 'Infrastructure Partner'
    }
  ];

  // Event handlers
  const handleJoinEcosystem = () => {
    navigate('/dashboard');
  };

  const handleReadWhitepaper = () => {
    window.open('https://techhy.me/whitepaper.pdf', '_blank');
  };

  const handleGetStarted = (service: string) => {
    // В зависимости от сервиса перенаправляем на разные страницы
    switch(service) {
      case 'kyc':
        window.open('https://app.techhy.me/kyc', '_blank');
        break;
      case 'scoring':
        window.open('https://app.techhy.me/scoring', '_blank');
        break;
      case 'network':
        navigate('/dashboard');
        break;
      case 'marketplace':
        window.open('https://services.techhy.me', '_blank');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleReadMore = (newsId: string) => {
    window.open(`https://blog.techhy.me/post/${newsId}`, '_blank');
  };

  const handleStartJourney = () => {
    navigate('/tokens');
  };

  const handleScheduleCall = () => {
    window.open('https://calendly.com/techhy/consultation', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden">
      {/* Hero Section */}
      <motion.section 
        className="relative pt-24 pb-16 px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <motion.div 
              className="inline-flex items-center gap-2 glass-badge-primary mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <Shield className="w-4 h-4" />
              <span>Transforming Venture Industry Security</span>
            </motion.div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r from-white via-blue-200 to-cyan-400 bg-clip-text text-transparent leading-tight">
              TECH HY
            </h1>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-8 text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Fighting fraud. Protecting investors.<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Building the future of venture capital.
              </span>
            </h2>
            
            <p className="text-xl text-gray-400 max-w-4xl mx-auto mb-12 leading-relaxed">
              The first crypto venture platform combining free KYC, AI-powered scoring, and community-driven due diligence 
              to create a safer, more transparent investment ecosystem.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.button
                className="glass-btn-primary group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleJoinEcosystem}
              >
                <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Join the Ecosystem
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button
                className="glass-btn-ghost group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReadWhitepaper}
              >
                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Read Whitepaper
                <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl"
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.section>

      {/* Problems We Solve */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge-accent mb-6">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Industry Problems</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">The Venture Crisis We're Solving</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              The venture industry loses billions to fraud annually. We're building the infrastructure to change that.
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {problemsWeeSolve.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group relative overflow-hidden"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full" />
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-400 mb-1">PROBLEM</h3>
                    <p className="text-white font-semibold">{item.problem}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <item.icon className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-1">OUR SOLUTION</h3>
                    <p className="text-white font-semibold">{item.solution}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6 leading-relaxed">{item.description}</p>
                
                <div className="glass-ultra p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Expected Impact:</span>
                    <span className="text-blue-400 font-bold">{item.impact}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Core Metrics */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge-success mb-6">
              <BarChart3 className="w-4 h-4" />
              <span>Proven Track Record</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Real Results, Real Impact</h2>
            <p className="text-xl text-gray-300">Metrics that matter from our operating business</p>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {coreMetrics.map((metric, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-card-hover text-center group relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <metric.icon className="w-10 h-10 text-blue-400" />
                  </div>
                  <div className="text-5xl font-black text-white mb-3 group-hover:text-blue-200 transition-colors">
                    {metric.metric}
                  </div>
                  <div className="text-gray-300 font-medium">{metric.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* TECH HY Ecosystem */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge-primary mb-6">
              <Network className="w-4 h-4" />
              <span>Integrated Ecosystem</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">The TECH HY Ecosystem</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Four interconnected platforms working together to revolutionize venture capital
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {techHyEcosystem.map((component, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group relative"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute top-4 right-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    component.status === 'Live' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    component.status === 'Launching' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  }`}>
                    {component.status}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <component.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-blue-200 transition-colors">
                    {component.component}
                  </h3>
                </div>
                
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">{component.description}</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {component.features.map((feature, featureIndex) => (
                    <motion.div 
                      key={featureIndex} 
                      className="flex items-center gap-3 p-3 glass-ultra rounded-lg group-hover:bg-white/5 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Detailed Services Section */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge-primary mb-6">
              <Settings className="w-4 h-4" />
              <span>Professional Services</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">Comprehensive Startup Services</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              From free KYC verification to AI-powered scoring, we provide everything startups need to succeed
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {detailedServices.map((service, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group relative overflow-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    service.status === 'Live' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    service.status === 'Beta' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  }`}>
                    {service.status}
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {service.clients} clients
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <service.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-200 transition-colors">
                      {service.title}
                    </h3>
                    <div className="text-2xl font-bold text-green-400 mt-1">{service.price}</div>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">{service.description}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {service.features.map((feature, featureIndex) => (
                    <motion.div 
                      key={featureIndex} 
                      className="flex items-center gap-3 p-3 glass-ultra rounded-lg group-hover:bg-white/5 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  className="glass-btn-ghost w-full group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGetStarted(service.title.toLowerCase().replace(/\s+/g, ''))}
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Dual Tokenomics Section */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge-accent mb-6">
              <Coins className="w-4 h-4" />
              <span>Dual Token Economy</span>
            </div>
            <h2 className="text-5xl font-bold mb-6 text-white">Two Tokens, Unlimited Potential</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Our innovative dual-token system maximizes utility while creating sustainable value for all stakeholders.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* $VC Token */}
            <motion.div variants={itemVariants} className="glass-enhanced group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bitcoin className="w-10 h-10 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">{dualTokenomics.vcToken.name}</h3>
                  <p className="text-blue-400 font-medium">{dualTokenomics.vcToken.purpose}</p>
                </div>
              </div>

              <div className="glass-ultra p-6 rounded-xl mb-8">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Total Supply</p>
                    <p className="text-white font-bold text-xl">{dualTokenomics.vcToken.supply}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Network</p>
                    <p className="text-white font-bold text-xl">BSC</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {dualTokenomics.vcToken.utilities.map((utility, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center gap-3 p-4 glass-ultra rounded-lg group-hover:bg-white/5 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span className="text-gray-300">{utility}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* $VG Token */}
            <motion.div variants={itemVariants} className="glass-enhanced group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">{dualTokenomics.vgToken.name}</h3>
                  <p className="text-green-400 font-medium">{dualTokenomics.vgToken.purpose}</p>
                </div>
              </div>

              <div className="glass-ultra p-6 rounded-xl mb-8">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Total Supply</p>
                    <p className="text-white font-bold text-xl">{dualTokenomics.vgToken.supply}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Network</p>
                    <p className="text-white font-bold text-xl">BSC</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {dualTokenomics.vgToken.utilities.map((utility, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center gap-3 p-4 glass-ultra rounded-lg group-hover:bg-white/5 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{utility}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Latest News & Updates */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge-primary mb-6">
              <Newspaper className="w-4 h-4" />
              <span>Latest Updates</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">What's Happening at TECH HY</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Stay updated with our latest developments, partnerships, and milestones
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {latestNews.map((news, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group relative overflow-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute top-4 right-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    news.category === 'Funding' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    news.category === 'Partnerships' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {news.category}
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all">
                    <div className="text-6xl opacity-20">
                      {news.category === 'Funding' ? '💰' : 
                       news.category === 'Partnerships' ? '🤝' : '🚀'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">
                    {new Date(news.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="text-gray-500">•</span>
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">{news.readTime}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors">
                  {news.title}
                </h3>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {news.excerpt}
                </p>
                
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {news.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-gray-300 text-sm">{news.author}</span>
                    </div>
                    
                    <motion.button
                      className="glass-btn-ghost !px-4 !py-2 !min-h-auto text-sm group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReadMore(news.title.toLowerCase().replace(/\s+/g, '-'))}
                    >
                      Read More
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Team & About Us */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge-accent mb-6">
              <User className="w-4 h-4" />
              <span>Meet the Team</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">Leaders Behind the Vision</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Experienced professionals from leading tech companies and financial institutions
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group text-center relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
                
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl group-hover:scale-110 transition-transform">
                  {member.image}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                  {member.name}
                </h3>
                <p className="text-blue-400 font-semibold mb-4">{member.position}</p>
                
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                  {member.bio}
                </p>
                
                <div className="mb-6">
                  <h4 className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wider">Expertise</h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {member.expertise.map((skill, skillIndex) => (
                      <span 
                        key={skillIndex}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <motion.a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 glass-btn-ghost !px-4 !py-2 !min-h-auto text-sm group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Linkedin className="w-4 h-4" />
                  Connect
                </motion.a>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Trusted Partners */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge-success mb-6">
              <Handshake className="w-4 h-4" />
              <span>Strategic Partners</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">Trusted by Industry Leaders</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Collaborating with top-tier partners to deliver exceptional results and innovation
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trustedPartners.map((partner, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group text-center relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                    {partner.partnership}
                  </div>
                </div>
                
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform border border-gray-600">
                  {partner.logo}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-200 transition-colors">
                  {partner.name}
                </h3>
                <p className="text-green-400 font-semibold mb-4 text-sm">{partner.category}</p>
                
                <p className="text-gray-300 text-sm leading-relaxed">
                  {partner.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Contact & Social */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div variants={itemVariants} className="glass-enhanced">
            <div className="grid lg:grid-cols-2 gap-12 p-12">
              <div>
                <div className="inline-flex items-center gap-2 glass-badge-primary mb-8">
                  <Send className="w-4 h-4" />
                  <span>Get in Touch</span>
                </div>
                
                <h2 className="text-4xl font-bold text-white mb-6">
                  Ready to Build the Future Together?
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Join our ecosystem, explore partnership opportunities, or get personalized support for your venture journey.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Business Inquiries</p>
                      <motion.a 
                        href="mailto:i@techhy.me"
                        className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        i@techhy.me
                      </motion.a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Legal Entity</p>
                      <p className="text-gray-300">TECH HY SDN. BHD, Malaysia</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-8">Connect With Us</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <motion.a
                    href="https://twitter.com/techhy_official"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-ultra p-6 rounded-xl text-center group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Twitter className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <p className="text-white font-semibold">Twitter</p>
                    <p className="text-gray-400 text-sm">@techhy_official</p>
                  </motion.a>
                  
                  <motion.a
                    href="https://linkedin.com/company/techhy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-ultra p-6 rounded-xl text-center group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Linkedin className="w-8 h-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <p className="text-white font-semibold">LinkedIn</p>
                    <p className="text-gray-400 text-sm">company/techhy</p>
                  </motion.a>
                </div>
                
                <div className="glass-ultra p-6 rounded-xl">
                  <h4 className="text-white font-semibold mb-4">Legal Disclaimer</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    $VC tokens are utility tokens, not securities. This website does not constitute investment advice. 
                    Cryptocurrency investments carry significant risk. Please conduct your own research before making any financial decisions.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Development Roadmap */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge-primary mb-6">
              <TargetIcon className="w-4 h-4" />
              <span>Execution Roadmap</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Proven Execution Track Record</h2>
            <p className="text-xl text-gray-300">Transparent milestones with real progress updates</p>
          </motion.div>
          
          <div className="space-y-8">
            {roadmapMilestones.map((milestone, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group relative overflow-hidden"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="lg:w-1/3">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl ${
                        milestone.status === 'In Progress' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                        milestone.status === 'Planned' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                        'bg-gradient-to-br from-gray-500 to-gray-600'
                      }`}>
                        {milestone.quarter}
                      </div>
                      <div>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                          milestone.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          milestone.status === 'Planned' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                          'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {milestone.status}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-white mb-4">{milestone.title}</h3>
                    
                    {milestone.completion > 0 && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-gray-400">Completion Progress</span>
                          <span className="text-white font-bold">{milestone.completion}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${milestone.completion}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="lg:w-2/3">
                    <div className="space-y-3">
                      {milestone.achievements.map((achievement, achievementIndex) => (
                        <motion.div 
                          key={achievementIndex} 
                          className="flex items-start gap-4 p-4 glass-ultra rounded-lg group-hover:bg-white/5 transition-colors"
                          whileHover={{ x: 5 }}
                        >
                          <div className="mt-1">
                            {achievement.startsWith('✅') ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : achievement.startsWith('🔄') ? (
                              <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-500" />
                            )}
                          </div>
                          <p className="text-gray-300 leading-relaxed">
                            {achievement.replace(/^[✅🔄🎯🚀]\s*/u, '')}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Client Success Stories */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge-success mb-6">
              <MessageSquare className="w-4 h-4" />
              <span>Client Success Stories</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">Real Results from Real Clients</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Verified testimonials from founders who achieved extraordinary results with TECH HY
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {realTestimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group relative overflow-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <div className="glass-badge-success !px-3 !py-1 text-xs">
                    Verified
                  </div>
                </div>
                
                <blockquote className="text-gray-300 mb-8 italic text-lg leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="border-t border-gray-700 pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{testimonial.author}</p>
                      <p className="text-blue-400">{testimonial.position}</p>
                      <p className="text-gray-400 text-sm">{testimonial.company}</p>
                    </div>
                  </div>
                  
                  <div className="glass-ultra p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold text-sm">{testimonial.result}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            variants={itemVariants}
            className="glass-enhanced group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5" />
            
            <div className="relative z-10 p-12">
              <div className="inline-flex items-center gap-2 glass-badge-accent mb-8">
                <Sparkles className="w-4 h-4" />
                <span>Join the Revolution</span>
              </div>
              
              <h2 className="text-5xl font-bold text-white mb-6">
                Ready to Transform Venture Capital?
              </h2>
              <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
                Join TECH HY and be part of the movement that's making venture capital safer, 
                more transparent, and more accessible for everyone.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <motion.button
                  className="glass-btn-primary text-lg px-8 py-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartJourney}
                >
                  <Rocket className="w-6 h-6" />
                  Start Your Journey
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
                <motion.button
                  className="glass-btn-ghost text-lg px-8 py-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleScheduleCall}
                >
                  <MessageSquare className="w-6 h-6" />
                  Schedule a Call
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Company Info Footer */}
      <motion.section 
        className="py-16 px-6 border-t border-gray-700"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-12 text-center">
            <div className="glass-ultra p-8">
              <Building2 className="w-12 h-12 text-blue-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-4">Legal Entity</h3>
              <p className="text-gray-300 mb-2">TECH HY SDN. BHD</p>
              <p className="text-gray-400 text-sm">Registered in Malaysia</p>
              <p className="text-gray-400 text-sm">Company No: 202301044363</p>
            </div>
            
            <div className="glass-ultra p-8">
              <Globe className="w-12 h-12 text-green-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-4">Contact</h3>
              <motion.a 
                href="mailto:i@techhy.me"
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer mb-2 block"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                i@techhy.me
              </motion.a>
              <p className="text-gray-400 text-sm">Business Inquiries</p>
              <p className="text-gray-400 text-sm">Investor Relations</p>
            </div>
            
            <div className="glass-ultra p-8">
              <Database className="w-12 h-12 text-purple-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-4">Technology</h3>
              <p className="text-gray-300 mb-2">Multi-chain Compatible</p>
              <p className="text-gray-400 text-sm">BSC • Ethereum • Polygon</p>
              <p className="text-gray-400 text-sm">AI-Powered Analytics</p>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="mt-12 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-400 max-w-4xl mx-auto leading-relaxed mb-4">
              TECH HY is revolutionizing venture capital through technology, transparency, and community. 
              Together, we're building a safer, more accessible investment ecosystem for everyone.
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 TECH HY SDN. BHD. All rights reserved. | Building the future of venture capital.
            </p>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home; 