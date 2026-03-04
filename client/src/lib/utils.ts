import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("") || "?";
}

export function generateInternalId(): string {
  return Math.random().toString(16).slice(2, 10);
}

export function generateStudentId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 900) + 100;
  return `${year}${num}`;
}

export function generatePaymentId(): string {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `PAY${num}`;
}

export function generateTeacherId(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `TCH${num}`;
}

export function generateSalaryId(): string {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `SAL${num}`;
}
