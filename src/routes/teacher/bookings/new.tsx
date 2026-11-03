import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ItemsSelector } from '@/components/bookings/items-selector'
import { PageHeader } from '@/components/shared/page-header'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateBooking,
  useLabs,
  type BookingItem,
} from '@/hooks/queries/use-bookings'
import {
  dateTimeLocalToISO,
  minBookingDateTime,
} from '@/lib/date'

const bookingSchema = z
  .object({
    labId: z.string().min(1, 'Select a lab'),
    title: z.string().trim().min(1, 'Title is required').max(255),
    topic: z.string().trim().min(1, 'Topic is required').max(255),
    className: z.string().trim().min(1, 'Class is required').max(50),
    studentCount: z
      .number()
      .int('Enter a whole number')
      .min(1, 'At least one student is required')
      .max(10000, 'Maximum 10,000 students'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    priority: z.enum(['normal', 'urgent']),
    description: z.string(),
  })
  .superRefine((values, context) => {
    if (values.startTime && values.startTime < minBookingDateTime()) {
      context.addIssue({
        code: 'custom',
        path: ['startTime'],
        message: 'Start time must be at least 15 minutes from now.',
      })
    }
    if (values.startTime && values.endTime) {
      if (values.endTime <= values.startTime) {
        context.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'End time must be after start time.',
        })
      }
    }
  })

type BookingFormValues = z.infer<typeof bookingSchema>

export default function NewTeacherBooking() {
  const navigate = useNavigate()
  const labsQuery = useLabs()
  const createMutation = useCreateBooking()
  const [items, setItems] = useState<BookingItem[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      labId: '',
      title: '',
      topic: '',
      className: '',
      studentCount: 1,
      startTime: '',
      endTime: '',
      priority: 'normal',
      description: '',
    },
  })

  function onSubmit(values: BookingFormValues) {
    createMutation.mutate(
      {
        labId: values.labId,
        title: values.title,
        topic: values.topic,
        className: values.className,
        studentCount: values.studentCount,
        startTime: dateTimeLocalToISO(values.startTime),
        endTime: dateTimeLocalToISO(values.endTime),
        priority: values.priority,
        description: values.description.trim() || undefined,
        items: items.map((item) => ({
          ...(item.chemicalId ? { chemicalId: item.chemicalId } : {}),
          ...(item.equipmentId ? { equipmentId: item.equipmentId } : {}),
          quantity: Number(item.quantity),
          unit: item.unit,
        })),
      },
      {
        onSuccess: (booking) => {
          const messages =
            booking.warnings?.map((warning) => warning.message) ?? []
          if (messages.length) setWarnings(messages)
          else navigate('/teacher/bookings')
        },
      },
    )
  }

  if (labsQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="New Booking" description="Request a lab session." />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium">Could not load labs</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {labsQuery.error.message}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void labsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Booking"
        description="Request a laboratory session for your class."
        action={
          <Button variant="outline" asChild>
            <Link to="/teacher/bookings">My bookings</Link>
          </Button>
        }
      />
      {warnings.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4"
        >
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Booking submitted with preparation warnings
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800 dark:text-amber-300">
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
          <Button
            className="mt-4"
            onClick={() => navigate('/teacher/bookings')}
          >
            View my bookings
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session details</CardTitle>
            <CardDescription>
              Describe the class and planned laboratory session.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="booking-lab">Lab</Label>
              <Select
                value={watch('labId')}
                onValueChange={(value) =>
                  setValue('labId', value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={labsQuery.isLoading}
              >
                <SelectTrigger id="booking-lab" aria-invalid={Boolean(errors.labId)}>
                  <SelectValue
                    placeholder={
                      labsQuery.isLoading ? 'Loading labs…' : 'Select lab'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(labsQuery.data ?? []).map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.name}
                      {lab.location ? ` · ${lab.location}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.labId?.message && (
                <p className="text-sm text-destructive">
                  {errors.labId.message}
                </p>
              )}
              {labsQuery.data?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No active labs are available. Contact your Dean.
                </p>
              )}
            </div>
            <FormField
              id="booking-title"
              label="Title"
              maxLength={255}
              error={errors.title?.message}
              registration={register('title')}
            />
            <FormField
              id="booking-topic"
              label="Topic"
              maxLength={255}
              error={errors.topic?.message}
              registration={register('topic')}
            />
            <FormField
              id="booking-class"
              label="Class"
              placeholder="e.g., Form 4A"
              maxLength={50}
              error={errors.className?.message}
              registration={register('className')}
            />
            <FormField
              id="booking-student-count"
              label="Student count"
              type="number"
              min="1"
              max="10000"
              step="1"
              inputMode="numeric"
              error={errors.studentCount?.message}
              registration={register('studentCount', {
                valueAsNumber: true,
              })}
            />
            <div className="space-y-2">
              <Label htmlFor="booking-priority">Priority</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => {
                  if (value === 'normal' || value === 'urgent') {
                    setValue('priority', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                }}
              >
                <SelectTrigger id="booking-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-description">Description (optional)</Label>
              <Textarea
                id="booking-description"
                placeholder="Add any details that will help the lab prepare."
                {...register('description')}
              />
              {errors.description?.message && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule</CardTitle>
            <CardDescription>
              Times are entered and displayed in East Africa Time (EAT).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="booking-start-time"
              label="Start time"
              type="datetime-local"
              min={minBookingDateTime()}
              error={errors.startTime?.message}
              registration={register('startTime')}
            />
            <FormField
              id="booking-end-time"
              label="End time"
              type="datetime-local"
              min={watch('startTime') || minBookingDateTime()}
              error={errors.endTime?.message}
              registration={register('endTime')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requested items</CardTitle>
            <CardDescription>
              You can submit without items; the technician can prepare them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ItemsSelector items={items} onChange={setItems} />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to="/teacher/bookings">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending || warnings.length > 0}>
            {createMutation.isPending ? 'Submitting…' : 'Submit booking request'}
          </Button>
        </div>
      </form>
    </div>
  )
}
