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
    <div role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">{t('booking.depositTermsTitle')}</h3>

      <dl className="mt-3 divide-y divide-amber-200 text-sm dark:divide-amber-800">
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-amber-800 dark:text-amber-200">{t('payment.deposit')}</dt>
          <dd className="font-semibold text-amber-950 dark:text-amber-50">{money(payment.amount)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-amber-800 dark:text-amber-200">{t('booking.remainingAmount')}</dt>
          <dd className="font-medium text-amber-950 dark:text-amber-50">{money(payment.remaining_amount)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-amber-800 dark:text-amber-200">{t('booking.payBefore')}</dt>
          <dd className="font-medium text-amber-950 dark:text-amber-50">{holdUntil}</dd>
        </div>
      </dl>

      <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">{t('booking.holdNote')}</p>

      {canPay && (
        <a
          href={payment.checkout_url ?? '#'}
          className="mt-3 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t('booking.payDeposit')}
        </a>
      )}
    </div>
  )
}
