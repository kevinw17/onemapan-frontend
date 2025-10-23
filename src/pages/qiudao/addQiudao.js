import {
    Box, Button, FormControl, FormLabel, Heading,
    Input, Select, SimpleGrid, Text, VStack, useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout";
import { axiosInstance } from "@/lib/axios";
import { Form, Formik } from "formik";
import * as Yup from "yup";

const AddQiudaoPage = () => {
    const [qiudaoFormKey, setQiudaoFormKey] = useState(0);
    const [dianChuanShis, setDianChuanShis] = useState([]);
    const [templeLocations, setTempleLocations] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState("");

    useEffect(() => {
        const fetchDianChuanShis = async () => {
            try {
                const res = await axiosInstance.get("/dianchuanshi");
                setDianChuanShis(res.data);
            } catch (err) {
                console.error("Gagal fetch Dian Chuan Shi:", err);
            }
        };
        const fetchProvinces = async () => {
            try {
                const res = await axiosInstance.get("/profile/location/provinces");
                setProvinces(res.data || []);
            } catch (err) {
                console.error("Gagal fetch provinces:", err);
            }
        };
        fetchDianChuanShis();
        fetchProvinces();
    }, []);

    useEffect(() => {
        const fetchTempleLocations = async () => {
            try {
                const res = await axiosInstance.get("/fotang");
                setTempleLocations(res.data || []);
            } catch (err) {
                console.error("Gagal fetch lokasi vihara:", err);
            }
        };
        fetchTempleLocations();
    }, []);

    const qiudaoSchema = Yup.object().shape({
        qiu_dao_name: Yup.string().nullable(),
        qiu_dao_mandarin_name: Yup.string().nullable(),
        dian_chuan_shi_id: Yup.string().nullable(),
        yin_shi_qd_name: Yup.string().nullable(),
        yin_shi_qd_mandarin_name: Yup.string().nullable(),
        bao_shi_qd_name: Yup.string().nullable(),
        bao_shi_qd_mandarin_name: Yup.string().nullable(),
        lunar_sui_ci_year: Yup.string().required("Tahun wajib diisi"),
        lunar_month: Yup.string().required("Bulan wajib diisi"),
        lunar_day: Yup.string().required("Tanggal wajib diisi"),
        lunar_shi_chen_time: Yup.string().required("Jam wajib diisi"),
        qiu_dao_location_id: Yup.string()
            .required("Lokasi Vihara wajib dipilih")
            .test("is-valid-id", "Lokasi tidak valid", (val) => !isNaN(Number(val))),
    });

    const toast = useToast();
    const router = useRouter();

    const handleSubmitQiudao = async (values) => {
        try {
            await axiosInstance.post("/profile/qiudao", {
            ...values,
            qiu_dao_location_id: Number(values.qiu_dao_location_id),
            dian_chuan_shi_id: values.dian_chuan_shi_id ? Number(values.dian_chuan_shi_id) : null,
            });

            toast({
            title: "Berhasil menambahkan Data QiuDao",
            status: "success",
            isClosable: true,
            });
            router.push("/qiudao");
        } catch (err) {
            const errMsg = err?.response?.data || "Terjadi kesalahan";
            toast({
            title: "Gagal menambahkan Data QiuDao",
            description: typeof errMsg === "string" ? errMsg : "Terjadi kesalahan",
            status: "error",
            isClosable: true,
            });
        }
    };

    const filteredTemples = selectedProvince
        ? templeLocations.filter((temple) => {
            const locality = temple.locality;
            if (!locality || !locality.district || !locality.district.city) return false;
            return locality.district.city.provinceId === Number(selectedProvince);
        })
        : templeLocations;

    return (
        <Layout title="Qiudao">
            <Heading size="md" p={4}>Penambahan Data QiuDao Baru</Heading>
            <Heading size="md" color={"gray"} p={4}>Data qiudao</Heading>

            <Box w="full" p={4}>
                <Formik
                    key={qiudaoFormKey}
                    initialValues={{
                        qiu_dao_name: "",
                        qiu_dao_mandarin_name: "",
                        dian_chuan_shi_id: "",
                        yin_shi_qd_name: "",
                        yin_shi_qd_mandarin_name: "",
                        bao_shi_qd_name: "",
                        bao_shi_qd_mandarin_name: "",
                        lunar_sui_ci_year: "",
                        lunar_month: "",
                        lunar_day: "",
                        lunar_shi_chen_time: "",
                        qiu_dao_location_id: "",
                    }}
                    validationSchema={qiudaoSchema}
                    onSubmit={handleSubmitQiudao}
                >
                    {(formik) => (
                        <Form onSubmit={formik.handleSubmit}>
                            <VStack spacing={4} align="stretch">
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl>
                                        <FormLabel>Nama QiuDao</FormLabel>
                                        <Input name="qiu_dao_name" value={formik.values.qiu_dao_name} onChange={formik.handleChange} />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Nama Mandarin QiuDao</FormLabel>
                                        <Input name="qiu_dao_mandarin_name" value={formik.values.qiu_dao_mandarin_name} onChange={formik.handleChange} />
                                    </FormControl>
                                </SimpleGrid>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel>Pilih Provinsi Lokasi Qiudao</FormLabel>
                                        <Select
                                            value={selectedProvince}
                                            onChange={(e) => {
                                                setSelectedProvince(e.target.value);
                                                formik.setFieldValue("qiu_dao_location_id", "");
                                            }}
                                            placeholder="Pilih Provinsi"
                                        >
                                            {provinces.map((province) => (
                                                <option key={province.id} value={province.id}>
                                                    {province.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl isRequired>
                                        <FormLabel>Lokasi Vihara</FormLabel>
                                        <Select
                                            name="qiu_dao_location_id"
                                            value={formik.values.qiu_dao_location_id}
                                            onChange={formik.handleChange}
                                            placeholder="Pilih Lokasi Vihara"
                                            isDisabled={!selectedProvince}
                                        >
                                            {filteredTemples.map((loc) => {
                                                const label = [loc.location_name, loc.location_mandarin_name]
                                                    .filter(Boolean)
                                                    .join(" (") + (loc.location_mandarin_name ? ")" : "");
                                                return (
                                                    <option key={loc.fotang_id} value={String(loc.fotang_id)}>
                                                        {label}
                                                    </option>
                                                );
                                            })}
                                        </Select>
                                        {formik.touched.qiu_dao_location_id && formik.errors.qiu_dao_location_id && (
                                            <Text color="red.500" fontSize="sm">{formik.errors.qiu_dao_location_id}</Text>
                                        )}
                                    </FormControl>
                                </SimpleGrid>

                                <FormControl>
                                    <FormLabel>Pilih Pandita</FormLabel>
                                    <Select
                                        name="dian_chuan_shi_id"
                                        value={formik.values.dian_chuan_shi_id}
                                        onChange={formik.handleChange}
                                        placeholder="Pilih Pandita"
                                    >
                                        {dianChuanShis.map((dcs) => {
                                            const label = (() => {
                                                const name = dcs.name?.trim();
                                                const mandarin = dcs.mandarin_name?.trim();
                                                if (name && mandarin) return `${name} (${mandarin})`;
                                                if (name) return name;
                                                if (mandarin) return mandarin;
                                                return "";
                                            })();
                                            return (
                                                <option key={dcs.id} value={dcs.id}>
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </Select>
                                </FormControl>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl>
                                        <FormLabel>Nama Guru Pengajak</FormLabel>
                                        <Input name="yin_shi_qd_name" value={formik.values.yin_shi_qd_name} onChange={formik.handleChange} />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Nama Mandarin Guru Pengajak</FormLabel>
                                        <Input name="yin_shi_qd_mandarin_name" value={formik.values.yin_shi_qd_mandarin_name} onChange={formik.handleChange} />
                                    </FormControl>
                                </SimpleGrid>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl>
                                        <FormLabel>Nama Guru Penanggung</FormLabel>
                                        <Input name="bao_shi_qd_name" value={formik.values.bao_shi_qd_name} onChange={formik.handleChange} />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Nama Mandarin Guru Penanggung</FormLabel>
                                        <Input name="bao_shi_qd_mandarin_name" value={formik.values.bao_shi_qd_mandarin_name} onChange={formik.handleChange} />
                                    </FormControl>
                                </SimpleGrid>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel>Tahun Lunar (岁次)</FormLabel>
                                        <Input name="lunar_sui_ci_year" value={formik.values.lunar_sui_ci_year} onChange={formik.handleChange} />
                                        {formik.touched.lunar_sui_ci_year && formik.errors.lunar_sui_ci_year && (
                                            <Text color="red.500" fontSize="sm">{formik.errors.lunar_sui_ci_year}</Text>
                                        )}
                                    </FormControl>
                                    <FormControl isRequired>
                                        <FormLabel>Bulan Lunar</FormLabel>
                                        <Input name="lunar_month" value={formik.values.lunar_month} onChange={formik.handleChange} />
                                        {formik.touched.lunar_month && formik.errors.lunar_month && (
                                            <Text color="red.500" fontSize="sm">{formik.errors.lunar_month}</Text>
                                        )}
                                    </FormControl>
                                </SimpleGrid>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel>Tanggal Lunar</FormLabel>
                                        <Input name="lunar_day" value={formik.values.lunar_day} onChange={formik.handleChange} />
                                        {formik.touched.lunar_day && formik.errors.lunar_day && (
                                            <Text color="red.500" fontSize="sm">{formik.errors.lunar_day}</Text>
                                        )}
                                    </FormControl>
                                    <FormControl isRequired>
                                        <FormLabel>Jam Lunar (时辰)</FormLabel>
                                        <Input name="lunar_shi_chen_time" value={formik.values.lunar_shi_chen_time} onChange={formik.handleChange} />
                                        {formik.touched.lunar_shi_chen_time && formik.errors.lunar_shi_chen_time && (
                                            <Text color="red.500" fontSize="sm">{formik.errors.lunar_shi_chen_time}</Text>
                                        )}
                                    </FormControl>
                                </SimpleGrid>

                                <Button type="submit" colorScheme="green" mt={4}>Simpan</Button>
                            </VStack>
                        </Form>
                    )}
                </Formik>
            </Box>
        </Layout>
    ); 
}

export default AddQiudaoPage;