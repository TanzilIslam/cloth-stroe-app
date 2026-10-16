// Sale details: items, discount, paid, due, customer and staff.
import { Money } from "@/components/shared/money"
import { formatDate, formatTime } from "@/lib/utils"
import { PAYMENT_LABELS, type SaleDetail as SaleDetailData } from "@/types"

export function SaleDetail({ sale }: { sale: SaleDetailData }) {
  const net = sale.total - sale.discount
  const lines = [
    { label: "Subtotal", value: sale.total },
    ...(sale.discount ? [{ label: "Discount", value: -sale.discount }] : []),
    { label: net < 0 ? "Refund" : "Total", value: net, strong: true },
    {
      label: `Paid (${sale.method === "due" ? "none" : PAYMENT_LABELS[sale.method]})`,
      value: sale.paid,
    },
    ...(sale.due ? [{ label: PAYMENT_LABELS.due, value: sale.due }] : []),
  ]

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-muted-foreground">
        #{sale.id} · {formatDate(sale.createdAt)} {formatTime(sale.createdAt)} ·{" "}
        {sale.userName}
        {sale.customerName && ` · ${sale.customerName}`}
      </p>
      <ul className="flex flex-col divide-y rounded-lg border">
        {sale.items.map((i, n) => (
          <li key={n} className="flex justify-between gap-3 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {i.productName}
              </span>
              <span className="text-xs text-muted-foreground">
                {i.variant && `${i.variant} · `}
                {i.qty} {i.unit} × <Money amount={i.price} />
              </span>
            </span>
            <Money amount={i.qty * i.price} />
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-1">
        {lines.map((l) => (
          <div
            key={l.label}
            className={
              l.strong
                ? "flex justify-between font-semibold"
                : "flex justify-between"
            }
          >
            <dt>{l.label}</dt>
            <dd>
              <Money amount={l.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
