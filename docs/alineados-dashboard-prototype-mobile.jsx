import { useState, useEffect } from "react";

// ─── Responsive hook ──────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState("desktop");
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setBp(w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}

// ─── Mock data ────────────────────────────────────────────────
const mockBriefing = {
  date: "Martes 4 de Marzo, 2026",
  executiveSummary: "El gobernador Juan Pablo Valdés encabezó un acto en Goya donde anunció nuevas inversiones en infraestructura vial por $2.800M. El ministro de Seguridad Adán Gaya confirmó la incorporación de 200 nuevos agentes policiales. La oposición peronista cuestionó el presupuesto asignado a obra pública. En materia de Justicia, se avanzó con la digitalización de expedientes en juzgados del interior.",
  sections: [
    {
      title: "El Gobernador",
      icon: "🏛",
      items: [
        { headline: "Valdés anunció inversión de $2.800M en rutas provinciales", summary: "En acto en Goya, el gobernador detalló el plan de pavimentación de 340 km de rutas que conectan el interior con la capital. Destacó el acompañamiento del Ministerio de Obras Públicas.", urgency: "important", source: "El Litoral", time: "09:15" },
        { headline: "Reunión con intendentes del sur provincial", summary: "Valdés mantuvo un encuentro con 8 intendentes de la zona sur para coordinar acciones contra el dengue y planificar obras hídricas.", urgency: "routine", source: "Radio Dos", time: "14:30" },
      ]
    },
    {
      title: "Justicia y DDHH",
      icon: "⚖",
      items: [
        { headline: "Digitalización de expedientes avanza en juzgados del interior", summary: "El Superior Tribunal de Justicia confirmó que 12 juzgados del interior ya operan con el sistema digital. El Ministerio de Justicia coordinó la capacitación de personal.", urgency: "important", source: "Radio Sudamericana", time: "10:45" },
        { headline: "Nuevo protocolo de atención a víctimas de violencia de género", summary: "Se presentó en la Legislatura un proyecto que establece un protocolo unificado. Requiere articulación con el Ministerio de Justicia y DDHH.", urgency: "important", source: "Época", time: "11:20" },
      ]
    },
    {
      title: "Gabinete",
      icon: "👥",
      items: [
        { headline: "Min. Seguridad: 200 nuevos agentes se incorporan este mes", summary: "Adán Gaya confirmó en Radio Sudamericana la incorporación y detalló el plan de despliegue territorial. Goya, Curuzú Cuatiá y Mercedes son prioridad.", urgency: "routine", source: "Radio Sudamericana", time: "08:30" },
        { headline: "Min. Salud: campaña de vacunación contra el dengue", summary: "Emilio Lanari anunció el inicio de la campaña en 15 localidades. Pidió colaboración de todos los ministerios para la difusión.", urgency: "routine", source: "El Litoral", time: "12:00" },
        { headline: "Min. Producción: acuerdo con productores arroceros", summary: "Walter Chávez firmó un convenio de asistencia técnica con la Asociación de Plantadores de Arroz. Involucra créditos del Banco de Corrientes.", urgency: "routine", source: "Diario El Libertador", time: "16:45" },
      ]
    },
    {
      title: "Oposición",
      icon: "📢",
      items: [
        { headline: "PJ cuestiona ejecución presupuestaria en obra pública", summary: "Bloque peronista en la Legislatura pidió informes sobre el avance real de obras anunciadas en 2025. Señalan demoras en 4 rutas provinciales.", urgency: "routine", source: "Época", time: "13:15" },
      ]
    },
    {
      title: "Nacional",
      icon: "🇦🇷",
      items: [
        { headline: "Nación define recorte a transferencias provinciales", summary: "El Ministerio de Economía nacional anunció ajustes en las transferencias discrecionales. Corrientes podría verse afectada en partidas de infraestructura educativa.", urgency: "breaking", source: "El Litoral", time: "07:45" },
      ]
    }
  ]
};

const mockInterviews = [
  { id: 1, interviewee: "Gustavo Valdés", role: "Senador Provincial / Ex-Gobernador", program: "Lo bueno, lo malo y lo feo", source: "Radio Dos", duration: "34 min", saved: "31 min", summary: "Valdés se refirió al vínculo con la Nación y pidió diálogo institucional. Defendió la gestión de su hermano y anticipó que desde el Senado impulsará proyectos de desarrollo productivo. Descartó tensiones internas en la UCR provincial.", topics: ["Relación Nación-Provincia", "UCR interna", "Senado"], date: "Hoy, 08:15" },
  { id: 2, interviewee: "Martín Ascúa", role: "Referente opositor (Peronismo)", program: "Antes que se imprima", source: "Radio Dos", duration: "22 min", saved: "20 min", summary: "El dirigente peronista criticó la falta de transparencia en la ejecución del presupuesto y adelantó que pedirán una auditoría de obras. Dijo que la oposición está 'más unida que nunca' y no descartó alianzas para las legislativas.", topics: ["Presupuesto", "Auditoría", "Oposición unida"], date: "Hoy, 11:30" },
  { id: 3, interviewee: "Adán Gaya", role: "Ministro de Seguridad", program: "Mañanas de Radio", source: "Radio Sudamericana", duration: "18 min", saved: "16 min", summary: "Confirmó la incorporación de 200 agentes y detalló el plan de seguridad para Carnaval. Mencionó coordinación con el Ministerio de Justicia para agilizar causas penales.", topics: ["Seguridad", "Carnaval", "Justicia"], date: "Hoy, 08:45" },
];

const mockFeed = [
  { id: 1, title: "Nación define recorte a transferencias provinciales", source: "El Litoral", time: "07:45", urgency: "breaking", category: "nacional" },
  { id: 2, title: "Min. Seguridad: 200 nuevos agentes se incorporan", source: "Radio Sudamericana", time: "08:30", urgency: "routine", category: "gabinete" },
  { id: 3, title: "Valdés anunció inversión de $2.800M en rutas", source: "El Litoral", time: "09:15", urgency: "important", category: "gobernador" },
  { id: 4, title: "Digitalización de expedientes avanza en juzgados", source: "Radio Sudamericana", time: "10:45", urgency: "important", category: "justicia" },
  { id: 5, title: "Protocolo de atención a víctimas de violencia de género", source: "Época", time: "11:20", urgency: "important", category: "justicia" },
  { id: 6, title: "Min. Salud: campaña de vacunación contra dengue", source: "El Litoral", time: "12:00", urgency: "routine", category: "gabinete" },
  { id: 7, title: "PJ cuestiona ejecución presupuestaria", source: "Época", time: "13:15", urgency: "routine", category: "oposicion" },
  { id: 8, title: "Valdés se reunió con intendentes del sur", source: "Radio Dos", time: "14:30", urgency: "routine", category: "gobernador" },
  { id: 9, title: "Acuerdo con productores arroceros", source: "Diario El Libertador", time: "16:45", urgency: "routine", category: "gabinete" },
];

const urgencyConfig = {
  breaking: { label: "URGENTE", bg: "bg-red-500", text: "text-white", dot: "bg-red-500" },
  important: { label: "IMPORTANTE", bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  routine: { label: "", bg: "", text: "", dot: "bg-emerald-400" },
};

const sourceColors = {
  "El Litoral": "#1a6b3c",
  "Época": "#8b5e3c",
  "Diario El Libertador": "#2d5a9e",
  "Radio Sudamericana": "#c23b22",
  "Radio Dos": "#6b21a8",
  "Gobierno": "#1e3a5f",
};

const navItems = [
  { id: "briefing", label: "Resumen", labelFull: "Resumen del Día", icon: "📋" },
  { id: "feed", label: "Noticias", labelFull: "Todas las Noticias", icon: "📰" },
  { id: "governor", label: "Gobernador", labelFull: "El Gobernador", icon: "🏛" },
  { id: "justice", label: "Justicia", labelFull: "Justicia y DDHH", icon: "⚖" },
  { id: "cabinet", label: "Gabinete", labelFull: "Gabinete", icon: "👥" },
  { id: "opposition", label: "Oposición", labelFull: "Oposición", icon: "📢" },
  { id: "interviews", label: "Entrevistas", labelFull: "Entrevistas", icon: "🎙" },
];

// ─── Shared UI components ─────────────────────────────────────

function UrgencyBadge({ urgency }) {
  const config = urgencyConfig[urgency];
  if (!config.label) return null;
  return (
    <span className={`${config.bg} ${config.text} text-xs font-bold px-2 py-0.5 rounded-full tracking-wider whitespace-nowrap`}>
      {config.label}
    </span>
  );
}

function UrgencyDot({ urgency }) {
  const config = urgencyConfig[urgency];
  return <span className={`inline-block w-2 h-2 rounded-full ${config.dot} flex-shrink-0`} />;
}

function SourceTag({ source }) {
  const color = sourceColors[source] || "#666";
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap"
      style={{ color, backgroundColor: color + "14", border: `1px solid ${color}30` }}
    >
      {source}
    </span>
  );
}

// ─── Bottom Nav (mobile only) ─────────────────────────────────

function MobileBottomNav({ activeNav, setActiveNav }) {
  // Show a subset on mobile — the 5 most important. "More" can come later.
  const mobileNavItems = navItems.filter(n =>
    ["briefing", "feed", "justice", "interviews"].includes(n.id)
  );
  // Add a "más" overflow item
  const [showMore, setShowMore] = useState(false);
  const overflowItems = navItems.filter(n =>
    !["briefing", "feed", "justice", "interviews"].includes(n.id)
  );
  const isOverflowActive = overflowItems.some(n => n.id === activeNav);

  return (
    <>
      {/* Overflow menu */}
      {showMore && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMore(false)}
        >
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-2">
              {overflowItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveNav(item.id); setShowMore(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeNav === item.id
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 active:bg-slate-50"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.labelFull}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        {/* Safe area spacer for notched iPhones */}
        <div className="flex items-stretch justify-around px-1" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
          {mobileNavItems.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <span className="text-xl leading-none mb-0.5">{item.icon}</span>
                <span className={`text-xs font-medium truncate max-w-full ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 transition-colors ${
              isOverflowActive || showMore ? "text-blue-600" : "text-slate-400"
            }`}
          >
            <span className="text-xl leading-none mb-0.5">•••</span>
            <span className={`text-xs font-medium ${isOverflowActive || showMore ? "text-blue-600" : "text-slate-400"}`}>
              Más
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

// ─── Briefing View ────────────────────────────────────────────

function BriefingView({ isMobile }) {
  const [expandedSection, setExpandedSection] = useState(null);

  return (
    <div className={isMobile ? "space-y-6" : "space-y-8"}>
      {/* Hero briefing card */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2438 100%)" }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className={`relative ${isMobile ? "p-5" : "p-8"}`}>
          <div className="flex items-center gap-3 mb-1">
            <div className={`${isMobile ? "w-8 h-8 text-base" : "w-10 h-10 text-lg"} rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm`}>📋</div>
            <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">{mockBriefing.date}</p>
          </div>
          <h1 className={`text-white font-bold mt-3 mb-1 ${isMobile ? "text-xl" : "text-2xl"}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Resumen del Día
          </h1>
          <p className={`text-slate-300 leading-relaxed mt-3 ${isMobile ? "text-sm" : "text-base"}`} style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            {mockBriefing.executiveSummary}
          </p>
          <div className={`flex items-center gap-4 mt-5 ${isMobile ? "flex-wrap gap-3" : ""}`}>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>1 urgente</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>3 importantes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>5 rutina</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {mockBriefing.sections.map((section, si) => (
        <div key={si}>
          <button
            onClick={() => setExpandedSection(expandedSection === si ? null : si)}
            className="w-full flex items-center justify-between group mb-3"
          >
            <div className="flex items-center gap-3">
              <span className={isMobile ? "text-lg" : "text-xl"}>{section.icon}</span>
              <h2 className={`font-bold text-slate-800 ${isMobile ? "text-base" : "text-lg"}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {section.title}
              </h2>
              <span className="text-sm text-slate-400 font-medium">{section.items.length}</span>
            </div>
            <span className="text-slate-400 group-hover:text-slate-600 transition-colors text-sm">
              {expandedSection === si ? "▲" : "▼"}
            </span>
          </button>

          <div className="space-y-3">
            {section.items.map((item, ii) => (
              <div
                key={ii}
                className={`bg-white rounded-xl border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group ${isMobile ? "p-4" : "p-5"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-1.5">
                    <UrgencyDot urgency={item.urgency} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <UrgencyBadge urgency={item.urgency} />
                      <SourceTag source={item.source} />
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                    <h3 className={`font-semibold text-slate-800 group-hover:text-blue-900 transition-colors ${isMobile ? "text-sm leading-snug" : "text-base"}`}>
                      {item.headline}
                    </h3>
                    {(expandedSection === si || item.urgency !== "routine") && (
                      <p className="text-slate-500 text-sm mt-2 leading-relaxed" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                        {item.summary}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Feed View ────────────────────────────────────────────────

function FeedView({ isMobile }) {
  const [filter, setFilter] = useState("all");
  const categories = [
    { id: "all", label: "Todas" },
    { id: "gobernador", label: "Gobernador" },
    { id: "justicia", label: "Justicia" },
    { id: "gabinete", label: "Gabinete" },
    { id: "oposicion", label: "Oposición" },
    { id: "nacional", label: "Nacional" },
  ];
  const filtered = filter === "all" ? mockFeed : mockFeed.filter(a => a.category === filter);

  return (
    <div>
      <h1 className={`font-bold text-slate-800 mb-4 ${isMobile ? "text-xl" : "text-2xl mb-6"}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        Todas las Noticias
      </h1>

      {/* Filter chips — horizontal scroll on mobile */}
      <div className={`flex gap-2 mb-5 ${isMobile ? "overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" : "flex-wrap mb-6"}`}
        style={isMobile ? { WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" } : {}}
      >
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              filter === c.id
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border border-slate-100 hover:shadow-sm hover:border-slate-200 transition-all cursor-pointer group ${
              isMobile ? "p-4" : "px-5 py-4"
            }`}
          >
            {isMobile ? (
              /* Mobile: stacked layout */
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <UrgencyDot urgency={item.urgency} />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug flex-1 group-hover:text-blue-900 transition-colors">
                    {item.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 pl-5">
                  <span className="text-xs text-slate-400 font-mono">{item.time}</span>
                  <UrgencyBadge urgency={item.urgency} />
                  <SourceTag source={item.source} />
                </div>
              </div>
            ) : (
              /* Desktop: single row */
              <div className="flex items-center gap-4">
                <UrgencyDot urgency={item.urgency} />
                <span className="text-sm text-slate-400 font-mono w-12 flex-shrink-0">{item.time}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm group-hover:text-blue-900 transition-colors truncate">
                    {item.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <UrgencyBadge urgency={item.urgency} />
                  <SourceTag source={item.source} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Interviews View ──────────────────────────────────────────

function InterviewsView({ isMobile }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <h1 className={`font-bold text-slate-800 mb-2 ${isMobile ? "text-xl" : "text-2xl"}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        Entrevistas
      </h1>
      <p className="text-slate-500 text-sm mb-5">Entrevistas de radio y TV resumidas por IA. Leé en 2 minutos lo que dura 30.</p>
      <div className="space-y-4">
        {mockInterviews.map(interview => (
          <div
            key={interview.id}
            className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-all"
          >
            <div
              className={`cursor-pointer ${isMobile ? "p-4" : "p-5"}`}
              onClick={() => setExpanded(expanded === interview.id ? null : interview.id)}
            >
              {isMobile ? (
                /* Mobile: stacked interview card */
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SourceTag source={interview.source} />
                    <span className="text-xs text-slate-400">{interview.program}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{interview.interviewee}</h3>
                    <p className="text-slate-500 text-sm">{interview.role}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{interview.date}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">{interview.duration}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded-md px-2 py-0.5">
                      Ahorraste {interview.saved}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {interview.topics.map((topic, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                /* Desktop: side-by-side interview card */
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <SourceTag source={interview.source} />
                        <span className="text-xs text-slate-400">{interview.program}</span>
                        <span className="text-xs text-slate-400">• {interview.date}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">{interview.interviewee}</h3>
                      <p className="text-slate-500 text-sm">{interview.role}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="bg-slate-100 rounded-lg px-3 py-2 text-center">
                        <p className="text-xs text-slate-400 font-medium">Duración</p>
                        <p className="text-sm font-bold text-slate-600">{interview.duration}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg px-3 py-1.5 text-center">
                        <p className="text-xs text-emerald-700 font-bold">Ahorraste {interview.saved}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {interview.topics.map((topic, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">
                        {topic}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Expanded summary */}
            {expanded === interview.id && (
              <div className={`border-t border-slate-100 pt-4 ${isMobile ? "px-4 pb-4" : "px-5 pb-5"}`}>
                <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span>🤖</span> Resumen IA
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  {interview.summary}
                </p>
                <div className={`flex mt-4 ${isMobile ? "flex-col gap-2" : "gap-3"}`}>
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-2 bg-blue-50 rounded-lg text-center">
                    Ver transcripción completa
                  </button>
                  <button className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors px-3 py-2 bg-slate-50 rounded-lg text-center">
                    Ir al video original
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Desktop/Tablet Sidebar ───────────────────────────────────

function Sidebar({ activeNav, setActiveNav, sidebarOpen, setSidebarOpen }) {
  return (
    <aside
      className="flex-shrink-0 h-screen sticky top-0 flex-col transition-all duration-300 border-r border-slate-200 hidden md:flex"
      style={{
        width: sidebarOpen ? 260 : 72,
        background: "linear-gradient(180deg, #0f172a 0%, #162032 100%)"
      }}
    >
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
          <span className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>A</span>
        </div>
        {sidebarOpen && (
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Alineados
            </h1>
            <p className="text-slate-500 text-xs">Inteligencia política</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeNav === item.id
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <span className="text-base flex-shrink-0 w-6 text-center">{item.icon}</span>
            {sidebarOpen && <span>{item.labelFull}</span>}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
            <span className="text-white">JL</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">López Desimoni</p>
              <p className="text-slate-500 text-xs truncate">Justicia y DDHH</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-3 text-slate-500 hover:text-slate-300 transition-colors border-t border-white/10 text-xs"
      >
        {sidebarOpen ? "◀ Colapsar" : "▶"}
      </button>
    </aside>
  );
}

// ─── Mobile Header ────────────────────────────────────────────

function MobileHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 border-b border-slate-200 px-4 py-3"
      style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      {searchOpen ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              autoFocus
              placeholder="Buscar..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>
          <button
            onClick={() => setSearchOpen(false)}
            className="text-sm text-blue-600 font-medium px-2 py-2"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>A</span>
            </div>
            <div>
              <h1 className="text-slate-900 font-bold text-base tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Alineados
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">12 min</span>
            </div>
            <button onClick={() => setSearchOpen(true)} className="p-2 text-slate-400">
              <span className="text-lg">🔍</span>
            </button>
            <button className="relative p-2 text-slate-400">
              <span className="text-lg">🔔</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Desktop Header ───────────────────────────────────────────

function DesktopHeader() {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar noticias, entrevistas, personas..."
            className="w-80 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">Actualizado hace 12 min</span>
        </div>
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        </button>
      </div>
    </header>
  );
}

// ─── Main App ─────────────────────────────────────────────────

export default function AlineadosDashboard() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  const [activeNav, setActiveNav] = useState("briefing");
  const [sidebarOpen, setSidebarOpen] = useState(bp === "desktop");

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) setSidebarOpen(false);
    if (bp === "desktop") setSidebarOpen(true);
  }, [bp, isTablet]);

  const renderView = () => {
    switch (activeNav) {
      case "briefing": return <BriefingView isMobile={isMobile} />;
      case "feed": return <FeedView isMobile={isMobile} />;
      case "interviews": return <InterviewsView isMobile={isMobile} />;
      default: return <BriefingView isMobile={isMobile} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f9fb", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />

      {/* Sidebar — hidden on mobile via `hidden md:flex` */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {isMobile ? <MobileHeader /> : <DesktopHeader />}

        {/* Content area — bottom padding on mobile for the nav bar */}
        <div className={isMobile ? "px-4 py-5 pb-24" : "px-8 py-8 max-w-4xl"}>
          {renderView()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      {isMobile && (
        <MobileBottomNav activeNav={activeNav} setActiveNav={setActiveNav} />
      )}
    </div>
  );
}
