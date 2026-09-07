import { Action } from "@nucleum/application/commandBar/action.enum";
import { ActionType, type IAction } from "@nucleum/application/commandBar/action.type";
import { memotronActions } from "@nucleum/products/memotron/memotron.actions";
import { pointronActions } from "@nucleum/products/pointron/pointron.actions";
import NucleusLibrary from "@nucleum/products/nucleus/NucleusLibrary.svelte";
import NucleusOverview from "@nucleum/products/nucleus/overview/NucleusOverview.svelte";
import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
import LibraryPanelContentResolver from "@nucleum/application/library/LibraryPanelContentResolver.svelte";
import { Resource } from "@nucleum/datafn/resource.enum";
import NucleusOverviewPanel from "@nucleum/products/nucleus/overview/NucleusOverviewPanel.svelte";
import { AccessMode } from "@nucleum/datafn/resource.type";
import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
import { resourceAction } from "@nucleum/datafn/resource.utils";
import { appMenuActionLabelsByAction } from "@nucleum/client/config/product-nav.config";
import ResourceBrowser from "@nucleum/application/library/resourceBrowser/ResourceBrowser.svelte";

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
