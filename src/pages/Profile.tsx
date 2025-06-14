
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8 text-center">Not logged in.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-4">
              <img
                src="/lovable-uploads/9521b0f4-3d7b-4906-a9fc-de87f5126a5a.png"
                alt="Profile"
                className="h-16 w-16 rounded-full bg-white border p-2"
                style={{ background: "#fff" }}
              />
              <span>User Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-2">
              <h2 className="text-xl font-semibold">{user.email}</h2>
              <p className="text-slate-600">Status: <Badge variant="outline">Active</Badge></p>
              <Link
                to="/settings"
                className="mt-4 text-blue-600 underline hover:text-blue-800"
              >
                Settings
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
