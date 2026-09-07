import { Product } from "@nucleum/products/product.type";
import { resolveDatafnProductResources } from "@nucleum/datafn/datafn.store";

type DatafnBackupRecord = Record<string, unknown>;

export const pointronDatafnBackupResources = resolveDatafnProductResources(
  Product.POINTRON
);

const pointronDatafnBackupResourceNames = new Set<string>(
  pointronDatafnBackupResources
);

function isObjectRecord(value: unknown): value is DatafnBackupRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyArrayValues(value: DatafnBackupRecord) {
  return Object.values(value).every((entry) => Array.isArray(entry));
}

export function isPointronDatafnBackup(value: unknown) {
  if (!isObjectRecord(value)) return false;
  if (value.version !== 1) return false;
  if (!isObjectRecord(value.resources)) return false;
  if (!hasOnlyArrayValues(value.resources)) return false;
  const resourceNames = Object.keys(value.resources);
  return (
    resourceNames.length > 0 &&
    resourceNames.every((resource) =>
      pointronDatafnBackupResourceNames.has(resource)
    )
  );
}

export function resolveDatafnImportErrorCount(value: unknown) {
  if (!isObjectRecord(value)) return 0;
  return Array.isArray(value.errors) ? value.errors.length : 0;
}
