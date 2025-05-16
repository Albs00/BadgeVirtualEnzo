import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Id } from "../../convex/_generated/dataModel";

function EmployeePreviewCard({ employee }: { employee: any }) {
  const stats = useQuery(api.employees.getEmployeeOverview, { employeeId: employee._id });
  
  if (!stats) return null;

  const todayHours = Math.floor(stats.todayDuration / (1000 * 60 * 60));
  const todayMinutes = Math.floor((stats.todayDuration % (1000 * 60 * 60)) / (1000 * 60));
  const monthHours = Math.floor(stats.monthDuration / (1000 * 60 * 60));
  const monthMinutes = Math.floor((stats.monthDuration % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl text-gray-500">
            {employee.firstName[0]}
            {employee.lastName[0]}
          </span>
        </div>
        <div>
          <h3 className="font-medium text-lg">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-sm text-gray-500">{employee.employeeId}</p>
          {stats.activeSession && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              In servizio
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Oggi</p>
          <p className="text-xl font-light">
            {todayHours}:{todayMinutes.toString().padStart(2, "0")}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Questo mese</p>
          <p className="text-xl font-light">
            {monthHours}:{monthMinutes.toString().padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmployeeDetails({ employee, stats }: { employee: any; stats: any }) {
  const updateEmployee = useMutation(api.employees.updateEmployee);
  const deleteEmployee = useMutation(api.employees.deleteEmployee);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    role: employee.role,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateEmployee({
        employeeId: employee._id,
        ...formData,
      });
      setIsEditing(false);
      toast.success("Dipendente aggiornato");
    } catch (error) {
      toast.error("Errore: " + (error as Error).message);
    }
  }

  async function handleDelete() {
    if (!confirm("Sei sicuro di voler eliminare questo dipendente?")) return;
    try {
      await deleteEmployee({ employeeId: employee._id });
      toast.success("Dipendente eliminato");
    } catch (error) {
      toast.error("Errore: " + (error as Error).message);
    }
  }

  const hours = Math.floor((stats?.totalDuration || 0) / (1000 * 60 * 60));
  const minutes = Math.floor(((stats?.totalDuration || 0) % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="space-y-6">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            className="w-full px-4 py-2 rounded-xl bg-gray-50"
            placeholder="Nome"
          />
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            className="w-full px-4 py-2 rounded-xl bg-gray-50"
            placeholder="Cognome"
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as "admin" | "employee" }))}
            className="w-full px-4 py-2 rounded-xl bg-gray-50"
          >
            <option value="employee">Dipendente</option>
            <option value="admin">Amministratore</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-500 text-white"
            >
              Salva
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-gray-100"
            >
              Annulla
            </button>
          </div>
        </form>
      ) : (
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-light">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-gray-500">{employee.employeeId}</p>
            <p className="text-sm mt-2 capitalize">{employee.role}</p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-gray-100"
            >
              Modifica
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl bg-red-500 text-white"
            >
              Elimina
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-medium mb-2">Statistiche periodo selezionato</h3>
        <div className="text-3xl font-light">
          {hours}:{minutes.toString().padStart(2, "0")}
          <span className="text-sm text-gray-500 ml-2">ore totali</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {stats?.sessionsCount || 0} sessioni
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Sessioni recenti</h3>
        {stats?.sessions.map((session: any) => (
          <div
            key={session._id}
            className="bg-gray-50 rounded-xl p-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {format(session.startTime, "HH:mm")}
                  {session.endTime && ` - ${format(session.endTime, "HH:mm")}`}
                </p>
                <p className="text-sm text-gray-500">
                  {format(session.startTime, "d MMMM", { locale: it })}
                </p>
              </div>
              {session.duration && (
                <p className="text-sm font-medium">
                  {Math.floor(session.duration / (1000 * 60 * 60))}h{" "}
                  {Math.floor((session.duration % (1000 * 60 * 60)) / (1000 * 60))}m
                </p>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {session.startLocation.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Admin() {
  const employees = useQuery(api.employees.getAllEmployees) || [];
  const [selectedEmployee, setSelectedEmployee] = useState<Id<"employees"> | null>(null);
  const [range, setRange] = useState<DateRange | undefined>();
  
  const start = range?.from ? startOfDay(range.from) : startOfDay(new Date());
  const end = range?.to ? endOfDay(range.to) : endOfDay(range?.from || new Date());
  
  const stats = useQuery(
    api.employees.getEmployeeStats,
    selectedEmployee ? {
      employeeId: selectedEmployee,
      startDate: start.getTime(),
      endDate: end.getTime(),
    } : "skip"
  );

  const selectedEmployeeData = employees.find(e => e._id === selectedEmployee);

  if (selectedEmployee && selectedEmployeeData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light">Dettagli Dipendente</h2>
            <button
              onClick={() => setSelectedEmployee(null)}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Torna alla lista
            </button>
          </div>
          <div className="space-y-6">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              locale={it}
              className="bg-white rounded-xl p-4"
            />
            {stats && (
              <EmployeeDetails
                employee={selectedEmployeeData}
                stats={stats}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-light mb-6">Panoramica Dipendenti</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((employee) => (
            <div key={employee._id} onClick={() => setSelectedEmployee(employee._id)} className="cursor-pointer">
              <EmployeePreviewCard employee={employee} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
