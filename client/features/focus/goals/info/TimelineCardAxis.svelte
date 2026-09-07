<script lang="ts">
  import { TimeScale } from "@21n/types/time.type";

  let {
    startDate,
    endDate,
    spanScale = TimeScale.DAYS
  }: {
    startDate: Date;
    endDate: Date;
    spanScale?: TimeScale;
  } = $props();

  const currentDate = new Date();
  const totalDays = $derived(
    Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const points = $derived(getMajorAxisPoints(startDate, endDate, spanScale));

  function getMajorAxisPoints(
    startDate: Date,
    endDate: Date,
    spanScale: TimeScale
  ) {
    const points = [];
    const start = startDate.getTime();
    const end = endDate.getTime();
    const range = end - start;
    const now = currentDate.getTime();

    let majorCount;
    let minorCount;
    let unit;
    let step;

    switch (spanScale) {
      case TimeScale.DAYS:
        step = 24 * 60 * 60 * 1000;
        majorCount = Math.min(totalDays, 5);
        minorCount = totalDays;
        unit = "day";
        break;
      case TimeScale.WEEKS:
        step = 7 * 24 * 60 * 60 * 1000;
        majorCount = Math.min(Math.ceil(totalDays / 14), 5);
        minorCount = Math.ceil(totalDays / 7);
        unit = "week";
        break;
      case TimeScale.MONTHS:
        step = 30 * 24 * 60 * 60 * 1000;
        majorCount = Math.min(Math.ceil(totalDays / 30), 6);
        minorCount = Math.ceil(totalDays / 15);
        unit = "month";
        break;
      case TimeScale.YEARS:
        step = 365 * 24 * 60 * 60 * 1000;
        majorCount = Math.min(Math.ceil(totalDays / 365), 2);
        minorCount = Math.ceil(totalDays / 91.25);
        unit = "year";
        break;
      default:
        step = 24 * 60 * 60 * 1000;
        majorCount = Math.min(Math.ceil(totalDays / 7), 5);
        minorCount = totalDays;
        unit = "week";
    }

    // Generate all points including start and end
    for (let i = 0; i <= minorCount + 1; i++) {
      const position = (i / (minorCount + 1)) * 100;
      const pointTime = start + (range * i) / (minorCount + 1);
      const isMajor =
        i === 0 ||
        i === minorCount + 1 ||
        i % Math.ceil((minorCount + 1) / majorCount) === 0;

      let label = "";
      if (isMajor) {
        if (i === 0) {
          label = "0";
        } else if (i === minorCount + 1) {
          const timeFromStart = range;
          let value = 0;
          switch (unit) {
            case "day":
              value = timeFromStart / (24 * 60 * 60 * 1000);
              break;
            case "week":
              value = timeFromStart / (7 * 24 * 60 * 60 * 1000);
              break;
            case "month":
              value = timeFromStart / (30 * 24 * 60 * 60 * 1000);
              break;
            case "year":
              value = timeFromStart / (365 * 24 * 60 * 60 * 1000);
              break;
          }
          // Format to 1 decimal place if not a whole number
          const formattedValue = Number.isInteger(value)
            ? value.toString()
            : value.toFixed(1);
          label = `${formattedValue} ${unit}${value > 1 ? "s" : ""}`;
        } else {
          const timeFromStart = (range * i) / (minorCount + 1);
          let value = 0;
          switch (unit) {
            case "day":
              value = Math.ceil(timeFromStart / (24 * 60 * 60 * 1000));
              break;
            case "week":
              value = Math.ceil(timeFromStart / (7 * 24 * 60 * 60 * 1000));
              break;
            case "month":
              value = Math.ceil(timeFromStart / (30 * 24 * 60 * 60 * 1000));
              break;
            case "year":
              value = Math.ceil(timeFromStart / (365 * 24 * 60 * 60 * 1000));
              break;
          }
          label = value.toString();
        }
      }

      points.push({
        position,
        label,
        isMajor,
        isPast: pointTime <= now
      });
    }

    return points;
  }
</script>

<div class="h-16 relative">
  <!-- Timeline ruler with past/future distinction -->
  {#if currentDate >= startDate && currentDate <= endDate}
    <div class="absolute inset-x-0 top-8 flex h-0.5">
      <div
        class="bg-fgs3"
        style="width: {((currentDate.getTime() - startDate.getTime()) /
          (endDate.getTime() - startDate.getTime())) *
          100}%"
      ></div>
      <div
        class="bg-brs2"
        style="width: {100 -
          ((currentDate.getTime() - startDate.getTime()) /
            (endDate.getTime() - startDate.getTime())) *
            100}%"
      ></div>
    </div>
  {:else}
    <div class="absolute inset-x-0 top-8 h-0.5 bg-brs2"></div>
  {/if}

  <!-- Major and minor axis points -->
  {#each points as point}
    {@const isPastOrCurrent =
      point.position <=
      ((currentDate.getTime() - startDate.getTime()) /
        (endDate.getTime() - startDate.getTime())) *
        100}
    <div
      class="absolute flex flex-col items-center -translate-x-1/2"
      style="left: {point.position}%"
    >
      <div
        class="w-0.5"
        class:h-4={point.isMajor}
        class:h-2={!point.isMajor}
        class:mt-6={!point.isMajor}
        class:mt-4={point.isMajor}
        class:bg-fgs3={isPastOrCurrent}
        class:bg-brs2={!isPastOrCurrent}
      ></div>
      {#if point.isMajor && point.label}
        <span
          class="text-xs mt-2 whitespace-nowrap"
          class:text-fgs2={isPastOrCurrent}
          class:text-fgs3={!isPastOrCurrent}>{point.label}</span
        >
      {/if}
    </div>
  {/each}

  {#if currentDate >= startDate && currentDate <= endDate}
    <div
      class="absolute top-0 h-10 -translate-x-1/2"
      style="left: {((currentDate.getTime() - startDate.getTime()) /
        (endDate.getTime() - startDate.getTime())) *
        100}%"
    >
      <div class="relative h-full w-0.5 bg-aps1">
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-aps1"
        ></div>
      </div>
    </div>
  {/if}
</div>
