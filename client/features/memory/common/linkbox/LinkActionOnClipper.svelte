<script lang="ts">
  import Tag from "@21n/elements/text/Tag.svelte";
  let {
    links = [],
    isLinkboxOpened = $bindable(false)
  }: {
    links?: string[];
    isLinkboxOpened?: boolean;
  } = $props();
</script>
<Tag
  label="Links"
  icon="link"
  isActive={isLinkboxOpened}
  count={links?.length ?? 0}
  isShowExpandFeedbackOnActive={true}
  isRemovable={false}
  onclick={() => (isLinkboxOpened = !isLinkboxOpened)}
/>
