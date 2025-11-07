// useDashboardData.js — VERSI FINAL
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { AREA_OPTIONS } from "./dashboardConstants";

export const useDashboardData = (selectedArea) => {
    return useQuery({
        queryKey: ["dashboard-stats", selectedArea],
        queryFn: async () => {
            const [usersResponse, qiudaoResponse, fotangResponse, dcsResponse, spiritualResponse, eventsResponse] = await Promise.all([
                axiosInstance.get("/profile/user").catch(() => ({ data: [] })),
                axiosInstance.get("/profile/qiudao").catch(() => ({ data: [] })),
                axiosInstance.get("/fotang").catch(() => ({ data: [] })),
                axiosInstance.get("/dianchuanshi").catch(() => ({ data: [] })),
                axiosInstance.get("/spiritualuser").catch(() => ({ data: [] })),
                axiosInstance.get("/event").catch(() => ({ data: [] })),
            ]);

            const users = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.data || [];
            const qiudaoData = Array.isArray(qiudaoResponse.data) ? qiudaoResponse.data : qiudaoResponse.data.data || [];
            const fotangData = Array.isArray(fotangResponse.data) ? fotangResponse.data : fotangResponse.data.data || [];
            const dcsData = Array.isArray(dcsResponse.data) ? dcsResponse.data : dcsResponse.data.data || [];
            const spiritualUsers = Array.isArray(spiritualResponse.data) ? spiritualResponse.data : spiritualResponse.data.data || [];
            const events = Array.isArray(eventsResponse.data)
                ? eventsResponse.data.map((event) => ({
                    id: event.event_id,
                    name: event.event_name,
                    date: new Date(event.occurrences[0]?.greg_occur_date || Date.now()),
                }))
                : [];

            const filteredUsers = selectedArea !== "Nasional"
                ? users.filter((u) => u.qiudao?.qiu_dao_location?.area === selectedArea)
                : users;

            const totalQingkou = Math.round(
                (selectedArea === "Nasional" ? users : filteredUsers)
                    .filter((u) => u.is_qing_kou === true).length
            );

            const totalVihara = Math.round(selectedArea === "Nasional" ? fotangData.length : fotangData.filter((f) => f.area === selectedArea).length);
            const tzCount = Math.round(filteredUsers.filter((u) => u.spiritualUser?.spiritual_status === "TanZhu").length);
            const fyCount = Math.round(filteredUsers.filter((u) => u.spiritualUser?.spiritual_status === "FoYuan").length);
            
            const totalDCS = Math.round(selectedArea === "Nasional" ? dcsData.length : dcsData.filter((d) => d.area === selectedArea).length);
            const totalTZFY = Math.round(tzCount + fyCount);

            const totalFuWuYuan = Math.round(
                (selectedArea === "Nasional" ? dcsData : dcsData.filter((d) => d.area === selectedArea)).filter((d) => d.is_fuwuyuan === true).length +
                (selectedArea === "Nasional" ? spiritualUsers : spiritualUsers.filter((s) => s.area === selectedArea)).filter((s) => s.is_fuwuyuan === true).length
            );

            const qiudaoUmatByKorwil = selectedArea === "Nasional"
                ? qiudaoData.reduce((acc, q) => {
                    const korwil = q.qiu_dao_location?.area || "Unknown";
                    const existing = acc.find((item) => item.korwil === korwil);
                    if (existing) {
                        existing.umat += 1;
                    } else {
                        acc.push({ korwil, umat: 1 });
                    }
                    return acc;
                }, [])
                    .map((item) => ({ ...item, umat: Math.round(item.umat) }))
                    .sort((a, b) => {
                        const indexA = AREA_OPTIONS.findIndex((opt) => opt.value === a.korwil);
                        const indexB = AREA_OPTIONS.findIndex((opt) => opt.value === b.korwil);
                        return indexA - indexB;
                    })
                : [];

            const qiudaoUmatByProvince = selectedArea !== "Nasional"
                ? qiudaoData
                    .filter((q) => q.qiu_dao_location?.area === selectedArea)
                    .reduce((acc, q) => {
                        const fotangEntry = fotangData.find((f) => f.fotang_id === q.qiu_dao_location_id);
                        const province = fotangEntry?.locality?.district?.city?.province?.name || "Unknown";
                        const existing = acc.find((item) => item.province === province);
                        if (existing) {
                            existing.umat += 1;
                        } else {
                            acc.push({ province, umat: 1 });
                        }
                        return acc;
                    }, [])
                    .map((item) => ({ ...item, umat: Math.round(item.umat) }))
                    .sort((a, b) => a.province.localeCompare(b.province))
                : [];

            let totalActiveUsers = 0;
            let activeUsersByMonth = [];
            if (selectedArea === "Nasional") {
                totalActiveUsers = Math.round(users.length);
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                users.forEach((u) => {
                    if (u.created_at) {
                        const createdAt = new Date(u.created_at);
                        if (createdAt >= oneYearAgo) {
                            const monthYear = createdAt.toLocaleString("id-ID", { month: "long", year: "numeric" });
                            const monthKey = createdAt.toISOString().slice(0, 7);
                            const existing = activeUsersByMonth.find((item) => item.month === monthYear);
                            if (existing) {
                                existing.count += 1;
                            } else {
                                activeUsersByMonth.push({ month: monthYear, count: 1, key: monthKey });
                            }
                        }
                    }
                });
                activeUsersByMonth.sort((a, b) => new Date(a.key) - new Date(b.key));
                activeUsersByMonth = activeUsersByMonth.map((item) => ({ ...item, count: Math.round(item.count) }));
            }

            const userUmatByGender = filteredUsers.length > 0
                ? filteredUsers.reduce((acc, u) => {
                    const gender = u.gender === "Male" ? "Pria" : u.gender === "Female" ? "Wanita" : "Unknown";
                    const existing = acc.find((item) => item.gender === gender);
                    if (existing) {
                        existing.value += 1;
                    } else {
                        acc.push({ gender, value: 1 });
                    }
                    return acc;
                }, []).map((item) => ({ ...item, value: Math.round(item.value) }))
                : [{ gender: "Pria", value: 0 }, { gender: "Wanita", value: 0 }];

            return {
                totalVihara,
                totalDCS,
                totalTZFY,
                totalFuWuYuan,
                totalQingkou,
                qiudaoUmatByKorwil,
                qiudaoUmatByProvince,
                userUmatByGender,
                totalActiveUsers,
                activeUsersByMonth,
                events,
                lastUpdated: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
            };
        },
        keepPreviousData: true,
        refetchInterval: 60000,
        retry: 1,
    });
};