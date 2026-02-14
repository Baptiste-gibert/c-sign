import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SectionStepProps {
  step: number
  title: string
  description?: string
  badge?: string
  muted?: boolean
  children: React.ReactNode
}

export function SectionStep({ step, title, description, badge, muted, children }: SectionStepProps) {
  return (
    <Card className={cn(muted && 'bg-gray-50/50 border-gray-100')}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              muted
                ? 'bg-gray-200 text-gray-500'
                : 'bg-gray-900 text-white'
            )}
          >
            {step}
          </div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {badge && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {badge}
              </Badge>
            )}
          </div>
        </div>
        {description && (
          <CardDescription className="ml-10 text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="ml-10">
        {children}
      </CardContent>
    </Card>
  )
}
