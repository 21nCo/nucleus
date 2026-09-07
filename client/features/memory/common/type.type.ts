import type { IProperty } from "@nucleum/features/collections/properties/property.type";
import type { IAvatar } from "@21n/types/avatar.type";
import type { IResource, IResourceShareable, IResourceStarrable } from "@nucleum/datafn/resource.type";

type TypeBase = IResource & IResourceShareable & Partial<IResourceStarrable> & {
  avatar: IAvatar;
};
export type IType = TypeBase & {
  properties: IProperty[];
};

export type IActiveTypeStore = IType;

export type TypeCreationForm = {
  label: string;
  avatar: string;
  properties: IProperty[];
};

export type TypeLocalRecord = TypeBase;
