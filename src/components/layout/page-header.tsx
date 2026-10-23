// Page title with optional subtitle and right-side actions.
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
          {title}
        </h1>
        {subtitle && (
          // The mobile top bar already shows the shop
          <p className="hidden text-sm text-muted-foreground lg:block">
            {subtitle}
          </p>
        )}
      </div>
      {actions}
    </header>
  )
}
