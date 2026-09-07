/**
 * Add a new event item here only if it is being used in appEvents.publish to publish and then subscribe to it in the app. Otherwise, PointronAction might be a better place to add the event/action.
 */
export enum PointronEvent {
  INTERVAL_ENDED = "INTERVAL_ENDED",
  BREAK_ENDED = "BREAK_ENDED",
  SESSION_FINISHED = "SESSION_FINISHED",
  SESSION_CLOSED = "SESSION_CLOSED",
  SESSION_TIME_IS_UP = "SESSION_TIME_IS_UP",
  BREAK_REMINDER = "BREAK_REMINDER",
  REFRESH_FOCUSITEMS = "REFRESH_FOCUSITEMS",
  /**
   * @deprecated - use DataFn resource subscriptions instead
   */
  REFRESH_QUICK_FOCUS = "REFRESH_QUICK_FOCUS",
  /**
   * @deprecated - use DataFn resource subscriptions instead
   */
  REFRESH_LOGS = "REFRESH_LOGS"
}
