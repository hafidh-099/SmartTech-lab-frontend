import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns'
import {
  Copy,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { StatCard } from '@/components/dashboard/stat-card'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { FormField } from '@/components/shared/form-field'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { isApiError } from '@/types/api'

const schoolFormSchema = z.object({
  name: z.string().trim().min(1, 'School name is required').max(255),
  region: z.string().trim().max(100, 'Region must not exceed 100 characters'),
  district: z
    .string()
    .trim()
    .max(100, 'District must not exceed 100 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Contact email is required')
    .email('Enter a valid email address')
    .max(255),
  phone: z.string().trim().max(20, 'Phone must not exceed 20 characters'),
})

type SchoolFormValues = z.infer<typeof schoolFormSchema>
type SubscriptionStatus = 'active' | 'expired' | 'locked'

interface SchoolProfile {
  id: string
  schoolCode: string
  name: string
  region: string | null
  district: string | null
  email: string
  phone: string | null
  subscriptionStatus: SubscriptionStatus
  licenseExpiryDate: string | null
  memberCounts?: MemberCounts
  userCounts?: MemberCounts
}

interface MemberCounts {
  deans: number
  technicians: number
  teachers: number
}

interface UpdateSchoolBody {
  name: string
  region: string | null
  district: string | null
  email: string
  phone: string | null
}

function getErrorMessage(error: unknown, fallback: string) {
  return isApiError(error) ? error.message : fallback
}

function parseLicenseDate(value: string | null): Date | null {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

function SchoolPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={`member-count-${index}`} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={`field-skeleton-${index}`} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
            <Skeleton className="h-9 w-32 sm:col-span-2" />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  )
}

export default function DeanSchoolProfile() {
  const queryClient = useQueryClient()
  const [today] = useState(() => new Date())
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const schoolQuery = useQuery({
    queryKey: ['school', 'me'],
    queryFn: async () => {
      const response = await api.get<SchoolProfile>('/schools/me')
      return response.data
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      name: '',
      region: '',
      district: '',
      email: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (!schoolQuery.data) return
    reset({
      name: schoolQuery.data.name,
      region: schoolQuery.data.region ?? '',
      district: schoolQuery.data.district ?? '',
      email: schoolQuery.data.email,
      phone: schoolQuery.data.phone ?? '',
    })
  }, [schoolQuery.data, reset])

  useEffect(() => {
    if (schoolQuery.isError) {
      toast.error(
        getErrorMessage(schoolQuery.error, 'Could not load school profile'),
      )
    }
  }, [schoolQuery.isError, schoolQuery.error])

  const updateMutation = useMutation({
    mutationFn: async (values: SchoolFormValues) => {
      const body: UpdateSchoolBody = {
        name: values.name.trim(),
        region: values.region.trim() || null,
        district: values.district.trim() || null,
        email: values.email.trim(),
        phone: values.phone.trim() || null,
      }
      return api.patch<SchoolProfile>('/schools/me', body)
    },
    onSuccess: () => {
      toast.success('School profile updated')
      void queryClient.invalidateQueries({ queryKey: ['school', 'me'] })
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Could not update school profile'))
    },
  })

  const regenerateMutation = useMutation({
    mutationFn: async () => api.post('/schools/me/regenerate-code'),
    onSuccess: () => {
      toast.success('New code generated')
      setRegenerateOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['school', 'me'] })
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Could not regenerate school code'))
    },
  })

  async function copySchoolCode() {
    if (!schoolQuery.data?.schoolCode) return
    try {
      await navigator.clipboard.writeText(schoolQuery.data.schoolCode)
      toast.success('Copied')
    } catch {
      toast.error('Could not copy the school code to your clipboard')
    }
  }

  if (schoolQuery.isLoading) return <SchoolPageSkeleton />

  if (schoolQuery.isError || !schoolQuery.data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Could not load school profile</CardTitle>
            <CardDescription>
              {schoolQuery.isError
                ? getErrorMessage(
                    schoolQuery.error,
                    'Please try again in a moment.',
                  )
                : 'School information is unavailable.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => void schoolQuery.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const school = schoolQuery.data
  const counts = school.memberCounts ?? school.userCounts ?? {
    deans: 0,
    technicians: 0,
    teachers: 0,
  }
  const expiryDate = parseLicenseDate(school.licenseExpiryDate)
  const daysUntilExpiry = expiryDate
    ? differenceInCalendarDays(expiryDate, today)
    : null
  const isSubscriptionInactive = school.subscriptionStatus !== 'active'

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Profile"
        description="Manage your institution details"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Deans"
          value={counts.deans}
          icon={ShieldCheck}
          compact
        />
        <StatCard
          title="Technicians"
          value={counts.technicians}
          icon={Wrench}
          compact
        />
        <StatCard
          title="Teachers"
          value={counts.teachers}
          icon={GraduationCap}
          compact
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>School information</CardTitle>
            <CardDescription>
              Update your institution name and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) =>
                updateMutation.mutate(values),
              )}
              className="grid gap-5 sm:grid-cols-2"
            >
              <FormField
                id="school-name"
                label="School name"
                autoComplete="organization"
                maxLength={255}
                error={errors.name?.message}
                registration={register('name')}
              />
              <FormField
                id="school-email"
                label="Contact email"
                type="email"
                autoComplete="email"
                maxLength={255}
                error={errors.email?.message}
                registration={register('email')}
              />
              <FormField
                id="school-region"
                label="Region"
                maxLength={100}
                error={errors.region?.message}
                registration={register('region')}
              />
              <FormField
                id="school-district"
                label="District"
                maxLength={100}
                error={errors.district?.message}
                registration={register('district')}
              />
              <FormField
                id="school-phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                maxLength={20}
                error={errors.phone?.message}
                registration={register('phone')}
              />
              <div className="flex items-end sm:col-span-2">
                <Button
                  type="submit"
                  disabled={
                    !isDirty || isSubmitting || updateMutation.isPending
                  }
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle>School Invitation Code</CardTitle>
              <CardDescription>
                Share this code with staff who need to join. They&apos;ll use it
                during signup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-background/80 px-3 py-4 text-center font-mono text-2xl font-semibold tracking-[0.2em]">
                <span className="select-all break-all">{school.schoolCode}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => void copySchoolCode()}
                >
                  <Copy aria-hidden="true" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setRegenerateOpen(true)}
                >
                  <RefreshCw aria-hidden="true" />
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Subscription</CardTitle>
                <StatusBadge status={school.subscriptionStatus} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {expiryDate ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    License expires on {format(expiryDate, 'PPP')}
                  </p>
                  {daysUntilExpiry !== null && isSubscriptionInactive ? (
                    <p className="text-sm font-medium text-destructive">
                      Expired {Math.max(0, -daysUntilExpiry)} day
                      {Math.max(0, -daysUntilExpiry) === 1 ? '' : 's'} ago
                    </p>
                  ) : daysUntilExpiry !== null ? (
                    <p
                      className={
                        daysUntilExpiry < 30
                          ? 'text-sm font-medium text-amber-600 dark:text-amber-400'
                          : 'text-sm font-medium text-green-700 dark:text-green-400'
                      }
                    >
                      {daysUntilExpiry >= 0
                        ? `${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} remaining`
                        : `Expired ${-daysUntilExpiry} day${daysUntilExpiry === -1 ? '' : 's'} ago`}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No license expiry date is set.
                </p>
              )}
              {isSubscriptionInactive && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                  Contact support to renew.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        title="Regenerate school code?"
        description="The old code will stop working immediately. Anyone who hasn't signed up yet will need the new code."
        confirmLabel="Regenerate"
        variant="destructive"
        isPending={regenerateMutation.isPending}
        onConfirm={() => regenerateMutation.mutate()}
      />
    </div>
  )
}
