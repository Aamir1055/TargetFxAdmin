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
        <div className="mx-2 relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 ring-4 ring-white shadow-md flex items-center justify-center">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                      {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-white ${
                      currentUser?.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                    title={currentUser?.is_active ? 'Active' : 'Inactive'}
                  />
                </div>

                {/* Identity */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">
                    {currentUser?.username}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">{currentUser?.email}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    currentUser?.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${currentUser?.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {currentUser?.is_active ? 'Active' : 'Inactive'}
                </span>
                {currentUser?.roles?.map((role: string) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize"
                  >
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
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

