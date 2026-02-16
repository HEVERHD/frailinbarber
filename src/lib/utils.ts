import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const TIMEZONE = "America/Bogota"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: TIMEZONE,
  }).format(date)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TIMEZONE,
  }).format(date)
}

/** Parse a date string as Colombia time and return a UTC Date */
export function parseColombia(dateTimeStr: string): Date {
  // dateTimeStr like "2026-02-15T18:00:00"
  // Colombia is UTC-5, so we append the offset
  return new Date(dateTimeStr + "-05:00")
}

/** Get hours and minutes in Colombia timezone from a UTC Date */
export function getColombiaTime(date: Date): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: TIMEZONE,
  }).formatToParts(date)
  const hours = parseInt(parts.find((p) => p.type === "hour")?.value || "0")
  const minutes = parseInt(parts.find((p) => p.type === "minute")?.value || "0")
  return { hours, minutes }
}

/** Get YYYY-MM-DD in Colombia timezone from a UTC Date */
export function getColombiaDateStr(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TIMEZONE }).format(date)
}

/** Get day of week (0=Sunday) in Colombia timezone */
export function getColombiaDayOfWeek(date: Date): number {
  const dayStr = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TIMEZONE }).format(date)
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[dayStr] ?? 0
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  durationMinutes: number,
  bookedSlots: Date[],
  date: Date
): string[] {
  const slots: string[] = []
  const [openH, openM] = openTime.split(":").map(Number)
  const [closeH, closeM] = closeTime.split(":").map(Number)

  const startMinutes = openH * 60 + openM
  const endMinutes = closeH * 60 + closeM

  for (let m = startMinutes; m + durationMinutes <= endMinutes; m += durationMinutes) {
    const hour = Math.floor(m / 60)
    const min = m % 60
    const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`

    const slotDate = new Date(date)
    slotDate.setHours(hour, min, 0, 0)

    const isBooked = bookedSlots.some((booked) => {
      const bookedTime = new Date(booked)
      return bookedTime.getHours() === hour && bookedTime.getMinutes() === min
    })

    if (!isBooked) {
      slots.push(timeStr)
    }
  }

  return slots
}
