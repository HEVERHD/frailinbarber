import webpush from "web-push"
import { prisma } from "@/lib/prisma"

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

// Send push notification to all subscriptions of a specific user
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subscriptions.length === 0) return

  const message = JSON.stringify(payload)

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        )
      } catch (err: any) {
        // 410 Gone = subscription expired, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }
    })
  )
}

// Send push notification to all BARBER/ADMIN users
export async function sendPushToBarbers(payload: PushPayload) {
  const barbers = await prisma.user.findMany({
    where: { role: { in: ["BARBER", "ADMIN"] } },
    select: { id: true },
  })
  await Promise.allSettled(barbers.map((b) => sendPushToUser(b.id, payload)))
}

// Send push notification to a specific barber by their user ID
export async function sendPushToBarber(barberId: string, payload: PushPayload) {
  await sendPushToUser(barberId, payload)
}
