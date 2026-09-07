<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from "svelte";
  import {
    activeSession,
    todayFocusStore
  } from "@nucleum/features/focus/session.store";
  import LeftNavExpandable from "@21n/layout/leftPanel/LeftNavExpandable.svelte";
  import ProfileLeftPanelSection from "@nucleum/components/settings/account/ProfileLeftPanelSection.svelte";

  onMount(() => {
    bootup();
    return () => {
      activeSession.clearIntervals();
    };
  });

  function bootup() {
    // if ($userLocalPreferences?.timerMode == undefined) {
    //   $userLocalPreferences.timerMode = TimerMode.MINIMAL;
    // }
  }
</script>

<LeftNavExpandable>
  {#snippet header()}
    <div class="flex flex-col w-full justify-center items-center gap-4">
      <ProfileLeftPanelSection />
    </div>
  {/snippet}
</LeftNavExpandable>
