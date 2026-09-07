

/**
 * The type of data the store holds
 */
export enum StoreDataType {
  /**
   * Finite and infrequently mutated Records
   */
  FIR = "FIR",
  /**
   *
   * Infinite and frequently mutated Records
   */
  IFR = "IFR",
  /**
   * @deprecated
   * Finite and Constant system Records
   */
  FCR = "FCR",
  /**
   * Key Value Object - cached and persisted to remote database
   */
  KVO = "KVO",
  /**
   * Not Applicable - Non persisting Client store for UI state management
   */
  NA = "NA"
}
