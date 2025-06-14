
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from './AuthProvider';
import { Microscope, Upload, Settings, BarChart3, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <Microscope className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">MetaboFlow</span>
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
                <Settings className="w-4 h-4" />
                <span>Workflows</span>
              </Link>
              <Link 
                to="/results" 
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Results</span>
              </Link>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="hidden md:inline">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <User className="w-4 h-4 mr-2" />
                {user.email}
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
