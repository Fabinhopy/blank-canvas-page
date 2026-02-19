import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Settings, LifeBuoy } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';
import { supabase } from '@/integrations/supabase/client';
import { useOpenTicketsCount } from '@/hooks/useOpenTicketsCount';

export function AppHeader() {
  const { profile, userRole, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: openTicketsCount } = useOpenTicketsCount();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar public URL
  const avatarUrl = profile?.avatar_url 
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  return (
    <header className="sticky top-0 z-10 h-16 border-b bg-card flex items-center px-4 gap-4">
      <SidebarTrigger />
      
      <Breadcrumbs />
      
      <div className="flex-1" />

      {/* Support notification for admin */}
      {isAdmin && openTicketsCount && openTicketsCount > 0 ? (
        <Link to="/suporte" className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <LifeBuoy className="h-5 w-5" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-[10px] font-bold">
              {openTicketsCount}
            </Badge>
          </Button>
        </Link>
      ) : null}
      
      {/* Role Badge */}
      <div className="hidden sm:flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          userRole === 'admin' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {userRole === 'admin' ? 'Administrador' : 'Cliente'}
        </span>
      </div>
      
      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile?.full_name || 'Usuário'}
              </p>
              {profile?.company && (
                <p className="text-xs leading-none text-muted-foreground">
                  {profile.company}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/perfil">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações do Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
