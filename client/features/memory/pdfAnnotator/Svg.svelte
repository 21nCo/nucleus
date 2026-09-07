<script lang="ts">
  let { rectangles }: { rectangles: any[] } = $props();

  function resolveViewBox() {
    const firstRectangle = rectangles?.[0];
    return `0 0 ${firstRectangle?.width ?? 0} ${firstRectangle?.height ?? 0}`;
  }

  function resolvePoints() {
    if (!rectangles?.length) return "";
    const minX = Math.min(...rectangles.map((rectangle) => rectangle.x1));
    const minY = Math.min(...rectangles.map((rectangle) => rectangle.y1));
    const maxX = Math.max(...rectangles.map((rectangle) => rectangle.x2));
    const maxY = Math.max(...rectangles.map((rectangle) => rectangle.y2));

    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
    ]
      .map((point) => `${point.x},${point.y}`)
      .join(" ");
  }
</script>

<svg viewBox={resolveViewBox()}>
  <polygon points={resolvePoints()} stroke="black" fill="yellow" />
</svg>
