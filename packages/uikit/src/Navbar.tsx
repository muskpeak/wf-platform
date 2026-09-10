"use client";

import React from "react";
import { cn } from "@wf-platform/utils";

export interface NavItem {
  id: string;
  path: string;
  title: string;
}

export interface NavbarProps {
  logoUrl?: string;
  navItems: NavItem[];
  currentPath?: string;
  
  // Auth & Balance state
  isLoggedIn: boolean;
  
  // Render Props / Slots
  LinkComponent?: any; // e.g. Next.js Link
  rightControlsSlot?: React.ReactNode; // e.g. Theme, Lang, ConnectButton
}

export function Navbar({
  logoUrl = "/logo.svg",
  navItems,
  currentPath = "/",
  isLoggedIn,
  LinkComponent = "a",
  rightControlsSlot,
}: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center gap-8">
          <LinkComponent href="/" className="flex items-center gap-[6px] shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
            ) : (
              <div className="h-8 w-8 bg-blue-600 rounded-full" />
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center uppercase sm:gap-1.5 text-[#008CFF] font-[family-name:var(--font-archivo-black),sans-serif] font-normal text-[12px] leading-[10px] sm:font-[family-name:'adineue_PRO',var(--font-archivo-black),sans-serif] sm:text-[22.555px] sm:leading-normal">
              <span>WORLD</span>
              <span>FORECAST</span>
            </div>
          </LinkComponent>
          
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((nav) => {
              const isActive = currentPath === nav.path;
              return (
                <LinkComponent 
                  key={nav.id} 
                  href={nav.path} 
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap",
                    isActive 
                      ? "bg-white text-blue-600 shadow-sm border border-gray-100" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {nav.title}
                </LinkComponent>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 shrink-0">
          
          {/* Slots for Wallet Connect, Toggles, etc */}
          <div className="flex items-center gap-2">
            {rightControlsSlot}
          </div>
          
        </div>
      </div>
    </nav>
  );
}
