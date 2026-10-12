// Monthly sale, gross profit, expenses and net profit.
import { DataTable } from "@/components/shared/data-table"
import { Money } from "@/components/shared/money"
import type { MonthRow } from "@/types"

interface MonthlyReportProps {
  rows: MonthRow[]
}

export function MonthlyReport({ rows }: MonthlyReportProps) {
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.month}
      empty="No data yet"
      columns={[
        {
          header: "Month",
          cell: (r) => <span className="font-medium">{r.month}</span>,
        },
        { header: "Sales", cell: (r) => <Money amount={r.sales} /> },
        {
          header: "Gross profit",
          cell: (r) => <Money amount={r.gross} />,
          className: "hidden sm:table-cell",
        },
        {
          header: "Expenses",
          cell: (r) => <Money amount={r.expenses} />,
          className: "hidden sm:table-cell",
        },
        {
          header: "Net profit",
          cell: (r) => <Money amount={r.net} className="font-semibold" />,
        },
      ]}
    />
  )
}
