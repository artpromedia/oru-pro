export type ClassValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | ClassValue[]
  | { [key: string]: boolean | string | number | null | undefined };

function pushClass(target: string[], value: ClassValue) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => pushClass(target, entry));
    return;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, condition]) => {
      if (condition) {
        target.push(key);
      }
    });
    return;
  }
  target.push(String(value));
}

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  inputs.forEach((value) => pushClass(classes, value));
  return classes.join(" ");
}
