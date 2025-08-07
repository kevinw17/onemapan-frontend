import { axiosInstance } from "@/lib/axios";
import { VStack, Input, Box, Text, Select, Grid, GridItem } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";

export default function LocationSection({ location = {}, onChange, hideMandarinName = false, customLabels = {} }) {
    const defaultFields = {
        location_name: "Nama Lokasi",
        location_mandarin_name: "Nama Mandarin",
        street: "Jalan",
        locality: "Kelurahan",
        district: "Kecamatan",
        city: "Kota",
        province: "Provinsi",
        postal_code: "Kode Pos",
    };
    const labels = { ...defaultFields, ...customLabels };
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [localities, setLocalities] = useState([]);
    const [loading, setLoading] = useState({
        provinces: false,
        cities: false,
        districts: false,
        localities: false,
    });

    const fetchProvinces = useCallback(async () => {
        setLoading(prev => ({ ...prev, provinces: true }));
        const res = await axiosInstance.get("/profile/location/provinces");
        setProvinces(res.data);
        setLoading(prev => ({ ...prev, provinces: false }));
    }, []);

    const fetchCities = useCallback(async (provinceId) => {
        if (!provinceId) return;
        setLoading(prev => ({ ...prev, cities: true }));
        const res = await axiosInstance.get(`/profile/location/cities?provinceId=${provinceId}`);
        setCities(res.data);
        setLoading(prev => ({ ...prev, cities: false }));
    }, []);

    const fetchDistricts = useCallback(async (cityId) => {
        if (!cityId) return;
        setLoading(prev => ({ ...prev, districts: true }));
        const res = await axiosInstance.get(`/profile/location/districts?cityId=${cityId}`);
        setDistricts(res.data);
        setLoading(prev => ({ ...prev, districts: false }));
    }, []);

    const fetchLocalities = useCallback(async (districtId) => {
        if (!districtId) return;
        setLoading(prev => ({ ...prev, localities: true }));
        const res = await axiosInstance.get(`/profile/location/localities?districtId=${districtId}`);
        setLocalities(res.data);
        setLoading(prev => ({ ...prev, localities: false }));
    }, []);

    useEffect(() => {
        const setup = async () => {
            const localityId = parseInt(location.locality);
            if (!localityId || isNaN(localityId)) return;

            console.log("Resolving full location chain from locality:", localityId);

            try {
                const localityRes = await axiosInstance.get(`/profile/location/locality/${localityId}`);
                const locality = localityRes.data;

                const districtRes = await axiosInstance.get(`/profile/location/district/${locality.districtId}`);
                const district = districtRes.data;

                const cityRes = await axiosInstance.get(`/profile/location/city/${district.cityId}`);
                const city = cityRes.data;

                const provinceId = city.provinceId;

                if (
                    location.province === provinceId &&
                    location.city === city.id &&
                    location.district === district.id &&
                    location.locality === locality.id
                ) {
                    return;
                }

                await fetchProvinces();
                await fetchCities(provinceId);
                await fetchDistricts(city.id);
                await fetchLocalities(district.id);

                onChange({
                    ...location,
                    province: provinceId,
                    city: city.id,
                    district: district.id,
                    locality: locality.id,
                });
            } catch (err) {
                console.error("Failed to resolve location chain:", err);
            }
        };

        setup();
    }, [fetchCities, fetchDistricts, fetchLocalities, fetchProvinces, location, onChange]);

    useEffect(() => {
        fetchProvinces();
    }, [fetchProvinces]);

    useEffect(() => {
        if (location.province) {
            fetchCities(location.province);
        }
    }, [location.province, fetchCities]);

    useEffect(() => {
        if (location.city) {
            fetchDistricts(location.city);
        }
    }, [location.city, fetchDistricts]);

    useEffect(() => {
        if (location.district) {
            fetchLocalities(location.district);
        }
    }, [location.district, fetchLocalities]);

    return (
        <VStack spacing={3} align="start" w="100%">
            <Box w="100%">
                <Text fontWeight="bold" mb={1}>{labels.location_name}</Text>
                <Input
                    value={location.location_name || ""}
                    onChange={(e) => onChange({ ...location, location_name: e.target.value })}
                />
            </Box>

            {/* {!hideMandarinName && (
                <GridItem>
                    <Box w="100%">
                        <Text fontWeight="bold" mb={1}>{labels.location_mandarin_name}</Text>
                        <Input
                            value={location.location_mandarin_name || ""}
                            onChange={(e) => onChange({ ...location, location_mandarin_name: e.target.value })}
                        />
                    </Box>
                </GridItem>
            )} */}

            <Grid templateColumns="repeat(2, 1fr)" gap={4} w="100%">
                <GridItem>
                    <Box w="100%">
                        <Text fontWeight="bold" mb={1}>{labels.province}</Text>
                        <Select
                            placeholder="Pilih Provinsi"
                            value={location.province || ""}
                            onChange={(e) =>
                                onChange({ ...location, province: e.target.value, city: "", district: "", locality: "" })
                            }
                        >
                            {loading.provinces ? <option>Loading...</option> : provinces.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </Select>
                    </Box>
                </GridItem>
                <GridItem>
                    <Box w="100%">
                        <Text fontWeight="bold" mb={1}>{labels.city}</Text>
                        <Select
                            placeholder="Pilih Kota"
                            value={location.city || ""}
                            onChange={(e) =>
                                onChange({ ...location, city: e.target.value, district: "", locality: "" })
                            }
                        >
                            {loading.cities ? <option>Loading...</option> : cities.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Select>
                    </Box>
                </GridItem>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={4} w="100%">
                <GridItem>
                    <Box w="100%">
                        <Text fontWeight="bold" mb={1}>{labels.district}</Text>
                        <Select
                            placeholder="Pilih Kecamatan"
                            value={location.district || ""}
                            onChange={(e) =>
                                onChange({ ...location, district: e.target.value, locality: "" })
                            }
                        >
                            {loading.districts ? <option>Loading...</option> : districts.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </Select>
                    </Box>
                </GridItem>
                <GridItem>
                    <Box w="100%">
                        <Text fontWeight="bold" mb={1}>{labels.locality}</Text>
                        <Select
                            placeholder="Pilih Kelurahan"
                            value={location.locality || ""}
                            onChange={(e) =>
                                onChange({ ...location, locality: e.target.value, localityId: parseInt(e.target.value) })
                            }
                        >
                            {loading.localities ? <option>Loading...</option> : localities.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </Select>
                    </Box>
                </GridItem>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={4} w="100%">
                <GridItem>
                    <Box w="100%">
                        <Text fontWeight="bold" mb={1}>{labels.street}</Text>
                        <Input
                            value={location.street || ""}
                            onChange={(e) => onChange({ ...location, street: e.target.value })}
                        />
                    </Box>
                </GridItem>
                <GridItem>
                    <Box w="100%">
                        <Text fontWeight="bold" mb={1}>{labels.postal_code}</Text>
                        <Input
                            value={location.postal_code || ""}
                            onChange={(e) => onChange({ ...location, postal_code: e.target.value })}
                        />
                    </Box>
                </GridItem>
            </Grid>
        </VStack>
    );
}