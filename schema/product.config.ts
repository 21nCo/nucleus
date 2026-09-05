import { Resource } from "./resource.enum";
import { resolveProductTableNames } from "./features";
import { Extension, Product } from "./product.type";

export interface IProductConfigBase {
  name: string;
  resources: {
    browse: Resource[];
    table: Resource[];
  };
  displayName: string;
  tagline: string;
  databaseName?: string;
}

function productTables(product: Product): Resource[] {
  return resolveProductTableNames(product) as Resource[];
}

export function resolveProductResourceConfig(
  product: Product | string,
  options: { isDev?: boolean } = {}
) {
  const base = productRegistry[product as Product];
  if (!base) return { browse: [], table: [] };
  const browse = [...base.resources.browse];
  if (
    product === Product.NUCLEUM &&
    options.isDev &&
    !browse.includes(Resource.space)
  ) {
    browse.push(Resource.space);
  }
  return {
    browse,
    table: [...base.resources.table]
  };
}

export const productRegistry: Record<Product, IProductConfigBase> = {
  [Product.NUCLEUM]: {
    name: "Nucleum",
    databaseName: "nativeone",
    resources: {
      browse: [Resource.collection, Resource.event],
      table: productTables(Product.NUCLEUM)
    },
    displayName: "Nucleum",
    tagline: "Your digital harmony"
  },
  [Product.MEMOTRON]: {
    name: "Memotron",
    databaseName: "nativeone",
    resources: {
      browse: [Resource.node, Resource.collection],
      table: productTables(Product.MEMOTRON)
    },
    displayName: "Memotron",
    tagline: "Your memory partner"
  },
  [Product.POINTRON]: {
    name: "Pointron",
    databaseName: "pointone",
    resources: {
      browse: [
        Resource.objective,
        Resource.task,
        Resource.collection,
        Resource.event
      ],
      table: productTables(Product.POINTRON)
    },
    displayName: "Pointron",
    tagline: "Your focus haven"
  }
};

export const sharedExtensions: Record<Extension, IProductConfigBase> = {
  [Extension.MEMOTRON_CLIPPER]: {
    name: "Memotron Clipper",
    resources: {
      browse: [],
      table: productTables(Product.MEMOTRON)
    },
    displayName: "Memotron Clipper",
    tagline: ""
  },
  [Extension.MEMOTRON_SHARE]: {
    name: "Memotron Share",
    resources: {
      browse: [],
      table: []
    },
    displayName: "Memotron Share",
    tagline: ""
  }
};
