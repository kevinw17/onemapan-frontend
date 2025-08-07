import {
    Box,
    Button,
    Input,
    Select,
    VStack,
    Text,
    Spinner,
    FormControl,
    FormLabel,
    Grid,
    GridItem,
    Flex,
    Heading,
    useToast,
} from "@chakra-ui/react";
import Layout from "@/components/layout";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { useRouter } from "next/router";

export default function EditQiudao() {
    const router = useRouter();
    const { qiuDaoId } = router.query;
    const [selectedQiudao, setSelectedQiudao] = useState(null);
    const [formData, setFormData] = useState({});
    const [dianChuanList, setDianChuanList] = useState([]);
    const [templeLocations, setTempleLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    // Mengambil data Qiudao, dianchuanshi, dan fotang
    useEffect(() => {
        if (qiuDaoId) {
            setIsLoading(true);
            Promise.all([
                axiosInstance
                    .get(`/profile/qiudao/${qiuDaoId}`)
                    .then((res) => {
                        const data = res.data;
                        console.log("API Response:", data); // Debug respons API
                        setSelectedQiudao(data);
                        setFormData({
                            ...data,
                            qiu_dao_location_id: data.qiu_dao_location_id || data.qiu_dao_location?.fotang_id || "",
                            dian_chuan_shi_id: data.dian_chuan_shi_id || data.dian_chuan_shi?.id || "",
                        });
                    })
                    .catch((err) => {
                        console.error("Gagal ambil data Qiudao:", err);
                        toast({
                            title: "Gagal memuat data",
                            description: "Tidak dapat mengambil data Qiudao",
                            status: "error",
                            duration: 3000,
                            isClosable: true,
                        });
                    }),
                axiosInstance
                    .get("/dianchuanshi")
                    .then((res) => {
                        console.log("DianChuanList:", res.data); // Debug dianChuanList
                        setDianChuanList(res.data);
                    })
                    .catch((err) => {
                        console.error("Gagal ambil Dian Chuan Shi:", err);
                        toast({
                            title: "Gagal memuat data",
                            description: "Tidak dapat mengambil data Dian Chuan Shi",
                            status: "error",
                            duration: 3000,
                            isClosable: true,
                        });
                    }),
                axiosInstance
                    .get("/fotang")
                    .then((res) => {
                        console.log("TempleLocations:", res.data); // Debug templeLocations
                        setTempleLocations(res.data || []);
                    })
                    .catch((err) => {
                        console.error("Gagal ambil lokasi vihara:", err);
                        toast({
                            title: "Gagal memuat data",
                            description: "Tidak dapat mengambil data lokasi vihara",
                            status: "error",
                            duration: 3000,
                            isClosable: true,
                        });
                    }),
            ]).finally(() => setIsLoading(false));
        }
    }, [qiuDaoId, toast]);

    // Menangani perubahan input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Menangani perubahan select untuk qiu_dao_location_id dan dian_chuan_shi_id
    const handleSelectChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value,
        });
    };

    // Menangani submit form
    const handleSubmit = async () => {
        const {
            qiu_dao_name,
            qiu_dao_mandarin_name,
            yin_shi_qd_name,
            yin_shi_qd_mandarin_name,
            bao_shi_qd_name,
            bao_shi_qd_mandarin_name,
            lunar_sui_ci_year,
            lunar_month,
            lunar_day,
            lunar_shi_chen_time,
            qiu_dao_location_id,
            dian_chuan_shi_id,
        } = formData;

        const qiuDaoLocationId = parseInt(qiu_dao_location_id || 0);
        const dianChuanShiId = parseInt(dian_chuan_shi_id || 0);

        // Validasi
        if (!qiuDaoLocationId || isNaN(qiuDaoLocationId)) {
            toast({
                title: "Lokasi Qiudao tidak valid",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        if (!dianChuanShiId || isNaN(dianChuanShiId)) {
            toast({
                title: "Pandita tidak valid",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const payload = {
            qiu_dao_name,
            qiu_dao_mandarin_name,
            yin_shi_qd_name,
            yin_shi_qd_mandarin_name,
            bao_shi_qd_name,
            bao_shi_qd_mandarin_name,
            lunar_sui_ci_year,
            lunar_month,
            lunar_day,
            lunar_shi_chen_time,
            qiu_dao_location_id: qiuDaoLocationId,
            dian_chuan_shi_id: dianChuanShiId,
        };

        try {
            await axiosInstance.patch(`/profile/qiudao/${qiuDaoId}`, payload);
            toast({
                title: "Data berhasil disimpan",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            router.push("/qiudao");
        } catch (err) {
            const errorData = err?.response?.data;
            const errorMessage =
                typeof errorData === "string"
                    ? errorData
                    : errorData?.message || "Terjadi kesalahan saat menyimpan";
            toast({
                title: "Gagal menyimpan",
                description: errorMessage,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // Menangani pembatalan
    const handleCancel = () => {
        router.push("/qiudao");
    };

    return (
        <Layout title="Edit Qiudao">
            <Box p={2}>
                <VStack spacing={4} align="stretch">
                    <Text fontSize="xl" fontWeight="bold">
                        Pengubahan Data Qiudao
                    </Text>
                    {isLoading && <Text>Loading data...</Text>}
                    {formData && !isLoading && (
                        <VStack spacing={4} align="stretch">
                            <Heading size="md" color="gray" py={2}>
                                Data Qiudao
                            </Heading>
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                {[
                                    { label: "Nama Qiudao", field: "qiu_dao_name" },
                                    { label: "Nama Mandarin Qiudao", field: "qiu_dao_mandarin_name" },
                                    { label: "Nama Guru Pengajak", field: "yin_shi_qd_name" },
                                    { label: "Nama Mandarin Guru Pengajak", field: "yin_shi_qd_mandarin_name" },
                                    { label: "Nama Guru Penanggung", field: "bao_shi_qd_name" },
                                    { label: "Nama Mandarin Guru Penanggung", field: "bao_shi_qd_mandarin_name" },
                                ].map(({ label, field }) => (
                                    <GridItem key={field}>
                                        <FormControl>
                                            <FormLabel fontWeight="bold">{label}</FormLabel>
                                            <Input
                                                value={formData[field] || "-"}
                                                onChange={handleInputChange}
                                                name={field}
                                                placeholder={label}
                                            />
                                        </FormControl>
                                    </GridItem>
                                ))}
                            </Grid>

                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Lokasi Qiudao</FormLabel>
                                        <Select
                                            placeholder="Pilih Lokasi Qiudao"
                                            value={formData.qiu_dao_location_id || ""}
                                            onChange={(e) =>
                                                handleSelectChange("qiu_dao_location_id", e.target.value)
                                            }
                                        >
                                            {templeLocations.map((location) => (
                                                <option
                                                    key={location.fotang_id}
                                                    value={location.fotang_id}
                                                >
                                                    {location.location_name?.trim() || "(Tanpa Nama)"} (
                                                    {location.location_mandarin_name?.trim() || "无名"})
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </GridItem>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Pandita</FormLabel>
                                        <Select
                                            placeholder="Pilih Pandita"
                                            value={formData.dian_chuan_shi_id || ""}
                                            onChange={(e) =>
                                                handleSelectChange("dian_chuan_shi_id", e.target.value)
                                            }
                                        >
                                            {dianChuanList.map((dianChuan) => (
                                                <option
                                                    key={dianChuan.id}
                                                    value={dianChuan.id}
                                                >
                                                    {dianChuan.name?.trim() || "(Tanpa Nama)"} (
                                                    {dianChuan.mandarin_name?.trim() || "无名"})
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </GridItem>
                            </Grid>

                            <Heading size="md" color="gray" pt={4} pb={2}>
                                Tanggal Qiudao
                            </Heading>
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                {[
                                    { label: "Tahun Lunar Sui Ci", field: "lunar_sui_ci_year" },
                                    { label: "Bulan Lunar", field: "lunar_month" },
                                    { label: "Hari Lunar", field: "lunar_day" },
                                    { label: "Waktu Shi Chen Lunar", field: "lunar_shi_chen_time" },
                                ].map(({ label, field }) => (
                                    <GridItem key={field}>
                                        <FormControl>
                                            <FormLabel fontWeight="bold">{label}</FormLabel>
                                            <Input
                                                value={formData[field] || ""}
                                                onChange={handleInputChange}
                                                name={field}
                                                placeholder={label}
                                            />
                                        </FormControl>
                                    </GridItem>
                                ))}
                            </Grid>

                            <Flex gap={4} mt={4}>
                                <Button colorScheme="gray" flex="1" onClick={handleCancel}>
                                    Batal
                                </Button>
                                <Button colorScheme="blue" flex="1" onClick={handleSubmit}>
                                    Submit
                                </Button>
                            </Flex>
                        </VStack>
                    )}
                    {!isLoading && !formData && <Text>Data tidak ditemukan.</Text>}
                </VStack>
            </Box>
        </Layout>
    );
}