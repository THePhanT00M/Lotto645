"use client"

import { useState } from "react"
import { User, Bell, Settings, CreditCard, LogOut, ChevronDown } from "lucide-react"

interface ProfileDropdownProps {
  onLogout: () => void
}

export default function ProfileDropdown({ onLogout }: ProfileDropdownProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)

  const toggleProfileModal = () => {
    setShowProfileModal(!showProfileModal)
  }

  const handleLogout = () => {
    onLogout()
    setShowProfileModal(false)
  }

  return (
    <div className="relative">
      <button
        onClick={toggleProfileModal}
        className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors"
      >
        <img src="/diverse-group-profile.png" alt="Profile" className="w-8 h-8 rounded-full" />
        <span className="text-gray-900 dark:text-white font-medium hidden sm:block">Sarah</span>
        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300 hidden sm:block" />
      </button>

      {showProfileModal && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="font-semibold text-gray-900 dark:text-white">Sarah Johnson</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">sarah@example.com</div>
          </div>

          <div className="py-1">
            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Profile</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">⌘P</span>
            </button>

            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Notifications</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">⌘N</span>
            </button>

            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Billing</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">⌘B</span>
            </button>

            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Settings</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">⌘S</span>
            </button>

            <hr className="my-1 border-gray-100 dark:border-gray-700" />

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3"
            >
              <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
