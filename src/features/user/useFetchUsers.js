import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useFetchUsers = ({ 
    page = 1, 
    limit = 10, 
    search = "", 
    searchField = "full_name",
    job_name = [],
    last_education_level = [],
    spiritualStatus = [], // Pastikan konsisten
    is_qing_kou = [],
    gender = [],
    blood_type = [],
}) => {
    console.log("Fetch Users Params:", { page, limit, search, searchField, job_name, last_education_level, spiritualStatus, is_qing_kou, gender, blood_type });
    return useQuery({
        queryKey: ["fetch.users", page, limit, search, searchField, job_name, last_education_level, spiritualStatus, is_qing_kou, gender, blood_type],
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

            if (Array.isArray(spiritualStatus) && spiritualStatus.length > 0) {
                spiritualStatus.forEach(status => params.append('spiritualStatus[]', status));
            }

            if (Array.isArray(is_qing_kou) && is_qing_kou.length > 0) {
                is_qing_kou.forEach(qk => params.append('is_qing_kou[]', qk));
            }

            if (Array.isArray(gender) && gender.length > 0) {
                gender.forEach(g => params.append('gender[]', g));
            }

            if (Array.isArray(blood_type) && blood_type.length > 0) {
                blood_type.forEach(bt => params.append('blood_type[]', bt));
            }

            console.log("API Request Params:", params.toString());
            const response = await axiosInstance.get("/profile/user", {
                params: params,
            });
            console.log("API Response:", response.data);
            return response.data;
        },
        keepPreviousData: true,
    });
};