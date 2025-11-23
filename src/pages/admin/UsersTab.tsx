import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';

interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

const UsersTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });

  const filteredProfiles = useMemo(() => {
    if (!profiles || profiles.length === 0) return [];

    return profiles.filter(profile =>
      profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  return (
    <main className="pt-20">
      <div className="container mx-auto py-10">
        <div className="bg-gray-200 border border-gray-500 rounded-lg p-2 sm:p-4 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 md:mb-6 gap-3">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">Users Management</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {profilesLoading ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {filteredProfiles.map((profile) => (
                  <div key={profile.id} className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate">
                          {profile.name || 'No name'}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-gray-600">Contact:</p>
                        <p className="text-xs text-gray-800">{profile.phone || 'No phone'}</p>
                      </div>
                    </div>

                    {profile.address && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">Address</p>
                        <p className="text-xs text-gray-800 leading-relaxed">
                          {profile.address}
                          <br />
                          {profile.city}, {profile.state} {profile.zip_code}
                        </p>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Joined: {format(new Date(profile.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto border border-gray-200 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-red-600 hover:bg-red-700 border border-red-600 transition-colors duration-300">
                      <TableHead className="text-left font-semibold text-white px-2 py-3">User Info</TableHead>
                      <TableHead className="text-center font-semibold text-white px-2 py-3">Contact</TableHead>
                      <TableHead className="text-center font-semibold text-white px-2 py-3">Address</TableHead>
                      <TableHead className="text-center font-semibold text-white px-2 py-3">Joined</TableHead>
                    </TableRow>

                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id} className="hover:bg-gray-50 border-b border-gray-600">
                        <TableCell className="p-2 sm:p-3">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{profile.name || 'No name'}</div>
                            <div className="text-xs text-gray-500">{profile.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm p-2 sm:p-3">
                          <div className="space-y-1">
                            <div>{profile.phone || 'No phone'}</div>
                            <div className="text-xs text-gray-500">{profile.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm p-2 sm:p-3">
                          {profile.address ? (
                            <div className="space-y-1">
                              <div className="text-xs sm:text-sm">{profile.address}</div>
                              <div className="text-xs text-gray-500">
                                {profile.city}, {profile.state} {profile.zip_code}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No address</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs text-gray-600 p-2 sm:p-3">
                          {format(new Date(profile.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* No results message */}
              {filteredProfiles.length === 0 && !profilesLoading && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default UsersTab;