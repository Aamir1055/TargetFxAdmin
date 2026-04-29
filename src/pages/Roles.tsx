import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { PlusIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { ShieldCheckIcon } from '@heroicons/react/24/solid'
import { roleService } from '../services/roleService'
import RoleTable from '../components/RoleTable'
import RoleModal from '../components/RoleModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { Role, CreateRoleData, UpdateRoleData } from '../types'
import toast from 'react-hot-toast'
import PageHeaderShell from '../components/layout/PageHeaderShell'

import { PermissionGate } from '../components/PermissionGate'
import { MODULES } from '../utils/permissions'

const Roles: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    roleId: number | null
    roleName: string
  }>({
    isOpen: false,
    roleId: null,
    roleName: ''
  })
  const queryClient = useQueryClient()

  // Fetch roles
  const { data: roles, isLoading, error, refetch } = useQuery(
    'roles',
    () => roleService.getRoles(true),
    {
      retry: false,
      onError: (err: any) => {
        // Silently handle 403 errors - we'll show UI message instead
        if (err?.response?.status === 403) {
          console.warn('Access denied to roles module')
        } else if (err?.response?.status === 401) {
          toast.error('Session expired. Please log in again.')
        }
      }
    }
  )

  // Fetch permissions for the form
  const { data: permissions } = useQuery('permissions', roleService.getPermissions)

  // Create role mutation
  const createRoleMutation = useMutation(
    (roleData: CreateRoleData) => roleService.createRole(roleData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['roles'])
        setIsModalOpen(false)
        toast.success('Role created successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create role')
      }
    }
  )

  // Update role mutation
  const updateRoleMutation = useMutation(
    ({ id, roleData }: { id: number; roleData: UpdateRoleData }) =>
      roleService.updateRole(id, roleData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['roles'])
        setIsModalOpen(false)
        setEditingRole(null)
        toast.success('Role updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update role')
      }
    }
  )

  // Delete role mutation
  const deleteRoleMutation = useMutation(
    (id: number) => roleService.deleteRole(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['roles'])
        toast.success('Role deleted successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete role')
      }
    }
  )

  const handleCreateRole = () => {
    setEditingRole(null)
    setIsModalOpen(true)
  }

  const handleRefresh = async () => {
    await queryClient.invalidateQueries(['roles'])
    await refetch()
    toast.success('Roles list refreshed!')
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setIsModalOpen(true)
  }

  const handleDeleteRole = (id: number) => {
    const role = roles?.find(r => r.id === id)
    setDeleteConfirmation({
      isOpen: true,
      roleId: id,
      roleName: role?.name || 'Unknown Role'
    })
  }

  const confirmDelete = () => {
    if (deleteConfirmation.roleId) {
      deleteRoleMutation.mutate(deleteConfirmation.roleId)
      setDeleteConfirmation({ isOpen: false, roleId: null, roleName: '' })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, roleId: null, roleName: '' })
  }

  const handleSubmit = (data: CreateRoleData | UpdateRoleData) => {
    console.log('Submitting role data:', data)
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, roleData: data as UpdateRoleData })
    } else {
      createRoleMutation.mutate(data as CreateRoleData)
    }
  }

  const filteredRoles = roles?.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Pagination calculations
  const totalItems = filteredRoles.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex)

  // Only allow 10, 25, 50 as pagination options
  const paginationOptions = [10, 25, 50]

  // Reset to page 1 when search or itemsPerPage changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, itemsPerPage])

  if (error) {
    const is403 = (error as any)?.response?.status === 403
    
    if (is403) {
      return (
        <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          false 
            ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900' 
            : 'bg-gradient-to-br from-white via-blue-50/30 to-white'
        }`}>
          <div className={`max-w-md w-full mx-4 p-8 rounded-xl border shadow-xl text-center ${
            false 
              ? 'bg-blue-800/80 border-blue-700' 
              : 'bg-white border-slate-300'
          }`}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className={`text-xl font-bold mb-2 ${false ? 'text-white' : 'text-slate-900'}`}>
              Access Denied
            </h2>
            <p className={`mb-6 ${false ? 'text-slate-300' : 'text-slate-600'}`}>
              You don't have permission to view roles. Please contact your administrator for access.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg transition-colors hover:bg-white"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
    
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading roles. Please check your API connection.</p>
      </div>
    )
  }

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
                    <ShieldCheckIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className={`text-lg font-bold transition-colors duration-300 ${
                    false 
                      ? 'bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent'
                  }`}>
                    Role Management
                  </h1>
                  <p className={`text-xs font-medium transition-colors duration-300 ${
                    false ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Manage roles and permissions efficiently
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                <button
                  onClick={handleRefresh}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm text-sm group hover:bg-slate-50"
                  title="Refresh roles list"
                >
                  <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span>Refresh</span>
                </button>
                <PermissionGate module={MODULES.ROLES} action="create">
                  <button
                    onClick={handleCreateRole}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm font-semibold text-sm group"
                  >
                    <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Create Role</span>
                  </button>
                </PermissionGate>
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
          <RoleTable
            roles={paginatedRoles}
            isLoading={isLoading}
            onEdit={handleEditRole}
            onDelete={handleDeleteRole}
            topContent={
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 text-sm bg-white text-slate-900 placeholder-slate-400"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-600">Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs bg-white text-slate-900"
                    >
                      {paginationOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <span className="text-xs text-slate-600">entries</span>
                  </div>
                  {totalPages > 1 && (
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
                      <span className="text-xs text-slate-700">Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 border border-slate-300 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
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
        </motion.div>
      </main>

      {/* Role Modal */}
      {isModalOpen && (
        <RoleModal
          role={editingRole}
          permissions={permissions || []}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingRole(null)
          }}
          onSubmit={handleSubmit}
          isLoading={createRoleMutation.isLoading || updateRoleMutation.isLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${deleteConfirmation.roleName}"? This action cannot be undone and will remove all associated permissions and user assignments.`}
        confirmText="Delete Role"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteRoleMutation.isLoading}
      />
    </div>
  )
}

export default Roles

