import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

type NotificationPreferences = {
  sessionStart: boolean;
  sessionEnd: boolean;
  weeklyReport: boolean;
  sound: boolean;
};

export function Settings() {
  const preferences = useQuery(api.notifications.getPreferences);
  const updatePreferences = useMutation(api.notifications.updatePreferences);
  const [isLoading, setIsLoading] = useState(false);

  if (!preferences) return null;

  const defaultPreferences: NotificationPreferences = {
    sessionStart: true,
    sessionEnd: true,
    weeklyReport: true,
    sound: true,
  };

  const currentPreferences = preferences || defaultPreferences;

  async function handleToggle(key: keyof NotificationPreferences) {
    setIsLoading(true);
    try {
      await updatePreferences({
        preferences: {
          ...currentPreferences,
          [key]: !currentPreferences[key],
        },
      });
      toast.success("Impostazioni aggiornate");
    } catch (error) {
      toast.error("Errore: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-medium mb-6">Notifiche</h2>
        <div className="space-y-4">
          <ToggleItem
            label="Inizio sessione"
            description="Ricevi una notifica quando inizi una nuova sessione"
            enabled={currentPreferences.sessionStart}
            onChange={() => handleToggle("sessionStart")}
            disabled={isLoading}
          />
          <ToggleItem
            label="Fine sessione"
            description="Ricevi una notifica quando termini una sessione"
            enabled={currentPreferences.sessionEnd}
            onChange={() => handleToggle("sessionEnd")}
            disabled={isLoading}
          />
          <ToggleItem
            label="Report settimanale"
            description="Ricevi un riepilogo delle tue ore settimanali"
            enabled={currentPreferences.weeklyReport}
            onChange={() => handleToggle("weeklyReport")}
            disabled={isLoading}
          />
          <ToggleItem
            label="Suoni"
            description="Abilita i suoni per le notifiche"
            enabled={currentPreferences.sound}
            onChange={() => handleToggle("sound")}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-medium mb-6">Informazioni</h2>
        <div className="space-y-4 text-sm text-gray-600">
          <p>Versione: 1.0.0</p>
          <p>© 2024 Virtual Badge. Tutti i diritti riservati.</p>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({
  label,
  description,
  enabled,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <h3 className="font-medium">{label}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-blue-500" : "bg-gray-200"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
