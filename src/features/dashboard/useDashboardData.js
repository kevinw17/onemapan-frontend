// useDashboardData.js — SEMUA CHART DARI `users`
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { AREA_OPTIONS } from "./dashboardConstants";

export const useDashboardData = ({
  selectedArea,
  drillDownLevel,
  drillDownKorwil,
  drillDownProvince,
}) => {
  return useQuery({
    queryKey: [
      "dashboard-stats",
      selectedArea,
      drillDownLevel,
      drillDownKorwil,
      drillDownProvince,
    ],
    queryFn: async () => {
      const [
        usersRes,
        fotangRes,
        dcsRes,
        spiritualRes,
        eventsRes,
      ] = await Promise.all([
        axiosInstance.get("/profile/user").catch(() => ({ data: [] })),
        axiosInstance.get("/fotang").catch(() => ({ data: [] })),
        axiosInstance.get("/dianchuanshi").catch(() => ({ data: [] })),
        axiosInstance.get("/spiritualuser").catch(() => ({ data: [] })),
        axiosInstance.get("/event").catch(() => ({ data: [] })),
      ]);

      const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || [];
      const fotangData = Array.isArray(fotangRes.data) ? fotangRes.data : fotangRes.data.data || [];
      const dcsData = Array.isArray(dcsRes.data) ? dcsRes.data : dcsRes.data.data || [];
      const spiritualUsers = Array.isArray(spiritualRes.data) ? spiritualRes.data : spiritualRes.data.data || [];

      const events = (eventsRes.data || []).map(e => ({
        ...e, // INI YANG PALING PENTING! JANGAN BUANG FIELD ASLI
        ...e.occurrences?.[0], // kalau perlu ambil dari occurrence
        name: e.event_name,
        date: new Date(e.occurrences?.[0]?.greg_occur_date || e.date || Date.now()),
        fotang_id_exists: !!e.fotang_id || !!e.occurrences?.[0]?.fotang_id,
        // optional: tambah ini biar lebih jelas
        event_type: e.event_type || e.occurrences?.[0]?.event_type,
      }));

      // === FILTER USERS BERDASARKAN selectedArea (korwil) ===
      let filteredUsers = selectedArea !== "Nasional"
        ? users.filter(u => u.qiudao?.qiu_dao_location?.area === selectedArea)
        : users;

      // === DRILL-DOWN: Filter tambahan untuk provinsi/kota ===
      if (drillDownLevel === "province" && drillDownKorwil) {
        filteredUsers = users.filter(u => u.qiudao?.qiu_dao_location?.area === drillDownKorwil);
      }

      if (drillDownLevel === "city" && drillDownProvince) {
        filteredUsers = users.filter(u => {
          const fotang = fotangData.find(f => f.fotang_id === u.qiudao?.qiu_dao_location_id);
          return fotang?.locality?.district?.city?.province?.name === drillDownProvince;
        });
      }

      // === STAT CARD (dari filteredUsers) ===
      const totalQingkou = Math.round(filteredUsers.filter(u => u.is_qing_kou).length);
      const totalVihara = Math.round(
        selectedArea === "Nasional"
          ? fotangData.length
          : fotangData.filter(f => f.area === selectedArea).length
      );
      const tzCount = Math.round(filteredUsers.filter(u => u.spiritualUser?.spiritual_status === "TanZhu").length);
      const fyCount = Math.round(filteredUsers.filter(u => u.spiritualUser?.spiritual_status === "FoYuan").length);
      const totalTZFY = tzCount + fyCount;
      const totalDCS = Math.round(
        selectedArea === "Nasional"
          ? dcsData.length
          : dcsData.filter(d => d.area === selectedArea).length
      );
      const totalFuWuYuan = Math.round(
        (selectedArea === "Nasional" ? dcsData : dcsData.filter(d => d.area === selectedArea))
          .filter(d => d.is_fuwuyuan).length +
        (selectedArea === "Nasional" ? spiritualUsers : spiritualUsers.filter(s => s.area === selectedArea))
          .filter(s => s.is_fuwuyuan).length
      );

      // === BAR CHART: UMAT PER KORWIL (dari users) ===
      const userUmatByKorwil = selectedArea === "Nasional"
        ? users.reduce((acc, u) => {
            const korwil = u.qiudao?.qiu_dao_location?.area || "Unknown";
            const item = acc.find(i => i.korwil === korwil);
            item ? item.umat++ : acc.push({ korwil, umat: 1 });
            return acc;
          }, [])
          .sort((a, b) => {
            const ia = AREA_OPTIONS.findIndex(o => o.value === a.korwil);
            const ib = AREA_OPTIONS.findIndex(o => o.value === b.korwil);
            return ia - ib;
          })
        : [];

      // === BAR CHART: UMAT PER PROVINSI (dari users) ===
      const userUmatByProvince =
        (drillDownLevel === "province" && drillDownKorwil) || selectedArea !== "Nasional"
          ? users
              .filter(u => u.qiudao?.qiu_dao_location?.area === (drillDownKorwil || selectedArea))
              .reduce((acc, u) => {
                const fotang = fotangData.find(f => f.fotang_id === u.qiudao?.qiu_dao_location_id);
                const prov = fotang?.locality?.district?.city?.province?.name || "Unknown";
                const item = acc.find(i => i.province === prov);
                item ? item.umat++ : acc.push({ province: prov, umat: 1 });
                return acc;
              }, [])
              .sort((a, b) => a.province.localeCompare(b.province))
          : [];

      // === BAR CHART: UMAT PER KOTA (dari users) ===
      const userUmatByCity =
        drillDownLevel === "city" && drillDownProvince
          ? users
              .filter(u => {
                const fotang = fotangData.find(f => f.fotang_id === u.qiudao?.qiu_dao_location_id);
                return fotang?.locality?.district?.city?.province?.name === drillDownProvince;
              })
              .reduce((acc, u) => {
                const fotang = fotangData.find(f => f.fotang_id === u.qiudao?.qiu_dao_location_id);
                const city = fotang?.locality?.district?.city?.name || "Unknown";
                const item = acc.find(i => i.city === city);
                item ? item.umat++ : acc.push({ city, umat: 1 });
                return acc;
              }, [])
              .sort((a, b) => a.city.localeCompare(b.city))
          : [];

      // === PIE CHART: GENDER (dari filteredUsers) ===
      const userUmatByGender = filteredUsers.reduce((acc, u) => {
        const gender = u.gender === "Male" ? "Pria" : u.gender === "Female" ? "Wanita" : "Unknown";
        const item = acc.find(i => i.gender === gender);
        item ? item.value++ : acc.push({ gender, value: 1 });
        return acc;
      }, []);

      return {
        totalVihara,
        totalDCS,
        totalTZFY,
        totalFuWuYuan,
        totalQingkou,
        // === BAR CHART (dari users) ===
        qiudaoUmatByKorwil: userUmatByKorwil,        // ganti nama tetap sama
        qiudaoUmatByProvince: userUmatByProvince,
        qiudaoUmatByCity: userUmatByCity,
        // === PIE CHART (dari users) ===
        userUmatByGender,
        events,
      };
    },
    keepPreviousData: true,
    refetchInterval: 60000,
  });
};