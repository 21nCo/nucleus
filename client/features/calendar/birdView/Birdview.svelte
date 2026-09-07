<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import RollerPicker from "@nucleum/features/calendar/birdView/RollerPicker.svelte";
  import Zone from "@nucleum/features/calendar/birdView/Zone.svelte";
  import {
    type ProgrammedHorizontalWheelEvent,
    type ProgrammedVerticalWheelEvent,
    type YearPhase
  } from "@nucleum/features/calendar/birdView/Birdview.type";
  import {
    currentMonthIndex,
    currentYear,
    scrollDateSlotIntoView,
    monthNames,
    currentDate,
    getISOfromDateString,
    getFirstAlphabetPosition
  } from "@nucleum/features/calendar/birdView/Birdview.utils";
  import Day from "@nucleum/features/calendar/birdView/Day.svelte";
  import Month from "@nucleum/features/calendar/birdView/Month.svelte";
  import Year from "@nucleum/features/calendar/birdView/Year.svelte";
  import { debouncer } from "@21n/utils/utils";
  import { TimeScaleUnit } from "@21n/types/time.type";

  let {
    mode = TimeScaleUnit.DAY,
    birthdate = new Date(1995, 3, 10),
    groupByBirthdate = true,
    yearPhases = []
  }: {
    mode?: TimeScaleUnit;
    birthdate?: Date | string;
    groupByBirthdate?: boolean;
    yearPhases?: YearPhase[];
  } = $props();

  let startX = $state(0);
  let instaceId = $state(new Date().getTime());
  let handleDaysWheelEvent = (
    e: WheelEvent | ProgrammedVerticalWheelEvent
  ) => {};
  let handleMonthsWheelEvent = (
    e: WheelEvent | ProgrammedVerticalWheelEvent
  ) => {};
  let handleYearsWheelEvent = (
    e: WheelEvent | ProgrammedVerticalWheelEvent
  ) => {};
  let reverseScrollInAction = $state(false);
  let reverseScrollCheckInterval: ReturnType<typeof setInterval> | null = null;
  let isNotToday = $state(false);
  let isMouseWheelMoveEnabled = $state(false);
  let prevScrollLeft = $state(0);
  let prevScrollWidth = $state(0);
  let panelsContainer: HTMLDivElement;
  let dateInViewForward = $state("");
  let dateInViewReverse = $state("");
  let prevDateInViewReverse = $state<string | null>(null);
  let prevDateInViewForward = $state<string | null>(null);
  let engadged = $state(false);
  let startPoint = $state<any>(null);
  let thresholdCrossed = $state(false);
  let cursorDirection = $state<"right" | "left" | "bidirectional" | "default">(
    "default"
  );
  const zones = [
    "6am-9am",
    "9am-12pm",
    "12pm-3pm",
    "3pm-6pm",
    "6pm-9pm",
    "9pm-12am"
  ];
  let zonesData = $state([] as { date: string; data: string[] }[]);
  zonesData = generateZonesData(new Date().toISOString());
  let daysData = $state(generateDaysData(currentYear, currentMonthIndex));
  let monthsData = $state(generateMonthsData(currentYear));
  let yearsData = $state(generateYearsData(currentYear));

  function generateYearsData(centerYear: number) {
    try {
      let i = centerYear - 5;
      let data = [];
      for (; i <= centerYear + 5; i++) {
        data.push(i);
      }
      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  function generateMonthsData(year: number) {
    try {
      let i = year - 1;
      let data = [];
      for (; i <= year + 1; i++) {
        data.push(i);
      }
      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  function generateDaysData(year: number, month: number) {
    try {
      let data = [];
      // Increment month to get the "next" month (the one we want to center on)
      const targetMonth = month + 1 > 11 ? 0 : month + 1;
      // Calculate starting month (2 months before target, wrapping around)
      const startMonth = targetMonth >= 2 ? targetMonth - 2 : targetMonth + 10;

      // Iterate through 3 consecutive months
      for (let i = 0; i < 3; i++) {
        const currentMonth = (startMonth + i) % 12;
        // Calculate the year for this month based on whether we've crossed year boundaries
        let relevantYear: number;
        if (targetMonth === 0) {
          // Target is January (next year)
          if (currentMonth === 0) {
            relevantYear = year + 1; // January of next year
          } else {
            relevantYear = year; // November/December of current year
          }
        } else if (targetMonth === 1 && currentMonth === 11) {
          // Target is February, current is December (previous year)
          relevantYear = year - 1;
        } else {
          relevantYear = year;
        }

        const daysInMonth = new Date(
          Date.UTC(relevantYear, currentMonth + 1, 0)
        ).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(Date.UTC(relevantYear, currentMonth, day))
            .toISOString()
            .split("T")[0];
          data.push(date);
        }
      }
      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  function generateZonesData(centerDateString: string) {
    try {
      const centerDate = new Date(centerDateString);
      const numberOfDays = 7;
      const daysBeforeAfter = Math.floor(numberOfDays / 2);
      const startDate = new Date(centerDate);
      startDate.setDate(centerDate.getDate() - daysBeforeAfter);

      let data = [];
      for (let i = 0; i < numberOfDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];
        const dataEntry = {
          date: dateStr,
          data: ["0", "1", "2", "3", "4", "5"]
        };
        data.push(dataEntry);
      }
      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async function scrollLookAlike(isPositive: boolean) {
    let offset: number;
    const panelItemWidth = panelsContainer.children[0].clientWidth;
    const itemsToMove = 1;
    if (isPositive) offset = itemsToMove * panelItemWidth;
    else offset = -itemsToMove * panelItemWidth;
    // for (let i = 0; i < panelItemWidth; i += Math.abs(offset)) {
    //   panelsContainer.scrollLeft += offset;
    //   await tick();
    // }
    panelsContainer.scrollBy({ left: offset, behavior: "smooth" });
  }

  const addZoneDataEnd = (): Promise<void> =>
    new Promise(async (resolve, reject) => {
      let temp = new Date(zonesData[zonesData.length - 1].date);
      let date: any = new Date(temp.getTime() + 24 * 60 * 60 * 1000);
      date = date.toISOString().split("T")[0];
      zonesData = [
        ...zonesData,
        {
          date: `${date}`,
          data: (await getDummyDataAfterDelay()) as string[]
        }
      ];
      prevScrollWidth = panelsContainer.scrollWidth;
      resolve();
    });

  function adjustScrollOnDataAdditionStart() {
    let scrollWidthDiff = panelsContainer.scrollWidth - prevScrollWidth;
    panelsContainer.scrollLeft += scrollWidthDiff;
    prevScrollWidth = panelsContainer.scrollWidth;
  }
  function getDummyDataAfterDelay() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(["0", "1", "2", "3", "4", "5"]);
      }, 500);
    });
  }
  const addZoneDataStart = (): Promise<void> =>
    new Promise(async (resolve, reject) => {
      reverseScrollInAction = true;
      let temp = new Date(zonesData[0].date);
      let date: any = new Date(temp.getTime() - 24 * 60 * 60 * 1000);
      date = date.toISOString().split("T")[0];
      zonesData = [
        {
          date: `${date}`,
          data: (await getDummyDataAfterDelay()) as string[]
        },
        ...zonesData
      ];
      await tick();
      adjustScrollOnDataAdditionStart();
      resolve();
      reverseScrollInAction = false;
    });

  const addFewDaysToStart = (days: number): Promise<void> =>
    new Promise(async (resolve, reject) => {
      reverseScrollInAction = true;
      let prevScrollLeft = panelsContainer.scrollLeft;
      const panelItemWidth = panelsContainer.children[0].clientWidth;
      if (panelsContainer.scrollWidth - panelItemWidth > prevScrollLeft)
        panelsContainer.scrollLeft = prevScrollLeft + panelItemWidth + 1;
      scrollLookAlike(false);
      let earliestDate = daysData[0];
      let [year, month, day] = earliestDate.split("-").map(Number);
      month = month - 1;
      for (let i = 1; i <= days; i++) {
        let date = new Date(Date.UTC(year, month, day - i));
        let newDateStr = date.toISOString().split("T")[0];
        daysData.pop();
        daysData.unshift(newDateStr);
      }
      daysData = daysData;
      await tick();
      resolve();
      reverseScrollInAction = false;
    });

  const addFewDaysToEnd = (days: number): Promise<void> =>
    new Promise(async (resolve, reject) => {
      let prevScrollLeft = panelsContainer.scrollLeft;
      const prevScrollWidth = panelsContainer.scrollWidth;
      const panelItemWidth = panelsContainer.children[0].clientWidth;
      if (panelsContainer.scrollWidth - panelItemWidth > prevScrollLeft)
        panelsContainer.scrollLeft = prevScrollLeft - panelItemWidth + 1;
      scrollLookAlike(true);
      let latestDate = daysData[daysData.length - 1];
      let [year, month, day] = latestDate.split("-").map(Number);
      month = month - 1;
      for (let i = 2; i <= days + 1; i++) {
        let date = new Date(year, month, day + i);
        let newDateStr = date.toISOString().split("T")[0];
        daysData.push(newDateStr);
        daysData.shift();
      }
      daysData = daysData;
      await tick();
      resolve();
    });
  const debouncedReverseScrollInAction = debouncer(
    () => (reverseScrollInAction = false),
    500
  );
  const addMonthDataStart = (): Promise<void> =>
    new Promise(async (resolve, reject) => {
      //TODO-remove Timeout when await based api data addition is added in all data addition locations
      reverseScrollInAction = true;
      setTimeout(async () => {
        monthsData = [monthsData[0] - 1, ...monthsData];
        if (monthsData.length > 12) monthsData.pop();
        await tick();
        adjustScrollOnDataAdditionStart();
        debouncedReverseScrollInAction();
        resolve();
      }, 500);
    });
  const addMonthDataEnd = (): Promise<void> =>
    new Promise(async (resolve, reject) => {
      monthsData = [...monthsData, monthsData[monthsData.length - 1] + 1];
      resolve();
    });

  const addYearDataStart = (): Promise<void> =>
    new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        yearsData = [yearsData[0] - 1, ...yearsData];
        await tick();
        adjustScrollOnDataAdditionStart();
        resolve();
      }, 500);
    });
  const addYearDataEnd = (): Promise<void> =>
    new Promise(async (resolve, reject) => {
      yearsData = [...yearsData, yearsData[yearsData.length - 1] + 1];
      resolve();
    });
  function waitForReverseScrollInAction(): Promise<void> {
    return new Promise((resolve) => {
      if (reverseScrollCheckInterval) {
        clearInterval(reverseScrollCheckInterval);
      }

      reverseScrollCheckInterval = setInterval(() => {
        if (!reverseScrollInAction) {
          if (reverseScrollCheckInterval) {
            clearInterval(reverseScrollCheckInterval);
            reverseScrollCheckInterval = null;
          }
          resolve();
        }
      }, 200);
    });
  }
  async function handlePanelScroll(
    e: WheelEvent | ProgrammedHorizontalWheelEvent
  ) {
    return new Promise<void>(async (resolve, reject) => {
      if (e instanceof WheelEvent) e.preventDefault();
      prevScrollWidth = panelsContainer.scrollWidth;
      checkVisibility();
      let deltaX;
      if (e.deltaX == undefined) {
        if (prevScrollLeft < panelsContainer.scrollLeft) {
          deltaX = 1;
        } else {
          deltaX = -1;
        }
      } else {
        deltaX = e.deltaX;
      }
      if (deltaX > 0) {
        if (!("isWheelEvent" in e) || e.isWheelEvent == true) {
          if (mode != TimeScaleUnit.DAY) scrollLookAlike(true);
          if (reverseScrollInAction) {
            await waitForReverseScrollInAction();
            checkVisibility();
          }
          if (mode == TimeScaleUnit.PART) {
            if (
              dateInViewForward &&
              dateInViewForward.split("-")[3] == "0" &&
              (prevDateInViewForward == null ||
                prevDateInViewForward != dateInViewForward)
            ) {
              prevDateInViewReverse = null;
              prevDateInViewForward = dateInViewForward;
              handleDaysWheelEvent({
                deltaY: 1,
                isWheelEvent: false,
                isPanelEvent: true
              });
            }
            addZoneDataEnd();
          } else if (mode == TimeScaleUnit.DAY) {
            if (
              dateInViewForward &&
              dateInViewForward.split("-")[2] == "01" &&
              (prevDateInViewForward == null ||
                prevDateInViewForward != dateInViewForward)
            ) {
              prevDateInViewReverse = null;
              prevDateInViewForward = dateInViewForward;
              handleMonthsWheelEvent({
                deltaY: 1,
                isWheelEvent: false,
                isPanelEvent: true
              });
            }
            addFewDaysToEnd(1);
          } else if (mode == TimeScaleUnit.MONTH) {
            if (
              dateInViewForward &&
              dateInViewForward.split("-")[1] == "01" &&
              (prevDateInViewForward == null ||
                prevDateInViewForward != dateInViewForward)
            ) {
              prevDateInViewReverse = null;
              prevDateInViewForward = dateInViewForward;
              handleYearsWheelEvent({
                deltaY: 1,
                isWheelEvent: false,
                isPanelEvent: true
              });
            }
            if (
              itemsInView.length > 0 &&
              itemsInView[itemsInView.length - 1] &&
              Number(itemsInView[itemsInView.length - 1].split("-")[0]) + 1 ==
                monthsData[0]
            )
              addMonthDataEnd();
          } else if (mode == TimeScaleUnit.YEAR) {
            addYearDataEnd();
          }
        }
      } else if (deltaX < 0) {
        if (!("isWheelEvent" in e) || e.isWheelEvent == true) {
          if (mode != TimeScaleUnit.DAY) scrollLookAlike(false);
          if (mode == TimeScaleUnit.PART) {
            if (
              dateInViewReverse &&
              dateInViewReverse.split("-")[3] == "5" &&
              (prevDateInViewReverse == null ||
                prevDateInViewReverse != dateInViewReverse)
            ) {
              prevDateInViewForward = null;
              prevDateInViewReverse = dateInViewReverse;
              handleDaysWheelEvent({
                deltaY: -1,
                isWheelEvent: false,
                isPanelEvent: true
              });
            }
            addZoneDataStart();
          } else if (mode == TimeScaleUnit.DAY) {
            if (
              dateInViewReverse &&
              dateInViewReverse.split("-")[2] == "01" &&
              (prevDateInViewReverse == null ||
                prevDateInViewReverse != dateInViewReverse)
            ) {
              prevDateInViewForward = null;
              prevDateInViewReverse = dateInViewReverse;
              handleMonthsWheelEvent({
                deltaY: -1,
                isWheelEvent: false,
                isPanelEvent: true
              });
            }
            addFewDaysToStart(1);
          } else if (mode == TimeScaleUnit.MONTH) {
            if (
              dateInViewForward &&
              dateInViewForward.split("-")[1] == "01" &&
              (prevDateInViewReverse == null ||
                prevDateInViewReverse != dateInViewForward)
            ) {
              prevDateInViewForward = null;
              prevDateInViewReverse = dateInViewForward;
              handleYearsWheelEvent({
                deltaY: -1,
                isWheelEvent: false,
                isPanelEvent: true
              });
            }
            if (
              itemsInView.length > 0 &&
              itemsInView[itemsInView.length - 1] &&
              Number(itemsInView[itemsInView.length - 1].split("-")[0]) - 1 ==
                monthsData[0]
            )
              addMonthDataStart();
          } else if (mode == TimeScaleUnit.YEAR) {
            addYearDataStart();
          }
        }
      }
      prevScrollLeft = panelsContainer.scrollLeft;
      checkVisibility();
      setTimeout(() => {
        resolve();
      }, 300);
    });
  }

  async function waitUntilDisenganged(
    e: WheelEvent | ProgrammedHorizontalWheelEvent
  ): Promise<void> {
    return new Promise(async (resolve) => {
      if (engadged) return;
      engadged = true;
      await handlePanelScroll(e);
      engadged = false;
      resolve();
    });
  }
  function updateCursor(
    direction: "right" | "left" | "bidirectional" | "default"
  ) {
    switch (direction) {
      case "right":
        document.body.style.cursor = "url('/icons/arrow_forward.svg'), auto";
        break;
      case "left":
        document.body.style.cursor = "url('/icons/arrow_back.svg'), auto";
        break;
      case "bidirectional":
        document.body.style.cursor = "url('/icons/arrows_outward.svg'), auto";
        break;
      default:
        document.body.style.cursor = "default";
    }
  }
  function handleMouseWheelEnabled(e: MouseEvent) {
    startPoint = { x: e.clientX, y: e.clientY };
    thresholdCrossed = false;
    cursorDirection = "bidirectional";
    updateCursor(cursorDirection);
  }

  async function handleMouseMove(e: MouseEvent) {
    if (!startPoint) return;
    const movedX = e.clientX - startPoint.x;
    const threshold = 25;
    if (!thresholdCrossed && Math.abs(movedX) > threshold) {
      thresholdCrossed = true;
      cursorDirection = movedX > 0 ? "right" : "left";
      updateCursor(cursorDirection);
      if (cursorDirection == "right")
        while (thresholdCrossed) {
          await waitUntilDisenganged({ deltaX: 1, isWheelEvent: true });
        }
      else
        while (thresholdCrossed) {
          await waitUntilDisenganged({ deltaX: -1, isWheelEvent: true });
        }
    } else if (thresholdCrossed && Math.abs(movedX) <= threshold) {
      thresholdCrossed = false;
      updateCursor("bidirectional");
      return;
    }
  }

  function handleMouseWheelDisabled(e: MouseEvent) {
    startPoint = null;
    thresholdCrossed = false;
    cursorDirection = "default";
    updateCursor(cursorDirection);
  }
  function handleMouseDownOthers(event: MouseEvent) {
    if (isMouseWheelMoveEnabled) {
      document.removeEventListener("mousemove", handleMouseMove);
      isMouseWheelMoveEnabled = false;
      handleMouseWheelDisabled(event);
    }
  }
  function handleMouseDownOnPanelsContainer(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      if (isMouseWheelMoveEnabled == false) {
        document.addEventListener("mousemove", handleMouseMove);
        handleMouseWheelEnabled(event);
      } else {
        document.removeEventListener("mousemove", handleMouseMove);
        handleMouseWheelDisabled(event);
      }
      isMouseWheelMoveEnabled = !isMouseWheelMoveEnabled;
    } else {
      event.stopPropagation();
      handleMouseDownOthers(event);
    }
  }
  async function goToToday() {
    let paddedCurrmonthIndex =
      (currentMonthIndex < 9 ? "0" : "") + (currentMonthIndex + 1);
    let paddedCurrDate =
      currentDate.getDate() < 10 ? "0" : "" + currentDate.getDate();
    let date: string | number;
    let index: number;
    prevDateInViewForward = null;
    prevDateInViewReverse = null;
    switch (mode) {
      case TimeScaleUnit.PART:
        date = currentYear + "-" + paddedCurrmonthIndex + "-" + paddedCurrDate;
        index = zonesData.findIndex((x) => {
          x.date == date;
        });
        if (index == -1) {
          zonesData = generateZonesData(new Date().toISOString());
          instaceId = new Date().getTime();
          await tick();
        }
        scrollDateSlotIntoView(
          currentYear + "-" + paddedCurrmonthIndex + "-" + paddedCurrDate + "-0"
        );
        break;
      case TimeScaleUnit.DAY:
        date = currentYear + "-" + paddedCurrmonthIndex + "-" + paddedCurrDate;
        index = daysData.findIndex((x) => {
          x == date;
        });
        if (index == -1) {
          daysData = generateDaysData(currentYear, currentMonthIndex);
          instaceId = new Date().getTime();
          await tick();
        }
        scrollDateSlotIntoView(
          currentYear + "-" + paddedCurrmonthIndex + "-" + paddedCurrDate
        );
        break;
      case TimeScaleUnit.MONTH:
        date = currentYear;
        index = monthsData.findIndex((x) => {
          x == date;
        });
        if (index == -1) {
          monthsData = generateMonthsData(currentYear);
          instaceId = new Date().getTime();
          await tick();
        }
        scrollDateSlotIntoView(currentYear + "-" + paddedCurrmonthIndex);
        break;
      case TimeScaleUnit.YEAR:
        scrollDateSlotIntoView(String(currentYear));
        break;
      default:
        break;
    }
  }

  function checkifNotToday(itemsInView: any[]): boolean {
    let currentDay = currentDate.getDate();
    switch (mode) {
      case TimeScaleUnit.PART:
        for (let i = 0; i < itemsInView.length; i++) {
          if (
            itemsInView[i].split("-")[0] == currentYear &&
            Number(itemsInView[i].split("-")[1]) == currentMonthIndex + 1 &&
            itemsInView[i].split("-")[2] == currentDay
          )
            return false;
        }
        return true;
      case TimeScaleUnit.DAY:
        for (let i = 0; i < itemsInView.length; i++) {
          if (
            itemsInView[i].split("-")[0] == currentYear &&
            Number(itemsInView[i].split("-")[1]) == currentMonthIndex + 1 &&
            itemsInView[i].split("-")[2] == currentDay
          )
            return false;
        }
        return true;
      case TimeScaleUnit.MONTH:
        for (let i = 0; i < itemsInView.length; i++) {
          if (
            itemsInView[i].split("-")[0] == currentYear &&
            Number(itemsInView[i].split("-")[1]) == currentMonthIndex + 1
          )
            return false;
        }
        return true;
      case TimeScaleUnit.YEAR:
        for (let i = 0; i < itemsInView.length; i++) {
          if (itemsInView[i] == currentYear) return false;
        }
        return true;
      default:
        return false;
    }
  }

  function handleTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
  }

  function handleTouchMove(e: TouchEvent) {
    const moveX = e.touches[0].clientX;
    const deltaX = startX - moveX;
    waitUntilDisenganged({ deltaX: deltaX, isWheelEvent: true });
    startX = moveX;
  }
  let itemsInView = $state([] as any[]);

  function checkVisibility() {
    if (!panelsContainer) return;
    const containerLeft = panelsContainer.scrollLeft;
    const containerRight = containerLeft + panelsContainer.offsetWidth;
    itemsInView = [];

    Array.from(panelsContainer.children).forEach((child) => {
      const childElement = child as HTMLElement;
      const childLeft = childElement.offsetLeft;
      const childRight = childLeft + childElement.offsetWidth;

      if (childLeft < containerRight && childRight > containerLeft) {
        // The item is visible
        const dateAttr = childElement.getAttribute("data-date");
        if (dateAttr) {
          itemsInView.push(dateAttr);
        }
      }
    });
    dateInViewReverse =
      itemsInView.length >= 2
        ? itemsInView[itemsInView.length - 2]
        : itemsInView[0] || "";
    dateInViewForward =
      itemsInView.length >= 1 ? itemsInView[itemsInView.length - 1] : "";
    isNotToday = checkifNotToday(itemsInView);
  }

  onMount(() => {
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      waitUntilDisenganged(e);
    };

    (async () => {
      await tick(); // Wait for DOM to be ready
      if (!panelsContainer) return;

      prevScrollLeft = panelsContainer.scrollLeft;
      checkVisibility();
      if (mode == TimeScaleUnit.YEAR) {
        await tick(); // Ensure Year components are rendered
        scrollDateSlotIntoView(String(currentYear));
      }

      panelsContainer.addEventListener("touchstart", handleTouchStart, {
        passive: true
      });
      panelsContainer.addEventListener("touchmove", handleTouchMove, {
        passive: false
      });
      panelsContainer.addEventListener("wheel", wheelHandler, {
        passive: false
      });
      panelsContainer.addEventListener(
        "mousedown",
        handleMouseDownOnPanelsContainer
      );
    })();

    document.addEventListener("mousedown", handleMouseDownOthers);
    return () => {
      if (panelsContainer) {
        panelsContainer.removeEventListener("touchstart", handleTouchStart);
        panelsContainer.removeEventListener("touchmove", handleTouchMove);
        panelsContainer.removeEventListener(
          "mousedown",
          handleMouseDownOnPanelsContainer
        );
        panelsContainer.removeEventListener(
          "wheel",
          wheelHandler as EventListener
        );
      }
      document.removeEventListener("mousedown", handleMouseDownOthers);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  });

  onDestroy(() => {
    if (reverseScrollCheckInterval) {
      clearInterval(reverseScrollCheckInterval);
      reverseScrollCheckInterval = null;
    }
  });
</script>

<div
  class="relative flex flex-col max-w--[800px] max-h--[800px] w-full h-full min-h-[600px]"
>
  <div class="flex h-full w-full overflow-auto">
    {#key mode && instaceId}
      {#if mode != TimeScaleUnit.YEAR}
        <RollerPicker
          {mode}
          {birthdate}
          {groupByBirthdate}
          {yearPhases}
          onSelectedDateReset={async (selectedDate) => {
            const date = getISOfromDateString(selectedDate);
            zonesData = generateZonesData(date);
            await tick();
            const dateToView = date.split("T")[0] + "-0";
            scrollDateSlotIntoView(dateToView);
          }}
          onSelectedDateChange={async (detail) => {
            let date;
            if (typeof detail === "object" && "isPostive" in detail) {
              date = detail.selectedDate;
              if (detail.isPostive) {
                await addZoneDataEnd();
              } else {
                await addZoneDataStart();
              }
            } else {
              date = detail;
            }
            const dateToView = getISOfromDateString(date).split("T")[0] + "-0";
            scrollDateSlotIntoView(dateToView);
          }}
          onSelectedMonthReset={async (selectedMonth) => {
            let date = selectedMonth;
            const month = monthNames.indexOf(date.slice(-3));
            const fistAlphIndex = getFirstAlphabetPosition(date);
            const year = Number(date.slice(0, fistAlphIndex));
            daysData = generateDaysData(year, month);
            await tick();
            const dateToView = new Date(Date.UTC(year, month, 1))
              .toISOString()
              .split("T")[0];
            scrollDateSlotIntoView(dateToView);
          }}
          onSelectedMonthChange={async (detail) => {
            let date;
            if (typeof detail === "object" && "isPostive" in detail) {
              date = detail.selectedMonth + "01";
              if (detail.isPostive) {
                await addFewDaysToEnd(31);
              } else {
                await addFewDaysToStart(31);
              }
            } else {
              date = detail + "01";
            }
            const dateToView = getISOfromDateString(date).split("T")[0];
            scrollDateSlotIntoView(dateToView);
            checkVisibility();
          }}
          onSelectedYearChange={async (detail) => {
            let date;
            if (typeof detail === "object" && "isPostive" in detail) {
              date = detail.selectedYear + "-01";
              if (detail.isPostive) {
                monthsData = [
                  ...monthsData,
                  monthsData[monthsData.length - 1] + 1
                ];
              } else {
                monthsData = [monthsData[0] - 1, ...monthsData];
                await tick();
              }
            } else {
              date = detail + "-01";
            }
            scrollDateSlotIntoView(date);
          }}
          onMount={async (detail) => {
            handleDaysWheelEvent = detail.handleDaysWheelEvent;
            handleMonthsWheelEvent = detail.handleMonthsWheelEvent;
            handleYearsWheelEvent = detail.handleYearsWheelEvent;
            await tick();
            checkVisibility();
          }}
        />
      {/if}
    {/key}
    <div
      id="birdViewPanelsContainer"
      class="flex w-full overflow-y-hidden overflow-x-hidden"
      bind:this={panelsContainer}
    >
      {#if mode == TimeScaleUnit.PART}
        {#each zonesData as day, index (index)}
          {#each day.data as zoneData, i (i)}
            {@const date = day.date}
            <Zone
              date={date + "-" + i}
              header={zones[i] + (i == 0 ? ` - ${date.split("-")[2]}` : "")}
              data={date + " - " + zoneData}
            />
          {/each}
        {/each}
      {/if}
      {#if mode == TimeScaleUnit.DAY}
        {#each daysData as day, index (index)}
          {@const date = day}
          {#key day}
            <Day {date} />
          {/key}
        {/each}
      {/if}
      {#if mode == TimeScaleUnit.MONTH}
        {#each monthsData as year (year)}
          {#each monthNames as month, i (i)}
            {@const date = year + month}
            <Month {date} />
          {/each}
        {/each}
      {/if}
      {#if mode == TimeScaleUnit.YEAR}
        {#each yearsData as year (year)}
          <Year {year} />
        {/each}
      {/if}
    </div>
  </div>
  <div
    class="absolute w-full p-4 bottom-0 flex items-center justify-center pointer-events-none"
  >
    <div class="pointer-events-auto"></div>
  </div>
</div>
