import { writable } from "svelte/store";
import type { PointronConstants } from "@nucleum/features/focus/pointronConstants.type";

/**
 * @deprecated
 */
export const swipeLabel = writable("");
export const lastImportTime = writable<number>(Date.now());
export const pointronConstants = initPointronConstants({
  timerModes: ["Minimal", "Journal"],
  focusPlaceholderText: [
    "cooking ice cream",
    "cleaning wordle",
    "coding dishes",
    "showering",
    "draining umbrella",
    "commanding alexa"
  ],
  runningOutDuration: 5,
  gapThreshold: 60
});

function initPointronConstants(seed: PointronConstants) {
  const { subscribe, set, update } = writable<PointronConstants>(seed);
  return {
    subscribe,
    set: (m: PointronConstants) => {
      set(m);
    },
    update
  };
}

export const oasisOidcConfig = {
  authority: "https://auth.oasislabs.com",
  // Replace with your app's frontend client ID.
  client_id: import.meta.env?.VITE_OASIS_CLIENT_ID,
  redirect_uri: `${window.location.origin}/play`,
  response_type: "code",
  scope: "openid profile email parcel.public",
  filterProtocolClaims: false,
  loadUserInfo: false,
  extraQueryParams: {
    audience: "https://api.oasislabs.com/parcel"
  },
  extraTokenParams: {
    audience: "https://api.oasislabs.com/parcel"
  }
};

export const seedSessions = [
  {
    elapsed: 60 * 60,
    focus: 47 * 60,
    brek: 13 * 60,
    extended: 0,
    startTime: new Date(2022, 1, 11, 13),
    endTime: new Date(2022, 1, 11, 14),
    id: new Date(2022, 1, 11, 13).getTime(),
    intention: ""
  },
  {
    elapsed: 60 * 60,
    focus: 47 * 60,
    brek: 13 * 60,
    extended: 0,
    startTime: new Date(2022, 1, 11, 14, 30),
    id: new Date(2022, 1, 11, 14, 30).getTime(),
    endTime: new Date(2022, 1, 11, 17),
    intention: "ID Card insurance project"
  },
  {
    elapsed: 60 * 60,
    focus: 47 * 60,
    brek: 13 * 60,
    extended: 0,
    startTime: new Date(2022, 1, 11, 17),
    id: new Date(2022, 1, 11, 17).getTime(),
    endTime: new Date(2022, 1, 11, 17, 32),
    intention: "de picto"
  },
  {
    elapsed: 60 * 60,
    focus: 47 * 60,
    brek: 13 * 60,
    extended: 0,
    startTime: new Date(2022, 1, 11, 19, 21),
    id: new Date(2022, 1, 11, 19, 21).getTime(),
    endTime: new Date(2022, 1, 11, 23),
    intention: ""
  }
];

export const seedTasks = [
  { label: "first task", estimate: 0, workedFor: 15, checked: true },
  {
    label: "second sdfasdfs task",
    estimate: 35,
    workedFor: 15,
    checked: false,
    isInprogress: true
  },
  { label: "third task", estimate: 35, workedFor: 45, checked: false }
];
