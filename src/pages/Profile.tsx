import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Profile() {
  const employee = useQuery(api.employees.getCurrentEmployee);
  const user = useQuery(api.auth.loggedInUser);

  if (!employee || !user) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl text-gray-500">
            {employee.firstName[0]}
            {employee.lastName[0]}
          </span>
        </div>
        <h1 className="text-2xl font-light">
          {employee.firstName} {employee.lastName}
        </h1>
        <p className="text-gray-500">{employee.employeeId}</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium">{user.email || "Non impostata"}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-sm text-gray-500">Ruolo</p>
          <p className="font-medium capitalize">{employee.role}</p>
        </div>
      </div>
    </div>
  );
}
