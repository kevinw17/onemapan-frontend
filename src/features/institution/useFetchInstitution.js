import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useFetchInstitution = (params = {}) => {
    return useQuery({
        queryKey: ["institution", params],
        queryFn: async () => {
        const res = await axiosInstance.get("/institution", { params });
        const rawData = res.data;
        return Array.isArray(rawData) ? { data: rawData } : rawData;
        },
    });
};