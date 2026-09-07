import { TaskDueDateFilter, TaskSubTypeForSwitcher } from "@nucleum/features/focus/tasks/task.type";

export function resolveTaskSubTypesForSwitcher() {
  const byDate = {
    label: "By date",
    value: TaskSubTypeForSwitcher.BY_DATE
  };
  const byMonth = {
    label: "By month",
    value: TaskSubTypeForSwitcher.BY_MONTH
  };
  return [byDate, byMonth];
}

export function resolveTaskDueDateFilters(params?: {
  isDatedContext?: boolean;
}) {
  const withoutDueDate = {
    label: "Without due date",
    value: TaskDueDateFilter.WITHOUT_DUE_DATE,
    icon: "question"
  };
  return [
    {
      label: "All",
      value: TaskDueDateFilter.ALL,
      icon: "asterisk"
    },
    {
      label: "Overdue",
      value: TaskDueDateFilter.OVERDUE,
      icon: "alarm"
    },
    ...(!params?.isDatedContext ? [withoutDueDate] : [])
  ];
}
