import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { Cog6ToothIcon } from '@heroicons/react/24/solid'
import { authService } from '../services/authService'
import TwoFactorSettings from '../components/TwoFactorSettings'
import PageHeaderShell from '../components/layout/PageHeaderShell'

const Settings: React.FC = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  
  // Get current user
  const { data: currentUser } = useQuery('currentUser', authService.getCurrentUser, {
    initialData: authService.getCurrentUser()
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
      <div className="space-y-6 pb-6">
        {/* Header */}
        <PageHeaderShell>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center">
                    <Cog6ToothIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent text-lg font-bold transition-colors duration-300">
                    Settings
                  </h1>
                  <p className="text-xs font-medium text-slate-500 transition-colors duration-300">
                    Manage your account settings and security preferences
                  </p>
                </div>
              </div>
              <div />
            </div>
        </PageHeaderShell>

        {/* User Info Card */}
        <div className="mx-2 bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12">
              <div className="h-12 w-12 rounded-full bg-blue-100 border border-slate-300 flex items-center justify-center">
                <span className="text-lg font-medium text-slate-500">
                  {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-slate-900">{currentUser?.username}</h3>
              <p className="text-sm text-slate-500">{currentUser?.email}</p>
              <div className="mt-1 flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentUser?.is_active 
                    ? 'bg-blue-100 text-slate-700' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {currentUser?.is_active ? 'Active' : 'Inactive'}
                </span>
                {currentUser?.roles?.map((role: string) => (
                  <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-slate-800">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="mx-2 bg-white shadow rounded-lg">
          <div className="border-b border-slate-300 px-6 py-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-slate-600" />
              <h3 className="text-lg font-medium text-slate-900">Security Settings</h3>
            </div>
          </div>

          <div className="p-6">
            <TwoFactorSettings 
              isEnabled={is2FAEnabled}
              onStatusChange={setIs2FAEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

