import { Link } from 'react-router-dom';
import { FileText, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreditBadge } from '@/components/credits/CreditBadge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar = () => {
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Intel Bidder</h1>
              <p className="text-xs text-muted-foreground">Tender Intelligence Platform</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <CreditBadge />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {user?.email}
                </div>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
