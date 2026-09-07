import {
  BaseOverviewPanel,
  BaseProduct
} from "@nucleum/schema/product.type";
import { NextOverviewPanel, NextProduct } from "@nucleum/next/product.type";

export { Extension } from "@nucleum/schema/product.type";

export const Product = { ...BaseProduct, ...NextProduct } as const;
export type Product =
  (typeof BaseProduct)[keyof typeof BaseProduct] | NextProduct;

export const OverviewPanel = {
  ...BaseOverviewPanel,
  ...NextOverviewPanel
} as const;
export type OverviewPanel =
  | (typeof BaseOverviewPanel)[keyof typeof BaseOverviewPanel]
  | NextOverviewPanel;
