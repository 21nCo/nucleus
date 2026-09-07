<script lang="ts">
  let {
    header,
    data,
    date
  }: {
    header: string;
    data: string;
    date: string;
  } = $props();
</script>

<div
  data-date={date}
  class="flex-shrink-0 text-fgs1 h-full border-r w-[33%] border-brs2"
>
  <div class="pt-2 w-full text-center border-b border-brs3">{header}</div>
  <div class="p-2 w-full">
    {data}
  </div>
</div>
