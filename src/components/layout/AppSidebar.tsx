import { useState } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useClientBranding } from '@/hooks/useClientBranding';
import { useOpenTicketsCount } from '@/hooks/useOpenTicketsCount';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FolderKanban, 
  ChevronRight, 
  FileText, 
  Database, 
  GraduationCap,
  Settings,
  Loader2,
  Building2,
  LifeBuoy,
} from 'lucide-react';
import logo from '@/assets/logo-smartest.svg';

const projectSubMenuItems = [
  { title: 'Visão Geral', path: '', icon: LayoutDashboard },
  { title: 'Documentos', path: '/documentos', icon: FileText },
  { title: 'Modelagem', path: '/modelagem', icon: Database },
  { title: 'Treinamentos', path: '/treinamentos', icon: GraduationCap },
  { title: 'Configurações', path: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { id: projectIdFromParams } = useParams();
  const { data: projects, isLoading } = useProjects();
  const { isAdmin } = useAuth();
  const { data: clientBranding } = useClientBranding();
  const { data: openTicketsCount } = useOpenTicketsCount();
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});

  // Auto-open current project
  const currentProjectId = projectIdFromParams || location.pathname.match(/\/projeto\/([^/]+)/)?.[1];

  // Get client logo URL if available
  const clientLogoUrl = clientBranding?.logo_url 
    ? supabase.storage.from('client-assets').getPublicUrl(clientBranding.logo_url).data.publicUrl
    : null;

  // Get sidebar color
  const sidebarColor = clientBranding?.sidebar_color || '#1A1F2C';
  
  const toggleProject = (projectId: string) => {
    setOpenProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const isProjectOpen = (projectId: string) => {
    if (openProjects[projectId] !== undefined) {
      return openProjects[projectId];
    }
    return projectId === currentProjectId;
  };

  const isSubItemActive = (projectId: string, subPath: string) => {
    const basePath = `/projeto/${projectId}`;
    if (subPath === '') {
      return location.pathname === basePath;
    }
    return location.pathname === `${basePath}${subPath}`;
  };

  // Convert hex to HSL components
  const hexToHslComponents = (hex: string): { h: number; s: number; l: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const getSidebarStyles = (): React.CSSProperties | undefined => {
    if (isAdmin || !clientBranding?.sidebar_color) return undefined;
    
    const hsl = hexToHslComponents(clientBranding.sidebar_color);
    if (!hsl) return undefined;
    
    // Generate contrasting colors based on the base color
    const baseHsl = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
    // Accent: slightly lighter for buttons
    const accentHsl = `${hsl.h} ${Math.max(hsl.s - 10, 0)}% ${Math.min(hsl.l + 15, 50)}%`;
    // Border: subtle separator
    const borderHsl = `${hsl.h} ${Math.max(hsl.s - 15, 0)}% ${Math.min(hsl.l + 20, 55)}%`;
    // Muted: for labels
    const mutedHsl = `${hsl.h} ${Math.max(hsl.s - 20, 0)}% ${Math.min(hsl.l + 25, 60)}%`;
    
    return {
      '--sidebar-background': baseHsl,
      '--sidebar-accent': accentHsl,
      '--sidebar-border': borderHsl,
      '--sidebar-muted': mutedHsl,
    } as React.CSSProperties;
  };

  return (
    <Sidebar 
      className="border-r-0"
      style={getSidebarStyles()}
    >
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border px-4">
        {!collapsed ? (
          clientLogoUrl && !isAdmin ? (
            <img src={clientLogoUrl} alt={clientBranding?.name || 'Logo'} className="h-10 object-contain" />
          ) : (
            <img src={logo} alt="Smartest Solution" className="h-10 object-contain brightness-0 invert" />
          )
        ) : (
          <div className="w-8 h-8 bg-sidebar-foreground/20 rounded flex items-center justify-center">
            <span className="text-sidebar-foreground font-bold text-sm">
              {clientBranding?.name?.[0] || 'S'}
            </span>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        {/* Dashboard Link */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/dashboard'}>
                  <NavLink to="/dashboard" className="flex items-center gap-3">
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            {!collapsed && (
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                  Administração
                </span>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith('/admin/empresas')}>
                    <NavLink to="/admin/empresas" className="flex items-center gap-3">
                      <Building2 className="h-4 w-4" />
                      {!collapsed && <span>Empresas</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/admin/treinamentos'}>
                    <NavLink to="/admin/treinamentos" className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4" />
                      {!collapsed && <span>Treinamentos</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Global Trainings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/treinamentos'}>
                  <NavLink to="/treinamentos" className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4" />
                    {!collapsed && <span>Treinamentos</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects List */}
        <SidebarGroup>
          {!collapsed && (
            <div className="px-3 py-2">
              <span className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                Projetos
              </span>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-sidebar-foreground/60" />
                </div>
              ) : projects && projects.length > 0 ? (
                projects.map((project) => (
                  <Collapsible
                    key={project.id}
                    open={isProjectOpen(project.id)}
                    onOpenChange={() => toggleProject(project.id)}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          className="w-full justify-between"
                          isActive={location.pathname.startsWith(`/projeto/${project.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <FolderKanban className="h-4 w-4" />
                            {!collapsed && (
                              <span className="truncate max-w-[140px]">{project.name}</span>
                            )}
                          </div>
                          {!collapsed && (
                            <ChevronRight className={`h-4 w-4 transition-transform ${
                              isProjectOpen(project.id) ? 'rotate-90' : ''
                            }`} />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {projectSubMenuItems.map((item) => (
                              <SidebarMenuSubItem key={item.path}>
                                <SidebarMenuSubButton 
                                  asChild
                                  isActive={isSubItemActive(project.id, item.path)}
                                >
                                  <NavLink to={`/projeto/${project.id}${item.path}`}>
                                    <item.icon className="h-3.5 w-3.5 mr-2" />
                                    <span>{item.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                ))
              ) : (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-sidebar-foreground/60">
                    {collapsed ? '—' : 'Nenhum projeto disponível'}
                  </p>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* SAC / Support */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/suporte'}>
                  <NavLink to="/suporte" className="flex items-center gap-3">
                    <LifeBuoy className="h-4 w-4" />
                    {!collapsed && <span>Suporte</span>}
                    {!collapsed && isAdmin && openTicketsCount && openTicketsCount > 0 ? (
                      <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold">
                        {openTicketsCount}
                      </Badge>
                    ) : null}
                    {collapsed && isAdmin && openTicketsCount && openTicketsCount > 0 ? (
                      <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive" />
                    ) : null}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
