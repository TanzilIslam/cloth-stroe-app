// Label + icon per expense category.
import {
  Home,
  MoreHorizontal,
  Scissors,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react"

import type { ExpenseCategory } from "@/types"

export const EXPENSE_META: Record<
  ExpenseCategory,
  { label: string; icon: LucideIcon }
> = {
  rent: { label: "Rent", icon: Home },
  salary: { label: "Salary", icon: Users },
  bill: { label: "Bill", icon: Zap },
  tailor: { label: "Tailor", icon: Scissors },
  other: { label: "Other", icon: MoreHorizontal },
}
