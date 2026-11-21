import { INTL_LOCALE } from './intl'
import { useTranslation } from '../../hooks/useTranslation'
import type { PublicPaymentOut } from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'

type DepositStepProps = {
  payment: PublicPaymentOut
  timezone: string
  currency: string
}

export default function DepositStep({ payment, timezone, currency }: DepositStepProps) {
  const { t, locale } = useTranslation()
  const holdUntil = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(payment.hold_expires_at))
  const money = (amount: number) => formatCurrency(amount, currency as Currency)
  const canPay = payment.status === 'pending' && Boolean(payment.checkout_url)

  return (
    <div role="status" className="mt-5 rounded-xl border border-[color-mix(in_srgb,var(--tint-amber-ink)_25%,transparent)] bg-[var(--tint-amber)] p-4">
      <h3 className="text-base font-semibold text-[var(--tint-amber-ink)]">{t('booking.depositTermsTitle')}</h3>

      <dl className="mt-3 divide-y divide-[color-mix(in_srgb,var(--tint-amber-ink)_25%,transparent)] text-sm">
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-[var(--tint-amber-ink)]">{t('payment.deposit')}</dt>
          <dd className="font-semibold text-[var(--tint-amber-ink)]">{money(payment.amount)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-[var(--tint-amber-ink)]">{t('booking.remainingAmount')}</dt>
          <dd className="font-medium text-[var(--tint-amber-ink)]">{money(payment.remaining_amount)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-[var(--tint-amber-ink)]">{t('booking.payBefore')}</dt>
          <dd className="font-medium text-[var(--tint-amber-ink)]">{holdUntil}</dd>
        </div>
      </dl>

      <p className="mt-2 text-xs text-[var(--tint-amber-ink)]">{t('booking.holdNote')}</p>

      {canPay && (
        <a
          href={payment.checkout_url ?? '#'}
          className="mt-3 inline-block ui-button ui-button-primary"
        >
          {t('booking.payDeposit')}
        </a>
      )}
    </div>
  )
}
