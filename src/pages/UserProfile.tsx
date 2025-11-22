import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { User, Edit3, Save, X, LogOut, Mail, Phone, MapPin, Building } from "lucide-react";

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

const UserProfile: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();

  // Fetch current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  // Fetch profile info
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Local state for editing
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // When profile loads, set editData only if not editing
  React.useEffect(() => {
    if (profile && !isEditing) {
      setEditData({
        name: profile.name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        zip_code: profile.zip_code || "",
      });
    }
  }, [profile, isEditing]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (newData: typeof editData) => {
      const { error } = await supabase
        .from("profiles")
        .update(newData)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({ title: "Profile updated", description: "Your info was saved." });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    },
  });

  const isUnchanged =
    editData.name === (profile?.name || "") &&
    editData.phone === (profile?.phone || "") &&
    editData.address === (profile?.address || "") &&
    editData.city === (profile?.city || "") &&
    editData.state === (profile?.state || "") &&
    editData.zip_code === (profile?.zip_code || "");

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin animate-reverse"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 text-lg">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-200 to-indigo-200 relative overflow-hidden">
      {/* Animated background bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-3 py-4 sm:max-w-2xl sm:px-4 sm:py-6">
        {/* Header Section */}
      

        {/* Main Profile Card */}
         <div className="mt-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/15 to-purple-400/15 rounded-2xl blur-lg"></div>
          <div className="relative bg-white/95 backdrop-blur-xl border-2 border-slate-200/80 rounded-2xl shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-4 border-b-2 border-slate-200/60">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-800 truncate">Profile Information</h2>
                    <p className="text-slate-500 text-xs sm:text-sm">Keep your details up to date</p>
                  </div>
                </div>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 h-9 px-3 text-sm"
                  >
                    <Edit3 className="w-3 h-3 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Form Content */}
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Email Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    Email Address
                  </label>
                  <div className="relative">
                    <Input 
                      value={profile?.email || user.email} 
                      disabled 
                      className="bg-slate-50 border-2 border-slate-200 text-slate-600 rounded-lg h-10 pl-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>

                {/* Name Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    Full Name
                  </label>
                  <div className="relative">
                    <Input
                      value={editData.name}
                      onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                      placeholder="Enter your full name"
                      disabled={!isEditing}
                      className={`rounded-lg h-10 pl-3 transition-all duration-200 text-sm border-2 ${
                        isEditing 
                          ? 'border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>

                {/* Phone Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    Phone Number
                  </label>
                  <div className="relative">
                    <Input
                      value={editData.phone}
                      onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                      disabled={!isEditing}
                      className={`rounded-lg h-10 pl-3 transition-all duration-200 text-sm border-2 ${
                        isEditing 
                          ? 'border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>

                {/* Address Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    Street Address
                  </label>
                  <div className="relative">
                    <Input
                      value={editData.address}
                      onChange={e => setEditData(d => ({ ...d, address: e.target.value }))}
                      placeholder="Enter your street address"
                      disabled={!isEditing}
                      className={`rounded-lg h-10 pl-3 transition-all duration-200 text-sm border-2 ${
                        isEditing 
                          ? 'border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>

                {/* City, State Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative group">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center">
                      <Building className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      City
                    </label>
                    <div className="relative">
                      <Input
                        value={editData.city}
                        onChange={e => setEditData(d => ({ ...d, city: e.target.value }))}
                        placeholder="Enter city"
                        disabled={!isEditing}
                        className={`rounded-lg h-10 pl-3 transition-all duration-200 text-sm border-2 ${
                          isEditing 
                            ? 'border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      />
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                    <div className="relative">
                      <Input
                        value={editData.state}
                        onChange={e => setEditData(d => ({ ...d, state: e.target.value }))}
                        placeholder="Enter state"
                        disabled={!isEditing}
                        className={`rounded-lg h-10 pl-3 transition-all duration-200 text-sm border-2 ${
                          isEditing 
                            ? 'border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      />
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  </div>
                </div>

                {/* Zip Code */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Postal Code</label>
                  <div className="relative">
                    <Input
                      value={editData.zip_code}
                      onChange={e => setEditData(d => ({ ...d, zip_code: e.target.value }))}
                      placeholder="Enter postal code"
                      disabled={!isEditing}
                      className={`rounded-lg h-10 pl-3 transition-all duration-200 text-sm border-2 ${
                        isEditing 
                          ? 'border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t-2 border-slate-200/60">
                  {!isEditing ? (
                    <div className="flex flex-col gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={signOut}
                        className="w-full h-10 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-sm"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button 
                        type="button" 
                        disabled={updateProfile.isPending || isUnchanged}
                        onClick={() => updateProfile.mutate(editData)}
                        className="w-full h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfile.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditData({
                            name: profile.name || "",
                            phone: profile.phone || "",
                            address: profile.address || "",
                            city: profile.city || "",
                            state: profile.state || "",
                            zip_code: profile.zip_code || "",
                          });
                        }}
                        className="w-full h-10 rounded-lg border-2 border-slate-300 hover:bg-slate-50 transition-all duration-200 text-sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
        </div>
  );
};

export default UserProfile;
