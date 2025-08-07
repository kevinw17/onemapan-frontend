import { useQuery } from "@tanstack/react-query";
const { axiosInstance } = require("@/lib/axios");

export const useFetchUsers = ({ 
    page = 1, 
    limit = 10, 
    search = "", 
    searchField = "full_name",
    job_name = [],
    last_education_level = [],
}) => {
    return useQuery({
        queryKey: ["fetch.users", page, limit, search, searchField, job_name, last_education_level],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            if (search) params.append('search', search);
            if (searchField) params.append('searchField', searchField);

            if (Array.isArray(job_name) && job_name.length > 0) {
                job_name.forEach(job => params.append('job_name[]', job));
            }

            if (Array.isArray(last_education_level) && last_education_level.length > 0) {
                last_education_level.forEach(edu => params.append('last_education_level[]', edu));
            }

            const response = await axiosInstance.get("/profile/user", {
                params: params,
            });
            
            return response.data;
        },
        keepPreviousData: true,
    });
};