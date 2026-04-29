import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react'
import {
  ChartBarIcon,
  UserGroupIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import {
  ShieldCheckIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  IdentificationIcon,
  AdjustmentsHorizontalIcon,
  CommandLineIcon,
} from '@heroicons/react/24/solid'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/PermissionContext'
import { MODULES } from '../utils/permissions'
import toast from 'react-hot-toast'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  module?: string  // Module name for permission checking
}

const allNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Squares2X2Icon, module: MODULES.DASHBOARD },
  { name: 'Users', href: '/users', icon: UserGroupIcon, module: MODULES.USERS },
  { name: 'Roles', href: '/roles', icon: ShieldCheckIcon, module: MODULES.ROLES },
  { name: 'Brokers', href: '/brokers', icon: BuildingOfficeIcon, module: MODULES.BROKERS },
  { name: 'Broker Profiles', href: '/broker-profiles', icon: IdentificationIcon, module: MODULES.BROKER_PROFILES },
  // { name: 'Groups', href: '/groups', icon: Layers, module: MODULES.GROUPS },
  { name: 'Rules', href: '/rules', icon: AdjustmentsHorizontalIcon, module: MODULES.RULES },
  { name: 'Audit Logs', href: '/audit-logs', icon: ClipboardDocumentListIcon, module: MODULES.AUDIT_LOGS },
  { name: 'Logs', href: '/logs', icon: CommandLineIcon, module: MODULES.LOGS },
  { name: 'API Metrics', href: '/api-metrics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, module: MODULES.PROFILE },
]

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const { canViewModule, isAdmin, user, permissions } = usePermissions()

  // Filter navigation items based on user permissions
  const navigation = allNavigation.filter(item => {
    // If user is admin, show everything
    if (isAdmin) {
      return true
    }
    
    // Always show Dashboard
    if (item.href === '/') {
      return true
    }
    
    // If no module specified, show the item
    if (!item.module) {
      return true
    }
    
    // Check if user has permission to view the module
    return canViewModule(item.module)
  })

  const { logout } = useAuth()
  const handleLogout = async () => {
    // Clear local auth immediately and rely on client-side redirect.
    logout()
    toast.success('Logged out successfully')
    const base = (import.meta as any).env?.VITE_ADMIN_BASE_URL || `${window.location.protocol}//${window.location.host}/brk-eye-adm`
    const normalized = (typeof base === 'string' && base.endsWith('/')) ? base : `${base}/`
    const loginUrl = `${normalized}login`
    // Hard redirect to prevent history back to protected pages
    window.location.replace(loginUrl)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="hidden lg:flex lg:flex-shrink-0 relative z-0 transition-[width] duration-300 ease-in-out"
        style={{ width: isCollapsed ? '4.5rem' : '13.5rem' }}
      >
        <div className="relative z-0 flex h-screen flex-col border-r border-slate-200 bg-white shadow-xl w-full overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-white0"></div>
          {/* Header */}
          <div className={cn(
            "border-b border-slate-200 bg-white flex-shrink-0 h-[88px]",
            isCollapsed ? "flex items-center justify-center px-3" : "px-3 flex items-center"
          )}>
            {isCollapsed ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 shadow-lg flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 leading-tight">
                  <h1 className="text-base font-bold text-slate-900 whitespace-nowrap tracking-tight">
                    Broker Eye Admin
                  </h1>
                  <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Management Pro</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            isCollapsed ? "px-2 pt-8 pb-6" : "px-4 py-6"
          )}>
            <nav className={cn(isCollapsed ? "space-y-2" : "space-y-1")}>
              {navigation.map((item, index) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                
                return (
                  <div key={item.name}>
                    <Link
                      to={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center rounded-lg transition-all duration-200 group relative",
                        isCollapsed ? "justify-center h-11 w-11 mx-auto" : "space-x-3 p-3",
                        isActive
                          ? isCollapsed
                            ? "bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                            : "bg-blue-100 text-slate-900 border-l-4 border-blue-700"
                          : isCollapsed
                            ? "text-slate-500 hover:bg-white hover:text-slate-900"
                            : "text-slate-600 hover:bg-white hover:text-slate-900"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 transition-all duration-200 flex-shrink-0",
                        "group-hover:scale-105",
                        isActive
                          ? isCollapsed
                            ? "text-white"
                            : "text-blue-700"
                          : "text-slate-600 group-hover:text-slate-900"
                      )} />
                      
                      {!isCollapsed && (
                        <span className="font-medium whitespace-nowrap">{item.name}</span>
                      )}
                    </Link>
                  </div>
                )
              })}
            </nav>
          </div>
          
          {/* Logout Button */}
          <div className={cn(
            "border-t border-slate-200 bg-white flex-shrink-0",
            isCollapsed ? "p-2" : "p-4"
          )}>
            <button
              onClick={handleLogout}
              title={isCollapsed ? 'Sign Out' : undefined}
              className={cn(
                "flex items-center rounded-lg transition-all duration-200 group text-slate-600 hover:bg-red-50 hover:text-red-600",
                isCollapsed ? "justify-center h-11 w-11 mx-auto" : "w-full space-x-3 p-3"
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105" />
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap">Sign Out</span>
              )}
            </button>
          </div>
        </div>

        {/* Edge collapse button (outside inner overflow container) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute z-20 right-0 top-12 translate-x-1/2 rounded-full bg-blue-700 border border-blue-600 shadow-md hover:shadow-lg hover:bg-blue-800 transition-all duration-200 text-white flex items-center justify-center w-8 h-8"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight className={cn(
            "w-4 h-4 transition-transform duration-300",
            isCollapsed ? "rotate-0" : "rotate-180"
          )} />
        </button>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900">
                        UserAdmin
                      </h1>
                      <p className="text-xs text-slate-500 font-medium">Management Pro</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-blue-100 transition-all duration-200 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-4 py-6 overflow-y-auto">
                  <nav className="space-y-1">
                    {navigation.map((item, index) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.href
                      
                      return (
                        <div key={item.name}>
                          <Link
                            to={item.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group relative",
                              isActive
                                ? "bg-blue-100 text-slate-900 border-l-4 border-blue-700"
                                : "text-slate-600 hover:bg-white hover:text-slate-900"
                            )}
                          >
                            <Icon className={cn(
                              "w-5 h-5 transition-transform duration-200",
                              "group-hover:scale-105",
                              isActive ? "text-slate-700" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        </div>
                      )
                    })}
                  </nav>
                </div>
                
                {/* Mobile Logout Button */}
                <div className="p-4 border-t border-slate-200 bg-white">
                  <button
                    onClick={() => {
                      onClose()
                      handleLogout()
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 text-slate-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar

