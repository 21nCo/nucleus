<script lang="ts">
  import SubAtomLogo from "@21n/branding/SubAtomLogo.svelte";
  let { status = "" }: { status?: string } = $props();
  void status;
</script>

<div class="flex flex-col w-full h-full justify-center items-center">
  <SubAtomLogo />
  <div class="text-h3 font-medium">Login successful.</div>
  <div class="text-fgs2">You can close this tab now.</div>
</div>
