import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useFetchQiudaos = ({
  page = 1,
  limit = 10,
  search = "",
  searchField = "qiu_dao_mandarin_name",
  location_name = [],
  location_mandarin_name = [],
  dian_chuan_shi_name = [],
  dian_chuan_shi_mandarin_name = [],
  yin_shi_qd_name = [],
  yin_shi_qd_mandarin_name = [],
  bao_shi_qd_name = [],
  bao_shi_qd_mandarin_name = [],
  userId,
  userArea,
  fotangId = null
}) => {
  return useQuery({
    queryKey: [
      "fetch.qiudaos",
      page, limit, search, searchField,
      location_name, location_mandarin_name,
      dian_chuan_shi_name, dian_chuan_shi_mandarin_name,
      yin_shi_qd_name, yin_shi_qd_mandarin_name,
      bao_shi_qd_name, bao_shi_qd_mandarin_name,
      userId, userArea, fotangId
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (search) {
        params.append("search", search);
        params.append("searchField", searchField);
      }

      if (Array.isArray(location_name) && location_name.length > 0) {
        location_name.forEach(val => params.append("location_name[]", val));
      }
      if (Array.isArray(location_mandarin_name) && location_mandarin_name.length > 0) {
        location_mandarin_name.forEach(val => params.append("location_mandarin_name[]", val));
      }
      if (Array.isArray(dian_chuan_shi_name) && dian_chuan_shi_name.length > 0) {
        dian_chuan_shi_name.forEach(val => params.append("dian_chuan_shi_name[]", val));
      }
      if (Array.isArray(dian_chuan_shi_mandarin_name) && dian_chuan_shi_mandarin_name.length > 0) {
        dian_chuan_shi_mandarin_name.forEach(val => params.append("dian_chuan_shi_mandarin_name[]", val));
      }
      if (Array.isArray(yin_shi_qd_name) && yin_shi_qd_name.length > 0) {
        yin_shi_qd_name.forEach(val => params.append("yin_shi_qd_name[]", val));
      }
      if (Array.isArray(yin_shi_qd_mandarin_name) && yin_shi_qd_mandarin_name.length > 0) {
        yin_shi_qd_mandarin_name.forEach(val => params.append("yin_shi_qd_mandarin_name[]", val));
      }
      if (Array.isArray(bao_shi_qd_name) && bao_shi_qd_name.length > 0) {
        bao_shi_qd_name.forEach(val => params.append("bao_shi_qd_name[]", val));
      }
      if (Array.isArray(bao_shi_qd_mandarin_name) && bao_shi_qd_mandarin_name.length > 0) {
        bao_shi_qd_mandarin_name.forEach(val => params.append("bao_shi_qd_mandarin_name[]", val));
      }

      if (userId) {
        params.append("userId", userId);
      }
      if (userArea) {
        params.append("userArea", userArea);
      }
      if (fotangId) {
        params.append("fotangId", fotangId);
      }

      const url = `/profile/qiudao?${params.toString()}`;

      const response = await axiosInstance.get("/profile/qiudao", { params });

      return response.data;
    },
    keepPreviousData: true,
  });
};