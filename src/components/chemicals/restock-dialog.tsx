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
import { FormField } from '@/components/shared/form-field'
import { useRestockChemical, type Chemical } from '@/hooks/queries/use-chemicals'

const restockSchema = z.object({
  quantity: z
    .number()
    .positive('Quantity must be greater than zero')
    .max(999_999_999.999),
  reason: z
    .string()
    .trim()
    .min(1, 'Reason is required')
    .max(255, 'Reason must not exceed 255 characters'),
})

type RestockValues = z.infer<typeof restockSchema>

interface RestockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chemical: Chemical
}

export function RestockDialog({
  open,
  onOpenChange,
  chemical,
}: RestockDialogProps) {
  const mutation = useRestockChemical(chemical.id)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RestockValues>({
    resolver: zodResolver(restockSchema),
    defaultValues: { quantity: 0, reason: 'Supplier delivery' },
  })

  useEffect(() => {
    if (open) reset({ quantity: 0, reason: 'Supplier delivery' })
  }, [open, reset])

  function onSubmit(values: RestockValues) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restock {chemical.name}</DialogTitle>
          <DialogDescription>
            Add incoming stock and record the reason.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            Current quantity:{' '}
            <span className="font-medium">
              {Number(chemical.currentQuantity)} {chemical.unit}
            </span>
          </p>
          <FormField
            id="restock-quantity"
            label={`Quantity to add (${chemical.unit})`}
            type="number"
            inputMode="decimal"
            min="0.001"
            step="0.001"
            error={errors.quantity?.message}
            registration={register('quantity', { valueAsNumber: true })}
          />
          <FormField
            id="restock-reason"
            label="Reason"
            maxLength={255}
            error={errors.reason?.message}
            registration={register('reason')}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding…' : 'Add stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
