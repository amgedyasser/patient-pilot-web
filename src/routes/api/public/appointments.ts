import { createFileRoute } from '@tanstack/react-router'

type Row = {
  appointment_date: string
  appointment_time: string
  service: string
  status: string
  created_at: string
  patients: { name: string; phone: string; notes: string | null } | null
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'x-api-key, authorization, content-type',
}

export const Route = createFileRoute('/api/public/appointments')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const token = process.env['N8N_EXPORT_TOKEN']
        const url = new URL(request.url)
        const provided =
          request.headers.get('x-api-key') ??
          request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
          url.searchParams.get('token')

        if (!token || provided !== token) {
          return new Response('Unauthorized', { status: 401, headers: CORS })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        let query = supabaseAdmin
          .from('appointments')
          .select('appointment_date, appointment_time, service, status, created_at, patients(name, phone, notes)')
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true })

        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')
        if (from) query = query.gte('appointment_date', from)
        if (to) query = query.lte('appointment_date', to)

        const { data, error } = await query
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...CORS, 'Content-Type': 'application/json' },
          })
        }

        const rows = (data ?? []) as unknown as Row[]
        const format = (url.searchParams.get('format') ?? 'csv').toLowerCase()

        const records = rows.map((r) => ({
          التاريخ: r.appointment_date,
          الوقت: r.appointment_time,
          المريض: r.patients?.name ?? '',
          الهاتف: r.patients?.phone ?? '',
          الخدمة: r.service,
          الحالة: r.status,
          ملاحظات: r.patients?.notes ?? '',
          'تاريخ التسجيل': r.created_at,
        }))

        if (format === 'json') {
          return Response.json(records, { headers: CORS })
        }

        const headers = ['التاريخ', 'الوقت', 'المريض', 'الهاتف', 'الخدمة', 'الحالة', 'ملاحظات', 'تاريخ التسجيل']
        const lines = [
          headers.map(csvCell).join(','),
          ...records.map((rec) => headers.map((h) => csvCell((rec as Record<string, unknown>)[h])).join(',')),
        ]
        // BOM so Excel/Sheets read Arabic correctly
        const csv = '\uFEFF' + lines.join('\r\n')

        return new Response(csv, {
          status: 200,
          headers: {
            ...CORS,
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="appointments.csv"',
            'Cache-Control': 'no-store',
          },
        })
      },
    },
  },
})
