<script lang="ts">
  import type { IBillingAddress } from "@nucleum/schema/account/subscription";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import Dropdown from "@21n/elements/dropdown/DropDown.svelte";
  import type { InputLabel } from "@21n/elements/input/input.type";
  import { Orientation } from "@21n/elements/direction.enum";
  import type { DropdownItem } from "@21n/elements/dropdown/dropdownItem.type";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonVariant } from "@21n/elements/button/button.type";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import InlineInfoBanner from "@21n/elements/text/InlineInfoBanner.svelte";
  import InlineErrorMessage from "@21n/elements/text/InlineErrorMessage.svelte";
  import { isValidEmail } from "@21n/shared-utils/text.utils";
  let error = $state<string | null>(null);
  let {
    billingAddress = $bindable({
      name: "",
      email: "",
      street: "",
      city: "",
      state: "",
      country: "",
      zipcode: ""
    }),
    onProceed = undefined
  }: {
    billingAddress?: IBillingAddress;
    onProceed?: ((event: CustomEvent<IBillingAddress>) => void) | undefined;
  } = $props();

  const labels = {
    name: {
      label: "Full Name",
      orientation: Orientation.Vertical,
      isMarkRequired: true
    },
    email: {
      label: "Email",
      orientation: Orientation.Vertical,
      isMarkRequired: true
    },
    street: {
      label: "Street Address",
      orientation: Orientation.Vertical,
      isMarkRequired: true
    },
    city: {
      label: "City",
      orientation: Orientation.Vertical,
      isMarkRequired: true
    },
    state: {
      label: "State/Province/Region",
      orientation: Orientation.Vertical,
      isMarkRequired: true
    },
    country: {
      label: "Country",
      orientation: Orientation.Vertical,
      isMarkRequired: true
    },
    zipcode: {
      label: "ZIP/Postal Code",
      orientation: Orientation.Vertical,
      isMarkRequired: true
    }
  } satisfies Record<keyof IBillingAddress, InputLabel>;

  const items: DropdownItem[] = [
    { value: "US", label: "United States" },
    { value: "GB", label: "United Kingdom" },
    { value: "CA", label: "Canada" },
    { value: "AU", label: "Australia" },
    { value: "FR", label: "France" },
    { value: "DE", label: "Germany" },
    { value: "IT", label: "Italy" },
    { value: "ES", label: "Spain" },
    { value: "JP", label: "Japan" },
    { value: "CN", label: "China" },
    { value: "IN", label: "India" },
    { value: "BR", label: "Brazil" },
    { value: "RU", label: "Russian Federation" },
    { value: "ZA", label: "South Africa" },
    { value: "MX", label: "Mexico" },
    { value: "AR", label: "Argentina" },
    { value: "NZ", label: "New Zealand" },
    { value: "SG", label: "Singapore" },
    { value: "AE", label: "United Arab Emirates" },
    { value: "SA", label: "Saudi Arabia" },
    { value: "KR", label: "Korea, Republic of" },
    { value: "ID", label: "Indonesia" },
    { value: "MY", label: "Malaysia" },
    { value: "TH", label: "Thailand" },
    { value: "VN", label: "Vietnam" },
    { value: "PH", label: "Philippines" },
    { value: "TR", label: "Turkey" },
    { value: "IL", label: "Israel" },
    { value: "EG", label: "Egypt" },
    { value: "NG", label: "Nigeria" },
    { value: "KE", label: "Kenya" },
    { value: "GH", label: "Ghana" },
    { value: "MA", label: "Morocco" },
    { value: "TN", label: "Tunisia" },
    { value: "DZ", label: "Algeria" },
    { value: "SE", label: "Sweden" },
    { value: "NO", label: "Norway" },
    { value: "DK", label: "Denmark" },
    { value: "FI", label: "Finland" },
    { value: "NL", label: "Netherlands" },
    { value: "BE", label: "Belgium" },
    { value: "CH", label: "Switzerland" },
    { value: "AT", label: "Austria" },
    { value: "PL", label: "Poland" },
    { value: "CZ", label: "Czech Republic" },
    { value: "HU", label: "Hungary" },
    { value: "GR", label: "Greece" },
    { value: "PT", label: "Portugal" },
    { value: "IE", label: "Ireland" }
  ];

  function handleSubmit() {
    if (isValid()) {
      const proceedEvent = new CustomEvent<IBillingAddress>("proceed", {
        detail: billingAddress
      });
      onProceed?.(proceedEvent);
    }
  }

  function isValid() {
    if (!billingAddress.name) {
      error = "Name is required";
      return false;
    } else if (!billingAddress.email || !isValidEmail(billingAddress.email)) {
      error = "Invalid email address";
      return false;
    } else if (!billingAddress.street) {
      error = "Street address is required";
      return false;
    } else if (!billingAddress.city) {
      error = "City is required";
      return false;
    } else if (!billingAddress.state) {
      error = "State is required";
      return false;
    } else if (!billingAddress.country) {
      error = "Country is required";
      return false;
    } else if (!billingAddress.zipcode) {
      error = "ZIP/Postal Code is required";
      return false;
    }
    return true;
  }
</script>

<div
  class="flex flex-col gap-12 w-full max-w-3xl h-full justify-center items-center p-4"
>
  <div class="flex flex-col gap-4 justify-start w-full">
    <Text content="Enter billing address" style={TextStyle.PANEL_HEADING} />
    <InlineInfoBanner
      content="Billing address is used to process your payment. We don't store any of this on our database."
    />
  </div>
  <div class="grid cw:grid-cols-1 grid-cols-2 gap-4 w-full">
    <TextInput
      label={labels.name}
      placeholder="Enter your full name"
      bind:value={billingAddress.name}
    />

    <TextInput
      label={labels.email}
      type="email"
      placeholder="Enter your email"
      bind:value={billingAddress.email}
    />

    <TextInput
      label={labels.street}
      placeholder="Enter your street address"
      bind:value={billingAddress.street}
    />

    <TextInput
      label={labels.city}
      placeholder="Enter your city"
      bind:value={billingAddress.city}
    />

    <TextInput
      label={labels.state}
      placeholder="Enter your state/province/region"
      bind:value={billingAddress.state}
    />

    <Dropdown
      label={labels.country}
      {items}
      bind:value={billingAddress.country}
    />

    <TextInput
      label={labels.zipcode}
      placeholder="Enter your ZIP/postal code"
      bind:value={billingAddress.zipcode}
    />
  </div>
  <InlineErrorMessage bind:error />
  <div class="flex mt-4">
    <Button onclick={handleSubmit} type={ButtonVariant.PRIMARY} icon="proceed">
      Proceed to Payment
    </Button>
  </div>
</div>
