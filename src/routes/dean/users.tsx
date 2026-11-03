import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { MoreHorizontal, Search, Users as UsersIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { RoleBadge } from '@/components/shared/role-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebounce } from '@/hooks/use-debounce'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { isApiError } from '@/types/api'
import type { UserRole } from '@/types/user'

const PAGE_SIZE = 20
const USER_STATUSES = ['pending', 'active', 'inactive'] as const
type UserStatus = (typeof USER_STATUSES)[number]
type StaffRole = Extract<UserRole, 'technician' | 'teacher'>

interface SchoolUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  status: UserStatus
  lastLoginAt: string | null
}

interface PaginatedUsers {
  data: SchoolUser[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

function errorMessage(error: unknown, fallback: string) {
  return isApiError(error) ? error.message : fallback
}

export default function DeanUsers() {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [deactivateTarget, setDeactivateTarget] = useState<SchoolUser | null>(null)
  const [roleTarget, setRoleTarget] = useState<SchoolUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<StaffRole>('technician')
  const debouncedSearch = useDebounce(search)

  const usersQuery = useQuery({
    queryKey: ['users', { page, search: debouncedSearch, role, status }],
    queryFn: async () => {
      const response = await api.get<PaginatedUsers>('/users', {
        params: {
          page,
          limit: PAGE_SIZE,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(role ? { role } : {}),
          ...(status ? { status } : {}),
        },
      })
      return response.data
    },
  })

  useEffect(() => {
    if (usersQuery.isError) {
      toast.error(errorMessage(usersQuery.error, 'Could not load users'))
    }
  }, [usersQuery.isError, usersQuery.error])

  const statusMutation = useMutation({
    mutationFn: async ({
      userId,
      nextStatus,
    }: {
      userId: string
      nextStatus: 'active' | 'inactive'
    }) => api.patch(`/users/${userId}/status`, { status: nextStatus }),
    onSuccess: (_result, { nextStatus }) => {
      toast.success(nextStatus === 'active' ? 'User activated' : 'User deactivated')
      setDeactivateTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Could not update user status'))
    },
  })

  const roleMutation = useMutation({
    mutationFn: async ({
      userId,
      nextRole,
    }: {
      userId: string
      nextRole: StaffRole
    }) => api.patch(`/users/${userId}/role`, { role: nextRole }),
    onSuccess: () => {
      toast.success('User role updated')
      setRoleTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Could not update user role'))
    },
  })

  const users = (usersQuery.data?.data ?? []).filter(
    (user) => user.role !== 'super_admin',
  )

  const columns: Column<SchoolUser>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (user) => (
        <div className="min-w-40">
          <p className="font-medium">{user.fullName}</p>
        </div>
      ),
    },
    { key: 'email', header: 'Email', cell: (user) => user.email },
    {
      key: 'role',
      header: 'Role',
      cell: (user) => <RoleBadge role={user.role} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      cell: (user) =>
        user.lastLoginAt && !Number.isNaN(Date.parse(user.lastLoginAt))
          ? format(new Date(user.lastLoginAt), 'PP')
          : 'Never',
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (user) => {
        const isProtected =
          user.id === currentUserId ||
          user.role === 'dean' ||
          user.role === 'super_admin'

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Actions for ${user.fullName}`}
                disabled={isProtected}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user.status === 'active' ? (
                <DropdownMenuItem
                  onSelect={() => setDeactivateTarget(user)}
                  className="text-destructive focus:text-destructive"
                >
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() =>
                    statusMutation.mutate({
                      userId: user.id,
                      nextStatus: 'active',
                    })
                  }
                >
                  Activate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedRole(user.role === 'teacher' ? 'teacher' : 'technician')
                  setRoleTarget(user)
                }}
              >
                Change role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage school members" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search by name"
            aria-label="Search users by name"
            className="pl-9"
          />
        </div>
        <Select
          value={role || 'all'}
          onValueChange={(value) => {
            setRole(value === 'all' ? '' : value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by role">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="dean">Dean</SelectItem>
            <SelectItem value="technician">Technician</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status || 'all'}
          onValueChange={(value) => {
            setStatus(value === 'all' ? '' : value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {USER_STATUSES.map((userStatus) => (
              <SelectItem key={userStatus} value={userStatus}>
                {userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {usersQuery.isError && !usersQuery.data ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          <p className="font-medium">Could not load users</p>
          <p className="mt-1 text-muted-foreground">
            {errorMessage(usersQuery.error, 'Please try again.')}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void usersQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <DataTable
            data={users}
            columns={columns}
            isLoading={usersQuery.isLoading}
            emptyMessage="No users found"
            emptyIcon={UsersIcon}
          />
          {usersQuery.isError && usersQuery.data && (
            <div
              className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              Could not refresh users: {errorMessage(usersQuery.error, 'Please try again.')}
            </div>
          )}
          <Pagination
            page={page}
            totalPages={usersQuery.data?.meta.totalPages ?? 0}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null)
        }}
        title="Deactivate user?"
        description={`This will deactivate ${deactivateTarget?.fullName ?? 'this user'} and revoke their active sessions.`}
        confirmLabel="Deactivate"
        variant="destructive"
        isPending={statusMutation.isPending}
        onConfirm={() => {
          if (deactivateTarget) {
            statusMutation.mutate({
              userId: deactivateTarget.id,
              nextStatus: 'inactive',
            })
          }
        }}
      />

      <Dialog
        open={Boolean(roleTarget)}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change user role</DialogTitle>
            <DialogDescription>
              Choose a new role for {roleTarget?.fullName ?? 'this user'}.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={selectedRole}
            onValueChange={(value) =>
              setSelectedRole(value === 'teacher' ? 'teacher' : 'technician')
            }
          >
            <SelectTrigger aria-label="New user role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technician">Technician</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleTarget(null)}
              disabled={roleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (roleTarget) {
                  roleMutation.mutate({
                    userId: roleTarget.id,
                    nextRole: selectedRole,
                  })
                }
              }}
              disabled={
                !roleTarget ||
                roleTarget.role === selectedRole ||
                roleMutation.isPending
              }
            >
              {roleMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
