import { Resource } from "@nucleum/datafn/resource.enum";
import type { IHighlightStore } from "@nucleum/features/memory/common/highlighters/highlight.type";
import { datafn } from "@nucleum/datafn/datafn.store";
import { get, writable } from "svelte/store";

const seedHighlighters: IHighlightStore = {
  highlighters: [
    { id: "1", label: "Red", color: "#be8686" },
    { id: "2", label: "Orange", color: "#f6e05e" },
    { id: "3", label: "Yellow", color: "#88c0d0" },
    { id: "4", label: "Green", color: "#a3be8c" },
    { id: "5", label: "Cyan", color: "#d08770" }
  ]
};

const highlightSignal = datafn.kv.signal<IHighlightStore>(Resource.highlight, {
  defaultValue: seedHighlighters
});
const highlightLocal = writable<IHighlightStore>(seedHighlighters);

highlightSignal.subscribe((value) => {
  highlightLocal.set(value ?? seedHighlighters);
});

export const highlightStore = {
  subscribe: highlightLocal.subscribe,
  get() {
    return get(highlightLocal);
  },
  resolveColor(id: string) {
    return this.get().highlighters.find((x) => x.id === id)?.color ?? "#f6e05e";
  },

  loader(data: IHighlightStore) {
    highlightLocal.set(data);
    return datafn.kv.set(Resource.highlight, data);
  },

  modify(n: Partial<IHighlightStore>) {
    highlightLocal.update((current) => ({ ...current, ...n }));
    return datafn.kv.merge(Resource.highlight, n);
  },

  destroy() {
    highlightSignal.dispose();
  }
};
