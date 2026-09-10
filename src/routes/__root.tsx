import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { CalendarDays, Users, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import doctorImg from "../assets/doctor.jpg";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold font-cairo text-foreground">٤٠٤</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          حدث خطأ أثناء تحميل الصفحة
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "عيادة نور لطب الأسنان — متابعة المواعيد والمرضى" },
      {
        name: "description",
        content:
          "مساعد عيادة الأسنان لمتابعة المواعيد وملفات المرضى وخدمات العيادة: تنظيف الأسنان، حشو الأسنان، وكشف عام.",
      },
      { property: "og:title", content: "عيادة نور لطب الأسنان" },
      {
        property: "og:description",
        content: "متابعة المواعيد وملفات المرضى وخدمات العيادة بسهولة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV_ITEMS = [
  { title: "المواعيد", url: "/", icon: CalendarDays, letter: "م" },
  { title: "المرضى", url: "/patients", icon: Users, letter: "ر" },
  { title: "الخدمات", url: "/services", icon: Sparkles, letter: "خ" },
] as const;

function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? currentPath === "/" : currentPath.startsWith(url);

  return (
    <aside className="w-[268px] shrink-0 h-screen sticky top-0 bg-card border-l border-line hidden lg:flex flex-col z-20">
      <div className="relative overflow-hidden px-5 pt-5 pb-6 border-b border-line">
        <div className="absolute -top-10 -left-10 size-32 rounded-full bg-brand-soft blur-2xl" />
        <div className="absolute -bottom-12 -right-6 size-24 rounded-full bg-gold-soft blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-brand via-[#4C93F5] to-[#7DB4FF] grid place-items-center text-primary-foreground font-cairo font-extrabold text-xl shadow-[0_8px_20px_-8px_rgba(30,109,224,.7)] ring-1 ring-white/40">
            ن
          </div>
          <div>
            <div className="font-cairo font-extrabold text-lg leading-none">عيادة نور</div>
            <div className="text-[11px] text-muted-foreground mt-1">لطب وتجميل الأسنان</div>
          </div>
        </div>
      </div>

      <nav className="p-3 space-y-1">
        <div className="px-3 pb-2 pt-1 text-[10px] font-bold tracking-widest text-muted-foreground/70">
          الأدوات
        </div>
        {NAV_ITEMS.map((item) =>
          isActive(item.url) ? (
            <Link
              key={item.url}
              to={item.url}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-l from-brand to-[#3E86EC] text-primary-foreground shadow-[0_8px_18px_-10px_rgba(30,109,224,.9)] ring-1 ring-white/30"
            >
              <span className="grid place-items-center size-7 rounded-lg bg-white/20 font-cairo font-bold text-sm">
                {item.letter}
              </span>
              <span className="font-semibold text-sm">{item.title}</span>
            </Link>
          ) : (
            <Link
              key={item.url}
              to={item.url}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground/70 hover:bg-brand-soft/60 transition-colors"
            >
              <span className="grid place-items-center size-7 rounded-lg bg-brand-soft text-brand font-cairo font-bold text-sm">
                {item.letter}
              </span>
              <span className="font-medium text-sm">{item.title}</span>
            </Link>
          ),
        )}

      </nav>

      <div className="mt-auto p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <img
            src={doctorImg}
            alt="صورة الطبيب"
            loading="lazy"
            width={512}
            height={512}
            className="size-9 rounded-full object-cover outline-1 -outline-offset-1 outline-black/5"
          />
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">د. أحمد نور</div>
            <div className="text-[11px] text-muted-foreground">طبيب الأسنان</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? currentPath === "/" : currentPath.startsWith(url);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-line flex">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.url}
          to={item.url}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
            isActive(item.url) ? "text-brand" : "text-muted-foreground"
          }`}
        >
          <item.icon className="size-5" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div dir="rtl" className="min-h-screen bg-background text-ink font-plex">
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">
            <Outlet />
          </main>
        </div>
        <MobileNav />
        <Toaster position="top-center" richColors />
      </div>
    </QueryClientProvider>
  );
}
