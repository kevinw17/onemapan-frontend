// src/features/event/useFetchEvents.js
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";

// Helper stabil untuk queryKey
const stableKey = (arr) => {
  const array = Array.isArray(arr) ? arr : [];
  if (array.length === 0) return "none";
  return [...array]
    .sort((a, b) => String(a).localeCompare(String(b)))
    .join("|");
};

export const useFetchEvents = ({
  category,
  event_type = [],
  area = [],
  province_id = [],
  city_id = [],
  institution_id = [],
  is_recurring = null,
  startDate,
  endDate,
}) => {
  const tokenRef = useRef({ role: "guest", area: "none" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      tokenRef.current = {
        role: decoded.role || "guest",
        area: decoded.area || "none",
      };
    } catch {}
  }, []);

  // LOG HANYA KALAU BENAR-BENAR BERUBAH
  const prevParamsRef = useRef(null);
  const queryParams = useMemo(() => {
    // PASTIKAN SEMUA ADALAH ARRAY (ini yang fix error null.length)
    const safeEventType = Array.isArray(event_type) ? event_type : [];
    const safeArea = Array.isArray(area) ? area : [];
    const safeProvince = Array.isArray(province_id) ? province_id : [];
    const safeCity = Array.isArray(city_id) ? city_id : [];
    const safeInstitution = Array.isArray(institution_id) ? institution_id : [];

    const params = {
      category: category || "all",
      ...(safeEventType.length > 0 && { event_type: safeEventType.join(",") }),
      ...(safeArea.length > 0 && { area: safeArea.join(",") }),
      ...(safeProvince.length > 0 && { province_id: safeProvince.join(",") }),
      ...(safeCity.length > 0 && { city_id: safeCity.join(",") }),
      ...(safeInstitution.length > 0 && { institution_id: safeInstitution.join(",") }),
      ...(is_recurring !== null && { is_recurring: String(is_recurring) }),
      ...(startDate && { startDate: format(new Date(startDate), "yyyy-MM-dd") }),
      ...(endDate && { endDate: format(new Date(endDate), "yyyy-MM-dd") }),
    };

    const currentStr = JSON.stringify(params);
    if (prevParamsRef.current !== currentStr) {
      console.log("Event filter params →", params);
      prevParamsRef.current = currentStr;
    }

    return params;
  }, [
    category,
    event_type,
    area,
    province_id,
    city_id,
    institution_id,
    is_recurring,
    startDate,
    endDate,
  ]);

  const queryKey = [
    "events-final-v3",
    category || "all",
    stableKey(event_type),
    stableKey(area),
    stableKey(province_id),
    stableKey(city_id),
    stableKey(institution_id),
    is_recurring ?? "null",
    startDate || "none",
    endDate || "none",
    tokenRef.current.role,
    tokenRef.current.area,
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await axiosInstance
        .get("/event/filtered", { params: queryParams })
        .catch(() => ({ data: [] }));

      if (!response.data || !Array.isArray(response.data)) return [];

      return response.data.flatMap((event) => {
        if (!event?.event_id || !event.occurrences || !Array.isArray(event.occurrences)) return [];

        return event.occurrences.map((occ) => {
          if (!occ?.greg_occur_date || !occ.occurrence_id) return null;

          const startDate = new Date(occ.greg_occur_date);
          const endDate = occ.greg_end_date ? new Date(occ.greg_end_date) : null;
          if (isNaN(startDate.getTime())) return null;

          const isSameDay = endDate ? startDate.toDateString() === endDate.toDateString() : true;

          const startDay = startDate.toLocaleDateString("id-ID", { day: "numeric" });
          const endDay = endDate && !isNaN(endDate.getTime())
            ? endDate.toLocaleDateString("id-ID", { day: "numeric" }) : "TBD";
          const monthYear = startDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
          const endMonthYear = endDate && !isNaN(endDate.getTime())
            ? endDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "TBD";

          const dateRangeString = isSameDay
            ? `${startDay} ${monthYear}`
            : `${startDay} ${monthYear} - ${endDay} ${endMonthYear}`;

          const dateRange = [];
          if (endDate && !isSameDay && !isNaN(endDate.getTime())) {
            let current = new Date(startDate);
            while (current <= endDate) {
              dateRange.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
          } else {
            dateRange.push(startDate);
          }

          const startTime = startDate.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta",
          }) + " WIB";

          const endTime = endDate && !isNaN(endDate.getTime())
            ? endDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }) + " WIB"
            : "TBD";

          const time = !event.is_recurring
            ? startTime
            : `${startTime} - ${endTime !== "TBD" ? endTime : "00:00 WIB"}`;

          const location = event.is_in_fotang
            ? event.fotang?.location_name || "Lokasi Tidak Diketahui"
            : event.eventLocation?.location_name || "Lokasi Tidak Diketahui";

          const areaValue = event.is_in_fotang
            ? event.fotang?.area || "Korwil_1"
            : event.eventLocation?.area || "Korwil_1";

          return {
            id: event.event_id,
            occurrence_id: occ.occurrence_id,
            name: event.event_name || "Tanpa Nama",
            location,
            type: event.event_type === "Hari_Besar" ? "Hari Besar" : event.event_type || "AdHoc",
            area: areaValue,
            date: dateRangeString,
            dateRange,
            dateString: dateRangeString,
            time,
            startTime,
            endTime: endTime !== "TBD" ? endTime : "TBD",
            isSameDay,
            day: startDate.toLocaleDateString("id-ID", { weekday: "long" }),
            lunar_sui_ci_year: event.lunar_sui_ci_year || "",
            lunar_month: event.lunar_month || "",
            lunar_day: event.lunar_day || "",
            description: event.description || "",
            is_recurring: event.is_recurring || false,
            poster_s3_bucket_link: event.poster_s3_bucket_link || null,
            rawDate: occ.greg_occur_date,
            rawEndDate: occ.greg_end_date || null,
          };
        }).filter(Boolean);
      });
    },
    enabled: true,
    staleTime: 1000 * 60 * 3,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};