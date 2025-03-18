"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  Layers, 
  Menu, 
  X, 
  ChevronDown, 
  Bell, 
  CircleCheck, 
  ExternalLink, 
  Shield, 
  Zap
} from "lucide-react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
  children?: {
    title: string;
    description?: string;
    href: string;
    icon?: React.ReactNode;
  }[];
}

interface AurumNavbarProps {
  className?: string;
}

export const AurumNavbar: React.FC<AurumNavbarProps> = ({ className }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("Dashboard");
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [walletConnected, setWalletConnected] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Mock wallet data for demo purposes
  const walletData = {
    address: "0x1a2...3b4c",
    balance: "1,234.56",
    network: "Ethereum",
    networkStatus: "Connected",
  };

  // Mock notifications for demo purposes
  const notifications = [
    { id: 1, title: "Transaction Confirmed", description: "Your swap of 0.5 ETH completed", time: "2 min ago", read: false },
    { id: 2, title: "Price Alert", description: "ETH is up 5% in the last hour", time: "15 min ago", read: true },
    { id: 3, title: "Staking Rewards", description: "You earned 0.25 tokens from staking", time: "1 hour ago", read: true },
  ];

  // Handle scroll events to change header appearance
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems: NavItem[] = [
    { 
      label: "Dashboard", 
      href: "/dashboard", 
      active: activeTab === "Dashboard",
      icon: <Zap size={16} className="mr-1.5" />
    },
    { 
      label: "Markets", 
      href: "/markets", 
      active: activeTab === "Markets",
      icon: <ExternalLink size={16} className="mr-1.5" />,
      children: [
        { 
          title: "Trending Markets", 
          description: "See what's hot in the crypto world",
          href: "/markets/trending",
          icon: <Zap size={16} />
        },
        { 
          title: "Market Overview", 
          description: "Get a bird's eye view of all markets",
          href: "/markets/overview",
          icon: <ExternalLink size={16} />
        },
        { 
          title: "Watchlist", 
          description: "Track your favorite assets",
          href: "/markets/watchlist",
          icon: <Shield size={16} />
        },
      ]
    },
    { 
      label: "Swap", 
      href: "/swap", 
      active: activeTab === "Swap" 
    },
    { 
      label: "Stake", 
      href: "/stake", 
      active: activeTab === "Stake" 
    },
  ];

  return (
    <header 
      className={cn(
        "w-full fixed top-0 z-40 transition-all duration-300",
        isScrolled 
          ? "bg-[#1a1a1a]/80 backdrop-blur-lg border-b border-white/5 shadow-lg" 
          : "bg-[#1a1a1a]",
        className
      )}
    >
      <div className="mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="relative h-9 w-9 mr-2">
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
                <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black text-amber-300 transition-all duration-300 group-hover:text-amber-200">
                  <Layers size={20} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-tight">Aurum</span>
                <span className="text-[10px] text-amber-300/80 -mt-1 tracking-widest">FINANCE</span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Tabs - Desktop */}
          <div className="hidden lg:flex flex-1 justify-center">
            <NavigationMenu>
              <NavigationMenuList className="bg-[#2a2a2a]/80 backdrop-blur-md rounded-full px-1 py-1 flex items-center border border-white/5">
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.label}>
                    {item.children ? (
                      <>
                        <NavigationMenuTrigger 
                          className={cn(
                            "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                            item.active 
                              ? "text-black bg-gradient-to-r from-amber-200 to-yellow-400" 
                              : "text-white/70 hover:text-white bg-transparent hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center">
                            {item.icon}
                            {item.label}
                          </div>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="w-[400px] p-4 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl">
                            <div className="grid gap-3">
                              {item.children.map((child) => (
                                <Link 
                                  key={child.title} 
                                  href={child.href}
                                  onClick={() => setActiveTab(item.label)}
                                  className="flex items-start p-3 hover:bg-white/5 rounded-lg transition-colors group"
                                >
                                  <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#2a2a2a] text-amber-300 mr-3 group-hover:bg-amber-300/10">
                                    {child.icon}
                                  </div>
                                  <div>
                                    <div className="font-medium text-white">{child.title}</div>
                                    {child.description && (
                                      <p className="text-xs text-white/60 mt-0.5">{child.description}</p>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <button
                        onClick={() => setActiveTab(item.label)}
                        className={cn(
                          "relative px-5 py-2 text-sm font-medium rounded-full transition-colors",
                          item.active 
                            ? "text-black" 
                            : "text-white/70 hover:text-white"
                        )}
                      >
                        {item.active && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute inset-0 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 rounded-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                        <span className={`relative z-10 flex items-center ${item.active ? "text-black" : ""}`}>
                          {item.icon}
                          {item.label}
                        </span>
                      </button>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative">
              <motion.button
                className="relative p-2 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400"></span>
              </motion.button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50"
                  >
                    <div className="p-3 border-b border-white/5">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-white">Notifications</h3>
                        <button className="text-xs text-amber-300 hover:text-amber-200">Mark all as read</button>
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-3 border-b border-white/5 hover:bg-white/5 ${!notification.read ? 'bg-amber-500/5' : ''}`}
                        >
                          <div className="flex justify-between">
                            <h4 className="font-medium text-sm text-white">{notification.title}</h4>
                            <span className="text-xs text-white/50">{notification.time}</span>
                          </div>
                          <p className="text-xs text-white/70 mt-1">{notification.description}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 text-center">
                      <button className="text-xs text-amber-300 hover:text-amber-200">View all notifications</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Connect Wallet Button or Wallet Info */}
            <div className="relative">
              {walletConnected ? (
                <motion.button
                  className="flex items-center rounded-full bg-[#2a2a2a] border border-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2a2a2a]/80 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center">
                    <div className="h-5 w-5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mr-2">
                      <CircleCheck size={12} className="text-white" />
                    </div>
                    <span>{walletData.address}</span>
                    <ChevronDown size={14} className="ml-1 text-white/50" />
                  </div>
                </motion.button>
              ) : (
                <motion.button 
                  className="flex items-center rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 px-4 py-1.5 text-sm font-medium text-black hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                  whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(245, 158, 11, 0.3)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setWalletConnected(true)}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </motion.button>
              )}
            </div>

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-full p-2 text-white/70 hover:text-white hover:bg-white/5 lg:hidden"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="lg:hidden bg-[#1a1a1a]/95 backdrop-blur-lg border-t border-white/5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-1 px-4 py-3">
              {navItems.map((item) => (
                <React.Fragment key={item.label}>
                  <button
                    onClick={() => {
                      setActiveTab(item.label);
                      if (!item.children) setIsOpen(false);
                    }}
                    className={`flex justify-between items-center w-full text-left rounded-lg py-3 px-4 text-base ${
                      item.active 
                        ? "bg-gradient-to-r from-amber-200 to-yellow-400 text-black font-medium" 
                        : "text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.children && <ChevronDown size={16} className={item.active ? "text-black" : "text-white/50"} />}
                  </button>
                  
                  {item.children && item.active && (
                    <div className="pl-4 space-y-1 mt-1 mb-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.title}
                          href={child.href}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center py-2 px-4 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5"
                        >
                          {child.icon && <span className="mr-2 text-amber-300">{child.icon}</span>}
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
              
              {/* Mobile wallet section */}
              {walletConnected ? (
                <div className="mt-4 p-4 rounded-xl bg-[#2a2a2a]/50 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mr-2">
                        <CircleCheck size={12} className="text-white" />
                      </div>
                      <span className="text-white font-medium">{walletData.address}</span>
                    </div>
                    <button className="text-xs text-amber-300">Disconnect</button>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Balance:</span>
                    <span className="text-white font-medium">{walletData.balance} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-white/70">Network:</span>
                    <span className="text-green-400">{walletData.network}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setWalletConnected(true);
                    setIsOpen(false);
                  }}
                  className="w-full mt-4 flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-300 to-yellow-400 px-4 py-3 text-base font-medium text-black"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AurumNavbar;
