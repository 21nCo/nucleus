<script lang="ts">
  import type { Snippet } from "svelte";
  import { renderMdAsHtml } from "@nucleum/features/memory/markdown/markdown.utils";
  import {
    ButtonStyle,
    ButtonVariant,
    type IButtonParams
  } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";
  import { InfoTextType } from "@21n/elements/text/info.type";
  import { bg, cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import Link from "@21n/elements/text/Link.svelte";
    let {
    content = undefined,
    icon = undefined,
    isIconFilled = false,
    type = InfoTextType.INFO,
    action = undefined,
    parentBgIndex = 1,
    size = Size.md,
    children = undefined
  }: {
    content?: string | undefined;
    icon?: string | undefined;
    isIconFilled?: boolean;
    type?: InfoTextType;
    action?: IButtonParams | undefined;
    parentBgIndex?: number;
    size?: Size.sm | Size.md;
    children?: Snippet | undefined;
  } = $props();
</script>

<div
  class={cn(
    "flex w-full",
    {
      "items-center gap-1 text-b3": size === Size.sm,
      "p-4 items-start text-b2 rounded-md gap-3": size === Size.md
    },
    size === Size.md && {
      [bg(parentBgIndex)]:
        type === InfoTextType.INFO || type === InfoTextType.TIP,
      "bg-ars2 text-ars1": type === InfoTextType.ERROR,
      "bg-ass1 dark:bg-ass2 text-bgs1": type === InfoTextType.WARNING
    },
    size === Size.sm && {
      "text-fgs3": type === InfoTextType.INFO || type === InfoTextType.TIP,
      "text-ars1": type === InfoTextType.ERROR,
      "text-ass1": type === InfoTextType.WARNING
    }
  )}
>
  <Icon
    icon={icon ?? (type === InfoTextType.ERROR ? "help" : type)}
    isFilled={isIconFilled}
    class={cn(
      size === Size.md && {
        "stroke-ars1": type === InfoTextType.ERROR,
        "stroke-fgs1": type === InfoTextType.INFO || type === InfoTextType.TIP,
        "stroke-bgs1": type === InfoTextType.WARNING
      },
      size === Size.sm && {
        "text-fgs2": type === InfoTextType.INFO || type === InfoTextType.TIP,
        "text-ars1": type === InfoTextType.ERROR,
        "text-ass1": type === InfoTextType.WARNING
      }
    )}
    {size}
  />
  <div class="flex flex-col items-start gap-2">
    {#if content}
      <div class="text-left">
        {@html renderMdAsHtml(content)}
      </div>
    {:else}
      {@render children?.()}
    {/if}
    {#if action}
      <div class="text-b3">
        {#if action.action}
          <Link label={action.label ?? "Learn more"} href={action.action} />
        {:else}
          <Button
            size={action.size ?? Size.xs}
            label={action.label}
            type={type === InfoTextType.ERROR
              ? ButtonVariant.DANGER
              : ButtonVariant.PRIMARY}
            style={ButtonStyle.OUTLINED}
            onclick={() => {
              if (action.callback) action.callback();
            }}
          />
        {/if}
      </div>
    {/if}
  </div>
</div>
