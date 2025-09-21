"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sidebar } from "./sidebar"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

interface HeaderProps {
  user: any
  title: string
  subtitle?: string
}

export function Header({ user, title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <Sidebar user={user} />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Search */}
          <div className="hidden sm:flex sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
              <Input type="search" placeholder="Search..." className="pl-10 w-64" />
            </div>
          </div>

          {/* Notifications */}
          <NotificationDropdown />
        </div>
      </div>
    </header>
  )
}
