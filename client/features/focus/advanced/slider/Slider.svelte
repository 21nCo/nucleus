<script lang="ts">
  import { onMount } from "svelte";
  import { roundOffToNdigitsAfterDecimal } from "@21n/shared-utils/number.utils";
  import { activeSession } from "@nucleum/features/focus/session.store";
  import type { IActiveSessionStore } from "@nucleum/features/focus/session.type";
  import { SessionState } from "@nucleum/features/focus/sessionState.enum";
  import Popover from "@nucleum/components/overlays/Modal.svelte";
  import { TimeUnit } from "@21n/utils/time.type";
  import { AppSkin } from "@21n/theme/appearance.type";
  import appearance from "@nucleum/stores/appearance.store";
  import { SessionType } from "@nucleum/features/focus/logs/log.type";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";

  let {
    parentBackgroundIndex = 1,
    isShowTextBoxByDefault = false,
    val = $bindable(0),
    color = undefined,
    onTimeChange = undefined
  }: {
    parentBackgroundIndex?: number;
    isShowTextBoxByDefault?: boolean;
    val?: number;
    color?: string;
    onTimeChange?:
      | ((event: CustomEvent<{ value: number }>) => void)
      | undefined;
  } = $props();
  let isShowTextBoxPopOver: boolean = false;
  let inputTextBox: any;
  let isPreventReverseEvent: boolean = false;
  let reverseEventTimeout: any;
  const skin = $derived($userPreferences?.appearance?.skin);

  // let remainingTimeInMinutes: number | undefined = undefined; //this will be used for count-down mode and will be updated every second
  // let timeElapsedInMinutes: number | undefined = undefined; //this will be used for count-up mode and will be updated every second

  let timeStops: string[] = generateTimeStops();

  let units: TimeUnit[] = [TimeUnit.SECONDS, TimeUnit.MINUTES, TimeUnit.HOURS];
  let currentTimeUnit: TimeUnit = units[1];

  let currentDisplayedTime: string = "0m"; //this will be used to display the current time at the center of the slider, this will also contain the unit of the time
  let currentDisplayedTimeMagnitude: number = 0; //this will be used to store the magnitude of the current time, this value is not rounded off, if needed to be rounded off, then round off at the place where this value is being used
  let currentDisplayedTimeUnit: TimeUnit = units[1]; //this will be used to store the magnitude of the current time

  let paddingForSliderTrack = { left: 0, right: 0 };
  let isDragging = false;
  let isScrolling = false;

  let timeoutInstance: any;

  let sliderTranslation = 0; //this will be responsible for the movement of the slider (starts from 0 from the center of the count-up stop)
  let gapBetweenDials = 10; //value is in px
  let heightOfTheSmallDial = gapBetweenDials; //since in the proportion of gap and height of the small dial is 1:1
  let currentDisplayedTimeMargin = 0; //this will be responsible in placing the current time label at the center of the slider
  let prevClientX = 0; //this will be used to calculate the deltaX(dragging the slider)
  let prevTimestamp = 0; //this will be used to calculate the deltaTime(dragging the slider)
  let distanceFromWhichCurrentTimeWillBeShown = 0;
  let maxSliderTranslation = 0;
  let additionalStops = 5; //this will be used to make the slider's end invisible to the user, for now we are only adding 5 additional stop, but if needed we can add more
  let countUpStopWidth = 0;
  let isSessionRunning: boolean = false;
  let sessionType: SessionType = SessionType.COUNTUP;

  let isNearestLeftDialPassed: boolean = false; //This will be of use if initially the user enters a value that is not on dials, so to be at exactly that translation without performing selective translation to that value at least until nearest left dial has passed

  let textInputWithDropdownUnit: TimeUnit = TimeUnit.MINUTES;

  const widthOfDial = 1;

  let widthOfOneTimeRange = gapBetweenDials * 5 + 5 * widthOfDial; //for each stop there are a total of 5 dials, now between these dials there is a spacing of gapBetweenDials(4 times), and every stop is separated by a margin of gapBetweenDials, making a total of 5 * gapBetweenDials, and since there are total 5 dials, 4 of them have width of 1px and the main dial has width of widthOfDial, so total width of the stop is 5 * gapBetweenDials + 4 * 1 + widthOfDial, we'll use this variable with imagining that the first dial is at 0m(main dial), even though our mapping technically maps 2 small dials then one main dial and then 2 small dials again

  // let offsetRange: TimeStopOffsetRange[] = getOffsetRange(); //this will be a list of values each value containing a range(from and to), we'll use these values to identify the offset positioning of the translation(used with timeStopOffset), so that if its in-between then we'll compare using the center point of that range to identify the closest valid stop

  const speedSensitivity = 1.5;
  const speedThreshold = 7;

  function handelScrollStart() {
    if (isSessionRunning) return;
    isScrolling = true;
  }

  function handleDragStart(event: MouseEvent | TouchEvent | WheelEvent) {
    if (isSessionRunning) return;

    let clientX: number;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
    } else {
      // Handle other event types if needed
      return;
    }

    isDragging = true;
    prevClientX = clientX;
    prevTimestamp = performance.now(); // Gives a timestamp in milliseconds more precise than Date.now(), we are doing this here because we want to calculate the deltaTime based on the time since drag started but the case is different is for scroll
  }

  function handleScroll(event: WheelEvent) {
    if (!isScrolling || isSessionRunning) return;

    let deltaX: number;
    let clientX: number;
    let currentTimestamp: number;
    deltaX = -event.deltaX;
    if (deltaX === 0) deltaX = -event.deltaY;
    clientX = sliderTranslation;
    currentTimestamp = performance.now();

    evaluateMaxSliderTranslation();
    let deltaTime = currentTimestamp - prevTimestamp;

    // if (isReadyToChangeDeltaTimeCounter === 10) {
    //   deltaTime = 1;
    //   isReadyToChangeDeltaTimeCounter = 0;
    // }
    // if (deltaTime <= 0) {
    //   isReadyToChangeDeltaTimeCounter++;
    //   return;
    // }
    if (deltaTime <= 0) {
      return;
    }

    const scrollSpeed =
      (Math.abs(deltaX / deltaTime) * speedSensitivity) / 1000;

    if (sliderTranslation === 0 && deltaX < 0) {
      sliderTranslation = countUpStopWidth / 2 + gapBetweenDials + widthOfDial;
    } else {
      sliderTranslation = roundOffToNdigitsAfterDecimal(
        Math.min(
          Math.max(
            -maxSliderTranslation,
            sliderTranslation +
              (Math.abs(
                deltaX * (deltaX !== 0 && scrollSpeed < 1 ? 1 : scrollSpeed)
              ) <
              gapBetweenDials + widthOfDial
                ? (deltaX / Math.abs(deltaX)) * (gapBetweenDials + widthOfDial)
                : deltaX * (deltaX !== 0 && scrollSpeed < 1 ? 1 : scrollSpeed))
          ),
          0
        ),
        0
      );
    }

    if (scrollSpeed > speedThreshold && deltaX > 0) {
      sliderTranslation = 0;
    }

    prevClientX = clientX;
    prevTimestamp = currentTimestamp;
  }

  function handleDrag(event: MouseEvent | TouchEvent) {
    if (!isDragging || isSessionRunning) return;
    let deltaX: number;
    let clientX: number;
    let currentTimestamp: number;
    if (event instanceof MouseEvent) {
      deltaX = event.clientX - prevClientX;
      clientX = event.clientX;
      currentTimestamp = performance.now();
    } else if (event instanceof TouchEvent) {
      const touch = event.touches[0];
      deltaX = touch.clientX - prevClientX;
      clientX = touch.clientX;
      currentTimestamp = performance.now();
    } else {
      // Handle other event types if needed
      return;
    }

    evaluateMaxSliderTranslation();

    const deltaTime = currentTimestamp - prevTimestamp;
    const scrollSpeed = Math.abs(deltaX / deltaTime) * speedSensitivity;
    sliderTranslation = roundOffToNdigitsAfterDecimal(
      Math.min(
        Math.max(
          -maxSliderTranslation,
          sliderTranslation +
            deltaX *
              (deltaX !== 0 && scrollSpeed < 1
                ? 1
                : scrollSpeed > speedThreshold
                  ? speedThreshold
                  : scrollSpeed)
        ),
        0
      ),
      0
    );
    if (scrollSpeed > speedThreshold && deltaX > 0) {
      sliderTranslation = 0;
    }

    prevClientX = clientX;
    prevTimestamp = currentTimestamp;
  }

  function handleDragEnd() {
    if (isSessionRunning) return;
    isDragging = false;
    performSelectiveTranslation();
  }

  function setDistanceFromWhichCurrentTimeWillBeShown() {
    const countUpStop = document.querySelector(".count-up-stop") as HTMLElement;

    if (countUpStop) {
      distanceFromWhichCurrentTimeWillBeShown = countUpStop.offsetWidth / 2;
      // since the count-up-stop is at the center of the slider, so we need to add half of its width to the distanceFromWhichCurrentTimeWillBeShown, and also 1 is added because we only want to showcase time when its greater than 0.00m and not 0.00m itself
    }
  }

  function evaluateMaxSliderTranslation() {
    const sliderTrack = document.querySelector(".slider-track") as HTMLElement;
    const countUpStop = document.querySelector(".count-up-stop") as HTMLElement;
    if (sliderTrack && countUpStop)
      maxSliderTranslation =
        sliderTrack.offsetWidth -
        (paddingForSliderTrack.left + paddingForSliderTrack.right) -
        (countUpStop.offsetWidth / 2 + gapBetweenDials + 1); // 1 addition is for precision
  }

  function handleGlobalMouseUp(event: MouseEvent) {
    if (isDragging) {
      handleDragEnd();
    }
  }

  function getTimeStopOffsetIndex(timeStopOffset: number): number {
    if (sessionType === SessionType.COUNTUP && isSessionRunning)
      // Since we would want dial to move forward, when a complete gapWidth + dialWidth worth of time is covered, until then we would want to stick with the current selective translation so we'll use floor value for count-up mode
      return Math.floor(timeStopOffset / (gapBetweenDials + widthOfDial));
    else if (
      (sessionType === SessionType.COUNTDOWN ||
        sessionType === SessionType.PREDEFINED_INTERVALS) &&
      isSessionRunning
    )
      // Since we would want dial to move backward, when a complete gapWidth + dialWidth worth of time is covered, until then we would want to stick with the current selective translation so we'll use floor value for count-up mode
      return Math.ceil(timeStopOffset / (gapBetweenDials + widthOfDial));
    else
      return roundOffToNdigitsAfterDecimal(
        timeStopOffset / (gapBetweenDials + widthOfDial),
        0
      );
    //this will give us the index of the nearest time stop in the current time stop range, for example if the timeStopOffset is 35 and the gapBetweenDials is 10 and the widthOfDial is 1, then that means that the timeStopOffset is in between the 3rd and 4th dial, so the nearestTimeStopOffsetIndex would be 3, and if the timeStopOffset is 0 then the nearestTimeStopOffsetIndex would be 0, and if the timeStopOffset is 10 then the nearestTimeStopOffsetIndex would be 1, and so on
  }

  function performSelectiveTranslation() {
    if (countUpStopWidth === undefined) return;
    const rawTranslation = Math.abs(sliderTranslation);
    const translationFrom0m = rawTranslation - countUpStopWidth / 2;
    const timeStopOffset = translationFrom0m % widthOfOneTimeRange;

    const timeStopOffsetIndex: number = getTimeStopOffsetIndex(timeStopOffset);

    if (timeStopOffset % (gapBetweenDials + widthOfDial) === 0)
      isNearestLeftDialPassed = true;
    if (isNearestLeftDialPassed || !isSessionRunning) {
      //either nearestLeftDialPassed or sessionIsNotRunning this will cover both the situation if the user is dragging then selective translation will happen or if a dial has passed(in count-down mode)
      sliderTranslation =
        translationFrom0m <= 0
          ? 0
          : -(
              Math.floor(translationFrom0m / widthOfOneTimeRange) *
                widthOfOneTimeRange +
              countUpStopWidth / 2 +
              timeStopOffsetIndex * (gapBetweenDials + widthOfDial)
            );
      //Math.floor(translationFrom0m / widthOfOneTimeRange) * widthOfOneTimeRange is giving us the nearest main stop on the left side of the current translation, and then we are adding the countUpStopWidth/2 to get the center of the count-up-stop, and then we are adding the nearestTimeStopOffsetIndex * (gapBetweenDials + widthOfDial), also since if sliderTranslation is 0 or less than 0 then that means we are already in the area of count-up-stop, so we don't need to do anything, so we are checking that condition and if its true then we are setting the sliderTranslation to 0

      if (
        Math.abs(sliderTranslation) < distanceFromWhichCurrentTimeWillBeShown &&
        !isSessionRunning
      ) {
        sliderTranslation = 0; //to snap back to the count-up stop if the slider is between the count-up stop and the first visible time stop
        return;
      }
    }
  }

  function handleHorizontalSpacing() {
    const slider = document.querySelector(".slider") as HTMLElement;
    const countUpStop = document.querySelector(".count-up-stop") as HTMLElement;
    const lastTimeStop = document.querySelector(
      ".last-time-stop__label"
    ) as HTMLElement;
    const currentTimeElement = document.querySelector(
      ".current-time"
    ) as HTMLElement;

    if (slider && countUpStop && lastTimeStop) {
      paddingForSliderTrack = {
        left:
          slider && countUpStop
            ? (slider.offsetWidth - countUpStop.offsetWidth) / 2
            : 0,
        //we calculated the padding for left side by subtracting the width of the container from the count up stop(so that the count up stop is at the center of the slider when at start), and then dividing it by 2
        right:
          slider && lastTimeStop
            ? (slider.offsetWidth -
                (lastTimeStop.offsetWidth + gapBetweenDials)) /
              2
            : 0
        //we calculated the padding for right side by subtracting the width of the container from the last time stop combined with the gap between the dials(so that the time label is at the center of the slider when at last), and then dividing it by 2
      };
    }

    if (currentTimeElement)
      currentDisplayedTimeMargin =
        (slider.offsetWidth - currentTimeElement.offsetWidth) / 2;
  }

  function generateTimeStops(numberOfStopToBeAdded?: number) {
    //5 min scale until 60 m and 15m scale after 60 m... more than 5 hours - 30 min)
    return Array.from({
      length: numberOfStopToBeAdded ? numberOfStopToBeAdded + 80 : 80
    }).map((_, i) => {
      if (i === 0) return "count-up";
      else if (i < 13) return `${(i - 1) * 5}m`;
      else if (i >= 13 && i < 29) return `${(i - 13) * 0.25 + 1}h`;
      else if (i >= 29 && i < 67) return `${(i - 29) * 0.5 + 5}h`;
      else return `${i - 43}h`;
    });
  }

  function addMoreStop(numberOfStopToBeAdded: number) {
    const newStops = Array.from({ length: numberOfStopToBeAdded }).map(
      (_, i) => `${timeStops.length - 43 + i}h`
    ); //Since initially the length of the timeStops array is 80 and the last timeStop it has is 36h, so we'll be adding the new stops from 37h, so we'll be subtracting 43 from the length of the timeStops array to get the index of the first stop that we'll be adding, and then we'll be adding the new stops from that index
    return [...timeStops, ...newStops];
  }

  function handleTimeStopsAdditionIfValidTimeValueInInputField(val: number) {
    if (val <= 0) return;
    // if (val / 60 >= 36) {
    //   //if the value is greater than 36 hours then we'll be adding the time stop at the end of the slider,
    //   timeStops = generateTimeStops(val / 60 - 36 + additionalStops); //Since if we don't want the slider's end to be visible to the user, for now we are only adding 15 additional stop, but if needed we can add more
    // }
    if (val / (60 * 60) >= timeStops.length - 44 - additionalStops) {
      //if the value is greater than 36 hours then we'll be adding the time stop at the end of the slider,
      timeStops = addMoreStop(
        val / (60 * 60) > timeStops.length - 44
          ? val / (60 * 60) - (timeStops.length - 44) + additionalStops
          : additionalStops
      ); //we are adding stops if the current value is is at a max distance of 15 units from the last stop, and we are adding 15 more stops, so that the slider's end is not visible to the user, or else if a user enters a value greater than the last stop, then we'll be adding the stops based on the difference between the current value and the last stop
    }
  }

  function calculateCurrentTimeMagnitudeAndUnit(
    timeStopIndex: number,
    timeStopOffset: number
  ): [number, TimeUnit] {
    if (timeStopIndex >= 0 && timeStopIndex < 12) {
      return [
        timeStopIndex * 5 + (timeStopOffset / widthOfOneTimeRange) * 5,
        TimeUnit.MINUTES
      ];
    } else if (timeStopIndex >= 12 && timeStopIndex < 28) {
      return [
        (timeStopIndex - 12) * 0.25 +
          (timeStopOffset / widthOfOneTimeRange) * 0.25 +
          1,
        TimeUnit.HOURS
      ];
    } else if (timeStopIndex >= 28 && timeStopIndex < 66) {
      return [
        (timeStopIndex - 28) * 0.5 +
          (timeStopOffset / widthOfOneTimeRange) * 0.5 +
          5,
        TimeUnit.HOURS
      ];
    } else if (timeStopIndex >= 66) {
      return [
        timeStopIndex - 42 + timeStopOffset / widthOfOneTimeRange,
        TimeUnit.HOURS
      ];
    } else {
      return [0, TimeUnit.MINUTES]; //need to change this to seconds if added seconds part as well
    }
  }

  function persistTwoDecimalPlaces(number: number) {
    return number.toString().includes(".")
      ? number.toString().split(".")[1].length === 1
        ? `${number.toString()}0`
        : number.toString()
      : `${number.toString()}.00`;
  }

  function calculateTimeInHoursMinutesSecondsUsingTimeInDecimalsAndUnit(
    time: number,
    unit: TimeUnit
  ): string {
    const beforeDecimalPart = Math.floor(time);
    const afterDecimalPart = roundOffToNdigitsAfterDecimal((time % 1) * 60, 0);
    if (unit === TimeUnit.SECONDS) {
      return `${beforeDecimalPart} sec`;
    } else if (unit === TimeUnit.MINUTES) {
      return `${beforeDecimalPart} ${
        beforeDecimalPart > 1 ? `mins` : `min`
      } ${afterDecimalPart} ${afterDecimalPart > 1 ? `secs` : `sec`}`;
    } else {
      return `${beforeDecimalPart} ${
        beforeDecimalPart > 1 ? `hrs` : `hr`
      } ${afterDecimalPart} ${afterDecimalPart > 1 ? `mins` : `min`}`;
    }
  }

  function setTimeAccordingToDisplayedTimeAndUnit(
    time: number,
    unit: TimeUnit
  ) {
    //this function is responsible for setting the value of the main time that is getting used by sessionStore, so if we don't want that we'll need to update this area
    if (unit === TimeUnit.SECONDS) {
      val = time;
    } else if (unit === TimeUnit.MINUTES) {
      val = time * 60;
    } else {
      val = time * 60 * 60;
    }
  }

  function calculateTimeBasedOnTranslation() {
    //this function will be used to calculate the displayed time based on the translation of the slider

    if (countUpStopWidth === undefined) return;

    const rawTranslation = Math.abs(sliderTranslation);
    const translationFrom0m = rawTranslation - countUpStopWidth / 2;
    const timeStopOffset = translationFrom0m % widthOfOneTimeRange;
    const timeStopIndex = Math.floor(translationFrom0m / widthOfOneTimeRange); // this will be 0 for translation between 0m-5m(5m excluding), 1 for translation between 5m-10m(10m excluding), and so on

    [currentDisplayedTimeMagnitude, currentDisplayedTimeUnit] =
      calculateCurrentTimeMagnitudeAndUnit(timeStopIndex, timeStopOffset);
    const roundedOffValue = roundOffToNdigitsAfterDecimal(
      currentDisplayedTimeMagnitude > 0 ? currentDisplayedTimeMagnitude : 0,
      2
    );

    setTimeAccordingToDisplayedTimeAndUnit(
      currentDisplayedTimeMagnitude > 0 ? currentDisplayedTimeMagnitude : 0,
      currentDisplayedTimeUnit
    );

    currentDisplayedTime = `${calculateTimeInHoursMinutesSecondsUsingTimeInDecimalsAndUnit(
      roundedOffValue,
      currentDisplayedTimeUnit
    )}`;
    // currentDisplayedTime = `${persistTwoDecimalPlaces(roundedOffValue)}${
    //   currentDisplayedTimeUnit === TimeUnit.SECONDS
    //     ? `s`
    //     : currentDisplayedTimeUnit === TimeUnit.MINUTES
    //       ? `m`
    //       : `h`
    // }`;
  }

  function jumpToTime(timeInSeconds: number) {
    //this function will be used to jump to a particular time in the slider, by translating the slider to the appropriate position based on the timeInMinutes
    let newTranslation = 0;
    if (timeInSeconds / 60 > 0) {
      newTranslation =
        ((timeInSeconds / 60 > 60 ? 60 : timeInSeconds / 60) *
          widthOfOneTimeRange) /
        5;
      if (timeInSeconds / 60 > 60) {
        newTranslation +=
          (((timeInSeconds / 60 > 300 ? 300 : timeInSeconds / 60) - 60) *
            widthOfOneTimeRange) /
          15;
      }
      if (timeInSeconds / 60 > 300) {
        newTranslation +=
          (((timeInSeconds / 60 > 1440 ? 1440 : timeInSeconds / 60) - 300) *
            widthOfOneTimeRange) /
          30;
      }
      if (timeInSeconds / 60 > 1440) {
        newTranslation +=
          ((timeInSeconds / 60 - 1440) * widthOfOneTimeRange) / 60;
      }
      newTranslation += countUpStopWidth / 2;
    }
    //since we are calculating the translation and the duration is not uniformly distributed, so we need to calculate the duration only in the current range and add back the duration of the previous ranges, for example if the timeInMinutes is 90, then we need to calculate the duration only in the range 60-90, and add back the duration of the previous range(i.e 0-60), and if the timeInMinutes is 360, then we need to calculate the duration only in the range 300-360, and add back the duration of the previous ranges(i.e 0-60, 60-300), and so on
    sliderTranslation = -(timeInSeconds / 60 === 0 && isSessionRunning
      ? countUpStopWidth / 2
      : newTranslation);
  }

  function handleTimeValueChange() {
    handleTimeStopsAdditionIfValidTimeValueInInputField(val);
    jumpToTime(val);
  }

  function resizeHandler() {
    setVariables();
  }

  function handleTimeChange(newTimeInMinutes: number) {
    jumpToTime(newTimeInMinutes);
    if (isSessionRunning) performSelectiveTranslation();
  }

  function setVariables() {
    countUpStopWidth =
      (document.querySelector(".count-up-stop") as HTMLElement)?.offsetWidth ??
      0;
    handleHorizontalSpacing();
    setDistanceFromWhichCurrentTimeWillBeShown();
    evaluateMaxSliderTranslation();
  }

  function NotifyTimeValueChangeToParent(val: number) {
    if (isPreventReverseEvent) return;
    const timeChangeEvent = new CustomEvent<{ value: number }>("time-change", {
      detail: { value: val }
    });
    onTimeChange?.(timeChangeEvent);
  }

  function handleMouseWheel(e: WheelEvent) {
    clearTimeout(timeoutInstance);
    timeoutInstance = setTimeout(() => {
      isScrolling = false;
      performSelectiveTranslation();
    }, 0);
    handelScrollStart();
    handleScroll(e);
  }

  $effect(() => {
    if (val >= 0) handleTimeValueChange();
    NotifyTimeValueChangeToParent(val);
  });

  function showTextPopover() {
    if (isShowTextBoxByDefault) return;
    isShowTextBoxPopOver = !isShowTextBoxPopOver;
    setTimeout(() => {
      if (inputTextBox) inputTextBox.focus();
    }, 100);
  }
  onMount(() => {
    setVariables();
    window.addEventListener("resize", resizeHandler);
    window.addEventListener("mouseup", handleGlobalMouseUp); //to stop dragging if the mouse is released outside the slider, otherwise the slider will keep on moving

    const activeSessionUnsub = activeSession.subscribe((x: IActiveSessionStore) => {
      isSessionRunning =
        x.state !== SessionState.NOT_STARTED &&
        x.state !== SessionState.FINISHED;
      // isSessionRunning =
      //   x.state !== SessionState.NOT_STARTED &&
      //   x.state !== SessionState.FINISHED &&
      //   x.state !== SessionState.TIME_IS_UP;  //The last part x.state !== SessionState.TIME_IS_UP is specifically added for count-down mode, when the state changes to TIME_IS_UP, then depending on what we want to showcase, either count-up stop or 0, if condition is added then count-up-stop will be shown
      const { plannedDuration, totalElapsed } = x;
      sessionType = x.type;
      //TODO - don't fire time-change event if the time is changed from sessionStore subscription
      isPreventReverseEvent = true;
      if (reverseEventTimeout) clearTimeout(reverseEventTimeout);
      reverseEventTimeout = setTimeout(() => {
        isPreventReverseEvent = false;
      }, 1000);
      if (plannedDuration > 0) {
        const newTimeRemainingInSeconds = roundOffToNdigitsAfterDecimal(
          plannedDuration - roundOffToNdigitsAfterDecimal(totalElapsed, 0),
          2
        );
        handleTimeChange(newTimeRemainingInSeconds);
      } else {
        handleTimeChange(totalElapsed);
      }
    });

    return () => {
      activeSessionUnsub();
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  });

  $effect(() => {
    calculateTimeBasedOnTranslation();
  });
</script>

<div class="flex flex-col gap-4 items-center">
  <!-- Below div contains the slider and its content along with top and bottom borders of the slider, also the triangle used for indication of the center of the slider -->
  <div class="w-full relative flex flex-col items-center">
    <!-- Below is the gradient at the top of the slider(Same as bottom gradient), AKA slider's top border -->
    <div class="relative h-[1px] w-full overflow-hidden">
      <div
        class="gradient-to-right slider-border absolute top-0 left-0 h-[1px] w-full"
      ></div>
      <!-- In the below div, we want the animation as soon as user starts sliding(i.e when translation is non-zero) -->
      <div
        style={`left:${
          Math.abs(sliderTranslation) > 0
            ? `-100%`
            : `calc(${paddingForSliderTrack.left}px - 100% )`
        };`}
        class="slider-border bg-bgs2 transition-all duration-300 ease-out absolute top-0 h-[1px] w-full"
      ></div>
    </div>

    <!-- Below is the container which contains the overlays at the extremes of the slider along with the current-time(white box) at the center of the slider -->
    <div class="slider-overlay select-none w-full relative">
      <!-- Time-stops container, fixed width depending upon the main container w-96, overflow here(fixed width)-->
      <div class="slider relative w-full overflow-hidden">
        <!-- Time-stops mapping no-overflow here,(full width) -->

        <button
          type="button"
          aria-label="Session duration slider"
          style={`padding:0 ${paddingForSliderTrack.right}px 0 ${paddingForSliderTrack.left}px; transform: translateX(${sliderTranslation}px)`}
          onmouseup={handleDragEnd}
          onmousemove={handleDrag}
          onmousedown={handleDragStart}
          ontouchstart={handleDragStart}
          ontouchmove={handleDrag}
          ontouchend={handleDragEnd}
          onwheel={handleMouseWheel}
          class={`slider-track flex w-[fit-content] border-none bg-transparent p-0 ${
            isSessionRunning ? `cursor-default` : `cursor-pointer`
          } transition-all duration-150 ease-out`}
        >
          {#each timeStops as timeStop, index}
            {#if timeStop === "count-up"}
              <!-- First time-stop (count-up) -->
              <div
                style={`${
                  Math.abs(sliderTranslation) > 0 && isSessionRunning
                    ? `visibility:hidden;`
                    : `visibility:visible;`
                }`}
                class="count-up-stop relative time-stop py-4 px-3.5 min-w-[98px] text-[1rem] font-medium whitespace-nowrap"
              >
                <!-- The min-width of this container is essential to make the time calculation accurately -->
                <span>count-up</span>

                <!-- Left gradient border -->
                <div
                  style={`width:${widthOfDial}px;`}
                  class={`gradient-to-bottom absolute left-0 top-0 h-full`}
                ></div>
                <!-- This below div will be responsible for the animation of left count-up border, Also we want the animation as soon as user starts sliding(i.e when translation is non-zero)-->
                <div
                  class={`left-border-overlapping-layer bg-bgs2 transition-all duration-300 ease-out left-[-1px] absolute w-[3px] h-full ${
                    Math.abs(sliderTranslation) > 0 ? "top-0" : "top-[100%]"
                  }`}
                ></div>
                <!-- Width of the overlapping layer is 3px to cover the glow created by the gradient of the main border(1px) -->

                <!-- Right gradient border -->
                <div
                  style={`width:${widthOfDial}px;`}
                  class={`gradient-to-bottom absolute right-0 top-0 w-[${widthOfDial}px] h-full`}
                ></div>
                <!-- This below div will be responsible for the animation of right count-up border, Also we want the animation as soon as user starts sliding(i.e when translation is non-zero) -->
                <div
                  class={`right-border-overlapping-layer absolute bg-bgs2 transition-all duration-300 ease-out right-[-1px] w-[3px] h-full ${
                    Math.abs(sliderTranslation) > 0 ? "top-0" : "top-[-100%]"
                  }`}
                ></div>
              </div>
            {:else}
              <!-- Dials along with their time label -->
              <div
                style={index !== timeStops.length - 1
                  ? `margin-right:${gapBetweenDials}px`
                  : `margin-right:0;`}
                class={`time-stop -mt-2 flex flex-col justify-center relative`}
              >
                <!-- Dials container for each time-stop -->
                <div class="time-stop__lines flex items-end">
                  <!-- Dials on the left for each main dial -->
                  {#if timeStop !== "0m"}
                    <!-- So the way this line are presented is just getting mapped for every time stop there is, so for a particular stop there are total of five lines, center(the longest), 2 on the left and 2 on the right-->
                    <div
                      style={`height:${heightOfTheSmallDial}px; margin-right:${gapBetweenDials}px; width:${widthOfDial}px;`}
                      class={`bg-fgs1 rounded-full`}
                    ></div>
                    <div
                      style={`height:${heightOfTheSmallDial}px; width:${widthOfDial}px;`}
                      class={`bg-fgs1 rounded-full`}
                    ></div>
                  {/if}

                  <!-- Main dial for each time-stop -->
                  <div
                    style={timeStop === "0m"
                      ? `margin:0 ${gapBetweenDials}px; margin-left:0; width:${widthOfDial}px; opacity: 0;`
                      : `margin:0 ${gapBetweenDials}px; width:${widthOfDial}px;`}
                    class={`h-4 rounded-full bg-fgs1 relative ${
                      timeStop === "0m"
                        ? `${
                            Math.abs(sliderTranslation) > 0 && isSessionRunning
                              ? `bg-fgs1 main-dial`
                              : `bg-[transparent]`
                          }`
                        : `main-dial`
                    }`}
                  />
                  <!-- The increased width of the main dial is due to the pseudo class applied to main-dial class, no affecting the translation(the appeared width is 1.5)-->
                  <!-- To hide the main dial if at 0m -->

                  <!-- Dials on the right for each main dial -->
                  {#if index !== timeStops.length - 1}
                    <!-- To hide the dials when at the end of time-stop -->
                    <div
                      style={`height:${heightOfTheSmallDial}px; width:${widthOfDial}px;`}
                      class={`w-[${widthOfDial}px] bg-fgs1 rounded-full`}
                    ></div>
                    <div
                      style={`height:${heightOfTheSmallDial}px; margin-left:${gapBetweenDials}px; width:${widthOfDial}px;`}
                      class={`w-[${widthOfDial}px] bg-fgs1 rounded-full`}
                    ></div>
                  {/if}
                </div>

                <!-- Time label for each stop -->
                <div
                  style={`${
                    timeStop !== "0m"
                      ? ``
                      : `margin-left:${
                          -(gapBetweenDials + widthOfDial) * 2
                        }px; visibility:${
                          Math.abs(sliderTranslation) > 0 && isSessionRunning
                            ? `visible`
                            : `hidden`
                        };`
                  }`}
                  class={`time-stop__label flex-row justify-center absolute bottom-[2px] left-0 right-0`}
                >
                  <!-- If changed the bottom-[2px] value of the above div then also change the same in current-time div -->
                  <p
                    class={`m-auto w-[fit-content] text-[0.75rem] text-fgs1 ${
                      index === timeStops.length - 1 &&
                      "mr-0 last-time-stop__label"
                    }`}
                  >
                    <!-- The above class condition is written to position the time label correctly(exception being the last case)-->
                    {timeStop}
                  </p>
                </div>
              </div>
            {/if}
          {/each}
        </button>
      </div>

      <!-- Current time(white box at the center, along with black overlays on both sides), Also the animation is needed as soon as the timer starts getting ahead from 0m, hence the condition Math.abs(sliderTranslation) > distanceFromWhichCurrentTimeWillBeShown -->
      <div
        style={`visibility:${
          Math.abs(sliderTranslation) >= distanceFromWhichCurrentTimeWillBeShown
            ? "visible"
            : "hidden"
        }; opacity:${
          Math.abs(sliderTranslation) >= distanceFromWhichCurrentTimeWillBeShown
            ? 1
            : 0
        }`}
        class="m-auto w-full current-time absolute bottom-[2px] flex justify-center transition-all duration-150 ease-out"
      >
        <!-- Above bottom-[2px] value should be same as time-stop__label's value -->
        <!-- Left side of the current time white box(black overlay) -->
        <button
          type="button"
          aria-label="Show session duration details"
          class="w-10 h-4 {skin === AppSkin.Clean
            ? 'bg-gradient-to-r from-transparent ' +
              (parentBackgroundIndex === 1
                ? 'via-bgs1/50 to-bgs1'
                : 'via-bgs2/50 to-bgs2')
            : ''}"
          onclick={showTextPopover}
        ></button>
        <button
          class="bg-fgs1 px-1 min-w-[45px] flex justify-center items-center rounded-[1px]"
          onclick={showTextPopover}
        >
          <p class="text-bgs1 text-[12px]">
            {currentDisplayedTime}{isSessionRunning ? " left" : ""}
          </p>
        </button>
        <!-- Right side of the current time white box(black overlay) -->
        <button
          type="button"
          aria-label="Show session duration details"
          class="w-10 h-4 {skin === AppSkin.Clean
            ? 'bg-gradient-to-l from-transparent ' +
              (parentBackgroundIndex === 1
                ? 'via-bgs1/50 to-bgs1'
                : 'via-bgs2/50 to-bgs2')
            : ''}"
          onclick={showTextPopover}
        ></button>
      </div>

      <!-- Below are the two overlays which are causing that blurry effect on the extremes of the timer-->
      <div
        class="absolute w-[10%] h-full left-0 top-0 {skin === AppSkin.Clean
          ? 'bg-gradient-to-l from-transparent ' +
            (parentBackgroundIndex === 1 ? 'to-bgs1' : 'to-bgs2')
          : ''}"
      ></div>
      <div
        class="absolute w-[10%] h-full right-0 top-0 {skin === AppSkin.Clean
          ? 'bg-gradient-to-r from-transparent ' +
            (parentBackgroundIndex === 1 ? 'to-bgs1' : 'to-bgs2')
          : ''}"
      ></div>
    </div>

    <!-- Slider bottom gradient(same as top), AKA slider's bottom border-->
    <div class="relative h-[1px] w-full overflow-hidden">
      <div
        class="gradient-to-right slider-border absolute top-0 left-0 h-[1px] w-full"
      ></div>

      <!-- In the below div, we want the animation as soon as user starts sliding(i.e when translation is non-zero) -->
      <div
        style={`left:${
          Math.abs(sliderTranslation) > 0
            ? `-100%`
            : `calc(${paddingForSliderTrack.left}px - 100% )`
        };`}
        class="slider-border bg-bgs2 transition-all duration-300 ease-outr absolute top-0 h-[1px] w-full"
      ></div>
    </div>

    <!-- Center white triangle -->
    <button
      type="button"
      aria-label="Show session duration details"
      class="center-triangle bg-fgs1 w-[20px] h-[18px] mt-3"
      onclick={showTextPopover}
    ></button>
  </div>

  {#if !isSessionRunning && isShowTextBoxByDefault}
    <!-- TODO - use DurationInput instead of TextInputWithDropdown -->
  {/if}
</div>

<Popover
  isUseDialog={false}
  bind:show={isShowTextBoxPopOver}
>
  <div class="flex w-full justify-center">
    <div class="flex flex-col gap-2 justify-center">
      <div>Enter duration</div>
      <div>
        <!-- TODO - use DurationInput -->
      </div>
    </div>
  </div>
</Popover>

<style>
  /* This is being done because when using overflow-x:auto causing a weird padding at the bottom for the horizontal scroll bar and to remove that padding it was needed to hide the scroll bar altogether */
  .slider div::-webkit-scrollbar,
  .slider::-webkit-scrollbar {
    display: none;
  }
  .main-dial::after {
    position: absolute;
    content: "";
    background-color: rgba(var(--colors-fgs1), 1);
    width: 1.5px;
    left: -0.25px;
    height: 100%;
  }

  .gradient-to-right {
    background-image: linear-gradient(
      to right,
      rgba(var(--colors-bgs3), 0) 0%,
      rgba(var(--colors-bgs3), 1) 35%,
      rgba(var(--colors-fgs1), 1) 50%,
      rgba(var(--colors-bgs3), 1) 65%,
      rgba(var(--colors-bgs3), 0) 100%
    );
  }
  .gradient-to-bottom {
    background-image: linear-gradient(
      to bottom,
      rgba(var(--colors-bgs3), 1) 0%,
      rgba(var(--colors-fgs1), 1) 50%,
      rgba(var(--colors-bgs3), 1) 100%
    );
  }
  .center-triangle {
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  }

  /* .right-overlay-current-time {
    background-image: linear-gradient(
      to right,
      rgba(var(--colors-bgs2), var(--tw-bg-opacity)) 0%,
      rgba(var(--colors-bgs2), var(--tw-bg-opacity)) 50%,
      transparent 100%
    );
  }
  .left-overlay-current-time {
    background-image: linear-gradient(
      to right,
      transparent 0%,
      rgba(var(--colors-bgs2), var(--tw-bg-opacity)) 50%,
      rgba(var(--colors-bgs2), var(--tw-bg-opacity)) 100%
    );
  } */
  .left-overlay-slider {
    background-image: linear-gradient(
      to right,
      rgba(var(--colors-bgs2), var(--tw-bg-opacity)) 0%,
      transparent 100%
    );
  }
  .right-overlay-slider {
    background-image: linear-gradient(
      to right,
      transparent 0%,
      rgba(var(--colors-bgs2), var(--tw-bg-opacity)) 100%
    );
  }
</style>
