import {
  BillingCycle,
  PlanType
} from "@nucleum/schema/account/subscription";

export const paymentProductsList = [
  {
    plan: PlanType.CLOUD_SYNC,
    cycle: BillingCycle.MONTHLY,
    dodoTestProductId: "pdt_MYtXY6cpkOmjEXo269U4N",
    dodoProductId: "pdt_xTFstdD3cBAmYZKlEI2TV",
    product: "memotron"
  },
  {
    plan: PlanType.CLOUD_SYNC,
    cycle: BillingCycle.MONTHLY,
    dodoTestProductId: "pdt_pBoTXdFeWgAHrGCjDAVYi",
    dodoProductId: "pdt_UEuGjXjll9jo8nayERMsm",
    product: "pointron"
  },
  {
    plan: PlanType.NUCLEUS,
    cycle: BillingCycle.MONTHLY,
    dodoTestProductId: "pdt_Nvs8lfZ9Y99CRcixIP5qG",
    dodoProductId: "pdt_TTZcVyZgrA1Ih8xBrGGhh"
  },

  //50 discount - Early Adopter
  {
    plan: PlanType.CLOUD_SYNC,
    cycle: BillingCycle.YEARLY,
    discount: 50,
    dodoTestProductId: "pdt_3ATqV7f09SUMeSVN8joDD",
    dodoProductId: "pdt_DH5NSdxU0mcyv8yjfMnqM",
    product: "memotron"
  },
  {
    plan: PlanType.CLOUD_SYNC,
    cycle: BillingCycle.LIFETIME,
    discount: 50,
    dodoTestProductId: "pdt_cNJvkU7N8lRjCQjAuVmy9",
    dodoProductId: "pdt_IPgZlItI9cBGMBHAj42ia",
    product: "memotron"
  },
  {
    plan: PlanType.CLOUD_SYNC,
    cycle: BillingCycle.YEARLY,
    discount: 50,
    dodoTestProductId: "pdt_3ATqV7f09SUMeSVN8joDD",
    dodoProductId: "pdt_FqiPSb8fajdAsKxwjzkF8",
    product: "pointron"
  },
  {
    plan: PlanType.CLOUD_SYNC,
    cycle: BillingCycle.LIFETIME,
    discount: 50,
    dodoTestProductId: "pdt_cNJvkU7N8lRjCQjAuVmy9",
    dodoProductId: "pdt_BfTG3nu8r9VdmNNWoIa8Q",
    product: "pointron"
  },
  {
    plan: PlanType.NUCLEUS,
    cycle: BillingCycle.YEARLY,
    discount: 50,
    dodoTestProductId: "pdt_jXYEJwqMoo7RpfVgokVtO",
    dodoProductId: "pdt_ejPppPH07UgI5DC0qnUDU"
  },
  {
    plan: PlanType.NUCLEUS,
    cycle: BillingCycle.LIFETIME,
    discount: 50,
    dodoTestProductId: "pdt_gIRu875ZyIKNMR4U1q0UF",
    dodoProductId: "pdt_NUDpIXPeNf5wh4AIfIZnE"
  },

  //35 discount - Early user
  {
    plan: PlanType.CLOUD_SYNC,
    cycle: BillingCycle.YEARLY,
    discount: 35,
    dodoTestProductId: "pdt_TOLdH2hskLlGQ1pxEEkSH",
    dodoProductId: "pdt_tCMjSn3DStHziY4G2cdve",
    product: "memotron"
  },
  {
    plan: PlanType.CLOUD_SYNC,
    cycle: BillingCycle.LIFETIME,
    discount: 35,
    dodoTestProductId: "pdt_biVLxJLLWGTLxQKB57Syn",
    dodoProductId: "pdt_4TCQNdEKSucBmCHUCfMts",
    product: "memotron"
  },
  {
    plan: PlanType.CLOUD_SYNC,
    cycle: BillingCycle.YEARLY,
    discount: 35,
    dodoTestProductId: "pdt_4y61JxSOOcNQeqOHwrxZF",
    dodoProductId: "pdt_1ECJfhNg1dVBIRSWSZnqJ",
    product: "pointron"
  },
  {
    plan: PlanType.CLOUD_SYNC,
    cycle: BillingCycle.LIFETIME,
    discount: 35,
    dodoTestProductId: "pdt_vdYmzl4h8nZbFsYQgwpZy",
    dodoProductId: "pdt_GJAEvMsvYXWJvUOXV0e4w",
    product: "pointron"
  },
  {
    plan: PlanType.NUCLEUS,
    cycle: BillingCycle.YEARLY,
    discount: 35,
    dodoTestProductId: "pdt_JN7Of2q0iLVj90hH102a9",
    dodoProductId: "pdt_FXWSeK6sr5IAUVpbtIk5q"
  },
  {
    plan: PlanType.NUCLEUS,
    cycle: BillingCycle.LIFETIME,
    discount: 35,
    dodoTestProductId: "pdt_9x100GN44er5Z70i4ukme",
    dodoProductId: "pdt_h2qgOrJjR1IHPYoWT4IPM"
  }
];
