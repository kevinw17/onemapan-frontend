// @/lib/axios.js
import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:2025",
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        console.log("DEBUG: Token in axiosInstance:", token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log("DEBUG: Axios request headers:", config.headers);
        return config;
    },
    (error) => {
        console.error("Axios request interceptor error:", error);
        return Promise.reject(error);
    }
);

export { axiosInstance };