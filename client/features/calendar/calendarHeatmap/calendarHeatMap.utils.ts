import { TileAppearance } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.types";
import { get } from "svelte/store";
import {
  isArrayWithSameValue,
  isValidArrayWithData
} from "@21n/shared-utils/obj.utils";
import type {
  ICalendarHeatMapDataProvider,
  CalendarHeatmapOptions,
  DailyData,
  MonthlyData,
  YearlyData
} from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.types";
import { CalendarHeatMapData } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.store";
import { TimeScale } from "@21n/utils/time.type";
import { kmeans } from "ml-kmeans";

let profileStartdate = "2023-02-19"; //replace the value with with logs start date variable
let profileStartmonth = profileStartdate.slice(0, 7); //*important don't delete even if it shows value never used
let profileStartyear = profileStartdate.slice(0, 4); //*important don't delete even if it shows value never used
let currentdate = new Date().toISOString().split("T")[0];
let currentmonth = currentdate.slice(0, 7); //*important don't delete even if it shows value never used
let currentyear = currentdate.slice(0, 4); //*important don't delete even if it shows value never used
export function getprevDateRange(
  months = 12,
  currentDate = new Date()
): {
  firstMonthEndDate: Date;
  lastMonthStartDate: Date;
} {
  let result: { firstMonthEndDate: Date; lastMonthStartDate: Date } = {
    firstMonthEndDate: new Date(),
    lastMonthStartDate: new Date()
  };

  const lastDayOfLastMonth = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth() - months + 1,
      0
    )
  );

  const firstDayOfNextMonth = new Date(
    Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 1)
  );

  result.firstMonthEndDate = lastDayOfLastMonth;

  result.lastMonthStartDate = firstDayOfNextMonth;

  return result;
}
function getNextDateRange(
  months = 12,
  currentDate = new Date()
): {
  firstMonthEndDate: Date;
  lastMonthStartDate: Date;
} {
  let result: { firstMonthEndDate: Date; lastMonthStartDate: Date } = {
    firstMonthEndDate: new Date(),
    lastMonthStartDate: new Date()
  };

  const lastDayOfCurrentMonth = new Date(
    Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 0)
  );

  const firstDayOfNextMonth = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth() + months + 1,
      1
    )
  );

  result.firstMonthEndDate = lastDayOfCurrentMonth;

  result.lastMonthStartDate = firstDayOfNextMonth;

  return result;
}
function getYearRange(year: number): {
  lastYearEndDate: Date;
  nextYearStartDate: Date;
} {
  const lastYearEndDate = new Date(Date.UTC(year, 0, 0));
  const nextYearStartDate = new Date(Date.UTC(year + 1, 0, 1));
  return {
    lastYearEndDate,
    nextYearStartDate
  };
}
function getRandomValue(min = 0, max = 10) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
let data: DailyData[] = [];
function generateDailyDataInRange(startDate: Date, endDate: Date) {
  const data: DailyData[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    data.push({
      date: date.toISOString().split("T")[0],
      value: 0 //getRandomValue()
    });
  }

  return data;
}
function generateMonthlyDataInRange(
  startYear: number,
  endYear: number
): MonthlyData[] {
  const monthlyData: MonthlyData[] = [];
  let monthString = `${(startYear - 1).toString()}-${(12)
    .toString()
    .padStart(2, "0")}`;
  let data: MonthlyData = {
    month: monthString,
    value: getRandomValue(90, 300)
  };
  monthlyData.push(data);
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      monthString = `${year.toString()}-${month.toString().padStart(2, "0")}`;
      data = {
        month: monthString,
        value: getRandomValue(90, 300) //change to zero by default
      };
      monthlyData.push(data);
    }
  }
  monthString = `${(endYear + 1).toString()}-${(1)
    .toString()
    .padStart(2, "0")}`;
  data = {
    month: monthString,
    value: getRandomValue(90, 300) //change to zero by default
  };
  monthlyData.push(data);
  return monthlyData;
}
function generateYearlyDataInRange(
  startYear: number,
  endYear: number
): YearlyData[] {
  const yearlyData: YearlyData[] = [];
  for (let year = startYear - 1; year <= endYear + 1; year++) {
    const yearlyValue = getRandomValue(2900, 3600);
    const data: YearlyData = {
      year: year,
      value: yearlyValue
    };
    yearlyData.push(data);
  }
  return yearlyData;
}
function resolveStreakDisplay(prev: any, curr: any, next: any, target: number) {
  if (
    (prev == null || prev.value < target) &&
    next !== null &&
    next.value >= target
  ) {
    return Number(TileAppearance.FTile);
  } else if (prev != null && prev.value >= target) {
    if (next !== null && next.value >= target) {
      return Number(TileAppearance.MTile);
    } else {
      return Number(TileAppearance.LTile);
    }
  } else {
    return Number(TileAppearance.DEFAULT);
  }
}

function getMonthName(month: number) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  return monthNames[month - 1];
}
function convertToMonthWiseData(dailyData: any) {
  const monthWiseData = {};
  let currentMonth = null;
  let currentMonthData = [];

  for (const data of dailyData) {
    const [year, month] = data.date.split("-");
    const monthKey = getMonthName(Number(month));
    //+ "-" + year;

    if (currentMonth === null) {
      currentMonth = monthKey;
    }

    if (currentMonth !== monthKey) {
      monthWiseData[currentMonth] = currentMonthData;
      currentMonthData = [];
      currentMonth = monthKey;
    }

    currentMonthData.push(data);
  }

  if (currentMonthData.length > 0) {
    monthWiseData[currentMonth] = currentMonthData;
  }

  return monthWiseData;
}
function convertToYearWiseData(monthlyData: MonthlyData[]) {
  const yearWiseData: any = {};

  monthlyData.forEach((data) => {
    const year = data.month.slice(0, 4);
    // const year = new Date(data.month).getFullYear();
    if (!yearWiseData[year]) {
      yearWiseData[year] = [];
    }
    yearWiseData[year].push(data);
  });

  return yearWiseData;
}
function convertToQuadrennialWiseData(yearlyData: YearlyData[]) {
  const qadrennialWiseData: any = {};

  for (let i = 0; i < yearlyData.length; i += 4) {
    const fourYearsData = yearlyData.slice(i, i + 4);
    const startingYear = yearlyData[i].year;
    const key = `QD${startingYear.toString().slice(2)}`;
    qadrennialWiseData[key] = fourYearsData;
  }

  return qadrennialWiseData;
}
function convertToOriginalForm(data: any) {
  const originalData: any[] = [];

  for (const key in data) {
    const individualData = data[key];

    for (const data of individualData) {
      originalData.push(data);
    }
  }
  return originalData;
}

export class CalendarHeatmapDataManager {
  defaultTarget = 9999999999;
  provider: ICalendarHeatMapDataProvider;
  options: CalendarHeatmapOptions;
  constructor(
    provider: ICalendarHeatMapDataProvider,
    options: CalendarHeatmapOptions
  ) {
    this.provider = provider;
    this.options = options;
  }

  resolveTileColorAndStreakDisplay2(prev: any, current: any, next: any) {
    let display = Number(TileAppearance.DEFAULT);
    if (current.value >= current.target) {
      display = resolveStreakDisplay(prev, current, next, 0);
    }
    return [
      display,
      current.value >= current.target ? 5 : current.clusterIndex
    ];
  }

  assignClusterIndex(inputData: any[]) {
    inputData = inputData.map((x) => {
      return { ...x, clusterIndex: 0 };
    });
    const nonZeroValues = inputData.filter((x) => x.value > 0);
    if (!isValidArrayWithData(nonZeroValues)) {
      return inputData;
    } else if (
      nonZeroValues.length == 1 ||
      isArrayWithSameValue(nonZeroValues.map((x) => x.value))
    ) {
      return inputData.map((x) => ({
        ...x,
        clusterIndex: x.value > 0 ? 4 : 0
      }));
    }
    const valuesForK = nonZeroValues.map((x) => [x.value]);
    const maxVal = Math.max(...valuesForK.map((val) => val[0]));
    const minVal = Math.min(...valuesForK.map((val) => val[0]));
    const normalizedValuesForK = valuesForK.map((val) => [
      (val[0] - minVal) / (maxVal - minVal)
    ]);
    const clusterCount = Math.min(valuesForK.length, 6);
    const k = kmeans(normalizedValuesForK, clusterCount, {});
    inputData = inputData.map((x, i) => {
      if (x.value === 0) return { ...x, clusterIndex: -1 };
      const index = nonZeroValues.findIndex((y) => y.date === x.date);
      return { ...x, clusterIndex: k.clusters[index] };
    });
    const grouped = inputData.reduce((acc, cur) => {
      if (!acc[cur.clusterIndex]) {
        acc[cur.clusterIndex] = {
          sum: cur.value,
          count: 1
        };
      } else {
        acc[cur.clusterIndex].sum += cur.value;
        acc[cur.clusterIndex].count++;
      }
      return acc;
    }, {});
    const means = Object.keys(grouped).map((clusterIndex) => ({
      clusterIndex: parseInt(clusterIndex),
      mean: grouped[clusterIndex].sum / grouped[clusterIndex].count
    }));
    means.sort((a, b) => a.mean - b.mean);
    const clusterIndexMap = means.reduce((acc, cur, idx) => {
      acc[cur.clusterIndex] = idx;
      return acc;
    }, {});
    inputData = inputData.map((item) => ({
      ...item,
      clusterIndex: clusterIndexMap[item.clusterIndex]
    }));
    return inputData;
  }

  findHeatandStreak(
    inputData: any[],
    prevEnd: any,
    nextStart: any,
    dataType: "date" | "month" | "year"
  ) {
    let length = inputData.length;
    inputData = this.assignClusterIndex(inputData);
    if (
      new Date(`prevEnd.${dataType}`) <=
      new Date(`profileStart${dataType}`.toString())
    ) {
      const returnValue: any = this.resolveTileColorAndStreakDisplay2(
        null,
        inputData[0],
        inputData[1]
      );
      inputData[0].display = returnValue[0];
      inputData[0].color = returnValue[1];
    } else {
      const returnValue: any = this.resolveTileColorAndStreakDisplay2(
        prevEnd,
        inputData[0],
        inputData[1]
      );
      inputData[0].display = returnValue[0];
      inputData[0].color = returnValue[1];
    }
    for (let i = 1; i < length - 1; i++) {
      const returnValue = this.resolveTileColorAndStreakDisplay2(
        inputData[i - 1],
        inputData[i],
        inputData[i + 1]
      );
      inputData[i].display = returnValue[0];
      inputData[i].color = returnValue[1];
    }
    if (
      new Date(`nextStart.${dataType}`) >=
      new Date(`current${dataType}`.toString())
    ) {
      const returnValue: any = this.resolveTileColorAndStreakDisplay2(
        inputData[length - 2],
        inputData[length - 1],
        null
      );
      inputData[length - 1].display = returnValue[0];
      inputData[length - 1].color = returnValue[1];
    } else {
      const returnValue: any = this.resolveTileColorAndStreakDisplay2(
        inputData[length - 2],
        inputData[length - 1],
        nextStart
      );
      inputData[length - 1].display = returnValue[0];
      inputData[length - 1].color = returnValue[1];
    }
    // console.log({ inputData: deepCopy(inputData) });
    return inputData;
  }

  async fetchMonthlyDataAndMerge(
    data: MonthlyData[],
    startYear: number,
    endYear: number
  ) {
    let prevEnd: any = data.splice(0, 1)[0];
    let nextStart: any = data.splice(data.length - 1, 1)[0];
    const df = {
      monthlyData: data,
      prevEnd,
      nextStart
    };
    let apiResponse = await this.provider.fetchJournal(
      TimeScale.MONTHS,
      startYear,
      endYear
    );
    if (!apiResponse || !isValidArrayWithData(apiResponse)) return df;
    const modified = data.map((x) => {
      let apiItem = apiResponse.find(
        (item: any) =>
          item.month.split("-")[0] === x.month.split("-")[0] &&
          Number(item.month.split("-")[1]) === Number(x.month.split("-")[1])
      );
      if (apiItem) {
        x.value = apiItem.value / (60 * 60);
      } else {
        x.value = 0;
      }
      return { ...x, target: apiItem?.target ?? this.defaultTarget };
    });
    prevEnd = modified.splice(0, 1)[0];
    nextStart = modified.splice(modified.length - 1, 1)[0];
    return {
      monthlyData: modified,
      prevEnd,
      nextStart
    };
  }

  async splitMonthlyDataArrayAndMerge(
    request: "prev" | "next",
    data: MonthlyData[],
    target: number
  ) {
    let monthData: any;
    let startYear: number;
    let endYear: number;
    let result: MonthlyData[] = [];

    if (request === "prev") {
      const uniqueYears = new Set(data.map((item) => item.month.slice(0, 4)));
      const firstYears = Array.from(uniqueYears).slice(0, 11);
      startYear = parseInt(firstYears[0]);
      endYear = parseInt(firstYears[firstYears.length - 1]);
      monthData = data.filter((item) => {
        const year = parseInt(item.month.slice(0, 4));
        return year >= startYear && year <= endYear;
      });
      let newMonthData: any = generateMonthlyDataInRange(
        startYear - 11,
        startYear - 1
      );
      let mergedData = await this.fetchMonthlyDataAndMerge(
        newMonthData,
        startYear,
        endYear
      );
      this.findHeatandStreak(
        mergedData.monthlyData,
        mergedData.prevEnd,
        mergedData.nextStart,
        "month"
      );
      monthData = convertToYearWiseData(monthData);
      newMonthData = convertToYearWiseData(mergedData.monthlyData);
      result = Object.assign(newMonthData, monthData);
    } else if (request === "next") {
      const uniqueYears = new Set(data.map((item) => item.month.slice(0, 4)));
      const lastYears = Array.from(uniqueYears).slice(-11);
      startYear = parseInt(lastYears[0]);
      endYear = parseInt(lastYears[lastYears.length - 1]);
      monthData = data.filter((item) => {
        const year = parseInt(item.month.slice(0, 4));
        return year >= startYear && year <= endYear;
      });
      let newMonthData: any = generateMonthlyDataInRange(
        endYear + 1,
        endYear + 11
      );
      let mergedData = await this.fetchMonthlyDataAndMerge(
        newMonthData,
        startYear,
        endYear
      );
      this.findHeatandStreak(
        mergedData.monthlyData,
        mergedData.prevEnd,
        mergedData.nextStart,
        "month"
      );
      monthData = convertToYearWiseData(monthData);
      newMonthData = convertToYearWiseData(mergedData.monthlyData);
      result = Object.assign(monthData, newMonthData);
    }
    return result;
  }
  async paginateMonthlyAggData(time: "prev" | "next") {
    const data = await this.splitMonthlyDataArrayAndMerge(
      time,
      convertToOriginalForm(get(CalendarHeatMapData).data),
      get(CalendarHeatMapData).target
    );
    const current = {
      data,
      target: get(CalendarHeatMapData).target
    };
    CalendarHeatMapData.set(current);
  }
  async fetchMonthlyAggData(startYear: number, endYear: number) {
    let monthlyData = generateMonthlyDataInRange(startYear, endYear);
    let mergedData = await this.fetchMonthlyDataAndMerge(
      monthlyData,
      startYear,
      endYear
    );
    this.findHeatandStreak(
      mergedData.monthlyData,
      mergedData.prevEnd,
      mergedData.nextStart,
      "month"
    );
    let yearWiseData = convertToYearWiseData(mergedData.monthlyData);
    mergedData.monthlyData = yearWiseData;
    CalendarHeatMapData.set(mergedData.monthlyData);
  }
  async fetchYearlyDataAndMerge(
    data: YearlyData[],
    startYear: number,
    endYear: number
  ) {
    let prevEnd: any = data.splice(0, 1)[0];
    let nextStart: any = data.splice(data.length - 1, 1)[0];
    const df = {
      yearlyData: data,
      prevEnd,
      nextStart
    };
    let apiResponse = await this.provider.fetchJournal(
      TimeScale.YEARS,
      startYear,
      endYear
    );
    if (!apiResponse || !isValidArrayWithData(apiResponse)) return df;
    const modified = data.map((x) => {
      let apiItem = apiResponse.find((item: any) => item.year === x.year);
      if (apiItem) {
        x.value = apiItem.value / (60 * 60);
      } else {
        x.value = 0;
      }
      return { ...x, target: apiItem?.target ?? this.defaultTarget };
    });
    prevEnd = modified.splice(0, 1)[0];
    nextStart = modified.splice(modified.length - 1, 1)[0];
    return {
      yearlyData: modified,
      prevEnd,
      nextStart
    };
  }
  async splitYearlyDataArrayAndMerge(
    request: "prev" | "next",
    data: YearlyData[],
    target: number
  ) {
    let yearData: any;
    let startYear: number;
    let endYear: number;
    let result: YearlyData[] = [];

    if (request === "prev") {
      yearData = data.slice(0, 24); //.map((item) => item.year);
      startYear = yearData[0].year;
      endYear = yearData[yearData.length - 1].year;
      let newYearData: any = generateYearlyDataInRange(
        startYear - 24,
        startYear - 1
      );
      let mergedData = await this.fetchYearlyDataAndMerge(
        newYearData,
        startYear,
        endYear
      );
      this.findHeatandStreak(
        mergedData.yearlyData,
        mergedData.prevEnd,
        mergedData.nextStart,
        "year"
      );
      yearData = convertToQuadrennialWiseData(yearData);
      newYearData = convertToQuadrennialWiseData(mergedData.yearlyData);
      result = Object.assign(newYearData, yearData);
    } else if (request === "next") {
      yearData = data.slice(24); //.map((item) => item.year);
      startYear = yearData[0].year;
      endYear = yearData[yearData.length - 1].year;
      let newYearData: any = generateYearlyDataInRange(
        endYear + 1,
        endYear + 24
      );
      let mergedData = await this.fetchYearlyDataAndMerge(
        newYearData,
        startYear,
        endYear
      );
      this.findHeatandStreak(
        mergedData.yearlyData,
        mergedData.prevEnd,
        mergedData.nextStart,
        "year"
      );
      yearData = convertToQuadrennialWiseData(yearData);
      newYearData = convertToQuadrennialWiseData(mergedData.yearlyData);
      result = Object.assign(yearData, newYearData);
    }
    return result;
  }
  async paginateYearlyAggData(time: "prev" | "next") {
    const data = await this.splitYearlyDataArrayAndMerge(
      time,
      convertToOriginalForm(get(CalendarHeatMapData).data),
      get(CalendarHeatMapData).target
    );
    const current = {
      data,
      target: get(CalendarHeatMapData).target
    };
    CalendarHeatMapData.set(current);
  }
  async fetchYearlyAggData(startYear: number, endYear: number) {
    let yearlyData = generateYearlyDataInRange(startYear, endYear);
    let mergedData = await this.fetchYearlyDataAndMerge(
      yearlyData,
      startYear,
      endYear
    );
    this.findHeatandStreak(
      mergedData.yearlyData,
      mergedData.prevEnd,
      mergedData.nextStart,
      "year"
    );
    let QuadrennialWiseData = convertToQuadrennialWiseData(
      mergedData.yearlyData
    );
    mergedData.yearlyData = QuadrennialWiseData;
    CalendarHeatMapData.set(mergedData.yearlyData);
  }
  async fetchDailyDataAndMerge(
    data: DailyData[],
    startDate: Date,
    endDate: Date
  ) {
    let apiResponse = await this.provider.fetchDailyJournal(startDate, endDate);
    if (!apiResponse || !isValidArrayWithData(apiResponse)) {
      let prevEnd: any = data.splice(0, 1)[0];
      let nextStart: any = data.splice(data.length - 1, 1)[0];
      return {
        dailyData: data,
        prevEnd,
        nextStart
      };
    }
    const modified = data.map((x) => {
      let apiItem = apiResponse.find(
        (item: any) => item.date.split("T")[0] === x.date
      );
      if (apiItem) {
        x.value = apiItem.value / (60 * 60);
      } else {
        x.value = 0;
      }
      return { ...x, target: apiItem?.target ?? this.defaultTarget };
    });
    let prevEnd: any = modified.splice(0, 1)[0];
    let nextStart: any = modified.splice(modified.length - 1, 1)[0];
    return {
      dailyData: modified,
      prevEnd,
      nextStart
    };
  }
  async fillDateValuesColorandAppearance(startDate: Date, endDate: Date) {
    let data = generateDailyDataInRange(startDate, endDate);
    let mergedData = await this.fetchDailyDataAndMerge(
      data,
      startDate,
      endDate
    );
    const transformedData = this.findHeatandStreak(
      mergedData.dailyData,
      mergedData.prevEnd,
      mergedData.nextStart,
      "date"
    );
    let monthWiseData = convertToMonthWiseData(transformedData);
    CalendarHeatMapData.set(monthWiseData);
    return true;
  }
  async splitDailyDataArrayAndMerge(
    request: "prev" | "next",
    data: DailyData[]
  ) {
    let dateData: any;
    let date: Date = new Date();
    let result: DailyData[] = [];
    if (request === "prev") {
      const uniqueMonths = new Set(data.map((item) => item.date.slice(0, 7)));
      const firstMonths = Array.from(uniqueMonths).slice(0, 6);
      dateData = data.filter((item) =>
        firstMonths.includes(item.date.slice(0, 7))
      );
      date = new Date(dateData[0]?.date);
      date.setDate(date.getDate() - 1);
      const dates = getprevDateRange(6, date);
      const newDateData = generateDailyDataInRange(
        dates.firstMonthEndDate,
        dates.lastMonthStartDate
      );
      const mergedData = await this.fetchDailyDataAndMerge(
        newDateData,
        dates.firstMonthEndDate,
        dates.lastMonthStartDate
      );
      this.findHeatandStreak(
        mergedData.dailyData,
        mergedData.prevEnd,
        mergedData.nextStart,
        "date"
      );
      let monthWiseData = convertToMonthWiseData(mergedData.dailyData);
      dateData = convertToMonthWiseData(dateData);
      result = Object.assign(monthWiseData, dateData);
    } else if (request === "next") {
      const uniqueMonths = new Set(data.map((item) => item.date.slice(0, 7)));
      const lastMonths = Array.from(uniqueMonths).slice(-6);
      dateData = data.filter((item) =>
        lastMonths.includes(item.date.slice(0, 7))
      );
      date = new Date(dateData[dateData.length - 1]?.date);
      // date.setDate(date.getDate() - 1);
      const dates = getNextDateRange(6, date);
      const newDateData = generateDailyDataInRange(
        dates.firstMonthEndDate,
        dates.lastMonthStartDate
      );
      const mergedData = await this.fetchDailyDataAndMerge(
        newDateData,
        dates.firstMonthEndDate,
        dates.lastMonthStartDate
      );
      this.findHeatandStreak(
        mergedData.dailyData,
        mergedData.prevEnd,
        mergedData.nextStart,
        "date"
      );
      let monthWiseData = convertToMonthWiseData(mergedData.dailyData);
      dateData = convertToMonthWiseData(dateData);
      result = Object.assign(dateData, monthWiseData);
    }

    return result;
  }
  async paginateDailyData(time: "prev" | "next") {
    const data = await this.splitDailyDataArrayAndMerge(
      time,
      convertToOriginalForm(get(CalendarHeatMapData).data)
    );
    const current = {
      data,
      target: get(CalendarHeatMapData).target
    };
    CalendarHeatMapData.set(current);
  }
  fetchDailyDataForTheYear(year: number) {
    let Dates = getYearRange(year);
    return this.fillDateValuesColorandAppearance(
      Dates.lastYearEndDate,
      Dates.nextYearStartDate
    );
  }
  fetchLast12MonthsDailyData() {
    let Dates = getprevDateRange();
    return this.fillDateValuesColorandAppearance(
      Dates.firstMonthEndDate,
      Dates.lastMonthStartDate
    );
  }
}
