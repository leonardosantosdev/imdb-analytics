export const formatNumber = (value?: number | null, locale: string = "en-US"): string =>
  new Intl.NumberFormat(locale).format(value ?? 0);

export const formatRating = (value?: number | null, locale: string = "en-US"): string => {
  if (value === null || value === undefined) {
    return "-";
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatYear = (value?: number | null): string =>
  value === null || value === undefined ? "-" : String(value);

export const formatDateTime = (value?: string | null, locale: string = "en-US"): string => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

export const formatDate = (value?: string | null, locale: string = "en-US"): string => {
  if (!value) {
    return "-";
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
    date
  );
};
