import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

const createEvent = async (payload) => {
    const response = await axiosInstance.post("/event", payload);
    return response.data;
};

export const useCreateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createEvent,
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["fetch.events"] });
        },
        onError: (error) => {
        throw new Error(error.response?.data?.message || error.message || "Gagal menambahkan kegiatan.");
        },
    });
};