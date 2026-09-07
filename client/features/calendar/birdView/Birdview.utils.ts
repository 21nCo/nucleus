export const monthNames: string[] = [
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

export const dayNames: string[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];
export const currentDate = new Date();
export const currentMonthIndex = currentDate.getMonth();
export const currentMonth = monthNames[currentMonthIndex];
export const currentYear = currentDate.getFullYear();
export const currentMonthEndDate = getDaysInMonth(
  monthNames.indexOf(currentMonth),
  currentYear
);
export function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function waitForTimeout(func: () => void) {
  return new Promise<void>((resolve) => {
    setTimeout(async () => {
      await func();
      resolve();
    }, 10);
  });
}

export function getFirstAlphabetPosition(str: string) {
  const match = str.match(/[a-zA-Z]/);
  return match ? match.index : -1;
}

export function getLastAlphabetPosition(str: string) {
  const match = str.match(/[a-z]/gi);
  return match ? str.lastIndexOf(match[match.length - 1]) : -1;
}

export function getISOfromDateString(dateString: string) {
  const firstAlphPos = getFirstAlphabetPosition(dateString);
  const lastAlphPos = getLastAlphabetPosition(dateString);
  const year = Number(dateString.slice(0, firstAlphPos));
  const month = monthNames.indexOf(
    dateString.slice(firstAlphPos, lastAlphPos + 1)
  );
  const day = Number(dateString.slice(lastAlphPos + 1));
  const date = new Date(Date.UTC(year, month, day));
  return date.toISOString();
}

export async function scrollDateSlotIntoView(dateSlot: string) {
  const parentElement: any = document.querySelector("#birdViewPanelsContainer");
  const element: any = document.querySelector(`[data-date="${dateSlot}"]`);
  // const elementWidth=element.offsetWidth;
  const parentElementWidth = parentElement.offsetWidth;
  let exisitingBG = "";
  if (!element || !parentElement) return;
  const scrollLeft = element.offsetLeft - parentElementWidth / 2;
  parentElement.scrollTo({
    left: scrollLeft,
    behavior: "smooth"
  });
  element.classList.forEach((className: string) => {
    if (className.startsWith("bg-")) {
      exisitingBG = className;
    }
  });
  if (exisitingBG != "") element.classList.remove(exisitingBG);
  element.classList.add("bg-aps2");
  setTimeout(() => {
    element.classList.remove("bg-aps2");
    if (exisitingBG != "") element.classList.add(exisitingBG);
  }, 2000);
}
