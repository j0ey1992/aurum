"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Layers, 
  Twitter, 
  Github, 
  Linkedin, 
  Send, 
  ExternalLink,
  Shield,
  Zap,
  ArrowRight
} from "lucide-react";

interface AurumFooterProps {
  className?: string;
}

export function AurumFooter({ className = "" }: AurumFooterProps) {
  const currentYear = new Date().getFullYear();
  
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
  
  return (
    <footer className={`w-full bg-[#1a1a1a] border-t border-white/5 ${className}`}>
      {/* Main Footer */}
      <motion.div 
        className="container mx-auto px-4 py-8 sm:py-12 md:py-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          {/* Logo and About */}
          <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4">
            <Link href="/" className="flex items-center group">
              <div className="relative h-8 w-8 sm:h-9 sm:w-9 mr-2">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 opacity-70 blur-sm"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.7, 0.9, 0.7],
                    rotate: [0, 5, 0, -5, 0]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-black text-amber-300 transition-all duration-300 group-hover:text-amber-200">
                  <Layers size={18} className="sm:text-[20px]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight">Aurum</span>
                <span className="text-[8px] sm:text-[10px] text-amber-300/80 -mt-1 tracking-widest">FINANCE</span>
              </div>
            </Link>
            
            <p className="text-white/70 text-xs sm:text-sm">
              The gold-backed deflationary token experiment on Cronos Chain. Burn mechanism funded by real gold trading profits.
            </p>
            
            <div className="flex space-x-2 sm:space-x-3 pt-1 sm:pt-2">
              <a 
                href="https://twitter.com/AurumTrust" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-[#2a2a2a] text-white/70 hover:text-amber-300 transition-colors"
              >
                <Twitter size={14} className="sm:text-[16px]" />
              </a>
              <a 
                href="https://github.com/AurumTrust" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-[#2a2a2a] text-white/70 hover:text-amber-300 transition-colors"
              >
                <Github size={14} className="sm:text-[16px]" />
              </a>
              <a 
                href="https://linkedin.com/company/aurumtrust" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-[#2a2a2a] text-white/70 hover:text-amber-300 transition-colors"
              >
                <Linkedin size={14} className="sm:text-[16px]" />
              </a>
            </div>
          </motion.div>
          
          {/* Quick Links */}
          <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-white">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-white/70 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Zap size={12} className="sm:text-[14px]" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/markets" 
                  className="text-white/70 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <ExternalLink size={12} className="sm:text-[14px]" />
                  <span>Markets</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/swap" 
                  className="text-white/70 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <ArrowRight size={12} className="sm:text-[14px]" />
                  <span>Swap</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/stake" 
                  className="text-white/70 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Shield size={12} className="sm:text-[14px]" />
                  <span>Stake</span>
                </Link>
              </li>
            </ul>
          </motion.div>
          
          {/* Resources */}
          <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-white">Resources</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <a 
                  href="https://docs.aurumtrust.finance" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <span>Documentation</span>
                  <ExternalLink size={10} className="sm:text-[12px]" />
                </a>
              </li>
              <li>
                <a 
                  href="https://medium.com/aurumtrust" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <span>Blog</span>
                  <ExternalLink size={10} className="sm:text-[12px]" />
                </a>
              </li>
              <li>
                <a 
                  href="https://cronoscan.com/token/0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <span>Contract</span>
                  <ExternalLink size={10} className="sm:text-[12px]" />
                </a>
              </li>
              <li>
                <a 
                  href="https://t.me/AurumTrust" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <span>Community</span>
                  <ExternalLink size={10} className="sm:text-[12px]" />
                </a>
              </li>
            </ul>
          </motion.div>
          
          {/* Newsletter */}
          <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-white">Stay Updated</h3>
            <p className="text-white/70 text-xs sm:text-sm">
              Subscribe to our newsletter for the latest updates on burns, trading profits, and new features.
            </p>
            
            <div className="relative mt-1 sm:mt-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-[#2a2a2a] border border-white/10 rounded-full py-2 sm:py-2.5 pl-3 sm:pl-4 pr-10 sm:pr-12 text-xs sm:text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
              <button className="absolute right-1 top-1 h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 text-black">
                <Send size={12} className="sm:text-[14px]" />
              </button>
            </div>
            
            <p className="text-white/50 text-[10px] sm:text-xs">
              By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
            </p>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Bottom Bar */}
      <div className="border-t border-white/5 bg-[#1a1a1a]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="text-white/50 text-xs sm:text-sm text-center sm:text-left">
              © {currentYear} AurumTrust Finance. All rights reserved.
              <div className="mt-1 text-[10px] sm:text-xs">
                Made with <span className="text-red-500">❤️</span> by Kris Token / Joey
              </div>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/terms" className="text-white/50 hover:text-white text-xs sm:text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-white/50 hover:text-white text-xs sm:text-sm transition-colors">
                Privacy Policy
              </Link>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-white/50 text-xs sm:text-sm">Powered by</span>
              <a 
                href="https://cronos.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 sm:gap-1.5 bg-[#2a2a2a] rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs text-white/70 hover:text-white transition-colors"
              >
                <span>Cronos Chain</span>
                <ExternalLink size={8} className="sm:text-[10px]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AurumFooter;
