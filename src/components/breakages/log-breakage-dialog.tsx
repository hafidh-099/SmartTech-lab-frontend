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
import { Textarea } from '@/components/ui/textarea'
import { useChemicals } from '@/hooks/queries/use-chemicals'
import { useEquipment } from '@/hooks/queries/use-equipment'
import {
  useLogBreakage,
  type BreakageItemType,
  type CreateBreakageBody,
} from '@/hooks/queries/use-breakages'

const logBreakageSchema = z
  .object({
    itemType: z.enum(['glassware', 'equipment', 'chemical']),
    itemName: z.string().trim().min(1, 'Item name is required').max(150),
    chemicalId: z.string(),
    equipmentId: z.string(),
    studentName: z.string().trim().min(1, 'Student name is required').max(255),
    studentClass: z.string().trim().min(1, 'Student class is required').max(50),
    quantity: z.number().int().min(1, 'Quantity must be greater than zero'),
    penaltyAmount: z
      .number()
      .min(0, 'Penalty cannot be negative')
      .max(9999999999.99, 'Penalty is too large'),
    notes: z.string().max(4000, 'Notes are too long'),
  })
  .superRefine((values, context) => {
    if (values.itemType === 'chemical' && !values.chemicalId) {
      context.addIssue({
        code: 'custom',
        path: ['chemicalId'],
        message: 'Select a chemical',
      })
    }
    if (values.itemType === 'equipment' && !values.equipmentId) {
      context.addIssue({
        code: 'custom',
        path: ['equipmentId'],
        message: 'Select equipment',
      })
    }
  })

type LogBreakageValues = z.infer<typeof logBreakageSchema>

interface LogBreakageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogBreakageDialog({
  open,
  onOpenChange,
}: LogBreakageDialogProps) {
  const mutation = useLogBreakage()
  const chemicalsQuery = useChemicals({ page: 1, limit: 100 })
  const equipmentQuery = useEquipment({ page: 1, limit: 100 })
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<LogBreakageValues>({
    resolver: zodResolver(logBreakageSchema),
    defaultValues: {
      itemType: 'glassware',
      itemName: '',
      chemicalId: '',
      equipmentId: '',
      studentName: '',
      studentClass: '',
      quantity: 1,
      penaltyAmount: 0,
      notes: '',
    },
  })
  const itemType = watch('itemType')
  const chemicalId = watch('chemicalId')
  const quantity = watch('quantity')
  const selectedChemical = chemicalsQuery.data?.data.find(
    (chemical) => chemical.id === chemicalId,
  )
  const exceedsStock =
    itemType === 'chemical' &&
    selectedChemical !== undefined &&
    Number.isFinite(quantity) &&
    quantity > Number(selectedChemical.currentQuantity)

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  function changeItemType(value: string) {
    const next = value as BreakageItemType
    setValue('itemType', next, { shouldValidate: true })
    setValue('chemicalId', '', { shouldValidate: true })
    setValue('equipmentId', '', { shouldValidate: true })
  }

  function onSubmit(values: LogBreakageValues) {
    if (values.itemType === 'chemical' && selectedChemical &&
      values.quantity > Number(selectedChemical.currentQuantity)) {
      setError('quantity', {
        message: `Only ${selectedChemical.currentQuantity} ${selectedChemical.unit} available.`,
      })
      return
    }
    const body: CreateBreakageBody = {
      itemType: values.itemType,
      itemName: values.itemName,
      studentName: values.studentName,
      studentClass: values.studentClass,
      quantity: values.quantity,
      penaltyAmount: values.penaltyAmount,
      notes: values.notes || undefined,
      chemicalId: values.itemType === 'chemical' ? values.chemicalId : undefined,
      equipmentId:
        values.itemType === 'equipment' ? values.equipmentId : undefined,
    }
    mutation.mutate(body, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log breakage</DialogTitle>
          <DialogDescription>
            Record a damaged item and the associated student penalty.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="breakage-item-type">Item type</Label>
            <Select value={itemType} onValueChange={changeItemType}>
              <SelectTrigger id="breakage-item-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glassware">Glassware</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="chemical">Chemical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {itemType === 'chemical' && (
            <div className="space-y-2">
              <Label htmlFor="breakage-chemical">Linked chemical</Label>
              <Select
                value={chemicalId || 'none'}
                onValueChange={(value) =>
                  setValue('chemicalId', value === 'none' ? '' : value, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="breakage-chemical">
                  <SelectValue placeholder="Select a chemical" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a chemical</SelectItem>
                  {(chemicalsQuery.data?.data ?? [])
                    .filter((chemical) => chemical.isActive)
                    .map((chemical) => (
                      <SelectItem key={chemical.id} value={chemical.id}>
                        {chemical.name} · {chemical.currentQuantity} {chemical.unit}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.chemicalId && (
                <p className="text-sm text-destructive">
                  {errors.chemicalId.message}
                </p>
              )}
              {chemicalsQuery.isError && (
                <p className="text-sm text-destructive">
                  Could not load chemicals. Please retry.
                </p>
              )}
            </div>
          )}
          {itemType === 'equipment' && (
            <div className="space-y-2">
              <Label htmlFor="breakage-equipment">Linked equipment</Label>
              <Select
                value={watch('equipmentId') || 'none'}
                onValueChange={(value) =>
                  setValue('equipmentId', value === 'none' ? '' : value, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="breakage-equipment">
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select equipment</SelectItem>
                  {(equipmentQuery.data?.data ?? []).map((equipment) => (
                    <SelectItem key={equipment.id} value={equipment.id}>
                      {equipment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.equipmentId && (
                <p className="text-sm text-destructive">
                  {errors.equipmentId.message}
                </p>
              )}
              {equipmentQuery.isError && (
                <p className="text-sm text-destructive">
                  Could not load equipment. Please retry.
                </p>
              )}
            </div>
          )}
          <FormField
            id="breakage-item-name"
            label="Item name"
            placeholder="e.g. Beaker 250mL"
            maxLength={150}
            error={errors.itemName?.message}
            registration={register('itemName')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="breakage-student"
              label="Student name"
              maxLength={255}
              error={errors.studentName?.message}
              registration={register('studentName')}
            />
            <FormField
              id="breakage-class"
              label="Student class"
              placeholder="e.g. Form 3B"
              maxLength={50}
              error={errors.studentClass?.message}
              registration={register('studentClass')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="breakage-quantity"
              label="Quantity"
              type="number"
              min={1}
              step={1}
              error={
                exceedsStock
                  ? `Only ${selectedChemical?.currentQuantity} ${selectedChemical?.unit} available.`
                  : errors.quantity?.message
              }
              registration={register('quantity', { valueAsNumber: true })}
            />
            <FormField
              id="breakage-penalty"
              label="Penalty amount (TZS)"
              type="number"
              min={0}
              step="0.01"
              error={errors.penaltyAmount?.message}
              registration={register('penaltyAmount', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="breakage-notes">Notes (optional)</Label>
            <Textarea id="breakage-notes" rows={3} {...register('notes')} />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
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
            <Button type="submit" disabled={mutation.isPending || exceedsStock}>
              {mutation.isPending ? 'Saving…' : 'Log breakage'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
