import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Grid,
  GridItem,
  Flex,
  Text,
  VStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import Layout from "@/components/layout";
import { useEffect, useState, useMemo } from "react";
import { axiosInstance } from "@/lib/axios";
import { useRouter } from "next/router";
import { useDeleteQiudao } from "@/features/qiudao/useDeleteQiudao";
import { jwtDecode } from "jwt-decode";

export default function EditQiudao() {
  const router = useRouter();
  const { qiuDaoId } = router.query;
  const [selectedQiudao, setSelectedQiudao] = useState(null);
  const [formData, setFormData] = useState({});
  const [dianChuanList, setDianChuanList] = useState([]);
  const [allTemples, setAllTemples] = useState([]);
  const [displayTemples, setDisplayTemples] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Token & Role
  const [userScope, setUserScope] = useState("self");
  const [userFotangId, setUserFotangId] = useState(null);
  const [userArea, setUserArea] = useState(null);

  const toast = useToast();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const deleteQiudaoMutation = useDeleteQiudao();

  // Decode token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserScope(decoded.scope || "self");
        setUserFotangId(decoded.fotang_id || null);
        setUserArea(decoded.area || null);
      } catch (error) {
        toast({
          title: "Gagal memproses token",
          description: "Token tidak valid.",
          status: "error",
          isClosable: true,
        });
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [toast, router]);

  // Fetch data
  useEffect(() => {
    if (!qiuDaoId) return;

    setIsLoading(true);

    Promise.all([
      axiosInstance.get(`/profile/qiudao/${qiuDaoId}`).then((res) => {
        const data = res.data;
        setSelectedQiudao(data);
        setFormData({
          ...data,
          qiu_dao_location_id: data.qiu_dao_location_id || data.qiu_dao_location?.fotang_id || "",
          dian_chuan_shi_id: data.dian_chuan_shi_id || data.dian_chuan_shi?.id || "",
        });

        // Set selectedProvince dari data QiuDao yang sedang diedit
        const currentLocation = data.qiu_dao_location || data;
        const currentProvId = currentLocation?.locality?.district?.city?.province?.id;
        if (currentProvId) {
          setSelectedProvince(String(currentProvId));
        }
      }),

      axiosInstance.get("/fotang").then((res) => {
        const temples = res.data || [];
        setAllTemples(temples);

        let filtered = temples;
        if (userScope === "fotang" && userFotangId) {
          filtered = temples.filter((t) => t.fotang_id === userFotangId);
        } else if (userScope === "wilayah" && userArea) {
          filtered = temples.filter((t) => t.area === userArea);
        }
        setDisplayTemples(filtered);
      }),

      axiosInstance.get("/dianchuanshi").then((res) => {
        setDianChuanList(res.data || []);
      }),
    ])
      .catch((err) => {
        toast({
          title: "Gagal memuat data",
          description: err?.response?.data || "Terjadi kesalahan",
          status: "error",
          isClosable: true,
        });
      })
      .finally(() => setIsLoading(false));
  }, [qiuDaoId, userScope, userFotangId, userArea, toast]);

  // Daftar provinsi yang tersedia dari displayTemples (untuk Admin Wilayah & Nasional)
  const availableProvinces = useMemo(() => {
    const provSet = new Set();
    displayTemples.forEach((t) => {
      const prov = t.locality?.district?.city?.province;
      if (prov) {
        provSet.add(JSON.stringify({ id: prov.id, name: prov.name }));
      }
    });
    return Array.from(provSet)
      .map((s) => JSON.parse(s))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [displayTemples]);

  // Filter vihara berdasarkan provinsi dipilih
  const finalTemples = selectedProvince
    ? displayTemples.filter((t) => {
        return t.locality?.district?.city?.province?.id === Number(selectedProvince);
      })
    : displayTemples;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    if (name === "province") {
      setSelectedProvince(value);
      setFormData((prev) => ({ ...prev, qiu_dao_location_id: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    const {
      qiu_dao_name,
      qiu_dao_mandarin_name,
      yin_shi_qd_name,
      yin_shi_qd_mandarin_name,
      bao_shi_qd_name,
      bao_shi_qd_mandarin_name,
      lunar_sui_ci_year,
      lunar_month,
      lunar_day,
      lunar_shi_chen_time,
      qiu_dao_location_id,
      dian_chuan_shi_id,
    } = formData;

    const locationId = Number(qiu_dao_location_id);
    if (!locationId || isNaN(locationId)) {
      toast({ title: "Lokasi Vihara tidak valid", status: "error", isClosable: true });
      return;
    }

    try {
      await axiosInstance.patch(`/profile/qiudao/${qiuDaoId}`, {
        qiu_dao_name: qiu_dao_name || null,
        qiu_dao_mandarin_name: qiu_dao_mandarin_name || null,
        yin_shi_qd_name: yin_shi_qd_name || null,
        yin_shi_qd_mandarin_name: yin_shi_qd_mandarin_name || null,
        bao_shi_qd_name: bao_shi_qd_name || null,
        bao_shi_qd_mandarin_name: bao_shi_qd_mandarin_name || null,
        lunar_sui_ci_year,
        lunar_month,
        lunar_day,
        lunar_shi_chen_time,
        qiu_dao_location_id: locationId,
        dian_chuan_shi_id: dian_chuan_shi_id ? Number(dian_chuan_shi_id) : null,
      });

      toast({ title: "Data berhasil disimpan", status: "success", isClosable: true });
      router.push("/qiudao");
    } catch (err) {
      const msg = err?.response?.data || "Terjadi kesalahan";
      toast({
        title: "Gagal menyimpan",
        description: typeof msg === "string" ? msg : JSON.stringify(msg),
        status: "error",
        isClosable: true,
      });
    }
  };

  const canDelete = userScope !== "self" && userScope !== "fotang";

  const handleDelete = () => {
    if (!canDelete) {
      toast({ title: "Akses Ditolak", description: "Anda tidak memiliki izin.", status: "error", isClosable: true });
      return;
    }
    onConfirmOpen();
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteQiudaoMutation.mutateAsync(qiuDaoId);
      toast({ title: "Data berhasil dihapus", status: "success", isClosable: true });
      router.push("/qiudao");
    } catch (err) {
      const msg = err?.response?.data || "Terjadi kesalahan";
      toast({
        title: "Gagal menghapus",
        description: typeof msg === "string" ? msg : "Terjadi kesalahan",
        status: "error",
        isClosable: true,
      });
    } finally {
      onConfirmClose();
    }
  };

  const handleCancel = () => router.push("/qiudao");

  if (isLoading) return <Layout><Text p={4}>Memuat data...</Text></Layout>;
  if (!selectedQiudao) return <Layout><Text p={4}>Data tidak ditemukan.</Text></Layout>;

  return (
    <Layout title="Edit Qiudao">
      <Box p={4}>
        <VStack spacing={6} align="stretch">
          <Heading size="md">Edit Data Qiudao</Heading>

          <VStack spacing={4} align="stretch">
            <Heading size="sm" color="gray.600">Data Qiudao</Heading>

            {/* Nama QiuDao & Mandarin */}
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <FormControl>
                <FormLabel fontWeight="bold">Nama Qiudao</FormLabel>
                <Input name="qiu_dao_name" value={formData.qiu_dao_name || ""} onChange={handleInputChange} />
              </FormControl>
              <FormControl>
                <FormLabel fontWeight="bold">Nama Mandarin Qiudao</FormLabel>
                <Input name="qiu_dao_mandarin_name" value={formData.qiu_dao_mandarin_name || ""} onChange={handleInputChange} />
              </FormControl>
            </Grid>

            {/* PROVINSI + LOKASI VIHARA */}
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              {/* PROVINSI — Hanya untuk Wilayah & Nasional */}
              {userScope !== "fotang" && (
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Provinsi</FormLabel>
                  <Select
                    name="province"
                    value={selectedProvince}
                    onChange={handleSelectChange}
                    placeholder="Pilih Provinsi"
                  >
                    {availableProvinces.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* LOKASI VIHARA */}
              <FormControl isRequired gridColumn={userScope !== "fotang" ? "auto" : "1 / -1"}>
                <FormLabel fontWeight="bold">Lokasi Vihara</FormLabel>
                {userScope === "fotang" && displayTemples.length === 1 ? (
                  // Admin Vihara: Tampilkan langsung
                  <Box
                    p={3}
                    bg="gray.50"
                    border="1px"
                    borderColor="gray.300"
                    borderRadius="md"
                    fontWeight="medium"
                  >
                    {(() => {
                      const loc = displayTemples[0];
                      return [loc.location_name, loc.location_mandarin_name]
                        .filter(Boolean)
                        .join(" (") + (loc.location_mandarin_name ? ")" : "");
                    })()}
                    <input type="hidden" name="qiu_dao_location_id" value={displayTemples[0].fotang_id} />
                  </Box>
                ) : (
                  // Wilayah & Nasional: Dropdown
                  <Select
                    name="qiu_dao_location_id"
                    value={formData.qiu_dao_location_id || ""}
                    onChange={handleSelectChange}
                    placeholder={finalTemples.length === 0 ? "Tidak ada vihara" : "Pilih Lokasi Vihara"}
                  >
                    {finalTemples.map((loc) => {
                      const label = [loc.location_name, loc.location_mandarin_name]
                        .filter(Boolean)
                        .join(" (") + (loc.location_mandarin_name ? ")" : "");
                      return (
                        <option key={loc.fotang_id} value={loc.fotang_id}>
                          {label}
                        </option>
                      );
                    })}
                  </Select>
                )}
              </FormControl>
            </Grid>

            {/* Pilih Pandita */}
            <FormControl>
              <FormLabel fontWeight="bold">Pilih Pandita</FormLabel>
              <Select
                name="dian_chuan_shi_id"
                value={formData.dian_chuan_shi_id || ""}
                onChange={handleSelectChange}
                placeholder="Pilih Pandita"
              >
                {dianChuanList.map((dcs) => {
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

            {/* Guru Pengajak & Penanggung */}
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <FormControl>
                <FormLabel fontWeight="bold">Nama Guru Pengajak</FormLabel>
                <Input name="yin_shi_qd_name" value={formData.yin_shi_qd_name || ""} onChange={handleInputChange} />
              </FormControl>
              <FormControl>
                <FormLabel fontWeight="bold">Nama Mandarin Guru Pengajak</FormLabel>
                <Input name="yin_shi_qd_mandarin_name" value={formData.yin_shi_qd_mandarin_name || ""} onChange={handleInputChange} />
              </FormControl>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <FormControl>
                <FormLabel fontWeight="bold">Nama Guru Penanggung</FormLabel>
                <Input name="bao_shi_qd_name" value={formData.bao_shi_qd_name || ""} onChange={handleInputChange} />
              </FormControl>
              <FormControl>
                <FormLabel fontWeight="bold">Nama Mandarin Guru Penanggung</FormLabel>
                <Input name="bao_shi_qd_mandarin_name" value={formData.bao_shi_qd_mandarin_name || ""} onChange={handleInputChange} />
              </FormControl>
            </Grid>

            {/* Tanggal Lunar */}
            <Heading size="sm" color="gray.600" pt={4} pb={2}>Tanggal Qiudao</Heading>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">Tahun Lunar (岁次)</FormLabel>
                <Input name="lunar_sui_ci_year" value={formData.lunar_sui_ci_year || ""} onChange={handleInputChange} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">Bulan Lunar</FormLabel>
                <Input name="lunar_month" value={formData.lunar_month || ""} onChange={handleInputChange} />
              </FormControl>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">Tanggal Lunar</FormLabel>
                <Input name="lunar_day" value={formData.lunar_day || ""} onChange={handleInputChange} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">Jam Lunar (时辰)</FormLabel>
                <Input name="lunar_shi_chen_time" value={formData.lunar_shi_chen_time || ""} onChange={handleInputChange} />
              </FormControl>
            </Grid>

            {/* Tombol */}
            <Flex gap={4} mt={6}>
              {canDelete && (
                <Button colorScheme="red" w="120px" onClick={handleDelete}>
                  Hapus
                </Button>
              )}
              <Button colorScheme="gray" flex="1" onClick={handleCancel}>
                Batal
              </Button>
              <Button colorScheme="blue" flex="1" onClick={handleSubmit}>
                Simpan
              </Button>
            </Flex>
          </VStack>

          {/* Modal Konfirmasi Hapus */}
          <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} size="sm" isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Konfirmasi Hapus</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text>Apakah Anda yakin ingin menghapus data Qiudao ini?</Text>
              </ModalBody>
              <ModalFooter>
                <Flex w="100%" gap={2}>
                  <Button variant="ghost" flex="1" onClick={onConfirmClose}>
                    Tidak
                  </Button>
                  <Button colorScheme="red" flex="1" onClick={handleConfirmDelete}>
                    Ya
                  </Button>
                </Flex>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </VStack>
      </Box>
    </Layout>
  );
}