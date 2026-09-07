import packageJson from "../package.json";
import config from "@nucleum/products/pointron/pointron.config";

const { version, build } = packageJson;

export default {
  version,
  build,
  ...config
};
