"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Config = {
  id?: string;
  zones: string[];
  radius: number;
  max_results_per_zone: number;
  min_reviews: number;
  min_rating: number;
  priority_sectors: string[];
};

type SettingsFormProps = {
  initialConfig: Config;
};

const DEFAULT_ZONES = [
  "Lyon 1, France",
  "Lyon 2, France",
  "Lyon 3, France",
  "Lyon 6, France",
  "Lyon 7, France",
  "Villeurbanne, France",
  "Caluire-et-Cuire, France",
  "Écully, France",
];

const DEFAULT_SECTORS = [
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "beauty_salon",
  "spa",
  "gym",
  "clothing_store",
  "jewelry_store",
  "real_estate_agency",
  "lawyer",
  "accounting",
  "dentist",
];

export default function SettingsForm({ initialConfig }: SettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Config>({
    zones: initialConfig.zones || DEFAULT_ZONES,
    radius: initialConfig.radius || 3000,
    max_results_per_zone: initialConfig.max_results_per_zone || 20,
    min_reviews: initialConfig.min_reviews || 10,
    min_rating: initialConfig.min_rating || 3.5,
    priority_sectors: initialConfig.priority_sectors || DEFAULT_SECTORS,
  });

  const [newZone, setNewZone] = useState("");
  const [newSector, setNewSector] = useState("");

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch("/api/update-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        alert("✅ Configuration sauvegardée !");
        router.refresh();
      } else {
        alert("❌ Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  function addZone() {
    if (newZone.trim() && !config.zones.includes(newZone.trim())) {
      setConfig({
        ...config,
        zones: [...config.zones, newZone.trim()],
      });
      setNewZone("");
    }
  }

  function removeZone(zone: string) {
    setConfig({
      ...config,
      zones: config.zones.filter((z) => z !== zone),
    });
  }

  function addSector() {
    if (newSector.trim() && !config.priority_sectors.includes(newSector.trim())) {
      setConfig({
        ...config,
        priority_sectors: [...config.priority_sectors, newSector.trim()],
      });
      setNewSector("");
    }
  }

  function removeSector(sector: string) {
    setConfig({
      ...config,
      priority_sectors: config.priority_sectors.filter((s) => s !== sector),
    });
  }

  return (
    <div className="space-y-8">
      {/* Zones géographiques */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>📍</span>
          <span>Zones géographiques</span>
        </h2>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newZone}
              onChange={(e) => setNewZone(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addZone()}
              placeholder="Ex: Lyon 5, France"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={addZone}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Ajouter
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {config.zones.map((zone) => (
              <div
                key={zone}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg"
              >
                <span>{zone}</span>
                <button
                  onClick={() => removeZone(zone)}
                  className="text-blue-600 hover:text-red-600 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500">
            💡 {config.zones.length} zone(s) configurée(s) - L'agent scannera chaque zone
          </p>
        </div>
      </div>

      {/* Secteurs prioritaires */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>🎯</span>
          <span>Secteurs prioritaires</span>
        </h2>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addSector()}
              placeholder="Ex: florist"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={addSector}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              + Ajouter
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {config.priority_sectors.map((sector) => (
              <div
                key={sector}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg"
              >
                <span>{sector}</span>
                <button
                  onClick={() => removeSector(sector)}
                  className="text-purple-600 hover:text-red-600 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500">
            💡 {config.priority_sectors.length} secteur(s) ciblé(s)
          </p>
        </div>
      </div>

      {/* Paramètres de recherche */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>⚙️</span>
          <span>Paramètres de recherche</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rayon de recherche (mètres)
            </label>
            <input
              type="number"
              value={config.radius}
              onChange={(e) =>
                setConfig({ ...config, radius: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Actuellement: {config.radius / 1000} km
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Résultats max par zone
            </label>
            <input
              type="number"
              value={config.max_results_per_zone}
              onChange={(e) =>
                setConfig({
                  ...config,
                  max_results_per_zone: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total max: {config.zones.length * config.max_results_per_zone} leads
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Minimum d'avis Google
            </label>
            <input
              type="number"
              value={config.min_reviews}
              onChange={(e) =>
                setConfig({ ...config, min_reviews: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Filtre les entreprises peu actives
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Note Google minimum
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={config.min_rating}
              onChange={(e) =>
                setConfig({ ...config, min_rating: parseFloat(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Filtre les entreprises mal notées
            </p>
          </div>
        </div>
      </div>

      {/* Estimation */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-8 border-2 border-indigo-200">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>Estimation de volume</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {config.zones.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Zones</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {config.priority_sectors.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Secteurs</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              ~{config.zones.length * config.max_results_per_zone}
            </div>
            <div className="text-sm text-gray-600 mt-1">Leads max</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">
              ~{Math.round((config.zones.length * config.max_results_per_zone) * 0.3)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Qualifiés (30%)</div>
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => router.push("/")}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {saving ? "Sauvegarde..." : "💾 Sauvegarder la configuration"}
        </button>
      </div>
    </div>
  );
}