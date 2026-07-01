import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { publicApi } from '../../api/publicApi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Camera, Clock, Activity, ArrowRight, ChevronRight, Lock, 
  Wifi, Smartphone, Cloud, Bell, Home, Building2, Eye, Star, User,
  CheckCircle2, Plus, Minus, Wrench, Fingerprint, Video, Server
} from 'lucide-react';
import { Button } from '../../components/ui/Components';
import cctvHero from '../../assets/images/cctv_hero_1782793488066.png';
import cctvFeed1 from '../../assets/images/cctv_feed_1_1782793498516.png';
import cctvFeed2 from '../../assets/images/cctv_feed_2_1782793508893.png';
import cctvFeed3 from '../../assets/images/cctv_feed_3_1782793519480.png';
import cctvProject1 from '../../assets/images/cctv_project_1_1782793541592.png';
import cctvProject2 from '../../assets/images/cctv_project_2_1782793555653.png';
import cctvProject3 from '../../assets/images/cctv_project_3_1782793567332.png';

// --- Reusable Animation Variants ---
const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '',
    issueType: 'complaint', description: '', propertyType: 'Home', source: 'website'
  });

  const [activeFaq, setActiveFaq] = useState(null);

  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['issueCategories'],
    queryFn: publicApi.getIssueCategories
  });
  const categories = categoriesResponse?.data || [];

  const mutation = useMutation({
    mutationFn: publicApi.submitQuery,
    onSuccess: () => {
      navigate('/query/thank-you');
    }
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleDashboardRedirect = () => {
    if (user) {
      navigate(`/${user.role || 'customer'}`);
    } else {
      navigate('/login');
    }
  };

  const scrollToForm = () => {
    document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-[#00D4FF]/30 selection:text-white overflow-x-hidden">
      {/* Dynamic Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '4rem 4rem' }}>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0B0F19]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center shadow-lg shadow-[#00D4FF]/20 group-hover:shadow-[#00D4FF]/40 transition-shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              CCTV Pro
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={scrollToForm} className="hidden md:block text-sm font-medium text-slate-300 hover:text-[#00D4FF] transition-colors">
              Get Quote
            </button>
            
            {user ? (
              <button onClick={handleDashboardRedirect} className="flex items-center gap-2 rounded-full px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold transition-all">
                Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="flex items-center gap-2 rounded-full px-6 py-2.5 bg-gradient-to-r from-[#00D4FF] to-[#7B61FF] hover:opacity-90 text-sm font-semibold shadow-lg shadow-[#00D4FF]/20 transition-all">
                <Lock className="w-4 h-4" /> Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden z-10">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#00D4FF]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#7B61FF]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              initial="hidden" animate="visible" variants={staggerContainer}
              className="text-left"
            >
              <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#00D4FF] font-medium mb-8 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4FF]"></span>
                </span>
                Next-Gen Security Systems
              </motion.div>

              <motion.h1 variants={fadeUpVariant} className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                <span className="block text-white mb-2">Smart CCTV</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#00D4FF] to-[#7B61FF]">
                  Modern Security
                </span>
              </motion.h1>
              
              <motion.p variants={fadeUpVariant} className="text-lg lg:text-xl text-slate-400 mb-10 leading-relaxed max-w-xl">
                Protect homes, offices, industries, and businesses with AI-powered surveillance systems built for the future.
              </motion.p>

              <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-center gap-4">
                <button onClick={scrollToForm} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-semibold bg-gradient-to-r from-[#00D4FF] to-[#7B61FF] hover:opacity-90 shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all">
                  Get Free Consultation <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => {
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                }} className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all">
                  View Services
                </button>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00D4FF] to-[#7B61FF] rounded-full transform rotate-12 scale-90 opacity-20 blur-[100px] animate-pulse"></div>
              {/* Using a high quality 3D-like camera image for the hero */}
              <motion.img 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                src={cctvHero} 
                alt="3D CCTV Camera" 
                className="relative z-10 w-full object-cover rounded-[3rem] border border-white/10 shadow-2xl h-[500px]"
              />
              
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -left-10 bg-[#0B0F19]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-2xl z-20"
              >
                <div className="w-12 h-12 rounded-full bg-[#00D4FF]/20 flex items-center justify-center border border-[#00D4FF]/30">
                  <Shield className="w-6 h-6 text-[#00D4FF]" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">AI Detection</p>
                  <p className="text-slate-400 text-sm">Active 24/7</p>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. Trusted Statistics */}
      <section className="relative py-12 z-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10 text-center"
          >
            {[
              { value: "500+", label: "Installations" },
              { value: "98%", label: "Satisfaction" },
              { value: "24/7", label: "Support" },
              { value: "5+ Yrs", label: "Experience" }
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUpVariant} className="px-4">
                <p className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">{stat.value}</p>
                <p className="text-sm font-medium text-[#00D4FF] uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3. Services Section */}
      <section id="services" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Our Premium Services</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Comprehensive security solutions engineered for absolute peace of mind.</p>
          </div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Camera, title: "CCTV Installation", desc: "Professional setup of high-res security cameras for any property type." },
              { icon: Video, title: "IP Camera Setup", desc: "Network-based surveillance with remote viewing capabilities." },
              { icon: Wifi, title: "Wireless Surveillance", desc: "Wire-free camera systems for clean and flexible installations." },
              { icon: User, title: "Video Door Phone", desc: "See and speak to visitors from anywhere before opening the door." },
              { icon: Fingerprint, title: "Access Control", desc: "Biometric and card-based systems to restrict unauthorized entry." },
              { icon: Wrench, title: "Annual Maintenance", desc: "Comprehensive AMC plans to ensure your systems never fail." }
            ].map((srv, i) => (
              <motion.div 
                key={i} variants={fadeUpVariant}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative bg-[#131A2B]/80 backdrop-blur-xl border border-white/5 hover:border-[#00D4FF]/30 rounded-3xl p-8 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(0,212,255,0.1)]"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-[#00D4FF]/10 transition-colors border border-white/5 group-hover:border-[#00D4FF]/20">
                  <srv.icon className="w-7 h-7 text-[#00D4FF] opacity-80 group-hover:opacity-100" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{srv.title}</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  {srv.desc}
                </p>
                <button className="text-[#00D4FF] font-medium flex items-center gap-1 group-hover:gap-2 transition-all text-sm">
                  Learn More <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Smart Features Section */}
      <section className="py-24 relative z-10 bg-white/[0.02] border-y border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7B61FF]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Intelligence Meets Security</h2>
              <p className="text-slate-400 mb-10 leading-relaxed">
                Our systems are equipped with the latest spatial and AI technology to provide proactive security rather than just reactive recording.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Smartphone, title: "Mobile Monitoring" },
                  { icon: Activity, title: "AI Motion Detection" },
                  { icon: Cloud, title: "Cloud Recording" },
                  { icon: Eye, title: "Night Vision" },
                  { icon: Bell, title: "Real-time Alerts" },
                  { icon: Server, title: "Remote Access" }
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-4 bg-[#131A2B] border border-white/5 p-4 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-[#7B61FF]/10 flex items-center justify-center border border-[#7B61FF]/20">
                      <feat.icon className="w-5 h-5 text-[#7B61FF]" />
                    </div>
                    <span className="font-medium text-slate-200">{feat.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <div className="relative h-[600px] hidden lg:block">
              {/* Spatial Floating UI Elements */}
              <motion.div 
                animate={{ y: [-10, 10, -10], rotateX: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute top-10 right-10 w-64 bg-[#0B0F19]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl z-20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-sm font-bold text-white">Motion Detected</span>
                </div>
                <img src={cctvFeed1} className="rounded-xl w-full h-32 object-cover mb-3" alt="Feed" />
                <button className="w-full py-2 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20">Sound Alarm</button>
              </motion.div>

              <motion.div 
                animate={{ y: [10, -10, 10], rotateY: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                className="absolute bottom-10 left-0 w-72 bg-[#0B0F19]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl z-20"
              >
                 <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-white">System Status</span>
                  <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">Online</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Cameras Active</span>
                    <span className="text-white font-medium">12/12</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full w-full"></div>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-slate-400">Cloud Storage</span>
                    <span className="text-white font-medium">84%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="bg-[#00D4FF] h-2 rounded-full w-[84%]"></div>
                  </div>
                </div>
              </motion.div>
              
              {/* Center connecting lines mockup */}
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 10 50 Q 50 10 90 50" fill="none" stroke="#00D4FF" strokeWidth="0.5" strokeDasharray="2,2" />
                <path d="M 10 50 Q 50 90 90 50" fill="none" stroke="#7B61FF" strokeWidth="0.5" strokeDasharray="2,2" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive Query Section */}
      <section id="quote-form" className="py-24 relative z-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#00D4FF]/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Form */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="bg-[#131A2B]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              {/* Form glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4FF]/10 rounded-full blur-[80px] pointer-events-none" />
              
              <h2 className="text-3xl font-bold text-white mb-2 relative z-10">Get a Free Security Assessment</h2>
              <p className="text-slate-400 mb-8 relative z-10">Fill out the details below and our AI system will route your request instantly.</p>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-[#00D4FF] outline-none transition-all" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-[#00D4FF] outline-none transition-all" placeholder="1234567890" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Required</label>
                    <select name="issueType" value={formData.issueType} onChange={handleChange} className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-[#00D4FF] outline-none transition-all appearance-none">
                      {isLoadingCategories ? (
                        <option value="">Loading categories...</option>
                      ) : (
                        categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Property Type</label>
                    <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-[#00D4FF] outline-none transition-all appearance-none">
                      <option value="Home">Home / Residential</option>
                      <option value="Office">Office / Commercial</option>
                      <option value="Factory">Factory / Industrial</option>
                      <option value="Shop">Retail Shop</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location / Address</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-[#00D4FF] outline-none transition-all" placeholder="Full address" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-[#00D4FF] outline-none transition-all" placeholder="City" />
                  </div>
                  <div className="space-y-2">
                    <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-[#00D4FF] outline-none transition-all" placeholder="Pincode" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Requirements</label>
                  <textarea required name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white focus:ring-2 focus:ring-[#00D4FF] outline-none transition-all resize-none" placeholder="E.g. Need 4 cameras for outdoor..."></textarea>
                </div>

                <button type="submit" disabled={mutation.isPending} className="w-full py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7B61FF] hover:opacity-90 shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all">
                  {mutation.isPending ? 'Processing...' : 'Submit Request'}
                </button>
              </form>
            </motion.div>

            {/* Right Side Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative hidden lg:block"
            >
              <div className="bg-[#131A2B]/50 border border-white/10 p-4 rounded-3xl shadow-2xl backdrop-blur-sm">
                <div className="flex gap-2 mb-4 px-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                    <img src={cctvFeed1} className="w-full h-full object-cover opacity-80" alt="Cam 1" />
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-white">CAM 01 - FRONT</div>
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] text-emerald-500 font-mono">REC</span>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                    <img src={cctvFeed2} className="w-full h-full object-cover opacity-80" alt="Cam 2" />
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-white">CAM 02 - LOBBY</div>
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] text-emerald-500 font-mono">REC</span>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                    <img src={cctvFeed3} className="w-full h-full object-cover opacity-80" alt="Cam 3" />
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-white">CAM 03 - SERVER</div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-[#0B0F19] border border-white/5 flex flex-col items-center justify-center text-slate-500">
                    <Plus className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium uppercase tracking-wider">Add Feed</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 6. Why Choose Us (Timeline) */}
      <section className="py-24 relative z-10 bg-[#0B0F19]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">The CCTV Pro Advantage</h2>
          </div>
          
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {[
              { title: "Certified Technicians", desc: "Expert installers vetted for professionalism." },
              { title: "Fast Installation", desc: "Most residential systems installed within 24 hours." },
              { title: "Affordable Pricing", desc: "Premium security without the enterprise price tag." },
              { title: "Premium Equipment", desc: "Only the best hardware from top global manufacturers." }
            ].map((item, i) => (
              <motion.div 
                key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#00D4FF]/30 bg-[#0B0F19] text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.2)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-[#131A2B] border border-white/5 shadow-xl transition-all group-hover:border-[#00D4FF]/30 group-hover:-translate-y-1">
                  <h3 className="font-bold text-white text-lg mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Projects Gallery */}
      <section className="py-24 relative z-10 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Our Projects</h2>
            <p className="text-slate-400">Transforming security across various sectors.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px]">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="group relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 lg:col-span-2 lg:row-span-2">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent opacity-80 group-hover:opacity-60 transition-opacity z-10"></div>
              <img src={cctvProject1} alt="Home Security" className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute bottom-8 left-8 z-20">
                <h3 className="text-white font-bold text-2xl drop-shadow-md mb-2">Smart Residential</h3>
                <p className="text-slate-300 text-sm drop-shadow-md max-w-md">Complete home automation and perimeter security integration.</p>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="group relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent opacity-80 group-hover:opacity-60 transition-opacity z-10"></div>
              <img src={cctvProject2} alt="Office Surveillance" className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-white font-bold text-lg drop-shadow-md">Enterprise Office</h3>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="group relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent opacity-80 group-hover:opacity-60 transition-opacity z-10"></div>
              <img src={cctvProject3} alt="Warehouse Monitoring" className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-white font-bold text-lg drop-shadow-md">Industrial Warehouse</h3>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 8. Testimonials */}
      <section className="py-24 relative z-10 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Client Reviews</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah J.", role: "Homeowner", review: "The installation was flawless. The app makes it so easy to check on my house when I'm away." },
              { name: "Michael T.", role: "Business Owner", review: "CCTV Pro secured our entire retail chain. Their AI motion detection drastically reduced false alarms." },
              { name: "David R.", role: "Factory Manager", review: "Exceptional 24/7 support. The AMC plan is worth every penny for the peace of mind it brings." }
            ].map((t, i) => (
              <motion.div key={i} whileHover={{ y: -5 }} className="bg-[#131A2B] border border-white/5 p-8 rounded-3xl relative">
                <div className="flex gap-1 mb-6 text-amber-400">
                  <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-slate-300 italic mb-8 leading-relaxed">"{t.review}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{t.name}</h4>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ Section */}
      <section className="py-24 relative z-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "How long does installation take?", a: "For a standard residential setup (4-8 cameras), installation is typically completed within 1 working day." },
              { q: "Can I view the cameras on my phone?", a: "Yes! All our systems come with a secure mobile app for iOS and Android, allowing live viewing and playback." },
              { q: "What happens if a camera breaks?", a: "If you have our AMC (Annual Maintenance Contract), we replace or repair hardware free of labor charges, and hardware is covered under warranty." }
            ].map((faq, i) => (
              <div key={i} className="bg-[#131A2B] border border-white/5 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left text-white font-semibold hover:bg-white/5 transition-colors"
                >
                  {faq.q}
                  {activeFaq === i ? <Minus className="w-5 h-5 text-[#00D4FF]" /> : <Plus className="w-5 h-5 text-slate-400" />}
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-5 text-slate-400 text-sm leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-[#0B0F19] pt-20 pb-10 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">CCTV Pro</span>
              </div>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
                Premium spatial surveillance solutions for the modern era. Secure your world with intelligent technology.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Services</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="hover:text-[#00D4FF] cursor-pointer transition-colors">Residential Setup</li>
                <li className="hover:text-[#00D4FF] cursor-pointer transition-colors">Commercial Setup</li>
                <li className="hover:text-[#00D4FF] cursor-pointer transition-colors">AMC Contracts</li>
                <li className="hover:text-[#00D4FF] cursor-pointer transition-colors">Access Control</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="hover:text-[#00D4FF] cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-[#00D4FF] cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-[#00D4FF] cursor-pointer transition-colors">Contact</li>
                <li className="hover:text-[#00D4FF] cursor-pointer transition-colors">Privacy Policy</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} CCTV Pro. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
              <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
              <span className="hover:text-white cursor-pointer transition-colors">Facebook</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
