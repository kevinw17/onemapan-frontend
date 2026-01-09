import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export const useDashboardData = ({ selectedArea, drillDownLevel, drillDownKorwil, drillDownProvince }) => {
  return useQuery({
    queryKey: ["dashboard-stats", selectedArea, drillDownLevel, drillDownKorwil, drillDownProvince],
    queryFn: async () => {
      const statsResponse = await axiosInstance.get("/dashboard/stats");
      const data = statsResponse.data;

      const eventsResponse = await axiosInstance.get("/event").catch(() => ({ data: [] }));
      const rawEvents = eventsResponse.data || [];

      const events = rawEvents.map(e => ({
        ...e,
        ...e.occurrences?.[0],
        name: e.event_name,
        date: new Date(e.occurrences?.[0]?.greg_occur_date || e.date || Date.now()),
        fotang_id_exists: !!e.fotang_id || !!e.occurrences?.[0]?.fotang_id,
        event_type: e.event_type || e.occurrences?.[0]?.event_type,
      }));

      const isNasional = selectedArea === "Nasional";

      let filteredUsers = isNasional
        ? data.users
        : data.users.filter(u => u.qiudao?.qiu_dao_location?.area === selectedArea);

      if (drillDownLevel === "province" && drillDownKorwil) {
        filteredUsers = filteredUsers.filter(u => u.qiudao?.qiu_dao_location?.area === drillDownKorwil);
      }

      if (drillDownLevel === "city" && drillDownProvince) {
        filteredUsers = filteredUsers.filter(u => 
          u.qiudao?.qiu_dao_location?.locality?.district?.city?.province?.name === drillDownProvince
        );
      }

      const totalUmat = filteredUsers.length;
      const totalQingkou = filteredUsers.filter(u => u.is_qing_kou).length;

      const totalVihara = isNasional
        ? data.totalViharaNasional
        : data.viharaByKorwil[selectedArea] || 0;

      const totalDCS = isNasional
        ? data.totalDCSNasional
        : data.dcsByKorwil[selectedArea] || 0;

      const totalTZFY = filteredUsers.filter(u =>
        u.spiritualUser?.spiritual_status === "TanZhu" ||
        u.spiritualUser?.spiritual_status === "FoYuan"
      ).length;

      const totalFuWuYuan = filteredUsers.filter(u => u.spiritualUser?.is_fuwuyuan).length;

      const genderCount = filteredUsers.reduce((acc, u) => {
        if (u.gender === "Male") acc.Pria++;
        if (u.gender === "Female") acc.Wanita++;
        return acc;
      }, { Pria: 0, Wanita: 0 });

      const userUmatByGender = [
        { gender: "Pria", value: genderCount.Pria },
        { gender: "Wanita", value: genderCount.Wanita },
      ];

      const qiudaoUmatByKorwil = isNasional ? data.qiudaoUmatByKorwil : [];

      const provinceMap = filteredUsers.reduce((acc, u) => {
        const province = u.qiudao?.qiu_dao_location?.locality?.district?.city?.province?.name || "Unknown";
        acc[province] = (acc[province] || 0) + 1;
        return acc;
      }, {});

      const qiudaoUmatByProvince = Object.entries(provinceMap)
        .map(([province, umat]) => ({ province, umat }))
        .sort((a, b) => a.province.localeCompare(b.province));

      let usersForCity = filteredUsers;
      if (drillDownLevel === "city" && drillDownProvince) {
        usersForCity = filteredUsers.filter(u => 
          u.qiudao?.qiu_dao_location?.locality?.district?.city?.province?.name === drillDownProvince
        );
      }

      const cityMap = usersForCity.reduce((acc, u) => {
        const city = u.qiudao?.qiu_dao_location?.locality?.district?.city?.name || "Unknown";
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {});

      const qiudaoUmatByCity = Object.entries(cityMap)
        .map(([city, umat]) => ({ city, umat }))
        .sort((a, b) => a.city.localeCompare(b.city));

      return {
        totalUmat,
        totalQingkou,
        totalVihara,
        totalDCS,
        totalTZFY,
        totalFuWuYuan,
        userUmatByGender,
        qiudaoUmatByKorwil,
        qiudaoUmatByProvince,
        qiudaoUmatByCity,
        events,
      };
    },
    keepPreviousData: true,
    refetchInterval: 60000,
  });
};