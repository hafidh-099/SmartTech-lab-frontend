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
import {
  useServiceEquipment,
  type Equipment,
} from '@/hooks/queries/use-equipment'
import { dateKeyInEAT } from '@/lib/equipment-dates'

const serviceSchema = z.object({
  servicedAt: z.string().min(1, 'Service date is required'),
  notes: z.string().trim().max(255, 'Notes must not exceed 255 characters'),
  nextServiceDate: z.string(),
})

type ServiceValues = z.infer<typeof serviceSchema>

interface ServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment: Equipment
}

export function ServiceDialog({
  open,
  onOpenChange,
  equipment,
}: ServiceDialogProps) {
  const mutation = useServiceEquipment(equipment.id)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { servicedAt: dateKeyInEAT(), notes: '', nextServiceDate: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        servicedAt: dateKeyInEAT(),
        notes: '',
        nextServiceDate: '',
      })
    }
  }, [open, reset])

  function onSubmit(values: ServiceValues) {
    mutation.mutate(
      {
        servicedAt: values.servicedAt,
        notes: values.notes || undefined,
        nextServiceDate: values.nextServiceDate || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    )
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
          <DialogTitle>Record service</DialogTitle>
          <DialogDescription>
            Record maintenance completed for {equipment.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            id="service-serviced-at"
            label="Serviced at"
            type="date"
            max={dateKeyInEAT()}
            error={errors.servicedAt?.message}
            registration={register('servicedAt')}
          />
          <div className="space-y-2">
            <Label htmlFor="service-notes">Notes (optional)</Label>
            <Textarea
              id="service-notes"
              maxLength={255}
              placeholder="Describe the service performed"
              aria-invalid={Boolean(errors.notes)}
              {...register('notes')}
            />
            {errors.notes?.message && (
              <p className="text-sm text-destructive">
                {errors.notes.message}
              </p>
            )}
          </div>
          <FormField
            id="service-next-date"
            label="Next service date (optional)"
            type="date"
            error={errors.nextServiceDate?.message}
            registration={register('nextServiceDate')}
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
              {mutation.isPending ? 'Saving…' : 'Record service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
