"use client";

import * as React from "react";
import { Menu, MoveRight, X } from "lucide-react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";

interface NavigationItem {
  title: string;
  href?: string;
  description?: string;
  items?: {
    title: string;
    href: string;
    description?: string;
  }[];
}

interface NavbarProps {
  logo?: React.ReactNode;
  navigationItems?: NavigationItem[];
  actions?: React.ReactNode[];
  className?: string;
}

export function Navbar({
  logo = <p className="font-semibold text-lg">Brand</p>,
  navigationItems = [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Features",
      description: "Explore our product features and capabilities",
      items: [
        {
          title: "Analytics",
          href: "/features/analytics",
        },
        {
          title: "Reporting",
          href: "/features/reporting",
        },
        {
          title: "Automation",
          href: "/features/automation",
        },
        {
          title: "Integrations",
          href: "/features/integrations",
        },
      ],
    },
    {
      title: "Resources",
      description: "Helpful resources to get the most out of our platform",
      items: [
        {
          title: "Documentation",
          href: "/resources/docs",
        },
        {
          title: "Guides",
          href: "/resources/guides",
        },
        {
          title: "API Reference",
          href: "/resources/api",
        },
        {
          title: "Support",
          href: "/resources/support",
        },
      ],
    },
    {
      title: "Pricing",
      href: "/pricing",
    },
    {
      title: "Blog",
      href: "/blog",
    },
  ],
  actions = [
    <Button key="signin" variant="outline">Sign in</Button>,
    <Button key="signup">Get started</Button>,
  ],
  className,
}: NavbarProps) {
  const [isOpen, setOpen] = React.useState(false);

  return (
    <header className={`w-full bg-background border-b border-border sticky top-0 z-40 ${className}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center">
            {logo}
          </div>
          
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.href ? (
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                        {item.title}
                      </NavigationMenuLink>
                    </Link>
                  ) : (
                    <>
                      <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="w-[400px] p-4">
                          <div className="flex flex-col gap-3">
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {item.description}
                              </p>
                            )}
                            <div className="grid gap-2">
                              {item.items?.map((subItem) => (
                                <Link key={subItem.title} href={subItem.href} legacyBehavior passHref>
                                  <NavigationMenuLink
                                    className="flex justify-between items-center hover:bg-muted py-2 px-3 rounded-md text-sm"
                                  >
                                    <span>{subItem.title}</span>
                                    <MoveRight className="w-4 h-4 text-muted-foreground" />
                                  </NavigationMenuLink>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2">
            {actions}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-border">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navigationItems.map((item) => (
              <div key={item.title} className="py-2">
                {item.href ? (
                  <Link 
                    href={item.href}
                    className="text-base font-medium"
                    onClick={() => setOpen(false)}
                  >
                    {item.title}
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <div className="font-medium text-base">{item.title}</div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    <div className="grid gap-2 pl-2">
                      {item.items?.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.href}
                          className="flex justify-between items-center py-2 text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => setOpen(false)}
                        >
                          <span>{subItem.title}</span>
                          <MoveRight className="w-4 h-4" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {actions}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
