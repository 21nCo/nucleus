<script lang="ts">
  import view from "@nucleum/stores/view.store";
  import { Product } from "@nucleum/products/product.type";
  import { PlanType } from "@nucleum/components/subscription/userPlan.type";
  let {
    type,
    product
  }: {
    type: PlanType;
    product: Product;
  } = $props();

  const width = $derived(resolveWidth(type));

  function resolveWidth(type: PlanType) {
    if (type === PlanType.CLOUD_SYNC) {
      if ($view.isConstrainedWidth) {
        return "32";
      }
      return "76";
    }
    if ($view.isConstrainedWidth) {
      return "32";
    }
    return "72";
  }
</script>

{#if type === PlanType.CLOUD_SYNC && product === Product.MEMOTRON}
  <svg
    {width}
    height={width}
    viewBox="0 0 76 76"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M74 38C74 18.1177 57.8822 2 38 2C22.6865 2 9.60617 11.5614 4.40333 25.04M2 38C2 57.8822 18.1177 74 38 74C53.5308 74 66.7645 64.1654 71.8133 50.384M71.8133 50.384L67.088 51.824M71.8133 50.384L74 54.416M4.40333 25.04L2.576 20.72M4.40333 25.04L9.2 23.888"
      class="stroke-fgs1"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M36.2194 27.364C37.2961 26.7423 38.6227 26.7423 39.6994 27.364L46.2653 31.1548C47.342 31.7764 48.0053 32.9253 48.0053 34.1686V41.7502C48.0053 42.9935 47.342 44.1423 46.2653 44.764L39.6994 48.5548C38.6227 49.1764 37.2961 49.1764 36.2194 48.5548L29.6535 44.764C28.5768 44.1423 27.9135 42.9935 27.9135 41.7502V34.1686C27.9135 32.9253 28.5768 31.7764 29.6535 31.1548L36.2194 27.364Z"
      class="stroke-fgs1"
      stroke-width="3"
    />
  </svg>
{:else if type === PlanType.CLOUD_SYNC && product === Product.POINTRON}
  <svg
    {width}
    height={width}
    viewBox="0 0 76 76"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M74 38C74 18.1177 57.8822 2 38 2C22.6865 2 9.60617 11.5614 4.40333 25.04M2 38C2 57.8822 18.1177 74 38 74C53.5308 74 66.7645 64.1654 71.8133 50.384M71.8133 50.384L67.088 51.824M71.8133 50.384L74 54.416M4.40333 25.04L2.576 20.72M4.40333 25.04L9.2 23.888"
      class="stroke-fgs1"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="38" cy="38" r="11" class="stroke-fgs1" stroke-width="3" />
  </svg>
{:else}
  <svg
    {width}
    height={width}
    viewBox="0 0 72 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M51.5 9.14725C46.9403 6.50961 41.6465 5 36 5C18.8792 5 5 18.8792 5 36C5 45.4956 9.26934 53.9941 15.9932 59.6806M23.5139 64.3827C27.3338 66.0656 31.5578 67 36 67C53.1208 67 67 53.1208 67 36C67 27.4589 63.5459 19.7246 57.9583 14.1178"
      class="stroke-fgs1"
      stroke-width="3"
      stroke-linecap="round"
    />
    <circle
      cx="36.0024"
      cy="36.0024"
      r="13.7778"
      class="stroke-fgs1"
      stroke-width="3"
    />
    <circle
      cx="35.8979"
      cy="35.8979"
      r="4.98776"
      class="stroke-fgs1"
      stroke-width="3"
    />
    <circle
      cx="36.0002"
      cy="36.0012"
      r="22.3889"
      class="stroke-fgs1"
      stroke-width="3"
    />
    <circle
      cx="57.9862"
      cy="4.98621"
      r="2.73103"
      class="stroke-fgs1"
      stroke-width="1.48966"
    />
    <circle cx="63.5" cy="11.5" r="1.5" class="fill-fgs1" />
    <circle cx="4.5" cy="14.5" r="1.5" class="fill-fgs1" />
    <circle cx="2.5" cy="23.5" r="1.5" class="fill-fgs1" />
    <circle cx="2.5" cy="57.5" r="1.5" class="fill-fgs1" />
    <circle cx="15.5" cy="68.5" r="1.5" class="fill-fgs1" />
    <circle cx="49.5" cy="2.5" r="1.5" class="fill-fgs1" />
    <circle
      cx="5.95828"
      cy="65.5247"
      r="4.22069"
      class="stroke-fgs1"
      stroke-width="1.48966"
    />
  </svg>
{/if}
