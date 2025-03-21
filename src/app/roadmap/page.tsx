"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Rocket, 
  Target, 
  Zap,
  Shield,
  BarChart3,
  Users,
  Globe,
  Award,
  ExternalLink,
  Twitter
} from "lucide-react";
import Link from "next/link";

export default function RoadmapPage() {
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Helper function to render milestone items
  const renderMilestone = (title: string, description: string, status: "completed" | "in-progress" | "upcoming", icon: React.ReactNode) => (
    <div className="flex items-start gap-3 sm:gap-4">
      <div className={`h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full flex items-center justify-center mt-0.5 ${
        status === "completed" 
          ? "bg-green-500/10 text-green-400" 
          : status === "in-progress" 
            ? "bg-amber-500/10 text-amber-400"
            : "bg-blue-500/10 text-blue-400"
      }`}>
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-white font-medium text-sm sm:text-base">{title}</h4>
          {status === "completed" && (
            <span className="bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded-full">Completed</span>
          )}
          {status === "in-progress" && (
            <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full">In Progress</span>
          )}
        </div>
        <p className="text-white/70 text-xs sm:text-sm mt-1">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <section className="space-y-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-white">AurumTrust: </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-500">
                Roadmap
              </span>
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-white/70 max-w-2xl">
              Our strategic vision and development timeline for creating a sustainable deflationary token backed by gold trading profits.
            </p>
          </motion.div>
          
          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 via-amber-400/30 to-amber-300/10 transform -translate-x-1/2"></div>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-12 sm:space-y-16 relative"
            >
              {/* Q2 2025 */}
              <motion.div variants={itemVariants} className="relative">
                <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                  {/* Timeline marker */}
                  <div className="absolute left-4 sm:left-1/2 w-8 h-8 bg-amber-400 rounded-full border-4 border-[#1a1a1a] transform -translate-x-1/2 flex items-center justify-center">
                    <span className="text-black font-bold text-xs">Q2</span>
                  </div>
                  
                  {/* Left side - Date */}
                  <div className="sm:w-1/2 sm:text-right sm:pr-12 pl-16 sm:pl-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Q2 2025</h2>
                    <p className="text-white/70 text-sm sm:text-base mt-1">April - June</p>
                  </div>
                  
                  {/* Right side - Content */}
                  <div className="sm:w-1/2 sm:pl-12 pl-16 sm:pl-0 space-y-6">
                    <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Launch Phase</h3>
                      
                      <div className="space-y-4 sm:space-y-6">
                        {renderMilestone(
                          "Token Launch (March 2025)", 
                          "Initial token distribution and listing on decentralized exchanges.", 
                          "completed", 
                          <Rocket size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Trading Account Setup", 
                          "Establish gold trading account to fund the burn mechanism.", 
                          "completed", 
                          <BarChart3 size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "First Token Burn", 
                          "Execute first buyback and burn using gold trading profits (April 14, 2025).", 
                          "in-progress", 
                          <Flame size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Community Building", 
                          "Grow social media presence and establish community channels.", 
                          "in-progress", 
                          <Users size={16} className="sm:text-[18px]" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Q3 2025 */}
              <motion.div variants={itemVariants} className="relative">
                <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                  {/* Timeline marker */}
                  <div className="absolute left-4 sm:left-1/2 w-8 h-8 bg-amber-400 rounded-full border-4 border-[#1a1a1a] transform -translate-x-1/2 flex items-center justify-center">
                    <span className="text-black font-bold text-xs">Q3</span>
                  </div>
                  
                  {/* Right side - Content (on mobile this will be below the date) */}
                  <div className="sm:w-1/2 sm:text-right sm:pr-12 pl-16 sm:pl-0 order-2 sm:order-1">
                    <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:text-right">Growth Phase</h3>
                      
                      <div className="space-y-4 sm:space-y-6">
                        {renderMilestone(
                          "Enhanced Trading Strategy", 
                          "Optimize gold trading strategy to increase profits for token burns.", 
                          "upcoming", 
                          <Target size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Transparency Dashboard", 
                          "Launch real-time dashboard showing trading profits and burn statistics.", 
                          "upcoming", 
                          <BarChart3 size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Marketing Campaign", 
                          "Expand marketing efforts to increase token visibility and adoption.", 
                          "upcoming", 
                          <Globe size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Exchange Listings", 
                          "List on additional exchanges to improve liquidity and accessibility.", 
                          "upcoming", 
                          <Zap size={16} className="sm:text-[18px]" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Left side - Date (on mobile this will be above the content) */}
                  <div className="sm:w-1/2 sm:pl-12 pl-16 sm:pl-0 order-1 sm:order-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Q3 2025</h2>
                    <p className="text-white/70 text-sm sm:text-base mt-1">July - September</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Q4 2025 */}
              <motion.div variants={itemVariants} className="relative">
                <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                  {/* Timeline marker */}
                  <div className="absolute left-4 sm:left-1/2 w-8 h-8 bg-amber-400 rounded-full border-4 border-[#1a1a1a] transform -translate-x-1/2 flex items-center justify-center">
                    <span className="text-black font-bold text-xs">Q4</span>
                  </div>
                  
                  {/* Left side - Date */}
                  <div className="sm:w-1/2 sm:text-right sm:pr-12 pl-16 sm:pl-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Q4 2025</h2>
                    <p className="text-white/70 text-sm sm:text-base mt-1">October - December</p>
                  </div>
                  
                  {/* Right side - Content */}
                  <div className="sm:w-1/2 sm:pl-12 pl-16 sm:pl-0 space-y-6">
                    <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Expansion Phase</h3>
                      
                      <div className="space-y-4 sm:space-y-6">
                        {renderMilestone(
                          "Staking Program", 
                          "Introduce staking rewards for long-term token holders.", 
                          "upcoming", 
                          <Shield size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Mobile App", 
                          "Launch mobile application for tracking burns, trading profits, and token metrics.", 
                          "upcoming", 
                          <Smartphone size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Strategic Partnerships", 
                          "Form partnerships with gold trading firms and crypto projects.", 
                          "upcoming", 
                          <Handshake size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Community Governance", 
                          "Implement voting system for community input on trading strategies.", 
                          "upcoming", 
                          <Users size={16} className="sm:text-[18px]" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* 2026+ */}
              <motion.div variants={itemVariants} className="relative">
                <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                  {/* Timeline marker */}
                  <div className="absolute left-4 sm:left-1/2 w-8 h-8 bg-amber-400 rounded-full border-4 border-[#1a1a1a] transform -translate-x-1/2 flex items-center justify-center">
                    <span className="text-black font-bold text-xs">26+</span>
                  </div>
                  
                  {/* Right side - Content (on mobile this will be below the date) */}
                  <div className="sm:w-1/2 sm:text-right sm:pr-12 pl-16 sm:pl-0 order-2 sm:order-1">
                    <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:text-right">Long-Term Vision</h3>
                      
                      <div className="space-y-4 sm:space-y-6">
                        {renderMilestone(
                          "Expanded Trading Portfolio", 
                          "Diversify trading strategies beyond gold to increase profit potential.", 
                          "upcoming", 
                          <BarChart3 size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Institutional Adoption", 
                          "Attract institutional investors to the AurumTrust ecosystem.", 
                          "upcoming", 
                          <Building2 size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Cross-Chain Expansion", 
                          "Expand AurumTrust to additional blockchain networks.", 
                          "upcoming", 
                          <Globe size={16} className="sm:text-[18px]" />
                        )}
                        
                        {renderMilestone(
                          "Complete Burn Goal", 
                          "Achieve significant token scarcity through continued burn mechanism.", 
                          "upcoming", 
                          <Award size={16} className="sm:text-[18px]" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Left side - Date (on mobile this will be above the content) */}
                  <div className="sm:w-1/2 sm:pl-12 pl-16 sm:pl-0 order-1 sm:order-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">2026 & Beyond</h2>
                    <p className="text-white/70 text-sm sm:text-base mt-1">Long-term development</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 sm:mt-12 text-center"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              Join Us On This Journey
            </h3>
            <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto mb-5 sm:mb-6">
              Follow our progress as we build a sustainable deflationary token backed by real gold trading profits.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <a 
                href="https://x.com/AurumTrustCro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base transition-colors"
              >
                <Twitter size={16} className="sm:text-[18px]" />
                <span>Follow on X</span>
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-300 to-yellow-500 text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-transform hover:scale-105"
              >
                <span>Back to Home</span>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

function Flame(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function Handshake(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
    </svg>
  );
}

function Smartphone(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function Building2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
