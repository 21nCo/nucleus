import type { Component } from "svelte";
import type { Arrangement } from "@21n/elements/direction.enum";
import type { Size } from "@21n/elements/size.enum";
import type { Resource } from "@nucleum/datafn/resource.enum";
import type {
  AccessMode,
  ResourceAccessPoint,
  ResourceAccessPointState
} from "@nucleum/datafn/resource.type";

/** Presentation inputs for heterogeneous DataFn records supplied by capabilities. */
export interface RecordListProps {
  data?: any[];
  resource?: Resource;
  arrangement?: Arrangement;
  defaultAccessMode?: AccessMode;
  size?: Size.sm | Size.md;
  accessPoint?: ResourceAccessPoint;
  accessPointState?: ResourceAccessPointState;
  isPreventDefault?: boolean;
  width?: number;
  isShowLoadingPulseAtTheEnd?: boolean;
  isShowBottomSpacer?: boolean;
  visibleProps?: any[];
  onClick?: (event: CustomEvent<any>) => void;
}

let renderer: Component<RecordListProps> | undefined;

/** Supplies the application's mixed-capability record renderer before mounting views. */
export function configureRecordRenderer(value: Component<RecordListProps>) {
  renderer = value;
}

/** Resolves record presentation without importing application composition into features. */
export function requireRecordRenderer(): Component<RecordListProps> {
  if (!renderer) throw new Error("Record renderer has not been configured");
  return renderer;
}
