import { useState } from "react";

// ─── Mock Data: Narrative Analysis ───────────────────────────────────
const mockNarrativeData = {
  period: "24 Feb — 4 Mar 2026",
  totalMentions: 47,
  totalSources: 5,
  governorAppearances: 12,

  // Weekly theme frequency
  themes: [
    { name: "Infraestructura vial", count: 14, trend: "up", delta: "+6", color: "#2563eb", 
      context: "Domina la agenda pública tras el anuncio de $2.800M en rutas. Mencionado en 5 de 6 fuentes monitoreadas." },
    { name: "Seguridad", count: 9, trend: "down", delta: "-3", color: "#0d9488",
      context: "Desplazado por infraestructura esta semana. La incorporación de 200 agentes tuvo cobertura moderada." },
    { name: "Dengue / Salud pública", count: 8, trend: "up", delta: "+5", color: "#d97706",
      context: "Tema emergente por temporada. Reunión con intendentes del sur y campaña de vacunación impulsan menciones." },
    { name: "Presupuesto / Obra pública", count: 7, trend: "stable", delta: "0", color: "#7c3aed",
      context: "Sostenido por cuestionamientos de la oposición sobre ejecución presupuestaria 2025." },
    { name: "Justicia / Digitalización", count: 5, trend: "up", delta: "+3", color: "#be185d",
      context: "Avance en 12 juzgados genera cobertura positiva. Protocolo de violencia de género suma atención." },
    { name: "Relación Nación-Provincia", count: 4, trend: "up", delta: "+4", color: "#dc2626",
      context: "Tema de alta relevancia: recorte de transferencias nacionales podría impactar partidas educativas." },
  ],

  // Governor's messaging patterns
  governorFrames: [
    { frame: "Inversión y obra concreta", type: "credit-claiming", frequency: "Alta",
      example: "\"Estamos pavimentando 340 km de rutas que conectan el interior con la capital\"",
      analysis: "El gobernador construye su narrativa central sobre resultados tangibles. Cifras concretas ($2.800M, 340 km) refuerzan la imagen de gestión eficiente." },
    { frame: "Coordinación territorial", type: "coalition-building", frequency: "Media",
      example: "Reuniones con intendentes del sur para coordinar acciones contra el dengue",
      analysis: "Posicionamiento como articulador entre gobierno provincial e intendencias. Fortalece el liderazgo dentro de la coalición Vamos Corrientes." },
    { frame: "Modernización del Estado", type: "agenda-setting", frequency: "Baja",
      example: "Digitalización de expedientes judiciales como señal de modernización",
      analysis: "Tema secundario esta semana pero con potencial de crecimiento. La digitalización judicial es un logro compartido con el Ministerio de Justicia." },
  ],

  // Opposition narrative tracking
  oppositionNarratives: [
    { actor: "Bloque PJ (Legislatura)", narrative: "Falta de transparencia en ejecución presupuestaria",
      frequency: 3, momentum: "growing", 
      risk: "Pedido formal de informes sobre obras 2025 podría generar cobertura sostenida si se demoran las respuestas." },
    { actor: "Martín Ascúa", narrative: "Oposición unida para legislativas",
      frequency: 2, momentum: "emerging",
      risk: "Discurso de unidad opositora busca instalar la idea de alternancia. Monitorear si otros actores se suman." },
  ],

  // Sentiment breakdown
  sentimentBySource: [
    { source: "El Litoral", positive: 60, neutral: 30, negative: 10 },
    { source: "Época", positive: 25, neutral: 45, negative: 30 },
    { source: "Radio Sudamericana", positive: 50, neutral: 40, negative: 10 },
    { source: "Radio Dos", positive: 40, neutral: 45, negative: 15 },
    { source: "Diario El Libertador", positive: 55, neutral: 35, negative: 10 },
  ],

  // Weekly timeline of key moments
  timeline: [
    { date: "Lun 24", event: "Gustavo Valdés defiende gestión de su hermano en Radio Dos", type: "gobierno" },
    { date: "Mar 25", event: "PJ presenta pedido de informes sobre obra pública", type: "oposicion" },
    { date: "Mié 26", event: "Min. Salud anuncia campaña dengue en 15 localidades", type: "gobierno" },
    { date: "Jue 27", event: "Nación anuncia recorte a transferencias provinciales", type: "nacional" },
    { date: "Vie 28", event: "Valdés se reúne con intendentes del sur", type: "gobierno" },
    { date: "Lun 3", event: "Adán Gaya confirma 200 nuevos agentes policiales", type: "gobierno" },
    { date: "Mar 4", event: "Valdés anuncia $2.800M en rutas — acto en Goya", type: "gobierno" },
  ],
};

// ─── Shared Components ───────────────────────────────────────────────

const sourceColors = {
  "El Litoral": "#1a6b3c",
  "Época": "#8b5e3c",
  "Diario El Libertador": "#2d5a9e",
  "Radio Sudamericana": "#c23b22",
  "Radio Dos": "#6b21a8",
};

function TrendIndicator({ trend, delta }) {
  if (trend === "up") return <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{delta} ▲</span>;
  if (trend === "down") return <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">{delta} ▼</span>;
  return <span className="text-xs font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">= estable</span>;
}

function FrameTypeBadge({ type }) {
  const config = {
    "credit-claiming": { label: "Reclamo de crédito", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    "coalition-building": { label: "Construcción de coalición", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    "agenda-setting": { label: "Fijación de agenda", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
    "crisis-response": { label: "Respuesta a crisis", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    "blame-deflection": { label: "Deflexión de culpa", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  };
  const c = config[type] || config["agenda-setting"];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
}

function MomentumBadge({ momentum }) {
  if (momentum === "growing") return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">En crecimiento ▲</span>;
  if (momentum === "emerging") return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Emergente</span>;
  return <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Estable</span>;
}

// ─── Bar chart component ─────────────────────────────────────────────

function ThemeBar({ theme, maxCount }) {
  const widthPercent = (theme.count / maxCount) * 100;
  return (
    <div className="group cursor-pointer">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">{theme.name}</span>
          <TrendIndicator trend={theme.trend} delta={theme.delta} />
        </div>
        <span className="text-sm font-bold text-slate-800">{theme.count} menciones</span>
      </div>
      <div className="h-7 bg-slate-50 rounded-lg overflow-hidden relative">
        <div
          className="h-full rounded-lg transition-all duration-700 ease-out"
          style={{ width: `${widthPercent}%`, backgroundColor: theme.color, opacity: 0.85 }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
        {theme.context}
      </p>
    </div>
  );
}

// ─── Sentiment mini chart ────────────────────────────────────────────

function SentimentBar({ source, positive, neutral, negative }) {
  const color = sourceColors[source] || "#666";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold w-36 text-right flex-shrink-0" style={{ color }}>
        {source}
      </span>
      <div className="flex-1 h-5 rounded-full overflow-hidden flex bg-slate-100">
        <div className="h-full transition-all" style={{ width: `${positive}%`, backgroundColor: "#34d399" }} title={`Positivo: ${positive}%`} />
        <div className="h-full transition-all" style={{ width: `${neutral}%`, backgroundColor: "#cbd5e1" }} title={`Neutro: ${neutral}%`} />
        <div className="h-full transition-all" style={{ width: `${negative}%`, backgroundColor: "#f87171" }} title={`Negativo: ${negative}%`} />
      </div>
      <div className="flex items-center gap-1 w-24 flex-shrink-0">
        <span className="text-xs text-emerald-600 font-medium">{positive}%</span>
        <span className="text-xs text-slate-300">/</span>
        <span className="text-xs text-slate-400">{neutral}%</span>
        <span className="text-xs text-slate-300">/</span>
        <span className="text-xs text-red-400">{negative}%</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function NarrativeAnalysis() {
  const [activeTab, setActiveTab] = useState("themes");
  const d = mockNarrativeData;
  const maxCount = Math.max(...d.themes.map(t => t.count));

  const tabs = [
    { id: "themes", label: "Temas", icon: "📊" },
    { id: "frames", label: "Narrativas del Gobernador", icon: "🏛" },
    { id: "opposition", label: "Radar Oposición", icon: "📢" },
    { id: "sentiment", label: "Sentimiento por Fuente", icon: "📰" },
    { id: "timeline", label: "Línea de Tiempo", icon: "📅" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fb", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Hero Section ── */}
        <div className="relative overflow-hidden rounded-2xl mb-8" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a2744 50%, #0f2438 100%)" }}>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative p-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg backdrop-blur-sm">📊</div>
              <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">Análisis semanal</p>
            </div>
            <h1 className="text-white text-2xl font-bold mt-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Radar de Narrativa Política
            </h1>
            <p className="text-slate-400 text-sm mt-1">{d.period}</p>

            <p className="text-slate-300 text-base leading-relaxed mt-4 max-w-3xl" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Esta semana, la agenda pública estuvo dominada por el anuncio de inversión en infraestructura vial del gobernador Valdés. 
              El tema de seguridad perdió protagonismo relativo, mientras que la agenda sanitaria (dengue) ganó relevancia por factores estacionales. 
              La oposición intensificó su narrativa de falta de transparencia en la ejecución presupuestaria.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{d.totalMentions}</span>
                <span className="text-xs text-slate-400 leading-tight">menciones<br/>analizadas</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{d.governorAppearances}</span>
                <span className="text-xs text-slate-400 leading-tight">apariciones<br/>del gobernador</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{d.totalSources}</span>
                <span className="text-xs text-slate-400 leading-tight">fuentes<br/>monitoreadas</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}

        {/* THEMES */}
        {activeTab === "themes" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Frecuencia de Temas
              </h2>
              <span className="text-sm text-slate-400">Últimos 7 días · todas las fuentes</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              {d.themes.map((theme, i) => (
                <ThemeBar key={i} theme={theme} maxCount={maxCount} />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3 ml-1" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Pase el cursor sobre cada tema para ver contexto. Las flechas indican la variación respecto a la semana anterior.
            </p>
          </div>
        )}

        {/* GOVERNOR FRAMES */}
        {activeTab === "frames" && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Narrativas del Gobernador
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Análisis de los encuadres comunicacionales utilizados por el gobernador Valdés en sus apariciones públicas esta semana.
            </p>
            <div className="space-y-4">
              {d.governorFrames.map((frame, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-base">{frame.frame}</h3>
                    <FrameTypeBadge type={frame.type} />
                    <span className="text-xs text-slate-400 ml-auto">Frecuencia: <span className="font-semibold text-slate-600">{frame.frequency}</span></span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 mb-3 border-l-2" style={{ borderLeftColor: "#2563eb" }}>
                    <p className="text-sm text-slate-600 italic" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                      {frame.example}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                    {frame.analysis}
                  </p>
                </div>
              ))}
            </div>

            {/* Future: Internal data callout */}
            <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-100 p-6">
              <div className="flex items-start gap-3">
                <span className="text-lg">🔮</span>
                <div>
                  <h4 className="font-bold text-blue-900 text-sm mb-1">Próximamente: Mensajería planificada vs. cobertura real</h4>
                  <p className="text-sm text-blue-700 leading-relaxed" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                    Cuando el equipo de comunicación del gobernador cargue sus mensajes planificados, esta sección mostrará la brecha entre lo que se quiso comunicar y lo que los medios efectivamente cubrieron.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OPPOSITION RADAR */}
        {activeTab === "opposition" && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Radar de Oposición
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Narrativas activas de la oposición y evaluación de riesgo comunicacional.
            </p>
            <div className="space-y-4">
              {d.oppositionNarratives.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.actor}</span>
                        <MomentumBadge momentum={item.momentum} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">{item.narrative}</h3>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-2 text-center flex-shrink-0">
                      <p className="text-lg font-bold text-slate-700">{item.frequency}</p>
                      <p className="text-xs text-slate-400">menciones</p>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border-l-2 border-red-300">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Evaluación de riesgo</p>
                    <p className="text-sm text-red-800 leading-relaxed" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                      {item.risk}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SENTIMENT */}
        {activeTab === "sentiment" && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Sentimiento por Fuente
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Distribución del tono hacia el gobierno provincial en la cobertura de cada fuente monitoreada.
            </p>
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              {/* Legend */}
              <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-400" />
                  <span className="text-xs text-slate-500 font-medium">Positivo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-300" />
                  <span className="text-xs text-slate-500 font-medium">Neutro</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-400" />
                  <span className="text-xs text-slate-500 font-medium">Negativo</span>
                </div>
              </div>
              <div className="space-y-3">
                {d.sentimentBySource.map((item, i) => (
                  <SentimentBar key={i} {...item} />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 ml-1" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Basado en análisis de sentimiento de {d.totalMentions} artículos y entrevistas. Época muestra el sesgo más crítico hacia el gobierno.
            </p>
          </div>
        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Línea de Tiempo
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Momentos clave de la semana política.
            </p>
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="space-y-0">
                {d.timeline.map((item, i) => {
                  const typeConfig = {
                    gobierno: { color: "#2563eb", bg: "bg-blue-50", label: "Gobierno" },
                    oposicion: { color: "#7c3aed", bg: "bg-purple-50", label: "Oposición" },
                    nacional: { color: "#dc2626", bg: "bg-red-50", label: "Nacional" },
                  };
                  const tc = typeConfig[item.type] || typeConfig.gobierno;
                  const isLast = i === d.timeline.length - 1;
                  return (
                    <div key={i} className="flex gap-4">
                      {/* Timeline rail */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1.5" style={{ borderColor: tc.color, backgroundColor: i === d.timeline.length - 1 ? tc.color : "white" }} />
                        {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 pb-5 ${isLast ? '' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.date}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tc.bg}`} style={{ color: tc.color }}>{tc.label}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{item.event}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Data Model Preview (for Andrea) ── */}
        <div className="mt-12 border-t border-dashed border-slate-200 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">💾</span>
            <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Modelo de Datos Propuesto
            </h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Solo para referencia</span>
          </div>
          <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto">
            <pre className="text-sm text-slate-300 leading-relaxed" style={{ fontFamily: "monospace" }}>{`// Firestore: narrativeAnalysis/{YYYY-WW}
interface NarrativeReport {
  id: string                    // "2026-W10"
  periodStart: Timestamp
  periodEnd: Timestamp
  generatedAt: Timestamp

  executiveSummary: string      // AI-generated weekly narrative overview

  themes: {
    name: string                // "Infraestructura vial"
    mentionCount: number
    trend: 'up' | 'down' | 'stable'
    weekOverWeekDelta: number
    context: string             // AI explanation of why this theme matters
    relatedArticleIds: string[]
  }[]

  governorFrames: {
    frame: string               // "Inversión y obra concreta"
    communicationType:          // Political comm framework
      | 'credit-claiming'
      | 'agenda-setting'
      | 'coalition-building'
      | 'crisis-response'
      | 'blame-deflection'
    frequency: 'alta' | 'media' | 'baja'
    exampleQuote: string
    analysis: string
  }[]

  oppositionNarratives: {
    actor: string
    narrative: string
    mentionCount: number
    momentum: 'growing' | 'stable' | 'declining' | 'emerging'
    riskAssessment: string
  }[]

  sentimentBySource: {
    source: string
    positivePercent: number
    neutralPercent: number
    negativePercent: number
  }[]

  // FUTURE: internal data fields
  plannedMessaging?: {
    topic: string
    intendedFrame: string
    actualCoverage: string
    gapAnalysis: string
  }[]
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
