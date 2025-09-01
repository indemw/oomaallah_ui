
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Grid3X3,
  UtensilsCrossed,
  Building2,
  Users,
  Settings as SettingsIcon,
  Briefcase,
  Calculator,
  ChefHat,
  Boxes,
} from "lucide-react";

interface ModuleFlags {
  reservations?: boolean;
  restaurant?: boolean;
  front_office?: boolean;
  conference?: boolean;
  stock?: boolean;
}

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Reservations", url: "/reservations", icon: BedDouble, key: "reservations" as const },
  { title: "Allocation", url: "/reservations?tab=allocation", icon: Grid3X3, key: "reservations" as const },
  { title: "Calendar", url: "/reservations?tab=calendar", icon: CalendarDays, key: "reservations" as const },
  { title: "Restaurant", url: "/restaurant", icon: UtensilsCrossed, key: "restaurant" as const },
  { title: "Food & Beverages", url: "/food-beverages", icon: ChefHat, key: "restaurant" as const },
  { title: "Stock Management", url: "/stock", icon: Boxes, key: "stock" as const },
  { title: "Front Office", url: "/front-office", icon: Building2, key: "front_office" as const },
  { title: "Conference", url: "/conference", icon: Building2, key: "conference" as const },
  { title: "Back Office", url: "/back-office", icon: Briefcase },
  { title: "Accounting", url: "/accounting", icon: Calculator },
  { title: "Users", url: "/users", icon: Users },
  { title: "Roles", url: "/roles", icon: Users },
  { title: "Content", url: "/content", icon: Users },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const [modules, setModules] = useState<ModuleFlags>({});

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "modules")
      .maybeSingle()
      .then(({ data }) => {
        setModules((data?.value as ModuleFlags) || {});
      });
  }, []);

  const isVisible = (item: (typeof items)[number]) => {
    if (!("key" in item) || !item.key) return true;
    return modules[item.key] ?? true; // default visible if not configured
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.filter(isVisible).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
