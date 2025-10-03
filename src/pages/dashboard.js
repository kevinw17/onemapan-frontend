import Layout from "@/components/layout";
import { Box, Heading, Text, Stat, StatLabel, StatNumber, SimpleGrid, VStack, Select, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Line } from "react-chartjs-2";
import { useDashboardData } from "@/features/dashboard/useDashboardData";
import { AREA_OPTIONS } from "@/features/dashboard/dashboardConstants";

Chart.register(ChartDataLabels);

const COLORS = ["#160ee7ff", "#e331c8ff"];

const StatCard = ({ label, value }) => (
  <Box bg="blue.100" borderRadius={16}>
    <Stat textAlign="center" py={2}>
      <StatLabel>{label}</StatLabel>
      <StatNumber>{Math.round(value || 0)}</StatNumber>
    </Stat>
  </Box>
);

const ChartCard = ({ title, children }) => (
  <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
    <Text fontWeight="bold" mb={4}>{title}</Text>
    {children}
  </Box>
);

const EventTileContent = ({ date, events }) => {
  const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const eventsOnDate = events
    .filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getFullYear() === formattedDate.getFullYear() &&
        eventDate.getMonth() === formattedDate.getMonth() &&
        eventDate.getDate() === formattedDate.getDate()
      );
    })
    .map((event) => event.name);

  return eventsOnDate.length > 0 ? (
    <Box mt={2} bg="blue.50" p={1} borderRadius="md">
      {eventsOnDate.map((eventName, index) => (
        <Text key={index} fontSize="xs" color="blue.600" px={1}>
          {eventName}
        </Text>
      ))}
    </Box>
  ) : null;
};

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [selectedArea, setSelectedArea] = useState("Nasional");
  const { data: stats, isLoading, error } = useDashboardData(selectedArea);

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
    labels: stats?.qiudaoUmatByKorwil?.map((item) => {
      const areaOption = AREA_OPTIONS.find((opt) => opt.value === item.korwil);
      return areaOption ? areaOption.label : item.korwil;
    }) || [],
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
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { callback: (value) => Math.round(value), stepSize: 1 }, grid: { display: false } },
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
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { callback: (value) => Math.round(value), stepSize: 1 }, grid: { display: false } },
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
      x: { title: { display: true, text: "Bulan" } },
      y: { beginAtZero: true, title: { display: true, text: "Jumlah Umat Aktif" }, ticks: { callback: (value) => Math.round(value), stepSize: 1 } },
    },
  };

  if (isLoading) return <VStack h="100vh" justify="center"><Text>Loading...</Text></VStack>;
  if (error) return <VStack h="100vh" justify="center"><Text>Error loading data: {error.message}</Text></VStack>;

  return (
    <Layout title="Dashboard" showCalendar={true} tileContent={(props) => <EventTileContent {...props} events={stats?.events || []} />}>
      <VStack spacing={6} align="stretch" p={2}>
        <Flex align="center" justify="space-between" mb={4}>
          <Box>
            <Heading size="lg" mb={2}>Halo, {username}</Heading>
            <Text fontSize="md">Dapatkan gambaran lengkap komunitas dalam sekejap.</Text>
          </Box>
          <Select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} width="200px">
            {AREA_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 3, lg: 3 }} spacing={6}>
          <StatCard label="Total Vihara" value={stats?.totalVihara} />
          <StatCard label="Total FY,TZ,DCS" value={stats?.totalFYTZDCS} />
          <StatCard label="Total Biarawan/Biarawati" value={stats?.totalMonksNuns} />
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: selectedArea === "Nasional" ? 2 : 2 }} spacing={6}>
          {selectedArea === "Nasional" && stats?.qiudaoUmatByKorwil?.length > 0 && (
            <ChartCard title="Total Umat per Wilayah">
              <Box width="100%" height="300px">
                <Bar data={barData} options={barOptions} />
              </Box>
            </ChartCard>
          )}
          {selectedArea === "Nasional" ? (
            <ChartCard title="Umat Aktif">
              <Stat textAlign="center" mb={4}>
                <StatNumber>{Math.round(stats?.totalActiveUsers || 0)}</StatNumber>
              </Stat>
              <Box width="100%" height="250px">
                <Line data={lineData} options={lineOptions} />
              </Box>
            </ChartCard>
          ) : (
            <>
              <ChartCard title={`Total Umat per Provinsi Wilayah ${selectedArea.replace("Korwil_", "")}`}>
                {stats?.qiudaoUmatByProvince?.length > 0 ? (
                  <Box width="100%" height="300px">
                    <Bar data={provinceBarData} options={provinceBarOptions} />
                  </Box>
                ) : (
                  <Text>Tidak ada data umat per provinsi untuk wilayah ini</Text>
                )}
              </ChartCard>
              <ChartCard title={`Total Umat Aktif Wilayah ${selectedArea.replace("Korwil_", "")}`}>
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
              </ChartCard>
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