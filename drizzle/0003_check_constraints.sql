ALTER TABLE "customers" ADD CONSTRAINT "customers_due_ok" CHECK ("customers"."due_balance" >= 0);--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amount_ok" CHECK ("expenses"."amount" > 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_ok" CHECK ("payments"."amount" > 0);--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "variants_stock_ok" CHECK ("product_variants"."stock_qty" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_ok" CHECK ("products"."stock_qty" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_prices_ok" CHECK ("products"."cost_price" >= 0 and "products"."sell_price" >= 0);--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_qty_ok" CHECK ("purchases"."qty" > 0);--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_money_ok" CHECK ("purchases"."cost" >= 0 and "purchases"."paid" >= 0);--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_qty_ok" CHECK ("sale_items"."qty" <> 0);--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_price_ok" CHECK ("sale_items"."price" >= 0);--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_payable_ok" CHECK ("suppliers"."payable_balance" >= 0);