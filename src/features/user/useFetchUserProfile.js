import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useFetchUserProfile = (userId) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID tidak ditemukan");
      }
      console.log("Fetching profile for userId:", userId);
      const response = await axiosInstance.get(`/profile/user/${userId}`);
      console.log("User profile API response:", response.data);
      return response.data;
    },
    enabled: !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    onError: (error) => {
      console.error("Error fetching user profile:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    },
    // Tambahkan invalidasi cache saat queryKey berubah
    onSettled: () => {
      if (!userId) {
        queryClient.invalidateQueries(["userProfile"]);
      }
    },
  });
};