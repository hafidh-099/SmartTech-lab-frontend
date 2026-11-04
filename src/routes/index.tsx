import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute, roleHome } from "@/components/shared/protected-route";
import { RouteError } from "@/components/shared/route-error";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/types/user";
import ForgotPassword from "./auth/forgot-password";
import Login from "./auth/login";
import RegisterDean from "./auth/register-dean";
import RegisterStaff from "./auth/register-staff";
import ResetPassword from "./auth/reset-password";
import VerifyOtp from "./auth/verify-otp";
import NotFound from "./not-found";

const DeanDashboard = lazy(() => import("./dean/dashboard"));
const DeanUsers = lazy(() => import("./dean/users"));
const DeanInvitations = lazy(() => import("./dean/invitations"));
const DeanSchoolProfile = lazy(() => import("./dean/school"));
const DeanChemicals = lazy(() => import("./dean/chemicals"));
const DeanChemicalDetail = lazy(() => import("./dean/chemical-detail"));
const DeanBookings = lazy(() => import("./dean/bookings"));
const ManageLabsPage = lazy(() => import("@/pages/dean/ManageLabsPage"));
const TechnicianDashboard = lazy(() => import("./technician/dashboard"));
const TechnicianChemicals = lazy(() => import("./technician/chemicals"));
const TechnicianChemicalDetail = lazy(
  () => import("./technician/chemical-detail"),
);
const TechnicianCalculator = lazy(() => import("./technician/calculator"));
const TechnicianBookings = lazy(() => import("./technician/bookings"));
const TeacherDashboard = lazy(() => import("./teacher/dashboard"));
const TeacherBookings = lazy(() => import("./teacher/bookings"));
const TeacherNewBooking = lazy(() => import("./teacher/bookings/new"));
const TeacherBookingDetail = lazy(() => import("./teacher/bookings/detail"));
const EquipmentList = lazy(() => import("./shared/equipment/equipment-list"));
const EquipmentDetail = lazy(
  () => import("./shared/equipment/equipment-detail"),
);
const BreakagesList = lazy(() => import("./shared/breakages/breakages-list"));
const BreakageStudentLookup = lazy(
  () => import("./shared/breakages/student-lookup"),
);
const BreakageSummary = lazy(() => import("./dean/breakages/summary"));

function dashboardPage(page: ReactNode) {
  return <Suspense fallback={<DashboardSkeleton />}>{page}</Suspense>;
}

function HomeRedirect() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <Navigate
      to={user && accessToken ? roleHome(user.role) : "/auth/login"}
      replace
    />
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">Feature page coming soon.</p>
    </div>
  );
}

function roleRoutes(
  role: UserRole,
  children: { path: string; title: string; element?: ReactNode }[],
) {
  return {
    element: <ProtectedRoute allowedRoles={[role]} />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: children.map(({ path, title, element }) => ({
          path,
          element: element ?? <Placeholder title={title} />,
        })),
      },
    ],
  };
}

export const router = createBrowserRouter([
  { path: "/", element: <HomeRedirect /> },
  { path: "/auth/login", element: <Login /> },
  // TODO: protect /setup with an env-based access key.
  { path: "/setup", element: <RegisterDean /> },
  { path: "/auth/register/staff", element: <RegisterStaff /> },
  { path: "/auth/verify-otp", element: <VerifyOtp /> },
  { path: "/auth/forgot-password", element: <ForgotPassword /> },
  { path: "/auth/reset-password", element: <ResetPassword /> },
  roleRoutes("dean", [
    {
      path: "/dean/dashboard",
      title: "Dean Dashboard",
      element: dashboardPage(<DeanDashboard />),
    },
    {
      path: "/dean/users",
      title: "Users",
      element: dashboardPage(<DeanUsers />),
    },
    {
      path: "/dean/invitations",
      title: "Invitations",
      element: dashboardPage(<DeanInvitations />),
    },
    {
      path: "/dean/school",
      title: "School",
      element: dashboardPage(<DeanSchoolProfile />),
    },
    {
      path: "/dean/chemicals",
      title: "Chemicals",
      element: dashboardPage(<DeanChemicals />),
    },
    {
      path: "/dean/chemicals/:id",
      title: "Chemical details",
      element: dashboardPage(<DeanChemicalDetail />),
    },
    {
      path: "/dean/labs",
      title: "Labs",
      element: dashboardPage(<ManageLabsPage />),
    },
    {
      path: "/dean/equipment",
      title: "Equipment",
      element: dashboardPage(<EquipmentList canEdit={false} />),
    },
    {
      path: "/dean/equipment/:id",
      title: "Equipment details",
      element: dashboardPage(<EquipmentDetail canEdit={false} />),
    },
    {
      path: "/dean/bookings",
      title: "Bookings",
      element: dashboardPage(<DeanBookings />),
    },
    {
      path: "/dean/breakages",
      title: "Breakages",
      element: dashboardPage(<BreakagesList canManage />),
    },
    {
      path: "/dean/breakages/summary",
      title: "Breakage financials",
      element: dashboardPage(<BreakageSummary />),
    },
    {
      path: "/dean/breakages/student-lookup",
      title: "Student breakage lookup",
      element: dashboardPage(<BreakageStudentLookup />),
    },
  ]),
  roleRoutes("technician", [
    {
      path: "/technician/dashboard",
      title: "Technician Dashboard",
      element: dashboardPage(<TechnicianDashboard />),
    },
    {
      path: "/technician/chemicals",
      title: "Chemicals",
      element: dashboardPage(<TechnicianChemicals />),
    },
    {
      path: "/technician/chemicals/:id",
      title: "Chemical details",
      element: dashboardPage(<TechnicianChemicalDetail />),
    },
    {
      path: "/technician/equipment",
      title: "Equipment",
      element: dashboardPage(<EquipmentList canEdit />),
    },
    {
      path: "/technician/equipment/:id",
      title: "Equipment details",
      element: dashboardPage(<EquipmentDetail canEdit />),
    },
    {
      path: "/technician/bookings",
      title: "Bookings",
      element: dashboardPage(<TechnicianBookings />),
    },
    {
      path: "/technician/breakages",
      title: "Breakages",
      element: dashboardPage(<BreakagesList canManage={false} />),
    },
    {
      path: "/technician/breakages/student-lookup",
      title: "Student breakage lookup",
      element: dashboardPage(<BreakageStudentLookup />),
    },
    {
      path: "/technician/calculator",
      title: "Calculator",
      element: dashboardPage(<TechnicianCalculator />),
    },
  ]),
  roleRoutes("teacher", [
    {
      path: "/teacher/dashboard",
      title: "Teacher Dashboard",
      element: dashboardPage(<TeacherDashboard />),
    },
    {
      path: "/teacher/bookings",
      title: "My Bookings",
      element: dashboardPage(<TeacherBookings />),
    },
    {
      path: "/teacher/bookings/new",
      title: "New Booking",
      element: dashboardPage(<TeacherNewBooking />),
    },
    {
      path: "/teacher/bookings/:id",
      title: "Booking details",
      element: dashboardPage(<TeacherBookingDetail />),
    },
  ]),
  roleRoutes("super_admin", [
    { path: "/super/dashboard", title: "Super Admin Dashboard" },
    { path: "/super/schools", title: "Schools" },
  ]),
  {
    path: "/profile",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <Placeholder title="Profile" /> }],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
