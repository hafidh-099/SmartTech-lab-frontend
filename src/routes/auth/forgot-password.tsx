import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/auth-layout'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { MessageResponse } from '@/types/auth'
import { isApiError } from '@/types/api'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPassword() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post<MessageResponse>('/auth/forgot-password', values)
      toast.success('If the email exists, a reset code has been sent.')
      navigate('/auth/reset-password', { state: { email: values.email } })
    } catch (error: unknown) {
      toast.error(
        isApiError(error) ? error.message : 'Could not request a reset code',
      )
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a verification code to your email"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register('email')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending code…' : 'Send verification code'}
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
