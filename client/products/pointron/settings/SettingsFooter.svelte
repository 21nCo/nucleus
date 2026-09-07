<script>
  import { appStore } from "@nucleum/stores/app.store";
</script>

<div class="flex flex-col justify-center items-center mt-8">
  <!-- <TallyFeedback /> -->
  <div class="flex flex-wrap justify-center text-xs text-fgs3 opacity-50 p-4">
    <div>{$appStore.appData.name} - beta &nbsp</div>
    <div>
      | &nbsp A sub atom from <a href="https://tidigit.com"><u>TIDIGIT</u></a>
      &nbsp
    </div>
    <div>
      | &nbsp Built at&nbsp<a href="https://blank.coop"><u>BLANK.COOP</u></a>
    </div>
  </div>
</div>
