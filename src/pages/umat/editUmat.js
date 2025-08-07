import {
    Box, VStack, Text, FormControl, FormLabel, Input, Select, Flex, Grid, GridItem,
    Button,
    Heading
} from "@chakra-ui/react";
import Layout from "@/components/layout";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { axiosInstance } from "@/lib/axios";
import { useToast } from "@chakra-ui/react";
import { useUpdateUser } from "@/features/user/useUpdateUser";
import { useUpdateLocation } from "@/features/location/useUpdateLocation";

export default function EditUmat() {
    const router = useRouter();
    const { userId } = router.query;
    const toast = useToast();
    const updateUserMutation = useUpdateUser();
    const updateLocationMutation = useUpdateLocation();

    const [formData, setFormData] = useState({
        id_card_location: {},
        domicile_location: {},
    });

    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [localities, setLocalities] = useState([]);
    const [loading, setLoading] = useState({
        provinces: false,
        cities: false,
        districts: false,
        localities: false,
        initialData: true,
    });

    const fetchProvinces = async () => {
        setLoading(prev => ({ ...prev, provinces: true }));
        try {
            const res = await axiosInstance.get("/profile/location/provinces");
            setProvinces(res.data);
        } catch (err) {
            console.error("Gagal mengambil provinsi:", err);
        } finally {
            setLoading(prev => ({ ...prev, provinces: false }));
        }
    };

    const fetchCities = async (provinceId) => {
        if (!provinceId) return;
        setLoading(prev => ({ ...prev, cities: true }));
        try {
            const res = await axiosInstance.get(`/profile/location/cities?provinceId=${provinceId}`);
            setCities(res.data);
        } catch (err) {
            console.error("Gagal mengambil kota:", err);
        } finally {
            setLoading(prev => ({ ...prev, cities: false }));
        }
    };

    const fetchDistricts = async (cityId) => {
        if (!cityId) return;
        setLoading(prev => ({ ...prev, districts: true }));
        try {
            const res = await axiosInstance.get(`/profile/location/districts?cityId=${cityId}`);
            setDistricts(res.data);
        } catch (err) {
            console.error("Gagal mengambil kecamatan:", err);
        } finally {
            setLoading(prev => ({ ...prev, districts: false }));
        }
    };

    const fetchLocalities = async (districtId) => {
        if (!districtId) return;
        setLoading(prev => ({ ...prev, localities: true }));
        try {
            const res = await axiosInstance.get(`/profile/location/localities?districtId=${districtId}`);
            setLocalities(res.data);
        } catch (err) {
            console.error("Gagal mengambil kelurahan:", err);
        } finally {
            setLoading(prev => ({ ...prev, localities: false }));
        }
    };

    useEffect(() => {
        if (userId) {
            setLoading(prev => ({ ...prev, initialData: true }));
            axiosInstance.get(`/profile/user/${userId}`)
                .then(res => {
                    const data = res.data;
                    const initialFormData = {
                        ...data,
                        id_card_location: data.id_card_location || {},
                        domicile_location: data.domicile_location || {},
                    };

                    // Ekstrak hierarki dari locality
                    if (data.id_card_location?.locality) {
                        initialFormData.id_card_location = {
                            ...initialFormData.id_card_location,
                            province: data.id_card_location.locality.district.city.province.id,
                            city: data.id_card_location.locality.district.city.id,
                            district: data.id_card_location.locality.district.id,
                            locality: data.id_card_location.locality.id,
                        };
                    }
                    if (data.domicile_location?.locality) {
                        initialFormData.domicile_location = {
                            ...initialFormData.domicile_location,
                            province: data.domicile_location.locality.district.city.province.id,
                            city: data.domicile_location.locality.district.city.id,
                            district: data.domicile_location.locality.district.id,
                            locality: data.domicile_location.locality.id,
                        };
                    }

                    setFormData(initialFormData);

                    // Trigger fetch data hierarki berdasarkan nilai awal
                    if (initialFormData.id_card_location?.province) {
                        fetchCities(initialFormData.id_card_location.province);
                    }
                    if (initialFormData.domicile_location?.province) {
                        fetchCities(initialFormData.domicile_location.province);
                    }
                    if (initialFormData.id_card_location?.city) {
                        fetchDistricts(initialFormData.id_card_location.city);
                    }
                    if (initialFormData.domicile_location?.city) {
                        fetchDistricts(initialFormData.domicile_location.city);
                    }
                    if (initialFormData.id_card_location?.district) {
                        fetchLocalities(initialFormData.id_card_location.district);
                    }
                    if (initialFormData.domicile_location?.district) {
                        fetchLocalities(initialFormData.domicile_location.district);
                    }
                })
                .catch(err => console.error("Gagal mengambil data user:", err))
                .finally(() => setLoading(prev => ({ ...prev, initialData: false })));
        }
    }, [userId]);

    useEffect(() => {
        fetchProvinces();
    }, []);

    const handleLocationChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
                ...(field === "province" && { city: "", district: "", locality: "" }),
                ...(field === "city" && { district: "", locality: "" }),
                ...(field === "district" && { locality: "" }),
            }
        }));
    };

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

        // Validasi lokasi
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

        // Validasi locality jika ada perubahan
        const idCardLocalityId = id_card_location.locality ? parseInt(id_card_location.locality) : undefined;
        const domicileLocalityId = domicile_location.locality ? parseInt(domicile_location.locality) : undefined;
        if (idCardLocalityId && isNaN(idCardLocalityId)) {
            toast({
                title: "Kelurahan KTP tidak valid",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        if (domicileLocalityId && isNaN(domicileLocalityId)) {
            toast({
                title: "Kelurahan Domisili tidak valid",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

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
            // Update id_card_location jika ada perubahan
            if (id_card_location?.location_id) {
                const locationPayload = {
                    localityId: idCardLocalityId,
                    location_name: id_card_location.location_name || undefined,
                    street: id_card_location.street || undefined,
                    postal_code: id_card_location.postal_code || undefined,
                };
                if (Object.values(locationPayload).some(val => val !== undefined)) {
                    await updateLocationMutation.mutateAsync({
                        locationId: id_card_location.location_id,
                        payload: locationPayload,
                    });
                }
            }

            // Update domicile_location jika ada perubahan
            if (domicile_location?.location_id) {
                const locationPayload = {
                    localityId: domicileLocalityId,
                    location_name: domicile_location.location_name || undefined,
                    street: domicile_location.street || undefined,
                    postal_code: domicile_location.postal_code || undefined,
                };
                if (Object.values(locationPayload).some(val => val !== undefined)) {
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

    const handleCancel = () => {
        router.push("/umat");
    };

    return (
        <Layout title="Edit Umat">
            <Box p={2}>
                <VStack spacing={4} align="stretch">
                    <Text fontSize="xl" fontWeight="bold">Pengubahan Data Umat</Text>
                    <Heading size="md" color={"gray"} py={2}>Data diri</Heading>
                    {formData && !loading.initialData && ( // Render hanya jika data awal selesai dimuat
                        <VStack spacing={4} align="stretch">
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                {[
                                    { label: "Nama Lengkap", field: "full_name" },
                                    { label: "Nama Mandarin", field: "mandarin_name" },
                                    { label: "Tempat Lahir", field: "place_of_birth" },
                                    { label: "Tanggal Lahir", field: "date_of_birth", type: "date" },
                                    { label: "No. KTP", field: "id_card_number" },
                                    { label: "No. HP", field: "phone_number", type: "tel" },
                                    { label: "Email", field: "email" },
                                    { label: "Pendidikan terakhir", field: "last_education_level" },
                                    { label: "Jurusan pendidikan", field: "education_major" },
                                    { label: "Pekerjaan", field: "job_name" },
                                ].map(({ label, field, type }, index) => (
                                    <GridItem key={field}>
                                        <FormControl>
                                            <FormLabel fontWeight="bold">{label}</FormLabel>
                                            <Input
                                                type={type || "text"}
                                                value={
                                                    type === "date" && formData[field]
                                                        ? formData[field].slice(0, 10)
                                                        : formData[field] || "-"
                                                }
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
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    spiritual_status: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">Pilih status rohani</option>
                                            <option value="QianRen">Qian Ren / Sesepuh</option>
                                            <option value="DianChuanShi">Dian Chuan Shi / Pandita</option>
                                            <option value="TanZhu">Tan Zhu / Pandita Madya</option>
                                            <option value="FoYuan">Fo Yuan / Buddha Siswa</option>
                                            <option value="BanShiYuan">Ban Shi Yuan / Pelaksana Vihara</option>
                                            <option value="QianXian">Qian Xian / Aktivis</option>
                                            <option value="DaoQin">Dao Qin / Umat</option>
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
                                            <option value="Male">Pria</option>
                                            <option value="Female">Wanita</option>
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
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="O">O</option>
                                            <option value="AB">AB</option>
                                        </Select>
                                    </FormControl>
                                </GridItem>
                            </Grid>

                            <Heading size="md" color={"gray"} pt={4} pb={2}>Lokasi sesuai identitas</Heading>
                            <FormControl>
                                <FormLabel fontWeight="bold">Nama Lokasi</FormLabel>
                                <Input
                                    value={formData.id_card_location.location_name || ""}
                                    onChange={(e) => handleLocationChange("id_card_location", "location_name", e.target.value)}
                                />
                            </FormControl>
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Provinsi</FormLabel>
                                        <Select
                                            placeholder="Pilih Provinsi"
                                            value={formData.id_card_location.province || ""}
                                            onChange={(e) => handleLocationChange("id_card_location", "province", e.target.value)}
                                        >
                                            {loading.provinces ? <option>Loading...</option> : provinces.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </GridItem>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Kota</FormLabel>
                                        <Select
                                            placeholder="Pilih Kota"
                                            value={formData.id_card_location.city || ""}
                                            onChange={(e) => handleLocationChange("id_card_location", "city", e.target.value)}
                                        >
                                            {loading.cities ? <option>Loading...</option> : cities.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
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
                                            value={formData.id_card_location.district || ""}
                                            onChange={(e) => handleLocationChange("id_card_location", "district", e.target.value)}
                                        >
                                            {loading.districts ? <option>Loading...</option> : districts.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </GridItem>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Kelurahan</FormLabel>
                                        <Select
                                            placeholder="Pilih Kelurahan"
                                            value={formData.id_card_location.locality || ""}
                                            onChange={(e) => handleLocationChange("id_card_location", "locality", e.target.value)}
                                        >
                                            {loading.localities ? <option>Loading...</option> : localities.map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </GridItem>
                            </Grid>
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Jalan</FormLabel>
                                        <Input
                                            value={formData.id_card_location.street || ""}
                                            onChange={(e) => handleLocationChange("id_card_location", "street", e.target.value)}
                                        />
                                    </FormControl>
                                </GridItem>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Kode Pos</FormLabel>
                                        <Input
                                            value={formData.id_card_location.postal_code || ""}
                                            onChange={(e) => handleLocationChange("id_card_location", "postal_code", e.target.value)}
                                        />
                                    </FormControl>
                                </GridItem>
                            </Grid>

                            <Heading size="md" color={"gray"} pt={4} pb={2}>Lokasi domisili</Heading>
                            <FormControl>
                                <FormLabel fontWeight="bold">Nama Lokasi</FormLabel>
                                <Input
                                    value={formData.domicile_location.location_name || ""}
                                    onChange={(e) => handleLocationChange("domicile_location", "location_name", e.target.value)}
                                />
                            </FormControl>

                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Provinsi</FormLabel>
                                        <Select
                                            placeholder="Pilih Provinsi"
                                            value={formData.domicile_location.province || ""}
                                            onChange={(e) => handleLocationChange("domicile_location", "province", e.target.value)}
                                        >
                                            {loading.provinces ? <option>Loading...</option> : provinces.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </GridItem>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Kota</FormLabel>
                                        <Select
                                            placeholder="Pilih Kota"
                                            value={formData.domicile_location.city || ""}
                                            onChange={(e) => handleLocationChange("domicile_location", "city", e.target.value)}
                                        >
                                            {loading.cities ? <option>Loading...</option> : cities.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
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
                                            value={formData.domicile_location.district || ""}
                                            onChange={(e) => handleLocationChange("domicile_location", "district", e.target.value)}
                                        >
                                            {loading.districts ? <option>Loading...</option> : districts.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </GridItem>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Kelurahan</FormLabel>
                                        <Select
                                            placeholder="Pilih Kelurahan"
                                            value={formData.domicile_location.locality || ""}
                                            onChange={(e) => handleLocationChange("domicile_location", "locality", e.target.value)}
                                        >
                                            {loading.localities ? <option>Loading...</option> : localities.map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </GridItem>
                            </Grid>
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Jalan</FormLabel>
                                        <Input
                                            value={formData.domicile_location.street || ""}
                                            onChange={(e) => handleLocationChange("domicile_location", "street", e.target.value)}
                                        />
                                    </FormControl>
                                </GridItem>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel fontWeight="bold">Kode Pos</FormLabel>
                                        <Input
                                            value={formData.domicile_location.postal_code || ""}
                                            onChange={(e) => handleLocationChange("domicile_location", "postal_code", e.target.value)}
                                        />
                                    </FormControl>
                                </GridItem>
                            </Grid>

                            <Flex gap={4} mt={4}>
                                <Button colorScheme="gray" flex="1" onClick={handleCancel}>
                                    Batal
                                </Button>
                                <Button colorScheme="blue" flex="1" onClick={handleSave}>
                                    Submit
                                </Button>
                            </Flex>
                        </VStack>
                    ) || (loading.initialData && <Text>Loading data...</Text>)}
                </VStack>
            </Box>
        </Layout>
    );
}