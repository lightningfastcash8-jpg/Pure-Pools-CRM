"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { Button } from './ui/button'
import {
  LayoutDashboard,
  Users,
  Mail,
  AlertCircle,
  Calendar,
  FileText,
  Download,
  Settings,
  LogOut,
  Bot,
  Menu,
  X,
  Clipboard
} from 'lucide-react'
import { Input } from './ui/input'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/work-orders', label: 'Work Orders', icon: Clipboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/warranty', label: 'Warranty Pipeline', icon: AlertCircle },
  { href: '/scheduler', label: 'Scheduler', icon: Calendar },
  { href: '/agent', label: 'AI Agent', icon: Bot },
  { href: '/exports', label: 'Exports', icon: Download },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppNav() {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Image
          src="/1.png"
          alt="Pure Pools"
          width={120}
          height={48}
          className="h-8 w-auto"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <aside className={`${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:relative z-40 w-64 bg-white border-r border-gray-200 flex flex-col h-screen transition-transform duration-300 ease-in-out`}>
        <div className="p-6 border-b border-gray-200 hidden md:block">
          <Image
            src="/1.png"
            alt="Pure Pools"
            width={160}
            height={64}
            className="h-12 w-auto"
          />
        </div>
        <div className="p-6 border-b border-gray-200 md:hidden">
          <Image
            src="/1.png"
            alt="Pure Pools"
            width={160}
            height={64}
            className="h-10 w-auto"
          />
        </div>


        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{user?.email}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
