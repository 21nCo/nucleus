interface CryptoJsHashLike {
  toString(): string;
}

interface CryptoJsLike {
  SHA256(content: string): CryptoJsHashLike;
}

interface InstagramEmbedsLike {
  process(): void;
}

interface InstagramRuntimeLike {
  Embeds: InstagramEmbedsLike;
}

interface NucleumNativeConfig {
  webOrigin?: string;
  accountUrl?: string;
  accountDomain?: string;
  debugSinkUrl?: string;
  defaultRegion?: string;
  environment?: string;
  product?: string;
}

declare var CryptoJS: CryptoJsLike;

interface Window {
  instgrm?: InstagramRuntimeLike;
  __NUCLEUM_NATIVE_CONFIG__?: NucleumNativeConfig;
}

declare module "qrcode" {
  interface QRCodeColorOptions {
    dark?: string;
    light?: string;
  }

  interface QRCodeToCanvasOptions {
    color?: QRCodeColorOptions;
    margin?: number;
    width?: number;
  }

  const QRCode: {
    toCanvas(
      canvas: HTMLCanvasElement,
      text: string,
      options?: QRCodeToCanvasOptions,
    ): Promise<void>;
  };

  export default QRCode;
}

declare module "node-fetch" {
  const fetch: typeof globalThis.fetch;
  export default fetch;
}

declare module "@carbon/charts-svelte" {
  import { SvelteComponentTyped } from "svelte";

  export type ChartOptions = any;
  export type BarChartOptions = any;

  export const Alignments: any;
  export const ChartTheme: any;
  export const ScaleTypes: any;

  export class AreaChart extends SvelteComponentTyped<any, any, any> {}
  export class BarChartSimple extends SvelteComponentTyped<any, any, any> {}
  export class BarChartStacked extends SvelteComponentTyped<any, any, any> {}
  export class DonutChart extends SvelteComponentTyped<any, any, any> {}
  export class GaugeChart extends SvelteComponentTyped<any, any, any> {}
  export class LineChart extends SvelteComponentTyped<any, any, any> {}
  export class PieChart extends SvelteComponentTyped<any, any, any> {}
  export class StackedAreaChart extends SvelteComponentTyped<any, any, any> {}
}
