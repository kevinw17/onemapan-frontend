import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useLogin = () => {
  return useMutation({
    mutationFn: async ({ username, password }) => {
      const response = await axiosInstance.post("/login", {
        username,
        password,
      });
      return response.data;
    },
  });
};
