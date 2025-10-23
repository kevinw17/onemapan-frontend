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
      const response = await axiosInstance.get(`/profile/user/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    onSettled: () => {
      if (!userId) {
        queryClient.invalidateQueries(["userProfile"]);
      }
    },
  });
};