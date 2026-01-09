import {
  Box, Button, FormControl, FormLabel, Heading,
  Input, Select, Text, VStack, HStack, useToast, Textarea,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout";
import { axiosInstance } from "@/lib/axios";
import { Form, Formik } from "formik";
import * as Yup from "yup";

const addFotangSchema = Yup.object().shape({
  location_name: Yup.string().required("Nama Vihara wajib diisi"),
  area: Yup.string().required("Korda Wilayah wajib dipilih"),
  province: Yup.string().required("Provinsi wajib diisi"),
  city: Yup.string().required("Kota/Kabupaten wajib diisi"),
});

export default function AddFotangPage() {
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
        setProvinces(res.data);
      } catch (err) {
        console.error("Gagal fetch provinces:", err);
        toast({
          title: "Gagal memuat provinsi",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchProvinces();
  }, [toast]);

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
        try {
            const res = await axiosInstance.get("/fotang");
            const fotangs = res.data;

            const lastId = fotangs.length > 0 
            ? Math.max(...fotangs.map(f => f.fotang_id))
            : 0;

            const nextId = lastId + 1;

            const payload = {
            fotang_id: nextId,
            location_name: values.location_name,
            location_mandarin_name: values.location_mandarin_name || null,
            area: values.area,
            country_iso: "IDN",
            street: values.street || null,
            postal_code: values.postal_code || null,
            };

            if (values.locality) {
            payload.locality = {
                connect: { id: Number(values.locality) },
            };
            }

            console.log("Payload dikirim:", payload);

            await axiosInstance.post("/fotang", payload);

            toast({
            title: "Vihara berhasil ditambahkan",
            status: "success",
            duration: 3000,
            isClosable: true,
            });
            router.push("/fotang");
        } catch (err) {
            console.error("Error:", err.response?.data);
            toast({
            title: "Gagal menyimpan vihara",
            description: err?.response?.data?.message || "Terjadi kesalahan",
            status: "error",
            duration: 5000,
            isClosable: true,
            });
        }
    };

  return (
    <Layout title="Tambah Vihara">
      <Box w="100%" p={4}>
        <Formik
          initialValues={{
            location_name: "",
            location_mandarin_name: "",
            area: "",
            province: "",
            city: "",
            district: "",
            locality: "",
            street: "",
            postal_code: "",
          }}
          validationSchema={addFotangSchema}
          onSubmit={handleSubmitFotang}
        >
          {({ values, handleChange, setFieldValue, touched, errors, isSubmitting }) => (
            <Form>
              <VStack spacing={4} align="stretch" w="100%">
                <Heading size="md">Penambahan Data Vihara Baru</Heading>

                <HStack spacing={4} w="100%">
                  <FormControl isRequired flex={1}>
                    <FormLabel>Nama Vihara</FormLabel>
                    <Input
                      name="location_name"
                      value={values.location_name}
                      onChange={handleChange}
                      placeholder="Masukkan nama vihara"
                    />
                    {touched.location_name && errors.location_name && (
                      <Text color="red.500" fontSize="sm">{errors.location_name}</Text>
                    )}
                  </FormControl>

                  <FormControl flex={1}>
                    <FormLabel>Nama Vihara (Mandarin)</FormLabel>
                    <Input
                      name="location_mandarin_name"
                      value={values.location_mandarin_name}
                      onChange={handleChange}
                      placeholder="Nama dalam huruf Mandarin (opsional)"
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={4} w="100%">
                  <FormControl isRequired flex={1}>
                    <FormLabel>Provinsi</FormLabel>
                    <Select
                      name="province"
                      placeholder="Pilih Provinsi"
                      value={values.province}
                      onChange={(e) => handleProvinceChange(e, setFieldValue)}
                      w="100%"
                    >
                      {provinces.map((prov) => (
                        <option key={prov.id} value={prov.id}>{prov.name}</option>
                      ))}
                    </Select>
                    {touched.province && errors.province && (
                      <Text color="red.500" fontSize="sm">{errors.province}</Text>
                    )}
                  </FormControl>

                  <FormControl isRequired flex={1}>
                    <FormLabel>Kota / Kabupaten</FormLabel>
                    <Select
                      name="city"
                      placeholder="Pilih Kota"
                      value={values.city}
                      onChange={(e) => handleCityChange(e, setFieldValue)}
                      isDisabled={!values.province}
                      w="100%"
                    >
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </Select>
                    {touched.city && errors.city && (
                      <Text color="red.500" fontSize="sm">{errors.city}</Text>
                    )}
                  </FormControl>
                </HStack>

                <HStack spacing={4} w="100%">
                  <FormControl flex={1}>
                    <FormLabel>Kecamatan</FormLabel>
                    <Select
                      name="district"
                      placeholder="Pilih Kecamatan (opsional)"
                      value={values.district}
                      onChange={(e) => handleDistrictChange(e, setFieldValue)}
                      isDisabled={!values.city}
                      w="100%"
                    >
                      {districts.map((dist) => (
                        <option key={dist.id} value={dist.id}>{dist.name}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl flex={1}>
                    <FormLabel>Kelurahan</FormLabel>
                    <Select
                      name="locality"
                      placeholder="Pilih Kelurahan (opsional)"
                      value={values.locality}
                      onChange={handleChange}
                      isDisabled={!values.district}
                      w="100%"
                    >
                      {localities.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>

                <HStack spacing={4} w="100%">
                  <FormControl flex={1}>
                    <FormLabel>Kode Pos</FormLabel>
                    <Input
                      name="postal_code"
                      value={values.postal_code}
                      onChange={handleChange}
                      placeholder="12345"
                    />
                  </FormControl>

                  <FormControl isRequired flex={1}>
                    <FormLabel>Korda Wilayah</FormLabel>
                    <Select
                      name="area"
                      placeholder="Pilih Korda"
                      value={values.area}
                      onChange={handleChange}
                      w="100%"
                    >
                      {Array.from({ length: 6 }, (_, i) => (
                        <option key={i + 1} value={`Korwil_${i + 1}`}>
                          Korwil {i + 1}
                        </option>
                      ))}
                    </Select>
                    {touched.area && errors.area && (
                      <Text color="red.500" fontSize="sm">{errors.area}</Text>
                    )}
                  </FormControl>
                </HStack>

                <FormControl w="100%">
                  <FormLabel>Alamat Jalan</FormLabel>
                  <Textarea
                    name="street"
                    value={values.street}
                    onChange={handleChange}
                    placeholder="Masukkan alamat lengkap vihara (misal: Jl. Sudirman No. 123, RT 001/RW 002, Kel. Example)"
                    minH="100px"
                    resize="vertical"
                    rows={3}
                    fontSize="md"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="green"
                  w="100%"
                  mt={4}
                  isLoading={isSubmitting}
                  loadingText="Menyimpan..."
                >
                  Simpan Vihara
                </Button>
              </VStack>
            </Form>
          )}
        </Formik>
      </Box>
    </Layout>
  );
}