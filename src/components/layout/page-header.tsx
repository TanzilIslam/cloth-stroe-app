// Page title with optional subtitle and right-side actions.
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold lg:text-2xl">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions}
    </header>
  )
}
