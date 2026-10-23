// Stock-in history: date, product, qty, supplier. Cost and paid for the owner only.
import { DataTable, type Column } from "@/components/shared/data-table"
import { Money } from "@/components/shared/money"
import { formatDate } from "@/lib/utils"
import type { PurchaseRow } from "@/types"

interface PurchaseListProps {
  rows: PurchaseRow[]
  showCost: boolean
}

export function PurchaseList({ rows, showCost }: PurchaseListProps) {
  const columns: Column<PurchaseRow>[] = [
    {
      header: "Date",
      cell: (r) => formatDate(r.createdAt),
      className: "whitespace-nowrap",
    },
    {
      header: "Product",
      cell: (r) => (
        <div className="min-w-28">
          <p className="font-medium">{r.productName}</p>
          {r.variant && (
            <p className="text-[0.8125rem] text-muted-foreground">
              {r.variant}
            </p>
          )}
        </div>
      ),
    },
    { header: "Qty", cell: (r) => `${r.qty} ${r.unit}` },
    {
      header: "Supplier",
      cell: (r) => r.supplierName,
      className: "hidden md:table-cell",
    },
    ...(showCost
      ? [
          {
            header: "Total",
            cell: (r: PurchaseRow) => <Money amount={r.qty * r.cost} />,
          },
          {
            header: "Paid",
            cell: (r: PurchaseRow) => <Money amount={r.paid} />,
            className: "hidden sm:table-cell",
          },
        ]
      : []),
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      empty="No stock in yet"
    />
  )
}
