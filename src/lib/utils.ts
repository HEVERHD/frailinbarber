import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
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
