<script lang="ts">
  import PageError from "@nucleum/components/error/PageError.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import { Product } from "@21n/types/product.type";
  import { Action } from "@21n/types/action.enum";
  import { ButtonVariant } from "@21n/types/button.type";
  function resolveMessage(product: Product) {
    if (product === Product.NUCLEUM) {
      return "You don't have access to Nucleum. Please upgrade to a Nucleum plan to continue.";
    }
    return "You don't have access to this page.";
  }

  function resolveActions(product: Product) {
    if (product === Product.NUCLEUM) {
      return [
        {
          label: "Upgrade now",
          icon: "sparkle",
          variant: ButtonVariant.PRIMARY,
          callback: async () => {
            appStore.runAction(Action.USER_PLAN);
          }
        }
      ];
    }
    return [];
  }
</script>

<PageError message={resolveMessage($appStore.product)} />
