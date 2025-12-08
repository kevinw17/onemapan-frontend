import Layout from "@/components/layout";
import {
  Box, Heading, Text, Stat, StatLabel, StatNumber, SimpleGrid, VStack, Select, Flex,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
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
import { FiChevronRight, FiHome } from "react-icons/fi";
import { isNationalRole } from "@/lib/roleUtils";

Chart.register(ChartDataLabels);

// === WARNA KONSISTEN: PRIA BIRU, WANITA PINK ===
const GENDER_COLORS = {
  Pria: "#160ee7ff",   // Biru
  Wanita: "#e331c8ff", // Pink
};

const StatCard = ({ label, value }) => (
  <Box bg="blue.100" borderRadius={16} p={2}>
    <Stat textAlign="center">
      <StatLabel>{label}</StatLabel>
      <StatNumber>{Math.round(value || 0)}</StatNumber>
    </Stat>
  </Box>
);

const ChartCard = ({ title, children }) => (
  <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center" width="100%">
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
        <Text key={index} fontSize="xs" color="blue.600" px={1}>{eventName}</Text>
      ))}
    </Box>
  ) : null;
};

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [selectedArea, setSelectedArea] = useState("Nasional");
  const [drillDown, setDrillDown] = useState({
    level: "korwil",
    korwil: null,
    province: null,
  });
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userArea, setUserArea] = useState(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const chartRef = useRef(null);

  // === DATA ===
  const { data: stats, isLoading, error } = useDashboardData({
    selectedArea,
    drillDownLevel: drillDown.level,
    drillDownKorwil: drillDown.korwil,
    drillDownProvince: drillDown.province,
  });

  // === PIE DATA: SELALU ADA PRIA & WANITA (value 0 jika tidak ada) ===
  const pieData = [
    { name: "Pria", value: 0 },
    { name: "Wanita", value: 0 },
  ];

  stats?.userUmatByGender?.forEach(entry => {
    if (entry.gender === "Pria") pieData[0].value = Math.round(entry.value);
    if (entry.gender === "Wanita") pieData[1].value = Math.round(entry.value);
  });

  // === AUTH & PROFILE (sama) ===
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const decodedUserId = parseInt(decoded.user_info_id);
          if (decodedUserId && !isNaN(decodedUserId)) setUserId(decodedUserId);
          else throw new Error("Invalid user_info_id");
        } catch (err) {
          toast({ title: "Token tidak valid", status: "error" });
          router.push("/login");
        }
      } else {
        toast({ title: "Silakan login", status: "error" });
        router.push("/login");
      }
      setIsUserLoaded(true);
    }
  }, [toast, router]);

  const { data: userProfile, isLoading: isProfileLoading } = useFetchUserProfile(userId);

  useEffect(() => {
    if (userProfile) {
      setUserRole(userProfile.role?.toLowerCase() || "user");
      setUserArea(userProfile.qiudao?.qiu_dao_location?.area || null);
      setUsername(userProfile.username || userProfile.full_name || "");
    }
  }, [userProfile]);

  useEffect(() => {
    if (userRole && isUserLoaded) {
      if (["user", "admin"].includes(userRole) && userArea) {
        setSelectedArea(userArea);
      } else if (isNationalRole(userRole)) {
        setSelectedArea("Nasional");
      }
    }
  }, [userRole, userArea, isUserLoaded]);

  // === SINKRONKAN DROPDOWN ===
  useEffect(() => {
    if (selectedArea === "Nasional") {
      setDrillDown({ level: "korwil", korwil: null, province: null });
    } else if (drillDown.level === "korwil") {
      setDrillDown({ level: "province", korwil: selectedArea, province: null });
    } else if (drillDown.korwil !== selectedArea) {
      setDrillDown({ level: "province", korwil: selectedArea, province: null });
    }
  }, [drillDown.korwil, drillDown.level, selectedArea]);

  // === BAR CLICK ===
  const handleBarClick = (event, elements) => {
    if (!elements.length) return;
    const index = elements[0].index;

    if (drillDown.level === "korwil") {
      const korwil = stats.qiudaoUmatByKorwil[index].korwil;
      setDrillDown({ level: "province", korwil, province: null });
      setSelectedArea(korwil);
    } else if (drillDown.level === "province") {
      const province = stats.qiudaoUmatByProvince[index].province;
      setDrillDown({ level: "city", korwil: drillDown.korwil, province });
    }
  };

  // === CHART DATA ===
  let labels = [], values = [], title = "";

  if (drillDown.level === "korwil") {
    labels = stats?.qiudaoUmatByKorwil?.map(item => `Wilayah ${item.korwil.replace("Korwil_", "")}`) || [];
    values = stats?.qiudaoUmatByKorwil?.map(item => Math.round(item.umat)) || [];
    title = "Total Umat per Wilayah";
  } else if (drillDown.level === "province") {
    labels = stats?.qiudaoUmatByProvince?.map(item => item.province) || [];
    values = stats?.qiudaoUmatByProvince?.map(item => Math.round(item.umat)) || [];
    title = `Total Umat per Provinsi - Wilayah ${drillDown.korwil?.replace("Korwil_", "")}`;
  } else if (drillDown.level === "city") {
    labels = stats?.qiudaoUmatByCity?.map(item => item.city) || [];
    values = stats?.qiudaoUmatByCity?.map(item => Math.round(item.umat)) || [];
    title = `Total Umat per Kota - ${drillDown.province}`;
  }

  const barData = { labels, datasets: [{ data: values, backgroundColor: "#216ceeff" }] };
  const barOptions = {
    maintainAspectRatio: false,
    onClick: handleBarClick,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      datalabels: {
        display: true,
        color: "#fff",
        anchor: "end",
        align: "top",
        offset: -25,
        font: { size: 14, weight: "bold" },
        formatter: v => Math.round(v) || 0,
      },
    },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { display: false } } },
    animation: false,
    cursor: drillDown.level !== "city" ? "pointer" : "default",
  };

  // === BREADCRUMB: TANPA DUP (hanya tampilkan jika level > province) ===
  const renderBreadcrumb = () => {
    if (drillDown.level === "korwil") return null;

    return (
      <Breadcrumb spacing={2} separator={<FiChevronRight color="gray.500" />}>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => {
            setDrillDown({ level: "korwil", korwil: null, province: null });
            setSelectedArea("Nasional");
          }}>
            <FiHome />
          </BreadcrumbLink>
        </BreadcrumbItem>

        {drillDown.korwil && (
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => {
              setDrillDown({ level: "province", korwil: drillDown.korwil, province: null });
              setSelectedArea(drillDown.korwil);
            }}>
              Wilayah {drillDown.korwil.replace("Korwil_", "")}
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}

        {drillDown.province && drillDown.level === "city" && (
          <BreadcrumbItem isCurrentPage>
            <span>{drillDown.province}</span>
          </BreadcrumbItem>
        )}
      </Breadcrumb>
    );
  };

  // === RENDER ===
  if (isLoading || isProfileLoading) return <VStack h="100vh" justify="center"><Text>Memuat...</Text></VStack>;
  if (error) return <VStack h="100vh" justify="center"><Text>Error: {error.message}</Text></VStack>;

  const areaLabel = AREA_OPTIONS.find(o => o.value === selectedArea)?.label || selectedArea;

  return (
    <Layout title="Dashboard" showCalendar tileContent={(p) => <EventTileContent {...p} events={stats?.events || []} />} calendarEvents={stats?.events || []}>
      <VStack spacing={6} align="stretch" p={4}>
        <Flex align="center" justify="space-between" mb={4}>
          <Box>
            <Heading size="lg" mb={2}>Halo, {username}</Heading>
            <Text>Gambaran lengkap komunitas.</Text>
          </Box>
          {isNationalRole(userRole) ? (
            <Select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} width="200px">
              {AREA_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </Select>
          ) : (
            <Text fontWeight="bold" width="200px" textAlign="right">{areaLabel}</Text>
          )}
        </Flex>

        {renderBreadcrumb()}

        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={6}>
          <StatCard label="Total Vihara" value={stats?.totalVihara} />
          <StatCard label="Total DianChuanShi" value={stats?.totalDCS} />
          <StatCard label="Total TanZhu dan FoYuan" value={stats?.totalTZFY} />
          <StatCard label="Total Biarawan/Biarawati" value={stats?.totalFuWuYuan} />
          <StatCard label="Total Umat Qingkou" value={stats?.totalQingkou} />
        </SimpleGrid>

        {/* FOOTNOTE */}
        <Box mt={4} p={4} bg="blue.50" borderRadius="lg" borderLeft="4px solid" borderColor="blue.500">
          <Text fontSize="sm" color="blue.800" fontWeight="medium">
            Catatan:
          </Text>
          <Text fontSize="sm" color="gray.700" mt={1} lineHeight="1.6">
            Total Dianchuanshi, Tanzhu, dan Foyuan <strong>dapat beririsan</strong> dengan total Biarawan/Biarawati. 
            Artinya, seorang Biarawan/Biarawati dapat tercatat sekaligus sebagai Dianchuanshi, Tanzhu, atau Foyuan 
            sesuai peran dan kontribusinya di vihara.
          </Text>
          <Text fontSize="xs" color="gray.600" mt={2} fontStyle="italic">
            Data ini mencerminkan peran ganda dalam komunitas, bukan duplikasi individu.
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <ChartCard title={title}>
            {labels.length > 0 && values.some(v => v > 0) ? (
              <Box width="100%" height="300px">
                <Bar ref={chartRef} data={barData} options={barOptions} />
              </Box>
            ) : (
              <Text textAlign="center" color="gray.500">Tidak ada data</Text>
            )}
          </ChartCard>

          <ChartCard title={`Total Umat by Gender${drillDown.level === "korwil" ? "" : ` - ${drillDown.province || areaLabel.replace("Korwil ", "")}`}`}>
            {pieData.some(e => e.value > 0) ? (
              <PieChart width={300} height={300}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value }) => value > 0 ? Math.round(value) : ""}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={GENDER_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => Math.round(v)} />
                <Legend />
              </PieChart>
            ) : (
              <Text textAlign="center" color="gray.500">Tidak ada data gender</Text>
            )}
          </ChartCard>
        </SimpleGrid>
      </VStack>
    </Layout>
  );
}