import Layout from "@/components/layout";
import { Box, Heading, Text, Stat, StatLabel, StatNumber, SimpleGrid, VStack, Select, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Line } from "react-chartjs-2";

Chart.register(ChartDataLabels);

const AREA_OPTIONS = [
  { value: "Nasional", label: "Nasional" },
  { value: "Korwil_1", label: "Wilayah 1" },
  { value: "Korwil_2", label: "Wilayah 2" },
  { value: "Korwil_3", label: "Wilayah 3" },
  { value: "Korwil_4", label: "Wilayah 4" },
  { value: "Korwil_5", label: "Wilayah 5" },
  { value: "Korwil_6", label: "Wilayah 6" },
];

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [selectedArea, setSelectedArea] = useState("Nasional");
  const [events, setEvents] = useState([]);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats", selectedArea],
    queryFn: async () => {
      let users = [], qiudaoData = [], fotangData = [], dcsData = [], spiritualUsers = [];

      try {
        const [usersResponse, qiudaoResponse, fotangResponse, dcsResponse, spiritualResponse, eventsResponse] = await Promise.all([
          axiosInstance.get("/profile/user").catch(() => ({ data: [] })),
          axiosInstance.get("/profile/qiudao").catch(() => ({ data: [] })),
          axiosInstance.get("/fotang").catch(() => ({ data: [] })),
          axiosInstance.get("/dianchuanshi").catch(() => ({ data: [] })),
          axiosInstance.get("/spiritualuser").catch(() => ({ data: [] })),
          axiosInstance.get("/event").catch(() => ({ data: [] })),
        ]);

        users = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.data || [];
        qiudaoData = Array.isArray(qiudaoResponse.data) ? qiudaoResponse.data : qiudaoResponse.data.data || [];
        fotangData = Array.isArray(fotangResponse.data) ? fotangResponse.data : fotangResponse.data.data || [];
        dcsData = Array.isArray(dcsResponse.data) ? dcsResponse.data : dcsResponse.data.data || [];
        spiritualUsers = Array.isArray(spiritualResponse.data) ? spiritualResponse.data : spiritualResponse.data.data || [];
        setEvents(
          Array.isArray(eventsResponse.data)
            ? eventsResponse.data.map((event) => ({
                id: event.event_id,
                name: event.event_name,
                date: new Date(event.occurrences[0]?.greg_occur_date || Date.now()),
              }))
            : []
        );

        console.log("Users:", users);
        console.log("Dianchuanshi:", dcsData);
        console.log("SpiritualUsers:", spiritualUsers);
        console.log("Selected Area:", selectedArea);
        console.log("Fotang Data:", fotangData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }

      let filteredUsers = users;
      if (selectedArea !== "Nasional") {
        filteredUsers = users.filter((u) => u.qiudao?.qiu_dao_location?.area === selectedArea);
      }
      console.log("Filtered Users:", filteredUsers);

      const totalVihara = Math.round(selectedArea === "Nasional" ? fotangData.length : fotangData.filter((f) => f.area === selectedArea).length);
      const fyCount = Math.round(filteredUsers.filter((u) => u.spiritualUser?.spiritual_status === "FoYuan").length);
      const tzCount = Math.round(filteredUsers.filter((u) => u.spiritualUser?.spiritual_status === "TanZhu").length);
      const totalDCS = Math.round(selectedArea === "Nasional" ? dcsData.length : dcsData.filter((d) => d.area === selectedArea).length);
      const totalFYTZDCS = Math.round(fyCount + tzCount + totalDCS);

      const totalMonksNuns = Math.round(
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
      .filter((q) => {
        const matchesArea = q.qiu_dao_location?.area === selectedArea;
        if (!matchesArea) {
          console.log(`Qiudao skipped (area mismatch):`, {
            qiudao_id: q.qiu_dao_id,
            area: q.qiu_dao_location?.area,
            selectedArea,
          });
        }
        return matchesArea;
      })
      .reduce((acc, q) => {
        const fotangEntry = fotangData.find((f) => f.fotang_id === q.qiu_dao_location_id);
        if (!fotangEntry) {
          console.log("No fotang found for fotang_id:", {
            fotang_id: q.qiu_dao_location_id,
            qiudao_id: q.qiu_dao_id,
          });
          // Tambah ke Unknown untuk debug
          const existing = acc.find((item) => item.province === "Unknown");
          if (existing) {
            existing.umat += 1;
          } else {
            acc.push({ province: "Unknown", umat: 1 });
          }
          return acc;
        }
        console.log("Fotang Entry structure:", fotangEntry);
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
      // Kembalikan filter setelah data diperbaiki
      // .filter((item) => item.province !== "Unknown")
  : [];

console.log("Qiudao Umat By Province (final):", qiudaoUmatByProvince);
if (qiudaoUmatByProvince.length === 0 && selectedArea !== "Nasional") {
  console.warn(`No data for qiudaoUmatByProvince in ${selectedArea}. Check qiudaoData or fotangData.`);
}

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
        console.log("Active Users By Month:", activeUsersByMonth);
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
        totalFYTZDCS,
        totalMonksNuns,
        qiudaoUmatByKorwil,
        qiudaoUmatByProvince,
        userUmatByGender,
        totalActiveUsers,
        activeUsersByMonth,
        lastUpdated: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      };
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUsername(JSON.parse(userStr).username);
      } catch (e) {
        console.error("Gagal parsing user:", e);
      }
    }
  }, []);

  const barData = {
    labels: stats?.qiudaoUmatByKorwil?.map((item) => AREA_OPTIONS.find((opt) => opt.value === item.korwil)?.label || item.korwil) || [],
    datasets: [
      {
        data: stats?.qiudaoUmatByKorwil?.map((item) => Math.round(item.umat) || 0) || [],
        backgroundColor: "#216ceeff",
        borderColor: "#216ceeff",
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: {
        display: true,
        color: "#fff",
        anchor: "end",
        align: "top",
        offset: -25,
        font: { size: 14, weight: "bold" },
        formatter: (value) => Math.round(value) || 0,
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => Math.round(value), stepSize: 1 },
        grid: { display: false },
      },
    },
    animation: false,
  };

  const provinceBarData = {
    labels: stats?.qiudaoUmatByProvince?.map((item) => item.province) || [],
    datasets: [
      {
        data: stats?.qiudaoUmatByProvince?.map((item) => Math.round(item.umat) || 0) || [],
        backgroundColor: "#216ceeff",
        borderColor: "#216ceeff",
        borderWidth: 1,
      },
    ],
  };

  const provinceBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: {
        display: true,
        color: "#fff",
        anchor: "end",
        align: "top",
        offset: -25,
        font: { size: 14, weight: "bold" },
        formatter: (value) => Math.round(value) || 0,
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => Math.round(value), stepSize: 1 },
        grid: { display: false },
      },
    },
    animation: false,
  };

  const lineData = {
    labels: Array.isArray(stats?.activeUsersByMonth) ? stats.activeUsersByMonth.map((item) => item.month) : [],
    datasets: [
      {
        label: "Umat Aktif",
        data: Array.isArray(stats?.activeUsersByMonth) ? stats.activeUsersByMonth.map((item) => item.count) : [],
        fill: false,
        borderColor: "#216ceeff",
        tension: 0.1,
      },
    ],
  };

  const lineOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true, callbacks: { label: (tooltipItem) => Math.round(tooltipItem.raw) } },
    },
    scales: {
      x: {
        title: { display: true, text: "Bulan" },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Jumlah Umat Aktif" },
        ticks: { callback: (value) => Math.round(value), stepSize: 1 },
      },
    },
  };

  if (isLoading) return <VStack h="100vh" justify="center"><Text>Loading...</Text></VStack>;
  if (error) return <VStack h="100vh" justify="center"><Text>Error loading data: {error.message}</Text></VStack>;

  const COLORS = ["#160ee7ff", "#e331c8ff"];

  const getEventsForDate = (date) => {
    const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getFullYear() === formattedDate.getFullYear() &&
          eventDate.getMonth() === formattedDate.getMonth() &&
          eventDate.getDate() === formattedDate.getDate()
        );
      })
      .map((event) => event.name);
  };

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const eventsOnDate = getEventsForDate(date);
      return eventsOnDate.length > 0 ? (
        <Box mt={2} bg="blue.50" p={1} borderRadius="md">
          {eventsOnDate.map((eventName, index) => (
            <Text key={index} fontSize="xs" color="blue.600" px={1}>
              {eventName}
            </Text>
          ))}
        </Box>
      ) : null;
    }
    return null;
  };

  return (
    <Layout title="Dashboard" showCalendar={true}>
      <VStack spacing={6} align="stretch" p={2}>
        <Flex align="center" justify="space-between" mb={4}>
          <Box>
            <Heading size="lg" mb={2}>
              Halo, {username}
            </Heading>
            <Text fontSize="md">Dapatkan gambaran lengkap komunitas dalam sekejap.</Text>
          </Box>
          <Select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} width="200px">
            {AREA_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 3, lg: 3 }} spacing={6}>
          <Box bg="blue.100" borderRadius={16}>
            <Stat textAlign="center" py={2}>
              <StatLabel>Total Vihara</StatLabel>
              <StatNumber>{Math.round(stats?.totalVihara || 0)}</StatNumber>
            </Stat>
          </Box>
          <Box bg="gray.100" borderRadius={16}>
            <Stat textAlign="center" py={2}>
              <StatLabel>Total FY,TZ,DCS</StatLabel>
              <StatNumber>{Math.round(stats?.totalFYTZDCS || 0)}</StatNumber>
            </Stat>
          </Box>
          <Box bg="green.100" borderRadius={16}>
            <Stat textAlign="center" py={2}>
              <StatLabel>Total Biarawan/Biarawati</StatLabel>
              <StatNumber>{Math.round(stats?.totalMonksNuns || 0)}</StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: selectedArea === "Nasional" ? 2 : 2 }} spacing={6}>
          {selectedArea === "Nasional" && stats?.qiudaoUmatByKorwil?.length > 0 && (
            <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
              <Text fontWeight="bold" mb={4}>
                Total Umat per Wilayah
              </Text>
              <Box width="100%" height="300px">
                <Bar data={barData} options={barOptions} />
              </Box>
            </Box>
          )}
          {selectedArea === "Nasional" ? (
            <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
              <Text fontWeight="bold" mb={4}>
                Umat Aktif
              </Text>
              <Stat textAlign="center" mb={4}>
                <StatNumber>{Math.round(stats?.totalActiveUsers || 0)}</StatNumber>
              </Stat>
              <Box width="100%" height="250px">
                <Line data={lineData} options={lineOptions} />
              </Box>
            </Box>
          ) : (
            <>
              <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
                <Text fontWeight="bold" mb={4}>
                  Total Umat per Provinsi {`Wilayah ${selectedArea.replace("Korwil_", "")}`}
                </Text>
                {stats?.qiudaoUmatByProvince?.length > 0 ? (
                  <Box width="100%" height="300px">
                    <Bar data={provinceBarData} options={provinceBarOptions} />
                  </Box>
                ) : (
                  <Text>Tidak ada data umat per provinsi untuk wilayah ini</Text>
                )}
              </Box>
              <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
                <Text fontWeight="bold" mb={4}>
                  Total Umat {`Wilayah ${selectedArea.replace("Korwil_", "")}`}
                </Text>
                {stats?.userUmatByGender?.some((entry) => entry.value > 0) ? (
                  <PieChart width={300} height={300}>
                    <Pie
                      data={stats.userUmatByGender}
                      dataKey="value"
                      nameKey="gender"
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ value }) => Math.round(value)}
                    >
                      {stats.userUmatByGender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => Math.round(value)} />
                    <Legend />
                  </PieChart>
                ) : (
                  <Text>Tidak ada data umat untuk wilayah ini</Text>
                )}
              </Box>
            </>
          )}
        </SimpleGrid>

        <Box>
          <Text fontSize="sm" color="gray.500">
            Update terakhir: {stats?.lastUpdated || "N/A"}
          </Text>
        </Box>
      </VStack>
    </Layout>
  );
}