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
  Trophy
} from 'lucide-react';

const Home: React.FC = () => {
  const { t } = useTranslation(['common']);

  const stats = [
    { label: 'Helped to raise', value: '28', icon: TrendingUp },
    { label: 'People Contact base', value: '200', icon: Users },
    { label: 'Investors Warm connected', value: '1500', icon: Building2 },
    { label: 'KOLs for collaboration', value: '300', icon: Star },
    { label: 'Army of Ambassadors', value: '150', icon: Award },
    { label: 'Service Providers', value: '100', icon: CheckCircle },
    { label: 'Experts & Advisers', value: '30', icon: Trophy },
    { label: 'Team Members', value: '10', icon: Heart }
  ];

  const roadmapPhases = [
    {
      phase: 'Phase 1 – Foundation & Private Launch',
      period: 'Q1–Q2 2025 - In Progress',
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
      period: 'Q2 2025 – Q3 2025 - Planned',
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
      icon: Building2
    },
    {
      category: 'Sales Growth',
      description: 'Accelerate your sales with tailored solutions',
      items: ['Business Development', 'Targeted Telegram Campaigns', 'Instagram Direct Mailing', 'E-mail Marketing', 'Cross-Platform Promo', 'AI-Powered Outreach', 'Guerrilla Marketing', 'Google/Bing Targeting Ad'],
      icon: TrendingUp
    },
    {
      category: 'PR & Reputation Growth',
      description: 'Boost your brand\'s reputation with our PR Solutions',
      items: ['Strategic Branding', 'Marketing Strategic', 'Community Growth and Engagement', 'SEO & Media Content SMM', 'KOLs Collaboration', 'Brand Protection Service', 'Innovative Digital Twins'],
      icon: Star
    },
    {
      category: 'Funds Growth',
      description: 'Maximize your fundraising potential with services',
      items: ['Full Scale Project Review', 'Strategic Advisory', 'Investor Outreach Campaigns around 1500 VCs', 'LinkedIn Fundraising', 'Tokenomics Development'],
      icon: DollarSign
    }
  ];

  const testimonials = [
    {
      text: "Working with TECH HY Venture Club has been a genuine breakthrough for us. They provided invaluable, high-quality support in preparing us for fundraising, meticulously addressing every aspect.",
      author: "Mikhail Palekha",
      position: "Founder & CEO Globula"
    },
    {
      text: "Michael is outstanding and highly committed. In the Web3 industry, where we have encountered numerous professionals, many of whom often fail to live up to their promises, Michael stands out as a true gem.",
      author: "Theresa",
      position: "COO FLOWTRADE.ai"
    },
    {
      text: "Michael has been an invaluable advisor, helping us connect with clients and investors. He's highly professional, easy to work with, and genuinely invested in our success.",
      author: "Ron Zabel",
      position: "Founder & CEO Cryptool"
    }
  ];

  const tokenFeatures = [
    {
      title: 'TECH HY is a real business, not a vaporware token',
      description: 'Revenue is already being generated through a working B2B service marketplace.',
      icon: Building2
    },
    {
      title: '$VC is a core part of the business model',
      description: 'Used to pay for services, unlock discounts and cashback from the loyalty program.',
      icon: Zap
    },
    {
      title: 'Community-first launch',
      description: 'No private deals or VC backdoors. Everyone gets the same fair opportunity.',
      icon: Users
    },
    {
      title: 'Bitcoin-backed long-term strategy',
      description: '15% of TECH HY\'s marketplace profits go into BTC mining, and 50% of mined BTC is used to buy back $VC from the open market.',
      icon: Bitcoin
    },
    {
      title: '100% LP permanently locked',
      description: 'Ensuring trading depth and long-term confidence',
      icon: Lock
    },
    {
      title: 'All unsold $VC tokens will be permanently burned🔥',
      description: 'Reducing total supply',
      icon: Flame
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-accent-blue to-white bg-clip-text text-transparent leading-tight">
              The Home for<br />
              Successful Startups and Investors
            </h1>
            <p className="text-xl text-text-gray max-w-3xl mx-auto mb-8">
              Building a crypto security standard: fighting fraud with free KYC, scoring & supporting projects, safeguarding investors.
              Together we can transform venture industry into one that works for everyone 💚
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 shadow-xl"
              >
                Get a FREE Quote
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-accent-blue text-accent-blue px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                Buy $VC Token
                <ExternalLink className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Strategic Partners */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">Our Strategic Partners</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="frosted-glass p-6 text-center animate-gentle-float"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-accent-blue" />
                </div>
                <p className="text-xs text-text-gray mt-2">Partner Logo</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* $VC Token Introduction */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">$VC Token sale details</h2>
            <p className="text-xl text-text-gray mb-8 max-w-4xl mx-auto">
              Join Us! Together, we will transform the venture industry into one that works for everyone 💚
            </p>
            
            <div className="frosted-glass p-8 max-w-2xl mx-auto mb-12">
              <h3 className="text-2xl font-bold mb-4 text-white">$VC token Contract Address</h3>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-accent-blue/20">
                <p className="text-sm text-text-gray mb-2">CA:</p>
                <p className="font-mono text-accent-blue break-all">
                  0x1ea36ffe7e81fa21c18477741d2a75da3881e78e
                </p>
                <button className="mt-4 bg-accent-blue text-white px-4 py-2 rounded text-sm">
                  Copy
                </button>
              </div>
              <div className="flex gap-4 justify-center mt-6">
                <button className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-6 py-3 rounded-lg font-semibold">
                  Buy $VC token!
                </button>
                <button className="border border-accent-blue text-accent-blue px-6 py-3 rounded-lg font-semibold flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Read our Whitepaper
                </button>
              </div>
            </div>
          </div>

          {/* Token Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {tokenFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="clean-card p-6 animate-gentle-float"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <feature.icon className="w-12 h-12 text-accent-blue mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-text-gray">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">Roadmap & Milestones</h2>
          <div className="space-y-8">
            {roadmapPhases.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="frosted-glass p-8 animate-gentle-float"
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-accent-blue to-accent-purple rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{phase.phase}</h3>
                    <p className="text-accent-blue">{phase.period}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {phase.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-accent-green mt-0.5 flex-shrink-0" />
                      <p className="text-text-gray">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Numbers */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">Our Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="clean-card p-6 text-center animate-gentle-float"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <stat.icon className="w-12 h-12 text-accent-blue mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-text-gray text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">We are helping you with</h2>
            <p className="text-xl text-text-gray max-w-4xl mx-auto">
              comprehensive, end-to-end solutions at a fair price, designed to drive your sustainable growth at any stage 📈
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="frosted-glass p-8 animate-gentle-float"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <div className="flex items-center mb-6">
                  <service.icon className="w-12 h-12 text-accent-blue mr-4" />
                  <h3 className="text-2xl font-bold text-white">{service.category}</h3>
                </div>
                <p className="text-text-gray mb-6">{service.description}</p>
                <div className="space-y-2">
                  {service.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-accent-green flex-shrink-0" />
                      <span className="text-text-gray text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">Why Choose Us</h2>
          <p className="text-xl text-text-gray text-center mb-12 max-w-3xl mx-auto">
            We are committed to long-term and productive collaboration with every client
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'You Will Love Our Pricing ❤️', desc: 'We prioritise delivering exceptional value while respecting your budget.' },
              { title: 'We Dive Deep into Your Business 👨‍🏫', desc: 'A thorough understanding of your business allows us to propose the best solution.' },
              { title: 'Our Goal is Your Success 🥇', desc: 'We follow a partner-first strategy, focusing on areas where we can add value.' },
              { title: 'Comprehensive Solutions 👨‍🔧', desc: 'The TECH HY Venture Club & Service Boutique unites professionals across all sectors.' },
              { title: 'Full Lifecycle Partnership 💍', desc: 'We are supporting your business at every stage of growth.' },
              { title: 'We Invest in You 💰', desc: 'We confidently invest our resources and reputation into your business.' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="clean-card p-6 animate-gentle-float"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <h3 className="text-lg font-semibold mb-4 text-white">{item.title}</h3>
                <p className="text-text-gray">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">What Clients Say</h2>
          <p className="text-xl text-text-gray text-center mb-12 max-w-4xl mx-auto">
            Here are some of the most inspiring reviews from our clients. Your opinion is very important to us 'cause we have always try to evolve and improve in the professional field and work on mistakes.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="frosted-glass p-8 animate-gentle-float"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-text-gray mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-white">{testimonial.author}</p>
                  <p className="text-accent-blue text-sm">{testimonial.position}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="frosted-glass p-12 animate-gentle-float"
          >
            <h2 className="text-4xl font-bold mb-6 text-white">Ready to Transform Your Project?</h2>
            <p className="text-xl text-text-gray mb-8">
              Contact us today for a free consultation and let's start building your future
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 shadow-xl"
              >
                Get FREE Quote
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-accent-blue text-accent-blue px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                Contact Us
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 px-6 border-t border-slate-700">
        <div className="max-w-7xl mx-auto text-center">
          <div className="grid md:grid-cols-3 gap-8 text-text-gray">
            <div>
              <h3 className="font-semibold text-white mb-2">Company</h3>
              <p>TECH HY SDN. BHD</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Contact</h3>
              <p>i@techhy.me</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Experience</h3>
              <p>100 Years of our team experience</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700">
            <p className="text-text-gray">
              Building a crypto security standard: fighting fraud with free KYC, scoring & supporting projects, safeguarding investors.
              Together we can transform venture industry into one that works for everyone 💚
            </p>
            <p className="text-sm text-slate-500 mt-4">
              Copyright © 2025. All Rights Reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 