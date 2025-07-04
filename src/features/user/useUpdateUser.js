import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, payload }) =>
        axiosInstance.patch(`/profile/user/${userId}`, payload),
        onSuccess: () => {
        queryClient.invalidateQueries(["users"]);
        },
    });
};
