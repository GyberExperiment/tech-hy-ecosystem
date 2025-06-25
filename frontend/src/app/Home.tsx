import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, 
  Shield, 
  Target, 
  TrendingUp, 
  Users, 
  Award,
  CheckCircle,
  Star,
  ChevronRight,
  Zap,
  Bitcoin,
  Lock,
  Flame,
  Download,
  ExternalLink,
  Building2,
  DollarSign,
  Heart,
  Trophy,
  Sparkles,
  Globe,
  Rocket,
  Eye,
  Shield as ShieldIcon,
  BarChart3,
  Coins,
  Network,
  Target as TargetIcon,
  Lightbulb
} from 'lucide-react';

const Home: React.FC = () => {
  const { t } = useTranslation(['common']);

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

  const stats = [
    { label: 'Projects Helped', value: '28+', icon: TrendingUp, description: 'Successfully launched' },
    { label: 'People Network', value: '200+', icon: Users, description: 'Active connections' },
    { label: 'Warm Investors', value: '1.5K+', icon: Building2, description: 'Ready to invest' },
    { label: 'KOL Partners', value: '300+', icon: Star, description: 'For collaboration' },
    { label: 'Ambassadors', value: '150+', icon: Award, description: 'Community leaders' },
    { label: 'Service Providers', value: '100+', icon: CheckCircle, description: 'Verified experts' },
    { label: 'Expert Advisers', value: '30+', icon: Trophy, description: 'Industry veterans' },
    { label: 'Core Team', value: '10+', icon: Heart, description: 'Dedicated members' }
  ];

  const roadmapPhases = [
    {
      phase: 'Phase 1 – Foundation & Private Launch',
      period: 'Q1–Q2 2025',
      status: 'In Progress',
      completion: 75,
      items: [
        'Core team assembled (venture, tech, operations)',
        'Manual scoring system and certification framework deployed',
        'KYC module integrated (Sumsub)',
        'TECH HY Service Boutique live with 30+ verified service categories',
        '$VC and $VG smart contracts deployed',
        'Tokenomics and DAO design finalized',
        'Bitcoin mining partnership secured',
        'Private round + community contributor onboarding initiated'
      ]
    },
    {
      phase: 'Phase 2 – Launch & Ecosystem Growth',
      period: 'Q2–Q3 2025',
      status: 'Planned',
      completion: 0,
      items: [
        '$VC launch completed and listed on DEX',
        'Treasury capitalized; 50% locked in LP via Burn & Earn model',
        'VC Freezing Program launches (Paper → Diamond Hands)',
        'NFT Expert Marketplace goes live (for KOLs & advisors)',
        'Launchpad v1 launches (invite-only projects)',
        'Bitcoin mining operations begin (15% of B2B profit reinvested)',
        'Automated $VC buyback via BTC proceeds activated',
        'TECH HY DAO onboarding + initial investment voting rounds',
        '$VG reward tiers and community programs launched'
      ]
    },
    {
      phase: 'Phase 3 – Automation & DAO Scaling',
      period: '2026',
      status: 'Future',
      completion: 0,
      items: [
        'AI Scoring Engine deployed (GPT-based)',
        'Public Scoring-as-a-Service API launches',
        'On-chain DAO Investment Committee governance launched',
        'Partner launchpads (Polygon, BNB, Solana) integrated',
        'Full-scale on-chain proposal and voting system via $VG',
        'TaskOn & Galxe campaigns tied to DAO tiers',
        'Public dashboards for staking, scoring, and treasury metrics'
      ]
    }
  ];

  const services = [
    {
      category: 'Business Growth',
      description: 'Build sustainable and efficient business with our Business Growth solutions',
      items: ['Business Review & Consulting', 'Business Networking', 'Project Management', 'HR Consulting', 'Outstaffing and Recruiting', 'Legal Advising', 'Business Tools & AI Automatization'],
      icon: Building2,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      category: 'Sales Growth',
      description: 'Accelerate your sales with tailored solutions',
      items: ['Business Development', 'Targeted Telegram Campaigns', 'Instagram Direct Mailing', 'E-mail Marketing', 'Cross-Platform Promo', 'AI-Powered Outreach', 'Guerrilla Marketing', 'Google/Bing Targeting Ad'],
      icon: TrendingUp,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      category: 'PR & Reputation Growth',
      description: 'Boost your brand\'s reputation with our PR Solutions',
      items: ['Strategic Branding', 'Marketing Strategic', 'Community Growth and Engagement', 'SEO & Media Content SMM', 'KOLs Collaboration', 'Brand Protection Service', 'Innovative Digital Twins'],
      icon: Star,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-500/10'
    },
    {
      category: 'Funds Growth',
      description: 'Maximize your fundraising potential with services',
      items: ['Full Scale Project Review', 'Strategic Advisory', 'Investor Outreach Campaigns around 1500 VCs', 'LinkedIn Fundraising', 'Tokenomics Development'],
      icon: DollarSign,
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-500/10'
    }
  ];

  const testimonials = [
    {
      text: "Working with TECH HY Venture Club has been a genuine breakthrough for us. They provided invaluable, high-quality support in preparing us for fundraising, meticulously addressing every aspect.",
      author: "Mikhail Palekha",
      position: "Founder & CEO Globula",
      rating: 5,
      project: "Series A Fundraising"
    },
    {
      text: "Michael is outstanding and highly committed. In the Web3 industry, where we have encountered numerous professionals, many of whom often fail to live up to their promises, Michael stands out as a true gem.",
      author: "Theresa",
      position: "COO FLOWTRADE.ai",
      rating: 5,
      project: "Token Launch"
    },
    {
      text: "Michael has been an invaluable advisor, helping us connect with clients and investors. He's highly professional, easy to work with, and genuinely invested in our success.",
      author: "Ron Zabel",
      position: "Founder & CEO Cryptool",
      rating: 5,
      project: "Business Development"
    }
  ];

  const tokenFeatures = [
    {
      title: 'Real Business Foundation',
      description: 'TECH HY is a real business, not vaporware. Revenue generated through working B2B service marketplace.',
      icon: Building2,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Integrated Utility Token',
      description: '$VC is core to the business model. Used for services, discounts, and loyalty program rewards.',
      icon: Zap,
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Community-First Approach',
      description: 'No private deals or VC backdoors. Fair launch with equal opportunities for everyone.',
      icon: Users,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Bitcoin-Backed Strategy',
      description: '15% of marketplace profits fund BTC mining. 50% of mined BTC goes to $VC buybacks.',
      icon: Bitcoin,
      gradient: 'from-orange-500 to-amber-500'
    },
    {
      title: 'Liquidity Locked Forever',
      description: '100% LP permanently locked, ensuring trading depth and long-term confidence.',
      icon: Lock,
      gradient: 'from-purple-500 to-violet-500'
    },
    {
      title: 'Deflationary Mechanism',
      description: 'All unsold $VC tokens permanently burned, reducing total supply and increasing scarcity.',
      icon: Flame,
      gradient: 'from-red-500 to-pink-500'
    }
  ];

  const whyChooseUs = [
    {
      title: 'Exceptional Value Pricing',
      description: 'We prioritise delivering exceptional value while respecting your budget constraints.',
      icon: DollarSign,
      emoji: '❤️'
    },
    {
      title: 'Deep Business Understanding', 
      description: 'Thorough analysis of your business allows us to propose the most effective solutions.',
      icon: Eye,
      emoji: '👨‍🏫'
    },
    {
      title: 'Your Success is Our Goal',
      description: 'Partner-first strategy focused on areas where we can add maximum value to your business.',
      icon: TargetIcon,
      emoji: '🥇'
    },
    {
      title: 'Comprehensive Solutions',
      description: 'TECH HY unites professionals across all sectors for complete business solutions.',
      icon: Network,
      emoji: '👨‍🔧'
    },
    {
      title: 'Full Lifecycle Partnership',
      description: 'Supporting your business through every stage of growth and development.',
      icon: Rocket,
      emoji: '💍'
    },
    {
      title: 'Invested in Your Success',
      description: 'We confidently invest our resources and reputation into your business success.',
      icon: Coins,
      emoji: '💰'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden">
      {/* Hero Section */}
      <motion.section 
        className="relative pt-32 pb-20 px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.div variants={itemVariants} className="mb-8">
            <motion.div 
              className="inline-flex items-center gap-2 glass-badge-primary mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Building the Future of Venture Industry</span>
            </motion.div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent leading-tight">
              The Home for<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Successful Startups
              </span><br />
              and Investors
            </h1>
            
            <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              Building a crypto security standard: fighting fraud with free KYC, scoring & supporting projects, 
              safeguarding investors. Together we transform the venture industry into one that works for everyone 💚
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.button
                className="glass-btn-primary group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Get FREE Quote
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button
                className="glass-btn-ghost group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Coins className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Buy $VC Token
                <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, 40, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.section>

      {/* Strategic Partners */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Our Strategic Partners</h2>
            <p className="text-gray-400 text-lg">Trusted by industry leaders worldwide</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="glass-card-hover text-center group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-xs text-gray-400 mt-3">Partner {i + 1}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* $VC Token Introduction */}
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
              <Bitcoin className="w-4 h-4" />
              <span>$VC Token Sale</span>
            </div>
            <h2 className="text-5xl font-bold mb-6 text-white">Join the Revolution</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Together, we will transform the venture industry into one that works for everyone 💚
            </p>
            
            <motion.div 
              variants={itemVariants}
              className="glass-enhanced p-8 max-w-3xl mx-auto mb-12"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-blue-400" />
                <h3 className="text-2xl font-bold text-white">$VC Token Contract</h3>
              </div>
              
              <div className="glass-ultra p-6 rounded-xl">
                <p className="text-sm text-gray-400 mb-3">Contract Address:</p>
                <div className="flex items-center justify-between gap-4 p-4 bg-slate-800/50 rounded-lg border border-blue-500/20">
                  <p className="font-mono text-blue-400 break-all text-sm">
                    0x1ea36ffe7e81fa21c18477741d2a75da3881e78e
                  </p>
                  <motion.button 
                    className="glass-btn-ghost !px-4 !py-2 !min-h-auto text-sm flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Copy
                  </motion.button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <motion.button 
                  className="glass-btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Coins className="w-5 h-5" />
                  Buy $VC Token
                </motion.button>
                <motion.button 
                  className="glass-btn-ghost"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-5 h-5" />
                  Whitepaper
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Token Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tokenFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-card-hover group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-blue-200 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Roadmap */}
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
              <span>Development Roadmap</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Roadmap & Milestones</h2>
            <p className="text-xl text-gray-300">Clear path to ecosystem dominance</p>
          </motion.div>
          
          <div className="space-y-8">
            {roadmapPhases.map((phase, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="lg:w-1/3">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-4 ${
                        phase.status === 'In Progress' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                        phase.status === 'Planned' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                        'bg-gradient-to-br from-gray-500 to-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          phase.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          phase.status === 'Planned' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                          'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {phase.status}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">{phase.phase}</h3>
                    <p className="text-blue-400 font-semibold mb-4">{phase.period}</p>
                    
                    {phase.completion > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Completion</span>
                          <span className="text-white font-semibold">{phase.completion}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${phase.completion}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="lg:w-2/3">
                    <div className="grid md:grid-cols-2 gap-4">
                      {phase.items.map((item, itemIndex) => (
                        <motion.div 
                          key={itemIndex} 
                          className="flex items-start gap-3 p-3 glass-ultra rounded-lg group-hover:bg-white/5 transition-colors"
                          whileHover={{ x: 5 }}
                        >
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-300 text-sm leading-relaxed">{item}</p>
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

      {/* Our Numbers */}
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
              <span>Our Impact</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Numbers That Matter</h2>
            <p className="text-xl text-gray-300">Real metrics from real achievements</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-card-hover text-center group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                  {stat.value}
                </div>
                <div className="text-gray-300 font-semibold mb-1">{stat.label}</div>
                <div className="text-gray-500 text-sm">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Services Section */}
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
              <Lightbulb className="w-4 h-4" />
              <span>Our Solutions</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">How We Help You Grow</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Comprehensive, end-to-end solutions at fair prices, designed to drive sustainable growth at any stage 📈
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${service.color} p-4 mr-6 group-hover:scale-110 transition-transform`}>
                    <service.icon className="w-full h-full text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-200 transition-colors">
                      {service.category}
                    </h3>
                    <div className={`w-full h-1 rounded-full bg-gradient-to-r ${service.color} mt-2`} />
                  </div>
                </div>
                
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">{service.description}</p>
                
                <div className="space-y-3">
                  {service.items.map((item, itemIndex) => (
                    <motion.div 
                      key={itemIndex} 
                      className="flex items-center gap-4 p-3 glass-ultra rounded-lg group-hover:bg-white/5 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us */}
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
              <Trophy className="w-4 h-4" />
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">What Makes Us Different</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Committed to long-term, productive collaboration with every client
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-card-hover group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-3xl">{item.emoji}</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-blue-200 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
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
              <Star className="w-4 h-4" />
              <span>Client Reviews</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">What Clients Say</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Real feedback from real clients who achieved extraordinary results with our help
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-enhanced group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <div className="glass-badge-primary !px-2 !py-1 text-xs">
                    {testimonial.project}
                  </div>
                </div>
                
                <blockquote className="text-gray-300 mb-8 italic text-lg leading-relaxed">
                  "{testimonial.text}"
                </blockquote>
                
                <div className="border-t border-gray-700 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.author}</p>
                      <p className="text-blue-400 text-sm">{testimonial.position}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={itemVariants}
            className="glass-enhanced group"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 glass-badge-accent mb-6">
                <Rocket className="w-4 h-4" />
                <span>Ready to Launch?</span>
              </div>
            </div>
            
            <h2 className="text-5xl font-bold text-white mb-6">
              Transform Your Project Today
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join hundreds of successful projects that trusted us with their growth. 
              Get a free consultation and start building your future.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.button
                className="glass-btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-5 h-5" />
                Get FREE Quote
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                className="glass-btn-ghost"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Globe className="w-5 h-5" />
                Contact Us
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer Info */}
      <motion.section 
        className="py-16 px-6 border-t border-gray-700"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="grid md:grid-cols-4 gap-8 text-center">
            <div className="glass-ultra p-6">
              <Building2 className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Company</h3>
              <p className="text-gray-400">TECH HY SDN. BHD</p>
            </div>
            <div className="glass-ultra p-6">
              <Globe className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Contact</h3>
              <p className="text-gray-400">i@techhy.me</p>
            </div>
            <div className="glass-ultra p-6">
              <Trophy className="w-8 h-8 text-orange-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Experience</h3>
              <p className="text-gray-400">100+ Years Combined</p>
            </div>
            <div className="glass-ultra p-6">
              <Heart className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Mission</h3>
              <p className="text-gray-400">Building Together</p>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="mt-12 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-400 max-w-4xl mx-auto leading-relaxed">
              Building a crypto security standard: fighting fraud with free KYC, scoring & supporting projects, 
              safeguarding investors. Together we can transform venture industry into one that works for everyone 💚
            </p>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home; 