

export type OptimisticKvEntry = {
  token: symbol;
  value: unknown;
};

export type OptimisticKvEntries = Map<string, OptimisticKvEntry[]>;
