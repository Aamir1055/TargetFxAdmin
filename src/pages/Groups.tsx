import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { groupService } from '../services/groupService'
import { Group, CreateGroupData, UpdateGroupData, GroupFilters } from '../types'
import GroupTable from '../components/GroupTable'
import GroupModal from '../components/GroupModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import toast from 'react-hot-toast'
import PageHeaderShell from '../components/layout/PageHeaderShell'

import { PermissionGate } from '../components/PermissionGate'
import { MODULES } from '../utils/permissions'

const Groups: React.FC = () => {
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState<GroupFilters>({})
  const [viewMode] = useState<'table' | 'grid'>('table')
  // const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    groupId: number | null
    groupName: string
  }>({
    isOpen: false,
    groupId: null,
    groupName: ''
  })

  const queryClient = useQueryClient()

  // Fetch groups with filters
  const { data: groupsData, isLoading, error, refetch } = useQuery(
    ['groups', currentPage, pageSize, debouncedSearchTerm, filters],
    () => {
      // For "All" option or large numbers, fetch a large batch
      const fetchSize = pageSize > 100 ? 1000 : pageSize
      return groupService.getGroups(currentPage, fetchSize, { 
        ...filters, 
        search: debouncedSearchTerm || undefined 
      })
    },
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  )

  // Create group mutation
  const createGroupMutation = useMutation(
    (data: CreateGroupData) => groupService.createGroup(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups'])
        toast.success('Group created successfully!')
        setIsModalOpen(false)
        setSelectedGroup(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create group')
      }
    }
  )

  // Update group mutation
  const updateGroupMutation = useMutation(
    ({ id, data }: { id: number; data: UpdateGroupData }) => 
      groupService.updateGroup(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups'])
        toast.success('Group updated successfully!')
        setIsModalOpen(false)
        setSelectedGroup(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update group')
      }
    }
  )

  // Delete group mutation
  const deleteGroupMutation = useMutation(
    (id: number) => groupService.deleteGroup(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups'])
        toast.success('Group deleted successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete group')
      }
    }
  )

  // Toggle status mutation
  const toggleStatusMutation = useMutation(
    (id: number) => groupService.toggleGroupStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups'])
        toast.success('Group status updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update group status')
      }
    }
  )

  // Handle search with debounce
  useEffect(() => {
    if (searchTerm === '') {
      setDebouncedSearchTerm('')
      return
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm])

  const handleCreateGroup = () => {
    setSelectedGroup(null)
    setIsModalOpen(true)
  }

  const handleRefresh = async () => {
    await refetch()
    toast.success('Groups list refreshed!')
  }

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group)
    setIsModalOpen(true)
  }

  const handleDeleteGroup = (id: number) => {
    const group = groupsData?.groups?.find((g: Group) => g.id === id)
    setDeleteConfirmation({
      isOpen: true,
      groupId: id,
      groupName: group?.broker_view_group || 'Unknown Group'
    })
  }

  const confirmDelete = () => {
    if (deleteConfirmation.groupId) {
      deleteGroupMutation.mutate(deleteConfirmation.groupId)
      setDeleteConfirmation({ isOpen: false, groupId: null, groupName: '' })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, groupId: null, groupName: '' })
  }

  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id)
  }

  const handleSubmit = (data: CreateGroupData | UpdateGroupData) => {
    if (selectedGroup) {
      updateGroupMutation.mutate({ id: selectedGroup.id, data })
    } else {
      createGroupMutation.mutate(data as CreateGroupData)
    }
  }

  const _handleFilterChange = (newFilters: GroupFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const _clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setCurrentPage(1)
  }

  const groups = groupsData?.groups || []
  const pagination = groupsData?.pagination

  // Use fixed pagination options: 10, 25, 50
  const paginationOptions = [10, 25, 50]
    
  // ...existing code...

  // Reset to page 1 when pageSize changes
  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      false 
        ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900' 
        : 'bg-gradient-to-br from-white via-blue-50/30 to-white'
    }`}>
      {/* Compact Header with Glass Effect */}
      <PageHeaderShell>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className={`text-lg font-bold transition-colors duration-300 ${
                    false 
                      ? 'bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent'
                  }`}>
                    Groups
                  </h1>
                  <p className={`text-xs font-medium transition-colors duration-300 ${
                    false ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Manage trading groups
                  </p>
                </div>
              </div>
              
              <div />
            </div>
      </PageHeaderShell>

      {/* Main Content */}
      <main className="px-2 pt-3 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 mb-2">Failed to load groups</div>
              <button
                onClick={() => queryClient.invalidateQueries(['groups'])}
                className="text-red-600 hover:text-red-700 underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <GroupTable
              groups={groups}
              isLoading={isLoading}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              onToggleStatus={handleToggleStatus}
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              viewMode={viewMode}
              topContent={
                <div className="flex flex-col gap-3">
                  {/* Row 1: search + actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px]">
                      <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm bg-white text-slate-900 placeholder-slate-400"
                      />
                      <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    </div>
                    <button
                      onClick={handleRefresh}
                      className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm font-semibold text-xs group hover:bg-white"
                      title="Refresh groups list"
                    >
                      <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                      <span>Refresh</span>
                    </button>
                    <PermissionGate module={MODULES.GROUPS} action="create">
                      <button
                        onClick={handleCreateGroup}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm font-semibold text-xs group hover:bg-white"
                      >
                        <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        <span>Create Group</span>
                      </button>
                    </PermissionGate>
                  </div>
                  {/* Row 2: show entries + page info + pagination */}
                  {!isLoading && pagination && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600">Show</span>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs bg-white text-slate-900"
                        >
                          {paginationOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <span className="text-xs text-slate-600">entries</span>
                      </div>
                      <div className="text-xs text-slate-700">
                        Showing {pagination.total === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} results
                      </div>
                      {pagination.total_pages > 1 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-2 py-1 border border-slate-300 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-xs text-slate-700">Page {currentPage} of {pagination.total_pages}</span>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                            disabled={currentPage === pagination.total_pages}
                            className="px-2 py-1 border border-slate-300 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              }
            />
          )}
        </motion.div>
      </main>

      {/* Modal */}
      <GroupModal
        group={selectedGroup}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedGroup(null)
        }}
        onSubmit={handleSubmit}
        isLoading={createGroupMutation.isLoading || updateGroupMutation.isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Group"
        message={`Are you sure you want to delete the group "${deleteConfirmation.groupName}"? This action cannot be undone and will remove all group members and associated data.`}
        confirmText="Delete Group"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteGroupMutation.isLoading}
      />
    </div>
  )
}

export default Groups

