import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/auth-layout'
import { FormField } from '@/components/shared/form-field'
import { PasswordField } from '@/components/shared/password-field'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { RegistrationResponse } from '@/types/auth'
import { isApiError } from '@/types/api'

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(255),
  schoolName: z.string().min(1, 'School name is required').max(255),
  region: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  email: z.string().email('Enter a valid email address').max(255),
  phone: z.string().max(20).optional(),
  password: z.string().min(8, 'Use at least 8 characters').max(72),
})

type FormValues = z.infer<typeof schema>

export default function RegisterDean() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      schoolName: '',
      region: '',
      district: '',
      email: '',
      phone: '',
      password: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post<RegistrationResponse>('/auth/register/dean', {
        ...values,
        region: values.region || undefined,
        district: values.district || undefined,
        phone: values.phone || undefined,
      })
      toast.success('Registration started. Check your email for the code.')
      navigate('/auth/verify-otp', {
        state: { email: values.email, purpose: 'email_verify' },
      })
    } catch (error: unknown) {
      toast.error(
        isApiError(error) ? error.message : 'Could not register your school',
      )
    }
  }

  return (
    <AuthLayout
      title="Create school account"
      subtitle="Set up your school on SmartTech Lab"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          id="fullName"
          label="Full name"
          autoComplete="name"
          error={errors.fullName?.message}
          registration={register('fullName')}
        />
        <FormField
          id="schoolName"
          label="School name"
          autoComplete="organization"
          error={errors.schoolName?.message}
          registration={register('schoolName')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="region"
            label="Region"
            error={errors.region?.message}
            registration={register('region')}
          />
          <FormField
            id="district"
            label="District"
            error={errors.district?.message}
            registration={register('district')}
          />
        </div>
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register('email')}
        />
        <FormField
          id="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          registration={register('phone')}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register('password')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create school account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
