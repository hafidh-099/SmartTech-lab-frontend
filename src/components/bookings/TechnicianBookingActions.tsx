import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  useApproveBooking,
  useCompleteBooking,
  useRejectBooking,
} from '@/hooks/bookings/use-bookings'
import type { Booking } from '@/hooks/queries/use-bookings'

type Action = 'approve' | 'reject' | 'complete'

interface TechnicianBookingActionsProps {
  booking: Booking
  onActionSuccess?: () => void
  compact?: boolean
}

export function TechnicianBookingActions({
  booking,
  onActionSuccess,
  compact = false,
}: TechnicianBookingActionsProps) {
  const [action, setAction] = useState<Action | null>(null)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [deductInventory, setDeductInventory] = useState(true)
  const approve = useApproveBooking()
  const reject = useRejectBooking()
  const complete = useCompleteBooking()
  const isPending =
    approve.isPending || reject.isPending || complete.isPending

  function close() {
    setAction(null)
    setNote('')
    setReason('')
    setDeductInventory(true)
  }

  function submit() {
    const callbacks = { onSuccess: () => { close(); onActionSuccess?.() } }
    if (action === 'approve') {
      approve.mutate({ id: booking.id, ...(note.trim() ? { note: note.trim() } : {}) }, callbacks)
    } else if (action === 'reject') {
      reject.mutate({ id: booking.id, reason: reason.trim() }, callbacks)
    } else if (action === 'complete') {
      complete.mutate({ id: booking.id, deductInventory }, callbacks)
    }
  }

  return (
    <>
      {booking.status === 'pending' && (
        <>
          <Button
            size={compact ? 'sm' : 'default'}
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => setAction('approve')}
          >
            Approve
          </Button>
          <Button
            size={compact ? 'sm' : 'default'}
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setAction('reject')}
          >
            Reject
          </Button>
        </>
      )}
      {booking.status === 'approved' && (
        <Button
          size={compact ? 'sm' : 'default'}
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setAction('complete')}
        >
          Complete
        </Button>
      )}
      <Dialog open={Boolean(action)} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve'
                ? 'Approve booking'
                : action === 'reject'
                  ? 'Reject booking'
                  : 'Complete booking'}
            </DialogTitle>
            <DialogDescription>
              {booking.title} · {booking.teacher?.fullName}
            </DialogDescription>
          </DialogHeader>
          {action === 'approve' && (
            <div className="space-y-2">
              <Label htmlFor={`approve-note-${booking.id}`}>
                Note (optional)
              </Label>
              <Input
                id={`approve-note-${booking.id}`}
                value={note}
                maxLength={255}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a note for the teacher"
              />
            </div>
          )}
          {action === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor={`reject-reason-${booking.id}`}>
                Reason (required)
              </Label>
              <Textarea
                id={`reject-reason-${booking.id}`}
                value={reason}
                minLength={5}
                maxLength={1000}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why this booking is rejected"
              />
              {reason.trim().length > 0 && reason.trim().length < 5 && (
                <p className="text-xs text-destructive">
                  Enter at least 5 characters.
                </p>
              )}
            </div>
          )}
          {action === 'complete' && (
            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <Label htmlFor={`deduct-inventory-${booking.id}`}>
                Deduct inventory automatically?
              </Label>
              <Switch
                id={`deduct-inventory-${booking.id}`}
                checked={deductInventory}
                onCheckedChange={setDeductInventory}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={
                isPending ||
                (action === 'reject' && reason.trim().length < 5)
              }
            >
              {isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
