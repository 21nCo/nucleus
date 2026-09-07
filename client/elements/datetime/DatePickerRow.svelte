<script lang="ts">
  import { onMount } from "svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";

  let {
    isDateMode = true,
    date = new Date(),
    currentPage = 1,
    density = Size.md,
    onChange = undefined,
    onPageChange = undefined
  }: any = $props();

  let containerWidth = $state(300);
  const minItemWidth = $derived(
    density === Size.sm
      ? 50
      : density === Size.md
        ? 40
        : density === Size.lg
          ? 30
          : 20
  );
  let containerRef = $state<HTMLDivElement>();
  let previousMode = $state(isDateMode);
  let previousDate = $state<Date>(new Date(date));
  let resizeObserver = $state<ResizeObserver>();
  let resizeTimeout = $state<ReturnType<typeof setTimeout> | null>(null);
  let lastResizeWidth = $state(0);

  let viewDate = $state(new Date(date));
  let selectedDate = $state<Date | null>(new Date(date));

  let selectedValue = $state<number | null>(
    selectedDate
      ? isDateMode
        ? selectedDate.getDate()
        : selectedDate.getMonth() + 1
      : null
  );

  const year = $derived(viewDate.getFullYear());
  const month = $derived(viewDate.getMonth() + 1);

  function updateSelectedValue() {
    if (selectedDate) {
      selectedValue = isDateMode
        ? selectedDate.getDate()
        : selectedDate.getMonth() + 1;
    } else {
      selectedValue = null;
    }
  }

  const isSelectedDateVisible = $derived(
    selectedDate &&
      selectedDate.getFullYear() === year &&
      (isDateMode ? selectedDate.getMonth() + 1 === month : true)
  );

  function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
  }

  function emitChange(nextDate: Date) {
    const changeEvent = new CustomEvent<Date>("change", {
      detail: nextDate
    });
    onChange?.(changeEvent);
  }

  function emitPageChange(detail: { page: number; viewDate: Date }) {
    const pageChangeEvent = new CustomEvent<{ page: number; viewDate: Date }>(
      "pageChange",
      { detail }
    );
    onPageChange?.(pageChangeEvent);
  }

  let maxValue = $state(isDateMode ? 31 : 12);
  let itemsPerPage = $state(7);
  let totalPages = $state(Math.ceil(maxValue / itemsPerPage));
  let startValue = $state(1);
  let endValue = $state(Math.min(itemsPerPage, maxValue));
  let actualItemWidth = $state(minItemWidth);

  let items = $state<number[]>(
    Array.from({ length: Math.min(7, maxValue) }, (_, index) => index + 1)
  );

  function updateItems() {
    try {
      maxValue = isDateMode ? getDaysInMonth(month, year) : 12;

      const navButtonsWidth = 80;
      const itemGap = 8;
      const availableWidth = containerWidth
        ? containerWidth - navButtonsWidth
        : 220;

      const maxItemsVisible = Math.max(
        1,
        Math.floor((availableWidth + itemGap) / (minItemWidth + itemGap))
      );

      let targetItemsPerPage;

      if (isDateMode) {
        if (maxItemsVisible >= maxValue) {
          targetItemsPerPage = maxValue;
        } else if (maxItemsVisible >= 14) {
          targetItemsPerPage = maxItemsVisible;
        } else if (maxItemsVisible >= 7) {
          targetItemsPerPage = 7;
        } else if (maxItemsVisible >= 5) {
          targetItemsPerPage = 5;
        } else {
          targetItemsPerPage = Math.max(3, maxItemsVisible);
        }
      } else {
        if (maxItemsVisible >= 12) {
          targetItemsPerPage = 12;
        } else if (maxItemsVisible >= 6) {
          targetItemsPerPage = 6;
        } else if (maxItemsVisible >= 4) {
          targetItemsPerPage = 4;
        } else if (maxItemsVisible >= 3) {
          targetItemsPerPage = 3;
        } else {
          targetItemsPerPage = Math.max(1, maxItemsVisible);
        }
      }

      totalPages = Math.ceil(maxValue / targetItemsPerPage);

      const itemsPerPageFloor = Math.floor(maxValue / totalPages);
      const remainder = maxValue % totalPages;

      itemsPerPage = itemsPerPageFloor + (currentPage <= remainder ? 1 : 0);

      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      if (currentPage < 1) {
        currentPage = 1;
      }

      let itemsInPreviousPages = 0;
      for (let i = 1; i < currentPage; i++) {
        itemsInPreviousPages += itemsPerPageFloor + (i <= remainder ? 1 : 0);
      }

      startValue = itemsInPreviousPages + 1;
      endValue = startValue + itemsPerPage - 1;

      items = [];
      for (let i = startValue; i <= endValue; i++) {
        items.push(i);
      }

      if (items.length > 0) {
        const totalGapWidth = (items.length - 1) * itemGap;
        const availableWidthForItems = availableWidth - totalGapWidth;

        const calculatedWidth = Math.floor(
          availableWidthForItems / items.length
        );

        actualItemWidth = Math.max(minItemWidth, calculatedWidth);
      } else {
        actualItemWidth = minItemWidth;
      }
    } catch (error) {
      console.error("Error updating items:", error);
      maxValue = isDateMode ? getDaysInMonth(month, year) : 12;
      itemsPerPage = Math.min(7, maxValue);
      totalPages = Math.ceil(maxValue / itemsPerPage);
      startValue = 1;
      endValue = Math.min(itemsPerPage, maxValue);

      items = [];
      for (let i = startValue; i <= endValue; i++) {
        items.push(i);
      }

      actualItemWidth = minItemWidth;
    }
  }

  $effect(() => {
    isDateMode;
    year;
    month;
    currentPage;
    containerWidth;
    minItemWidth;
    updateItems();
  });

  function findPageForValue(
    value: number,
    maxVal: number,
    totalPgs: number
  ): number {
    if (value === null || value === undefined) return 1;

    let targetPage = 1;
    let itemsCount = 0;

    for (let i = 1; i <= totalPgs; i++) {
      const itemsOnThisPage =
        Math.floor(maxVal / totalPgs) + (i <= maxVal % totalPgs ? 1 : 0);

      if (value > itemsCount && value <= itemsCount + itemsOnThisPage) {
        targetPage = i;
        break;
      }

      itemsCount += itemsOnThisPage;
    }

    return targetPage;
  }

  $effect(() => {
    if (date && previousDate && date.getTime() !== previousDate.getTime()) {
      viewDate = new Date(date);
      selectedDate = new Date(date);

      updateSelectedValue();

      updateItems();

      if (selectedValue !== null) {
        currentPage = findPageForValue(selectedValue, maxValue, totalPages);
      } else {
        currentPage = 1;
      }

      previousDate = new Date(date);
      updateItems();
    }
  });

  $effect(() => {
    if (previousMode !== isDateMode) {
      updateSelectedValue();

      updateItems();

      if (selectedValue !== null) {
        currentPage = findPageForValue(selectedValue, maxValue, totalPages);
      } else {
        currentPage = 1;
      }

      previousMode = isDateMode;
      emitChange(date);
      updateItems();
    }
  });

  onMount(() => {
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === containerRef) {
            const newWidth = Math.round(entry.contentRect.width);

            if (Math.abs(newWidth - lastResizeWidth) < 10) {
              return;
            }

            if (resizeTimeout) {
              clearTimeout(resizeTimeout);
            }

            resizeTimeout = setTimeout(() => {
              if (newWidth !== containerWidth) {
                const oldSelectedValue = selectedValue;
                const oldItemsPerPage = itemsPerPage;
                lastResizeWidth = newWidth;

                containerWidth = newWidth;

                updateItems();

                const significantChange =
                  Math.abs(oldItemsPerPage - itemsPerPage) > 2;
                const selectedNotVisible =
                  selectedValue !== null &&
                  (selectedValue < startValue || selectedValue > endValue);

                if (significantChange || selectedNotVisible) {
                  if (selectedValue !== null) {
                    currentPage = findPageForValue(
                      selectedValue,
                      maxValue,
                      totalPages
                    );
                    updateItems();
                  }
                }
              }
              resizeTimeout = null;
            }, 150);
          }
        }
      });

      if (containerRef) {
        resizeObserver.observe(containerRef);
        lastResizeWidth = containerRef.clientWidth;
      }
    }

    setTimeout(() => {
      if (!containerWidth || containerWidth < 100) {
        containerWidth = 300;
      }
      lastResizeWidth = containerWidth;

      updateItems();

      if (selectedDate && isSelectedDateVisible && selectedValue !== null) {
        currentPage = findPageForValue(selectedValue, maxValue, totalPages);
        updateItems();
      }
    }, 0);

    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (resizeObserver && containerRef) {
        resizeObserver.unobserve(containerRef);
        resizeObserver.disconnect();
      }
    };
  });

  const canGoNext = $derived(
    currentPage < totalPages ||
      (isDateMode && month < 12) ||
      (isDateMode && month === 12 && year < 9999) ||
      (!isDateMode && year < 9999)
  );
  const canGoPrev = $derived(
    currentPage > 1 ||
      (isDateMode && month > 1) ||
      (isDateMode && month === 1 && year > 1) ||
      (!isDateMode && year > 1)
  );

  let isNavigating = $state(false);

  function handlePrevious() {
    if (canGoPrev) {
      isNavigating = true;

      if (currentPage > 1) {
        currentPage--;
        updateItems();
      } else if (isDateMode && month > 1) {
        const newMonth = month - 1;
        const newYear = year;

        viewDate = new Date(viewDate);
        viewDate.setFullYear(newYear);
        viewDate.setMonth(newMonth - 1);

        updateItems();
        currentPage = totalPages;
        updateItems();
      } else if (isDateMode && month === 1 && year > 1) {
        const newMonth = 12;
        const newYear = year - 1;

        viewDate = new Date(viewDate);
        viewDate.setFullYear(newYear);
        viewDate.setMonth(newMonth - 1);

        updateItems();
        currentPage = totalPages;
        updateItems();
      } else if (!isDateMode && year > 1) {
        viewDate = new Date(viewDate);
        viewDate.setFullYear(year - 1);

        updateItems();
        currentPage = totalPages;
        updateItems();
      }

      emitPageChange({ page: currentPage, viewDate });
      isNavigating = false;
      updateItems();
    }
  }

  function handleNext() {
    if (canGoNext) {
      isNavigating = true;

      if (currentPage < totalPages) {
        currentPage++;
        updateItems();
      } else if (isDateMode && month < 12) {
        const newMonth = month + 1;
        const newYear = year;

        viewDate = new Date(viewDate);
        viewDate.setFullYear(newYear);
        viewDate.setMonth(newMonth - 1);

        currentPage = 1;
        updateItems();
      } else if (isDateMode && month === 12) {
        const newMonth = 1;
        const newYear = year + 1;

        viewDate = new Date(viewDate);
        viewDate.setFullYear(newYear);
        viewDate.setMonth(newMonth - 1);

        currentPage = 1;
        updateItems();
      } else if (!isDateMode) {
        viewDate = new Date(viewDate);
        viewDate.setFullYear(year + 1);

        currentPage = 1;
        updateItems();
      }

      emitPageChange({ page: currentPage, viewDate });
      isNavigating = false;
      updateItems();
    }
  }

  function handleSelect(value: number) {
    if (isNavigating) return;

    const newDate = new Date(viewDate);

    if (isDateMode) {
      newDate.setDate(value);
    } else {
      newDate.setMonth(value - 1);
      newDate.setDate(1);
    }

    selectedDate = newDate;
    date = newDate;
    previousDate = new Date(newDate);

    selectedValue = value;

    emitChange(date);
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
</script>

<div class="flex w-full h-full">
  <div
    class="grid grid-cols-[1fr,auto,1fr] w-full h-full"
    bind:clientWidth={containerWidth}
    bind:this={containerRef}
  >
    <button
      class={cn(
        "flex items-center justify-center h-full shrink-0",
        "hover:bg-bgs2 active:bg-bgs3",
        { "opacity-50 cursor-not-allowed": !canGoPrev }
      )}
      onclick={handlePrevious}
      disabled={!canGoPrev}
    >
      <Icon icon="chevron-left" size={Size.sm} />
    </button>

    <div class="flex justify-center overflow-hidden h-full">
      {#if items && items.length > 0}
        {#each items as item}
          <button
            class={cn(
              "flex items-center justify-center h-full text-b2 shrink-0",
              {
                "bg-aps3 text-aps1":
                  isSelectedDateVisible && selectedValue === item,
                "hover:bg-bgs2-striped active:bg-bgs3":
                  !isSelectedDateVisible || selectedValue !== item
              }
            )}
            style="width: {actualItemWidth}px;"
            onclick={() => handleSelect(item)}
          >
            {isDateMode ? item : months[item - 1]}
          </button>
        {/each}
      {:else}
        <div class="flex items-center justify-center text-fgs3">Loading...</div>
      {/if}
    </div>

    <button
      class={cn(
        "flex items-center justify-center h-full shrink-0",
        "hover:bg-bgs2 active:bg-bgs3",
        { "opacity-50 cursor-not-allowed": !canGoNext }
      )}
      onclick={handleNext}
      disabled={!canGoNext}
    >
      <Icon icon="chevron-right" size={Size.sm} />
    </button>
  </div>
</div>
