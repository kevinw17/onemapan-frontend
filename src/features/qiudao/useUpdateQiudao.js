import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useUpdateQiudao = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ qiu_dao_id, payload }) =>
        axiosInstance.patch(`/profile/qiudao/${qiu_dao_id}`, payload),
        onSuccess: () => {
        queryClient.invalidateQueries(["qiudaos"]);
        },
    });
};
