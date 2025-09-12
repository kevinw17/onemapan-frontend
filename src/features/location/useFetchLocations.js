import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useFetchProvinces = () => {
    return useQuery({
        queryKey: ["provinces"],
        queryFn: async () => {
        const response = await axiosInstance.get("/profile/location/provinces");
        return response.data || [];
        },
    });
};

export const useFetchCities = (provinceId) => {
    return useQuery({
        queryKey: ["cities", provinceId],
        queryFn: async () => {
        if (!provinceId) return [];
        const response = await axiosInstance.get(`/profile/location/cities?provinceId=${provinceId}`);
        return response.data || [];
        },
        enabled: !!provinceId,
    });
};

export const useFetchDistricts = (cityId) => {
    return useQuery({
        queryKey: ["districts", cityId],
        queryFn: async () => {
        if (!cityId) return [];
        const response = await axiosInstance.get(`/profile/location/districts?cityId=${cityId}`);
        return response.data || [];
        },
        enabled: !!cityId,
    });
};

export const useFetchLocalities = (districtId) => {
    return useQuery({
        queryKey: ["localities", districtId],
        queryFn: async () => {
        if (!districtId) return [];
        const response = await axiosInstance.get(`/profile/location/localities?districtId=${districtId}`);
        return response.data || [];
        },
        enabled: !!districtId,
    });
};