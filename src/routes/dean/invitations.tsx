import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { differenceInCalendarDays, format } from 'date-fns'
import {
  Clipboard,
  Mail,
  MessageCircle,
  Plus,
  Send,
  Smartphone,
  Ticket,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { RoleBadge } from '@/components/shared/role-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { isApiError } from '@/types/api'

const PAGE_SIZE = 20
type InvitationStatus = 'active' | 'revoked' | 'expired'
type InvitationRole = 'technician' | 'teacher'
type DeliveryChannel = 'email' | 'sms' | 'whatsapp'

interface Invitation {
  id: string
  code: string
  role: InvitationRole
  status: InvitationStatus
  expiresAt: string
  maxUses: number
  usedCount: number
  createdAt: string
  recipientName: string | null
  recipientEmail: string | null
  recipientPhone: string | null
  sentVia: DeliveryChannel | null
  createdBy?: { id: string; fullName: string } | null
}

interface PaginatedInvitations {
  data: Invitation[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface CreateInvitationBody {
  role: InvitationRole
  expiresInDays: number
  maxUses: number
}

interface SendInvitationBody {
  channel: DeliveryChannel
  recipient: string
  recipientName?: string
}

interface CreateFlowResult {
  invitation: Invitation
  channel: DeliveryChannel
  sent: boolean
  sendError?: unknown
}

function errorMessage(error: unknown, fallback: string) {
  return isApiError(error) ? error.message : fallback
}

async function copyCode(code: string, notify = true) {
  try {
    await navigator.clipboard.writeText(code)
    if (notify) toast.success('Code copied to clipboard')
  } catch {
    toast.error('Could not copy the code to your clipboard')
  }
}

function channelName(channel: DeliveryChannel) {
  switch (channel) {
    case 'email':
      return 'Email'
    case 'sms':
      return 'SMS'
    case 'whatsapp':
      return 'WhatsApp'
  }
}

export default function DeanInvitations() {
  const queryClient = useQueryClient()
  const [today] = useState(() => new Date())
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Invitation | null>(null)
  const [sendTarget, setSendTarget] = useState<{
    invitation: Invitation
    channel: DeliveryChannel
  } | null>(null)
  const [role, setRole] = useState<InvitationRole>('technician')
  const [channel, setChannel] = useState<DeliveryChannel>('email')
  const [recipientName, setRecipientName] = useState('')
  const [recipient, setRecipient] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('7')
  const [maxUses, setMaxUses] = useState('1')
  const [sendRecipientName, setSendRecipientName] = useState('')
  const [sendRecipient, setSendRecipient] = useState('')

  const invitationsQuery = useQuery({
    queryKey: ['invitations', { page, status }],
    queryFn: async () => {
      const response = await api.get<PaginatedInvitations>('/invitations', {
        params: {
          page,
          limit: PAGE_SIZE,
          ...(status ? { status } : {}),
        },
      })
      return response.data
    },
  })

  useEffect(() => {
    if (invitationsQuery.isError) {
      toast.error(
        errorMessage(invitationsQuery.error, 'Could not load invitations'),
      )
    }
  }, [invitationsQuery.isError, invitationsQuery.error])

  const createMutation = useMutation({
    mutationFn: async ({
      body,
      send,
      recipientData,
    }: {
      body: CreateInvitationBody
      send: boolean
      recipientData: SendInvitationBody
    }): Promise<CreateFlowResult> => {
      const response = await api.post<Invitation>('/invitations', body)
      const invitation = response.data
      if (!send) {
        return { invitation, channel: recipientData.channel, sent: false }
      }

      try {
        await api.post(`/invitations/${invitation.id}/send`, recipientData)
        return { invitation, channel: recipientData.channel, sent: true }
      } catch (sendError: unknown) {
        return {
          invitation,
          channel: recipientData.channel,
          sent: false,
          sendError,
        }
      }
    },
    onSuccess: (result) => {
      setDialogOpen(false)
      setPage(1)
      setRole('technician')
      setChannel('email')
      setRecipientName('')
      setRecipient('')
      setExpiresInDays('7')
      setMaxUses('1')
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })

      if (result.sent) {
        toast.success(`Invitation created and sent via ${channelName(result.channel)}`)
        return
      }
      if (result.sendError) {
        if (
          result.channel === 'sms' &&
          isApiError(result.sendError) &&
          result.sendError.code === 'CHANNEL_NOT_CONFIGURED'
        ) {
          toast.warning(
            'SMS is not yet configured. Invitation saved — you can share the code manually.',
          )
          void copyCode(result.invitation.code, false)
          return
        }
        toast.error(
          `Invitation saved, but sending failed: ${errorMessage(result.sendError, 'Could not send invitation')}`,
        )
        void copyCode(result.invitation.code, false)
        return
      }
      toast.success('Invitation created')
      void copyCode(result.invitation.code)
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Could not create invitation'))
    },
  })

  const sendMutation = useMutation({
    mutationFn: async ({
      invitationId,
      body,
    }: {
      invitationId: string
      body: SendInvitationBody
    }) => api.post(`/invitations/${invitationId}/send`, body),
    onSuccess: (_response, variables) => {
      toast.success(`Invitation sent via ${channelName(variables.body.channel)}`)
      setSendTarget(null)
      setSendRecipient('')
      setSendRecipientName('')
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Could not send invitation'))
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (invitationId: string) =>
      api.patch(`/invitations/${invitationId}/revoke`),
    onSuccess: () => {
      toast.success('Invitation revoked')
      setRevokeTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Could not revoke invitation'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (invitationId: string) =>
      api.delete(`/invitations/${invitationId}`),
    onSuccess: () => {
      toast.success('Invitation deleted')
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(error, 'Could not delete invitation'))
    },
  })

  function getCreateBody(): CreateInvitationBody | null {
    const parsedExpiresInDays = Number(expiresInDays)
    const parsedMaxUses = Number(maxUses)
    if (
      !Number.isInteger(parsedExpiresInDays) ||
      parsedExpiresInDays < 1 ||
      parsedExpiresInDays > 30 ||
      !Number.isInteger(parsedMaxUses) ||
      parsedMaxUses < 1 ||
      parsedMaxUses > 10
    ) {
      toast.error('Enter valid limits: 1–30 days and 1–10 uses')
      return null
    }
    return {
      role,
      expiresInDays: parsedExpiresInDays,
      maxUses: parsedMaxUses,
    }
  }

  function getSendBody(
    selectedChannel: DeliveryChannel,
    selectedRecipient: string,
    selectedName: string,
  ): SendInvitationBody | null {
    const address = selectedRecipient.trim()
    if (!address) {
      toast.error(
        selectedChannel === 'email'
          ? 'Enter an email address'
          : 'Enter a phone number',
      )
      return null
    }
    if (
      selectedChannel === 'email' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)
    ) {
      toast.error('Enter a valid email address')
      return null
    }
    if (
      selectedChannel !== 'email' &&
      !/^\+[1-9]\d{1,14}$/.test(address)
    ) {
      toast.error('Enter a valid E.164 phone number, such as +255712345678')
      return null
    }
    return {
      channel: selectedChannel,
      recipient: address,
      ...(selectedName.trim() ? { recipientName: selectedName.trim() } : {}),
    }
  }

  function submitCreate(send: boolean) {
    const body = getCreateBody()
    if (!body) return
    const recipientData = send
      ? getSendBody(channel, recipient, recipientName)
      : { channel, recipient: recipient.trim() }
    if (!recipientData) return
    createMutation.mutate({ body, send, recipientData })
  }

  function submitExistingSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sendTarget) return
    const body = getSendBody(
      sendTarget.channel,
      sendRecipient,
      sendRecipientName,
    )
    if (!body) return
    sendMutation.mutate({ invitationId: sendTarget.invitation.id, body })
  }

  function openSendDialog(invitation: Invitation, selectedChannel: DeliveryChannel) {
    setSendRecipient(
      selectedChannel === 'email'
        ? invitation.recipientEmail ?? ''
        : invitation.recipientPhone ?? '',
    )
    setSendRecipientName(invitation.recipientName ?? '')
    setSendTarget({ invitation, channel: selectedChannel })
  }

  const invitations = invitationsQuery.data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations"
        description="Invite teachers and technicians to join your school."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden="true" />
            Create Invitation
          </Button>
        }
      />

      <div className="flex justify-end">
        <Select
          value={status || 'all'}
          onValueChange={(value) => {
            setStatus(value === 'all' ? '' : value)
            setPage(1)
          }}
        >
          <SelectTrigger
            className="w-full sm:w-48"
            aria-label="Filter invitations by status"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {invitationsQuery.isError && !invitationsQuery.data ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          <p className="font-medium">Could not load invitations</p>
          <p className="mt-1 text-muted-foreground">
            {errorMessage(invitationsQuery.error, 'Please try again.')}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void invitationsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : invitationsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={`invitation-skeleton-${index}`}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-8 w-full" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : invitations.length === 0 ? (
        <EmptyState
          title="No invitations found"
          description="Create an invitation to let a teacher or technician join your school."
          icon={Ticket}
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <UserPlus aria-hidden="true" />
              Create Invitation
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {invitationsQuery.isError && (
            <div
              className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              Could not refresh invitations:{' '}
              {errorMessage(invitationsQuery.error, 'Please try again.')}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {invitations.map((invitation) => {
              const muted =
                invitation.status === 'expired' ||
                invitation.status === 'revoked'
              const remainingDays = Number.isNaN(
                Date.parse(invitation.expiresAt),
              )
                ? 0
                : Math.max(
                    0,
                    differenceInCalendarDays(
                      new Date(invitation.expiresAt),
                      today,
                    ),
                  )
              const recipientAddress =
                invitation.recipientEmail ?? invitation.recipientPhone
              const recipientDescription = recipientAddress
                ? `Sent to ${invitation.recipientName ? `${invitation.recipientName} (${recipientAddress})` : recipientAddress} via ${invitation.sentVia ?? 'unknown'}`
                : null
              const createdDate = Number.isNaN(
                Date.parse(invitation.createdAt),
              )
                ? null
                : format(new Date(invitation.createdAt), 'PP')

              return (
                <Card
                  key={invitation.id}
                  className={muted ? 'opacity-60' : undefined}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <RoleBadge role={invitation.role} />
                      <StatusBadge status={invitation.status} />
                    </div>
                    <CardTitle className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-2xl tracking-widest">
                      <span className="select-all break-all">
                        {invitation.code}
                      </span>
                    </CardTitle>
                    {recipientDescription && (
                      <CardDescription className="break-words">
                        {recipientDescription}
                      </CardDescription>
                    )}
                    {createdDate && (
                      <CardDescription>Created {createdDate}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1 text-sm">
                      <p>
                        Used {invitation.usedCount} / {invitation.maxUses}
                        {' · '}
                        {invitation.status === 'expired'
                          ? 'Expired'
                          : `Expires in ${remainingDays} day${remainingDays === 1 ? '' : 's'}`}
                      </p>
                      <p className="text-muted-foreground">
                        Created by {invitation.createdBy?.fullName ?? 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Copy invitation code"
                        title="Copy code"
                        onClick={() => void copyCode(invitation.code)}
                      >
                        <Clipboard aria-hidden="true" />
                      </Button>
                      {invitation.status === 'active' && (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Send aria-hidden="true" />
                                Send via
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>
                                Delivery method
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={() =>
                                  openSendDialog(invitation, 'email')
                                }
                              >
                                <Mail aria-hidden="true" />
                                Email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  openSendDialog(invitation, 'whatsapp')
                                }
                              >
                                <MessageCircle aria-hidden="true" />
                                WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled
                                title="Coming soon"
                              >
                                <Smartphone aria-hidden="true" />
                                SMS — Coming soon
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Revoke invitation"
                            title="Revoke"
                            onClick={() => setRevokeTarget(invitation)}
                          >
                            <XCircle
                              className="text-destructive"
                              aria-hidden="true"
                            />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete invitation"
                        title="Delete"
                        onClick={() => setDeleteTarget(invitation)}
                      >
                        <Trash2
                          className="text-destructive"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <Pagination
            page={page}
            totalPages={invitationsQuery.data?.meta.totalPages ?? 0}
            onPageChange={setPage}
          />
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!createMutation.isPending) setDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invitation</DialogTitle>
            <DialogDescription>
              Create a code and optionally deliver it to a new school member.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submitCreate(true)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="invitation-role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value === 'teacher' ? 'teacher' : 'technician')
                }
              >
                <SelectTrigger id="invitation-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-channel">Delivery method</Label>
              <Select
                value={channel}
                onValueChange={(value) =>
                  {
                    setChannel(
                      value === 'sms' || value === 'whatsapp'
                        ? value
                        : 'email',
                    )
                    setRecipient('')
                  }
                }
              >
                <SelectTrigger id="delivery-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">Phone (WhatsApp)</SelectItem>
                  <SelectItem value="sms">Phone (SMS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient-name">Recipient name (optional)</Label>
              <Input
                id="recipient-name"
                maxLength={255}
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-recipient">
                {channel === 'email' ? 'Email address' : 'Phone number'}
              </Label>
              <Input
                id="create-recipient"
                type={channel === 'email' ? 'email' : 'tel'}
                autoComplete={channel === 'email' ? 'email' : 'tel'}
                placeholder={
                  channel === 'email'
                    ? 'name@example.com'
                    : '+255712345678'
                }
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expires-in-days">Expires in days</Label>
                <Input
                  id="expires-in-days"
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  required
                  value={expiresInDays}
                  onChange={(event) =>
                    setExpiresInDays(event.currentTarget.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-uses">Max uses</Label>
                <Input
                  id="max-uses"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  required
                  value={maxUses}
                  onChange={(event) => setMaxUses(event.currentTarget.value)}
                />
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => submitCreate(false)}
                disabled={createMutation.isPending}
              >
                Create only
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create & Send'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(sendTarget)}
        onOpenChange={(open) => {
          if (!sendMutation.isPending && !open) {
            setSendTarget(null)
            setSendRecipient('')
            setSendRecipientName('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send invitation via {sendTarget && channelName(sendTarget.channel)}
            </DialogTitle>
            <DialogDescription>
              The invitation code will be included in the message.
            </DialogDescription>
          </DialogHeader>
          {sendTarget && (
            <form onSubmit={submitExistingSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="send-recipient-name">
                  Recipient name (optional)
                </Label>
                <Input
                  id="send-recipient-name"
                  maxLength={255}
                  value={sendRecipientName}
                  onChange={(event) =>
                    setSendRecipientName(event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="send-recipient">
                  {sendTarget.channel === 'email'
                    ? 'Email address'
                    : 'Phone number'}
                </Label>
                <Input
                  id="send-recipient"
                  type={sendTarget.channel === 'email' ? 'email' : 'tel'}
                  autoComplete={
                    sendTarget.channel === 'email' ? 'email' : 'tel'
                  }
                  placeholder={
                    sendTarget.channel === 'email'
                      ? 'name@example.com'
                      : '+255712345678'
                  }
                  value={sendRecipient}
                  onChange={(event) => setSendRecipient(event.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSendTarget(null)}
                  disabled={sendMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={sendMutation.isPending}>
                  <Send aria-hidden="true" />
                  {sendMutation.isPending ? 'Sending…' : 'Send invitation'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null)
        }}
        title="Revoke invitation?"
        description="This code will no longer work. Anyone with the link will not be able to sign up."
        confirmLabel="Revoke"
        variant="destructive"
        isPending={revokeMutation.isPending}
        onConfirm={() => {
          if (revokeTarget) revokeMutation.mutate(revokeTarget.id)
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete invitation?"
        description="This invitation will be permanently removed. Anyone with this code won't be able to use it."
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />
    </div>
  )
}
