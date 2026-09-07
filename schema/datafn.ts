import { defineSchema } from "@datafn/core";
import {
  allFeatureIds,
  composeDefinition
} from "./features";

const composed = composeDefinition(allFeatureIds);

export const nucleumDatafnSchema = defineSchema({
  version: 1,
  namespaced: true,
  relationIntegrity: "database",
  defaultPermissions: {
    read: "allResourceFields",
    write: "allResourceFields",
    relationWrites: "all"
  },
  resources: composed.resources,
  relations: composed.relations
});

export type NucleumDatafnSchema = typeof nucleumDatafnSchema;
export type NucleumDatafnResource =
  NucleumDatafnSchema["resources"][number]["name"];

export default nucleumDatafnSchema;
