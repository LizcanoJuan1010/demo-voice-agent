import { Icon } from '../../components/ui/Icon'
import type { AccountView } from '../../data/agentConfig'

type Props = {
  account: AccountView
}

export function AccountPanel({ account }: Props) {
  return (
    <aside className="z-10">
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-lg">
        <div className="mb-1 flex items-center gap-2">
          <Icon name="account_balance" className="text-white" />
          <h3 className="text-headline-md text-white">Account</h3>
        </div>
        <p className="mb-5 text-label-sm uppercase tracking-wide text-on-surface-variant">
          Outbound call · pre-charge-off
        </p>

        <div className="mb-5 flex items-center gap-3 rounded-xl bg-surface-container-low p-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-white text-black">
            <Icon name="person" />
          </div>
          <div>
            <p className="text-body-md font-bold text-on-surface">
              {account.consumerName}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              {account.creditor} · {account.accountNumber}
            </p>
          </div>
        </div>

        <dl className="space-y-3">
          <Row label="Balance owed" value={account.balanceOwed} strong />
          <Row
            label="Days past due"
            value={`${account.daysPastDue}`}
            badge="60 DPD"
          />
          <Row label="Past due amount" value={account.pastDueAmount} />
          <Row label="Minimum payment due" value={account.minimumPaymentDue} />
          <Row label="Monthly payment" value={account.monthlyPayment} />
          <Row label="Account number" value={account.accountNumber} />
        </dl>
      </div>
    </aside>
  )
}

function Row({
  label,
  value,
  strong,
  badge,
}: {
  label: string
  value: string
  strong?: boolean
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-outline-variant/40 pb-2 last:border-0">
      <dt className="text-label-sm text-on-surface-variant">{label}</dt>
      <dd className="flex items-center gap-2">
        {badge && (
          <span className="rounded-full bg-error-container px-2 py-0.5 text-label-sm font-bold text-on-error-container">
            {badge}
          </span>
        )}
        <span
          className={
            strong
              ? 'text-body-lg font-bold text-on-surface'
              : 'text-body-md text-on-surface'
          }
        >
          {value}
        </span>
      </dd>
    </div>
  )
}
