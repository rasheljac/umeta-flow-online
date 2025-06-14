
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-4">
              <img
                src="/lovable-uploads/9521b0f4-3d7b-4906-a9fc-de87f5126a5a.png"
                alt="Settings"
                className="h-12 w-12 rounded-full bg-white border p-1"
              />
              <span>Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-6">
              This is a demo settings page. Here, you could enable dark mode, update your email, etc.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-800 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3 py-2 rounded border bg-slate-100 text-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-800 mb-1">Dark Mode</label>
                <input type="checkbox" disabled className="mr-2" /> (Coming soon)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
