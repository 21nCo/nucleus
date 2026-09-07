

export type NucleumDatafnE2eeSettings = {
  version: 1;
  enabled: boolean;
  recoveryRequired?: "restore-remote";
  keyRef?: string;
  salt?: string;
  iterations?: number;
  wrapIv?: string;
  wrappedDek?: string;
  updatedAt: number;
};

export type NucleumDatafnE2eeState = {
  enabled: boolean;
  unlocked: boolean;
  keyRef: string | null;
};
