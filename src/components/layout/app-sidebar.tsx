'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Book, BookOpen, FileText, Flag, LayoutDashboard, Target, CalendarDays } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

import { useActivation } from '../DoubleClickActivator';
import { ThemeToggle } from '../theme-toggle';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/case-studies', label: 'Case Studies', icon: FileText },
  { href: '/skills', label: 'Skill Tracker', icon: Target },
  { href: '/goals', label: 'Goal Setting', icon: Flag },
  { href: '/journal', label: 'Journal', icon: Book },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { handleDoubleClick } = useActivation();


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex justify-between items-center w-full">
          {/* --- APPLY DOUBLE-CLICK HANDLER TO THE LOGO CONTAINER --- */}
          <div className="flex items-center gap-2 cursor-pointer" onDoubleClick={handleDoubleClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <div className="flex flex-col">
              <h2 className="font-headline text-lg font-semibold tracking-tighter">MBA</h2>
              <p className="text-sm font-light -mt-1 text-muted-foreground">Command Center</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

