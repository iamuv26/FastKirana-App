import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth-store';
import { API_BASE_URL } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { useTheme } from '../../app/context/ThemeContext';

export default function UsersTab() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Search, Role Filter, and Page states
  const [usersSearch, setUsersSearch] = useState<string>('');
  const [usersRoleFilter, setUsersRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);

  // Manage User states
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newUserRole, setNewUserRole] = useState<string>('USER');
  const [workerPassword, setWorkerPassword] = useState<string>('');

  const getAuthHeaders = (): Record<string, string> => {
    if (!user) return {};
    return {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-role': user.role,
      'x-user-email': user.email || '',
      'x-user-name': user.name || '',
      'x-user-phone': user.phone || '',
    };
  };

  // 1. Fetch Users Query with Server-side Pagination & Filters
  const { 
    data: usersData = { users: [], total: 0 }, 
    isLoading: isUsersLoading,
    refetch: fetchUsers
  } = useQuery<any>({
    queryKey: ['adminUsers', page, usersRoleFilter, usersSearch],
    queryFn: async () => {
      const roleParam = usersRoleFilter === 'ALL' ? '' : usersRoleFilter;
      const res = await fetch(
        `${API_BASE_URL}/admin/users?page=${page}&limit=10&search=${encodeURIComponent(usersSearch)}&role=${roleParam}`, 
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      return {
        users: data && Array.isArray(data.users) ? data.users : [],
        total: data.total || 0
      };
    },
    staleTime: 30000, // 30 seconds caching
  });

  const usersList = usersData.users;
  const userTotal = usersData.total;
  const totalPages = Math.ceil(userTotal / 10) || 1;

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, role })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update user role');
      }
      return res.json();
    },
    onSuccess: () => {
      triggerHaptic('success');
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error updating role');
    }
  });

  const setPasswordMutation = useMutation({
    mutationFn: async ({ userId, passwordText }: { userId: string; passwordText: string }) => {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, password: passwordText })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to set password');
      }
      return res.json();
    },
    onSuccess: () => {
      triggerHaptic('success');
      toast.success('Password updated successfully');
      setWorkerPassword('');
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error setting password');
    }
  });

  // Handlers
  const handleUpdateUserRole = () => {
    if (!editingUser) return;
    triggerHaptic('light');
    updateRoleMutation.mutate({ userId: editingUser.id, role: newUserRole });
  };

  const handleSetWorkerPassword = () => {
    if (!editingUser) return;
    if (!workerPassword || workerPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    triggerHaptic('light');
    setPasswordMutation.mutate({ userId: editingUser.id, passwordText: workerPassword });
  };

  return (
    <View className="px-4 py-4">
      {/* Search and Role Filter Header */}
      <View className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-200/60 dark:border-zinc-800 mb-4 gap-4 shadow-sm">
        <View className="flex-row items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-full px-4 h-11">
          <Search size={15} color={isDark ? '#a1a1aa' : '#94a3b8'} strokeWidth={2.5} />
          <TextInput
            placeholder="Search users by name, email, phone..."
            placeholderTextColor={isDark ? '#52525b' : '#94a3b8'}
            value={usersSearch}
            onChangeText={(text) => {
              setUsersSearch(text);
              setPage(1); // reset to page 1 on new search
            }}
            className="flex-1 text-slate-800 dark:text-zinc-100 text-xs ml-2.5 h-full p-0"
          />
          {usersSearch.length > 0 && (
            <Pressable onPress={() => setUsersSearch('')} className="bg-slate-200/60 dark:bg-zinc-800 p-1 rounded-full">
              <X size={12} color={isDark ? '#a1a1aa' : '#94a3b8'} />
            </Pressable>
          )}
        </View>

        {/* Role filter buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
          {['ALL', 'ADMIN', 'USER', 'PICKER', 'DELIVERY', 'CHEF'].map((role) => (
            <Pressable
              key={role}
              onPress={() => {
                triggerHaptic('light');
                setUsersRoleFilter(role);
                setPage(1); // reset to page 1 on filter change
              }}
              className={`px-4 py-2 rounded-full border mr-2 ${
                usersRoleFilter === role
                  ? 'bg-indigo-600 border-indigo-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700'
              }`}
            >
              <Text className={`text-[10px] font-black uppercase tracking-wider ${
                usersRoleFilter === role ? 'text-white' : 'text-slate-600 dark:text-zinc-300'
              }`}>{role}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Users Count summary */}
      <View className="mb-2 flex-row justify-between items-center px-1">
        <Text className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Total Customers: {userTotal}
        </Text>
      </View>

      {/* Users List */}
      {isUsersLoading && usersList.length === 0 ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-slate-500 dark:text-zinc-400 font-bold text-xs mt-3">Loading users database...</Text>
        </View>
      ) : usersList.length === 0 ? (
        <View className="py-20 items-center justify-center bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
          <Text className="text-4xl mb-3">👥</Text>
          <Text className="text-slate-850 dark:text-zinc-100 font-black text-sm">No Users Found</Text>
          <Text className="text-slate-500 dark:text-zinc-450 text-[10px] text-center mt-1 max-w-[200px]">
            No registered users match your search query or role filters.
          </Text>
        </View>
      ) : (
        <View className="gap-3 mb-4">
          {usersList.map((item: any) => (
            <View
              key={item.id}
              className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-4 rounded-3xl flex-row justify-between items-center shadow-sm"
            >
              <View className="flex-1 pr-3">
                <Text className="text-slate-850 dark:text-zinc-100 font-extrabold text-sm">{item.name || 'Anonymous'}</Text>
                <Text className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">{item.email}</Text>
                {item.phone && <Text className="text-slate-450 dark:text-zinc-550 text-[10px] mt-0.5">{item.phone}</Text>}
                
                <View className="flex-row items-center gap-2 mt-2.5">
                  <View className="bg-slate-50 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-slate-150 dark:border-zinc-700">
                    <Text style={{ fontSize: 8.5, fontWeight: '900' }} className="text-slate-650 dark:text-zinc-350 uppercase tracking-wider">
                      {item.role}
                    </Text>
                  </View>
                  <Text className="text-indigo-600 dark:text-indigo-400 font-black text-[9.5px]">
                    • {item._count?.orders ?? 0} Orders
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View>
                <Pressable
                  onPress={() => {
                    setEditingUser(item);
                    setNewUserRole(item.role);
                    setWorkerPassword('');
                  }}
                  className="bg-indigo-600 active:bg-indigo-700 px-4 py-2 rounded-full shadow-xs"
                >
                  <Text className="text-white font-extrabold text-[10.5px] uppercase tracking-wider text-center">Manage</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Pagination Controls */}
      {userTotal > 10 && (
        <View className="flex-row justify-between items-center py-2 mb-10">
          <Pressable
            onPress={() => {
              if (page > 1) {
                triggerHaptic('light');
                setPage(page - 1);
              }
            }}
            disabled={page === 1}
            className={`px-3 py-2 rounded-xl border flex-row items-center gap-1 ${
              page === 1 ? 'border-slate-100 dark:border-zinc-800 opacity-50' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 active:bg-slate-200'
            }`}
          >
            <ChevronLeft size={14} color={isDark ? '#fff' : '#000'} />
            <Text className="text-slate-800 dark:text-white font-black text-[10px]">PREVIOUS</Text>
          </Pressable>

          <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold">
            Page {page} of {totalPages}
          </Text>

          <Pressable
            onPress={() => {
              if (page < totalPages) {
                triggerHaptic('light');
                setPage(page + 1);
              }
            }}
            disabled={page === totalPages}
            className={`px-3 py-2 rounded-xl border flex-row items-center gap-1 ${
              page === totalPages ? 'border-slate-100 dark:border-zinc-800 opacity-50' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 active:bg-slate-200'
            }`}
          >
            <Text className="text-slate-800 dark:text-white font-black text-[10px]">NEXT</Text>
            <ChevronRight size={14} color={isDark ? '#fff' : '#000'} />
          </Pressable>
        </View>
      )}

      {/* Manage User Modal */}
      {editingUser && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditingUser(null)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 w-full shadow-2xl">
              <View className="flex-row justify-between items-center border-b border-slate-200 dark:border-zinc-800 pb-3 mb-4">
                <Text className="text-slate-850 dark:text-zinc-100 font-black text-base">Manage User: {editingUser.name || 'Anonymous'}</Text>
                <Pressable onPress={() => setEditingUser(null)} className="p-1">
                  <X size={18} color={isDark ? '#a1a1aa' : '#94a3b8'} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4" nestedScrollEnabled={true}>
                {/* 1. Modify Role */}
                <Text className="text-slate-500 dark:text-zinc-400 font-black text-[10px] uppercase tracking-wider mb-2">Change User Role</Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                  {['USER', 'PICKER', 'CHEF', 'DELIVERY', 'ADMIN'].map((role) => {
                    const isSelected = newUserRole === role;
                    return (
                      <Pressable
                        key={role}
                        onPress={() => setNewUserRole(role)}
                        className={`px-3.5 py-2 rounded-xl border ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500'
                            : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        <Text className={`font-black text-[11px] ${
                          isSelected ? 'text-white' : 'text-slate-700 dark:text-zinc-300'
                        }`}>{role}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Submit Role Change Button */}
                <Pressable
                  onPress={handleUpdateUserRole}
                  disabled={updateRoleMutation.isPending}
                  className="w-full bg-indigo-600 py-3 rounded-xl flex items-center justify-center mb-6 active:bg-indigo-700 disabled:opacity-50"
                >
                  <Text className="text-white font-extrabold text-xs uppercase tracking-wider">
                    {updateRoleMutation.isPending ? 'Updating Role...' : 'Save Role Change'}
                  </Text>
                </Pressable>

                {/* 2. Modify Worker Password (Only for Staff roles) */}
                {['ADMIN', 'PICKER', 'CHEF', 'DELIVERY'].includes(newUserRole) && (
                  <View className="border-t border-slate-200 dark:border-zinc-800 pt-4 mb-4">
                    <Text className="text-slate-500 dark:text-zinc-400 font-black text-[10px] uppercase tracking-wider mb-2">Set Worker Console Password</Text>
                    <TextInput
                      placeholder="Enter new login password (min 6 chars)..."
                      placeholderTextColor={isDark ? '#52525b' : '#94a3b8'}
                      secureTextEntry
                      value={workerPassword}
                      onChangeText={setWorkerPassword}
                      className="bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-slate-850 dark:text-zinc-100 text-xs mb-3 h-12"
                    />

                    <Pressable
                      onPress={handleSetWorkerPassword}
                      disabled={setPasswordMutation.isPending}
                      className="w-full bg-emerald-600 py-3 rounded-xl flex items-center justify-center active:bg-emerald-700 disabled:opacity-50"
                    >
                      <Text className="text-white font-extrabold text-xs uppercase tracking-wider">
                        {setPasswordMutation.isPending ? 'Saving Password...' : 'Update Console Password'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
