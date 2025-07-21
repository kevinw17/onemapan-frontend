import {
    Box,
    Button,
    Flex,
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

const AddFotangPage = () => {
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [localities, setLocalities] = useState([]);
    const [templeLocations, setTempleLocations] = useState([]);
    const [locationId, setLocationId] = useState(null);
    const [showLocationForm, setShowLocationForm] = useState(true);
    const [formKey, setFormKey] = useState(0);

    const toast = useToast();
    const router = useRouter();

    const locationSchema = Yup.object().shape({
        location_name: Yup.string().required("Nama Vihara wajib diisi"),
        area: Yup.string().required("Korda Wilayah wajib dipilih"),
        country_iso: Yup.string().required("Kode Negara wajib dipilih"),
        province: Yup.string().required("Provinsi wajib diisi"),
        city: Yup.string().required("Kota wajib diisi"),
    });

    useEffect(() => {
        axiosInstance.get("/profile/location/provinces")
        .then((res) => setProvinces(res.data))
        .catch((err) => console.error("Gagal fetch provinces:", err));

        axiosInstance.get("/profile/location?type=Temple")
        .then((res) => setTempleLocations(res.data || []))
        .catch((err) => console.error("Gagal fetch lokasi vihara:", err));
    }, []);

    const handleProvinceChange = async (e, setFieldValue) => {
        const provinceId = e.target.value;
        setFieldValue("province", provinceId);
        setFieldValue("city", "");
        setFieldValue("district", "");
        setFieldValue("locality", "");
        setCities([]);
        setDistricts([]);
        setLocalities([]);

        if (!provinceId) return;

        try {
        const res = await axiosInstance.get(`/profile/location/cities?provinceId=${provinceId}`);
        setCities(res.data);
        } catch (err) {
        console.error("Gagal fetch cities:", err);
        }
    };

    const handleCityChange = async (e, setFieldValue) => {
        const cityId = e.target.value;
        setFieldValue("city", cityId);
        setFieldValue("district", "");
        setFieldValue("locality", "");
        setDistricts([]);
        setLocalities([]);

        if (!cityId) return;

        try {
        const res = await axiosInstance.get(`/profile/location/districts?cityId=${cityId}`);
        setDistricts(res.data);
        } catch (err) {
        console.error("Gagal fetch districts:", err);
        }
    };

    const handleDistrictChange = async (e, setFieldValue) => {
        const districtId = e.target.value;
        setFieldValue("district", districtId);
        setFieldValue("locality", "");
        setLocalities([]);

        if (!districtId) return;

        try {
        const res = await axiosInstance.get(`/profile/location/localities?districtId=${districtId}`);
        setLocalities(res.data);
        } catch (err) {
        console.error("Gagal fetch localities:", err);
        }
    };

    const handleSubmitFotang = async (values) => {
        const payload = {
            location_name: values.location_name,
            location_mandarin_name: values.location_mandarin_name,
            area: values.area,
            country_iso: values.country_iso,
            locality: {
                connect: { id: Number(values.locality) }
            },
            street: values.street,
            postal_code: values.postal_code,
        };

        try {
            await axiosInstance.post("/fotang", payload);
            toast({
                title: "Fotang berhasil ditambahkan",
                status: "success",
                isClosable: true,
                duration: 3000,
            });
            router.push("/qiudao/addQiudao");
        } catch (err) {
            toast({
                title: "Gagal menyimpan data Fotang",
                description:
                    typeof err?.response?.data === "string"
                        ? err.response.data
                        : err?.response?.data?.message || "Terjadi kesalahan",
                status: "error",
                isClosable: true,
            });
        }
    };

    return (
        <Layout title="Tambah Data Fotang">
            <Heading size="lg" px={4} mb={4}>Tambah Data Fotang</Heading>

            <Box maxW="xl" p={4}>
                {showLocationForm && !locationId && (
                <Formik
                        initialValues={{
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
                        onSubmit={handleSubmitFotang}
                    >
                        {({ values, handleChange, handleSubmit, touched, errors, setFieldValue }) => (
                            <Form onSubmit={handleSubmit}>
                                <VStack spacing={4} align="stretch">
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
                                        <Select name="area" placeholder="Pilih Wilayah" value={values.area} onChange={handleChange}>
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

                                    <Button type="submit" colorScheme="blue">Simpan</Button>
                                </VStack>
                            </Form>
                        )}
                    </Formik>
                )}
            </Box>
            </Layout>
    );
};

export default AddFotangPage;
