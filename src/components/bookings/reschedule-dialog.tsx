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
import { FormField } from '@/components/shared/form-field'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  dateTimeLocalInEAT,
  dateTimeLocalToISO,
  minBookingDateTime,
} from '@/lib/date'

const rescheduleSchema = z
  .object({
    startTime: z.string().min(1, 'New start time is required.'),
    endTime: z.string().min(1, 'New end time is required.'),
    note: z
      .string()
      .trim()
      .max(1000, 'Note must not exceed 1000 characters.')
      .refine((value) => !value || value.length >= 5, {
        message: 'If provided, note must be at least 5 characters.',
      }),
  })
  .superRefine((values, context) => {
    if (values.startTime && values.startTime < minBookingDateTime()) {
      context.addIssue({
        code: 'custom',
        path: ['startTime'],
        message: 'Start time must be at least 15 minutes from now.',
      })
    }
    if (
      values.startTime &&
      values.endTime &&
      values.endTime <= values.startTime
    ) {
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time must be after start time.',
      })
    }
  })

type RescheduleValues = z.infer<typeof rescheduleSchema>

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking
  onSubmit: (values: {
    startTime: string
    endTime: string
    note?: string
  }) => void
  isPending?: boolean
}

function currentBookingTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : dateTimeLocalInEAT(date)
}

export function RescheduleDialog({
  open,
  onOpenChange,
  booking,
  onSubmit,
  isPending = false,
}: RescheduleDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RescheduleValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      startTime: '',
      endTime: '',
      note: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        startTime:
          currentBookingTime(booking.proposedStartTime ?? booking.startTime) ||
          minBookingDateTime(),
        endTime:
          currentBookingTime(booking.proposedEndTime ?? booking.endTime) || '',
        note: '',
      })
    }
  }, [booking, open, reset])

  function submit(values: RescheduleValues) {
    onSubmit({
      startTime: dateTimeLocalToISO(values.startTime),
      endTime: dateTimeLocalToISO(values.endTime),
      note: values.note || undefined,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request reschedule</DialogTitle>
          <DialogDescription>
            Suggest a new time for “{booking.title}”. A technician must approve
            the request.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(submit)}
          className="space-y-4"
        >
          <FormField
            id={`reschedule-start-${booking.id}`}
            label="New start time"
            type="datetime-local"
            min={minBookingDateTime()}
            error={errors.startTime?.message}
            registration={register('startTime')}
          />
          <FormField
            id={`reschedule-end-${booking.id}`}
            label="New end time"
            type="datetime-local"
            min={minBookingDateTime()}
            error={errors.endTime?.message}
            registration={register('endTime')}
          />
          <div className="space-y-2">
            <Label htmlFor={`reschedule-note-${booking.id}`}>
              Note (optional)
            </Label>
            <Textarea
              id={`reschedule-note-${booking.id}`}
              maxLength={1000}
              {...register('note')}
            />
            {errors.note?.message && (
              <p className="text-sm text-destructive">
                {errors.note.message}
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
              Close
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Submitting…' : 'Request reschedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
