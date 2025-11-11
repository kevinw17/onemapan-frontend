// src/pages/fotang/editFotang.js
import {
  Box, VStack, Text, FormControl, FormLabel, Input, Select, Flex, Grid, GridItem,
  Button, Heading, useToast, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, useDisclosure
} from "@chakra-ui/react";
import Layout from "@/components/layout";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { axiosInstance } from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";

export default function EditFotang() {
  const router = useRouter();
  const { fotangId } = router.query;
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    location_name: "",
    location_mandarin_name: "",
    street: "",
    postal_code: "",
    area: "", // TAMBAH FIELD AREA
    province: "",
    city: "",
    district: "",
    locality: "",
  });

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [loading, setLoading] = useState({
    initial: true,
    provinces: false,
    cities: false,
    districts: false,
    localities: false,
  });

  // === AUTH ===
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      jwtDecode(token);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // === FETCH DATA ===
  useEffect(() => {
    if (!fotangId) return;

    const fetchFotang = async () => {
      setLoading(prev => ({ ...prev, initial: true }));
      try {
        const res = await axiosInstance.get(`/fotang/${fotangId}`);
        const f = res.data;

        const data = {
          location_name: f.location_name || "",
          location_mandarin_name: f.location_mandarin_name || "",
          street: f.street || "",
          postal_code: f.postal_code || "",
          area: f.area || "", // AMBIL DARI DATA
          province: f.locality?.district?.city?.province?.id?.toString() || "",
          city: f.locality?.district?.city?.id?.toString() || "",
          district: f.locality?.district?.id?.toString() || "",
          locality: f.locality?.id?.toString() || "",
        };

        setFormData(data);

        if (data.province) fetchLocation("cities", data.province);
        if (data.city) fetchLocation("districts", data.city);
        if (data.district) fetchLocation("localities", data.district);
      } catch (err) {
        toast({ title: "Gagal memuat data", status: "error" });
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    fetchFotang();
  }, [fotangId, toast]);

  // === FETCH LOCATION ===
  const fetchLocation = async (type, id) => {
    if (!id && type !== "provinces") return;
    const field = type;
    setLoading(prev => ({ ...prev, [field]: true }));

    try {
      const endpoints = {
        provinces: "/fotang/provinces",
        cities: `/fotang/cities?provinceId=${id}`,
        districts: `/fotang/districts?cityId=${id}`,
        localities: `/fotang/localities?districtId=${id}`,
      };
      const res = await axiosInstance.get(endpoints[type]);
      if (type === "provinces") setProvinces(res.data);
      else if (type === "cities") setCities(res.data);
      else if (type === "districts") setDistricts(res.data);
      else if (type === "localities") setLocalities(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  useEffect(() => {
    fetchLocation("provinces");
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === "province" && { city: "", district: "", locality: "" }),
      ...(field === "city" && { district: "", locality: "" }),
      ...(field === "district" && { locality: "" }),
    }));

    if (field === "province") fetchLocation("cities", value);
    if (field === "city") fetchLocation("districts", value);
    if (field === "district") fetchLocation("localities", value);
  };

  // === PATCH UPDATE ===
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      await axiosInstance.patch(`/fotang/${fotangId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["fotang"]);
      toast({ title: "Vihara berhasil diperbarui", status: "success" });
      router.push("/fotang");
    },
    onError: (err) => {
      toast({
        title: "Gagal menyimpan",
        description: err?.response?.data?.message || "Terjadi kesalahan",
        status: "error",
      });
    },
  });

  const handleSave = () => {
    if (!formData.locality) {
      toast({ title: "Kelurahan wajib diisi", status: "error" });
      return;
    }

    const payload = {
      location_name: formData.location_name || undefined,
      location_mandarin_name: formData.location_mandarin_name || null,
      street: formData.street || null,
      postal_code: formData.postal_code || null,
      area: formData.area || undefined, // TAMBAH KE PAYLOAD
      locality: formData.locality ? { connect: { id: parseInt(formData.locality) } } : undefined,
    };

    updateMutation.mutate(payload);
  };

  const handleDelete = () => onOpen();

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/fotang/${fotangId}`);
      queryClient.invalidateQueries(["fotang"]);
      toast({ title: "Vihara berhasil dihapus", status: "success" });
      router.push("/fotang");
    } catch (err) {
      toast({
        title: "Gagal menghapus",
        description: err?.response?.data?.message || "Terjadi kesalahan",
        status: "error",
      });
    } finally {
      onClose();
    }
  };

  if (loading.initial) {
    return (
      <Layout title="Edit Vihara">
        <Flex justify="center" align="center" h="60vh">
          <Spinner size="xl" />
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Vihara">
      <Box p={4}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Edit Vihara</Heading>

          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <FormControl>
              <FormLabel fontWeight="bold">Nama Vihara</FormLabel>
              <Input value={formData.location_name} onChange={e => handleChange("location_name", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel fontWeight="bold">Nama Mandarin</FormLabel>
              <Input value={formData.location_mandarin_name} onChange={e => handleChange("location_mandarin_name", e.target.value)} />
            </FormControl>
          </Grid>

          <FormControl>
            <FormLabel fontWeight="bold">Alamat Jalan</FormLabel>
            <Input value={formData.street} onChange={e => handleChange("street", e.target.value)} />
          </FormControl>

          {/* BARIS BARU: KODE POS & WILAYAH */}
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <FormControl>
              <FormLabel fontWeight="bold">Kode Pos</FormLabel>
              <Input value={formData.postal_code} onChange={e => handleChange("postal_code", e.target.value)} />
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="bold">Wilayah</FormLabel>
              <Select
                placeholder="Pilih Wilayah"
                value={formData.area}
                onChange={e => handleChange("area", e.target.value)}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <option key={i + 1} value={`Korwil_${i + 1}`}>
                    Wilayah {i + 1}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Heading size="md" color="gray.600" mt={4}>Lokasi</Heading>

          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <FormControl>
              <FormLabel fontWeight="bold">Provinsi</FormLabel>
              <Select placeholder="Pilih Provinsi" value={formData.province} onChange={e => handleChange("province", e.target.value)}>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontWeight="bold">Kota/Kabupaten</FormLabel>
              <Select placeholder="Pilih Kota" value={formData.city} onChange={e => handleChange("city", e.target.value)} isDisabled={!formData.province}>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <FormControl>
              <FormLabel fontWeight="bold">Kecamatan</FormLabel>
              <Select placeholder="Pilih Kecamatan" value={formData.district} onChange={e => handleChange("district", e.target.value)} isDisabled={!formData.city}>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontWeight="bold">Kelurahan</FormLabel>
              <Select placeholder="Pilih Kelurahan" value={formData.locality} onChange={e => handleChange("locality", e.target.value)} isDisabled={!formData.district}>
                {localities.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </FormControl>
          </Grid>

          <Flex gap={3} mt={6}>
            <Button colorScheme="red" w="120px" onClick={handleDelete}>Hapus</Button>
            <Button colorScheme="gray" flex="1" onClick={() => router.push("/fotang")}>Batal</Button>
            <Button colorScheme="blue" flex="1" onClick={handleSave} isLoading={updateMutation.isLoading}>Simpan</Button>
          </Flex>
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Apakah Anda yakin ingin menghapus vihara ini?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} mr={3}>Batal</Button>
            <Button colorScheme="red" onClick={confirmDelete}>Hapus</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
}