<script>
  import { renderMdAsHtml } from "@nucleum/features/memory/markdown/markdown.utils";
</script>

<div class="flex flex-col gap-4 pb-32">
  <span class="text-left">
    As a concious organization, however small it is, we are commited to make
    every single effort to help preserve the habitability of the planet. Please
    join us by using Memotron in a green way. Read the suggestions below to
    become part of our mission.
  </span>
  <div class="flex flex-col gap-4 bg-bgs2 rounded-md p-4">
    <div class="flex flex-col gap-2 text-left">
      <span class="text-fgs1 text-h4">1. Use the offline version</span>
      <span class="text-fgs3 text-b2">
        If you are going to use Memotron on a single device, please download and
        use the full offline version of our app. The offline version does not
        require any internet connection or signup. It helps reduce the carbon
        emissions involved with data transfer for syncing your data continuously
        to the cloud and storing your data on the cloud.
      </span>
    </div>
  </div>
  <div class="flex flex-col gap-4 bg-bgs2 rounded-md p-4">
    <div class="flex flex-col gap-2 text-left">
      <span class="text-fgs1 text-h4">2. Use on-device AI</span>
      <span class="text-fgs3 text-b2">
        {@html renderMdAsHtml(
          `Using on-device AI is the most efficient way to use AI on Memotron. We are working on improving our local AI and would love your feedback. Please join our **Discord** and help us make Memotron greener.`
        )}
      </span>
    </div>
  </div>
  <span class="text-fgs3 text-b2">
    If you have any other suggestions, please let us know :).
  </span>
</div>
