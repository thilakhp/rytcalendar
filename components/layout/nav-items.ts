import {
  LayoutDashboard,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  Building2,
  Users,
  UserCog,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Availability", href: "/availability", icon: CalendarClock },
  { label: "Training Engagements", href: "/engagements", icon: ClipboardList },
  { label: "Training Catalog", href: "/catalog", icon: GraduationCap },
  { label: "Vendors", href: "/vendors", icon: Building2 },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Trainers", href: "/trainers", icon: UserCog },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];
