import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useFetchDianChuanShi = (params = {}) => {
  return useQuery({
    queryKey: ["dianchuanshi", params],
    queryFn: async () => {
      const res = await axiosInstance.get("/dianchuanshi", { params });
      const rawData = res.data;
      return Array.isArray(rawData) ? { data: rawData } : rawData;
    },
  });
};