import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useAuth } from './AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { Microscope, Upload, BarChart3, LogOut, User, History } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) return null;

  const displayName = profile?.full_name || user.email;

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              {/* Logo branding with proper aspect ratio */}
              <div className="h-10 w-10">
                <img
                  src="/lovable-uploads/9521b0f4-3d7b-4906-a9fc-de87f5126a5a.png"
                  alt="Kapelczak Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-xl font-bold text-slate-900" style={{ letterSpacing: "0.01em" }}>Kapelczak</span>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </Link>
              <Link 
                to="/workflows" 
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Microscope className="w-4 h-4" />
                <span>Workflows</span>
              </Link>
              <Link 
                to="/results" 
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Results</span>
              </Link>
              <Link
                to="/my-analysis"
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </Link>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="hidden md:inline">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Profile & Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/my-analysis" className="flex items-center">
                  <History className="w-4 h-4 mr-2" />
                  Analysis History
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
