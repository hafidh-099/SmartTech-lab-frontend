import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  email: z.string().email('Enter a valid email address').max(255),
  password: z.string().min(8, 'Use at least 8 characters').max(72),
  invitationCode: z.string().min(1, 'Invitation code is required').max(20),
})

type FormValues = z.infer<typeof schema>

export default function RegisterStaff() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      invitationCode: '',
    },
  })

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) setValue('invitationCode', code)
  }, [searchParams, setValue])

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post<RegistrationResponse>('/auth/register/staff', values)
      toast.success('Registration started. Check your email for the code.')
      navigate('/auth/verify-otp', {
        state: { email: values.email, purpose: 'email_verify' },
      })
    } catch (error: unknown) {
      toast.error(
        isApiError(error) ? error.message : 'Could not register your account',
      )
    }
  }

  return (
    <AuthLayout
      title="Join your school"
      subtitle="You need an invitation code from your Dean"
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
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register('email')}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register('password')}
        />
        <FormField
          id="invitationCode"
          label="Invitation code"
          helperText="Ask your Dean for this code."
          error={errors.invitationCode?.message}
          registration={register('invitationCode')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Join your school'}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
