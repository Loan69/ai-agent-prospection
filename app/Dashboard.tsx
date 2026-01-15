"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Types
type LogEntry = {
  type: "info" | "success" | "warning" | "error" | "complete";
  message: string;
  data?: any;
  timestamp: string;
};

type CodeurProject = {
  id: string;
  title: string;
  description: string;
  score: number;
  message_generated: string;
  url: string;
  fetched_at: string;
};

type WebsiteAnalysis = {
  exists: boolean;
  loadTime?: number;
  hasMobileVersion?: boolean;
  hasSSL: boolean;
  issues: string[];
  opportunities: string[];
};

type GoogleLead = {
  id: string;
  business_name: string;
  address: string;
  phone?: string;
  website?: string;
  google_rating: number;
  reviews_count: number;
  category: string;
  estimated_size: "small" | "medium" | "large";
  has_website: boolean;
  website_analysis?: WebsiteAnalysis;
  score: number;
  message_generated: string;
  fetched_at: string;
};

type UnifiedDashboardProps = {
  codeurNew: CodeurProject[];
  codeurOld: CodeurProject[];
  googleNew: GoogleLead[];
  googleOld: GoogleLead[];
};

export default function UnifiedDashboard({
  codeurNew,
  codeurOld,
  googleNew,
  googleOld,
}: UnifiedDashboardProps) {
  const [source, setSource] = useState<"codeur" | "google">("codeur");
  const [timeFilter, setTimeFilter] = useState<"new" | "history">("new");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const router = useRouter();

  async function refreshData() {
    setLoading(true);
    setShowLogs(true);
    setLogs([]);

    const endpoint = source === "codeur" 
      ? "/api/fetch-codeur-rss" 
      : "/api/fetch-google-leads";

    try {
      const response = await fetch(endpoint);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Impossible de lire le stream");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const log = JSON.parse(line.slice(6));
            setLogs((prev) => [...prev, log]);

            // Si log "complete", on ferme les logs après 3s
            if (log.type === "complete") {
              setTimeout(() => {
                setShowLogs(false);
                router.refresh();
              }, 3000);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setLogs((prev) => [
        ...prev,
        {
          type: "error",
          message: `Erreur: ${(error as Error).message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function copyMessage(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const currentData =
    source === "codeur"
      ? timeFilter === "new"
        ? codeurNew
        : codeurOld
      : timeFilter === "new"
      ? googleNew
      : googleOld;

  const stats = {
    codeur: {
      new: codeurNew.length,
      newHigh: codeurNew.filter((p) => p.score >= 8).length,
      history: codeurOld.length,
    },
    google: {
      new: googleNew.length,
      newHigh: googleNew.filter((l) => l.score >= 8).length,
      history: googleOld.length,
    },
  };

  const currentStats = source === "codeur" ? stats.codeur : stats.google;

  const sizeEmoji = { small: "🏪", medium: "🏢", large: "🏛️" };
  const sizeLabel = { small: "Petite", medium: "Moyenne", large: "Grande" };

  // Trouver le log "complete" pour afficher le résumé
  const completeLog = logs.find((log) => log.type === "complete");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                🚀 Agent IA - Prospection
              </h1>
              <p className="text-purple-100 text-lg">
                Opportunités analysées et pré-qualifiées automatiquement
              </p>
            </div>

            <button
              onClick={refreshData}
              disabled={loading}
              className="group px-6 py-3 rounded-xl bg-white text-purple-600 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <span
                  className={
                    loading
                      ? "animate-spin"
                      : "group-hover:rotate-180 transition-transform duration-500"
                  }
                >
                  🔄
                </span>
                {loading ? "Recherche..." : `Rafraîchir ${source === "codeur" ? "Codeur" : "Google"}`}
              </span>
            </button>
          </div>
        </div>

        {/* LOGS EN TEMPS RÉEL */}
        {showLogs && (
          <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-purple-500">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span className="animate-pulse">⚙️</span>
                <span>Journal d'exécution en direct</span>
              </h3>
              <button
                onClick={() => setShowLogs(false)}
                className="text-white hover:bg-white/20 rounded-lg px-3 py-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto space-y-2 font-mono text-sm">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    log.type === "success"
                      ? "bg-green-900/30 text-green-300"
                      : log.type === "error"
                      ? "bg-red-900/30 text-red-300"
                      : log.type === "warning"
                      ? "bg-yellow-900/30 text-yellow-300"
                      : log.type === "complete"
                      ? "bg-purple-900/30 text-purple-300 border-2 border-purple-500"
                      : "bg-gray-800 text-gray-300"
                  }`}
                >
                  <span className="text-xs opacity-50 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="flex-1">
                    <p>{log.message}</p>
                    {log.data && (
                      <div className="mt-2 text-xs opacity-75 bg-black/30 rounded p-2">
                        {Object.entries(log.data).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-semibold">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Résumé final si complete */}
              {completeLog && (
                <div className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>🎉</span>
                    <span>Recherche terminée !</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(completeLog.data || {}).map(([key, value]) => (
                      <div key={key} className="bg-white/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">{String(value)}</div>
                        <div className="text-xs capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Source Tabs */}
        {!showLogs && (
          <>
            <div className="flex gap-3 bg-white rounded-2xl p-2 shadow-lg">
              <button
                onClick={() => setSource("codeur")}
                className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-200 ${
                  source === "codeur"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2 text-lg">
                  <span>💼</span>
                  <span>Codeur.com</span>
                  <span className="text-sm opacity-75">
                    ({stats.codeur.new + stats.codeur.history})
                  </span>
                </span>
              </button>
              <button
                onClick={() => setSource("google")}
                className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-200 ${
                  source === "google"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2 text-lg">
                  <span>📍</span>
                  <span>Google Maps</span>
                  <span className="text-sm opacity-75">
                    ({stats.google.new + stats.google.history})
                  </span>
                </span>
              </button>
            </div>

            {/* Time Filter Tabs */}
            <div className="flex gap-3 bg-white rounded-2xl p-2 shadow-md">
              <button
                onClick={() => setTimeFilter("new")}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  timeFilter === "new"
                    ? source === "codeur"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>🆕</span>
                  <span>Nouveaux ({currentStats.new})</span>
                </span>
              </button>
              <button
                onClick={() => setTimeFilter("history")}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  timeFilter === "history"
                    ? source === "codeur"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>📚</span>
                  <span>Historique ({currentStats.history})</span>
                </span>
              </button>
            </div>

            {/* Stats */}
            {timeFilter === "new" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div
                  className={`bg-white rounded-2xl shadow-md p-5 border-l-4 ${
                    source === "codeur" ? "border-blue-500" : "border-emerald-500"
                  }`}
                >
                  <div className="text-3xl font-bold text-gray-800">
                    {currentStats.new}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Nouveaux {source === "codeur" ? "projets" : "leads"}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-md p-5 border-l-4 border-green-500">
                  <div className="text-3xl font-bold text-green-600">
                    {currentStats.newHigh}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Très pertinents</div>
                </div>
                <div className="bg-white rounded-2xl shadow-md p-5 border-l-4 border-purple-500">
                  <div className="text-3xl font-bold text-purple-600">
                    {currentStats.history}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">En archive</div>
                </div>
              </div>
            )}

            {/* Cards - Version condensée pour économiser l'espace */}
            <div className="grid grid-cols-1 gap-6">
              {source === "codeur" &&
                (currentData as CodeurProject[]).map((project) => (
                  <div
                    key={project.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  >
                    <div
                      className={`h-1.5 ${
                        project.score >= 8
                          ? "bg-gradient-to-r from-green-400 to-emerald-500"
                          : project.score >= 6
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                          : "bg-gradient-to-r from-gray-300 to-gray-400"
                      }`}
                    ></div>

                    <div className="p-6 md:p-8 space-y-5">
                      <div className="flex justify-between items-start gap-4">
                        <h2 className="text-2xl font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
                          {project.title}
                        </h2>
                        <div
                          className={`shrink-0 px-4 py-2 rounded-full text-lg font-bold shadow-md ${
                            project.score >= 8
                              ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                              : project.score >= 6
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {project.score}/10
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 border-l-4 border-blue-400">
                        <p className="text-gray-700 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-5 text-sm leading-relaxed text-gray-700 whitespace-pre-line font-mono">
                        {project.message_generated}
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-gray-100">
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <span>Voir le projet →</span>
                        </a>

                        <button
                          onClick={() =>
                            copyMessage(project.message_generated, project.id)
                          }
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          {copiedId === project.id ? "✅ Copié !" : "📋 Copier"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {source === "google" &&
                (currentData as GoogleLead[]).map((lead) => (
                  <div
                    key={lead.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Google lead card - reprise du code précédent */}
                    <div
                      className={`h-1.5 ${
                        lead.score >= 8
                          ? "bg-gradient-to-r from-green-400 to-emerald-500"
                          : lead.score >= 6
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                          : "bg-gradient-to-r from-gray-300 to-gray-400"
                      }`}
                    ></div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <h2 className="text-2xl font-bold">{lead.business_name}</h2>
                        <div
                          className={`px-4 py-2 rounded-full text-lg font-bold ${
                            lead.score >= 8
                              ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                              : "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                          }`}
                        >
                          {lead.score}/10
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{lead.address}</p>
                      <div className="bg-slate-100 rounded-xl p-4 text-sm whitespace-pre-line">
                        {lead.message_generated}
                      </div>
                      <button
                        onClick={() => copyMessage(lead.message_generated, lead.id)}
                        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        {copiedId === lead.id ? "✅ Copié !" : "📋 Copier"}
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {currentData.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                  Aucun {source === "codeur" ? "projet" : "lead"} trouvé
                </h3>
                <p className="text-gray-500 mb-6">
                  Rafraîchissez pour charger les dernières opportunités
                </p>
                <button
                  onClick={refreshData}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  🚀 Lancer la recherche
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}