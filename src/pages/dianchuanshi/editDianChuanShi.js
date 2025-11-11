// src/pages/dianchuanshi/editDianChuanShi.js
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

const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function EditDianChuanShi() {
  const router = useRouter();
  const { dianChuanShiId } = router.query;
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    name: "",
    mandarin_name: "",
    area: "",
    is_fuwuyuan: "",
    ling_ming_month: "",
    ling_ming_year: "",
  });

  const [loading, setLoading] = useState(true);

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
    if (!dianChuanShiId) return;

    const fetchPandita = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/dianchuanshi/${dianChuanShiId}`);
        const p = res.data;

        const date = p.ling_ming_time ? new Date(p.ling_ming_time) : null;

        setFormData({
          name: p.name || "",
          mandarin_name: p.mandarin_name || "",
          area: p.area || "",
          is_fuwuyuan: p.is_fuwuyuan === true ? "true" : p.is_fuwuyuan === false ? "false" : "",
          ling_ming_month: date ? months[date.getMonth()] : "",
          ling_ming_year: date ? date.getFullYear().toString() : "",
        });
      } catch (err) {
        toast({ title: "Gagal memuat data pandita", status: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchPandita();
  }, [dianChuanShiId, toast]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // === PATCH UPDATE ===
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      await axiosInstance.patch(`/dianchuanshi/${dianChuanShiId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dianchuanshi"]);
      toast({ title: "Pandita berhasil diperbarui", status: "success" });
      router.push("/dianchuanshi");
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
    if (!formData.name || !formData.area || !formData.ling_ming_month || !formData.ling_ming_year) {
      toast({ title: "Field wajib diisi", status: "error" });
      return;
    }

    const monthIndex = months.indexOf(formData.ling_ming_month);
    const lingMingDate = new Date(parseInt(formData.ling_ming_year), monthIndex, 1);

    const payload = {
      name: formData.name || undefined,
      mandarin_name: formData.mandarin_name || null,
      area: formData.area || undefined,
      is_fuwuyuan: formData.is_fuwuyuan === "true" ? true : formData.is_fuwuyuan === "false" ? false : null,
      ling_ming_time: lingMingDate ? lingMingDate.toISOString() : null,
    };

    updateMutation.mutate(payload);
  };

  const handleDelete = () => onOpen();

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/dianchuanshi/${dianChuanShiId}`);
      queryClient.invalidateQueries(["dianchuanshi"]);
      toast({ title: "Pandita berhasil dihapus", status: "success" });
      router.push("/dianchuanshi");
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

  if (loading) {
    return (
      <Layout title="Edit Pandita">
        <Flex justify="center" align="center" h="60vh">
          <Spinner size="xl" />
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Pandita">
      <Box p={4}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Edit Pandita</Heading>

          {/* NAMA INDONESIA & MANDARIN */}
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <FormControl>
              <FormLabel fontWeight="bold">Nama Indonesia</FormLabel>
              <Input value={formData.name} onChange={e => handleChange("name", e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel fontWeight="bold">Nama Mandarin</FormLabel>
              <Input
                value={formData.mandarin_name}
                onChange={e => handleChange("mandarin_name", e.target.value)}
                maxLength={4}
              />
            </FormControl>
          </Grid>

          {/* KORDA WILAYAH */}
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

          {/* STATUS FUWUYUAN */}
          <FormControl>
            <FormLabel fontWeight="bold">Status Fuwuyuan</FormLabel>
            <Select
              placeholder="Pilih status"
              value={formData.is_fuwuyuan}
              onChange={e => handleChange("is_fuwuyuan", e.target.value)}
            >
              <option value="true">Ya</option>
              <option value="false">Tidak</option>
            </Select>
          </FormControl>

          {/* LING MING TIME — BULAN & TAHUN */}
          <FormControl>
            <FormLabel fontWeight="bold">Waktu Ling Ming</FormLabel>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <FormLabel fontSize="sm" mb={1}>Bulan</FormLabel>
                <Select
                  placeholder="Pilih bulan"
                  value={formData.ling_ming_month}
                  onChange={e => handleChange("ling_ming_month", e.target.value)}
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </GridItem>
              <GridItem>
                <FormLabel fontSize="sm" mb={1}>Tahun</FormLabel>
                <Select
                  placeholder="Pilih tahun"
                  value={formData.ling_ming_year}
                  onChange={e => handleChange("ling_ming_year", e.target.value)}
                >
                  {Array.from({ length: 50 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </Select>
              </GridItem>
            </Grid>
          </FormControl>

          {/* TOMBOL AKSI */}
          <Flex gap={3} mt={6}>
            <Button colorScheme="red" w="120px" onClick={handleDelete}>Hapus</Button>
            <Button colorScheme="gray" flex="1" onClick={() => router.push("/dianchuanshi")}>Batal</Button>
            <Button
              colorScheme="blue"
              flex="1"
              onClick={handleSave}
              isLoading={updateMutation.isPending}
            >
              Simpan
            </Button>
          </Flex>
        </VStack>
      </Box>

      {/* MODAL HAPUS */}
      <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Apakah Anda yakin ingin menghapus pandita ini?</Text>
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