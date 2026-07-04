import Link from 'next/link'

const settingsLinks = [
  { label: 'Account', description: 'Name, email, password', href: '/settings/account' },
  { label: 'Billing', description: 'Subscription and Canvas credits', href: '/settings/billing' },
  { label: 'Integrations', description: 'Canva, Figma, and Chrome extension', href: '/settings/integrations' },
]

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, billing, and integrations
        </p>
      </div>

      <div className="grid gap-4 max-w-lg">
        {settingsLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-4 bg-muted border border-border rounded-lg hover:border-primary/50 transition-colors"
          >
            <div className="font-medium text-foreground text-sm">{item.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
