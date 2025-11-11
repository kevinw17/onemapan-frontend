import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useUpdateFotang = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
        const res = await axiosInstance.patch(`/fotang/${id}`, data);
        return res.data;
        },
        onSuccess: () => {
        queryClient.invalidateQueries(["fotang"]);
        },
    });
};