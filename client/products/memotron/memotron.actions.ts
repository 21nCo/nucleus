import { ActionType, type IAction } from "@nucleum/application/commandBar/action.type";
import { Orientation, Placement } from "@21n/elements/direction.enum";
import { Size } from "@21n/elements/size.enum";
import Capture from "@nucleum/features/memory/capture/Capture.svelte";
import Node from "@nucleum/features/memory/node/Node.svelte";
import NodeLoadingPulse from "@21n/elements/feedback/animations/NodeLoadingPulse.svelte";
import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
import SideNavCombination from "@nucleum/features/spaces/combination/SideNavCombination.svelte";
import { Resource } from "@nucleum/datafn/resource.enum";
import MemotronLibrary from "@nucleum/products/memotron/library/MemotronLibrary.svelte";
import { MemotronAction } from "@nucleum/features/memory/memory-action.enum";
import { AccessMode } from "@nucleum/datafn/resource.type";
import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
import { resourceAction } from "@nucleum/datafn/resource.utils";
import PasteConfirmationModal from "@nucleum/features/memory/capture/PasteConfirmationModal.svelte";
import Chat from "@nucleum/products/memotron/taco/Chat.svelte";
import CaptureDnD from "@nucleum/features/memory/capture/CaptureDnD.svelte";
import MemotronOnboarding from "@nucleum/products/memotron/base/MemotronOnboarding.svelte";
import NodeTitleLabelPart from "@nucleum/features/memory/node/title/NodeTitleLabelPart.svelte";
import MemotronGreenUse from "@nucleum/products/memotron/base/MemotronGreenUse.svelte";
import CalloutSettings from "@nucleum/features/memory/markdown/callout/CalloutSettings.svelte";
import ResourceBrowser from "@nucleum/application/library/resourceBrowser/ResourceBrowser.svelte";
import MemotronOverview from "@nucleum/products/memotron/overview/MemotronOverview.svelte";
import { Action } from "@nucleum/application/commandBar/action.enum";
import ImportAppData from "@nucleum/products/memotron/import/ImportAppData.svelte";
import MemotronImportSettings from "@nucleum/products/memotron/import/MemotronImportSettings.svelte";
import MemotronHomeOnMobile from "@nucleum/products/memotron/home/MemotronHomeOnMobile.svelte";
import EditCaptureShortcuts from "@nucleum/features/memory/capture/EditCaptureShortcuts.svelte";
import CaptureSettings from "@nucleum/features/memory/capture/CaptureSettings.svelte";
import LinkTagsControlPanel from "@nucleum/features/memory/linking/LinkTagsControlPanel.svelte";
import LibraryPanelContentResolver from "@nucleum/application/library/LibraryPanelContentResolver.svelte";
import PreviewImageUploader from "@nucleum/features/memory/node/PreviewImageUploader.svelte";
import NodeSettings from "@nucleum/features/memory/node/NodeSettings.svelte";
import { appMenuActionLabelsByAction } from "@nucleum/client/config/product-nav.config";

export const memotronActions: IAction[] = [
  {
    action: MemotronAction.PREVIEW_IMAGE_UPLOADER,
    type: ActionType.MODAL,
    isMeta: true,
    component: PreviewImageUploader,
    modalParams: {
      layout: {
        size: Size.md,
        orientation: Orientation.Vertical,
        isShowCantileverClose: true
      }
    }
  },
  {
    action: Action.MOBILEHOME,
    component: MemotronHomeOnMobile,
    type: ActionType.PAGE,
    isMeta: true,
    isMenuHidden: true
  },
  {
    action: MemotronAction.OPEN_CHAT,
    component: Chat,
    type: ActionType.MODAL,
    isInactive: true,
    modalParams: {
      layout: {
        size: Size.xxl,
        orientation: Orientation.Horizontal,
        ignoreSafeArea: true,
        isShowClose: true,
        alignment: Placement.Right
      },
      title: "Taco"
    }
  },
  {
    action: resourceAction(Resource.node, ResourceActionType.CREATE),
    component: Capture,
    label:
      appMenuActionLabelsByAction[
        resourceAction(Resource.node, ResourceActionType.CREATE)
      ],
    icon: "mynaui:plus-hexagon",
    type: ActionType.LIVE,
    accessMode: AccessMode.MAIN
  },
  {
    action: MemotronAction.CAPTURE_DND,
    component: CaptureDnD,
    isMeta: true,
    type: ActionType.RESOURCE,
    accessMode: AccessMode.POP,
    modalParams: {
      layout: {
        size: Size.xxl,
        orientation: Orientation.Horizontal,
        ignoreSafeArea: true,
        isShowCantileverClose: true,
        isShowBackButton: false
      }
    }
  },
  {
    action: MemotronAction.CAPTURE_SECONDARY,
    component: Capture,
    isMeta: true,
    type: ActionType.RESOURCE,
    accessMode: AccessMode.POP,
    modalParams: {
      layout: {
        size: Size.xxl,
        orientation: Orientation.Horizontal,
        ignoreSafeArea: true,
        isShowCantileverClose: true,
        isShowBackButton: false
      }
    }
  },
  {
    action: MemotronAction.SERENDIPITY,
    component: ComingSoonView,
    type: ActionType.MODAL,
    isInactive: true,
    modalParams: {
      layout: {
        size: Size.xl,
        ignoreSafeArea: true
      }
    }
  },
  {
    action: Resource.node,
    component: Node,
    label: "Node",
    isMeta: true,
    type: ActionType.MODAL,
    loadingComponent: NodeLoadingPulse,
    resourceLabelRenderer: NodeTitleLabelPart,
    modalParams: {
      layout: {
        size: Size.xxl,
        orientation: Orientation.Horizontal,
        ignoreSafeArea: true,
        isShowCantileverClose: true,
        isShowBackButton: true
      }
    }
  },
  {
    action: resourceAction(Resource.node, ResourceActionType.BROWSE),
    component: ResourceBrowser,
    label: "Nodes",
    icon: "hexagon",
    type: ActionType.PAGE,
    loadingComponent: NodeLoadingPulse,
    componentParams: {
      resource: Resource.node
    }
  },
  {
    action: Resource.space,
    type: ActionType.MODAL,
    component: SideNavCombination,
    accessMode: AccessMode.POP,
    modalParams: {
      layout: {
        size: Size.xxl,
        orientation: Orientation.Horizontal,
        ignoreSafeArea: true,
        isShowCantileverClose: true,
        isShowBackButton: true
      }
    }
  },
  {
    action: MemotronAction.LIBRARY,
    label: appMenuActionLabelsByAction[Action.LIBRARY],
    icon: "library",
    component: LibraryPanelContentResolver,
    panel: MemotronLibrary,
    type: ActionType.PAGE,
    componentParams: {
      defaultResource: Resource.node
    },
    modalParams: {
      layout: {
        size: Size.lg,
        orientation: Orientation.Horizontal
      }
    }
  },
  {
    action: "serendipity",
    type: ActionType.MODAL,
    label: "Serendipity",
    isInactive: true,
    icon: "light-bulb",
    component: ComingSoonView
  },
  {
    action: MemotronAction.PASTE_CONFIRMATION,
    type: ActionType.MODAL,
    isMeta: true,
    component: PasteConfirmationModal,
    modalParams: {
      layout: {
        ignoreSafeArea: true,
        size: Size.md
      }
    }
  },
  {
    action: resourceAction(Resource.relation, ResourceActionType.BROWSE),
    type: ActionType.PAGE,
    label: "Relations",
    icon: "relation",
    component: ResourceBrowser,
    componentParams: {
      resource: Resource.relation
    }
  },
  {
    action: MemotronAction.RELATIONS_AS_SETTINGS,
    type: ActionType.PAGE,
    label: "Relations",
    isMeta: true,
    icon: "relation",
    component: LinkTagsControlPanel
  },
  {
    action: Action.OVERVIEW,
    type: ActionType.PAGE,
    label: appMenuActionLabelsByAction[Action.OVERVIEW],
    icon: "overview",
    component: MemotronOverview
  },
  {
    action: "onboarding",
    type: ActionType.PAGE,
    isMeta: true,
    isMenuHidden: true,
    label: "Onboarding",
    icon: "ph:rocket",
    component: MemotronOnboarding
  },
  {
    action: "green",
    type: ActionType.PAGE,
    isMeta: true,
    label: "Green usage",
    icon: "ph:leaf-light",
    component: MemotronGreenUse
  },
  {
    action: MemotronAction.CALLOUT_SETTINGS,
    type: ActionType.MODAL,
    label: "Callout Settings",
    component: CalloutSettings,
    modalParams: {
      title: "Callout Settings",
      layout: {
        orientation: Orientation.Vertical,
        size: Size.lg,
        isOveriddenFooter: true
      }
    }
  },
  {
    action: MemotronAction.IMPORT_APP_DATA,
    isMeta: true,
    type: ActionType.MODAL,
    component: ImportAppData,
    modalParams: {
      layout: {
        size: Size.lg,
        orientation: Orientation.Horizontal,
        isShowCantileverClose: true
      }
    }
  },
  {
    action: Action.IMPORT_FROM_OTHER_APPS,
    label: "Import from other apps",
    type: ActionType.MODAL,
    component: MemotronImportSettings,
    modalParams: {
      layout: {
        size: Size.xl,
        orientation: Orientation.Horizontal,
        isShowCantileverClose: true
      }
    }
  },
  {
    action: MemotronAction.EDIT_CAPTURE_SHORTCUTS,
    label: "Edit Capture Shortcuts",
    type: ActionType.MODAL,
    component: EditCaptureShortcuts,
    modalParams: {
      title: "Capture Shortcuts",
      layout: {
        size: Size.lg,
        orientation: Orientation.Vertical,
        isShowCantileverClose: true
      }
    }
  },
  {
    action: MemotronAction.CAPTURE_SETTINGS,
    label: "Capture Settings",
    type: ActionType.MODAL,
    component: CaptureSettings,
    modalParams: {
      title: "Capture Settings",
      layout: {
        size: Size.lg,
        orientation: Orientation.Vertical,
        isShowCantileverClose: true
      }
    }
  },
  {
    action: MemotronAction.NODE_SETTINGS,
    label: "Node Settings",
    type: ActionType.MODAL,
    component: NodeSettings,
    modalParams: {
      title: "Node Settings",
      layout: {
        size: Size.md,
        orientation: Orientation.Vertical,
        isShowCantileverClose: true
      }
    }
  }
];
