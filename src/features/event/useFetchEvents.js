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
                        console.warn(`Invalid start date for event ${event.event_id}, occurrence ${occ.occurrence_id}: ${occ.greg_occur_date}`);
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
                    if (isSameDay || (dateRange.length > 0 && dateRange[0].toDateString() === startDate.toDateString())) {
                        if (!event.is_recurring) {
                            time = startTime; // Hanya startTime untuk event non-berulang di hari pertama
                        } else {
                            time = `${startTime} - ${endTime !== "TBD" ? endTime : "00:00 WIB"}`; // Start dan end time untuk event berulang di hari pertama
                        }
                    }

                    return {
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
                        location: typeof event.location === 'object' && event.location?.location_name
                            ? event.location.location_name
                            : event.location || "All Vihara",
                        type: event.event_type === "Hari_Besar" ? "Hari Besar" : event.event_type || "Ad-hoc",
                        day: startDate.toLocaleDateString("id-ID", { weekday: "long" }) || "Hari",
                        lunar_sui_ci_year: event.lunar_sui_ci_year || "Tahun Lunar",
                        lunar_month: event.lunar_month || "Bulan Lunar",
                        lunar_day: event.lunar_day || "Hari Lunar",
                        description: event.description || "Deskripsi belum tersedia",
                        is_recurring: event.is_recurring || false,
                        poster_s3_bucket_link: event.poster_s3_bucket_link || null,
                        rawDate: startDate,
                        rawEndDate: endDate,
                        occurrences: event.occurrences,
                    };
                }).filter(event => event !== null);
            });

            return flattenedEvents;
        },
        keepPreviousData: true,
    });
};