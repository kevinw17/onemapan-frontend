import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId) => axiosInstance.delete(`/profile/user/${userId}`),
        onSuccess: () => {
        queryClient.invalidateQueries(["users"]);
        },
    });
};