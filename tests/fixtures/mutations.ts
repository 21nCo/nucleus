import { Resource } from "@nucleum/datafn/resource.enum";
import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
import { IMutation, PersistenceActionType } from "@nucleum/schema/legacy/data.type";

export function createMutation(overrides = {}): IMutation {
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    timestamp: Date.now(),
    ...overrides
  };
}

export const mockMutations: IMutation[] = [
  {
    action: ResourceActionType.EDIT,
    createdAt: "2024-12-05T12:50:43.452Z",
    dapId: "m3g2lakvtcj1wzyaf98lj49x",
    id: "cb1d0fed33cc4d83b27060c84caa593a",
    updatedAt: "2024-12-05T12:50:43.452Z",
    params: {
      action: PersistenceActionType.MERGE,
      record: {
        appearance: {
          darkColorSchemeId: "colorscheme:clean_tidyblue_dark",
          isBlurredBgForPopups: false,
          isSyncWithSystem: true,
          lightColorSchemeId: "colorscheme:clean_tidyiris_light",
          skin: "clean",
          theme: "dark"
        },
        id: "kv:globalPreferences"
      }
    },
    resource: Resource.kv,
    resourceId: "kv:globalPreferences",
    timestamp: 1733403043452,
    userId: "user:m34n2ih47rdb5ovwodg8jih7"
  },
  {
    action: ResourceActionType.EDIT,
    createdAt: "2024-12-05T12:50:43.452Z",
    dapId: "m3g2lakvtcj1wzyaf98lj49x",
    id: "mutation:cb1d0fed33cc4d83b27060c84caa593a",
    updatedAt: "2024-12-05T12:50:43.452Z",
    params: {
      action: PersistenceActionType.MERGE,
      record: {
        appearance: {
          darkColorSchemeId: "colorscheme:clean_tidyblue_dark",
          isBlurredBgForPopups: false,
          isSyncWithSystem: true,
          lightColorSchemeId: "colorscheme:clean_tidyiris_light",
          skin: "clean",
          theme: "dark"
        },
        id: "kv:globalPreferences"
      }
    },
    resource: Resource.kv,
    resourceId: "kv:globalPreferences",
    timestamp: 1733403043452,
    userId: "user:m34n2ih47rdb5ovwodg8jih7"
  },
  {
    action: ResourceActionType.EDIT,
    createdAt: "2024-12-05T12:50:43.282Z",
    dapId: "m3g2lakvtcj1wzyaf98lj49x",
    id: "mutation:b1c0852bce6e5d58158e6924e33969a8",
    updatedAt: "2024-12-05T12:50:43.282Z",
    params: {
      action: PersistenceActionType.MERGE,
      record: {
        appearance: {
          darkColorSchemeId: "colorscheme:clean_tidyblue_dark",
          isBlurredBgForPopups: false,
          isSyncWithSystem: true,
          lightColorSchemeId: "colorscheme:clean_tidyblue_light",
          skin: "clean",
          theme: "dark"
        },
        id: "kv:globalPreferences"
      }
    },
    resource: Resource.kv,
    resourceId: "kv:globalPreferences",
    timestamp: 1733403043282,
    userId: "user:m34n2ih47rdb5ovwodg8jih7"
  },
  {
    action: ResourceActionType.EDIT,
    createdAt: "2024-12-05T12:50:43.191Z",
    dapId: "m3g2lakvtcj1wzyaf98lj49x",
    id: "mutation:7d3c52b5bb443ff9ed6e93df9342627e",
    updatedAt: "2024-12-05T12:50:43.191Z",
    params: {
      action: PersistenceActionType.MERGE,
      record: {
        appearance: {
          darkColorSchemeId: "colorscheme:clean_tidyblue_dark",
          isBlurredBgForPopups: false,
          isSyncWithSystem: true,
          lightColorSchemeId: "colorscheme:clean_tidyiris_light",
          skin: "clean",
          theme: "dark"
        },
        id: "kv:globalPreferences"
      }
    },
    resource: Resource.kv,
    resourceId: "kv:globalPreferences",
    timestamp: 1733403043191,
    userId: "user:m34n2ih47rdb5ovwodg8jih7"
  },
  {
    action: ResourceActionType.EDIT,
    createdAt: "2024-12-05T12:50:42.999Z",
    dapId: "m3g2lakvtcj1wzyaf98lj49x",
    id: "mutation:3151c7a6c6eaf798e05cf56a89f30222",
    updatedAt: "2024-12-05T12:50:42.999Z",
    params: {
      action: PersistenceActionType.MERGE,
      record: {
        appearance: {
          darkColorSchemeId: "colorscheme:clean_tidyblue_dark",
          isBlurredBgForPopups: false,
          isSyncWithSystem: true,
          lightColorSchemeId: "colorscheme:clean_tidyblue_light",
          skin: "clean",
          theme: "dark"
        },
        id: "kv:globalPreferences"
      }
    },
    resource: Resource.kv,
    resourceId: "kv:globalPreferences",
    timestamp: 1733403042999,
    userId: "user:m34n2ih47rdb5ovwodg8jih7"
  },
  {
    action: ResourceActionType.EDIT,
    createdAt: "2024-12-05T12:50:42.728Z",
    dapId: "m4au0qy5ra9al26pc2jxs318",
    id: "mutation:c118294fba04085fd7e9b7d334aa22fc",
    updatedAt: "2024-12-05T12:50:42.729Z",
    params: {
      action: PersistenceActionType.MERGE,
      record: {
        appearance: {
          darkColorSchemeId: "colorscheme:clean_tidyblue_dark",
          isBlurredBgForPopups: false,
          isSyncWithSystem: true,
          lightColorSchemeId: "colorscheme:clean_tidyblue_light",
          skin: "clean",
          theme: "dark"
        },
        id: "kv:globalPreferences"
      }
    },
    resource: Resource.kv,
    resourceId: "kv:globalPreferences",
    timestamp: 1733403042729,
    userId: "user:m34n2ih47rdb5ovwodg8jih7"
  },
  {
    action: ResourceActionType.EDIT,
    createdAt: "2024-12-05T12:50:42.633Z",
    dapId: "m4au0qy5ra9al26pc2jxs318",
    id: "mutation:9fcb6ccbc0958d661dbe5985d1a1c236",
    updatedAt: "2024-12-05T12:50:42.633Z",
    params: {
      action: PersistenceActionType.MERGE,
      record: {
        appearance: {
          darkColorSchemeId: "colorscheme:clean_tidyblue_dark",
          isBlurredBgForPopups: false,
          isSyncWithSystem: true,
          lightColorSchemeId: "colorscheme:clean_tidyblue_light",
          skin: "clean",
          theme: "dark"
        },
        id: "kv:globalPreferences"
      }
    },
    resource: Resource.kv,
    resourceId: "kv:globalPreferences",
    timestamp: 1733403042633,
    userId: "user:m34n2ih47rdb5ovwodg8jih7"
  }
];

export const mockMutationWithLargeData: IMutation = {
  resourceId: new Array(51).fill("a"),
  action: ResourceActionType.EDIT,
  createdAt: "2024-12-05T12:50:43.452Z",
  dapId: "m3g2lakvtcj1wzyaf98lj49x",
  id: "mutation:cb1d0fed33cc4d83b27060c84caa593a",
  updatedAt: "2024-12-05T12:50:43.452Z",
  params: {
    action: PersistenceActionType.BULK_MERGE,
    records: [{ data: new Array(51).fill("a") }]
  },
  resource: Resource.node,
  timestamp: 1733403043452,
  userId: "user:m34n2ih47rdb5ovwodg8jih7"
};
