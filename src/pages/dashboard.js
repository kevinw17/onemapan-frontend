import Layout from "@/components/layout";
import {
  Box,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  VStack,
  Select,
  Flex,
} from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react"; // TAMBAH useRef
import { Bar } from "react-chartjs-2";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useDashboardData } from "@/features/dashboard/useDashboardData";
import { AREA_OPTIONS } from "@/features/dashboard/dashboardConstants";
import { jwtDecode } from "jwt-decode";
import { useFetchUserProfile } from "@/features/user/useFetchUserProfile";
import { useRouter } from "next/router";
import { useToast } from "@chakra-ui/react";

Chart.register(ChartDataLabels);

const COLORS = ["#160ee7ff", "#e331c8ff"];

const StatCard = ({ label, value }) => (
  <Box bg="blue.100" borderRadius={16} p={2}>
    <Stat textAlign="center">
      <StatLabel>{label}</StatLabel>
      <StatNumber>{Math.round(value || 0)}</StatNumber>
    </Stat>
  </Box>
);

const ChartCard = ({ title, children }) => (
  <Box
    bg="gray.100"
    borderRadius={16}
    p={4}
    display="flex"
    flexDirection="column"
    alignItems="center"
    width="100%"
  >
    <Text fontWeight="bold" mb={4}>{title}</Text>
    {children}
  </Box>
);

const EventTileContent = ({ date, events }) => {
  const formattedDate = new Date(date);
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
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userArea, setUserArea] = useState(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const { data: stats, isLoading, error } = useDashboardData(selectedArea);
  const router = useRouter();
  const toast = useToast();

  // TAMBAH: useRef untuk simpan pie data terakhir
  const lastPieDataRef = useRef([]);

  // UPDATE: Simpan pie data ke ref setiap stats berubah
  useEffect(() => {
    if (stats?.userUmatByGender) {
      const newPieData = stats.userUmatByGender.map((entry) => ({
        name: entry.gender || "Unknown",
        value: Math.round(entry.value) || 0,
      }));
      lastPieDataRef.current = newPieData;
    }
  }, [stats]);

  // GUNAKAN: data dari ref jika tersedia, fallback ke pieData
  const displayPieData = lastPieDataRef.current.length > 0 ? lastPieDataRef.current : (
    stats?.userUmatByGender?.map((entry) => ({
      name: entry.gender || "Unknown",
      value: Math.round(entry.value) || 0,
    })) || []
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const decodedUserId = parseInt(decoded.user_info_id);
          if (decodedUserId && !isNaN(decodedUserId)) {
            setUserId(decodedUserId);
          } else {
            throw new Error("Invalid user_info_id in token");
          }
        } catch (err) {
          toast({
            title: "Gagal memproses token",
            description: "Token tidak valid atau tidak dapat diproses.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          router.push("/login");
        }
      } else {
        toast({
          title: "Autentikasi Gagal",
          description: "Silakan login kembali.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        router.push("/login");
      }
      setIsUserLoaded(true);
    }
  }, [toast, router]);

  const { data: userProfile, isLoading: isProfileLoading, error: profileError } =
    useFetchUserProfile(userId);

  useEffect(() => {
    if (userProfile) {
      setUserRole(userProfile.role?.toLowerCase() || "user");
      setUserArea(userProfile.qiudao?.qiu_dao_location?.area || null);
      setUsername(userProfile.username || userProfile.full_name || "");
    }
  }, [userProfile, userId]);

  useEffect(() => {
    if (profileError) {
      toast({
        title: "Gagal memuat profil pengguna",
        description:
          profileError?.message ||
          "Terjadi kesalahan saat memuat data profil. Silakan login kembali.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      router.push("/login");
    }
  }, [profileError, toast, router]);

  useEffect(() => {
    if (userRole && isUserLoaded) {
      if (userRole === "user" || userRole === "admin") {
        if (userArea && AREA_OPTIONS.some((opt) => opt.value === userArea)) {
          setSelectedArea(userArea);
        } else {
          toast({
            title: "Wilayah Tidak Valid",
            description:
              "Wilayah Anda tidak ditemukan. Menampilkan data Nasional sebagai fallback.",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          setSelectedArea("Nasional");
        }
      } else if (userRole === "super admin") {
        setSelectedArea("Nasional");
      }
    }
  }, [userRole, userArea, isUserLoaded, toast]);

  useEffect(() => {
    if (stats) {
      console.log("Dashboard Stats Data:", JSON.stringify(stats, null, 2));
    }
  }, [stats]);

  const barData = {
    labels: selectedArea === "Nasional" 
      ? (stats?.qiudaoUmatByKorwil?.map((item) => 
          item.korwil.startsWith("Korwil_") 
            ? `Wilayah ${item.korwil.replace("Korwil_", "")}` 
            : item.korwil
        ) || []) 
      : (stats?.qiudaoUmatByProvince?.map((item) => item.province) || []),
    datasets: [
      {
        data: selectedArea === "Nasional"
          ? (stats?.qiudaoUmatByKorwil?.map((item) => Math.round(item.umat) || 0) || [])
          : (stats?.qiudaoUmatByProvince?.map((item) => Math.round(item.umat) || 0) || []),
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
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => Math.round(value), stepSize: 1 },
        grid: { display: false },
      },
    },
    animation: false,
  };

  if (!isUserLoaded || isProfileLoading) {
    return (
      <VStack h="100vh" justify="center">
        <Text>Loading user data...</Text>
      </VStack>
    );
  }

  if (isLoading) {
    return (
      <VStack h="100vh" justify="center">
        <Text>Loading dashboard...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack h="100vh" justify="center">
        <Text>Error loading data: {error.message}</Text>
      </VStack>
    );
  }

  const areaLabel = AREA_OPTIONS.find((opt) => opt.value === selectedArea)?.label || selectedArea;

  return (
    <Layout
      title="Dashboard"
      showCalendar={true}
      tileContent={(props) => <EventTileContent {...props} events={stats?.events || []} />}
    >
      <VStack spacing={6} align="stretch" p={4}>
        <Flex align="center" justify="space-between" mb={4}>
          <Box>
            <Heading size="lg" mb={2}>
              Halo, {username || "User"}
            </Heading>
            <Text fontSize="md">Dapatkan gambaran lengkap komunitas dalam sekejap.</Text>
          </Box>
          {userRole === "super admin" ? (
            <Select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              width="200px"
            >
              {AREA_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          ) : (
            <Text fontWeight="bold" width="200px" textAlign="right">
              {areaLabel}
            </Text>
          )}
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <StatCard label="Total Vihara" value={stats?.totalVihara} />
          <StatCard label="Total DianChuanShi" value={stats?.totalDCS} />
          <StatCard label="Total FoYuan dan TanZhu" value={stats?.totalFYTZ} />
          <StatCard label="Total Biarawan/Biarawati" value={stats?.totalMonksNuns} />
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <ChartCard
            title={selectedArea === "Nasional" 
              ? "Total Umat per Wilayah" 
              : `Total Umat per Provinsi Wilayah ${areaLabel.replace("Korwil ", "")}`}
          >
            {(selectedArea === "Nasional" ? stats?.qiudaoUmatByKorwil?.length > 0 : stats?.qiudaoUmatByProvince?.length > 0) &&
              (selectedArea === "Nasional" ? stats.qiudaoUmatByKorwil?.some((item) => item.umat > 0) : stats.qiudaoUmatByProvince?.some((item) => item.umat > 0)) ? (
              <Box width="100%" height="300px">
                <Bar data={barData} options={barOptions} />
              </Box>
            ) : (
              <Text>Tidak ada data umat untuk {areaLabel}</Text>
            )}
          </ChartCard>

          {/* PIE CHART — PAKAI displayPieData */}
          <ChartCard
            title={`Total Umat Berdasarkan Gender${selectedArea === "Nasional" ? "" : ` Wilayah ${areaLabel.replace("Korwil ", "")}`}`}
          >
            {displayPieData.some((entry) => entry.value > 0) ? (
              <PieChart width={300} height={300}>
                <Pie
                  data={displayPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value }) => (value > 0 ? Math.round(value) : "")}
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => Math.round(value)} />
                <Legend />
              </PieChart>
            ) : (
              <Text>Tidak ada data umat untuk {areaLabel}</Text>
            )}
          </ChartCard>
        </SimpleGrid>
      </VStack>
    </Layout>
  );
}