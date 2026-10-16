// User-facing error messages, in one place so wording stays consistent.
export const ERRORS = {
  // auth / access
  loginAgain: "Please log in again",
  ownerOnly: "Owner only",
  notYourShop: "Not your shop",
  // not found
  notFound: "Not found",
  shopNotFound: "Shop not found",
  productNotFound: "Product not found",
  variantNotFound: "Variant not found",
  customerNotFound: "Customer not found",
  userNotFound: "User not found",
  // sales / stock
  notEnoughStock: "Not enough stock",
  notEnoughStockOf: (name: string) => `Not enough stock: ${name}`,
  dueNeedsCustomer: "Pick a customer for the due amount",
  pickVariant: "Pick a variant",
  pickSupplier: "Pick a supplier",
  noVariants: "Product has no variants",
  variantHasStock: "Variant still has stock",
  variantHasSales: "Variant has sales, can't delete",
  tooManyPins: (minutes: number) =>
    `Too many wrong PINs. Try again in ${minutes} min`,
  // money
  moreThanBalance: "More than the balance",
  paidMoreThanTotal: "Paid can't be more than the total",
  // users
  pinRequired: "PIN is required",
  pinTaken: "PIN already used, pick another",
  cantDeactivateSelf: "You can't deactivate yourself",
  needAnOwner: "At least one active owner is needed",
} as const
