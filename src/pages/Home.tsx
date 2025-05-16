import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalizzazione non supportata"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });
  });
}

async function getLocationName(coords: { latitude: number; longitude: number }): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    const city = data.address.city || data.address.town || data.address.village;
    const province = data.address.state;
    
    if (!city) return "Posizione sconosciuta";
    return province ? `${city} (${province})` : city;
  } catch (error) {
    console.error("Error getting location name:", error);
    return "Posizione sconosciuta";
  }
}

function CreateEmployeeForm() {
  const createEmployee = useMutation(api.employees.createEmployee);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    employeeId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createEmployee(formData);
      toast.success("Profilo dipendente creato");
    } catch (error) {
      toast.error("Errore: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-3xl p-6 shadow-sm">
      <h2 className="text-2xl font-light text-center mb-6">Crea Profilo</h2>
      <input
        type="text"
        required
        placeholder="Nome"
        value={formData.firstName}
        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-0"
      />
      <input
        type="text"
        required
        placeholder="Cognome"
        value={formData.lastName}
        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-0"
      />
      <input
        type="text"
        required
        placeholder="ID Dipendente"
        value={formData.employeeId}
        onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-0"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-2xl text-white font-medium bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {isLoading ? "Creazione..." : "Crea Profilo"}
      </button>
    </form>
  );
}

function TodaySessions() {
  const today = new Date();
  const sessions = useQuery(api.employees.getSessionHistory, {
    startDate: startOfDay(today).getTime(),
    endDate: endOfDay(today).getTime(),
  }) || [];

  if (sessions.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Sessioni di oggi</h3>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session._id}
            className="flex justify-between items-center text-sm"
          >
            <div>
              <p className="font-medium">{session.startLocation.name}</p>
              <p className="text-gray-500">
                {format(session.startTime, "HH:mm")}
                {session.endTime && ` - ${format(session.endTime, "HH:mm")}`}
              </p>
            </div>
            {session.duration && (
              <p className="text-gray-500">
                {formatDuration(session.duration)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDuration(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function Home() {
  const employee = useQuery(api.employees.getCurrentEmployee);
  const activeSession = useQuery(api.employees.getActiveSession);
  const todayStats = useQuery(api.employees.getTodayStats);
  const clockIn = useMutation(api.employees.clockIn);
  const clockOut = useMutation(api.employees.clockOut);
  const [isLoading, setIsLoading] = useState(false);

  if (employee === undefined) {
    return <p>Caricamento...</p>;
  }

  if (!employee) {
    return <CreateEmployeeForm />;
  }

  async function handleClockAction() {
    setIsLoading(true);
    try {
      const position = await getCurrentPosition();
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        name: await getLocationName(position.coords),
      };
      
      if (activeSession) {
        await clockOut({ location });
        toast.success("Sessione terminata");
      } else {
        await clockIn({ location });
        toast.success("Sessione iniziata");
      }
    } catch (error) {
      toast.error("Errore: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  const hours = Math.floor((todayStats?.totalDuration || 0) / (1000 * 60 * 60));
  const minutes = Math.floor(((todayStats?.totalDuration || 0) % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-gray-600 mb-4">
            Benvenuto, {employee.firstName}
          </h2>
          <p className="text-gray-500 text-sm mb-1">
            {format(new Date(), "EEEE d MMMM", { locale: it })}
          </p>
          <h1 className="text-4xl font-light">
            {hours}:{minutes.toString().padStart(2, "0")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Ore lavorate oggi</p>
        </div>

        {activeSession && (
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500">Posizione attuale</p>
            <p className="text-lg font-medium">{activeSession.startLocation.name}</p>
          </div>
        )}

        <button
          onClick={handleClockAction}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-2xl text-white font-medium transition-colors ${
            activeSession
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading
            ? "Caricamento..."
            : activeSession
            ? "Termina Sessione"
            : "Inizia Sessione"}
        </button>
      </div>

      <TodaySessions />
    </div>
  );
}
