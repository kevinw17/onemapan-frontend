import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useFetchEvents = ({ 
    event_type = [], 
    provinceId = []
}) => {
    return useQuery({
        queryKey: ["fetch.events", event_type, provinceId],
        queryFn: async () => {
            const response = await axiosInstance.get("/event/filtered", {
                params: {
                    event_type: event_type.length ? event_type.join(",") : undefined,
                    provinceId: provinceId.length ? provinceId.join(",") : undefined,
                },
            }).catch(() => ({ data: [] }));

            if (!response.data || !Array.isArray(response.data)) {
                return [];
            }

            const flattenedEvents = response.data.flatMap((event) => {
                if (!event.occurrences || !Array.isArray(event.occurrences)) {
                    return [];
                }

                return event.occurrences.map((occ) => {
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
                    const monthYear = startDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
                    const endMonthYear = endDate && !isNaN(endDate.getTime())
                        ? endDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
                        : "TBD";
                    const dateRange = isSameDay
                        ? `${startDay} ${monthYear}`
                        : isSameMonthYear
                        ? `${startDay} - ${endDay} ${monthYear}`
                        : `${startDay} ${monthYear} - ${endDay} ${endMonthYear}`;

                    const startDayName = startDate.toLocaleDateString("id-ID", { weekday: "long" }).split(",")[0];
                    const endDayName = endDate && !isNaN(endDate.getTime())
                        ? endDate.toLocaleDateString("id-ID", { weekday: "long" }).split(",")[0]
                        : "TBD";
                    const dayRange = isSameDay ? startDayName : `${startDayName} - ${endDayName}`;

                    const startTime = startDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    }) + " WIB";
                    const endTime = endDate && !isNaN(endDate.getTime())
                        ? endDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        }) + " WIB"
                        : "TBD";
                    const timeDisplay = isSameDay ? `${startTime} - ${endTime}` : startTime;

                    return {
                        id: event.event_id,
                        occurrence_id: occ.occurrence_id,
                        date: dateRange,
                        day: dayRange,
                        time: timeDisplay,
                        isSameDay,
                        name: event.event_name || "Unnamed Event",
                        location: typeof event.location === 'object' && event.location?.location_name
                            ? event.location.location_name
                            : event.location || "Unknown Location",
                        localityId: event.location?.localityId || "",
                        provinceId: event.location?.locality?.district?.city?.provinceId || "",
                        cityId: event.location?.locality?.district?.city?.id || "",
                        districtId: event.location?.locality?.district?.id || "",
                        type: event.event_type === "Hari_Besar" ? "Hari Besar" : event.event_type || "Regular",
                        description: event.description || "No description available",
                        lunar_sui_ci_year: event.lunar_sui_ci_year || "",
                        lunar_month: event.lunar_month || "",
                        lunar_day: event.lunar_day || "",
                        is_recurring: event.is_recurring || false,
                        poster_s3_bucket_link: event.poster_s3_bucket_link || null,
                        rawDate: startDate,
                        rawEndDate: endDate,
                        occurrences: event.occurrences.map((o) => ({
                            occurrence_id: o.occurrence_id,
                            greg_occur_date: new Date(o.greg_occur_date),
                            greg_end_date: o.greg_end_date ? new Date(o.greg_end_date) : null,
                        })),
                    };
                }).filter(event => event !== null);
            });

            return flattenedEvents;
        },
        keepPreviousData: true,
    });
};