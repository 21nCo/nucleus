import { TimeScale } from "@21n/utils/time.type";

export function pieLabelFormatter(d: any) {
  //console.log(d);
  if (d.percentageValue < 5) return "";
  else if (d.percentageValue < 10) return `${d.percentageValue.toFixed(1)}%`;
  else return `${d.value.toFixed(1)} hrs (${d.percentageValue.toFixed(1)}%)`;
}

export function determineCarbonChartTimeInterval(scale: TimeScale) {
  switch (scale) {
    case TimeScale.DAYS:
      return "daily";
    case TimeScale.WEEKS:
      return "weekly";
    case TimeScale.MONTHS:
      return "monthly";
    case TimeScale.QUARTERS:
      return "quarterly";
    case TimeScale.YEARS:
      return "yearly";
  }
}
