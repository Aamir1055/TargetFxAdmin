import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowDownTrayIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/solid'
import { auditLogService } from '../services/auditLogService'
import { AuditLogFilters } from '../types'
import AuditLogTable from '../components/AuditLogTable'
import PageHeaderShell from '../components/layout/PageHeaderShell'
import toast from 'react-hot-toast'

const AuditLogs: React.FC = () => {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 50,
    order: 'desc',
    sort: 'created_at'
  })
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [actionFilter, setActionFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [startDate, setStartDate] = useState('') // DD/MM/YYYY format for display
  const [endDate, setEndDate] = useState('') // DD/MM/YYYY format for display
  const [startDateValue, setStartDateValue] = useState('') // YYYY-MM-DD format for input
  const [endDateValue, setEndDateValue] = useState('') // YYYY-MM-DD format for input

  // Fetch audit logs (without search parameter since we filter client-side)
  const { data, isLoading, refetch } = useQuery(
    ['auditLogs', filters],
    () => {
      // Don't send search to API, we'll filter client-side
      const { search, ...apiFilters } = filters
      // For "All" option or large numbers, fetch a large batch
      const limit = (apiFilters.limit || 20) > 100 ? 1000 : apiFilters.limit
      return auditLogService.getAuditLogs({ ...apiFilters, limit })
    },
    {
      keepPreviousData: true,
      retry: 1,
    }
  )

  const allLogs = data?.logs || []
  const pagination = data?.pagination

  // Client-side search filtering
  const logs = React.useMemo(() => {
    if (!searchTerm.trim()) return allLogs

    const searchLower = searchTerm.toLowerCase().trim()
    return allLogs.filter(log => {
      // Search across multiple fields
      const searchableText = [
        log.username?.toLowerCase() || '',
        log.user_email?.toLowerCase() || '',
        log.action?.toLowerCase() || '',
        log.table_name?.toLowerCase() || '',
        log.ip_address?.toLowerCase() || '',
        log.record_id?.toString() || '',
        log.id?.toString() || '',
        JSON.stringify(log.new_values || {}).toLowerCase(),
        JSON.stringify(log.old_values || {}).toLowerCase(),
      ].join(' ')

      return searchableText.includes(searchLower)
    })
  }, [allLogs, searchTerm])

  // Use fixed pagination options: 10, 25, 50
  const paginationOptions = useMemo(() => [10, 25, 50], [])

  // No need for debounced search anymore since we're doing client-side filtering

  // Convert DD/MM/YYYY to ISO format for API
  const convertToISO = (dateStr: string): string | undefined => {
    if (!dateStr || dateStr.length !== 10) return undefined
    const [day, month, year] = dateStr.split('/')
    if (!day || !month || !year) return undefined
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`
  }

  // Convert YYYY-MM-DD to DD/MM/YYYY
  const formatToDisplay = (dateStr: string): string => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  // Handle date picker change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStartDateValue(value)
    setStartDate(formatToDisplay(value))
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEndDateValue(value)
    setEndDate(formatToDisplay(value))
  }

  // Apply filters
  const applyFilters = () => {
    setFilters({
      ...filters,
      page: 1,
      search: searchTerm || undefined,
      action: actionFilter || undefined,
      table_name: tableFilter || undefined,
      start_date: convertToISO(startDate),
      end_date: convertToISO(endDate),
    })
    setCurrentPage(1)
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('')
    setActionFilter('')
    setTableFilter('')
    setStartDate('')
    setEndDate('')
    setStartDateValue('')
    setEndDateValue('')
    setFilters({
      page: 1,
      limit: 20,
      order: 'desc',
      sort: 'created_at'
    })
    setCurrentPage(1)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setFilters({ ...filters, page })
  }

  const handleRefresh = async () => {
    await queryClient.invalidateQueries(['auditLogs'])
    await refetch()
    toast.success('Audit logs refreshed!')
  }

  // Handle sorting
  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortOrder(newOrder)
    setFilters({
      ...filters,
      sort: field,
      order: newOrder,
      page: 1
    })
    setCurrentPage(1)
  }

  // Export audit logs
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await auditLogService.exportAuditLogs({
        format,
        action: actionFilter || undefined,
        table_name: tableFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: searchTerm || undefined,
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Audit logs exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to export audit logs')
    }
  }

  // Common action types for filtering
  const actionTypes = [
    'LOGIN_SUCCESS',
    'LOGOUT',
    'BROKER_LOGIN',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'BROKER_CREATED',
    'BROKER_UPDATED',
    'BROKER_DELETED',
    'GROUP_CREATED',
    'GROUP_UPDATED',
    'GROUP_DELETED',
  ]

  // Common table names for filtering
  const tableNames = [
    'users',
    'brokers',
    'groups',
    'broker_profiles',
    'roles',
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      false 
        ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900' 
        : 'bg-gradient-to-br from-white via-blue-50/30 to-white'
    }`}>
      {/* Compact Header with Glass Effect */}
      <PageHeaderShell>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className={`text-lg font-bold transition-colors duration-300 ${
                    false 
                      ? 'bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent'
                  }`}>
                    Audit Logs
                  </h1>
                  <p className={`text-xs font-medium transition-colors duration-300 ${
                    'text-slate-500'
                  }`}>
                    Track all system activities and changes
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm font-medium text-sm group hover:bg-slate-50"
                >
                  <FunnelIcon className="w-4 h-4" />
                  <span>Filters</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('export-dropdown')
                      dropdown?.classList.toggle('hidden')
                    }}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm font-medium text-sm group hover:bg-slate-50"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <div
                    id="export-dropdown"
                    className="hidden absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-10 bg-white border-slate-300"
                  >
                    <button
                      onClick={() => handleExport('csv')}
                      className="block w-full text-left px-4 py-2 first:rounded-t-lg transition-colors hover:bg-slate-50 text-slate-900"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="block w-full text-left px-4 py-2 last:rounded-b-lg transition-colors hover:bg-slate-50 text-slate-900"
                    >
                      Export as JSON
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm font-medium text-sm group hover:bg-slate-50"
                  title="Refresh audit logs"
                >
                  <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
      </PageHeaderShell>

      {/* Main Content */}
      <main className="px-2 pt-3 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AuditLogTable 
            logs={logs} 
            isLoading={isLoading} 
            onSort={handleSort}
            currentSort={{ field: sortField, order: sortOrder }}
            topContent={
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 text-sm bg-white text-slate-900 placeholder-slate-400"
                    />
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600">Show</span>
                      <select
                        value={filters.limit}
                        onChange={(e) => {
                          setFilters({ ...filters, limit: Number(e.target.value), page: 1 })
                          setCurrentPage(1)
                        }}
                        className="px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white text-xs text-slate-900"
                      >
                        {paginationOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-600">entries</span>
                    </div>
                    {pagination && Math.ceil((pagination.total_items || 0) / (filters.limit || 50)) > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-2 py-1 border border-slate-300 rounded-md hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-xs text-slate-700">Page {currentPage} of {Math.ceil((pagination.total_items || 0) / (filters.limit || 50))}</span>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === Math.ceil((pagination.total_items || 0) / (filters.limit || 50))}
                          className="px-2 py-1 border border-slate-300 rounded-md hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border p-4 bg-white border-slate-300"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-700">Action</label>
                        <select
                          value={actionFilter}
                          onChange={(e) => setActionFilter(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-slate-400 bg-white border-slate-300 text-slate-900"
                        >
                          <option value="">All Actions</option>
                          {actionTypes.map((action) => (
                            <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-700">Table</label>
                        <select
                          value={tableFilter}
                          onChange={(e) => setTableFilter(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-slate-400 bg-white border-slate-300 text-slate-900"
                        >
                          <option value="">All Tables</option>
                          {tableNames.map((table) => (
                            <option key={table} value={table}>{table}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-700">Start Date (DD/MM/YYYY)</label>
                        <input
                          type="date"
                          value={startDateValue}
                          onChange={handleStartDateChange}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-slate-400 bg-white border-slate-300 text-slate-900"
                        />
                        {startDate && <p className="text-[10px] mt-0.5 text-slate-500">{startDate}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-700">End Date (DD/MM/YYYY)</label>
                        <input
                          type="date"
                          value={endDateValue}
                          onChange={handleEndDateChange}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-slate-400 bg-white border-slate-300 text-slate-900"
                        />
                        {endDate && <p className="text-[10px] mt-0.5 text-slate-500">{endDate}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={applyFilters}
                        className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                      >
                        Apply Filters
                      </button>
                      <button
                        onClick={resetFilters}
                        className="px-4 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            }
          />
        </motion.div>
      </main>
    </div>
  )
}

export default AuditLogs

