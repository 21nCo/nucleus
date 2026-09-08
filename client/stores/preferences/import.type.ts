export enum ImportSource {
  POCKET = "POCKET"
}

export enum StepType {
  UPLOAD = "UPLOAD",
  NON_INTERACTIVE = "NON_INTERACTIVE",
  FIELD_MAPPING = "FIELD_MAPPING"
}

export interface ImportHistoryItem {
  id: string;
  source: ImportSource;
  fileName: string;
  createdAt: Date;
  totalRecords?: {
    nodes: number;
    collections?: number;
  };
  status: "SUCCESS" | "FAILED" | "IN_PROGRESS" | "REVERTED";
}

export interface FieldMappingValue {
  value: string;
  label: string;
  description?: string;
}

export interface FieldMappingField {
  label: string;
  description?: string;
  options: FieldMappingValue[];
  defaultValue: string;
}

export type FieldMappingConfig = Record<string, FieldMappingField>;
