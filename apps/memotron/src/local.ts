import packageJson from "../package.json";
import config from "@nucleum/products/memotron/memotron.config";

const { version, build } = packageJson;

export default {
  version,
  build,
  ...config
};
