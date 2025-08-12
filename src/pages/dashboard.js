import Layout from "@/components/layout";
import { Box, Heading, Text, Stat, StatLabel, StatNumber, SimpleGrid, VStack, Select, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Cell, Pie, PieChart, Tooltip, Legend } from "recharts";
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

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ["dashboard-stats", selectedArea],
        queryFn: async () => {
        let users = [], qiudaoData = [], fotangData = [], dcsData = [];

        try {
            const [usersResponse, qiudaoResponse, fotangResponse, dcsResponse] = await Promise.all([
            axiosInstance.get("/profile/user").catch(() => ({ data: [] })),
            axiosInstance.get("/profile/qiudao").catch(() => ({ data: [] })),
            axiosInstance.get("/fotang").catch(() => ({ data: [] })),
            axiosInstance.get("/dianchuanshi").catch(() => ({ data: [] })),
            ]);

            users = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.data || [];
            qiudaoData = Array.isArray(qiudaoResponse.data) ? qiudaoResponse.data : qiudaoResponse.data.data || [];
            fotangData = Array.isArray(fotangResponse.data) ? fotangResponse.data : fotangResponse.data.data || [];
            dcsData = Array.isArray(dcsResponse.data) ? dcsResponse.data : dcsResponse.data.data || [];

            console.log("Users:", users);
            console.log("Selected Area:", selectedArea);
        } catch (err) {
            console.error("Error fetching data:", err);
        }

        let filteredUsers = users;
        if (selectedArea !== "Nasional") {
            filteredUsers = users.filter((u) => u.qiudao?.qiu_dao_location?.area === selectedArea);
        }
        console.log("Filtered Users:", filteredUsers);

        const totalVihara = selectedArea === "Nasional" ? fotangData.length : fotangData.filter((f) => f.area === selectedArea).length;
        const fyCount = filteredUsers.filter((u) => u.spiritualUser?.spiritual_status === "FoYuan").length;
        const tzCount = filteredUsers.filter((u) => u.spiritualUser?.spiritual_status === "TanZhu").length;
        const totalDCS = selectedArea === "Nasional" ? dcsData.length : dcsData.filter((d) => d.area === selectedArea).length;
        const totalFYTZDCS = fyCount + tzCount + totalDCS;

        const qiudaoUmatByKorwil = selectedArea === "Nasional" ? qiudaoData.reduce((acc, q) => {
            const korwil = q.qiu_dao_location?.area || "Unknown";
            const existing = acc.find((item) => item.korwil === korwil);
            if (existing) {
            existing.umat += 1;
            } else {
            acc.push({ korwil, umat: 1 });
            }
            return acc;
        }, []) : [];

        let totalActiveUsers = 0;
        let activeUsersByMonth = {};
        if (selectedArea === "Nasional") {
            totalActiveUsers = users.length; // Total umat aktif tanpa filter gender
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            users.forEach((u) => {
            if (u.created_at) {
                const createdAt = new Date(u.created_at);
                if (createdAt >= oneYearAgo) {
                const monthYear = createdAt.toLocaleString("id-ID", { month: "long", year: "numeric" });
                activeUsersByMonth[monthYear] = (activeUsersByMonth[monthYear] || 0) + 1;
                }
            }
            });
        }

        let totalActiveUsersPerArea = 0;
        let activeUsersByMonthPerArea = {};
        if (selectedArea !== "Nasional") {
            totalActiveUsersPerArea = filteredUsers.length; // Total umat aktif per wilayah
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            filteredUsers.forEach((u) => {
            if (u.created_at) {
                const createdAt = new Date(u.created_at);
                if (createdAt >= oneYearAgo) {
                const monthYear = createdAt.toLocaleString("id-ID", { month: "long", year: "numeric" });
                activeUsersByMonthPerArea[monthYear] = (activeUsersByMonthPerArea[monthYear] || 0) + 1;
                }
            }
            });
        }

        const userUmatByGender = filteredUsers.length > 0 ? filteredUsers.reduce((acc, u) => {
            const gender = u.gender === "Male" ? "Pria" : u.gender === "Female" ? "Wanita" : "Unknown";
            const existing = acc.find((item) => item.gender === gender);
            if (existing) {
            existing.value += 1;
            } else {
            acc.push({ gender, value: 1 });
            }
            return acc;
        }, []) : [{ gender: "Pria", value: 0 }, { gender: "Wanita", value: 0 }];

        return {
            totalVihara,
            totalFYTZDCS,
            qiudaoUmatByKorwil,
            userUmatByGender,
            totalActiveUsers,
            activeUsersByMonth,
            totalActiveUsersPerArea,
            activeUsersByMonthPerArea,
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
        labels: stats?.qiudaoUmatByKorwil?.map((item) => AREA_OPTIONS.find(opt => opt.value === item.korwil)?.label || item.korwil) || [],
        datasets: [
        {
            data: stats?.qiudaoUmatByKorwil?.map((item) => item.umat || 0) || [],
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
            formatter: (value) => value || 0,
        },
        },
        scales: {
        x: {
            grid: { display: false },
        },
        y: {
            beginAtZero: true,
            ticks: { display: false },
            grid: { display: false },
        },
        },
        animation: false,
    };

    const lineData = {
        labels: Object.keys(stats?.activeUsersByMonth || {}).sort((a, b) => new Date(b) - new Date(a)),
        datasets: [
        {
            label: "Umat Aktif",
            data: Object.values(stats?.activeUsersByMonth || {}),
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
        tooltip: { enabled: true },
        },
        scales: {
        x: {
            title: { display: true, text: "Bulan" },
        },
        y: {
            beginAtZero: true,
            title: { display: true, text: "Jumlah Umat" },
        },
        },
    };

    const lineDataPerArea = {
        labels: Object.keys(stats?.activeUsersByMonthPerArea || {}).sort((a, b) => new Date(b) - new Date(a)),
        datasets: [
        {
            label: "Umat Aktif",
            data: Object.values(stats?.activeUsersByMonthPerArea || {}),
            fill: false,
            borderColor: "#216ceeff",
            tension: 0.1,
        },
        ],
    };

    if (isLoading) return <VStack h="100vh" justify="center"><Text>Loading...</Text></VStack>;
    if (error) return <VStack h="100vh" justify="center"><Text>Error loading data: {error.message}</Text></VStack>;

    const COLORS = ["#160ee7ff", "#e331c8ff"];

    return (
        <Layout title="Dashboard">
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

            <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
            <Box bg="blue.100" borderRadius={16}>
                <Stat textAlign="center" py={2}>
                <StatLabel>Total Vihara</StatLabel>
                <StatNumber>{stats?.totalVihara || 0}</StatNumber>
                </Stat>
            </Box>
            <Box bg="gray.100" borderRadius={16}>
                <Stat textAlign="center" py={2}>
                <StatLabel>Total FY,TZ,DCS</StatLabel>
                <StatNumber>{stats?.totalFYTZDCS || 0}</StatNumber>
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
                    <StatNumber>{stats?.totalActiveUsers || 0}</StatNumber>
                </Stat>
                <Box width="100%" height="250px">
                    <Line data={lineData} options={lineOptions} />
                </Box>
                </Box>
            ) : (
                <>
                <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
                    <Text fontWeight="bold" mb={4}>
                    Total Umat {`Wilayah ${selectedArea.replace("Korwil_", "")}`}
                    </Text>
                    {stats?.userUmatByGender?.some(entry => entry.value > 0) ? (
                    <PieChart width={300} height={300}>
                        <Pie
                        data={stats.userUmatByGender}
                        dataKey="value"
                        nameKey="gender"
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({value }) => `${value}`}
                        >
                        {stats.userUmatByGender.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                    ) : (
                    <Text>Tidak ada data umat untuk wilayah ini</Text>
                    )}
                </Box>
                <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
                    <Text fontWeight="bold" mb={4}>
                    Umat Aktif {`Wilayah ${selectedArea.replace("Korwil_", "")}`}
                    </Text>
                    {stats?.totalActiveUsersPerArea > 0 && Object.keys(stats?.activeUsersByMonthPerArea).length > 0 ? (
                    <>
                        <Stat textAlign="center" mb={4}>
                        <StatNumber>{stats?.totalActiveUsersPerArea || 0}</StatNumber>
                        </Stat>
                        <Box width="100%" height="250px">
                        <Line data={lineDataPerArea} options={lineOptions} />
                        </Box>
                    </>
                    ) : (
                    <Text>Tidak ada umat aktif di Wilayah {selectedArea.replace("Korwil_", "")}</Text>
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