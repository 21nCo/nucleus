<script lang="ts">
  import AvatarPicker from "@21n/elements/avatarPicker/AvatarPicker.svelte";
  import {
    AvatarPickerContext,
    AvatarType,
    type IAvatar
  } from "@21n/elements/avatarPicker/avatar.type";
  import { Size } from "@21n/elements/size.enum";
  import AvatarRenderer from "@21n/elements/avatarPicker/AvatarRenderer.svelte";
  import { objIsEmpty } from "@21n/shared-utils/obj.utils";
  import { popover } from "@nucleum/actions/popover.action";
  import { Placement } from "@21n/elements/direction.enum";
  let {
    avatar = $bindable(),
    size = Size.md,
    isInEditMode = false,
    context = AvatarPickerContext.DEFAULT,
    changeCallback = () => {},
    onChange = undefined
  }: any = $props();
  let ref = $state<any>();
  function emitChange(avatarVal: any) {
    const changeEvent = new CustomEvent("change", {
      detail: avatarVal
    });
    onChange?.(changeEvent);
    changeCallback?.(avatarVal);
  }

  function handleAvatarEmitted(avatarVal: any) {
    if (!avatarVal) return;
    if ("color" in avatarVal) {
      avatarVal.type = AvatarType.ICON;
    } else {
      avatarVal.type = AvatarType.EMOJI;
    }
    avatar = avatarVal;
    emitChange(avatarVal);
    closePopover();
  }
  function handleDeleteEmitted() {
    avatar = undefined;
    emitChange(avatar);
    closePopover();
  }

  function closePopover() {
    ref.dispatchEvent(new CustomEvent("hide"));
  }

  function hasAvatarPreview(avatarValue: IAvatar | undefined) {
    if (!avatarValue || objIsEmpty(avatarValue)) return false;
    return (
      ("code" in avatarValue && Boolean(avatarValue.code)) ||
      ("file" in avatarValue && Boolean(avatarValue.file))
    );
  }

  function resolveAvatarPreview(avatarValue: IAvatar | undefined) {
    if (!hasAvatarPreview(avatarValue)) return undefined;
    return avatarValue;
  }
  const avatarPreview = $derived(resolveAvatarPreview(avatar));
</script>

{#if avatar && !isInEditMode}
  <AvatarRenderer {avatar} {size} />
{:else if isInEditMode}
  <button
    class={"flex justify-center items-center w-full h-full text-b1 text-fgs3 rounded-md border border-brs3 border-dashed hover:bg-bgs2 hover:text-fgs2"}
    use:popover={{
      content: AvatarPicker,
      isRenderAsModalForCW: true,
      cwModalPosition: Placement.Top,
      id: "avatar-picker-popover",
      componentProps: {
        avatarClickCallback: handleAvatarEmitted,
        deleteCallback: handleDeleteEmitted,
        closeCallback: closePopover,
        context
      }
    }}
    bind:this={ref}
  >
    {#if avatarPreview}
      <AvatarRenderer avatar={avatarPreview} {size} />
    {:else}
      +
    {/if}
  </button>
{/if}
