import { useQuery } from "@tanstack/react-query";
const { axiosInstance } = require("@/lib/axios");

export const useFetchQiudaos = ({ page = 1, limit = 10, search = "", searchField = "qiu_dao_mandarin_name" }) => {
    return useQuery({
        queryFn: async () => {
            const qiudaosResponse = await axiosInstance.get("/profile/qiudao",  {
                params: { page, limit, search, searchField },
            });

            return qiudaosResponse.data;
        },
        queryKey: ["fetch.qiudaos", page, limit, search, searchField],
        keepPreviousData: true,
    });
}