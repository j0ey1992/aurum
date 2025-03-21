"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Layers, 
  Twitter, 
  Github, 
  ExternalLink
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
        <div className="flex justify-center">
          {/* Logo and About */}
          <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4 max-w-md">
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
            
            <p className="text-white/70 text-xs sm:text-sm text-center">
              The gold-backed deflationary token experiment on Cronos Chain. Burn mechanism funded by real gold trading profits.
            </p>
            
            <div className="flex space-x-2 sm:space-x-3 pt-1 sm:pt-2 justify-center">
              <a 
                href="https://x.com/AurumTrustCro" 
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
            </div>
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
