import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

const updateEvent = async (id, payload) => {
    await axiosInstance.patch(`/event/${id}`, payload);
};

export const useUpdateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }) => updateEvent(id, payload),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["fetch.events"] });
        },
        onError: (error) => {
        throw new Error(error.response?.data?.message || error.message || "Gagal memperbarui kegiatan.");
        },
    });
};