import { get, writable } from "svelte/store";
import {
  StoreDataType,
  type IObservableStore,
  type IStore
} from "@21n/types/data.type";
import { Resource } from "@nucleum/datafn/resource.enum";

export class ObservableStore<T> implements IObservableStore<T> {
  id: Resource | string;
  dataType: StoreDataType;
  protected subject = writable<T>();
  subscribe = this.subject.subscribe;
  update = this.subject.update;
  protected _set = this.subject.set;
  constructor(
    item: Resource | string,
    dataType: StoreDataType = StoreDataType.NA
  ) {
    this.id = item;
    this.dataType = dataType;
  }
  set(val: T) {
    this._set(val);
  }
  get() {
    return get(this.subject);
  }

  /**
   * This function gets triggered from flux when the data is fetched from the server.
   * @param data
   */
  loader(data: T) {
    this._set({ ...data });
  }
}
