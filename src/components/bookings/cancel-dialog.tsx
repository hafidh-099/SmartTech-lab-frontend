import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Booking } from '@/hooks/queries/use-bookings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const cancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Reason must be at least 5 characters.')
    .max(1000, 'Reason must not exceed 1000 characters.'),
})

type CancelValues = z.infer<typeof cancelSchema>

interface CancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking
  onConfirm: (reason: string) => void
  isPending?: boolean
}

export function CancelDialog({
  open,
  onOpenChange,
  booking,
  onConfirm,
  isPending = false,
}: CancelDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: '' },
  })

  useEffect(() => {
    if (open) reset({ reason: '' })
  }, [open, reset])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel booking?</DialogTitle>
          <DialogDescription>
            Cancel “{booking.title}”. Please provide a reason.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(({ reason }) => onConfirm(reason))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor={`cancel-reason-${booking.id}`}>Reason</Label>
            <Textarea
              id={`cancel-reason-${booking.id}`}
              maxLength={1000}
              aria-invalid={Boolean(errors.reason)}
              {...register('reason')}
            />
            {errors.reason?.message && (
              <p className="text-sm text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Keep booking
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? 'Cancelling…' : 'Cancel booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
