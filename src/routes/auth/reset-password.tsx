import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/auth-layout'
import { FormField } from '@/components/shared/form-field'
import { PasswordField } from '@/components/shared/password-field'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { MessageResponse } from '@/types/auth'
import { isApiError } from '@/types/api'

const schema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
    newPassword: z.string().min(8, 'Use at least 8 characters').max(72),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>
interface ResetRouteState {
  email?: string
  code?: string
}

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state as ResetRouteState | null
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: typeof routeState?.email === 'string' ? routeState.email : '',
      code: typeof routeState?.code === 'string' ? routeState.code : '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async ({
    confirmPassword: _confirmPassword,
    ...values
  }: FormValues) => {
    try {
      await api.post<MessageResponse>('/auth/reset-password', values)
      toast.success('Password reset. You can sign in with your new password.')
      navigate('/auth/login', { replace: true })
    } catch (error: unknown) {
      toast.error(
        isApiError(error) ? error.message : 'Could not reset your password',
      )
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Use the verification code sent to your email."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register('email')}
        />
        <FormField
          id="code"
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          error={errors.code?.message}
          registration={register('code')}
        />
        <PasswordField
          id="newPassword"
          label="New password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          registration={register('newPassword')}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register('confirmPassword')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting password…' : 'Set new password'}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        <Link to="/auth/login" className="hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
