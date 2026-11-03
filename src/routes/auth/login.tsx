import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/auth-layout'
import { PasswordField } from '@/components/shared/password-field'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import type { AuthResponse } from '@/types/auth'
import { isApiError } from '@/types/api'
import { roleHome } from '@/components/shared/protected-route'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post<AuthResponse, { data: AuthResponse }>(
        '/auth/login',
        values,
      )
      setSession({
        ...data,
        user: { ...data.user, email: data.user.email ?? values.email },
      })
      toast.success('Welcome back!')
      navigate(roleHome(data.user.role), { replace: true })
    } catch (error: unknown) {
      toast.error(isApiError(error) ? error.message : 'Login failed')
    }
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter your credentials to access your dashboard"
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
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          registration={register('password')}
        />
        <Button
          type="submit"
          className="w-full bg-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link
          to="/auth/register/staff"
          className="transition-colors hover:text-foreground"
        >
          Register as Staff
        </Link>
        <Link
          to="/auth/forgot-password"
          className="transition-colors hover:text-foreground"
        >
          Forgot password?
        </Link>
      </div>
    </AuthLayout>
  )
}
