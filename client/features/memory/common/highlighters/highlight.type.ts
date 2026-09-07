export type IHighlighter = {
  id: string;
  label: string;
  color: string;
  isArchived?: boolean;
};

export type IHighlightStore = {
  highlighters: IHighlighter[];
};
