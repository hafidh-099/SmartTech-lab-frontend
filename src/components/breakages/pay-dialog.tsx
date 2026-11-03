import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormField } from '@/components/shared/form-field'
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
import { usePayBreakage, type Breakage } from '@/hooks/queries/use-breakages'
import { formatTzs } from '@/lib/breakages'

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  note: z.string().max(1000, 'Note is too long'),
})

type PaymentValues = z.infer<typeof paymentSchema>

interface PayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  breakage: Breakage | null
}

export function PayDialog({ open, onOpenChange, breakage }: PayDialogProps) {
  const mutation = usePayBreakage(breakage?.id ?? '')
  const balance = breakage
    ? Math.max(
        0,
        Number(breakage.penaltyAmount) - Number(breakage.penaltyPaidAmount),
      )
    : 0
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PaymentValues>({
    resolver: zodResolver(
      paymentSchema.refine((values) => values.amount <= balance, {
        path: ['amount'],
        message: 'Amount cannot exceed the remaining balance.',
      }),
    ),
    defaultValues: { amount: 0, note: '' },
  })

  useEffect(() => {
    if (open) reset({ amount: 0, note: '' })
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
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Record a payment against this breakage penalty.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Student:</span>{' '}
            {breakage.studentName} · {breakage.studentClass}
          </p>
          <p>
            <span className="text-muted-foreground">Item:</span>{' '}
            {breakage.itemName} · {breakage.quantity}
          </p>
          <p>
            <span className="text-muted-foreground">Total penalty:</span>{' '}
            {formatTzs(breakage.penaltyAmount)}
          </p>
          <p>
            <span className="text-muted-foreground">Already paid:</span>{' '}
            {formatTzs(breakage.penaltyPaidAmount)}
          </p>
          <p className="font-semibold text-destructive">
            Balance remaining: {formatTzs(balance)}
          </p>
        </div>
        <form
          onSubmit={handleSubmit(({ amount, note }) =>
            mutation.mutate(
              { amount, note: note || undefined },
              { onSuccess: () => onOpenChange(false) },
            ),
          )}
          className="space-y-4"
        >
          <FormField
            id="payment-amount"
            label="Amount to pay (TZS)"
            type="number"
            min={0.01}
            max={balance}
            step="0.01"
            error={errors.amount?.message}
            registration={register('amount', { valueAsNumber: true })}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={balance <= 0}
            onClick={() =>
              setValue('amount', balance, { shouldValidate: true })
            }
          >
            Pay full balance
          </Button>
          <div className="space-y-2">
            <Label htmlFor="payment-note">Note (optional)</Label>
            <Textarea id="payment-note" rows={3} {...register('note')} />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
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
            <Button type="submit" disabled={mutation.isPending || balance <= 0}>
              {mutation.isPending ? 'Saving…' : 'Record payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
