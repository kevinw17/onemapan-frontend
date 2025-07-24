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
import { useFetchQiudaos } from "@/features/qiudao/useFetchQiudaos";

const locationSchema = Yup.object().shape({
    location_name: Yup.string().required("Nama Lokasi wajib diisi"),
    country_iso: Yup.string().required("Kode Negara wajib dipilih"),
    province: Yup.string().required("Provinsi wajib diisi"),
    city: Yup.string().required("Kota wajib diisi"),
});

const userSchema = Yup.object().shape({
    qiu_dao_id: Yup.number().required("QiuDao ID wajib diisi"),
    full_name: Yup.string().required("Nama Lengkap wajib diisi"),
    mandarin_name: Yup.string(),
    is_qing_kou: Yup.boolean().required("Status Qing Kou wajib diisi"),
    gender: Yup.string().oneOf(["Male", "Female"]).required("Jenis Kelamin wajib diisi"),
    blood_type: Yup.string(),
    place_of_birth: Yup.string().required("Tempat Lahir wajib diisi"),
    date_of_birth: Yup.date().required("Tanggal Lahir wajib diisi"),
    date_of_death: Yup.date(),
    id_card_number: Yup.string(),
    phone_number: Yup.string().required("Nomor HP wajib diisi"),
    email: Yup.string().email("Email tidak valid"),
    marital_status: Yup.string(),
    last_education_level: Yup.string(),
    education_major: Yup.string(),
    job_name: Yup.string(),
    spiritual_status: Yup.string()
        .oneOf(["QianRen", "DianChuanShi", "TanZhu", "FoYuan", "BanShiYuan", "QianXian", "DaoQin"], "Status spiritual tidak valid")
        .required("Status spiritual wajib diisi"),
});

export default function AddUmatPage() {
    const [step, setStep] = useState(1);
    const [domicileId, setDomicileId] = useState(null);
    const [idCardLocationId, setIdCardLocationId] = useState(null);
    const { data: qiudaoList, isLoading, isError } = useFetchQiudaos({
        page: 1,
        limit: 9999,
        search: "",
        searchField: "qiu_dao_mandarin_name"
    });
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [localities, setLocalities] = useState([]);
    const toast = useToast();
    const router = useRouter();

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

    const handleSubmitLocation = async (values, label) => {
        const endpoint =
            label === "Domisili"
            ? "/profile/location/domicile"
            : "/profile/location/id-card";

        try {
            const payload = {
                ...values,
                localityId: Number(values.locality),
            };

            const res = await axiosInstance.post(endpoint, payload);

            if (label === "Domisili") {
                const domicileId = res.data?.domicile_location_id;
                setDomicileId(domicileId)
                setStep(2);
            } else if (label === "KTP") {
                const idCardLocationId = res.data?.id_card_location_id;
                setIdCardLocationId(idCardLocationId)
                setStep(3);
            }

            toast({
                title: `Lokasi ${label} berhasil ditambahkan`,
                status: "success",
                isClosable: true,
                duration: 3000,
            });
        } catch (err) {
            toast({
                title: `Gagal menyimpan lokasi ${label}`,
                description: err?.response?.data || "Terjadi kesalahan",
                status: "error",
                isClosable: true,
            });
        }
    };

    const handleSubmitUser = async (values) => {
        try {
            await axiosInstance.post("/profile/user", {
                ...values,
                domicile_location_id: domicileId,
                id_card_location_id: idCardLocationId,
            });

            toast({
                title: "Data umat berhasil ditambahkan",
                status: "success",
                isClosable: true,
            });

            router.push("/umat");
        } catch (err) {
            toast({
                title: "Gagal menyimpan data umat",
                description: err?.response?.data || "Terjadi kesalahan",
                status: "error",
                isClosable: true,
            });
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

    const renderLocationForm = (type) => (
        <Formik
        initialValues={{
            location_name: "",
            location_mandarin_name: "",
            country_iso: "",
            province: "",
            city: "",
            district: "",
            locality: "",
            street: "",
            postal_code: "",
        }}
        validationSchema={locationSchema}
        onSubmit={(values) => handleSubmitLocation(values, type)}
        >
        {({ values, handleChange, handleSubmit, touched, errors, setFieldValue }) => (
            <Form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
                <Heading size="md">Tambah Lokasi {type}</Heading>
                <FormControl isRequired>
                <FormLabel>Nama Lokasi</FormLabel>
                <Input name="location_name" value={values.location_name} onChange={handleChange} />
                {touched.location_name && errors.location_name && (
                    <Text color="red.500" fontSize="sm">{errors.location_name}</Text>
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
    );

    const renderUserForm = () => (
        
        <Formik
            initialValues={{
                qiu_dao_id: "",
                full_name: "",
                mandarin_name: "",
                is_qing_kou: false,
                gender: "",
                blood_type: "",
                place_of_birth: "",
                date_of_birth: "",
                date_of_death: "",
                id_card_number: "",
                phone_number: "",
                email: "",
                marital_status: "",
                last_education_level: "",
                education_major: "",
                job_name: "",
                spiritual_status: "",
            }}
            validationSchema={userSchema}
            onSubmit={handleSubmitUser}
        >
            {({ values, handleChange, handleSubmit, setFieldValue, touched, errors }) => (
            <Form onSubmit={handleSubmit}>
                <VStack spacing={4} align="stretch">
                <Heading size="md">Form Data Umat</Heading>

                <FormControl isRequired>
                    <FormLabel>Nama QiuDao</FormLabel>
                    <Select
                        name="qiu_dao_id"
                        placeholder={isLoading ? "Memuat..." : "Pilih QiuDao"}
                        value={values.qiu_dao_id}
                        onChange={(e) => setFieldValue("qiu_dao_id", parseInt(e.target.value))}
                        isDisabled={isLoading || isError}
                    >
                        {qiudaoList?.data.map((qd) => (
                            <option key={qd.qiu_dao_id} value={qd.qiu_dao_id}>
                                [{qd.qiu_dao_id}]{" "}
                                {qd.qiu_dao_name?.trim()
                                ? `${qd.qiu_dao_name} - ${qd.qiu_dao_mandarin_name}`
                                : qd.qiu_dao_mandarin_name}
                            </option>
                            ))}
                    </Select>
                    {touched.qiu_dao_id && errors.qiu_dao_id && (
                        <Text color="red.500" fontSize="sm">{errors.qiu_dao_id}</Text>
                    )}
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <Input name="full_name" value={values.full_name} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel>Nama Mandarin</FormLabel>
                    <Input name="mandarin_name" value={values.mandarin_name} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Status Spiritual</FormLabel>
                    <Select
                        name="spiritual_status"
                        placeholder="Pilih Status Spiritual"
                        value={values.spiritual_status}
                        onChange={handleChange}
                    >
                        <option value="QianRen">Qian Ren / Sesepuh</option>
                        <option value="DianChuanShi">Dian Chuan Shi / Pandita</option>
                        <option value="TanZhu">Tan Zhu / Pandita Madya</option>
                        <option value="FoYuan">Fo Yuan / Buddha Siswa</option>
                        <option value="BanShiYuan">Ban Shi Yuan / Pelaksana Vihara</option>
                        <option value="QianXian">Qian Xian / Aktivis</option>
                        <option value="DaoQin">Dao Qin / Umat</option>
                    </Select>
                    {touched.spiritual_status && errors.spiritual_status && (
                        <Text color="red.500" fontSize="sm">{errors.spiritual_status}</Text>
                    )}
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Sudah berikrar vegetarian?</FormLabel>
                    <Select name="is_qing_kou" value={values.is_qing_kou} onChange={(e) => setFieldValue("is_qing_kou", e.target.value === "true")}>
                    <option value="true">Sudah berikrar vegetarian</option>
                    <option value="false">Belum berikrar vegetarian</option>
                    </Select>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <Select name="gender" placeholder="Pilih Gender" value={values.gender} onChange={handleChange}>
                    <option value="Male">Pria</option>
                    <option value="Female">Wanita</option>
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel>Golongan Darah</FormLabel>
                    <Select name="blood_type" value={values.blood_type} onChange={handleChange}>
                    <option value="">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    </Select>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Tempat Lahir</FormLabel>
                    <Input name="place_of_birth" value={values.place_of_birth} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Tanggal Lahir</FormLabel>
                    <Input name="date_of_birth" type="date" value={values.date_of_birth} onChange={handleChange} />
                </FormControl>

                <FormControl hidden="true">
                    <FormLabel>Tanggal Wafat</FormLabel>
                    <Input name="date_of_death" type="date" value={values.date_of_death} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel>No. KTP</FormLabel>
                    <Input name="id_card_number" value={values.id_card_number} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>No. HP</FormLabel>
                    <Input name="phone_number" value={values.phone_number} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input name="email" type="email" value={values.email} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel>Status pernikahan</FormLabel>
                    <Select name="marital_status" value={values.marital_status} onChange={handleChange}>
                    <option value="">-</option>
                    <option value="Not_Married">Belum menikah</option>
                    <option value="Married">Sudah menikah</option>
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel>Pendidikan Terakhir</FormLabel>
                    <Input name="last_education_level" value={values.last_education_level} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel>Jurusan</FormLabel>
                    <Input name="education_major" value={values.education_major} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel>Pekerjaan</FormLabel>
                    <Input name="job_name" value={values.job_name} onChange={handleChange} />
                </FormControl>

                <Button type="submit" colorScheme="green">Simpan</Button>
                </VStack>
            </Form>
            )}
        </Formik>
    );

    return (
        <Layout title="Umat">
        <Box maxW="xl" ml={0} p={4}>
            {step === 1 && renderLocationForm("Domisili")}
            {step === 2 && renderLocationForm("KTP")}
            {step === 3 && renderUserForm()}
        </Box>
        </Layout>
    );
}
