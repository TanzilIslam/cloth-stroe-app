// Lets any page open the Expense & cash sheet that lives in the app layout.
import { createContext, useContext } from "react"

export const ExpenseSheetContext = createContext<() => void>(() => {})

export const useOpenExpenseSheet = () => useContext(ExpenseSheetContext)
