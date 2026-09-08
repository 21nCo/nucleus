<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import { renderMdAsHtml } from "@21n/elements/markdown/markdown.utils";

  let {
    transcription = "",
    currentTime = 0,
    groupSegments = true,
    maxGroupGapSeconds = 3,
    minGroupDuration = 8,
    onSeek = undefined
  }: {
    transcription?: string;
    currentTime?: number;
    groupSegments?: boolean;
    maxGroupGapSeconds?: number;
    minGroupDuration?: number;
    onSeek?: ((detail: { time: number }) => void) | undefined;
  } = $props();
  const dev_isDisplayOriginalSegmentCount: boolean = false;

  const hasHighlighting = $derived(transcription.includes("`**"));

  interface TranscriptionSegment {
    startTime: number;
    endTime: number;
    text: string;
    timeDisplay: string;
    originalSegments?: TranscriptionSegment[];
  }

  function parseTimeToSeconds(timeStr: string): number {
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      const [minutes, seconds] = parts.map(parseFloat);
      return minutes * 60 + seconds;
    }
    return parseFloat(timeStr);
  }

  function formatTimeDisplay(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  function parseTranscription(text: string): TranscriptionSegment[] {
    const segments: TranscriptionSegment[] = [];
    const regex =
      /\[(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\]\s*(.*?)(?=\[|\s*$)/gs;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const startTime = parseFloat(match[1]);
      const endTime = parseFloat(match[2]);
      const segmentText = match[3].trim();

      if (segmentText) {
        segments.push({
          startTime,
          endTime,
          text: segmentText,
          timeDisplay: formatTimeDisplay(startTime)
        });
      }
    }

    return groupSegments ? groupRelatedSegments(segments) : segments;
  }

  function groupRelatedSegments(
    segments: TranscriptionSegment[]
  ): TranscriptionSegment[] {
    if (segments.length === 0) return segments;

    const grouped: TranscriptionSegment[] = [];
    let currentGroup: TranscriptionSegment[] = [segments[0]];

    for (let i = 1; i < segments.length; i++) {
      const current = segments[i];
      const previous = segments[i - 1];
      const gap = current.startTime - previous.endTime;
      const currentGroupDuration =
        currentGroup[currentGroup.length - 1].endTime -
        currentGroup[0].startTime;

      // Check if we should start a new group
      const shouldStartNewGroup =
        gap > maxGroupGapSeconds || // Too much time gap
        currentGroupDuration > minGroupDuration * 3 || // Current group is getting too long
        endsWithStrongPunctuation(previous.text) || // Previous segment ends with strong punctuation
        startsWithNewTopic(current.text); // Current segment seems to start a new topic

      if (shouldStartNewGroup) {
        // Finalize current group
        if (currentGroup.length > 0) {
          grouped.push(createGroupedSegment(currentGroup));
        }
        currentGroup = [current];
      } else {
        currentGroup.push(current);
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      grouped.push(createGroupedSegment(currentGroup));
    }

    return grouped;
  }

  function createGroupedSegment(
    segments: TranscriptionSegment[]
  ): TranscriptionSegment {
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const combinedText = segments.map((s) => s.text).join(" ");

    return {
      startTime: firstSegment.startTime,
      endTime: lastSegment.endTime,
      text: combinedText,
      timeDisplay: formatTimeDisplay(firstSegment.startTime),
      originalSegments: segments
    };
  }

  function endsWithStrongPunctuation(text: string): boolean {
    const trimmed = text.trim();
    return /[.!?]$/.test(trimmed);
  }

  function startsWithNewTopic(text: string): boolean {
    const trimmed = text.trim().toLowerCase();
    const topicStarters = [
      "so ",
      "now ",
      "anyway ",
      "okay ",
      "well ",
      "but ",
      "however ",
      "first ",
      "second ",
      "third ",
      "next ",
      "then ",
      "finally ",
      "meanwhile ",
      "also ",
      "additionally ",
      "furthermore "
    ];
    return topicStarters.some((starter) => trimmed.startsWith(starter));
  }

  const segments = $derived(parseTranscription(transcription));
  const activeSegmentIndex = $derived(
    segments.findIndex((segment) => {
      if (segment.originalSegments) {
        return segment.originalSegments.some(
          (originalSeg) =>
            currentTime >= originalSeg.startTime &&
            currentTime < originalSeg.endTime
        );
      }
      return currentTime >= segment.startTime && currentTime < segment.endTime;
    })
  );

  let segmentElements: HTMLElement[] = [];
  let scrollContainer: HTMLElement;
  let previousActiveIndex = -1;

  $effect(() => {
    if (
      activeSegmentIndex !== -1 &&
      activeSegmentIndex !== previousActiveIndex &&
      segmentElements[activeSegmentIndex] &&
      scrollContainer
    ) {
      const activeElement = segmentElements[activeSegmentIndex];
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();

      const isElementVisible =
        elementRect.top >= containerRect.top &&
        elementRect.bottom <= containerRect.bottom;

      if (!isElementVisible) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        });
      }
      previousActiveIndex = activeSegmentIndex;
    }
  });

  function handleTimestampClick(segment: TranscriptionSegment) {
    onSeek?.({ time: segment.startTime });
  }
</script>

<div
  class="flex flex-col w-full h-full border border-brs2 rounded-lg overflow-hidden"
>
  <div class="flex-1 overflow-y-auto" bind:this={scrollContainer}>
    {#each segments as segment, index}
      {@const isActive = index === activeSegmentIndex}
      <div
        bind:this={segmentElements[index]}
        class={cn(
          "flex mo:flex-col gap-4 cw:px-2 cw:py-4 px-4 py-6 cursor-pointer transition-colors notouch:hover:bg-bgs2 active:bg-bgs2",
          {
            "bg-aps3": index === activeSegmentIndex,
            "border-b border-brs2":
              !groupSegments || index < segments.length - 1
          }
        )}
        onclick={() => handleTimestampClick(segment)}
        role="button"
        tabindex="0"
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTimestampClick(segment);
          }
        }}
      >
        <div class="flex-shrink-0 w-12">
          <div
            class={cn(
              "text-b3 font-mono tabular-nums px-1 py-0.5 rounded text-center transition-colors",
              {
                "bg-aps1 text-abg": index === activeSegmentIndex,
                "text-fgs2 bg-bgs2": index !== activeSegmentIndex
              }
            )}
          >
            {segment.timeDisplay}
            {#if dev_isDisplayOriginalSegmentCount && segment.originalSegments && segment.originalSegments.length > 1}
              <div class="text-xs text-fgs3 mt-0.5">
                +{segment.originalSegments.length - 1}
              </div>
            {/if}
          </div>
        </div>
        <div
          class={cn("flex-1 text-b2 px-1", {
            "text-aps1": isActive,
            "text-fgs2": !isActive,
            "leading-relaxed":
              !groupSegments ||
              !segment.originalSegments ||
              segment.originalSegments.length === 1,
            "leading--loose text-justify":
              groupSegments &&
              segment.originalSegments &&
              segment.originalSegments.length > 1
          })}
        >
          {#if hasHighlighting}
            {@html renderMdAsHtml(segment.text)}
          {:else}
            {segment.text}
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
