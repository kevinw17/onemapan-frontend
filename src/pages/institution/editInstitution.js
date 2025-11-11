// src/pages/institution/editInstitution.js
import {
  Box, Button, FormControl, FormLabel, Heading,
  Input, VStack, Grid, GridItem, useToast, Text,
  Flex, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, useDisclosure
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import Layout from "@/components/layout";
import { axiosInstance } from "@/lib/axios";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { useEffect, useState } from "react";

const editInstitutionSchema = Yup.object().shape({
  institution_name: Yup.string().required("Nama Lembaga wajib diisi"),
  institution_leader: Yup.string().required("Pimpinan wajib diisi"),
  institution_secretary_general: Yup.string().required("Sekretaris Jenderal wajib diisi"),
});

export default function EditInstitutionPage() {
  const toast = useToast();
  const router = useRouter();
  const { institutionId } = router.query;
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // === LOAD DATA ===
  useEffect(() => {
    if (!institutionId) return;

    const fetchData = async () => {
      try {
        const res = await axiosInstance.get(`/institution`);
        const institutions = res.data.data || res.data || [];
        const institution = institutions.find(i => i.institution_id === parseInt(institutionId));

        if (!institution) {
          toast({
            title: "Lembaga tidak ditemukan",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          router.push("/institution");
          return;
        }

        setInitialData({
          institution_name: institution.institution_name || "",
          institution_leader: institution.institution_leader || "",
          institution_secretary_general: institution.institution_secretary_general || "",
        });
      } catch (err) {
        console.error("Error loading data:", err);
        toast({
          title: "Gagal memuat data",
          description: "Silakan coba lagi",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [institutionId, router, toast]);

  // === SUBMIT EDIT ===
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        institution_name: values.institution_name,
        institution_leader: values.institution_leader,
        institution_secretary_general: values.institution_secretary_general,
      };

      await axiosInstance.patch(`/institution/${institutionId}`, payload);

      toast({
        title: "Lembaga berhasil diperbarui",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/institution");
    } catch (err) {
      console.error("Error:", err.response?.data);
      toast({
        title: "Gagal menyimpan perubahan",
        description: err?.response?.data?.message || "Terjadi kesalahan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // === HAPUS DENGAN MODAL ===
  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/institution/${institutionId}`);
      toast({
        title: "Lembaga berhasil dihapus",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/institution");
    } catch (err) {
      toast({
        title: "Gagal menghapus lembaga",
        description: err?.response?.data?.message || "Terjadi kesalahan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <Layout title="Edit Lembaga">
        <Box p={4} textAlign="center" mt={10}>
          <Text fontSize="lg" color="gray.600">Memuat data lembaga...</Text>
        </Box>
      </Layout>
    );
  }

  if (!initialData) {
    return (
      <Layout title="Edit Lembaga">
        <Box p={4} textAlign="center" mt={10}>
          <Text color="red.500">Data tidak ditemukan</Text>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Lembaga">
      <Box p={4}>
        <Formik
          initialValues={initialData}
          validationSchema={editInstitutionSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, handleChange, touched, errors, isSubmitting, dirty }) => (
            <Form>
              <VStack spacing={6} align="stretch">
                <Heading size="lg">Edit Lembaga</Heading>

                {/* NAMA LEMBAGA */}
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Nama Lembaga</FormLabel>
                  <Input
                    name="institution_name"
                    value={values.institution_name}
                    onChange={handleChange}
                    placeholder="Masukkan nama lembaga"
                  />
                  {touched.institution_name && errors.institution_name && (
                    <Text color="red.500" fontSize="sm">{errors.institution_name}</Text>
                  )}
                </FormControl>

                {/* PIMPINAN & SEKRETARIS JENDERAL */}
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="bold">Pimpinan</FormLabel>
                    <Input
                      name="institution_leader"
                      value={values.institution_leader}
                      onChange={handleChange}
                      placeholder="Masukkan nama pimpinan"
                    />
                    {touched.institution_leader && errors.institution_leader && (
                      <Text color="red.500" fontSize="sm">{errors.institution_leader}</Text>
                    )}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="bold">Sekretaris Jenderal</FormLabel>
                    <Input
                      name="institution_secretary_general"
                      value={values.institution_secretary_general}
                      onChange={handleChange}
                      placeholder="Masukkan nama sekretaris jenderal"
                    />
                    {touched.institution_secretary_general && errors.institution_secretary_general && (
                      <Text color="red.500" fontSize="sm">{errors.institution_secretary_general}</Text>
                    )}
                  </FormControl>
                </Grid>

                {/* TOMBOL AKSI — SAMA PERSIS DENGAN editFotang.js */}
                <Flex gap={3} mt={6}>
                  <Button
                    colorScheme="red"
                    w="120px"
                    onClick={onOpen}
                    isDisabled={isSubmitting}
                  >
                    Hapus
                  </Button>
                  <Button
                    colorScheme="gray"
                    flex="1"
                    onClick={() => router.push("/institution")}
                    isDisabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    flex="1"
                    isLoading={isSubmitting}
                    loadingText="Menyimpan..."
                    isDisabled={!dirty || isSubmitting}
                  >
                    Simpan
                  </Button>
                </Flex>
              </VStack>
            </Form>
          )}
        </Formik>
      </Box>

      {/* MODAL KONFIRMASI HAPUS */}
      <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Apakah Anda yakin ingin menghapus lembaga ini?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} mr={3}>
              Batal
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              Hapus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
}