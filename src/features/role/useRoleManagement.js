import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

const permissionsToArray = (permissions) => {
    const result = [];
    for (const [module, perms] of Object.entries(permissions || {})) {
        if (perms.create) result.push(`${module}_create`);
        if (perms.read) result.push(`${module}_read`);
        if (perms.update) result.push(`${module}_update`);
        if (perms.delete) result.push(`${module}_delete`);
        if (perms.import) result.push(`${module}_import`);
        if (perms.read_national) result.push(`${module}_read_national`);
        if (perms.read_area) result.push(`${module}_read_area`);
        if (perms.create_type) result.push(`${module}_create_type`);
        if (perms.create_role) result.push(`${module}_create_role`);
        if (perms.edit_role) result.push(`${module}_edit_role`);
        if (perms.delete_role) result.push(`${module}_delete_role`);
    }
    return result;
};

const arrayToPermissions = (perms, defaultScope) => {
    const permissions = {};
    for (const perm of perms || []) {
        const [module, action] = perm.split("_");
        if (!permissions[module]) {
            permissions[module] = { scope: defaultScope };
        }
        if (action === "create") permissions[module].create = true;
        if (action === "read") permissions[module].read = true;
        if (action === "update") permissions[module].update = true;
        if (action === "delete") permissions[module].delete = true;
        if (action === "import") permissions[module].import = true;
        if (action === "read_national") permissions[module].read_national = true;
        if (action === "read_area") permissions[module].read_area = true;
        if (action === "create_type") permissions[module].create_type = true;
        if (action === "create_role") permissions[module].create_role = true;
        if (action === "edit_role") permissions[module].edit_role = true;
        if (action === "delete_role") permissions[module].delete_role = true;
    }
    return permissions;
};

export const useRoleManagement = () => {
    const queryClient = useQueryClient();
    const [tokenData, setTokenData] = useState({ role: null, area: null });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    setTokenData({ 
                        role: decoded.role, 
                        area: decoded.area,
                        user_info_id: decoded.user_info_id
                    });
                } catch (error) {
                    console.error("Failed to decode token:", error);
                }
            }
        }
    }, []);

    const rolesQuery = useQuery({
        queryKey: ["roles", tokenData.area],
        queryFn: async () => {
            const response = await axiosInstance.get("/role", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            return Array.isArray(response.data) ? response.data : [];
        },
        enabled: !!tokenData.role,
        staleTime: 60 * 1000,
        retry: false,
    });

    const allUsersQuery = useQuery({
        queryKey: ["allUsersWithCredentials", tokenData.area],
        queryFn: async () => {
            if (!localStorage.getItem("token")) {
                return [];
            }

            const response = await axiosInstance.get("/role/users", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                timeout: 10000
            }).catch((error) => {
                return { data: [] };
            });
            
            return response?.data || [];
        },
        enabled: !!tokenData.role,
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
            return failureCount < 1;
        },
        retryDelay: 1000,
    });

    const createRoleMutation = useMutation({
        mutationFn: async (input) => {
            const response = await axiosInstance.post("/role", input, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, input }) => {
            const response = await axiosInstance.put(`/role/${id}`, input, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
        },
    });

    const deleteRoleMutation = useMutation({
        mutationFn: async (id) => {
            const response = await axiosInstance.delete(`/role/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
        },
    });

    const assignRoleMutation = useMutation({
        mutationFn: async ({ user_id, role_id }) => {
            const response = await axiosInstance.post("/role/assign", { user_id, role_id }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            queryClient.invalidateQueries({ queryKey: ["allUsersWithCredentials"] });
        },
    });

    const removeRoleMutation = useMutation({
        mutationFn: async ({ user_id, role_id }) => {
            
            const response = await axiosInstance.delete("/role/remove", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                data: { user_id, role_id }
            }).catch((error) => {
                
                if (error.response?.status === 200) {
                    return error.response;
                }
                
                throw error;
            });
            
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            queryClient.invalidateQueries({ queryKey: ["allUsersWithCredentials"] });
        },
    });

    return {
        roles: rolesQuery.data || [],
        rolesLoading: rolesQuery.isLoading,
        rolesError: rolesQuery.error,
        allUsers: allUsersQuery.data || [],
        allUsersLoading: allUsersQuery.isLoading,
        allUsersError: allUsersQuery.error,
        createRole: createRoleMutation.mutate,
        updateRole: updateRoleMutation.mutate,
        deleteRole: deleteRoleMutation.mutate,
        assignRole: assignRoleMutation.mutate,
        removeRole: removeRoleMutation.mutate,
        tokenData,
        permissionsToArray,
        arrayToPermissions,
        refetchUsers: () => queryClient.invalidateQueries({ queryKey: ["allUsersWithCredentials"] }),
        refetchRoles: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
    };
};