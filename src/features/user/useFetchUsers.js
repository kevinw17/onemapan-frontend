import { useQuery } from "@tanstack/react-query";
const { axiosInstance } = require("@/lib/axios");

export const useFetchUsers = ({ page = 1, limit = 10, search = "", searchField = "full_name" }) => {
    return useQuery({
    queryKey: ["fetch.users", page, limit, search, searchField],
        queryFn: async () => {
            const response = await axiosInstance.get("/profile/user", {
                params: { page, limit, search, searchField },
            });
            
            return response.data;
        },
        keepPreviousData: true,
    });
};