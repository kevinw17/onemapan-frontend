import { axiosInstance } from "@/lib/axios";

export const loginApi = async ({ username, password }) => {
    const response = await axiosInstance.post("/login", { username, password });
    return response.data;
};