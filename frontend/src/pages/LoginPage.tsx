import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function createLoginSchema() {
  return z.object({
    email: z.string().email(i18n.t('common:validation.emailInvalid')),
    password: z.string().min(1, i18n.t('organizer:validation.passwordRequired')),
  })
}

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>

export function LoginPage() {
  const { t, i18n: i18nInstance } = useTranslation('organizer')
  const navigate = useNavigate()
  const { user, login, loginError, isLoggingIn } = useAuth()
  const resolver = useMemo(() => zodResolver(createLoginSchema()), [i18nInstance.language])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver,
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        navigate('/dashboard')
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">c-sign</h1>
          <p className="text-neutral-600">{t('login.title')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('login.connection')}</CardTitle>
            <CardDescription>
              {t('login.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('common:form.labels.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  {...register('email')}
                  disabled={isLoggingIn}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('login.passwordPlaceholder')}
                  {...register('password')}
                  disabled={isLoggingIn}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {loginError && (
                <p className="text-sm text-red-600">
                  {t('login.invalidCredentials')}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('login.submitting')}
                  </>
                ) : (
                  t('login.submit')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
