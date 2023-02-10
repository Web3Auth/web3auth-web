export function getCustomDeviceInfo(): Record<string, string> | undefined {
  if ((navigator as unknown as { brave: boolean })?.brave) {
    return {
      browser: "Brave",
    };
  }
  return undefined;
}

export function checkIfTrueValue(val: unknown): boolean {
  if (val === "0") return false;
  if (!val) return false;
  return true;
}

export function formatDate(date: string | Date): string {
  if (!date) return "";
  const toFormat = date instanceof Date ? date : new Date(date);
  const day = toFormat.getDate().toString().padStart(2, "0");
  const month = (toFormat.getMonth() + 1).toString().padStart(2, "0");
  const year = toFormat.getFullYear().toString().substring(2);
  return `${day}/${month}/${year}, ${toFormat.toLocaleString(undefined, { timeStyle: "short", hour12: false })}`;
}

export function getBrowserIcon(name: string): string {
  const BROWSER_ALIASES: Record<string, string> = {
    Chrome: "chrome",
    Chromium: "chrome",
    Firefox: "firefox",
    Safari: "safari",
    Brave: "brave",
    "Samsung Internet for Android": "android",
    "Microsoft Edge": "edge",
  };

  return BROWSER_ALIASES[name] ? `browser_${BROWSER_ALIASES[name]}` : "browser";
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
