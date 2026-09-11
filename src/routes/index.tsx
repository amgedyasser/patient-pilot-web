import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Stethoscope, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { notifyPatientCreated } from "@/lib/n8n.functions";
import type { Appointment, Patient } from "@/lib/types";
import {
  SERVICES,
  SERVICE_META,
  SERVICE_DOT,
  STATUS_STYLES,
  STATUSES,
  TIME_SLOTS,
  formatDateAr,
  formatTime,
  toArabicDigits,
  todayStr,
  type Service,
  type AppointmentStatus,
} from "@/lib/clinic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المواعيد — عيادة نور لطب الأسنان" },
      {
        name: "description",
        content:
          "جدول مواعيد عيادة الأسنان اليومية والسابقة.",
      },
      { property: "og:title", content: "المواعيد — عيادة نور لطب الأسنان" },
      {
        property: "og:description",
        content: "متابعة وحجز مواعيد العيادة وملفات المرضى.",
      },
    ],
  }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patients(*)")
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: true });
      if (error) throw error;
      return data as unknown as Appointment[];
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Patient[];
    },
  });

  const today = todayStr();
  const todayAppointments = appointments.filter((a) => a.appointment_date === today);
  const upcoming = appointments.filter(
    (a) => a.appointment_date >= today && a.status !== "مكتمل" && a.status !== "ملغي",
  );

  const filtered = appointments.filter((a) => {
    if (!search.trim()) return true;
    const q = search.trim();
    return a.patients?.name.includes(q) || a.patients?.phone.includes(q);
  });

  const last = todayAppointments[todayAppointments.length - 1];
  const lastPatientTime = last ? formatTime(last.appointment_time) : null;

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-line">
        <div className="flex items-center gap-4 px-4 md:px-8 h-16">
          <div>
            <h1 className="font-cairo font-extrabold text-lg leading-none">لوحة المواعيد</h1>
            <div className="text-xs text-muted-foreground mt-1">{formatDateAr(today)}</div>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <label className="hidden md:flex items-center gap-2 h-10 px-3 rounded-xl bg-card border border-line text-sm text-muted-foreground">
              <span>بحث</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 bg-transparent outline-none placeholder:text-muted-foreground/60"
                placeholder="اسم المريض أو رقم الهاتف"
              />
            </label>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-6">
        {/* إحصاءات */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[160px] rounded-2xl bg-card border border-line p-4">
            <div className="text-xs text-muted-foreground">مواعيد اليوم</div>
            <div className="mt-1 font-cairo font-extrabold text-2xl">
              {toArabicDigits(todayAppointments.length)}{" "}
              <span className="text-sm text-muted-foreground font-plex font-medium">موعد</span>
            </div>
          </div>
          <div className="flex-1 min-w-[160px] rounded-2xl bg-card border border-line p-4">
            <div className="text-xs text-muted-foreground">مواعيد قادمة</div>
            <div className="mt-1 font-cairo font-extrabold text-2xl text-mint">
              {toArabicDigits(upcoming.length)}
            </div>
          </div>
          <div className="flex-1 min-w-[160px] rounded-2xl bg-card border border-line p-4">
            <div className="text-xs text-muted-foreground">إجمالي المرضى</div>
            <div className="mt-1 font-cairo font-extrabold text-2xl">
              {toArabicDigits(patients.length)}{" "}
              <span className="text-sm text-muted-foreground font-plex font-medium">ملف</span>
            </div>
          </div>
        </div>

        {/* الخدمات */}
        <div className="grid sm:grid-cols-3 gap-3">
          {SERVICES.map((service, i) => {
            const meta = SERVICE_META[service];
            const bg =
              meta.color === "brand"
                ? "bg-brand-soft text-brand"
                : meta.color === "mint"
                  ? "bg-mint-soft text-mint"
                  : "bg-rose-soft text-rose";
            return (
              <div
                key={service}
                className="rounded-2xl bg-card border border-line p-4 flex items-center gap-3 animate-[fade_.5s_ease_both]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className={`size-10 rounded-xl grid place-items-center ${bg}`}
                >
                  {meta.icon === "sparkles" ? (
                    <Sparkles className="size-5" />
                  ) : meta.icon === "stethoscope" ? (
                    <Stethoscope className="size-5" />
                  ) : (
                    <Search className="size-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm">{service}</div>
                  <div className="text-xs font-bold text-brand mt-0.5">{meta.price}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* الجدول + النماذج الجانبية */}
        <div className="grid xl:grid-cols-[1fr_340px] gap-6 items-start">
          <section className="rounded-2xl bg-card border border-line overflow-hidden animate-[fade_.5s_ease_.1s_both]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div>
                <div className="font-cairo font-extrabold text-base">جدول المواعيد</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-[11px] font-semibold text-muted-foreground/80 border-b border-line">
                    <th className="px-5 py-3">التاريخ</th>
                    <th className="px-4 py-3">الوقت</th>
                    <th className="px-4 py-3">المريض</th>
                    <th className="px-4 py-3">الخدمة</th>
                    <th className="px-4 py-3">الحالة</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground text-sm">
                        لا توجد مواعيد مطابقة
                      </td>
                    </tr>
                  )}
                  {filtered.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl bg-card border border-line p-5 animate-[rise_.5s_ease_.05s_both]">
              <div className="flex items-center justify-between">
                <div className="font-cairo font-extrabold text-base">إضافة مريض</div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                  جديد
                </span>
              </div>
              <PatientForm
                onDone={() => {
                  queryClient.invalidateQueries({ queryKey: ["patients"] });
                  queryClient.invalidateQueries({ queryKey: ["appointments"] });
                }}
              />
            </section>

            <section className="rounded-2xl bg-card border border-line p-5 animate-[rise_.5s_ease_.12s_both]">
              <div className="font-cairo font-extrabold text-base">أحدث الملفات</div>
              <div className="mt-3 space-y-2">
                {patients.slice(0, 4).map((p) => {
                  const count = appointments.filter((a) => a.patient_id === p.id).length;
                  return (
                    <Link
                      key={p.id}
                      to="/patients"
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-line hover:bg-brand-soft/40 transition-colors text-right"
                    >
                      <div className="size-9 rounded-lg bg-gradient-to-br from-brand to-[#7DB4FF] grid place-items-center text-primary-foreground font-cairo font-extrabold text-sm">
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {count > 0 ? `${toArabicDigits(count)} مواعيد` : "مريض جديد"}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-brand">فتح</span>
                    </Link>
                  );
                })}
              </div>
              {lastPatientTime && (
                <div className="mt-4 text-[11px] text-muted-foreground">
                  آخر موعد اليوم: {lastPatientTime}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("تم تحديث حالة الموعد");
    },
    onError: () => toast.error("تعذر تحديث الحالة"),
  });

  const status = (STATUSES.includes(a.status as AppointmentStatus)
    ? a.status
    : "بالانتظار") as AppointmentStatus;

  return (
    <tr className="border-b border-line/60 hover:bg-brand-soft/30 transition-colors">
      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
        {formatDateAr(a.appointment_date)}
      </td>
      <td className="px-4 py-3.5 font-cairo font-bold text-brand whitespace-nowrap">
        {formatTime(a.appointment_time)}
      </td>
      <td className="px-4 py-3.5">
        <div className="font-semibold">{a.patients?.name ?? "—"}</div>
        <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">
          {a.patients?.phone ?? ""}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
          <span
            className={`size-1.5 rounded-full ${SERVICE_DOT[a.service as Service] ?? "bg-brand"}`}
          />
          {a.service}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
      </td>
      <td className="px-5 py-3.5 text-left">
        <select
          value={status}
          onChange={(e) => updateStatus.mutate(e.target.value)}
          className="text-xs font-semibold text-brand bg-transparent outline-none cursor-pointer"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}

function PatientForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [service, setService] = useState<Service>(SERVICES[0]);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(TIME_SLOTS[0] ?? "09:00");
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<Patient | null>(null);

  const reset = () => {
    setName("");
    setPhone("");
    setNotes("");
    setService(SERVICES[0]);
    setDate(todayStr());
    setTime(TIME_SLOTS[0] ?? "09:00");
    setDuplicate(null);
  };

  const addAppointment = async (patientId: string) => {
    const { error } = await supabase.from("appointments").insert({
      patient_id: patientId,
      service,
      appointment_date: date,
      appointment_time: time,
      status: "مؤكد",
    });
    return error;
  };

  const createNewFile = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from("patients")
      .insert({ name: name.trim(), phone: phone.trim(), notes: notes.trim() || null })
      .select()
      .single();
    if (error || !data) {
      setSaving(false);
      toast.error("تعذر حفظ المريض");
      return;
    }
    const apptError = await addAppointment(data.id);
    setSaving(false);
    if (apptError) {
      toast.error("تم فتح الملف لكن تعذر حجز الموعد");
      onDone();
      return;
    }
    toast.success("تم فتح ملف للمريض وحجز الموعد");
    reset();
    onDone();
  };

  const addToExisting = async () => {
    if (!duplicate) return;
    setSaving(true);
    const apptError = await addAppointment(duplicate.id);
    setSaving(false);
    if (apptError) {
      toast.error("تعذر حجز الموعد");
      return;
    }
    toast.success(`تمت إضافة الموعد لملف ${duplicate.name}`);
    reset();
    onDone();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (!name.trim()) {
      toast.error("أدخل اسم المريض");
      return;
    }
    if (digits.length !== 11) {
      toast.error("رقم الهاتف يجب أن يكون ١١ رقماً بالضبط");
      return;
    }
    setSaving(true);
    const { data: matches, error } = await supabase
      .from("patients")
      .select("*")
      .eq("phone", digits)
      .order("created_at", { ascending: false })
      .limit(1);
    setSaving(false);
    if (error) {
      toast.error("تعذر التحقق من رقم الهاتف");
      return;
    }
    const existing = matches?.[0];
    if (existing) {
      setDuplicate(existing as unknown as Patient);
      return;
    }
    await createNewFile();
  };

  const inputCls =
    "mt-1 w-full h-10 px-3 rounded-xl bg-background border border-line text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div>
        <label className="text-xs font-semibold text-muted-foreground">اسم المريض</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="الاسم الكامل"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">رقم الهاتف (١١ رقم)</label>
        <input
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
            setDuplicate(null);
          }}
          inputMode="numeric"
          maxLength={11}
          className={inputCls}
          placeholder="01xxxxxxxxx"
          dir="ltr"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">الخدمة</label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value as Service)}
          className={inputCls}
        >
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">تاريخ الكشف</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
            dir="ltr"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">وقت الكشف</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputCls}
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {formatTime(t)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">ملاحظات (اختياري)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputCls}
          placeholder="حساسية، أمراض مزمنة…"
        />
      </div>

      {duplicate && (
        <div className="rounded-xl border border-gold/40 bg-gold-soft/50 p-3 space-y-2">
          <div className="text-xs font-semibold leading-relaxed">
            هذا الرقم موجود بالفعل في ملفات المرضى باسم «{duplicate.name}». هل تريد فتح ملف جديد
            بنفس الرقم أم إضافة الموعد لنفس الملف؟
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={addToExisting}
              className="flex-1 h-9 rounded-lg bg-brand text-primary-foreground text-xs font-bold disabled:opacity-60"
            >
              إضافة الموعد لنفس الملف
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={createNewFile}
              className="flex-1 h-9 rounded-lg border border-line bg-card text-xs font-bold disabled:opacity-60"
            >
              فتح ملف جديد
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !!duplicate}
        className="w-full h-11 rounded-xl bg-gradient-to-l from-brand to-[#3E86EC] text-primary-foreground font-bold text-sm shadow-[0_10px_20px_-10px_rgba(30,109,224,.9)] ring-1 ring-white/30 hover:shadow-[0_14px_26px_-8px_rgba(30,109,224,.95)] transition-shadow disabled:opacity-60"
      >
        {saving ? "جارٍ الحفظ…" : "حفظ المريض والموعد"}
      </button>
    </form>
  );
}
