import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Admin } from "./pages/Admin";
import { NotificationBell } from "./components/NotificationBell";
import { CogIcon, HomeIcon, UserIcon, ChartIcon, UsersIcon } from "./components/Icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Authenticated>
          <TopNavigation />
        </Authenticated>
        <main className="flex-1 flex flex-col p-3">
          <div className="w-full max-w-2xl mx-auto">
            <Content />
          </div>
        </main>
        <Authenticated>
          <BottomNavigation />
        </Authenticated>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

function Content() {
  const employee = useQuery(api.employees.getCurrentEmployee);
  const isAdmin = employee?.role === "admin";

  return (
    <div className="flex flex-col">
      <Authenticated>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          {isAdmin && <Route path="/admin" element={<Admin />} />}
        </Routes>
      </Authenticated>
      <Unauthenticated>
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Virtual Badge</h1>
          <p className="text-xl text-gray-600 mb-8">Accedi per iniziare</p>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}

function TopNavigation() {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex-1">
          <SignOutButton />
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <Link
            to="/settings"
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              location.pathname === "/settings"
                ? "text-blue-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CogIcon className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function BottomNavigation() {
  const location = useLocation();
  const employee = useQuery(api.employees.getCurrentEmployee);
  const isAdmin = employee?.role === "admin";
  
  return (
    <nav className="sticky bottom-0 z-10 bg-white shadow-lg border-t border-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          <Link
            to="/"
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              location.pathname === "/"
                ? "text-blue-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex flex-col items-center">
              <HomeIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </div>
          </Link>
          <Link
            to="/profile"
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              location.pathname === "/profile"
                ? "text-blue-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex flex-col items-center">
              <UserIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Profilo</span>
            </div>
          </Link>
          <Link
            to="/reports"
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              location.pathname === "/reports"
                ? "text-blue-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex flex-col items-center">
              <ChartIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Report</span>
            </div>
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                location.pathname === "/admin"
                  ? "text-blue-500"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex flex-col items-center">
                <UsersIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Admin</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
