import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

export const useFetchEvents = ({
  event_type = [],
  area = [],
  is_recurring = [],
  startDate,
  endDate,
}) => {
  const [tokenData, setTokenData] = useState({ tokenRole: null, tokenArea: null });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setTokenData({
            tokenRole: decoded.role || null,
            tokenArea: decoded.area || null,
          });
        } catch (error) {
          setTokenData({ tokenRole: null, tokenArea: null });
        }
      }
    }
  }, []);

  const queryParams = useMemo(() => {
    const params = {
      event_type: event_type.length ? event_type.join(",") : undefined,
      area: area.length ? (area.includes("nasional") ? "null" : area.join(",")) : undefined,
      is_recurring: is_recurring.length ? is_recurring.map(String).join(",") : undefined,
      startDate: startDate ? format(new Date(startDate), "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(new Date(endDate), "yyyy-MM-dd") : undefined,
    };
    return params;
  }, [event_type, area, is_recurring, startDate, endDate]);

  return useQuery({
    queryKey: ["fetch.events", event_type, area, is_recurring, startDate, endDate, tokenData.tokenRole, tokenData.tokenArea],
    queryFn: async () => {
      const response = await axiosInstance.get("/event/filtered", {
        params: queryParams,
      }).catch((error) => {
        return { data: [] };
      });

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      const flattenedEvents = response.data.flatMap((event) => {
        if (!event || !event.event_id || !event.occurrences || !Array.isArray(event.occurrences)) {
          return [];
        }

        return event.occurrences.map((occ) => {
          if (!occ || !occ.greg_occur_date || !occ.occurrence_id) {
            return null;
          }

          const startDate = new Date(occ.greg_occur_date);
          const endDate = occ.greg_end_date ? new Date(occ.greg_end_date) : null;

          if (isNaN(startDate.getTime())) {
            return null;
          }

          const isSameDay = endDate
            ? startDate.getFullYear() === endDate.getFullYear() &&
              startDate.getMonth() === endDate.getMonth() &&
              startDate.getDate() === endDate.getDate()
            : true;

          const isSameMonthYear = endDate
            ? startDate.getFullYear() === endDate.getFullYear() &&
              startDate.getMonth() === endDate.getMonth()
            : false;

          const startDay = startDate.toLocaleDateString("id-ID", { day: "numeric" });
          const endDay = endDate && !isNaN(endDate.getTime())
            ? endDate.toLocaleDateString("id-ID", { day: "numeric" })
            : "TBD";
          const monthYear = startDate.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          });
          const endMonthYear = endDate && !isNaN(endDate.getTime())
            ? endDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
            : "TBD";
          const dateRangeString = isSameDay
            ? `${startDay} ${monthYear}`
            : isSameMonthYear
            ? `${startDay} - ${endDay} ${monthYear}`
            : `${startDay} ${monthYear} - ${endDay} ${endMonthYear}`;

          const dateRange = [];
          if (endDate && !isSameDay && !isNaN(endDate.getTime())) {
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
              dateRange.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + 1);
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
            ? endDate.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Jakarta",
              }) + " WIB"
            : "TBD";

          let time = "";
          if (
            isSameDay ||
            (dateRange.length > 0 && dateRange[0].toDateString() === startDate.toDateString())
          ) {
            if (!event.is_recurring) {
              time = startTime;
            } else {
              time = `${startTime} - ${endTime !== "TBD" ? endTime : "00:00 WIB"}`;
            }
          }

          const eventData = {
            id: event.event_id,
            occurrence_id: occ.occurrence_id,
            date: dateRangeString,
            dateRange,
            dateString: dateRangeString,
            time,
            startTime,
            endTime: endTime !== "TBD" ? endTime : "TBD",
            isSameDay,
            name: event.event_name || "Unnamed Event",
            location:
              typeof event.location === "object" && event.location?.location_name
                ? event.location.location_name
                : event.location || "All Vihara",
            type: event.event_type === "Hari_Besar" ? "Hari Besar" : event.event_type || "AdHoc",
            day: startDate.toLocaleDateString("id-ID", { weekday: "long" }) || "Hari",
            lunar_sui_ci_year: event.lunar_sui_ci_year || "Tahun Lunar",
            lunar_month: event.lunar_month || "Bulan Lunar",
            lunar_day: event.lunar_day || "Hari Lunar",
            description: event.description || "Deskripsi belum tersedia",
            is_recurring: event.is_recurring || false,
            poster_s3_bucket_link: event.poster_s3_bucket_link || null,
            jangkauan: event.area === null ? "nasional" : event.area || "",
            rawDate: occ.greg_occur_date,
            rawEndDate: occ.greg_end_date || null,
          };

          const requiredProps = ["id", "occurrence_id", "date", "name"];
          const missingProps = requiredProps.filter((prop) => !eventData[prop]);
          if (missingProps.length > 0) {
            return null;
          }

          return eventData;
        }).filter((event) => event !== null);
      });

      if (flattenedEvents.length === 0) {
        console.warn("No valid events.");
      }

      return flattenedEvents;
    },
    enabled: true,
    keepPreviousData: false,
    staleTime: 0,
    cacheTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};