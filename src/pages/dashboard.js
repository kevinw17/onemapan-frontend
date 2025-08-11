import Layout from "@/components/layout";
import { Box, Heading, Text, Stat, StatLabel, StatNumber, StatHelpText, SimpleGrid, VStack, Select, Flex } from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels"; // Impor plugin secara eksplisit
import { Cell, Pie, PieChart, Tooltip, Legend } from "recharts";

// Registrasi plugin datalabels
Chart.register(ChartDataLabels);

export default function Dashboard() {
    const [username, setUsername] = useState("");
    const [selectedArea, setSelectedArea] = useState("Nasional");
    const [chartInstance, setChartInstance] = useState(null);
    const canvasRef = useRef(null);

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ["dashboard-stats", selectedArea],
        queryFn: async () => {
            try {
                const [usersResponse, qiudaoResponse, fotangResponse, dcsResponse] = await Promise.all([
                    axiosInstance.get("/profile/user"),
                    axiosInstance.get("/profile/qiudao"),
                    axiosInstance.get("/fotang"),
                    axiosInstance.get("/dianchuanshi"),
                ]);

                const users = Array.isArray(usersResponse.data) ? usersResponse.data : (usersResponse.data.data || []);
                const qiudaoData = Array.isArray(qiudaoResponse.data) ? qiudaoResponse.data : (qiudaoResponse.data.data || []);
                const fotangData = Array.isArray(fotangResponse.data) ? fotangResponse.data : (fotangResponse.data.data || []);
                const dcsData = Array.isArray(dcsResponse.data) ? dcsResponse.data : (dcsResponse.data.data || []);

                console.log("Full Users Response:", usersResponse);
                console.log("Full Qiudao Response:", qiudaoResponse);
                console.log("Users Data:", users);
                console.log("Qiudao Data:", qiudaoData);
                console.log("Fotang Data:", fotangData);
                console.log("DCS Data:", dcsData);

                let totalVihara, fyCount, tzCount, totalDCS, totalFYTZDCS, qiudaoUmatByKorwil, userUmatByGender;

                if (selectedArea === "Nasional") {
                    totalVihara = fotangData.length || 0;
                    fyCount = (users.filter((u) => u.spiritualUser?.spiritual_status === "FoYuan") || []).length || 0;
                    tzCount = (users.filter((u) => u.spiritualUser?.spiritual_status === "TanZhu") || []).length || 0;
                    totalDCS = dcsData.length || 0;
                    totalFYTZDCS = fyCount + tzCount + totalDCS;
                    qiudaoUmatByKorwil = qiudaoData.reduce((acc, q) => {
                        const korwil = q.qiu_dao_location?.area || "Unknown";
                        const existing = acc.find((item) => item.korwil === korwil);
                        if (existing) {
                            existing.umat += 1;
                        } else {
                            acc.push({ korwil, umat: 1 });
                        }
                        return acc;
                    }, []);
                    userUmatByGender = users.reduce((acc, u) => {
                        const gender = u.gender === "Male" ? "Pria" : u.gender === "Female" ? "Wanita" : "Unknown";
                        const existing = acc.find((item) => item.gender === gender);
                        if (existing) {
                            existing.value += 1;
                        } else {
                            acc.push({ gender, value: 1 });
                        }
                        return acc;
                    }, []);
                } else {
                    const filteredFotang = fotangData.filter((f) => f.area === selectedArea);
                    const filteredQiudao = qiudaoData.filter((q) => q.qiu_dao_location?.area === selectedArea);
                    const filteredDcs = dcsData.filter((d) => d.area === selectedArea);
                    const qiudaoUserIds = new Set(filteredQiudao.map((q) => q.userId)); // Asumsi ada userId

                    totalVihara = filteredFotang.length || 0;

                    // FY dan TZ: Filter users berdasarkan qiudao yang terkait dengan area
                    fyCount = (users.filter((u) => u.spiritualUser?.spiritual_status === "FoYuan" && filteredQiudao.some((q) => q.userId === u.id)).length || 0);
                    tzCount = (users.filter((u) => u.spiritualUser?.spiritual_status === "TanZhu" && filteredQiudao.some((q) => q.userId === u.id)).length || 0);
                    totalDCS = filteredDcs.length || 0;
                    totalFYTZDCS = fyCount + tzCount + totalDCS;

                    qiudaoUmatByKorwil = []; // Kosongkan untuk Korwil
                    userUmatByGender = users.filter((u) => filteredQiudao.some((q) => q.userId === u.id)).reduce((acc, u) => {
                        const gender = u.gender === "Male" ? "Pria" : u.gender === "Female" ? "Wanita" : "Unknown";
                        const existing = acc.find((item) => item.gender === gender);
                        if (existing) {
                            existing.value += 1;
                        } else {
                            acc.push({ gender, value: 1 });
                        }
                        return acc;
                    }, []);
                }

                return {
                    totalVihara,
                    totalFYTZDCS,
                    qiudaoUmatByKorwil,
                    userUmatByGender,
                    lastUpdated: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
                };
            } catch (err) {
                console.error("Error in queryFn:", err);
                throw err;
            }
        },
        refetchInterval: 60000,
    });

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
        try {
            const user = JSON.parse(userStr);
            setUsername(user.username);
        } catch (e) {
            console.error("Gagal parsing user:", e);
        }
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && selectedArea === "Nasional") {
            // Hancurkan instance lama hanya jika ada
            if (chartInstance) {
                chartInstance.destroy();
            }
            // Inisialisasi chart hanya jika data tersedia
            if (stats?.qiudaoUmatByKorwil) {
                const ctx = canvas.getContext("2d");
                const newChartInstance = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: stats.qiudaoUmatByKorwil.map(item => item.korwil.replace("Korwil_", "Wilayah ")),
                        datasets: [{
                            data: stats.qiudaoUmatByKorwil.map(item => item.umat || 0),
                            backgroundColor: "#216ceeff",
                            borderColor: "#216ceeff",
                            borderWidth: 1,
                        }],
                    },
                    options: {
                        plugins: {
                            legend: { display: false }, // Pastikan legenda dinonaktifkan
                            tooltip: { enabled: false },
                            datalabels: {
                                display: true,
                                color: "#fff",
                                anchor: "center", // Pindah ke dalam bar
                                align: "center", // Posisi tengah dalam bar
                                font: { size: 14, weight: "bold" },
                                formatter: (value) => value || 0, // Hanya tampilkan nilai
                            },
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { display: false } }, // Sembunyikan label sumbu Y
                        },
                        animation: {
                            duration: 0,
                        },
                    },
                });
                setChartInstance(newChartInstance);
            }
        }
    }, [stats, selectedArea]);

    if (isLoading) return <VStack h="100vh" justify="center"><Text>Loading...</Text></VStack>;
    if (error) return <VStack h="100vh" justify="center"><Text>Error loading data: {error.message}</Text></VStack>;

    const COLORS = ["#160ee7ff", "#e331c8ff"];

    return (
        <Layout title="Dashboard">
        <VStack spacing={6} align="stretch" p={2}>
            <Flex align="center" justify="space-between" mb={4}>
                <Box>
                    <Heading size="lg" mb={2}>Halo, {username}</Heading>
                    <Text fontSize="md">Dapatkan gambaran lengkap komunitas dalam sekejap.</Text>
                </Box>
                <Select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    width="200px"
                >
                    <option value="Nasional">Nasional</option>
                    <option value="Korwil_1">Wilayah 1</option>
                    <option value="Korwil_2">Wilayah 2</option>
                    <option value="Korwil_3">Wilayah 3</option>
                    <option value="Korwil_4">Wilayah 4</option>
                    <option value="Korwil_5">Wilayah 5</option>
                    <option value="Korwil_6">Wilayah 6</option>
                </Select>
            </Flex>

            {/* Baris pertama: Total Vihara dan Total FY + TZ + DCS */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
                <Box backgroundColor={"blue.100"} borderRadius={16} >
                    <Stat>
                        <StatLabel display="flex" flexDirection="column" alignItems="center" justifyContent="center" my={2}>Total Vihara</StatLabel>
                        <StatNumber display="flex" flexDirection="column" alignItems="center" justifyContent="center" my={2}>{stats?.totalVihara || 0}</StatNumber>
                    </Stat>
                </Box>
                <Box backgroundColor={"gray.100"} borderRadius={16}>
                    <Stat>
                        <StatLabel display="flex" flexDirection="column" alignItems="center" justifyContent="center" my={2}>Total FY,TZ,DCS</StatLabel>
                        <StatNumber display="flex" flexDirection="column" alignItems="center" justifyContent="center" my={2}>{stats?.totalFYTZDCS || 0}</StatNumber>
                    </Stat>
                </Box>
            </SimpleGrid>

            {/* Baris kedua: Grafik */}
            <SimpleGrid columns={{ base: 1, md: selectedArea === "Nasional" ? 2 : 1 }} spacing={6}>
            {selectedArea === "Nasional" && (
                <Box backgroundColor={"gray.100"} borderRadius={16} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <Text fontWeight="bold" mt={4} mb={8}>Total Umat per Wilayah</Text>
                    <canvas ref={canvasRef} width="500" height="300"></canvas>
                </Box>
            )}

            {/* Pie Chart untuk Umat dari User berdasarkan Jenis Kelamin */}
            <Box backgroundColor={"gray.100"} borderRadius={16} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                <Text fontWeight="bold">Total Umat</Text>
                <PieChart width={500} height={300}>
                <Pie
                    data={stats?.userUmatByGender || []}
                    dataKey="value"
                    nameKey="gender"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                >
                    {(stats?.userUmatByGender || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
                </PieChart>
            </Box>
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