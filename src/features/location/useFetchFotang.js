import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useFetchFotang = (params = {}) => {
  return useQuery({
    queryKey: ["fotang", params],
    queryFn: async () => {
      const res = await axiosInstance.get("/fotang", { params });
      
      const rawData = res.data;
      if (Array.isArray(rawData)) {
        return { data: rawData };
      }
      return rawData;
    },
  });
};