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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateEquipment,
  useUpdateEquipment,
  type CreateEquipmentBody,
  type Equipment,
  type EquipmentStatus,
  type UpdateEquipmentBody,
} from '@/hooks/queries/use-equipment'
import { dateKeyInEAT } from '@/lib/equipment-dates'

const statuses: EquipmentStatus[] = [
  'operational',
  'maintenance',
  'broken',
  'retired',
]

const equipmentSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(150),
    serialNumber: z.string().trim().max(100, 'Maximum 100 characters'),
    category: z.string().trim().max(100, 'Maximum 100 characters'),
    lastServiceDate: z.string(),
    nextServiceDate: z.string(),
    status: z.enum(['operational', 'maintenance', 'broken', 'retired']),
  })
  .superRefine((values, context) => {
    if (
      values.lastServiceDate &&
      values.nextServiceDate &&
      values.nextServiceDate < values.lastServiceDate
    ) {
      context.addIssue({
        code: 'custom',
        path: ['nextServiceDate'],
        message: 'Next service date must be on or after the last service date.',
      })
    }
  })

type EquipmentFormValues = z.infer<typeof equipmentSchema>

interface EquipmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment?: Equipment
}

export function EquipmentFormDialog({
  open,
  onOpenChange,
  equipment,
}: EquipmentFormDialogProps) {
  const isEditing = Boolean(equipment)
  const createMutation = useCreateEquipment()
  const updateMutation = useUpdateEquipment(equipment?.id ?? '')
  const isPending = createMutation.isPending || updateMutation.isPending
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      serialNumber: '',
      category: '',
      lastServiceDate: '',
      nextServiceDate: '',
      status: 'operational',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name: equipment?.name ?? '',
      serialNumber: equipment?.serialNumber ?? '',
      category: equipment?.category ?? '',
      lastServiceDate: equipment?.lastServiceDate?.slice(0, 10) ?? '',
      nextServiceDate: equipment?.nextServiceDate?.slice(0, 10) ?? '',
      status: equipment?.status ?? 'operational',
    })
  }, [equipment, open, reset])

  function onSubmit(values: EquipmentFormValues) {
    if (equipment) {
      const body: UpdateEquipmentBody = {
        name: values.name,
        serialNumber: values.serialNumber || null,
        category: values.category || null,
        lastServiceDate: values.lastServiceDate || null,
        nextServiceDate: values.nextServiceDate || null,
        status: values.status,
      }
      updateMutation.mutate(body, {
        onSuccess: () => onOpenChange(false),
      })
      return
    }

    const body: CreateEquipmentBody = {
      name: values.name,
      serialNumber: values.serialNumber || undefined,
      category: values.category || undefined,
      lastServiceDate: values.lastServiceDate || undefined,
      nextServiceDate: values.nextServiceDate || undefined,
    }
    createMutation.mutate(body, {
      onSuccess: () => onOpenChange(false),
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
          <DialogTitle>
            {isEditing ? 'Edit equipment' : 'Add equipment'}
          </DialogTitle>
          <DialogDescription>
            Manage equipment details and service schedule.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FormField
            id="equipment-name"
            label="Name"
            maxLength={150}
            error={errors.name?.message}
            registration={register('name')}
          />
          <FormField
            id="equipment-serial"
            label="Serial number (optional)"
            maxLength={100}
            error={errors.serialNumber?.message}
            registration={register('serialNumber')}
          />
          <FormField
            id="equipment-category"
            label="Category (optional)"
            maxLength={100}
            helperText="Example: Sterilization"
            error={errors.category?.message}
            registration={register('category')}
          />
          <div className="space-y-2">
            <Label htmlFor="equipment-last-service">
              Last service date (optional)
            </Label>
            <input
              id="equipment-last-service"
              type="date"
              max={dateKeyInEAT()}
              aria-invalid={Boolean(errors.lastServiceDate)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('lastServiceDate')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipment-next-service">
              Next service date (optional)
            </Label>
            <input
              id="equipment-next-service"
              type="date"
              aria-invalid={Boolean(errors.nextServiceDate)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('nextServiceDate')}
            />
            {errors.nextServiceDate?.message ? (
              <p className="text-sm text-destructive">
                {errors.nextServiceDate.message}
              </p>
            ) : watch('nextServiceDate') &&
              watch('nextServiceDate') < dateKeyInEAT() ? (
              <p className="text-xs text-amber-600">
                This date is in the past. You can still save it, but it will be
                marked overdue.
              </p>
            ) : null}
          </div>
          {equipment && (
            <div className="space-y-2">
              <Label htmlFor="equipment-status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => {
                  const status = statuses.find(
                    (candidate) => candidate === value,
                  )
                  if (status) {
                    setValue('status', status, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                }}
              >
                <SelectTrigger id="equipment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status[0].toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Add equipment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
