import type { ComponentType } from "react";
import {
  AlertTriangle,
  Beaker,
  Building2,
  CalendarDays,
  Calculator,
  FlaskConical,
  LayoutDashboard,
  Mail,
  Users,
  Boxes,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/types/user";
import { Logo } from "@/components/shared/logo";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  dean: [
    { to: "/dean/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dean/users", label: "Users", icon: Users },
    { to: "/dean/invitations", label: "Invitations", icon: Mail },
    { to: "/dean/school", label: "School", icon: Building2 },
    { to: "/dean/chemicals", label: "Chemicals", icon: FlaskConical },
    { to: "/dean/labs", label: "Labs", icon: FlaskConical },
    { to: "/dean/equipment", label: "Equipment", icon: Beaker },
    { to: "/dean/bookings", label: "Bookings", icon: CalendarDays },
    { to: "/dean/breakages", label: "Breakages", icon: AlertTriangle },
    { to: "/dean/breakages/summary", label: "Financials", icon: Wallet },
  ],
  technician: [
    { to: "/technician/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/technician/chemicals", label: "Chemicals", icon: FlaskConical },
    { to: "/technician/equipment", label: "Equipment", icon: Beaker },
    { to: "/technician/bookings", label: "Bookings", icon: CalendarDays },
    { to: "/technician/breakages", label: "Breakages", icon: AlertTriangle },
    { to: "/technician/calculator", label: "Calculator", icon: Calculator },
  ],
  teacher: [
    { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/teacher/bookings", label: "My Bookings", icon: CalendarDays },
  ],
  super_admin: [
    { to: "/super/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/super/schools", label: "Schools", icon: Boxes },
  ],
};

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-card md:flex">
      <div className="flex items-center gap-3 border-b border-border p-6">
        <Logo variant="minor" className="h-9 w-9" />
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            SmartTech Lab
          </h1>
          <p className="text-xs text-muted-foreground">Lab Management</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-auto p-3" aria-label="Main">
        {NAV_BY_ROLE[user.role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )
            }
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        SmartTech Lab · v1.0
      </div>
    </aside>
  );
}
