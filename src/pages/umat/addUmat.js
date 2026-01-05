import {
    Box, Button, FormControl, FormLabel, Heading,
    Input, Select, Text, VStack, HStack, useToast,
    RadioGroup, Radio, useDisclosure, Modal, ModalOverlay,
    ModalContent, ModalHeader, ModalBody, ModalFooter, SimpleGrid,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout";
import { axiosInstance } from "@/lib/axios";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { useFetchQiudaos } from "@/features/qiudao/useFetchQiudaos";
import { AsyncSelect } from "chakra-react-select";
import { isNationalRole } from "@/lib/roleUtils";
import { jwtDecode } from "jwt-decode";

const WILAYAH_OPTIONS = [
    { value: "Korwil_1", label: "Wilayah 1" },
    { value: "Korwil_2", label: "Wilayah 2" },
    { value: "Korwil_3", label: "Wilayah 3" },
    { value: "Korwil_4", label: "Wilayah 4" },
    { value: "Korwil_5", label: "Wilayah 5" },
    { value: "Korwil_6", label: "Wilayah 6" },
];

const loadQiuDaoOptions = async (inputValue, callback, toast, area = null) => {
    if (!inputValue || inputValue.length < 2) {
        callback([]);
        return;
    }

    try {
        const params = {
        search: inputValue,
        limit: 20,
        page: 1,
        };

        // KALAU ADA AREA, TAMBAHKAN FILTER AREA KE API
        if (area) {
        params.area = area;
        }

        const [resName, resMandarin] = await Promise.all([
        axiosInstance.get("/profile/qiudao", { params: { ...params, searchField: "qiu_dao_name" } }),
        axiosInstance.get("/profile/qiudao", { params: { ...params, searchField: "qiu_dao_mandarin_name" } }),
        ]);

        const combined = [...(resName.data.data || []), ...(resMandarin.data.data || [])];
        const unique = Array.from(new Map(combined.map(item => [item.qiu_dao_id, item])).values());

        const options = unique.map(item => ({
        value: item.qiu_dao_id,
        label: `${item.qiu_dao_id} - ${item.qiu_dao_name || ""}${item.qiu_dao_mandarin_name ? ` / ${item.qiu_dao_mandarin_name}` : ""}`,
        }));

        callback(options);
    } catch (error) {
        console.error(error);
        toast({ title: "Gagal memuat QiuDao", status: "error" });
        callback([]);
    }
};

const addUmatSchema = Yup.object().shape({
    wilayah: Yup.string().when("$isSuperAdmin", {
        is: true,
        then: (schema) => schema.required("Wilayah wajib dipilih"),
        otherwise: (schema) => schema.optional(),
    }),
    domicile_location_name: Yup.string().required("Wajib diisi"),
    domicile_country_iso: Yup.string().required("Wajib diisi"),
    domicile_province: Yup.string().required("Wajib diisi"),
    domicile_city: Yup.string().required("Wajib diisi"),
    ktp_location_name: Yup.string().required("Wajib diisi"),
    ktp_country_iso: Yup.string().required("Wajib diisi"),
    ktp_province: Yup.string().required("Wajib diisi"),
    ktp_city: Yup.string().required("Wajib diisi"),
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
    const { data: qiudaoResponse } = useFetchQiudaos({
        page: 1,
        limit: 9999,
        search: "",
    });

    const allQiudaos = useMemo(() => {
        if (Array.isArray(qiudaoResponse)) return qiudaoResponse;
        if (qiudaoResponse?.data && Array.isArray(qiudaoResponse.data)) return qiudaoResponse.data;
        return [];
    }, [qiudaoResponse]);

    const [provinces, setProvinces] = useState([]);
    const [domicileCities, setDomicileCities] = useState([]);
    const [domicileDistricts, setDomicileDistricts] = useState([]);
    const [domicileLocalities, setDomicileLocalities] = useState([]);
    const [ktpCities, setKtpCities] = useState([]);
    const [ktpDistricts, setKtpDistricts] = useState([]);
    const [ktpLocalities, setKtpLocalities] = useState([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [userRole, setUserRole] = useState("");
    const [userArea, setUserArea] = useState(null);
    const [userFotangId, setUserFotangId] = useState(null);
    const [selectedWilayah, setSelectedWilayah] = useState(null);
    const [selectedQiuDao, setSelectedQiuDao] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isQiuDaoConfirmed, setIsQiuDaoConfirmed] = useState(false);
    const [isLoadingRole, setIsLoadingRole] = useState(true);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const router = useRouter();

    // Filter berdasarkan wilayah aktif
    const filteredQiudaos = useMemo(() => {
        const activeArea = isSuperAdmin ? selectedWilayah : userArea;

        if (!activeArea) {
        return isSuperAdmin ? [] : allQiudaos;
        }

        return allQiudaos.filter(q => q.qiu_dao_location?.area === activeArea);
    }, [allQiudaos, isSuperAdmin, selectedWilayah, userArea]);

    // Cek role
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
        try {
            const decoded = jwtDecode(token);
            const scope = decoded.scope?.toLowerCase();

            if (scope === "nasional") {
            setIsSuperAdmin(true);
            } else if (decoded.area) {
            setUserArea(decoded.area);
            }
        } catch (err) {
            console.error("Token invalid:", err);
        }
        }
    }, []);

    useEffect(() => {
        const fetchProvinces = async () => {
        try {
            const res = await axiosInstance.get("/profile/location/provinces");
            setProvinces(res.data);
        } catch (err) {
            console.error("Gagal fetch provinces:", err);
        }
        };
        fetchProvinces();
    }, []);

    const loadQiuDaoOptions = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 2) {
            callback([]);
            return;
        }

        const lowerInput = inputValue.toLowerCase();
        const matches = filteredQiudaos.filter(item =>
            item.qiu_dao_name?.toLowerCase().includes(lowerInput) ||
            item.qiu_dao_mandarin_name?.toLowerCase().includes(lowerInput)
        );

        const options = matches.map(item => ({
            value: item.qiu_dao_id,
            label: `${item.qiu_dao_id} - ${item.qiu_dao_name || ""}${item.qiu_dao_mandarin_name ? ` / ${item.qiu_dao_mandarin_name}` : ""}`,
        }));

        callback(options);
    };

    const fetchQiuDaoDetails = async (qiuDaoId) => {
        try {
            const response = await axiosInstance.get(`/profile/qiudao/${qiuDaoId}`);
            setSelectedQiuDao(response.data);
            onOpen();
        } catch (error) {
            toast({
                title: "Gagal memuat detail Qiu Dao",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const checkQiuDaoUsage = async (qiuDaoId) => {
        try {
            const response = await axiosInstance.get(`/profile/user`, {
                params: { qiu_dao_id: qiuDaoId },
            });
            const isUsed = response.data?.data?.some(user => user.qiu_dao_id === qiuDaoId);
            return isUsed;
        } catch (error) {
            toast({
                title: "Gagal memeriksa ketersediaan Qiu Dao",
                description: error.response?.data?.message || "Terjadi kesalahan",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return false;
        }
    };

    const handleQiuDaoConfirm = async (setFieldValue, qiuDaoId) => {
        const isUsed = await checkQiuDaoUsage(qiuDaoId);
        if (isUsed) {
            toast({
                title: "Data qiudao sudah dipakai",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            setFieldValue("qiu_dao_id", "");
            setSelectedQiuDao(null);
            setSelectedOption(null);
            onClose();
        } else {
            setFieldValue("qiu_dao_id", qiuDaoId);
            setFieldValue("full_name", selectedQiuDao.qiu_dao_name || "");
            setFieldValue("mandarin_name", selectedQiuDao.qiu_dao_mandarin_name || "");
            setIsQiuDaoConfirmed(true);
            onClose();
            toast({
                title: "Data qiudao bisa digunakan",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleQiuDaoCancel = (setFieldValue) => {
        setFieldValue("qiu_dao_id", "");
        setSelectedQiuDao(null);
        setSelectedOption(null);
        setIsQiuDaoConfirmed(false);
        onClose();
    };

    const handleSubmitUser = async (values) => {
        try {
            const domicilePayload = {
                location_name: values.domicile_location_name,
                location_mandarin_name: values.domicile_location_mandarin_name,
                country_iso: values.domicile_country_iso,
                province: values.domicile_province,
                city: values.domicile_city,
                district: values.domicile_district,
                localityId: Number(values.domicile_locality),
                street: values.domicile_street,
                postal_code: values.domicile_postal_code,
            };

            const ktpPayload = values.is_same_address === "true" ? domicilePayload : {
                location_name: values.ktp_location_name,
                location_mandarin_name: values.ktp_location_mandarin_name,
                country_iso: values.ktp_country_iso,
                province: values.ktp_province,
                city: values.ktp_city,
                district: values.ktp_district,
                localityId: Number(values.ktp_locality),
                street: values.ktp_street,
                postal_code: values.ktp_postal_code,
            };

            const domicileRes = await axiosInstance.post("/profile/location/domicile", domicilePayload);
            const ktpRes = await axiosInstance.post("/profile/location/id-card", ktpPayload);

            await axiosInstance.post("/profile/user", {
                qiu_dao_id: values.qiu_dao_id,
                full_name: values.full_name,
                mandarin_name: values.mandarin_name,
                is_qing_kou: values.is_qing_kou === "true",
                gender: values.gender,
                blood_type: values.blood_type,
                place_of_birth: values.place_of_birth,
                date_of_birth: values.date_of_birth,
                date_of_death: values.date_of_death,
                id_card_number: values.id_card_number,
                phone_number: values.phone_number,
                email: values.email,
                marital_status: values.marital_status,
                last_education_level: values.last_education_level,
                education_major: values.education_major,
                job_name: values.job_name,
                spiritual_status: values.spiritual_status,
                domicile_location_id: domicileRes.data?.domicile_location_id,
                id_card_location_id: ktpRes.data?.id_card_location_id,
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

    const handleProvinceChange = async (e, setFieldValue, prefix, values, isSameAddress) => {
        const provinceId = e.target.value;
        setFieldValue(`${prefix}_province`, provinceId);
        setFieldValue(`${prefix}_city`, "");
        setFieldValue(`${prefix}_district`, "");
        setFieldValue(`${prefix}_locality`, "");

        if (prefix === "domicile") {
            setDomicileCities([]);
            setDomicileDistricts([]);
            setDomicileLocalities([]);

            if (isSameAddress) {
                setFieldValue("ktp_province", provinceId);
                setFieldValue("ktp_city", "");
                setFieldValue("ktp_district", "");
                setFieldValue("ktp_locality", "");
                setKtpCities([]);
                setKtpDistricts([]);
                setKtpLocalities([]);
            }
        } else {
            setKtpCities([]);
            setKtpDistricts([]);
            setKtpLocalities([]);
        }

        if (!provinceId) return;

        try {
            const res = await axiosInstance.get(`/profile/location/cities?provinceId=${provinceId}`);

            if (prefix === "domicile") {
                setDomicileCities(res.data);

                if (isSameAddress) {
                    setKtpCities(res.data);
                }
            } else {
                setKtpCities(res.data);
            }
        } catch (error) {
            console.error("Gagal fetch cities:", error);
        }
    };

    const handleCityChange = async (e, setFieldValue, prefix, values, isSameAddress) => {
        const cityId = e.target.value;
        setFieldValue(`${prefix}_city`, cityId);
        setFieldValue(`${prefix}_district`, "");
        setFieldValue(`${prefix}_locality`, "");

        if (prefix === "domicile") {
            setDomicileDistricts([]);
            setDomicileLocalities([]);

            if (isSameAddress) {
                setFieldValue("ktp_city", cityId);
                setFieldValue("ktp_district", "");
                setFieldValue("ktp_locality", "");
                setKtpDistricts([]);
                setKtpLocalities([]);
            }
        } else {
            setKtpDistricts([]);
            setKtpLocalities([]);
        }

        if (!cityId) return;

        try {
            const res = await axiosInstance.get(`/profile/location/districts?cityId=${cityId}`);

            if (prefix === "domicile") {
                setDomicileDistricts(res.data);
                if (isSameAddress) {
                setKtpDistricts(res.data);
                }
            } else {
                setKtpDistricts(res.data);
            }
        } catch (err) {
            console.error("Gagal fetch districts:", err);
        }
    };

    const handleDistrictChange = async (e, setFieldValue, prefix, values, isSameAddress) => {
        const districtId = e.target.value;
        setFieldValue(`${prefix}_district`, districtId);
        setFieldValue(`${prefix}_locality`, "");

        if (prefix === "domicile") {
            setDomicileLocalities([]);

            if (isSameAddress) {
                setFieldValue("ktp_district", districtId);
                setFieldValue("ktp_locality", "");
                setKtpLocalities([]);
            }
        } else {
            setKtpLocalities([]);
        }

        if (districtId) {
            try {
                const res = await axiosInstance.get(`/profile/location/localities?districtId=${districtId}`);

                if (prefix === "domicile") {
                    setDomicileLocalities(res.data);

                    if (isSameAddress) {
                        setKtpLocalities(res.data);
                    }
                } else {
                    setKtpLocalities(res.data);
                }
            } catch (err) {
                console.error("Gagal fetch localities:", err);
            }
        }
    };

    const renderUserForm = () => (
        <Formik
            initialValues={{
                domicile_location_name: "",
                domicile_location_mandarin_name: "",
                domicile_country_iso: "",
                domicile_province: "",
                domicile_city: "",
                domicile_district: "",
                domicile_locality: "",
                domicile_street: "",
                domicile_postal_code: "",
                ktp_location_name: "",
                ktp_location_mandarin_name: "",
                ktp_country_iso: "",
                ktp_province: "",
                ktp_city: "",
                ktp_district: "",
                ktp_locality: "",
                ktp_street: "",
                ktp_postal_code: "",
                qiu_dao_id: "",
                full_name: "",
                mandarin_name: "",
                is_qing_kou: "",
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
                wilayah: "",
            }}
            validationSchema={addUmatSchema}
            onSubmit={handleSubmitUser}
        >
        {({ values, handleChange, handleSubmit, setFieldValue, handleBlur, touched, errors }) => (
            <>
                <Form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch" w="100%">
                        <Heading size="md">Penambahan Data Umat Baru</Heading>
                        <Heading size="md" color={"gray"} py={2}>Data diri</Heading>

                        {isSuperAdmin && (
                            <FormControl isRequired isInvalid={touched.wilayah && errors.wilayah}>
                                <FormLabel>Pilih Wilayah</FormLabel>
                                <Select
                                placeholder="Pilih Wilayah Terlebih Dahulu"
                                value={values.wilayah}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFieldValue("wilayah", value);
                                    setSelectedWilayah(value);
                                    setFieldValue("qiu_dao_id", "");
                                    setSelectedOption(null);
                                    setIsQiuDaoConfirmed(false);
                                }}
                                >
                                {WILAYAH_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                                </Select>
                            </FormControl>
                            )}

                            {/* QIUDAO SEARCH */}
                            <FormControl isRequired isInvalid={touched.qiu_dao_id && errors.qiu_dao_id}>
                            <FormLabel>Nama QiuDao (Indonesia atau Mandarin)</FormLabel>

                            {/* Pesan kalau belum ada data */}
                            {filteredQiudaos.length === 0 && (
                                <Text color="orange.500" fontStyle="italic" mb={2}>
                                {isSuperAdmin
                                    ? selectedWilayah
                                    ? "Tidak ada QiuDao di wilayah ini"
                                    : "Pilih wilayah terlebih dahulu"
                                    : "Tidak ada QiuDao di wilayah Anda"}
                                </Text>
                            )}

                            <AsyncSelect
                                placeholder={
                                isSuperAdmin
                                    ? selectedWilayah ? "Ketik untuk cari QiuDao..." : "Pilih wilayah dulu..."
                                    : "Ketik untuk cari QiuDao..."
                                }
                                isDisabled={isSuperAdmin && !selectedWilayah}
                                value={selectedOption}
                                onChange={(option) => {
                                setSelectedOption(option);
                                if (option) {
                                    fetchQiuDaoDetails(option.value);
                                } else {
                                    setFieldValue("qiu_dao_id", "");
                                    setIsQiuDaoConfirmed(false);
                                }
                                }}
                                loadOptions={loadQiuDaoOptions}
                                isClearable
                                noOptionsMessage={() => "Tidak ditemukan QiuDao yang cocok"}
                            />
                            </FormControl>

                        <HStack spacing={4} w="100%">
                            <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Nama Lengkap</FormLabel>
                                <Input name="full_name" value={values.full_name} onChange={handleChange} placeholder="Masukkan nama lengkap"/>
                                {touched.full_name && errors.full_name && (
                                <Text color="red.500" fontSize="sm">{errors.full_name}</Text>
                                )}
                            </FormControl>
                            <FormControl flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Nama Mandarin</FormLabel>
                                <Input name="mandarin_name" value={values.mandarin_name} onChange={handleChange} placeholder="Masukkan nama mandarin"/>
                            </FormControl>
                        </HStack>

                        <HStack spacing={4} w="100%">
                            <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Status Rohani</FormLabel>
                                <Select
                                name="spiritual_status"
                                placeholder="Pilihan"
                                value={values.spiritual_status}
                                onChange={handleChange}
                                w="100%"
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

                            <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Sudah berikrar vegetarian?</FormLabel>
                                <Select
                                name="is_qing_kou"
                                placeholder="Pilihan"
                                value={values.is_qing_kou}
                                onChange={(e) => setFieldValue("is_qing_kou", e.target.value === "true")}
                                w="100%"
                                >
                                <option value="true">Sudah berikrar vegetarian</option>
                                <option value="false">Belum berikrar vegetarian</option>
                                </Select>
                            </FormControl>
                        </HStack>

                        <HStack spacing={4} w="100%">
                            <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Jenis Kelamin</FormLabel>
                                <Select name="gender" placeholder="Pilihan" value={values.gender} onChange={handleChange} w="100%">
                                <option value="Male">Pria</option>
                                <option value="Female">Wanita</option>
                                </Select>
                                {touched.gender && errors.gender && (
                                <Text color="red.500" fontSize="sm">{errors.gender}</Text>
                                )}
                            </FormControl>

                            <FormControl flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Golongan Darah</FormLabel>
                                <Select name="blood_type" value={values.blood_type} onChange={handleChange} w="100%" placeholder="Pilihan">
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="AB">AB</option>
                                <option value="O">O</option>
                                </Select>
                            </FormControl>
                        </HStack>

                        <HStack spacing={4} w="100%">
                            <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Nomor Handphone</FormLabel>
                                <Input name="phone_number" value={values.phone_number} onChange={handleChange} placeholder="Masukkan nomor handphone"/>
                                {touched.phone_number && errors.phone_number && (
                                <Text color="red.500" fontSize="sm">{errors.phone_number}</Text>
                                )}
                            </FormControl>

                            <FormControl flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Nomor Identitas</FormLabel>
                                <Input 
                                    name="id_card_number" 
                                    value={values.id_card_number} 
                                    onChange={handleChange} 
                                    placeholder="Masukkan nomor identitas (NIK, KTP, atau NRIC)"
                                />
                            </FormControl>
                        </HStack>

                        <HStack spacing={4} w="100%">
                            <FormControl flex={1} isDisabled={!isQiuDaoConfirmed} isRequired>
                                <FormLabel>Status Pernikahan</FormLabel>
                                <Select name="marital_status" value={values.marital_status} onChange={handleChange} w="100%" placeholder="Pilihan">
                                <option value="Not_Married">Belum menikah</option>
                                <option value="Married">Sudah menikah</option>
                                </Select>
                            </FormControl>

                            <FormControl flex={1} isDisabled={!isQiuDaoConfirmed} isRequired>
                                <FormLabel>Pekerjaan</FormLabel>
                                <Select
                                    name="job_name"
                                    value={values.job_name}
                                    onChange={handleChange}
                                    placeholder="Pilih pekerjaan"
                                    w="100%"
                                    >
                                    <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                                    <option value="Guru/Dosen">Guru/Dosen</option>
                                    <option value="Dokter/Perawat">Dokter/Perawat</option>
                                    <option value="Wiraswasta">Wiraswasta</option>
                                    <option value="Karyawan Swasta">Karyawan Swasta</option>
                                    <option value="Petani/Nelayan">Petani/Nelayan</option>
                                    <option value="Pelajar/Mahasiswa">Pelajar/Mahasiswa</option>
                                    <option value="Pensiunan">Pensiunan</option>
                                    <option value="Lainnya">Lainnya</option>
                                </Select>
                            </FormControl>
                        </HStack>

                        <HStack spacing={4} w="100%">
                            <FormControl flex={1} isDisabled={!isQiuDaoConfirmed} isRequired>
                                <FormLabel>Pendidikan Terakhir</FormLabel>
                                <Select
                                name="last_education_level"
                                value={values.last_education_level}
                                onChange={handleChange}
                                placeholder="Pilih pendidikan terakhir"
                                w="100%"
                                >
                                <option value="SD">TK (Taman Kanak-Kanak)</option>
                                <option value="SD">SD (Sekolah Dasar)</option>
                                <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                                <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                                <option value="D1">D1 (Diploma 1)</option>
                                <option value="D2">D2 (Diploma 2)</option>
                                <option value="D3">D3 (Diploma 3)</option>
                                <option value="S1">S1 (Sarjana)</option>
                                <option value="S2">S2 (Magister)</option>
                                <option value="S3">S3 (Doktor)</option>
                                </Select>
                            </FormControl>
                            
                            <FormControl flex={1} isDisabled={!isQiuDaoConfirmed} isRequired>
                                <FormLabel>Jurusan</FormLabel>
                                <Input name="education_major" value={values.education_major} onChange={handleChange} placeholder="Masukkan jurusan pendidikan"/>
                            </FormControl>
                        </HStack>

                        <FormControl w="100%" isDisabled={!isQiuDaoConfirmed} isRequired>
                            <FormLabel>Tempat Lahir</FormLabel>
                            <Input name="place_of_birth" value={values.place_of_birth} onChange={handleChange} placeholder="Masukkan tempat lahir"/>
                            {touched.place_of_birth && errors.place_of_birth && (
                                <Text color="red.500" fontSize="sm">{errors.place_of_birth}</Text>
                            )}
                        </FormControl>

                        <FormControl w="100%" isRequired isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Masukkan tanggal lahir</FormLabel>
                            <Input
                            name="date_of_birth"
                            type="date"
                            value={values.date_of_birth}
                            onChange={handleChange}
                            />
                            {touched.date_of_birth && errors.date_of_birth && (
                            <Text color="red.500" fontSize="sm">{errors.date_of_birth}</Text>
                            )}
                        </FormControl>

                        <FormControl hidden="true" w="100%" isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Tanggal Wafat</FormLabel>
                            <Input name="date_of_death" type="date" value={values.date_of_death} onChange={handleChange} placeholder="Masukkan tanggal wafat"/>
                        </FormControl>

                        <FormControl w="100%" isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Email</FormLabel>
                            <Input name="email" type="email" value={values.email} onChange={handleChange} placeholder="Masukkan email"/>
                            {touched.email && errors.email && (
                                <Text color="red.500" fontSize="sm">{errors.email}</Text>
                            )}
                        </FormControl>

                        {/* Alamat sesuai identitas */}
                        <Heading size="md" color={"gray"} mt={4} mb={2}>Alamat sesuai identitas</Heading>
                        <HStack spacing={4} w="100%">
                            <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Nama Lokasi</FormLabel>
                            <Input name="ktp_location_name" value={values.ktp_location_name} onChange={handleChange} />
                            {touched.ktp_location_name && errors.ktp_location_name && (
                                <Text color="red.500" fontSize="sm">{errors.ktp_location_name}</Text>
                            )}
                            </FormControl>
                            <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Kode Negara</FormLabel>
                            <Select
                                name="ktp_country_iso"
                                placeholder="Pilih Kode Negara"
                                value={values.ktp_country_iso}
                                onChange={handleChange}
                                w="100%"
                            >
                                {["IDN", "MYS", "SGP", "HKG", "JPN", "KOR", "AUS"].map((code) => (
                                <option key={code} value={code}>{code}</option>
                                ))}
                            </Select>
                            {touched.ktp_country_iso && errors.ktp_country_iso && (
                                <Text color="red.500" fontSize="sm">{errors.ktp_country_iso}</Text>
                            )}
                            </FormControl>
                        </HStack>

                        <HStack spacing={4} w="100%">
                            <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Provinsi</FormLabel>
                            <Select
                                name="ktp_province"
                                placeholder="Pilih Provinsi"
                                value={values.ktp_province}
                                onChange={(e) => handleProvinceChange(e, setFieldValue, "ktp", values, false)}
                                w="100%"
                            >
                                {provinces.map((prov) => (
                                <option key={prov.id} value={prov.id}>{prov.name}</option>
                                ))}
                            </Select>
                            {touched.ktp_province && errors.ktp_province && (
                                <Text color="red.500" fontSize="sm">{errors.ktp_province}</Text>
                            )}
                            </FormControl>
                            <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Kota / Kabupaten</FormLabel>
                            <Select
                                name="ktp_city"
                                placeholder="Pilih Kota"
                                value={values.ktp_city}
                                onChange={(e) => handleCityChange(e, setFieldValue, "ktp", values, false)}
                                isDisabled={!values.ktp_province}
                                w="100%"
                            >
                                {ktpCities.map((city) => (
                                <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </Select>
                            {touched.ktp_city && errors.ktp_city && (
                                <Text color="red.500" fontSize="sm">{errors.ktp_city}</Text>
                            )}
                            </FormControl>
                        </HStack>

                        <HStack spacing={4} w="100%">
                            <FormControl flex={1} isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Kecamatan</FormLabel>
                            <Select
                                name="ktp_district"
                                placeholder="Pilih Kecamatan"
                                value={values.ktp_district}
                                onChange={(e) => handleDistrictChange(e, setFieldValue, "ktp", values, false)}
                                isDisabled={!values.ktp_city}
                                w="100%"
                            >
                                {ktpDistricts.map((district) => (
                                <option key={district.id} value={district.id}>{district.name}</option>
                                ))}
                            </Select>
                            </FormControl>
                            <FormControl flex={1} isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Kelurahan</FormLabel>
                            <Select
                                name="ktp_locality"
                                placeholder="Pilih Kelurahan"
                                value={values.ktp_locality}
                                onChange={handleChange}
                                isDisabled={!values.ktp_district}
                                w="100%"
                            >
                                {ktpLocalities.map((locality) => (
                                <option key={locality.id} value={locality.id}>{locality.name}</option>
                                ))}
                            </Select>
                            </FormControl>
                        </HStack>

                        <FormControl w="100%" isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Alamat</FormLabel>
                            <Input name="ktp_street" value={values.ktp_street} onChange={handleChange} />
                        </FormControl>

                        <FormControl w="100%" isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Kode Pos</FormLabel>
                            <Input name="ktp_postal_code" value={values.ktp_postal_code} onChange={handleChange} />
                        </FormControl>

                        {/* Konfirmasi alamat domisili */}
                        <FormControl isRequired w="100%" isDisabled={!isQiuDaoConfirmed}>
                            <FormLabel>Apakah alamat domisili saat ini sama dengan alamat sesuai identitas?</FormLabel>
                            <RadioGroup
                            name="is_same_address"
                            value={values.is_same_address}
                            onChange={(value) => {
                                setFieldValue("is_same_address", value);
                                if (value === "true") {
                                setFieldValue("domicile_location_name", values.ktp_location_name);
                                setFieldValue("domicile_location_mandarin_name", values.ktp_location_mandarin_name);
                                setFieldValue("domicile_country_iso", values.ktp_country_iso);
                                setFieldValue("domicile_province", values.ktp_province);
                                setFieldValue("domicile_city", values.ktp_city);
                                setFieldValue("domicile_district", values.ktp_district);
                                setFieldValue("domicile_locality", values.ktp_locality);
                                setFieldValue("domicile_street", values.ktp_street);
                                setFieldValue("domicile_postal_code", values.ktp_postal_code);
                                setDomicileCities(ktpCities);
                                setDomicileDistricts(ktpDistricts);
                                setDomicileLocalities(ktpLocalities);
                                } else {
                                setFieldValue("domicile_location_name", "");
                                setFieldValue("domicile_location_mandarin_name", "");
                                setFieldValue("domicile_country_iso", "");
                                setFieldValue("domicile_province", "");
                                setFieldValue("domicile_city", "");
                                setFieldValue("domicile_district", "");
                                setFieldValue("domicile_locality", "");
                                setFieldValue("domicile_street", "");
                                setFieldValue("domicile_postal_code", "");
                                setDomicileCities([]);
                                setDomicileDistricts([]);
                                setDomicileLocalities([]);
                                }
                            }}
                            >
                            <HStack spacing={4}>
                                <Radio value="true">Ya</Radio>
                                <Radio value="false">Tidak</Radio>
                            </HStack>
                            </RadioGroup>
                            {touched.is_same_address && errors.is_same_address && (
                            <Text color="red.500" fontSize="sm">{errors.is_same_address}</Text>
                            )}
                        </FormControl>

                        {values.is_same_address === "false" && (
                            <>
                            <Heading size="md" color={"gray"} mt={4} mb={2}>Alamat domisili</Heading>
                            <HStack spacing={4} w="100%">
                                <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Nama Lokasi</FormLabel>
                                <Input name="domicile_location_name" value={values.domicile_location_name} onChange={handleChange} />
                                {touched.domicile_location_name && errors.domicile_location_name && (
                                    <Text color="red.500" fontSize="sm">{errors.domicile_location_name}</Text>
                                )}
                                </FormControl>
                                <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Kode Negara</FormLabel>
                                <Select
                                    name="domicile_country_iso"
                                    placeholder="Pilih Kode Negara"
                                    value={values.domicile_country_iso}
                                    onChange={handleChange}
                                    w="100%"
                                >
                                    {["IDN", "MYS", "SGP", "HKG", "JPN", "KOR", "AUS"].map((code) => (
                                    <option key={code} value={code}>{code}</option>
                                    ))}
                                </Select>
                                {touched.domicile_country_iso && errors.domicile_country_iso && (
                                    <Text color="red.500" fontSize="sm">{errors.domicile_country_iso}</Text>
                                )}
                                </FormControl>
                            </HStack>

                            <HStack spacing={4} w="100%">
                                <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Provinsi</FormLabel>
                                <Select
                                    name="domicile_province"
                                    placeholder="Pilih Provinsi"
                                    value={values.domicile_province}
                                    onChange={(e) => handleProvinceChange(e, setFieldValue, "domicile")}
                                    w="100%"
                                >
                                    {provinces.map((prov) => (
                                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                                    ))}
                                </Select>
                                {touched.domicile_province && errors.domicile_province && (
                                    <Text color="red.500" fontSize="sm">{errors.domicile_province}</Text>
                                )}
                                </FormControl>
                                <FormControl isRequired flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Kota / Kabupaten</FormLabel>
                                <Select
                                    name="domicile_city"
                                    placeholder="Pilih Kota"
                                    value={values.domicile_city}
                                    onChange={(e) => handleCityChange(e, setFieldValue, "domicile", values, false)}
                                    isDisabled={!values.domicile_province}
                                    w="100%"
                                >
                                    {domicileCities.map((city) => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                    ))}
                                </Select>
                                {touched.domicile_city && errors.domicile_city && (
                                    <Text color="red.500" fontSize="sm">{errors.domicile_city}</Text>
                                )}
                                </FormControl>
                            </HStack>

                            <HStack spacing={4} w="100%">
                                <FormControl flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Kecamatan</FormLabel>
                                <Select
                                    name="domicile_district"
                                    placeholder="Pilih Kecamatan"
                                    value={values.domicile_district}
                                    onChange={(e) => handleDistrictChange(e, setFieldValue, "domicile", values, false)}
                                    isDisabled={!values.domicile_city}
                                    w="100%"
                                >
                                    {domicileDistricts.map((district) => (
                                    <option key={district.id} value={district.id}>{district.name}</option>
                                    ))}
                                </Select>
                                </FormControl>
                                <FormControl flex={1} isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Kelurahan</FormLabel>
                                <Select
                                    name="domicile_locality"
                                    placeholder="Pilih Kelurahan"
                                    value={values.domicile_locality}
                                    onChange={handleChange}
                                    isDisabled={!values.domicile_district}
                                    w="100%"
                                >
                                    {domicileLocalities.map((locality) => (
                                    <option key={locality.id} value={locality.id}>{locality.name}</option>
                                    ))}
                                </Select>
                                </FormControl>
                            </HStack>

                            <FormControl w="100%" isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Alamat</FormLabel>
                                <Input name="domicile_street" value={values.domicile_street} onChange={handleChange} />
                            </FormControl>

                            <FormControl w="100%" isDisabled={!isQiuDaoConfirmed}>
                                <FormLabel>Kode Pos</FormLabel>
                                <Input name="domicile_postal_code" value={values.domicile_postal_code} onChange={handleChange} />
                            </FormControl>
                            </>
                        )}

                        <Button type="submit" colorScheme="green" w="100%" mt={4} isDisabled={!isQiuDaoConfirmed}>Simpan</Button>
                    </VStack>
                </Form>

                <Modal isOpen={isOpen} size="3xl" onClose={() => handleQiuDaoCancel(setFieldValue)}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Konfirmasi Data Qiu Dao</ModalHeader>
                        <ModalBody>
                            {selectedQiuDao ? (
                                <VStack spacing={4} align="stretch">
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <FormControl>
                                            <FormLabel>Nama QiuDao</FormLabel>
                                            <Input value={selectedQiuDao.qiu_dao_name || "-"} isReadOnly />
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>Nama Mandarin QiuDao</FormLabel>
                                            <Input value={selectedQiuDao.qiu_dao_mandarin_name || "-"} isReadOnly />
                                        </FormControl>
                                    </SimpleGrid>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <FormControl>
                                            <FormLabel>Nama Pandita</FormLabel>
                                            <Input value={selectedQiuDao.dian_chuan_shi?.name || "-"} isReadOnly />
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>Nama Mandarin Pandita</FormLabel>
                                            <Input value={selectedQiuDao.dian_chuan_shi?.mandarin_name || "-"} isReadOnly />
                                        </FormControl>
                                    </SimpleGrid>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <FormControl>
                                            <FormLabel>Nama Guru Pengajak</FormLabel>
                                            <Input value={selectedQiuDao.yin_shi_qd_name || "-"} isReadOnly />
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>Nama Mandarin Guru Pengajak</FormLabel>
                                            <Input value={selectedQiuDao.yin_shi_qd_mandarin_name || "-"} isReadOnly />
                                        </FormControl>
                                    </SimpleGrid>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <FormControl>
                                            <FormLabel>Nama Guru Penanggung</FormLabel>
                                            <Input value={selectedQiuDao.bao_shi_qd_name || "-"} isReadOnly />
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>Nama Mandarin Guru Penanggung</FormLabel>
                                            <Input value={selectedQiuDao.bao_shi_qd_mandarin_name || "-"} isReadOnly />
                                        </FormControl>
                                    </SimpleGrid>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <FormControl>
                                            <FormLabel>Tahun Lunar (岁次)</FormLabel>
                                            <Input value={selectedQiuDao.lunar_sui_ci_year || "-"} isReadOnly />
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>Bulan Lunar</FormLabel>
                                            <Input value={selectedQiuDao.lunar_month || "-"} isReadOnly />
                                        </FormControl>
                                    </SimpleGrid>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <FormControl>
                                            <FormLabel>Tanggal Lunar</FormLabel>
                                            <Input value={selectedQiuDao.lunar_day || "-"} isReadOnly />
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>Jam Lunar (时辰)</FormLabel>
                                            <Input value={selectedQiuDao.lunar_shi_chen_time || "-"} isReadOnly />
                                        </FormControl>
                                    </SimpleGrid>
                                    <FormControl>
                                        <FormLabel>Lokasi Vihara</FormLabel>
                                        <Input value={selectedQiuDao.qiu_dao_location?.location_name
                                            ? `${selectedQiuDao.qiu_dao_location.location_name}${
                                                selectedQiuDao.qiu_dao_location?.location_mandarin_name
                                                    ? ` (${selectedQiuDao.qiu_dao_location.location_mandarin_name})`
                                                    : ""
                                            }`
                                        : "-"} isReadOnly />
                                    </FormControl>
                                </VStack>
                            ) : (
                                <Text>Memuat data...</Text>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <HStack w="100%" spacing={2} align="center">
                                <Text fontSize="lg" fontWeight="bold" w="auto" mb={2}>Apakah data qiudao sudah benar?</Text>
                                <HStack flex={1} justify="flex-end" spacing={2}>
                                    <Button
                                        colorScheme="green"
                                        w="120px"
                                        onClick={() => handleQiuDaoConfirm(setFieldValue, selectedQiuDao?.qiu_dao_id)}
                                        isDisabled={!selectedQiuDao}
                                    >
                                        Ya
                                    </Button>
                                    <Button
                                        colorScheme="red"
                                        w="120px"
                                        onClick={() => handleQiuDaoCancel(setFieldValue)}
                                    >
                                        Tidak
                                    </Button>
                                </HStack>
                            </HStack>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>
        )}
        </Formik>
    );

    return (
        <Layout title="Umat">
            <Box w="100%" p={4}>
                {renderUserForm()}
            </Box>
        </Layout>
    );
}