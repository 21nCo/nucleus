<script lang="ts">
  import { virtualKeyboard } from "@nucleum/actions/viewport";
  let height = 0;
</script>

<div
  use:virtualKeyboard={{
    onKeyboardChange: (isVisible, keyboardHeight) => {
      if (isVisible) {
        height = keyboardHeight + 200;
      } else {
        height = 0;
      }
    }
  }}
  class="w-full bg-bgs4"
  style={`height: ${height}px; min-height: ${height}px;`}
></div>
