import {
    Box,
    VStack,
    Text,
    FormControl,
    FormLabel,
    Input,
    Select,
    Flex,
    Grid,
    GridItem,
    Button,
    Heading,
} from "@chakra-ui/react";
import Layout from "@/components/layout";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { axiosInstance } from "@/lib/axios";
import { useToast } from "@chakra-ui/react";
import { useUpdateUser } from "@/features/user/useUpdateUser";
import { useUpdateLocation } from "@/features/location/useUpdateLocation";

// Opsi untuk Status Rohani
const SPIRITUAL_STATUS_OPTIONS = [
    { value: "", label: "Pilih status rohani" },
    { value: "QianRen", label: "Qian Ren / Sesepuh" },
    { value: "DianChuanShi", label: "Dian Chuan Shi / Pandita" },
    { value: "TanZhu", label: "Tan Zhu / Pandita Madya" },
    { value: "FoYuan", label: "Fo Yuan / Buddha Siswa" },
    { value: "BanShiYuan", label: "Ban Shi Yuan / Pelaksana Vihara" },
    { value: "QianXian", label: "Qian Xian / Aktivis" },
    { value: "DaoQin", label: "Dao Qin / Umat" },
];

// Opsi untuk Jenis Kelamin dan Golongan Darah
const GENDER_OPTIONS = [
    { value: "Male", label: "Pria" },
    { value: "Female", label: "Wanita" },
];

const BLOOD_TYPE_OPTIONS = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "O", label: "O" },
    { value: "AB", label: "AB" },
];

export default function EditUmat() {
    const router = useRouter();
    const { userId } = router.query;
    const toast = useToast();
    const updateUserMutation = useUpdateUser();
    const updateLocationMutation = useUpdateLocation();

    const [formData, setFormData] = useState({
        full_name: "",
        mandarin_name: "",
        is_qing_kou: false,
        phone_number: "",
        gender: "",
        blood_type: "",
        place_of_birth: "",
        date_of_birth: "",
        id_card_number: "",
        email: "",
        last_education_level: "",
        education_major: "",
        job_name: "",
        spiritual_status: "",
        id_card_location: {},
        domicile_location: {},
    });

    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState({ id_card: [], domicile: [] });
    const [districts, setDistricts] = useState({ id_card: [], domicile: [] });
    const [localities, setLocalities] = useState({ id_card: [], domicile: [] });
    const [loading, setLoading] = useState({
        provinces: false,
        cities: false,
        districts: false,
        localities: false,
        initialData: true,
    });

    // Fungsi untuk mengambil data lokasi
    const fetchLocationData = async (type, id, setter, field) => {
        if (!id && type !== "provinces") return;
        setLoading((prev) => ({ ...prev, [field]: true }));
        try {
        const endpoint = {
            provinces: "/profile/location/provinces",
            cities: `/profile/location/cities?provinceId=${id}`,
            districts: `/profile/location/districts?cityId=${id}`,
            localities: `/profile/location/localities?districtId=${id}`,
        }[type];
        const res = await axiosInstance.get(endpoint);
        setter((prev) => (type === "provinces" ? res.data : { ...prev, [field]: res.data }));
        } catch (err) {
        console.error(`Gagal mengambil ${type}:`, err);
        } finally {
        setLoading((prev) => ({ ...prev, [field]: false }));
        }
    };

    // Fetch data awal user
    useEffect(() => {
        if (!userId) return;
        setLoading((prev) => ({ ...prev, initialData: true }));
        axiosInstance
        .get(`/profile/user/${userId}`)
        .then((res) => {
            const data = res.data;
            const initialFormData = {
            full_name: data.full_name || "",
            mandarin_name: data.mandarin_name || "",
            is_qing_kou: data.is_qing_kou || false,
            phone_number: data.phone_number || "",
            gender: data.gender || "",
            blood_type: data.blood_type || "",
            place_of_birth: data.place_of_birth || "",
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().slice(0, 10) : "",
            id_card_number: data.id_card_number || "",
            email: data.email || "",
            last_education_level: data.last_education_level || "",
            education_major: data.education_major || "",
            job_name: data.job_name || "",
            spiritual_status: data.spiritualUser?.spiritual_status || "", // Ambil dari spiritualUser
            id_card_location: data.id_card_location || {},
            domicile_location: data.domicile_location || {},
            };

            // Set hierarki lokasi
            if (data.id_card_location?.locality) {
            initialFormData.id_card_location = {
                ...initialFormData.id_card_location,
                province: data.id_card_location.locality.district.city.province.id || "",
                city: data.id_card_location.locality.district.city.id || "",
                district: data.id_card_location.locality.district.id || "",
                locality: data.id_card_location.locality.id || "",
            };
            }
            if (data.domicile_location?.locality) {
            initialFormData.domicile_location = {
                ...initialFormData.domicile_location,
                province: data.domicile_location.locality.district.city.province.id || "",
                city: data.domicile_location.locality.district.city.id || "",
                district: data.domicile_location.locality.district.id || "",
                locality: data.domicile_location.locality.id || "",
            };
            }

            setFormData(initialFormData);

            // Fetch data hierarki berdasarkan nilai awal
            if (initialFormData.id_card_location?.province) {
            fetchLocationData("cities", initialFormData.id_card_location.province, setCities, "id_card");
            }
            if (initialFormData.domicile_location?.province) {
            fetchLocationData("cities", initialFormData.domicile_location.province, setCities, "domicile");
            }
            if (initialFormData.id_card_location?.city) {
            fetchLocationData("districts", initialFormData.id_card_location.city, setDistricts, "id_card");
            }
            if (initialFormData.domicile_location?.city) {
            fetchLocationData("districts", initialFormData.domicile_location.city, setDistricts, "domicile");
            }
            if (initialFormData.id_card_location?.district) {
            fetchLocationData("localities", initialFormData.id_card_location.district, setLocalities, "id_card");
            }
            if (initialFormData.domicile_location?.district) {
            fetchLocationData("localities", initialFormData.domicile_location.district, setLocalities, "domicile");
            }
        })
        .catch((err) => {
            console.error("Gagal mengambil data user:", err);
            toast({
            title: "Gagal memuat data",
            status: "error",
            duration: 3000,
            isClosable: true,
            });
        })
        .finally(() => setLoading((prev) => ({ ...prev, initialData: false })));
    }, [userId]);

    // Fetch provinces saat komponen dimount
    useEffect(() => {
        fetchLocationData("provinces", null, setProvinces, "provinces");
    }, []);

    // Handle perubahan lokasi
    const handleLocationChange = (section, field, value) => {
        setFormData((prev) => ({
        ...prev,
        [section]: {
            ...prev[section],
            [field]: value,
            ...(field === "province" && { city: "", district: "", locality: "" }),
            ...(field === "city" && { district: "", locality: "" }),
            ...(field === "district" && { locality: "" }),
        },
        }));

        if (field === "province") {
        fetchLocationData("cities", value, setCities, section === "id_card_location" ? "id_card" : "domicile");
        } else if (field === "city") {
        fetchLocationData("districts", value, setDistricts, section === "id_card_location" ? "id_card" : "domicile");
        } else if (field === "district") {
        fetchLocationData("localities", value, setLocalities, section === "id_card_location" ? "id_card" : "domicile");
        }
    };

    // Handle simpan data
    const handleSave = async () => {
        const {
        full_name,
        mandarin_name,
        is_qing_kou,
        phone_number,
        gender,
        blood_type,
        place_of_birth,
        date_of_birth,
        id_card_number,
        email,
        last_education_level,
        education_major,
        job_name,
        id_card_location,
        domicile_location,
        spiritual_status,
        } = formData;

        const idCardLocationId = parseInt(id_card_location?.location_id || 0);
        const domicileLocationId = parseInt(domicile_location?.location_id || 0);

        if (!idCardLocationId || isNaN(idCardLocationId)) {
        toast({
            title: "Lokasi KTP tidak valid",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }
        if (!domicileLocationId || isNaN(domicileLocationId)) {
        toast({
            title: "Lokasi Domisili tidak valid",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }

        const idCardLocalityId = id_card_location.locality ? parseInt(id_card_location.locality) : undefined;
        const domicileLocalityId = domicile_location.locality ? parseInt(domicile_location.locality) : undefined;

        const payload = {
        full_name,
        mandarin_name,
        is_qing_kou,
        phone_number,
        gender,
        blood_type,
        place_of_birth,
        date_of_birth: date_of_birth ? new Date(date_of_birth).toISOString() : null,
        id_card_number,
        email,
        last_education_level,
        education_major,
        job_name,
        id_card_location_id: idCardLocationId,
        domicile_location_id: domicileLocationId,
        spiritual_status: spiritual_status || null,
        };

        try {
        if (id_card_location?.location_id) {
            const locationPayload = {
            localityId: idCardLocalityId,
            location_name: id_card_location.location_name || undefined,
            street: id_card_location.street || undefined,
            postal_code: id_card_location.postal_code || undefined,
            };
            if (Object.values(locationPayload).some((val) => val !== undefined)) {
            await updateLocationMutation.mutateAsync({
                locationId: id_card_location.location_id,
                payload: locationPayload,
            });
            }
        }

        if (domicile_location?.location_id) {
            const locationPayload = {
            localityId: domicileLocalityId,
            location_name: domicile_location.location_name || undefined,
            street: domicile_location.street || undefined,
            postal_code: domicile_location.postal_code || undefined,
            };
            if (Object.values(locationPayload).some((val) => val !== undefined)) {
            await updateLocationMutation.mutateAsync({
                locationId: domicile_location.location_id,
                payload: locationPayload,
            });
            }
        }

        await updateUserMutation.mutateAsync({
            userId: userId,
            payload,
        });

        toast({
            title: "Berhasil disimpan",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
        router.push("/umat");
        } catch (err) {
        const errorMessage = err?.response?.data?.message || "Terjadi kesalahan saat menyimpan";
        toast({
            title: "Gagal menyimpan",
            description: errorMessage,
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        }
    };

    const handleCancel = () => {
        router.push("/umat");
    };

    // Komponen untuk field lokasi
    const LocationFields = ({ section, title }) => (
        <>
        <Heading size="md" color="gray" pt={4} pb={2}>
            {title}
        </Heading>
        <FormControl>
            <FormLabel fontWeight="bold">Nama Lokasi</FormLabel>
            <Input
            value={formData[section].location_name || ""}
            onChange={(e) => handleLocationChange(section, "location_name", e.target.value)}
            />
        </FormControl>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <GridItem>
            <FormControl>
                <FormLabel fontWeight="bold">Provinsi</FormLabel>
                <Select
                placeholder="Pilih Provinsi"
                value={formData[section].province || ""}
                onChange={(e) => handleLocationChange(section, "province", e.target.value)}
                >
                {loading.provinces ? (
                    <option>Loading...</option>
                ) : (
                    provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.name}
                    </option>
                    ))
                )}
                </Select>
            </FormControl>
            </GridItem>
            <GridItem>
            <FormControl>
                <FormLabel fontWeight="bold">Kota</FormLabel>
                <Select
                placeholder="Pilih Kota"
                value={formData[section].city || ""}
                onChange={(e) => handleLocationChange(section, "city", e.target.value)}
                >
                {loading.cities ? (
                    <option>Loading...</option>
                ) : (
                    cities[section === "id_card_location" ? "id_card" : "domicile"].map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                    ))
                )}
                </Select>
            </FormControl>
            </GridItem>
        </Grid>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <GridItem>
            <FormControl>
                <FormLabel fontWeight="bold">Kecamatan</FormLabel>
                <Select
                placeholder="Pilih Kecamatan"
                value={formData[section].district || ""}
                onChange={(e) => handleLocationChange(section, "district", e.target.value)}
                >
                {loading.districts ? (
                    <option>Loading...</option>
                ) : (
                    districts[section === "id_card_location" ? "id_card" : "domicile"].map((d) => (
                    <option key={d.id} value={d.id}>
                        {d.name}
                    </option>
                    ))
                )}
                </Select>
            </FormControl>
            </GridItem>
            <GridItem>
            <FormControl>
                <FormLabel fontWeight="bold">Kelurahan</FormLabel>
                <Select
                placeholder="Pilih Kelurahan"
                value={formData[section].locality || ""}
                onChange={(e) => handleLocationChange(section, "locality", e.target.value)}
                >
                {loading.localities ? (
                    <option>Loading...</option>
                ) : (
                    localities[section === "id_card_location" ? "id_card" : "domicile"].map((l) => (
                    <option key={l.id} value={l.id}>
                        {l.name}
                    </option>
                    ))
                )}
                </Select>
            </FormControl>
            </GridItem>
        </Grid>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <GridItem>
            <FormControl>
                <FormLabel fontWeight="bold">Jalan</FormLabel>
                <Input
                value={formData[section].street || ""}
                onChange={(e) => handleLocationChange(section, "street", e.target.value)}
                />
            </FormControl>
            </GridItem>
            <GridItem>
            <FormControl>
                <FormLabel fontWeight="bold">Kode Pos</FormLabel>
                <Input
                value={formData[section].postal_code || ""}
                onChange={(e) => handleLocationChange(section, "postal_code", e.target.value)}
                />
            </FormControl>
            </GridItem>
        </Grid>
        </>
    );

    return (
        <Layout title="Edit Umat">
        <Box p={2}>
            <VStack spacing={4} align="stretch">
            <Text fontSize="xl" fontWeight="bold">
                Pengubahan Data Umat
            </Text>
            {loading.initialData ? (
                <Text>Loading data...</Text>
            ) : (
                <VStack spacing={4} align="stretch">
                <Heading size="md" color="gray" py={2}>
                    Data Diri
                </Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    {[
                    { label: "Nama Lengkap", field: "full_name" },
                    { label: "Nama Mandarin", field: "mandarin_name" },
                    { label: "Tempat Lahir", field: "place_of_birth" },
                    { label: "Tanggal Lahir", field: "date_of_birth", type: "date" },
                    { label: "No. KTP", field: "id_card_number" },
                    { label: "No. HP", field: "phone_number", type: "tel" },
                    { label: "Email", field: "email" },
                    { label: "Pendidikan Terakhir", field: "last_education_level" },
                    { label: "Jurusan Pendidikan", field: "education_major" },
                    { label: "Pekerjaan", field: "job_name" },
                    ].map(({ label, field, type }) => (
                    <GridItem key={field}>
                        <FormControl>
                        <FormLabel fontWeight="bold">{label}</FormLabel>
                        <Input
                            type={type || "text"}
                            value={formData[field] || ""}
                            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        />
                        </FormControl>
                    </GridItem>
                    ))}
                </Grid>

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <GridItem>
                    <FormControl>
                        <FormLabel fontWeight="bold">Status Ikrar Vegetarian (Qing Kou)</FormLabel>
                        <Select
                        value={formData.is_qing_kou ? "true" : "false"}
                        onChange={(e) => setFormData({ ...formData, is_qing_kou: e.target.value === "true" })}
                        >
                        <option value="true">Sudah berikrar vegetarian</option>
                        <option value="false">Belum berikrar vegetarian</option>
                        </Select>
                    </FormControl>
                    </GridItem>
                    <GridItem>
                    <FormControl>
                        <FormLabel fontWeight="bold">Status Rohani</FormLabel>
                        <Select
                        value={formData.spiritual_status || ""}
                        onChange={(e) => setFormData({ ...formData, spiritual_status: e.target.value })}
                        >
                        {SPIRITUAL_STATUS_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>
                            {label}
                            </option>
                        ))}
                        </Select>
                    </FormControl>
                    </GridItem>
                </Grid>

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <GridItem>
                    <FormControl>
                        <FormLabel fontWeight="bold">Jenis Kelamin</FormLabel>
                        <Select
                        value={formData.gender || ""}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                        {GENDER_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>
                            {label}
                            </option>
                        ))}
                        </Select>
                    </FormControl>
                    </GridItem>
                    <GridItem>
                    <FormControl>
                        <FormLabel fontWeight="bold">Golongan Darah</FormLabel>
                        <Select
                        value={formData.blood_type || ""}
                        onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                        >
                        {BLOOD_TYPE_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>
                            {label}
                            </option>
                        ))}
                        </Select>
                    </FormControl>
                    </GridItem>
                </Grid>

                <LocationFields section="id_card_location" title="Lokasi Sesuai Identitas" />
                <LocationFields section="domicile_location" title="Lokasi Domisili" />

                <Flex gap={4} mt={4}>
                    <Button colorScheme="gray" flex="1" onClick={handleCancel}>
                    Batal
                    </Button>
                    <Button colorScheme="blue" flex="1" onClick={handleSave}>
                    Submit
                    </Button>
                </Flex>
                </VStack>
            )}
            </VStack>
        </Box>
        </Layout>
    );
}