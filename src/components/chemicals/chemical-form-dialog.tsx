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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateChemical,
  useUpdateChemical,
  type Chemical,
  type ChemicalUnit,
  type CreateChemicalBody,
  type UpdateChemicalBody,
} from '@/hooks/queries/use-chemicals'

const units: ChemicalUnit[] = ['g', 'mL', 'L', 'mol']

const chemicalFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  formula: z.string().trim().max(50, 'Formula must not exceed 50 characters'),
  unit: z.enum(['g', 'mL', 'L', 'mol']),
  currentQuantity: z
    .number()
    .positive('Initial quantity must be greater than zero')
    .max(999_999_999.999),
  minThreshold: z
    .number()
    .min(0, 'Minimum threshold cannot be negative')
    .max(999_999_999.999),
  expiryDate: z.string(),
})

const createChemicalFormSchema = chemicalFormSchema.superRefine(
  (values, context) => {
    if (values.expiryDate && values.expiryDate < todayString()) {
      context.addIssue({
        code: 'custom',
        path: ['expiryDate'],
        message: 'Expiry date cannot be in the past.',
      })
    }
  },
)

type ChemicalFormValues = z.infer<typeof chemicalFormSchema>

interface ChemicalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chemical?: Chemical
}

function todayString() {
  const today = new Date()
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60_000,
  )
  return localDate.toISOString().slice(0, 10)
}

export function ChemicalFormDialog({
  open,
  onOpenChange,
  chemical,
}: ChemicalFormDialogProps) {
  const createMutation = useCreateChemical()
  const updateMutation = useUpdateChemical(chemical?.id ?? '')
  const isEditing = Boolean(chemical)
  const isPending = createMutation.isPending || updateMutation.isPending
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ChemicalFormValues>({
    resolver: zodResolver(
      isEditing ? chemicalFormSchema : createChemicalFormSchema,
    ),
    defaultValues: {
      name: '',
      formula: '',
      unit: 'g',
      currentQuantity: 0,
      minThreshold: 0,
      expiryDate: '',
    },
  })
  const selectedUnit = watch('unit')

  useEffect(() => {
    if (!open) return
    reset({
      name: chemical?.name ?? '',
      formula: chemical?.formula ?? '',
      unit: chemical?.unit ?? 'g',
      currentQuantity: chemical ? Number(chemical.currentQuantity) : 0,
      minThreshold: chemical ? Number(chemical.minThreshold) : 0,
      expiryDate: chemical?.expiryDate?.slice(0, 10) ?? '',
    })
  }, [chemical, open, reset])

  function onSubmit(values: ChemicalFormValues) {
    const date = values.expiryDate || undefined
    if (chemical) {
      const body: UpdateChemicalBody = {
        name: values.name,
        formula: values.formula || null,
        unit: values.unit,
        minThreshold: values.minThreshold,
        expiryDate: date ?? null,
      }
      updateMutation.mutate(body, {
        onSuccess: () => onOpenChange(false),
      })
      return
    }

    const body: CreateChemicalBody = {
      name: values.name,
      formula: values.formula || undefined,
      unit: values.unit,
      currentQuantity: values.currentQuantity,
      minThreshold: values.minThreshold,
      expiryDate: date,
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
            {isEditing ? 'Edit chemical' : 'Add chemical'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update chemical details. To change stock, use Restock.'
              : 'Add a chemical and record its initial stock.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FormField
            id="chemical-name"
            label="Name"
            maxLength={150}
            error={errors.name?.message}
            registration={register('name')}
          />
          <FormField
            id="chemical-formula"
            label="Formula (optional)"
            maxLength={50}
            error={errors.formula?.message}
            registration={register('formula')}
          />
          <div className="space-y-2">
            <Label htmlFor="chemical-unit">Unit</Label>
            <Select
              value={selectedUnit}
              onValueChange={(value) => {
                const unit = units.find((candidate) => candidate === value)
                if (unit) {
                  setValue('unit', unit, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              }}
            >
              <SelectTrigger id="chemical-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {chemical ? (
            <div className="space-y-2">
              <Label>Current quantity</Label>
              <p className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm">
                {Number(chemical.currentQuantity)} {chemical.unit}
              </p>
            </div>
          ) : (
            <FormField
              id="chemical-current-quantity"
              label={`Initial quantity (${selectedUnit})`}
              type="number"
              inputMode="decimal"
              min="0.001"
              step="0.001"
              error={errors.currentQuantity?.message}
              registration={register('currentQuantity', {
                valueAsNumber: true,
              })}
            />
          )}
          <FormField
            id="chemical-threshold"
            label={`Minimum threshold (${selectedUnit})`}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.001"
            error={errors.minThreshold?.message}
            registration={register('minThreshold', { valueAsNumber: true })}
          />
          <div className="space-y-2">
            <Label htmlFor="chemical-expiry">Expiry date (optional)</Label>
            <input
              id="chemical-expiry"
              type="date"
              min={!isEditing ? todayString() : undefined}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('expiryDate')}
            />
            {!isEditing && errors.expiryDate && (
              <p className="text-sm text-destructive">
                {errors.expiryDate.message}
              </p>
            )}
          </div>
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
              {isPending
                ? 'Saving…'
                : isEditing
                  ? 'Save changes'
                  : 'Add chemical'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
