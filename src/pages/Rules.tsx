import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { PlusIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ruleService } from '../services/ruleService'
import { Rule, CreateRuleData, UpdateRuleData } from '../types'
import RuleTable from '../components/RuleTable'
import RuleModal from '../components/RuleModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import toast from 'react-hot-toast'
import { PermissionGate } from '../components/PermissionGate'
import { MODULES } from '../utils/permissions'
import PageHeaderShell from '../components/layout/PageHeaderShell'

const Rules: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [ruleToDelete, setRuleToDelete] = useState<number | null>(null)
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const queryClient = useQueryClient()

  // Fetch rules
  const { data: rulesData, isLoading, refetch } = useQuery(
    ['rules', showActiveOnly],
    () => ruleService.getRules(showActiveOnly),
    {
      onError: (error: any) => {
        if (error.response?.status === 403) {
          setAccessDenied(true)
        } else {
          toast.error(error.response?.data?.message || 'Failed to fetch rules')
        }
      },
    }
  )

  // Create rule mutation
  const createRuleMutation = useMutation(
    (data: CreateRuleData) => ruleService.createRule(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rules')
        setIsModalOpen(false)
        setSelectedRule(null)
        setApiError(null)
        toast.success('Rule created successfully')
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create rule'
        setApiError(errorMessage)
        // Still show toast for general notification
        toast.error(errorMessage)
      },
    }
  )

  // Update rule mutation
  const updateRuleMutation = useMutation(
    ({ id, data }: { id: number; data: UpdateRuleData }) => ruleService.updateRule(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rules')
        setIsModalOpen(false)
        setSelectedRule(null)
        setApiError(null)
        toast.success('Rule updated successfully')
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update rule'
        setApiError(errorMessage)
        toast.error(errorMessage)
      },
    }
  )

  // Delete rule mutation
  const deleteRuleMutation = useMutation(
    (id: number) => ruleService.deleteRule(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rules')
        setRuleToDelete(null)
        toast.success('Rule deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete rule')
      },
    }
  )

  // Toggle status mutation
  const toggleStatusMutation = useMutation(
    (rule: Rule) => ruleService.toggleRuleStatus(rule),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rules')
        toast.success('Rule status updated')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update rule status')
      },
    }
  )

  const handleCreateRule = () => {
    setSelectedRule(null)
    setApiError(null)
    setIsModalOpen(true)
  }

  const handleEditRule = (rule: Rule) => {
    setSelectedRule(rule)
    setApiError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRule(null)
    setApiError(null)
  }

  const handleDeleteRule = (id: number) => {
    setRuleToDelete(id)
  }

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteRuleMutation.mutate(ruleToDelete)
    }
  }

  const handleToggleStatus = (rule: Rule) => {
    toggleStatusMutation.mutate(rule)
  }

  const handleSubmit = (data: CreateRuleData | UpdateRuleData) => {
    if (selectedRule) {
      updateRuleMutation.mutate({ id: selectedRule.id, data })
    } else {
      createRuleMutation.mutate(data as CreateRuleData)
    }
  }

  const handleRefresh = () => {
    refetch()
    toast.success('Rules refreshed')
  }

  const allRules = rulesData?.rules || []
  const totalCount = rulesData?.count || 0
  const filteredRules = searchTerm.trim()
    ? allRules.filter((r: Rule) =>
        r.rule_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allRules
  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const rules = filteredRules.slice((safePage - 1) * pageSize, safePage * pageSize)

  // Access Denied UI
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-4 flex justify-center">
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            You don't have permission to access rule definitions.
            <br />
            This module requires the <span className="font-semibold text-slate-900">rules.view</span> permission.
            <br />
            Please contact your administrator to request access.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <PageHeaderShell>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">Rule Definitions</h1>
                  <p className="text-xs font-medium text-slate-500">
                    Manage trading rules and MT5 configurations ({totalCount} rules)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                <label className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer transition-colors whitespace-nowrap shadow-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={showActiveOnly}
                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30"
                  />
                  <span>Active Only</span>
                </label>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm text-sm group hover:bg-slate-50 disabled:opacity-50"
                >
                  <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span>Refresh</span>
                </button>
                <PermissionGate module={MODULES.RULES} action="create">
                  <button
                    onClick={handleCreateRule}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm font-semibold text-sm group"
                  >
                    <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Create Rule</span>
                  </button>
                </PermissionGate>
              </div>
            </div>
      </PageHeaderShell>

      {/* Main Content */}
      <main className="px-2 pt-3 pb-4">
        <RuleTable
          rules={rules}
          isLoading={isLoading}
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
          onToggleStatus={handleToggleStatus}
          topContent={
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search by rule name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 text-sm bg-white text-slate-900 placeholder-slate-400"
                />
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-600">Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white text-xs text-slate-900"
                  >
                    {[10, 25, 50, 100].map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-600">entries</span>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                      disabled={safePage === 1}
                      className="px-2 py-1 border border-slate-300 rounded-md hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-xs text-slate-700">Page {safePage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                      disabled={safePage === totalPages}
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
          }
        />
      </main>

      {/* Modals */}
      <RuleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        rule={selectedRule}
        isLoading={createRuleMutation.isLoading || updateRuleMutation.isLoading}
        apiError={apiError}
      />

      <ConfirmationDialog
        isOpen={ruleToDelete !== null}
        onClose={() => setRuleToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Rule"
        message="Are you sure you want to delete this rule? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteRuleMutation.isLoading}
      />
    </div>
  )
}

export default Rules

