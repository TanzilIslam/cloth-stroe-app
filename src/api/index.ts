// Client-facing data layer: Server Actions with errors turned back into throws.
// Function names match docs/function.md.
import * as auth from "@/actions/auth"
import * as cash from "@/actions/cash"
import * as expenses from "@/actions/expenses"
import * as parties from "@/actions/parties"
import * as products from "@/actions/products"
import * as purchases from "@/actions/purchases"
import * as reports from "@/actions/reports"
import * as sales from "@/actions/sales"
import { check, unwrap } from "@/lib/result"
import type { Customer, ID, PartyInput, Supplier } from "@/types"

// auth + shops
export const login = unwrap(auth.login)
export const logout = unwrap(auth.logout)
export const getMe = unwrap(auth.getMe)
export const getShops = unwrap(auth.getShops)
export const switchShop = unwrap(auth.switchShop)

// sales
export const searchProducts = unwrap(sales.searchProducts)
export const getRecentProducts = unwrap(sales.getRecentProducts)
export const createSale = unwrap(sales.createSale)
export const getSales = unwrap(sales.getSales)

// products
export const getProducts = unwrap(products.getProducts)
export const getProduct = unwrap(products.getProduct)
export const createProduct = unwrap(products.createProduct)
export const updateProduct = unwrap(products.updateProduct)
export const toggleProductActive = unwrap(products.toggleProductActive)
export const saveVariant = unwrap(products.saveVariant)
export const deleteVariant = unwrap(products.deleteVariant)

// purchases
export const getLastCost = unwrap(purchases.getLastCost)
export const createPurchase = unwrap(purchases.createPurchase)
export const getPurchases = unwrap(purchases.getPurchases)

// parties (overloads kept by hand)
export function getParties(type: "customer", shopId: ID): Promise<Customer[]>
export function getParties(type: "supplier", shopId: ID): Promise<Supplier[]>
export async function getParties(type: "customer" | "supplier", shopId: ID) {
  return type === "customer"
    ? check(await parties.getParties("customer", shopId))
    : check(await parties.getParties("supplier", shopId))
}
export function saveParty(
  type: "customer",
  input: PartyInput
): Promise<Customer>
export function saveParty(
  type: "supplier",
  input: PartyInput
): Promise<Supplier>
export async function saveParty(
  type: "customer" | "supplier",
  input: PartyInput
) {
  return type === "customer"
    ? check(await parties.saveParty("customer", input))
    : check(await parties.saveParty("supplier", input))
}
export const getDues = unwrap(parties.getDues)
export const recordPayment = unwrap(parties.recordPayment)

// expenses
export const createExpense = unwrap(expenses.createExpense)
export const getExpenses = unwrap(expenses.getExpenses)
export const getTodayExpenses = unwrap(expenses.getTodayExpenses)
export const deleteExpense = unwrap(expenses.deleteExpense)

// cash
export const getExpectedCash = unwrap(cash.getExpectedCash)
export const saveCashCount = unwrap(cash.saveCashCount)
export const getCashCounts = unwrap(cash.getCashCounts)

// reports
export const getDashboard = unwrap(reports.getDashboard)
export const getComparison = unwrap(reports.getComparison)
export const getBestsellers = unwrap(reports.getBestsellers)
export const getPeakTimes = unwrap(reports.getPeakTimes)
export const getMonthlyReport = unwrap(reports.getMonthlyReport)
export const getLowStock = unwrap(reports.getLowStock)
export const getDeadStock = unwrap(reports.getDeadStock)
