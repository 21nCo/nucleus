<script lang="ts">
  import { onMount } from "svelte";
  import GridInputElement from "@nucleum/products/memotron/lab/infiniteGrid/GridInputElement.svelte";
  import { userPreferences } from "@nucleum/components/settings/userPreferences.store";
  import { generateUID } from "@21n/utils/utils";

  let canvasWidth = window.innerWidth / 1.5;
  let canvasHeight = window.innerHeight / 1.5;

  let spacing = 5;
  let cellSize = (canvasWidth - spacing * 3) / 3;
  let oneSquare = cellSize + spacing;
  let prevWidth = window.innerWidth;
  let prevHeight = window.innerHeight;

  let rows = canvasWidth / oneSquare;
  let cols = canvasWidth / oneSquare;
  let grid: any = $userPreferences.infiniteGrid.grid;

  function syncGrid() {
    userPreferences.setInfiniteGrid({ grid });
  }

  function createGrid() {
    console.log("creating grid", { rows }, { cols });
    grid = [];
    for (let i = 0; i < rows; i++) {
      let row = [];
      let rowPosition = i * oneSquare;
      for (let j = 0; j < cols; j++) {
        row.push({
          id: generateUID(),
          value: "type here",
          index: { r: i, c: j },
          top: rowPosition,
          children: [],
          left: j * oneSquare,
          size: cellSize
        });
      }
      grid.push(row);
    }
    syncGrid();
    console.log("grid created", { grid });
  }
  function addRow() {
    let row = [];
    let rowPosition = grid.length * oneSquare;
    for (let j = 0; j < cols; j++) {
      row.push({
        id: generateUID(),
        index: { r: grid.length, c: j },
        top: rowPosition,
        children: [],
        left: j * oneSquare,
        size: cellSize
      });
    }
    grid.push(row);
    syncGrid();
  }
  function addCell(
    { r, c }: { r: number; c: number },
    position: "bottom" | "right"
  ) {
    console.log("add cell", { r, c, position });
    if (position === "bottom") r = r + 1;
    else c = c + 1;
    let row;
    if (r < grid.length) row = grid[r];
    else {
      grid[r] = [];
      row = grid[r];
    }
    console.log("after modification", { ...row }, { r }, { c });
    let cell = {
      id: generateUID(),
      value: "type here",
      index: { r: r, c: c },
      top: r * oneSquare,
      children: [],
      left: c * oneSquare,
      size: cellSize
    };
    console.log("b4 splicing row", ...row);
    row.splice(c, 0, cell);
    console.log("after splicing row", ...row);
    // console.log("before splicing grid", ...grid);
    // grid.splice(r, 0, row);
    // console.log("after splicing grid", ...grid);
    for (let i = r; i < grid.length; i++) {
      let row = grid[i];
      console.log("row b4", ...row);
      for (let j = c + 1; j < row.length; j++) {
        row[j].index = { r: i, c: j };
        row[j].top = i * oneSquare;
        row[j].left = j * oneSquare;
      }
      console.log("row after", ...row);
      grid[i] = row;
    }

    // grid[r] = row;
    syncGrid();
    console.log("cell added", { grid });
  }
  function resetGrid() {
    userPreferences.setInfiniteGrid({ isGridCreated: false });
    grid = [];
    createGrid();
  }
  onMount(() => {
    if ($userPreferences.infiniteGrid.isGridCreated) {
      console.log("Grid already created", grid.length);
    } else {
      console.log("Creating Grid");
      createGrid();
      userPreferences.setInfiniteGrid({ isGridCreated: true });
    }
  });
</script>

<button onclick={resetGrid}>Reset Grid</button>
<div
  style="position:relative;width:{canvasWidth}px;height:{canvasWidth}px;border:1px solid pink;overflow:scroll;"
>
  <!-- <div
    style="position:relative;min-width:{canvasWidth}px;min-height:{canvasWidth}px;border:1px solid pink;overflow:scroll;"
  > -->
  {#each grid as row, i}
    {#each row as cell, j}
      <GridInputElement
        bind:value={cell.value}
        bind:size={cell.size}
        bind:childItems={cell.children}
        {...cell}
        onBottomSiblingRequired={() => {
          console.log("bottom");
          addCell(cell.index, "bottom");
        }}
        onRightSiblingRequired={() => {
          console.log("right");
          addCell(cell.index, "right");
        }}
      />
    {/each}
  {/each}
</div>
