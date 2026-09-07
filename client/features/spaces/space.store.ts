import { get, writable } from "svelte/store";
import { Resource } from "@nucleum/datafn/resource.enum";
import { StoreDataType } from "@21n/types/data.type";
import type { Space, SpaceStore } from "@21n/types/space.type";
import { performApiCall } from "@21n/utils/network.utils";

const cachedSpaceInContext = null; // TODO: re-enable retrieveLocally(Resource.spaceInContext) once Dexie is integrated
export const spaceInContext = writable<Space>(cachedSpaceInContext ?? null);

const seedSpaceStore = {
  id: Resource.space,
  dataType: StoreDataType.FIR,
  mutatingResources: [Resource.space],
  refreshOnAppAppear: true,
  spaces: []
};
export const spaceStore = initSpaceStore();
function initSpaceStore() {
  const { subscribe, set, update } = writable<SpaceStore>();
  // dataManager.retrieveCache(Resource.space).then((m) => {
  //   if (!m) {
  //     set(seedSpaceStore);
  //   } else {
  //     set(m);
  //   }
  // });
  const cache = async (n: SpaceStore) => {
    // dataManager.cache({
    //   ...seedSpaceStore,
    //   spaces: n.spaces
    // } as SpaceStore);
  };
  const switchSpace = async (data: any, space: Space) => {
    if (data.id && data.token) {
      localStorage.setItem("token-" + data.id, data.token);
    }
    spaceInContext.set(space);
    localStorage.setItem(Resource.spaceInContext, JSON.stringify(space));
    //modalEvent.hideSpecific(GatheryEvent.SPACE_BROWSER);
    return true;
  };
  return {
    subscribe,
    set,
    update,
    refresh: async () => {
      const response = await performApiCall("space/n/action", "POST", {
        action: "get_all"
      });
      if (response?.ok) {
        const data = await response.json();
        update((n) => {
          n.spaces = data.map(
            (x: { role: string; details: any; id: string }) => {
              //TODO - replace name with label on db
              return { ...x.details, role: x.role, id: x.id };
            }
          );
          cache(n);
          return n;
        });
      }
    },
    createSpace: async (name: string) => {
      const response = await performApiCall("space/n/action", "POST", {
        action: "create",
        name
      });
      if (response?.ok) {
        const data = await response.json();
        if (!data) return;
        switchSpace(data, { id: data.id, label: data.name } as Space);
        update((n) => {
          n.spaces = [...n.spaces, { id: data.id, label: data.name, slug: "" }];
          cache(n);
          return n;
        });
      }
    },
    switchToSpace: async (id: string) => {
      const space = get(spaceStore).spaces.find((x) => x.id === id);
      if (!space) return;
      const response = await performApiCall("space/n/action", "POST", {
        action: "switch",
        id: space.id
      });
      if (response?.ok) {
        const data = await response.json();
        console.log("switch response:", { data });
        return switchSpace(data, space);
      }
    }
  };
}
