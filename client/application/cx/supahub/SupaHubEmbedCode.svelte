<script lang="ts">
  let {
    context = "Board"
  }: {
    context?: "Roadmap" | "Changelog" | "Board";
  } = $props();

  $effect(() => {
    localStorage.setItem("supahub-context", context);
  });
</script>

<svelte:head>
  <script id="supahub" type="text/javascript">
    (function (h, u, b) {
      var g = h.createElement(u),
        s = h.getElementsByTagName(u)[0];
      (g.id = b),
        (g.src = "https://widget.supahub.com/sdk.js"),
        s.parentNode.insertBefore(g, s);
      g.onload = function () {
        const token = localStorage.getItem("stoken");
        const context = localStorage.getItem("supahub-context");
        window.SupahubWidget("embed", {
          workspaceName: "blank",
          initialPage: context,
          hideLogo: true,
          hideNav: true,
          jwtToken: token
        });
      };
    })(document, "script", "supahub-sdk");
  </script>
</svelte:head>

<div class="w-full h-full overflow-auto">
  <div data-supahub-embed></div>
</div>
