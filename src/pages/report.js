import Layout from "@/components/layout";
import { Box, Flex, Heading, Button, useToast, Text, SimpleGrid, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Select } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FiUpload } from "react-icons/fi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

Chart.register(ChartDataLabels);

const AREA_OPTIONS = [
    { value: "Korwil_1", label: "Wilayah 1" },
    { value: "Korwil_2", label: "Wilayah 2" },
    { value: "Korwil_3", label: "Wilayah 3" },
    { value: "Korwil_4", label: "Wilayah 4" },
    { value: "Korwil_5", label: "Wilayah 5" },
    { value: "Korwil_6", label: "Wilayah 6" },
];

export default function Report() {
    const toast = useToast();
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState("pdf");

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ["report-stats"],
        queryFn: async () => {
            let fotangData = [], qiudaoData = [], dcsData = [], spiritualUsers = [];

            try {
                const [fotangResponse, qiudaoResponse, dcsResponse, spiritualResponse] = await Promise.all([
                    axiosInstance.get("/fotang").catch(() => ({ data: [] })),
                    axiosInstance.get("/profile/qiudao").catch(() => ({ data: [] })),
                    axiosInstance.get("/dianchuanshi").catch(() => ({ data: [] })),
                    axiosInstance.get("/spiritualuser").catch(() => ({ data: [] })),
                ]);

                fotangData = Array.isArray(fotangResponse.data) ? fotangResponse.data : fotangResponse.data.data || [];
                qiudaoData = Array.isArray(qiudaoResponse.data) ? qiudaoResponse.data : qiudaoResponse.data.data || [];
                dcsData = Array.isArray(dcsResponse.data) ? dcsResponse.data : dcsResponse.data.data || [];
                spiritualUsers = Array.isArray(spiritualResponse.data) ? spiritualResponse.data : spiritualResponse.data.data || [];

                console.log("Fotang Data:", fotangData);
                console.log("Qiudao Data:", qiudaoData);
                console.log("Dianchuanshi Data:", dcsData);
                console.log("Spiritual Users:", spiritualUsers);
            } catch (err) {
                console.error("Error fetching data:", err);
            }

            const viharaByArea = fotangData.reduce((acc, f) => {
                const area = f.area || "Unknown";
                acc[area] = (acc[area] || 0) + 1;
                return acc;
            }, {});
            const qiudaoUmatByKorwil = qiudaoData.reduce((acc, q) => {
                const korwil = q.qiu_dao_location?.area || "Unknown";
                const existing = acc.find((item) => item.korwil === korwil);
                if (existing) {
                    existing.umat += 1;
                } else {
                    acc.push({ korwil, umat: 1 });
                }
                return acc;
            }, []).map(item => ({ ...item, umat: Math.round(item.umat) }));

            const panditaByArea = dcsData.reduce((acc, d) => {
                const area = d.area || "Unknown";
                acc[area] = (acc[area] || 0) + 1;
                return acc;
            }, {});

            const fuwuyuanByArea = {
                ...dcsData.reduce((acc, d) => {
                    const area = d.area || "Unknown";
                    if (d.is_fuwuyuan === true) {
                        acc[area] = (acc[area] || 0) + 1;
                    }
                    return acc;
                }, {}),
                ...spiritualUsers.reduce((acc, s) => {
                    const area = s.area || "Unknown";
                    if (s.is_fuwuyuan === true) {
                        acc[area] = (acc[area] || 0) + 1;
                    }
                    return acc;
                }, {})
            };

            const areas = AREA_OPTIONS.map((opt) => opt.value);
            const viharaData = {
                labels: areas.map((a) => AREA_OPTIONS.find((opt) => opt.value === a)?.label || a),
                datasets: [{
                    data: areas.map((a) => viharaByArea[a] || 0),
                    backgroundColor: "#216ceeff",
                    borderColor: "#216ceeff",
                    borderWidth: 1,
                }],
            };
            const umatData = {
                labels: qiudaoUmatByKorwil.map((item) => AREA_OPTIONS.find(opt => opt.value === item.korwil)?.label || item.korwil) || [],
                datasets: [{
                    data: qiudaoUmatByKorwil.map((item) => item.umat) || [],
                    backgroundColor: "#216ceeff",
                    borderColor: "#216ceeff",
                    borderWidth: 1,
                }],
            };
            const panditaData = {
                labels: areas.map((a) => AREA_OPTIONS.find((opt) => opt.value === a)?.label || a),
                datasets: [{
                    data: areas.map((a) => panditaByArea[a] || 0),
                    backgroundColor: "#216ceeff",
                    borderColor: "#216ceeff",
                    borderWidth: 1,
                }],
            };
            const fuwuyuanData = {
                labels: areas.map((a) => AREA_OPTIONS.find((opt) => opt.value === a)?.label || a),
                datasets: [{
                    data: areas.map((a) => fuwuyuanByArea[a] || 0),
                    backgroundColor: "#216ceeff",
                    borderColor: "#216ceeff",
                    borderWidth: 1,
                }],
            };

            return { viharaData, umatData, panditaData, fuwuyuanData, lastUpdated: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) };
        },
        refetchInterval: 60000,
    });

    const exportReport = (format) => {
        if (!stats || !stats.viharaData || !stats.viharaData.datasets || !stats.viharaData.datasets[0]?.data) {
            toast({
                title: "Error",
                description: "Data tidak tersedia untuk diekspor.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const tableData = [
            ["Wilayah", "Vihara", "Umat", "Pandita", "Biarawan/Biarawati"],
            ...AREA_OPTIONS.map((opt, index) => [
                opt.label,
                stats.viharaData.datasets[0].data[index] || 0,
                stats.umatData.datasets[0].data[index] || 0,
                stats.panditaData.datasets[0].data[index] || 0,
                stats.fuwuyuanData.datasets[0].data[index] || 0,
            ]),
        ];

        if (format === "pdf") {
            const doc = new jsPDF();
            autoTable(doc, {
                head: tableData.slice(0, 1),
                body: tableData.slice(1),
            });
            doc.save("report.pdf");
            toast({
                title: "Berhasil",
                description: "Laporan telah diekspor ke PDF.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else if (format === "excel") {
            const ws = XLSX.utils.aoa_to_sheet(tableData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report");
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
            saveAs(dataBlob, "report.xlsx");
            toast({
                title: "Berhasil",
                description: "Laporan telah diekspor ke Excel.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else if (format === "csv") {
            const csvContent = tableData.map(row => row.join(",")).join("\n");
            const dataBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            saveAs(dataBlob, "report.csv");
            toast({
                title: "Berhasil",
                description: "Laporan telah diekspor ke CSV.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        }
        setIsExportModalOpen(false);
    };

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            datalabels: {
                display: function(context) {
                    return context.dataset.data[context.dataIndex] > 0;
                },
                color: "#000",
                anchor: "end",
                align: "top",
                offset: 5,
                font: { size: 14, weight: "bold" },
                formatter: (value) => Math.round(value),
            },
        },
        scales: {
            x: { grid: { display: false } },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => Math.round(value),
                    stepSize: 20, // Increased step size for better spacing
                    max: function() {
                        const maxDataValue = Math.max(...stats?.viharaData.datasets[0].data);
                        return Math.ceil(maxDataValue / 20) * 20 + 50; // Increased buffer to 50
                    }
                },
                grid: { display: false }
            },
        },
        animation: false,
    };

    if (isLoading) return <Layout title="Laporan"><Box p={6}>Loading...</Box></Layout>;
    if (error) return <Layout title="Laporan"><Box p={6}>Error loading data: {error.message}</Box></Layout>;

    return (
        <Layout title="Laporan">
            <Box p={2} overflow="auto">
                <Flex justify="start" align="center" mb={6}>
                    <Button size="sm" colorScheme="blue" onClick={() => setIsExportModalOpen(true)} leftIcon={<FiUpload style={{ marginTop: "2px" }} />}>Ekspor Data</Button>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
                        <Text fontWeight="bold" mb={4}>Jumlah Vihara per Wilayah</Text>
                        <Box width="100%" height="400px"> {/* Increased height to 400px */}
                            <Bar data={stats?.viharaData || { labels: [], datasets: [{ data: [] }] }} options={chartOptions} />
                        </Box>
                    </Box>
                    <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
                        <Text fontWeight="bold" mb={4}>Total Umat per Wilayah</Text>
                        <Box width="100%" height="400px"> {/* Increased height to 400px */}
                            <Bar data={stats?.umatData || { labels: [], datasets: [{ data: [] }] }} options={chartOptions} />
                        </Box>
                    </Box>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
                    <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
                        <Text fontWeight="bold" mb={4}>Jumlah Pandita per Wilayah</Text>
                        <Box width="100%" height="400px"> {/* Increased height to 400px */}
                            <Bar data={stats?.panditaData || { labels: [], datasets: [{ data: [] }] }} options={chartOptions} />
                        </Box>
                    </Box>
                    <Box bg="gray.100" borderRadius={16} p={4} display="flex" flexDirection="column" alignItems="center">
                        <Text fontWeight="bold" mb={4}>Jumlah Biarawan/Biarawati per Wilayah</Text>
                        <Box width="100%" height="400px"> {/* Increased height to 400px */}
                            <Bar data={stats?.fuwuyuanData || { labels: [], datasets: [{ data: [] }] }} options={chartOptions} />
                        </Box>
                    </Box>
                </SimpleGrid>
                <Box mt={4}>
                    <Text fontSize="sm" color="gray.500">
                        Update terakhir: {stats?.lastUpdated || "N/A"}
                    </Text>
                </Box>

                <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader textAlign="center">Ekspor Data</ModalHeader>
                        <Text mb={4} textAlign="center">Pilih tipe file untuk ekspor data</Text>
                        <ModalBody>
                            <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} mb={4}>
                                <option value="excel">File excel</option>
                                <option value="pdf">File PDF</option>
                                <option value="csv">File CSV</option>
                            </Select>
                        </ModalBody>
                        <ModalFooter>
                            <Flex width="100%" justifyContent="space-between">
                                <Button variant="ghost" width="48%" onClick={() => setIsExportModalOpen(false)}>Batal</Button>
                                <Button colorScheme="blue" width="48%" onClick={() => exportReport(exportFormat)}>Ekspor</Button>
                            </Flex>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Box>
        </Layout>
    );
}