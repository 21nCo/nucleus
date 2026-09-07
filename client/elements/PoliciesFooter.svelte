<script lang="ts">
  import context from "@nucleum/stores/context.store";
  import { Action } from "@nucleum/application/commandBar/action.enum";
  import { OperatingSystem } from "@nucleum/client/runtime/context.type";
  import Link from "@21n/elements/text/Link.svelte";
  let {
    pretext = "By signing up, you agree to our",
  }: {
    pretext?: string;
  } = $props();

  const tosLink = $derived(
    $context.isEmbed &&
    ($context.os === OperatingSystem.IOS ||
      $context.os === OperatingSystem.MACOS)
      ? Action.TERMS_OF_SERVICE_APPLE
      : Action.TERMS_OF_SERVICE
  );
</script>

<footer class="px-8">
  <div class="text-b3 text-fgs2 text-center">
    {pretext}
    <Link href={tosLink} label="Terms of Service" />
    and
    <Link href={Action.PRIVACY_POLICY} label="Privacy Policy" />.
  </div>
</footer>
