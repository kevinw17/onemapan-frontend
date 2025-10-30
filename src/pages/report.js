import Layout from "@/components/layout";
import {
    Box,
    Flex,
    Heading,
    Button,
    useToast,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    IconButton,
    VStack,
    HStack,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
} from "@chakra-ui/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FiPlus, FiTrash2, FiUpload } from "react-icons/fi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AREA_OPTIONS = [
    { value: "Nasional", label: "Nasional" },
    { value: "Korwil_1", label: "Wilayah 1" },
    { value: "Korwil_2", label: "Wilayah 2" },
    { value: "Korwil_3", label: "Wilayah 3" },
    { value: "Korwil_4", label: "Wilayah 4" },
    { value: "Korwil_5", label: "Wilayah 5" },
    { value: "Korwil_6", label: "Wilayah 6" },
];

const DATA_TYPES = [
    { key: "vihara", label: "Jumlah Vihara" },
    { key: "umat", label: "Total Umat" },
    { key: "pandita", label: "Jumlah Pandita" },
    { key: "fuwuyuan", label: "Biarawan/Biarawati" },
];

export default function Report() {
    const toast = useToast();
    const [selectedItems, setSelectedItems] = useState([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState("pdf");

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ["report-stats"],
        queryFn: async () => {
        const [fotangRes, qiudaoRes, dcsRes, spiritualRes] = await Promise.all([
            axiosInstance.get("/fotang").catch(() => ({ data: [] })),
            axiosInstance.get("/profile/qiudao").catch(() => ({ data: [] })),
            axiosInstance.get("/dianchuanshi").catch(() => ({ data: [] })),
            axiosInstance.get("/spiritualuser").catch(() => ({ data: [] })),
        ]);

        const fotangData = Array.isArray(fotangRes.data) ? fotangRes.data : fotangRes.data.data || [];
        const qiudaoData = Array.isArray(qiudaoRes.data) ? qiudaoRes.data : qiudaoRes.data.data || [];
        const dcsData = Array.isArray(dcsRes.data) ? dcsRes.data : dcsRes.data.data || [];
        const spiritualUsers = Array.isArray(spiritualRes.data) ? spiritualRes.data : spiritualRes.data.data || [];

        const viharaByArea = fotangData.reduce((acc, f) => {
            const area = f.area || "Unknown";
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {});

        const umatByArea = qiudaoData.reduce((acc, q) => {
            const area = q.qiu_dao_location?.area || "Unknown";
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {});

        const panditaByArea = dcsData.reduce((acc, d) => {
            const area = d.area || "Unknown";
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {});

        const fuwuyuanByArea = {
            ...dcsData.reduce((acc, d) => {
            if (d.is_fuwuyuan) {
                const area = d.area || "Unknown";
                acc[area] = (acc[area] || 0) + 1;
            }
            return acc;
            }, {}),
            ...spiritualUsers.reduce((acc, s) => {
            if (s.is_fuwuyuan) {
                const area = s.area || "Unknown";
                acc[area] = (acc[area] || 0) + 1;
            }
            return acc;
            }, {}),
        };

        const total = {
            vihara: fotangData.length,
            umat: qiudaoData.length,
            pandita: dcsData.length,
            fuwuyuan: Object.values(fuwuyuanByArea).reduce((a, b) => a + b, 0),
        };

        return {
            byArea: { viharaByArea, umatByArea, panditaByArea, fuwuyuanByArea },
            total,
            lastUpdated: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
        };
        },
        refetchInterval: 60000,
    });

    const addItem = () => {
        setSelectedItems((prev) => [...prev, { dataType: "", area: "" }]);
    };

    const updateItem = (index, field, value) => {
        setSelectedItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
        });
    };

    const removeItem = (index) => {
        setSelectedItems((prev) => prev.filter((_, i) => i !== index));
    };

    const exportSelected = () => {
        const validItems = selectedItems.filter((item) => item.dataType && item.area);
        if (validItems.length === 0) {
        toast({ title: "Pilih data", description: "Pilih minimal 1 data lengkap.", status: "warning" });
        return;
        }

        const tableData = [["Jenis Data", "Wilayah", "Jumlah"]];
        validItems.forEach((item) => {
        const typeLabel = DATA_TYPES.find((d) => d.key === item.dataType)?.label || item.dataType;
        const areaLabel = AREA_OPTIONS.find((o) => o.value === item.area)?.label || item.area;
        const value =
            item.area === "Nasional"
            ? stats?.total?.[item.dataType] || 0
            : stats?.byArea?.[`${item.dataType}ByArea`]?.[item.area] || 0;
        tableData.push([typeLabel, areaLabel, value]); // ← URUTAN BARU
        });

        if (exportFormat === "pdf") {
        const doc = new jsPDF();
        autoTable(doc, { head: [tableData[0]], body: tableData.slice(1) });
        doc.save("laporan-custom.pdf");
        } else if (exportFormat === "excel") {
        const ws = XLSX.utils.aoa_to_sheet(tableData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan");
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buf]), "laporan-custom.xlsx");
        } else if (exportFormat === "csv") {
        const csv = tableData.map((r) => r.join(",")).join("\n");
        saveAs(new Blob([csv], { type: "text/csv" }), "laporan-custom.csv");
        }

        toast({ title: "Berhasil", description: `Dieksport ke ${exportFormat.toUpperCase()}.`, status: "success" });
        setIsExportOpen(false);
    };

    if (isLoading) return <Layout title="Laporan"><Box p={6}>Loading...</Box></Layout>;
    if (error) return <Layout title="Laporan"><Box p={6}>Error: {error.message}</Box></Layout>;

    return (
        <Layout title="Laporan">
        <Box p={4}>
            <Flex justify="space-between" align="center" mb={6}>
            <Heading size="lg">Laporan Data</Heading>
            <HStack spacing={2}>
                <Button size="sm" leftIcon={<FiPlus />} onClick={addItem} colorScheme="blue">
                Tambah Data
                </Button>
                <Button
                size="sm"
                leftIcon={<FiUpload />}
                colorScheme="blue"
                onClick={() => setIsExportOpen(true)}
                isDisabled={selectedItems.filter(i => i.dataType && i.area).length === 0}
                >
                Ekspor
                </Button>
            </HStack>
            </Flex>

            <Box bg="white" borderRadius="lg" shadow="md" p={4} mb={6}>
            <Text fontWeight="medium" mb={3}>Pilih Data untuk Diekspor</Text>
            <VStack align="stretch" spacing={3}>
                {selectedItems.map((item, index) => (
                <HStack key={index} spacing={3}>
                    <Select
                    placeholder="Pilih Jenis Data"
                    value={item.dataType}
                    onChange={(e) => updateItem(index, "dataType", e.target.value)}
                    flex={1}
                    >
                    {DATA_TYPES.map((dt) => (
                        <option key={dt.key} value={dt.key}>{dt.label}</option>
                    ))}
                    </Select>
                    <Select
                    placeholder="Pilih Wilayah"
                    value={item.area}
                    onChange={(e) => updateItem(index, "area", e.target.value)}
                    flex={1}
                    >
                    {AREA_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                    </Select>
                    <IconButton
                    icon={<FiTrash2 />}
                    onClick={() => removeItem(index)}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    />
                </HStack>
                ))}
                {selectedItems.length === 0 && (
                <Text color="gray.500" fontStyle="italic">Belum ada data dipilih</Text>
                )}
            </VStack>
            </Box>

            {/* TABEL SEMUA DATA */}
            <Box bg="white" borderRadius="lg" shadow="md" overflowX="auto">
            <Table variant="simple">
                <Thead>
                <Tr>
                    <Th>Wilayah</Th>
                    {DATA_TYPES.map((dt) => (
                    <Th key={dt.key} textAlign="center">
                        {dt.label}
                    </Th>
                    ))}
                </Tr>
                </Thead>
                <Tbody>
                {AREA_OPTIONS.map((area) => (
                    <Tr key={area.value}>
                    <Td fontWeight="medium">{area.label}</Td>
                    {DATA_TYPES.map((dt) => {
                        const value =
                        area.value === "Nasional"
                            ? stats?.total?.[dt.key] || 0
                            : stats?.byArea?.[`${dt.key}ByArea`]?.[area.value] || 0;
                        const isSelected = selectedItems.some(
                        (i) => i.dataType === dt.key && i.area === area.value
                        );
                        return (
                        <Td key={dt.key} textAlign="center">
                            {isSelected ? (
                            <Badge colorScheme="green">{value}</Badge>
                            ) : (
                            <Text color="gray.600">{value}</Text>
                            )}
                        </Td>
                        );
                    })}
                    </Tr>
                ))}
                </Tbody>
            </Table>
            </Box>

            <Text mt={4} fontSize="sm" color="gray.500">
            Update terakhir: {stats?.lastUpdated}
            </Text>

            {/* MODAL EKSPOR */}
            <Modal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Ekspor Data</ModalHeader>
                <ModalBody>
                <Text mb={4}>
                    Terdapat {selectedItems.filter(i => i.dataType && i.area).length} data yang akan diexport
                </Text>
                <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                </Select>
                </ModalBody>
                <ModalFooter>
                <Button variant="ghost" mr={3} onClick={() => setIsExportOpen(false)}>
                    Batal
                </Button>
                <Button colorScheme="blue" onClick={exportSelected}>
                    Ekspor
                </Button>
                </ModalFooter>
            </ModalContent>
            </Modal>
        </Box>
        </Layout>
    );
}