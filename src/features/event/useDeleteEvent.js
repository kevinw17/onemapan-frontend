import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

const deleteEvent = async (id) => {
    const response = await axiosInstance.delete(`/event/${id}`);
    return response.data;
};

export const useDeleteEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["events-final-v3"],
                exact: false,
            });
        },
        onError: (error) => {
            throw new Error(error.response?.data?.message || error.message || "Gagal menghapus kegiatan.");
        },
    });
};