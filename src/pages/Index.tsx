import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const services = [
  {
    icon: "Sparkles",
    title: "Дизайн & Бренд",
    desc: "Создаём визуальную идентичность, которую невозможно забыть — от логотипа до полного фирменного стиля.",
  },
  {
    icon: "Code2",
    title: "Разработка",
    desc: "Быстрые, масштабируемые веб-приложения с современным стеком и идеальным пользовательским опытом.",
  },
  {
    icon: "TrendingUp",
    title: "Рост & Маркетинг",
    desc: "Стратегии продвижения, основанные на данных. Привлекаем нужную аудиторию в нужное время.",
  },
  {
    icon: "Layers",
    title: "Продуктовая стратегия",
    desc: "От идеи до запуска. Помогаем выстроить продукт, который решает реальные задачи пользователей.",
  },
];

const stats = [
  { value: "150+", label: "Проектов" },
  { value: "8 лет", label: "Опыта" },
  { value: "98%", label: "Довольных клиентов" },
  { value: "40+", label: "Партнёров" },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroSection = useInView(0.05);
  const statsSection = useInView(0.1);
  const servicesSection = useInView(0.1);
  const contactSection = useInView(0.1);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="min-h-screen font-golos"
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        "--bg": "#0a0a0a",
        "--fg": "#f0ede8",
        "--accent": "#c9a96e",
        "--muted": "#3a3733",
        "--card-bg": "#141410",
        "--border-col": "#2a2820",
      } as React.CSSProperties}
    >
      {/* ─── NAV ─── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(10,10,10,0.9)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border-col)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="#" className="font-cormorant text-2xl font-semibold tracking-wider" style={{ color: "var(--fg)" }}>
            STUDIO
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {["Услуги", "О нас", "Проекты", "Контакты"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm tracking-widest uppercase transition-all duration-300 hover:opacity-100 relative group"
                style={{ color: "var(--fg)", opacity: 0.55, fontSize: "0.7rem" }}
              >
                {link}
                <span
                  className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
                  style={{ background: "var(--accent)" }}
                />
              </a>
            ))}
          </div>

          <button
            className="hidden md:flex items-center gap-2 px-5 py-2.5 text-xs tracking-widest uppercase transition-all duration-300 hover:opacity-90"
            style={{
              background: "var(--accent)",
              color: "#0a0a0a",
              fontFamily: "Golos Text, sans-serif",
              fontWeight: 600,
            }}
          >
            Обсудить проект
          </button>

          {/* Mobile burger */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: "var(--fg)" }}
          >
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden px-6 pb-6 flex flex-col gap-5"
            style={{ background: "var(--bg)", borderTop: "1px solid var(--border-col)" }}
          >
            {["Услуги", "О нас", "Проекты", "Контакты"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm tracking-widest uppercase"
                style={{ color: "var(--fg)", opacity: 0.7 }}
              >
                {link}
              </a>
            ))}
            <button
              className="mt-2 px-5 py-3 text-xs tracking-widest uppercase font-semibold"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}
            >
              Обсудить проект
            </button>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section
        ref={heroSection.ref}
        className="relative min-h-screen flex flex-col justify-center overflow-hidden px-6"
        style={{ paddingTop: "7rem" }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--border-col) 1px, transparent 1px), linear-gradient(90deg, var(--border-col) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            opacity: 0.35,
          }}
        />

        {/* Glow orb */}
        <div
          className="absolute animate-float pointer-events-none"
          style={{
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)",
            top: "10%",
            right: "-5%",
          }}
        />

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div
            className="mb-6 flex items-center gap-3"
            style={{
              opacity: heroSection.inView ? 1 : 0,
              transform: heroSection.inView ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
            }}
          >
            <span
              className="inline-block px-3 py-1 text-xs tracking-widest uppercase"
              style={{
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                fontFamily: "Golos Text",
              }}
            >
              Цифровая студия
            </span>
          </div>

          <h1
            className="font-cormorant leading-none mb-8"
            style={{
              fontSize: "clamp(3.5rem, 9vw, 8.5rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              opacity: heroSection.inView ? 1 : 0,
              transform: heroSection.inView ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
            }}
          >
            Создаём то,{" "}
            <em
              className="not-italic"
              style={{ color: "var(--accent)" }}
            >
              что работает
            </em>
            <br />
            <span style={{ opacity: 0.45 }}>и выглядит</span> безупречно
          </h1>

          <p
            className="max-w-xl text-base leading-relaxed mb-12"
            style={{
              color: "var(--fg)",
              opacity: heroSection.inView ? 0.55 : 0,
              transform: heroSection.inView ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
              fontSize: "1.05rem",
            }}
          >
            Мы — команда дизайнеров и разработчиков, которые превращают смелые идеи в цифровые продукты мирового уровня.
          </p>

          <div
            className="flex flex-wrap gap-4"
            style={{
              opacity: heroSection.inView ? 1 : 0,
              transform: heroSection.inView ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.55s, transform 0.7s ease 0.55s",
            }}
          >
            <button
              className="flex items-center gap-2.5 px-7 py-4 font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:opacity-90 hover:scale-[1.02]"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}
            >
              Начать проект
              <Icon name="ArrowRight" size={16} />
            </button>
            <button
              className="flex items-center gap-2.5 px-7 py-4 text-sm tracking-wider uppercase transition-all duration-300 hover:opacity-80"
              style={{
                border: "1px solid var(--muted)",
                color: "var(--fg)",
                background: "transparent",
              }}
            >
              Смотреть работы
            </button>
          </div>

          {/* Scroll hint */}
          <div
            className="absolute bottom-10 left-0 flex items-center gap-3"
            style={{
              opacity: heroSection.inView ? 0.4 : 0,
              transition: "opacity 1s ease 1s",
            }}
          >
            <div
              className="w-6 h-px"
              style={{ background: "var(--fg)" }}
            />
            <span className="text-xs tracking-widest uppercase" style={{ fontSize: "0.65rem" }}>
              Прокрутите вниз
            </span>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section
        ref={statsSection.ref}
        className="py-20 px-6"
        style={{ borderTop: "1px solid var(--border-col)", borderBottom: "1px solid var(--border-col)" }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center"
              style={{
                opacity: statsSection.inView ? 1 : 0,
                transform: statsSection.inView ? "translateY(0)" : "translateY(25px)",
                transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`,
              }}
            >
              <div
                className="font-cormorant mb-1"
                style={{ fontSize: "3.2rem", fontWeight: 300, color: "var(--accent)", lineHeight: 1 }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs tracking-widest uppercase"
                style={{ color: "var(--fg)", opacity: 0.45, fontSize: "0.65rem" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section ref={servicesSection.ref} className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div
            className="mb-16"
            style={{
              opacity: servicesSection.inView ? 1 : 0,
              transform: servicesSection.inView ? "translateY(0)" : "translateY(25px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <span
              className="block text-xs tracking-widest uppercase mb-4"
              style={{ color: "var(--accent)", fontSize: "0.65rem" }}
            >
              Что мы делаем
            </span>
            <h2
              className="font-cormorant"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 300, lineHeight: 1.1 }}
            >
              Полный цикл
              <br />
              <span style={{ opacity: 0.4 }}>цифрового производства</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px" style={{ background: "var(--border-col)" }}>
            {services.map((s, i) => (
              <div
                key={s.title}
                className="group p-10 transition-all duration-500 cursor-default"
                style={{
                  background: "var(--card-bg)",
                  opacity: servicesSection.inView ? 1 : 0,
                  transform: servicesSection.inView ? "translateY(0)" : "translateY(30px)",
                  transition: `opacity 0.6s ease ${0.1 + i * 0.1}s, transform 0.6s ease ${0.1 + i * 0.1}s, background 0.3s ease`,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1a1a14")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--card-bg)")
                }
              >
                <div
                  className="w-10 h-10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                  style={{ border: "1px solid var(--muted)", color: "var(--accent)" }}
                >
                  <Icon name={s.icon} size={18} />
                </div>
                <h3
                  className="font-cormorant mb-3"
                  style={{ fontSize: "1.7rem", fontWeight: 400 }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--fg)", opacity: 0.5, lineHeight: 1.75 }}
                >
                  {s.desc}
                </p>
                <div
                  className="mt-8 flex items-center gap-2 text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1"
                  style={{ color: "var(--accent)", fontSize: "0.65rem" }}
                >
                  Подробнее
                  <Icon name="ArrowRight" size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div
        className="overflow-hidden py-6"
        style={{ borderTop: "1px solid var(--border-col)", borderBottom: "1px solid var(--border-col)" }}
      >
        <style>{`
          @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .marquee-track { animation: marquee 18s linear infinite; white-space: nowrap; display: inline-flex; }
        `}</style>
        <div className="marquee-track">
          {Array(2).fill(null).map((_, ri) => (
            <span key={ri} className="inline-flex items-center">
              {["Дизайн", "Разработка", "Брендинг", "Стратегия", "UX/UI", "Маркетинг", "Запуск", "Рост"].map((w, i) => (
                <span key={i} className="inline-flex items-center">
                  <span
                    className="font-cormorant px-6 text-4xl"
                    style={{ fontWeight: 300, opacity: 0.2, fontSize: "2.2rem" }}
                  >
                    {w}
                  </span>
                  <span style={{ color: "var(--accent)", opacity: 0.4, fontSize: "1rem" }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ─── CONTACT CTA ─── */}
      <section ref={contactSection.ref} className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div
            style={{
              opacity: contactSection.inView ? 1 : 0,
              transform: contactSection.inView ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <span
              className="block text-xs tracking-widest uppercase mb-6"
              style={{ color: "var(--accent)", fontSize: "0.65rem" }}
            >
              Готовы начать?
            </span>
            <h2
              className="font-cormorant mb-8"
              style={{
                fontSize: "clamp(2.8rem, 7vw, 6rem)",
                fontWeight: 300,
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
            >
              Давайте создадим
              <br />
              <em className="not-italic" style={{ color: "var(--accent)" }}>
                что-то великое
              </em>
            </h2>
            <p
              className="max-w-md mx-auto mb-12 text-sm leading-relaxed"
              style={{ color: "var(--fg)", opacity: 0.5, lineHeight: 1.8 }}
            >
              Расскажите нам о вашем проекте. Мы свяжемся с вами в течение 24 часов и предложим индивидуальное решение.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="flex items-center justify-center gap-2.5 px-10 py-4 font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:opacity-90 hover:scale-[1.02]"
                style={{ background: "var(--accent)", color: "#0a0a0a" }}
              >
                Написать нам
                <Icon name="Send" size={15} />
              </button>
              <button
                className="flex items-center justify-center gap-2 px-10 py-4 text-sm tracking-wider uppercase transition-all duration-300 hover:opacity-70"
                style={{ color: "var(--fg)", border: "1px solid var(--muted)", background: "transparent" }}
              >
                <Icon name="Phone" size={15} />
                +7 (000) 000-00-00
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="px-6 py-10"
        style={{ borderTop: "1px solid var(--border-col)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span
            className="font-cormorant text-xl font-semibold tracking-widest"
            style={{ color: "var(--fg)" }}
          >
            STUDIO
          </span>
          <p
            className="text-xs tracking-wider"
            style={{ color: "var(--fg)", opacity: 0.3, fontSize: "0.7rem" }}
          >
            © 2025 Studio. Все права защищены.
          </p>
          <div className="flex items-center gap-5">
            {["Telegram", "Instagram", "Behance"].map((s) => (
              <a
                key={s}
                href="#"
                className="text-xs tracking-widest uppercase transition-all duration-200 hover:opacity-100"
                style={{ color: "var(--fg)", opacity: 0.35, fontSize: "0.65rem" }}
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
