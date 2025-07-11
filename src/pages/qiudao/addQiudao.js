import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Select,
    Text,
    VStack,
    useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout";
import { axiosInstance } from "@/lib/axios";
import { Form, Formik } from "formik";
import * as Yup from "yup";

const AddQiudaoPage = () => {
    const [step, setStep] = useState(1);
    const [qiudaoFormKey, setQiudaoFormKey] = useState(0);
    const [locationId, setLocationId] = useState(null);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [localities, setLocalities] = useState([]);
    const [dianChuanShis, setDianChuanShis] = useState([]);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res = await axiosInstance.get("/profile/location/provinces");
                console.log("Provinces fetched:", res.data);
                setProvinces(res.data);
            } catch (err) {
                console.error("Gagal fetch provinces:", err);
            }
        };
        fetchProvinces();
    }, []);

    useEffect(() => {
        const fetchDianChuanShis = async () => {
            try {
                const res = await axiosInstance.get("/dianchuanshi");
                setDianChuanShis(res.data);
            } catch (err) {
                console.error("Gagal fetch Dian Chuan Shi:", err);
            }
        };
        fetchDianChuanShis();
    }, []);

    const locationSchema = Yup.object().shape({
        location_name: Yup.string().required("Nama Vihara wajib diisi"),
        area: Yup.string().required("Korda Wilayah wajib dipilih"),
        country_iso: Yup.string().required("Kode Negara wajib dipilih"),
        province: Yup.string().required("Provinsi wajib diisi"),
        city: Yup.string().required("Kota wajib diisi"),
    });

    const qiudaoSchema = Yup.object().shape({
        qiu_dao_name: Yup.string().nullable(),
        qiu_dao_mandarin_name: Yup.string().nullable(),
        dian_chuan_shi_name: Yup.string().nullable(),
        dian_chuan_shi_mandarin_name: Yup.string().nullable(),
        yin_shi_qd_name: Yup.string().nullable(),
        yin_shi_qd_mandarin_name: Yup.string().nullable(),
        bao_shi_qd_name: Yup.string().nullable(),
        bao_shi_qd_mandarin_name: Yup.string().nullable(),
        lunar_sui_ci_year: Yup.string().required("Tahun wajib diisi"),
        lunar_month: Yup.string().required("Bulan wajib diisi"),
        lunar_day: Yup.string().required("Tanggal wajib diisi"),
        lunar_shi_chen_time: Yup.string().required("Jam wajib diisi"),
    })

    const toast = useToast();
    const router = useRouter();

    const handleSubmitLocation = async (values) => {
        const payload = {
            ...values,
            localityId: Number(values.locality),
        };
        
        try {
            const res = await axiosInstance.post("/profile/location/qiudao", payload);
            const locationId = res.data?.qiu_dao_location_id;
            setLocationId(locationId);
            setQiudaoFormKey(prev => prev + 1);
            setStep(2);

            toast({
                title: "Lokasi Qiudao berhasil ditambahkan",
                status: "success",
                isClosable: true,
                duration: 3000,
            });
            } catch (err) {
            toast({
                title: "Gagal menyimpan lokasi",
                description: err?.response?.data || "Terjadi kesalahan",
                status: "error",
                isClosable: true,
            });
        }
    };

    const handleSubmitQiudao = async (values) => {
        try {
            await axiosInstance.post("/profile/qiudao", {
                ...values,
                qiu_dao_location_id: locationId,
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

            formikHelpers.setSubmitting(false);
        }
    };

    const handleProvinceChange = async (e, setFieldValue) => {
        const provinceId = e.target.value;
        console.log("Selected province ID:", provinceId);

        setFieldValue("province", provinceId);
        setFieldValue("city", "");
        setFieldValue("district", "");
        setFieldValue("locality", "");
        setCities([]);
        setDistricts([]);
        setLocalities([]);

        if (!provinceId) return;

        try {
            console.log("Calling /profile/location/cities?provinceId=" + provinceId);
            const res = await axiosInstance.get(`/profile/location/cities?provinceId=${provinceId}`);
            console.log("Cities response:", res.data); // 🧪 Tambahkan ini
        setCities(res.data);
        } catch (error) {
            console.error("Gagal fetch cities:", error); // sudah ada
            console.error("Detail response:", error?.response?.data); // 🆕 tambahkan ini
        }

    };


    const handleCityChange = async (e, setFieldValue) => {
        const cityId = e.target.value;
        console.log("📍 Selected city ID:", cityId);
        setFieldValue("city", cityId);
        setFieldValue("district", "");
        setFieldValue("locality", "");
        setDistricts([]);
        setLocalities([]);

        if (!cityId) return;

        try {
            console.log("Calling /profile/location/districts?cityId=" + cityId);
            const res = await axiosInstance.get(`/profile/location/districts?cityId=${cityId}`);
            console.log("Districts response:", res.data);
            setDistricts(res.data);
        } catch (err) {
            console.error("Gagal fetch districts:", err);
            console.error("Detail:", err?.response?.data);
        }
    };

    const handleDistrictChange = async (e, setFieldValue) => {
        const districtId = e.target.value;
        setFieldValue("district", districtId);
        setFieldValue("locality", "");
        setLocalities([]);

        if (districtId) {
            const res = await axiosInstance.get(`/profile/location/localities?districtId=${districtId}`);
            setLocalities(res.data);
        }
    };

    return (
        <Layout title="Tambah Data QiuDao">
            <Box maxW="xl" ml={0} p={4}>
                <Heading size="lg" mb={8}>
                    {step === 1 ? "Tambah Lokasi QiuDao" : "Tambah Data QiuDao"}
                </Heading>

                {step === 1 ? (
                    <Formik
                        initialValues={{
                            location_type: "Temple",
                            location_name: "",
                            location_mandarin_name: "",
                            area: "",
                            country_iso: "",
                            province: "",
                            city: "",
                            district: "",
                            locality: "",
                            street: "",
                            postal_code: "",
                        }}
                        validationSchema={locationSchema}
                        onSubmit={handleSubmitLocation}
                    >
                        {({ values, handleChange, handleSubmit, touched, errors, setFieldValue }) => (
                            <Form onSubmit={handleSubmit}>
                                <VStack spacing={4} align="stretch">
                                    <FormControl display="none">
                                        <FormLabel>Tipe Lokasi</FormLabel>
                                        <Input value="Temple" isDisabled readOnly />
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel>Nama Vihara</FormLabel>
                                        <Input name="location_name" value={values.location_name} onChange={handleChange} />
                                        {touched.location_name && errors.location_name && (
                                            <Text color="red.500" fontSize="sm">{errors.location_name}</Text>
                                        )}
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Nama Vihara (Mandarin)</FormLabel>
                                        <Input name="location_mandarin_name" value={values.location_mandarin_name} onChange={handleChange} />
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel>Wilayah</FormLabel>
                                        <Select name="area" placeholder="Pilih Korda Wilayah" value={values.area} onChange={handleChange}>
                                            {Array.from({ length: 6 }, (_, i) => (
                                                <option key={i + 1} value={`Korwil_${i + 1}`}>{i + 1}</option>
                                            ))}
                                        </Select>
                                        {touched.area && errors.area && (
                                            <Text color="red.500" fontSize="sm">{errors.area}</Text>
                                        )}
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel>Kode Negara</FormLabel>
                                        <Select name="country_iso" placeholder="Pilih Kode Negara" value={values.country_iso} onChange={handleChange}>
                                            {["IDN", "MYS", "SGP", "HKG", "JPN", "KOR", "AUS"].map(code => (
                                                <option key={code} value={code}>{code}</option>
                                            ))}
                                        </Select>
                                        {touched.country_iso && errors.country_iso && (
                                            <Text color="red.500" fontSize="sm">{errors.country_iso}</Text>
                                        )}
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel>Provinsi</FormLabel>
                                        <Select
                                            name="province"
                                            placeholder="Pilih Provinsi"
                                            value={values.province}
                                            onChange={(e) => handleProvinceChange(e, setFieldValue)}
                                        >
                                            {provinces.map((prov) => (
                                            <option key={prov.id} value={prov.id}>
                                                {prov.name}
                                            </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel>Kota / Kabupaten</FormLabel>
                                        <Select
                                            name="city"
                                            placeholder="Pilih Kota"
                                            value={values.city}
                                            onChange={(e) => handleCityChange(e, setFieldValue)}
                                            isDisabled={!values.province}
                                        >
                                            {cities.map((city) => (
                                            <option key={city.id} value={city.id}>
                                                {city.name}
                                            </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Kecamatan</FormLabel>
                                        <Select
                                            name="district"
                                            placeholder="Pilih Kecamatan"
                                            value={values.district}
                                            onChange={(e) => handleDistrictChange(e, setFieldValue)}
                                            isDisabled={!values.city}
                                        >
                                            {districts.map((district) => (
                                            <option key={district.id} value={district.id}>
                                                {district.name}
                                            </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Kelurahan</FormLabel>
                                        <Select
                                            name="locality"
                                            placeholder="Pilih Kelurahan"
                                            value={values.locality}
                                            onChange={handleChange}
                                            isDisabled={!values.district}
                                        >
                                            {localities.map((locality) => (
                                            <option key={locality.id} value={locality.id}>
                                                {locality.name}
                                            </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Alamat</FormLabel>
                                        <Input name="street" value={values.street} onChange={handleChange} />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Kode Pos</FormLabel>
                                        <Input name="postal_code" value={values.postal_code} onChange={handleChange} />
                                    </FormControl>

                                    <Button type="submit" colorScheme="blue">Selanjutnya</Button>
                                </VStack>
                            </Form>
                        )}
                    </Formik>
                    ) : (
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
                        }}
                        validationSchema={qiudaoSchema}
                        onSubmit={handleSubmitQiudao}
                    >
                        {(formik) => (
                            <Form onSubmit={formik.handleSubmit}>
                                <VStack spacing={4} align="stretch" ml={1}>
                                    <FormControl>
                                        <FormLabel>Nama QiuDao</FormLabel>
                                        <Input name="qiu_dao_name" value={formik.values.qiu_dao_name} onChange={formik.handleChange} />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Nama Mandarin QiuDao</FormLabel>
                                        <Input name="qiu_dao_mandarin_name" value={formik.values.qiu_dao_mandarin_name} onChange={formik.handleChange} />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Pilih Pandita</FormLabel>
                                        <Select
                                            placeholder="Pilih Pandita"
                                            onChange={(e) => {
                                            const selectedId = parseInt(e.target.value);
                                            const selected = dianChuanShis.find(p => p.id === selectedId);
                                            formik.setFieldValue("dian_chuan_shi_id", selectedId);
                                            formik.setFieldValue("dian_chuan_shi_name", selected?.name || "");
                                            formik.setFieldValue("dian_chuan_shi_mandarin_name", selected?.mandarin_name || "");
                                            }}
                                            value={
                                            dianChuanShis.find(p =>
                                                p.name === formik.values.dian_chuan_shi_name &&
                                                p.mandarin_name === formik.values.dian_chuan_shi_mandarin_name
                                            )?.id || ""
                                            }
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

                                    <FormControl>
                                        <FormLabel>Nama Guru Pengajak</FormLabel>
                                        <Input name="yin_shi_qd_name" value={formik.values.yin_shi_qd_name} onChange={formik.handleChange} />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Nama Mandarin Guru Pengajak</FormLabel>
                                        <Input name="yin_shi_qd_mandarin_name" value={formik.values.yin_shi_qd_mandarin_name} onChange={formik.handleChange} />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Nama Guru Penanggung</FormLabel>
                                        <Input name="bao_shi_qd_name" value={formik.values.bao_shi_qd_name} onChange={formik.handleChange} />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Nama Mandarin Guru Penanggung</FormLabel>
                                        <Input name="bao_shi_qd_mandarin_name" value={formik.values.bao_shi_qd_mandarin_name} onChange={formik.handleChange} />
                                    </FormControl>

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

                                    <Button type="submit" colorScheme="green">Simpan</Button>
                                </VStack>
                            </Form>
                        )}
                    </Formik>
                    )}
            </Box>
        </Layout>
    ); 
}

export default AddQiudaoPage;
