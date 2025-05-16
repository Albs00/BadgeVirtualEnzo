import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { it } from "date-fns/locale";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

export function Reports() {
  const [range, setRange] = useState<DateRange | undefined>();
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "active">("all");
  
  const start = range?.from ? startOfDay(range.from) : startOfDay(new Date());
  const end = range?.to ? endOfDay(range.to) : endOfDay(range?.from || new Date());
  
  const sessions = useQuery(api.employees.getSessionHistory, {
    startDate: start.getTime(),
    endDate: end.getTime(),
  }) || [];

  const filteredSessions = sessions.filter(session => {
    if (filterStatus === "all") return true;
    return session.status === filterStatus;
  });

  const totalDuration = filteredSessions.reduce((acc, session) => {
    if (session.status === "completed") {
      return acc + (session.duration || 0);
    }
    if (session.status === "active") {
      return acc + (Date.now() - session.startTime);
    }
    return acc;
  }, 0);

  const hours = Math.floor(totalDuration / (1000 * 60 * 60));
  const minutes = Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60));

  // Calcola le ore del mese corrente
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthSessions = useQuery(api.employees.getSessionHistory, {
    startDate: monthStart.getTime(),
    endDate: monthEnd.getTime(),
  }) || [];

  const monthTotalDuration = monthSessions.reduce((acc, session) => {
    if (session.status === "completed") {
      return acc + (session.duration || 0);
    }
    if (session.status === "active") {
      return acc + (Date.now() - session.startTime);
    }
    return acc;
  }, 0);

  const monthHours = Math.floor(monthTotalDuration / (1000 * 60 * 60));
  const monthMinutes = Math.floor((monthTotalDuration % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Calendario */}
          <div className="flex-1">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              locale={it}
              className="w-full"
              styles={{
                root: { width: '100%' },
                months: { width: '100%' },
                table: { width: '100%' },
              }}
            />
          </div>

          {/* Filtri e statistiche */}
          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Filtri</h3>
              <div className="flex gap-2">
                <FilterButton
                  active={filterStatus === "all"}
                  onClick={() => setFilterStatus("all")}
                >
                  Tutti
                </FilterButton>
                <FilterButton
                  active={filterStatus === "completed"}
                  onClick={() => setFilterStatus("completed")}
                >
                  Completati
                </FilterButton>
                <FilterButton
                  active={filterStatus === "active"}
                  onClick={() => setFilterStatus("active")}
                >
                  Attivi
                </FilterButton>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">
                {range?.to ? "Periodo selezionato" : "Giorno selezionato"}
              </h3>
              <div className="text-3xl font-light">
                {hours}:{minutes.toString().padStart(2, "0")}
                <span className="text-sm text-gray-500 ml-2">ore</span>
              </div>
              <p className="text-sm text-gray-500">
                {format(start, "d MMMM", { locale: it })}
                {range?.to && ` - ${format(end, "d MMMM", { locale: it })}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista sessioni */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h3 className="font-medium text-gray-900 mb-4">Dettaglio sessioni</h3>
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nessuna sessione nel periodo selezionato
            </p>
          ) : (
            filteredSessions.map(session => (
              <div
                key={session._id}
                className="flex justify-between items-center p-3 rounded-xl bg-gray-50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {format(session.startTime, "HH:mm")}
                      {session.endTime && ` - ${format(session.endTime, "HH:mm")}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      session.status === "active" 
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {session.status === "active" ? "In corso" : "Completato"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {session.startLocation.name}
                  </p>
                </div>
                {session.duration && (
                  <p className="text-sm font-medium">
                    {formatDuration(session.duration)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Statistiche mensili */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h3 className="font-medium text-gray-900 mb-2">Riepilogo mensile</h3>
        <div className="text-3xl font-light">
          {monthHours}:{monthMinutes.toString().padStart(2, "0")}
          <span className="text-sm text-gray-500 ml-2">ore totali</span>
        </div>
        <p className="text-sm text-gray-500">
          {format(monthStart, "MMMM yyyy", { locale: it })}
        </p>
      </div>
    </div>
  );
}

function FilterButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-gray-900 text-white"
          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
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
