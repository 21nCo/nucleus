import { Action } from "@21n/types/action.enum";
import { ActionType, type IAction } from "@21n/types/action.type";
import { memotronActions } from "@nucleum/products/memotron/memotron.actions";
import { pointronActions } from "@nucleum/products/pointron/pointron.actions";
import NucleusLibrary from "@nucleum/products/nucleus/NucleusLibrary.svelte";
import NucleusOverview from "@nucleum/products/nucleus/overview/NucleusOverview.svelte";
import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
import LibraryPanelContentResolver from "@nucleum/components/library/LibraryPanelContentResolver.svelte";
import { Resource } from "@nucleum/datafn/resource.enum";
import NucleusOverviewPanel from "@nucleum/products/nucleus/overview/NucleusOverviewPanel.svelte";
import { AccessMode, ResourceActionType } from "@nucleum/datafn/resource.type";
import { resourceAction } from "@nucleum/datafn/resource.utils";
import { appMenuActionLabelsByAction } from "@nucleum/client/config/product-nav.config";
import ResourceBrowser from "@nucleum/components/library/resourceBrowser/ResourceBrowser.svelte";

const actionsToFilterInSub = [Action.LIBRARY, Action.OVERVIEW];

export const nucleusActions: IAction[] = [
  ...memotronActions.filter(
    (action) => !actionsToFilterInSub.includes(action.action as Action)
  ),
  ...pointronActions.filter(
    (action) => !actionsToFilterInSub.includes(action.action as Action)
  ),
  {
    action: Action.LIBRARY,
    label: appMenuActionLabelsByAction[Action.LIBRARY],
    icon: "library",
    component: LibraryPanelContentResolver,
    panel: NucleusLibrary,
    type: ActionType.PAGE,
    componentParams: {
      defaultResource: Resource.collection
    }
  },
  {
    action: Action.OVERVIEW,
    label: appMenuActionLabelsByAction[Action.OVERVIEW],
    icon: "overview",
    component: NucleusOverview,
    // panel: NucleusOverviewPanel,
    type: ActionType.PAGE
  },
  {
    action: Action.HOME,
    label: appMenuActionLabelsByAction[Action.HOME],
    icon: "home",
    component: ComingSoonView,
    type: ActionType.PAGE
  },
  {
    action: Action.FEED,
    label: "Feed",
    icon: "feed",
    component: ComingSoonView,
    type: ActionType.LIVE,
    accessMode: AccessMode.RIGHT,
    liveActionParams: {
      isOpeningBehaviorConfigurable: true
    }
  },
  {
    action: resourceAction(Resource.space, ResourceActionType.BROWSE),
    label:
      appMenuActionLabelsByAction[
        resourceAction(Resource.space, ResourceActionType.BROWSE)
      ],
    icon: "combination",
    component: ResourceBrowser,
    type: ActionType.PAGE,
    componentParams: {
      resource: Resource.space
    }
  }
];
