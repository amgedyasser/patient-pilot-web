import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const patientWebhookSchema = z.object({
  name: z.string(),
  phone: z.string(),
  notes: z.string().nullable().optional(),
  service: z.string(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
});

/**
 * Sends a newly-created patient's data to an n8n webhook URL.
 * Reads N8N_WEBHOOK_URL and N8N_WEBHOOK_SECRET from env at call time.
 */
export const notifyPatientCreated = createServerFn({ method: "POST" })
  .validator((data) => patientWebhookSchema.parse(data))
  .handler(async ({ data }) => {
    const url = process.env["N8N_WEBHOOK_URL"];
    // Same key as the appointments export endpoint — one key for everything n8n.
    const secret = process.env["N8N_EXPORT_TOKEN"];

    // No webhook configured — fail silently so patient creation still succeeds.
    if (!url) {
      console.warn("N8N_WEBHOOK_URL not set; skipping n8n patient webhook");
      return { ok: false, reason: "no_url" };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "x-api-key": secret } : {}),
        },
        body: JSON.stringify({
          الاسم: data.name,
          الهاتف: data.phone,
          ملاحظات: data.notes ?? "",
          الخدمة: data.service,
          "تاريخ_الكشف": data.appointmentDate,
          "وقت_الكشف": data.appointmentTime,
          "وقت_الإنشاء": new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        console.error(`n8n webhook responded with ${res.status}`);
        return { ok: false, reason: `http_${res.status}` };
      }

      return { ok: true };
    } catch (err) {
      console.error("n8n patient webhook failed", err);
      return { ok: false, reason: "fetch_error" };
    }
  });
