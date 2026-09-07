<svelte:options runes={true} />

<script>
  import { appStore } from "@nucleum/stores/app.store";
</script>

{$appStore?.appData?.name ?? ""}
{" v" + ($appStore?.version ?? "") + "." + ($appStore?.build ?? "")}
