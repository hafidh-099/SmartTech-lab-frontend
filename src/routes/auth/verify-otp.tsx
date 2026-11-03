import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/auth-layout'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { MessageResponse, OtpPurpose } from '@/types/auth'
import { isApiError } from '@/types/api'

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
})

type FormValues = z.infer<typeof schema>
interface OtpRouteState {
  email?: string
  purpose?: OtpPurpose
}

function isOtpPurpose(value: unknown): value is OtpPurpose {
  return value === 'email_verify' || value === 'password_reset'
}

export default function VerifyOtp() {
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state as OtpRouteState | null
  const email = typeof routeState?.email === 'string' ? routeState.email : ''
  const purpose = isOtpPurpose(routeState?.purpose)
    ? routeState.purpose
    : 'email_verify'
  const [secondsRemaining, setSecondsRemaining] = useState(60)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  })

  useEffect(() => {
    if (secondsRemaining === 0) return
    const timer = window.setTimeout(
      () => setSecondsRemaining((remaining) => remaining - 1),
      1000,
    )
    return () => window.clearTimeout(timer)
  }, [secondsRemaining])

  const onSubmit = async ({ code }: FormValues) => {
    if (!email) {
      toast.error('The registration email is missing. Please start again.')
      return
    }

    if (purpose === 'password_reset') {
      navigate('/auth/reset-password', { state: { email, code } })
      return
    }

    try {
      await api.post<MessageResponse>('/auth/verify-otp', {
        email,
        code,
        purpose,
      })
      toast.success('Email verified. You can now sign in.')
      navigate('/auth/login', { replace: true })
    } catch (error: unknown) {
      toast.error(
        isApiError(error) ? error.message : 'Could not verify the code',
      )
    }
  }

  const resendCode = () => {
    toast.error(
      'Resending verification codes is not available yet. Contact your Dean for help.',
    )
  }

  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        email
          ? `We sent a 6-digit code to ${email}`
          : 'Your registration email is missing. Start again from the registration page.'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          id="code"
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className="text-center text-xl tracking-[0.5em]"
          error={errors.code?.message}
          registration={register('code')}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !email}
        >
          {isSubmitting ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Button
          type="button"
          variant="ghost"
          className="h-auto p-0 text-sm"
          onClick={resendCode}
          disabled={secondsRemaining > 0}
        >
          {secondsRemaining > 0
            ? `Resend code in ${secondsRemaining}s`
            : 'Resend code'}
        </Button>
        <Link to="/auth/login" className="hover:text-foreground">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
