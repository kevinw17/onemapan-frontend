import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useDeleteQiudao = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (qiu_dao_id) =>
        axiosInstance.delete(`/profile/qiudao/${qiu_dao_id}`),
        onSuccess: () => {
        queryClient.invalidateQueries(["qiudaos"]);
        },
    });
};
