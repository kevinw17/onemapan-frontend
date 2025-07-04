import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useUpdateLocation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ locationId, payload }) =>
        axiosInstance.patch(`/profile/location/${locationId}`, payload),
        onSuccess: () => {
        queryClient.invalidateQueries(["locations"]);
        },
    });
};