import { Icon } from '../../components/ui/Icon'
import type { AccountView } from '../../data/agentConfig'

type Props = {
  account: AccountView
}

export function AccountPanel({ account }: Props) {
  return (
    <div className="glass-soft rounded-3xl p-6">
      <div className="mb-1 flex items-center gap-2">
        <Icon name="account_balance" className="text-white" />
        <h3 className="text-label-sm font-semibold uppercase tracking-wide text-white/45">
          Account
        </h3>
      </div>
      <p className="mb-6 text-label-sm uppercase tracking-wide text-white/35">
        Outbound call · pre-charge-off
      </p>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-white text-black">
          <Icon name="person" />
        </div>
        <div>
          <p className="text-body-md font-semibold text-white">
            {account.consumerName}
          </p>
          <p className="text-label-sm text-white/45">
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
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0">
      <dt className="text-label-sm text-white/40">{label}</dt>
      <dd className="flex items-center gap-2">
        {badge && (
          <span className="rounded-full bg-error/10 px-2 py-0.5 text-label-sm font-semibold text-error">
            {badge}
          </span>
        )}
        <span
          className={
            strong
              ? 'text-body-lg font-semibold text-white'
              : 'text-body-md text-white/90'
          }
        >
          {value}
        </span>
      </dd>
    </div>
  )
}
