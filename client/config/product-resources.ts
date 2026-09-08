import type { Product } from "./product.type";
import type { Resource } from "@nucleum/datafn/resource.enum";

let resolveTables: ((product: Product) => readonly Resource[]) | undefined;

/** Supplies product table availability from application configuration. */
export function configureProductResourceTables(resolve: (product: Product) => readonly Resource[]) {
  resolveTables = resolve;
}

/** Resolves current product capabilities without loading product implementations. */
export function productHasResource(product: Product, resource: Resource): boolean {
  if (!resolveTables) throw new Error("Product resources have not been configured");
  return resolveTables(product).includes(resource);
}
