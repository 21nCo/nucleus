<script lang="ts">
  import AvatarRenderer from "@21n/elements/avatarPicker/AvatarRenderer.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import type { IAvatar } from "@21n/types/avatar.type";
  import { Size } from "@21n/types/size.enum";
  import {
    type IActiveNode,
    type INode,
    NodeType,
    webNodeTypeList
  } from "@nucleum/features/memory/node/node.type";
  import {
    resolveFileIcon,
    resolveNodeIcon
  } from "@nucleum/features/memory/node/node.utils";
  import NodeFavicon from "@nucleum/features/memory/node/avatar/NodeFavicon.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { resolveAvatar } from "@nucleum/features/collections/collection.utils";
  import {
    CollectionType,
    type ICollectionExpanded
  } from "@nucleum/features/collections/collection.type";
  import { isValidAvatar } from "@21n/elements/avatarPicker/avatar.utils";
  import type { IRecordId } from "@21n/types/data.type";

  type NodeCollectionReference = IRecordId | ICollectionExpanded;
  type NodeAvatarNode =
    | INode
    | (Omit<IActiveNode, "collections"> & {
        collections?: NodeCollectionReference[];
      });

  let {
    node = undefined,
    accessPoint = ResourceAccessPoint.SELF,
    isExpandedContext = false
  }: {
    node?: NodeAvatarNode | undefined;
    accessPoint?: ResourceAccessPoint;
    isExpandedContext?: boolean;
  } = $props();
  let size = $derived(setSize(accessPoint, isExpandedContext));
  const _avatars = $derived.by(() => resolveNodeAvatars());

  function hasResolvedTypes(
    node: NodeAvatarNode
  ): node is NodeAvatarNode & { types: NonNullable<IActiveNode["types"]> } {
    return (
      "types" in node && Array.isArray(node.types) && node.types.length > 0
    );
  }

  function hasCollections(node: NodeAvatarNode): node is NodeAvatarNode & {
    collections: NodeCollectionReference[];
  } {
    return (
      "collections" in node &&
      Array.isArray(node.collections) &&
      node.collections.length > 0
    );
  }

  function hasAvatarFile(
    avatar: IAvatar
  ): avatar is IAvatar & { file: string } {
    return "file" in avatar && typeof avatar.file === "string";
  }

  function isExpandedTypedCollection(
    collection: NodeCollectionReference
  ): collection is ICollectionExpanded {
    return (
      typeof collection === "object" && collection.type === CollectionType.TYPED
    );
  }

  function resolveIconSize(
    accessPoint: ResourceAccessPoint,
    isExpandedContext: boolean
  ): Size.sm | Size.md | Size.lg {
    if (accessPoint === ResourceAccessPoint.SELF && isExpandedContext) {
      return Size.lg;
    }
    return accessPoint === ResourceAccessPoint.MARKDOWN_MENTION
      ? Size.sm
      : Size.md;
  }

  function setSize(
    accessPoint: ResourceAccessPoint,
    isExpandedContext: boolean
  ) {
    switch (accessPoint) {
      case ResourceAccessPoint.MARKDOWN_MENTION:
        return Size.xs;
      case ResourceAccessPoint.SELF:
        if (isExpandedContext) return Size.lg;
        return Size.md;
      default:
        return Size.sm;
    }
  }

  function normalizeAvatars(avatars: IAvatar[] | undefined) {
    return Array.isArray(avatars)
      ? avatars.filter(Boolean).filter(isValidAvatar)
      : [];
  }

  function resolveNodeAvatars() {
    if (!node) return [];
    if (node.avatar) {
      return normalizeAvatars(node.avatar);
    }
    if (hasResolvedTypes(node)) {
      return normalizeAvatars(resolveAvatar(node.types));
    }
    if (hasCollections(node)) {
      return normalizeAvatars(
        resolveAvatar(node.collections.filter(isExpandedTypedCollection))
      );
    }
    return [];
  }
</script>

{#if _avatars && _avatars.length > 0 && !hasAvatarFile(_avatars[0])}
  <span class="flex justify-center items-center">
    <AvatarRenderer avatar={_avatars[0]} {size} />
  </span>
{:else if node && webNodeTypeList.includes(node.contentType)}
  <NodeFavicon {node} size={resolveIconSize(accessPoint, isExpandedContext)} />
{:else if node && node.contentType === NodeType.FILE && accessPoint !== ResourceAccessPoint.SEARCH_RESULT}
  <Icon
    icon={node.file && typeof node.file === "object"
      ? resolveFileIcon(node.file)
      : "file"}
    size={resolveIconSize(accessPoint, isExpandedContext)}
  />
{:else if node && node.contentType}
  <Icon
    icon={resolveNodeIcon(node.contentType)}
    size={resolveIconSize(accessPoint, isExpandedContext)}
  />
{/if}
