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
  Bitcoin,
  Download,
  ExternalLink,
  Building2,
  DollarSign,
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
  RefreshCw,
  Play,
  Store,
  Box
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
              solution: 'KYC & Scoring System',
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
      component: 'Techhy Ecosystem',
      description: 'Complete token economy with VC utility token and VG governance token',
      features: ['Service Payments', 'NFT Boosters Mint', 'LP permanent lock for VG mint', 'Loyalty Program'],
      icon: Coins,
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
        { text: 'Core team assembled (venture, tech, operations)', status: 'completed', icon: CheckCircle },
        { text: 'Service Boutique launched with 30+ categories', status: 'completed', icon: CheckCircle },
        { text: 'KYC integration with Sumsub completed', status: 'completed', icon: CheckCircle },
        { text: 'Smart contracts deployed and audited', status: 'completed', icon: CheckCircle },
        { text: 'Private fundraising round (85% complete)', status: 'progress', icon: RefreshCw },
        { text: 'Community onboarding program', status: 'progress', icon: RefreshCw }
      ]
    },
    {
      quarter: 'Q2 2025',
      title: 'Token Launch & Growth',
      status: 'Planned',
      completion: 0,
      achievements: [
        { text: '$VC token public launch', status: 'planned', icon: TargetIcon },
        { text: 'DEX listing and liquidity provision', status: 'planned', icon: TargetIcon },
        { text: 'NFT Expert Marketplace launch', status: 'planned', icon: TargetIcon },
        { text: 'Launchpad v1.0 (invite-only)', status: 'planned', icon: TargetIcon },
        { text: 'Bitcoin mining operations begin', status: 'planned', icon: TargetIcon },
        { text: 'DAO governance implementation', status: 'planned', icon: TargetIcon }
      ]
    },
    {
      quarter: 'Q3-Q4 2025',
      title: 'AI & Automation',
      status: 'Future',
      completion: 0,
      achievements: [
        { text: 'AI Scoring Engine deployment', status: 'future', icon: Rocket },
        { text: 'Multi-chain launchpad integration', status: 'future', icon: Rocket },
        { text: 'Public API for scoring services', status: 'future', icon: Rocket },
        { text: 'Advanced analytics dashboard', status: 'future', icon: Rocket },
        { text: 'Partner ecosystem expansion', status: 'future', icon: Rocket },
        { text: 'Global market expansion', status: 'future', icon: Rocket }
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
      title: '24/7 Customer Service Bot',
      description: 'Instant support and assistance through our intelligent Telegram customer service bot available around the clock',
      features: ['Instant Support', 'Service Inquiries', 'Technical Help', 'Partnership Guidance'],
      price: 'Free',
      icon: Send,
      status: 'Live',
      clients: 'Unlimited',
      action: () => handleCustomerService()
    },
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
      price: 'Coming Soon',
      icon: Cpu,
      status: 'Coming Soon',
      clients: '',
      disabled: true
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
      icon: Store,
      status: 'Live',
      clients: '1000+'
    }
  ];

  const dualTokenomics = {
    vcToken: {
      name: 'VC (Venture Club Token)',
      purpose: 'Ecosystem utility',
      supply: '5,000,000,000',
      contract: '0x1ea36ffe7e81fa21c18477741d2a75da3881e78e',
      utilities: ['Service Payments', 'NFT Boosters Mint', 'LP permanent lock for VG mint', 'Loyalty Program']
    },
    vgToken: {
      name: 'VG (Venture Gift Token)',
      purpose: 'Revenue sharing and governance',
      supply: '500,000,000',
      contract: '0x2fb47ggf8f92gb32c19588ae1e3a26gf4992f89f',
      utilities: ['Staking Rewards', 'Revenue Distribution', 'Governance Voting', 'VIP Access']
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
      icon: DollarSign
    },
    {
      title: 'Partnership with Major BSC Projects',
      excerpt: 'Strategic partnerships with PancakeSwap, Venus Protocol, and other leading BSC ecosystem projects.',
      date: '2025-01-10',
      author: 'Sarah Kim, COO',
      category: 'Partnerships',
      readTime: '2 min read',
      icon: Handshake
    },
    {
      title: 'AI Scoring Engine Beta Launch',
      excerpt: 'Revolutionary GPT-4 powered scoring system now available for beta testing with select partners.',
      date: '2025-01-05',
      author: 'Gyber, CTO',
      category: 'Technology',
      readTime: '4 min read',
      icon: Rocket
    }
  ];

  const teamMembers = [
    {
      name: 'Michael Hypov',
      position: 'Founder',
      bio: 'Visionary entrepreneur driving innovation in venture capital and blockchain technology',
      image: 'MH',
      linkedin: 'michael-hypov',
      expertise: ['Venture Capital', 'Blockchain Strategy', 'Business Vision']
    },
    {
      name: 'Kingsley',
      position: 'CPO',
      bio: 'Product strategy expert focused on user experience and ecosystem development',
      image: 'KI',
      linkedin: 'kingsley-techhy',
      expertise: ['Product Strategy', 'UX Design', 'Market Research']
    },
    {
      name: 'Hanna',
      position: 'CBDO',
      bio: 'Business development leader expanding strategic partnerships and market reach',
      image: 'HA',
      linkedin: 'hanna-techhy',
      expertise: ['Business Development', 'Strategic Partnerships', 'Market Expansion']
    },

    {
      name: 'Marina',
      position: 'CMO',
      bio: 'Marketing strategist driving brand awareness and community growth',
      image: 'MA',
      linkedin: 'marina-techhy',
      expertise: ['Digital Marketing', 'Brand Strategy', 'Community Building']
    },
    {
      name: 'Petro',
      position: 'CCO',
      bio: 'Community operations expert fostering engagement and user adoption',
      image: 'PE',
      linkedin: 'petro-techhy',
      expertise: ['Community Management', 'User Engagement', 'Growth Operations']
    },
    {
      name: 'Gyber',
      position: 'CTO',
      bio: 'Chief Technology Officer leading blockchain and AI technology development',
      image: 'GY',
      linkedin: 'gyber-techhy',
      expertise: ['Blockchain Development', 'AI/ML', 'System Architecture', 'Smart Contracts']
    },
    {
      name: 'Dasha',
      position: 'CHRO',
      bio: 'Human resources leader building exceptional teams and company culture',
      image: 'DA',
      linkedin: 'dasha-techhy',
      expertise: ['Human Resources', 'Team Development', 'Company Culture']
    },
    {
      name: 'Thomas',
      position: 'Head of Graphic Design',
      bio: 'Creative design expert crafting visual identity and user interfaces',
      image: 'TH',
      linkedin: 'thomas-techhy',
      expertise: ['Graphic Design', 'UI/UX', 'Brand Identity']
    },
    {
      name: 'Dima',
      position: 'Head of AI Solutions & Automatization',
      bio: 'AI specialist developing intelligent automation systems and solutions',
      image: 'DI',
      linkedin: 'dima-techhy',
      expertise: ['AI Solutions', 'Automation', 'Machine Learning']
    },
    {
      name: 'Ifeanyi',
      position: 'Business Assistant',
      bio: 'Operations support specialist ensuring smooth business processes',
      image: 'IF',
      linkedin: 'ifeanyi-techhy',
      expertise: ['Operations Support', 'Process Optimization', 'Administrative Excellence']
    },
    {
      name: 'Timchang',
      position: 'SMM Manager',
      bio: 'Social media expert building online presence and engagement',
      image: 'TC',
      linkedin: 'timchang-techhy',
      expertise: ['Social Media Marketing', 'Content Strategy', 'Digital Engagement']
    },
    {
      name: 'Waseem',
      position: 'BD Manager',
      bio: 'Business development specialist fostering strategic partnerships',
      image: 'WA',
      linkedin: 'waseem-techhy',
      expertise: ['Business Development', 'Partnership Management', 'Deal Negotiation']
    },
    {
      name: 'Faheem',
      position: 'BD Manager',
      bio: 'Business development expert expanding market opportunities and relationships',
      image: 'FA',
      linkedin: 'faheem-techhy',
      expertise: ['Business Development', 'Market Expansion', 'Client Relations']
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

  const handleGetStarted = (service: string, isDisabled: boolean = false) => {
    // Если сервис отключен, перенаправляем на Telegram для консультации
    if (isDisabled) {
      window.open('https://t.me/TECH_HY_Customer_Service_bot', '_blank');
      return;
    }
    
    // В зависимости от сервиса перенаправляем на разные страницы
    switch(service) {
      case '24/7customerservicebot':
        window.open('https://t.me/TECH_HY_Customer_Service_bot', '_blank');
        break;
      case 'kyc&verificationcertificates':
        window.open('https://t.me/TECH_HY_Customer_Service_bot', '_blank');
        break;
      case 'ai-poweredstartupscoring':
        // Пока что перенаправляем на Telegram для консультации
        window.open('https://t.me/TECH_HY_Customer_Service_bot', '_blank');
        break;
      case 'investornetworkaccess':
        window.open('https://t.me/TECH_HY_Customer_Service_bot', '_blank');
        break;
      case 'servicemarketplace':
        window.open('https://t.me/TECH_HY_Customer_Service_bot', '_blank');
        break;
      default:
        window.open('https://t.me/TECH_HY_Customer_Service_bot', '_blank');
    }
  };

  const handleReadMore = (newsId: string) => {
    window.open(`https://blog.techhy.me/post/${newsId}`, '_blank');
  };

  const handleStartJourney = () => {
    window.open('https://t.me/TECH_HY_Customer_Service_bot', '_blank');
  };

  const handleScheduleCall = () => {
    window.open('https://calendly.com/techhy/consultation', '_blank');
  };

  const handleCustomerService = () => {
    window.open('https://t.me/TECH_HY_Customer_Service_bot', '_blank');
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* ✨ Modern Background with Animated Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/10 to-cyan-500/5 opacity-80">
          <div className="absolute inset-0 animate-breathing-slow bg-gradient-to-br from-transparent via-blue-500/5 to-transparent"></div>
        </div>
        
        {/* Floating animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-breathing-orb-1"></div>
          <div className="absolute top-2/3 right-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl animate-breathing-orb-2"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl animate-breathing-orb-3"></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-emerald-500/6 rounded-full blur-3xl animate-breathing-orb-4"></div>
          
          {/* Animated particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-float-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
          
          {/* Connecting lines effect */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.line
                key={i}
                x1={`${Math.random() * 100}%`}
                y1={`${Math.random() * 100}%`}
                x2={`${Math.random() * 100}%`}
                y2={`${Math.random() * 100}%`}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ 
                  opacity: [0, 0.6, 0],
                  pathLength: [0, 1, 0]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: i * 1.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </svg>
        </div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <motion.section 
          className="relative pt-32 pb-24 px-8 animate-section-breathing-subtle"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-20">
              <motion.div
                className="inline-flex items-center gap-3 glass-badge-primary mb-10 backdrop-blur-xl"
                whileHover={{ scale: 1.05 }}
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(59, 130, 246, 0.3)',
                    '0 0 30px rgba(59, 130, 246, 0.5)',
                    '0 0 20px rgba(59, 130, 246, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Shield className="w-5 h-5" />
                <span>Transforming Venture Industry Security</span>
              </motion.div>
              
              <motion.h1 
                className="text-6xl md:text-8xl font-black mb-10 leading-tight"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-400 bg-clip-text text-transparent">
                  TECH
                </span>
                <span className="mx-4 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent animate-pulse">
                  HY
                </span>
              </motion.h1>
              
              <motion.h2 
                className="text-2xl md:text-4xl font-bold mb-10 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <span className="text-gray-300">Fighting fraud. Protecting investors.</span><br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Building the future of venture capital.
                </span>
              </motion.h2>
              
              <motion.p 
                className="text-xl text-gray-400 max-w-4xl mx-auto mb-16 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                The first crypto venture platform combining <span className="text-green-400 font-semibold">KYC</span>, <span className="text-blue-400 font-semibold">AI-powered scoring</span>, and <span className="text-purple-400 font-semibold">community-driven due diligence</span>{' '}
                to create a safer, more transparent investment ecosystem.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-8 justify-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
              >
                <motion.button
                  className="glass-btn-primary group relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleJoinEcosystem}
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(59, 130, 246, 0.4)',
                      '0 0 40px rgba(59, 130, 246, 0.6)',
                      '0 0 20px rgba(59, 130, 246, 0.4)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Join the Ecosystem
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <motion.button
                  className="glass-btn-ghost group relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReadWhitepaper}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 to-gray-800/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Read Whitepaper
                  <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </motion.button>
              </motion.div>
              
              {/* Floating stats */}
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.2 }}
              >
                {[
                  { label: 'Fraud Prevented', value: '$2.3M+', color: 'text-green-400' },
                  { label: 'Startups Verified', value: '50+', color: 'text-blue-400' },
                  { label: 'AI Accuracy', value: '94.7%', color: 'text-purple-400' },
                  { label: 'Community Members', value: '15000+', color: 'text-cyan-400' }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="glass-ultra p-4 rounded-xl text-center group hover:scale-105 transition-transform"
                    whileHover={{ y: -5 }}
                    animate={{
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      delay: index * 0.5,
                      ease: "easeInOut" 
                    }}
                  >
                    <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-sm font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Problems We Solve */}
        <motion.section 
          className="py-24 px-8 animate-section-breathing-subtle"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
        <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-20">
              <div className="inline-flex items-center gap-3 glass-badge-accent mb-8">
                <AlertTriangle className="w-5 h-5" />
                <span>Critical Industry Problems</span>
              </div>
              <h2 className="text-5xl font-bold text-white mb-8">The Venture Crisis We're Solving</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                The venture industry loses billions to fraud annually. We're building the infrastructure to change that.
              </p>
            </motion.div>
            
            <div className="grid lg:grid-cols-3 gap-10">
              {problemsWeeSolve.map((item, index) => (
              <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass-enhanced-breathing group relative overflow-hidden p-8"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full" />
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-18 h-18 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl flex items-center justify-center">
                      <TrendingDown className="w-10 h-10 text-red-400" />
                </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-400 mb-2">PROBLEM</h3>
                      <p className="text-white font-semibold">{item.problem}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-18 h-18 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {React.createElement(item.icon, { className: "w-10 h-10 text-green-400" })}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-400 mb-2">OUR SOLUTION</h3>
                      <p className="text-white font-semibold">{item.solution}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-8 leading-relaxed text-lg">{item.description}</p>
                  
                  <div className="glass-ultra p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Expected Impact:</span>
                      <span className="text-blue-400 font-bold text-lg">{item.impact}</span>
                    </div>
                  </div>
              </motion.div>
            ))}
          </div>
        </div>
        </motion.section>

        {/* Core Metrics */}
        <motion.section 
          className="py-24 px-8 animate-section-breathing-subtle"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
        <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-20">
              <div className="inline-flex items-center gap-3 glass-badge-success mb-8">
                <BarChart3 className="w-5 h-5" />
                <span>Proven Track Record</span>
              </div>
              <h2 className="text-5xl font-bold text-white mb-6">Real Results, Real Impact</h2>
              <p className="text-xl text-gray-300">Metrics that matter from our operating business</p>
            </motion.div>
            
            <div className="grid md:grid-cols-4 gap-10">
              {coreMetrics.map((metric, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass-card-breathing text-center group relative overflow-hidden p-8"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all" />
                  
                  <div className="relative z-10">
                    <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {React.createElement(metric.icon, { className: "w-12 h-12 text-blue-400" })}
                    </div>
                    <div className="text-5xl font-black text-white mb-4 group-hover:text-blue-200 transition-colors">
                      {metric.metric}
                    </div>
                    <div className="text-gray-300 font-medium text-lg">{metric.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* TECH HY Ecosystem */}
        <motion.section 
          className="py-24 px-8 animate-section-breathing-subtle"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-20">
              <div className="inline-flex items-center gap-3 glass-badge-primary mb-8">
                <Network className="w-5 h-5" />
                <span>Integrated Ecosystem</span>
              </div>
              <h2 className="text-5xl font-bold text-white mb-8">The TECH HY Ecosystem</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                Four interconnected platforms working together to revolutionize venture capital
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-10">
              {techHyEcosystem.map((component, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass-enhanced-breathing group relative overflow-hidden p-8"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="absolute top-6 right-6">
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      component.status === 'Live' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                      component.status === 'Launching' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    }`}>
                      {component.status}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {React.createElement(component.icon, { className: "w-10 h-10 text-blue-400" })}
                    </div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-200 transition-colors">
                      {component.component}
                    </h3>
                  </div>
                  
                  <p className="text-gray-300 mb-10 text-lg leading-relaxed">{component.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {component.features.map((feature, featureIndex) => (
                      <motion.div 
                        key={featureIndex} 
                        className="flex items-center gap-4 p-4 glass-ultra rounded-xl group-hover:bg-white/5 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
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
          className="py-24 px-8 animate-section-breathing-subtle"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
        <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-20">
              <div className="inline-flex items-center gap-3 glass-badge-primary mb-8">
                <Briefcase className="w-5 h-5" />
                <span>Professional Services</span>
              </div>
              <h2 className="text-5xl font-bold text-white mb-8">Comprehensive Startup Services</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                From KYC verification to AI-powered scoring, we provide everything startups need to succeed
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-12">
              {detailedServices.map((service, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass-enhanced-breathing group relative overflow-hidden"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Status badges */}
                  <div className="absolute top-6 right-6 flex gap-3 z-10">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                      service.status === 'Live' ? 'bg-green-500/30 text-green-200 border border-green-400/40' :
                      service.status === 'Beta' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40' :
                      service.status === 'Coming Soon' ? 'bg-orange-500/30 text-orange-200 border border-orange-400/40' :
                      'bg-orange-500/30 text-orange-200 border border-orange-400/40'
                    }`}>
                      {service.status}
                    </div>
                    {service.clients && service.clients.trim() !== '' && (
                      <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/40 backdrop-blur-sm">
                        {service.clients} clients
                      </div>
                    )}
                  </div>
                  
                  {/* Card content with proper spacing */}
                  <div className="p-8 pb-6 flex flex-col h-full">
                    {/* Header section */}
                    <div className="flex items-start gap-6 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        {React.createElement(service.icon, { className: "w-8 h-8 text-blue-400" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors leading-tight mb-2">
                          {service.title}
                        </h3>
                        <div className="text-2xl font-bold text-green-400">{service.price}</div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-300 text-base leading-relaxed mb-6 flex-grow-0">
                      {service.description}
                    </p>
                    
                    {/* Features grid */}
                    <div className="grid grid-cols-1 gap-3 mb-8 flex-grow">
                      {service.features.map((feature, featureIndex) => (
                        <motion.div 
                          key={featureIndex} 
                          className="flex items-center gap-3 p-3 glass-ultra rounded-lg group-hover:bg-white/5 transition-colors"
                          whileHover={{ x: 3 }}
                        >
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm font-medium">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Button */}
                    <motion.button
                      className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl group flex items-center justify-center gap-3 ${
                        service.disabled 
                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-500/30' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:shadow-blue-500/25'
                      }`}
                      whileHover={service.disabled ? {} : { scale: 1.02, y: -2 }}
                      whileTap={service.disabled ? {} : { scale: 0.98 }}
                      onClick={() => handleGetStarted(service.title.toLowerCase().replace(/\s+/g, ''), service.disabled)}
                    >
                      <span>{service.disabled ? 'Coming Soon - Contact Us' : 'Get Started'}</span>
                      <ArrowRight className={`w-5 h-5 transition-transform ${service.disabled ? '' : 'group-hover:translate-x-1'}`} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Dual Tokenomics Section */}
        <motion.section 
          className="py-24 px-8 animate-section-breathing-subtle"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
        <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-20">
              <div className="inline-flex items-center gap-3 glass-badge-accent mb-8">
                <Coins className="w-5 h-5" />
                <span>Dual Token Economy</span>
              </div>
              <h2 className="text-5xl font-bold mb-8 text-white">Two Tokens, Unlimited Potential</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed">
                Our innovative dual-token system maximizes utility while creating sustainable value for all stakeholders.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-16">
              {/* $VC Token */}
              <motion.div variants={itemVariants} className="glass-enhanced-breathing group relative overflow-hidden p-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
                
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-blue-400">VC</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">{dualTokenomics.vcToken.name}</h3>
                    <p className="text-blue-400 font-medium text-lg">{dualTokenomics.vcToken.purpose}</p>
                  </div>
                </div>

                <div className="glass-ultra p-8 rounded-xl mb-10">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Total Supply</p>
                      <p className="text-white font-bold text-xl">{dualTokenomics.vcToken.supply}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Network</p>
                      <p className="text-white font-bold text-xl">BSC</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {dualTokenomics.vcToken.utilities.map((utility, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-4 p-5 glass-ultra rounded-xl group-hover:bg-white/5 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                      <span className="text-gray-300 text-lg">{utility}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* $VG Token */}
              <motion.div variants={itemVariants} className="glass-enhanced-breathing group relative overflow-hidden p-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
                
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-green-400">VG</span>
        </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">{dualTokenomics.vgToken.name}</h3>
                    <p className="text-green-400 font-medium text-lg">{dualTokenomics.vgToken.purpose}</p>
                  </div>
                </div>

                <div className="glass-ultra p-8 rounded-xl mb-10">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Total Supply</p>
                      <p className="text-white font-bold text-xl">{dualTokenomics.vgToken.supply}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Network</p>
                      <p className="text-white font-bold text-xl">BSC</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {dualTokenomics.vgToken.utilities.map((utility, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-center gap-4 p-5 glass-ultra rounded-xl group-hover:bg-white/5 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-lg">{utility}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Latest News & Updates - ВРЕМЕННО ОТКЛЮЧЕНО */}

        {/* Team & About Us - ВРЕМЕННО ОТКЛЮЧЕНО */}

        {/* Trusted Partners - ВРЕМЕННО ОТКЛЮЧЕНО */}
        {/*
        <motion.section 
          className="py-24 px-8 animate-section-breathing-subtle"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
        <div className="max-w-7xl mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-20">
              <div className="inline-flex items-center gap-3 glass-badge-primary mb-8">
                <Handshake className="w-5 h-5" />
                <span>Strategic Partners</span>
              </div>
              <h2 className="text-5xl font-bold text-white mb-8">Trusted by Industry Leaders</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                Strategic partnerships that enhance our ecosystem and provide value to our community
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {trustedPartners.map((partner, index) => (
              <motion.div
                key={index}
                  variants={itemVariants}
                  className="glass-card-breathing group text-center p-8"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform border border-gray-600">
                    {partner.logo}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-200 transition-colors">
                    {partner.name}
          </h3>
                  <p className="text-gray-400 text-sm mb-6">{partner.category}</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{partner.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
        </motion.section>
        */}

        {/* Contact & Social */}
        <motion.section 
          className="py-24 px-8 animate-section-breathing-subtle"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-5xl mx-auto">
            <motion.div variants={itemVariants} className="glass-enhanced-breathing">
              <div className="grid lg:grid-cols-2 gap-12 p-12">
                <div>
                  <div className="inline-flex items-center gap-3 glass-badge-primary mb-8">
                    <Send className="w-5 h-5" />
                    <span>Get in Touch</span>
                  </div>
                  
                  <h2 className="text-4xl font-bold text-white mb-6">
                    Ready to Build the Future Together?
                  </h2>
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
                    Join our ecosystem, explore partnership opportunities, or get personalized support for your venture journey.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                        <Send className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Customer Service</p>
                        <motion.a 
                          href="https://t.me/TECH_HY_Customer_Service_bot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          @TECH_HY_Customer_Service_bot
                        </motion.a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
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
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Legal Entity</p>
                        <p className="text-gray-300">TECH HY Venture Club</p>
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

        {/* Development Roadmap - ВРЕМЕННО ОТКЛЮЧЕНО */}

        {/* Client Success Stories - ВРЕМЕННО ОТКЛЮЧЕНО */}

        {/* Call to Action */}
        <motion.section 
          className="py-32 px-8 animate-section-breathing-subtle"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
        <div className="max-w-5xl mx-auto text-center">
            <motion.div variants={itemVariants} className="glass-enhanced-breathing p-16">
              <div className="w-32 h-32 mx-auto mb-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <Rocket className="w-16 h-16 text-blue-400" />
          </div>
              
              <h2 className="text-5xl font-bold text-white mb-8">Ready to Transform Your Venture?</h2>
              <p className="text-2xl text-gray-300 mb-16 leading-relaxed">
                Join thousands of founders who trust TECH HY for secure, transparent, and successful fundraising.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <motion.button
                className="glass-btn-primary group text-xl px-12 py-6"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                  onClick={handleStartJourney}
              >
                  <Send className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Get Support Now
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                className="glass-btn-ghost group text-xl px-12 py-6"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                  onClick={handleScheduleCall}
              >
                  <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Schedule a Call
                  <ExternalLink className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
        </motion.section>

        {/* Company Info Footer */}
        <motion.section 
          className="py-16 px-6 border-t border-gray-700 animate-section-breathing-subtle"
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
                <p className="text-gray-300 mb-2">TECH HY Venture Club</p>
                <p className="text-gray-400 text-sm">Global Investment Platform</p>
                <p className="text-gray-400 text-sm">Empowering Innovation</p>
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
                © 2025 TECH HY Venture Club. All rights reserved. | Building the future of venture capital.
              </p>
            </motion.div>
          </div>
        </motion.section>
        </div>
    </div>
  );
};

export default Home; 