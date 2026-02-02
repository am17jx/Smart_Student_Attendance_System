import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  MapPin,
  Building2,
  Layers,
  QrCode,
  LogOut,
  Settings,
  ClipboardCheck,
  ArrowUpCircle,
  AlertTriangle
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const adminMenuItems = [
  { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
  { title: "المعلمين", url: "/teachers", icon: Users },
  { title: "الطلاب", url: "/students", icon: GraduationCap },
  { title: "المواد", url: "/materials", icon: BookOpen },
  { title: "الأقسام", url: "/departments", icon: Building2 },
  { title: "المراحل", url: "/stages", icon: Layers },
  { title: "الجلسات", url: "/sessions", icon: Calendar },
  { title: "المواقع الجغرافية", url: "/geofences", icon: MapPin },
  { title: "المحاولات الفاشلة", url: "/failed-attempts", icon: AlertTriangle },
  { title: "إدارة النتائج", url: "/enrollments", icon: BookOpen },
  { title: "ترحيل الطلاب", url: "/promotion", icon: ArrowUpCircle },
  { title: "إعدادات الترحيل", url: "/promotion-config", icon: Settings },
];

const teacherMenuItems = [
  { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
  { title: "موادي", url: "/my-materials", icon: BookOpen },
  { title: "طلابي", url: "/my-students", icon: Users },
  { title: "جلساتي", url: "/my-sessions", icon: Calendar },
  { title: "سجل الحضور", url: "/attendance", icon: ClipboardCheck },
  { title: "المحاولات الفاشلة", url: "/failed-attempts", icon: AlertTriangle },
];

const studentMenuItems = [
  { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
  { title: "مسح QR", url: "/scan-qr", icon: QrCode },
  { title: "سجل حضوري", url: "/my-attendance", icon: ClipboardCheck },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminMenuItems;
      case 'teacher':
        return teacherMenuItems;
      case 'student':
        return studentMenuItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin':
        return 'مدير النظام';
      case 'teacher':
        return 'معلم';
      case 'student':
        return 'طالب';
      default:
        return '';
    }
  };

  return (
    <Sidebar collapsible="icon" side="right" className="border-r-0 border-l">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">نظام الحضور الذكي</span>
              <span className="text-xs text-sidebar-foreground/60">{getRoleLabel()}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 px-2 mb-2">
            {!collapsed && "القائمة الرئيسية"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all flex-row-reverse justify-end",
                        location.pathname === item.url
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={collapsed ? "الإعدادات" : undefined}
            >
              <NavLink
                to="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground hover:bg-sidebar-accent transition-all flex-row-reverse justify-end"
              >
                <Settings className="h-5 w-5 shrink-0" />
                {!collapsed && <span>الإعدادات</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip={collapsed ? "تسجيل الخروج" : undefined}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-destructive hover:bg-destructive/10 transition-all cursor-pointer w-full flex-row-reverse justify-end"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>تسجيل الخروج</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
