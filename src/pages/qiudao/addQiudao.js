import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Select,
    SimpleGrid,
    Text,
    VStack,
    useToast,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout";
import { axiosInstance } from "@/lib/axios";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { jwtDecode } from "jwt-decode";

const AddQiudaoPage = () => {
    const [dianChuanShis, setDianChuanShis] = useState([]);
    const [allTemples, setAllTemples] = useState([]);
    const [displayTemples, setDisplayTemples] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState("");

    const [userScope, setUserScope] = useState("self");
    const [userFotangId, setUserFotangId] = useState(null);
    const [userArea, setUserArea] = useState(null);

    const setFieldValueRef = useRef(null);

    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
        try {
            const decoded = jwtDecode(token);
            setUserScope(decoded.scope || "self");
            setUserFotangId(decoded.fotang_id || null);
            setUserArea(decoded.area || null);
        } catch (err) {
            console.error("Token decode error:", err);
        }
        }
    }, []);

    useEffect(() => {
        const fetchDianChuanShis = async () => {
        try {
            const res = await axiosInstance.get("/dianchuanshi");
            setDianChuanShis(res.data || []);
        } catch (err) {
            console.error("Gagal fetch Pandita:", err);
        }
        };

        const fetchProvinces = async () => {
        try {
            const res = await axiosInstance.get("/profile/location/provinces");
            setProvinces(res.data || []);
        } catch (err) {
            console.error("Gagal fetch provinsi:", err);
        }
        };

        const fetchTemples = async () => {
        try {
            const res = await axiosInstance.get("/fotang");
            const temples = res.data || [];
            setAllTemples(temples);

            let filtered = temples;
            if (userScope === "fotang" && userFotangId) {
            filtered = temples.filter((t) => t.fotang_id === userFotangId);
            } else if (userScope === "wilayah" && userArea) {
            filtered = temples.filter((t) => t.area === userArea);
            }
            setDisplayTemples(filtered);
        } catch (err) {
            console.error("Gagal fetch vihara:", err);
        }
        };

        fetchDianChuanShis();
        fetchProvinces();
        fetchTemples();
    }, [userScope, userFotangId, userArea]);

    const finalTemples = selectedProvince
        ? displayTemples.filter((t) => {
            const loc = t.locality;
            if (!loc || !loc.district || !loc.district.city) return false;
            return loc.district.city.provinceId === Number(selectedProvince);
        })
        : displayTemples;

    useEffect(() => {
        if (userScope === "fotang" && finalTemples.length === 1 && setFieldValueRef.current) {
        const loc = finalTemples[0];
        const provId = loc?.locality?.district?.city?.province?.id;
        if (provId) {
            setSelectedProvince(String(provId));
            setFieldValueRef.current("qiu_dao_location_id", String(loc.fotang_id));
        }
        }
    }, [finalTemples, userScope]);

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

    const handleSubmit = async (values) => {
        try {
        await axiosInstance.post("/profile/qiudao", {
            ...values,
            qiu_dao_location_id: Number(values.qiu_dao_location_id),
            dian_chuan_shi_id: values.dian_chuan_shi_id ? Number(values.dian_chuan_shi_id) : null,
        });
        toast({ title: "Berhasil menambahkan Data QiuDao", status: "success", isClosable: true });
        router.push("/qiudao");
        } catch (err) {
        const msg = err?.response?.data || "Terjadi kesalahan";
        toast({
            title: "Gagal menambahkan Data QiuDao",
            description: typeof msg === "string" ? msg : "Terjadi kesalahan",
            status: "error",
            isClosable: true,
        });
        }
    };

    return (
        <Layout title="Tambah QiuDao">
        <Heading size="md" p={4}>Penambahan Data QiuDao Baru</Heading>
        <Heading size="sm" color="gray.600" p={4}>Data qiudao</Heading>

        <Box w="full" p={4}>
            <Formik
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
            onSubmit={handleSubmit}
            >
            {({ values, handleChange, touched, errors, setFieldValue }) => {
                setFieldValueRef.current = setFieldValue;

                return (
                <Form>
                    <VStack spacing={6} align="stretch">

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                        <FormLabel>Nama QiuDao</FormLabel>
                        <Input name="qiu_dao_name" value={values.qiu_dao_name} onChange={handleChange} />
                        </FormControl>
                        <FormControl>
                        <FormLabel>Nama Mandarin QiuDao</FormLabel>
                        <Input name="qiu_dao_mandarin_name" value={values.qiu_dao_mandarin_name} onChange={handleChange} />
                        </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl isRequired={userScope !== "fotang"}>
                        <FormLabel>Pilih Provinsi Lokasi Qiudao</FormLabel>
                        <Select
                            value={selectedProvince}
                            onChange={(e) => {
                            setSelectedProvince(e.target.value);
                            setFieldValue("qiu_dao_location_id", "");
                            }}
                            placeholder={
                            userScope === "fotang" && finalTemples.length === 1
                                ? finalTemples[0]?.locality?.district?.city?.province?.name || "Tidak ada provinsi"
                                : "Pilih Provinsi"
                            }
                            isDisabled={userScope === "fotang"}
                            bg="white"
                            borderColor="gray.500"
                            color="inherit"
                            fontWeight={userScope === "fotang" ? "semibold" : "normal"}
                        >
                            {userScope === "fotang" && finalTemples.length === 1 ? (
                            <option value={finalTemples[0]?.locality?.district?.city?.province?.id}>
                                {finalTemples[0]?.locality?.district?.city?.province?.name}
                            </option>
                            ) : (
                            [...new Set(
                                displayTemples
                                .map((t) => t.locality?.district?.city?.province)
                                .filter(Boolean)
                                .map((prov) => JSON.stringify({ id: prov.id, name: prov.name }))
                            )]
                                .map((s) => JSON.parse(s))
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((prov) => (
                                <option key={prov.id} value={prov.id}>
                                    {prov.name}
                                </option>
                                ))
                            )}
                        </Select>
                        </FormControl>

                        <FormControl isRequired>
                        <FormLabel>Lokasi Vihara</FormLabel>
                        <Select
                            name="qiu_dao_location_id"
                            value={values.qiu_dao_location_id}
                            onChange={handleChange}
                            placeholder={
                            userScope === "fotang" && finalTemples.length === 1
                                ? (() => {
                                    const l = finalTemples[0];
                                    return [l.location_name, l.location_mandarin_name]
                                    .filter(Boolean)
                                    .join(" (") + (l.location_mandarin_name ? ")" : "");
                                })()
                                : "Pilih Lokasi Vihara"
                            }
                            isDisabled={userScope === "fotang"}
                            bg={"white"}
                            borderColor={"gray.500"}
                            color={"inherit"}
                            fontWeight={userScope === "fotang" ? "semibold" : "normal"}
                        >
                            {finalTemples.map((loc) => {
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

                        {touched.qiu_dao_location_id && errors.qiu_dao_location_id && (
                            <Text color="red.500" fontSize="sm" mt={1}>
                            {errors.qiu_dao_location_id}
                            </Text>
                        )}
                        </FormControl>
                    </SimpleGrid>

                    <FormControl>
                        <FormLabel>Pilih Pandita</FormLabel>
                        <Select
                        name="dian_chuan_shi_id"
                        value={values.dian_chuan_shi_id}
                        onChange={handleChange}
                        placeholder="Pilih Pandita"
                        >
                        {dianChuanShis.map((dcs) => {
                            const label = [dcs.name, dcs.mandarin_name]
                            .filter(Boolean)
                            .join(" (") + (dcs.mandarin_name ? ")" : "");
                            return (
                            <option key={dcs.id} value={dcs.id}>
                                {label || "Tanpa Nama"}
                            </option>
                            );
                        })}
                        </Select>
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                        <FormLabel>Nama Guru Pengajak</FormLabel>
                        <Input name="yin_shi_qd_name" value={values.yin_shi_qd_name} onChange={handleChange} />
                        </FormControl>
                        <FormControl>
                        <FormLabel>Nama Mandarin Guru Pengajak</FormLabel>
                        <Input name="yin_shi_qd_mandarin_name" value={values.yin_shi_qd_mandarin_name} onChange={handleChange} />
                        </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                        <FormLabel>Nama Guru Penanggung</FormLabel>
                        <Input name="bao_shi_qd_name" value={values.bao_shi_qd_name} onChange={handleChange} />
                        </FormControl>
                        <FormControl>
                        <FormLabel>Nama Mandarin Guru Penanggung</FormLabel>
                        <Input name="bao_shi_qd_mandarin_name" value={values.bao_shi_qd_mandarin_name} onChange={handleChange} />
                        </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl isRequired>
                        <FormLabel>Tahun Lunar (岁次)</FormLabel>
                        <Input name="lunar_sui_ci_year" value={values.lunar_sui_ci_year} onChange={handleChange} />
                        {touched.lunar_sui_ci_year && errors.lunar_sui_ci_year && (
                            <Text color="red.500" fontSize="sm">{errors.lunar_sui_ci_year}</Text>
                        )}
                        </FormControl>
                        <FormControl isRequired>
                        <FormLabel>Bulan Lunar</FormLabel>
                        <Input name="lunar_month" value={values.lunar_month} onChange={handleChange} />
                        {touched.lunar_month && errors.lunar_month && (
                            <Text color="red.500" fontSize="sm">{errors.lunar_month}</Text>
                        )}
                        </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl isRequired>
                        <FormLabel>Tanggal Lunar</FormLabel>
                        <Input name="lunar_day" value={values.lunar_day} onChange={handleChange} />
                        {touched.lunar_day && errors.lunar_day && (
                            <Text color="red.500" fontSize="sm">{errors.lunar_day}</Text>
                        )}
                        </FormControl>
                        <FormControl isRequired>
                        <FormLabel>Jam Lunar (时辰)</FormLabel>
                        <Input name="lunar_shi_chen_time" value={values.lunar_shi_chen_time} onChange={handleChange} />
                        {touched.lunar_shi_chen_time && errors.lunar_shi_chen_time && (
                            <Text color="red.500" fontSize="sm">{errors.lunar_shi_chen_time}</Text>
                        )}
                        </FormControl>
                    </SimpleGrid>

                    <Button type="submit" colorScheme="green" size="lg" mt={6}>
                        Simpan Data QiuDao
                    </Button>
                    </VStack>
                </Form>
                );
            }}
            </Formik>
        </Box>
        </Layout>
    );
};

export default AddQiudaoPage;