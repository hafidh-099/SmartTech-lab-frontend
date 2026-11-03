import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { useWaiveBreakage, type Breakage } from '@/hooks/queries/use-breakages'
import { formatTzs } from '@/lib/breakages'

const waiveSchema = z.object({
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters.'),
})

type WaiveValues = z.infer<typeof waiveSchema>

interface WaiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  breakage: Breakage | null
}

export function WaiveDialog({
  open,
  onOpenChange,
  breakage,
}: WaiveDialogProps) {
  const mutation = useWaiveBreakage(breakage?.id ?? '')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WaiveValues>({
    resolver: zodResolver(waiveSchema),
    defaultValues: { reason: '' },
  })

  useEffect(() => {
    if (open) reset({ reason: '' })
  }, [open, reset])

  if (!breakage) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Waive penalty</DialogTitle>
          <DialogDescription>
            This will waive the unpaid balance of {formatTzs(
              Math.max(
                0,
                Number(breakage.penaltyAmount) -
                  Number(breakage.penaltyPaidAmount),
              ),
            )}{' '}
            for {breakage.studentName}.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(({ reason }) =>
            mutation.mutate(reason, {
              onSuccess: () => onOpenChange(false),
            }),
          )}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="waiver-reason">Waiver reason</Label>
            <Textarea
              id="waiver-reason"
              rows={4}
              placeholder="Provide a clear reason for audit trail."
              {...register('reason')}
            />
            <p className="text-xs text-muted-foreground">
              Provide a clear reason for audit trail.
            </p>
            {errors.reason && (
              <p className="text-sm text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Waiving…' : 'Waive penalty'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
