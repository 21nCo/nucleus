import type {
  IResource,
  IResourceArchivable,
  IResourceCaptureV2,
  IResourceStarrable
} from "@nucleum/datafn/resource.type";

export type ICalendarEventValue = {
  notes?: string;
  location?: string;
  startUnix?: number;
  endUnix?: number;
};

export interface ICalendarEvent
  extends IResource, IResourceArchivable, IResourceStarrable {
  event: string;
  label?: string;
  startUnix?: number;
  endUnix?: number;
  value?: ICalendarEventValue;
}

export type ICalendarEventCapture = IResourceCaptureV2<ICalendarEvent> & {
  event?: string;
  label?: string;
  startUnix?: number;
  endUnix?: number;
  value?: ICalendarEventValue;
};
