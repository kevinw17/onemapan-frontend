// src/pages/dianchuanshi/addDianChuanShi.js
import {
  Box, Button, FormControl, FormLabel, Heading,
  Input, Select, VStack, Grid, GridItem, useToast, Text
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import Layout from "@/components/layout";
import { axiosInstance } from "@/lib/axios";
import { Form, Formik } from "formik";
import * as Yup from "yup";

const addPanditaSchema = Yup.object().shape({
  name: Yup.string().required("Nama Indonesia wajib diisi"),
  area: Yup.string().required("Wilayah wajib dipilih"),
  is_fuwuyuan: Yup.string().required("Status Fuwuyuan wajib dipilih"),
  // ling_ming_month & ling_ming_year TIDAK WAJIB
});

const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

export default function AddDianChuanShiPage() {
  const toast = useToast();
  const toastIdRef = useRouter();
  const router = useRouter();

  const handleSubmitPandita = async (values) => {
    try {
      // 1. AMBIL SEMUA PANDITA UNTUK CEK ID TERAKHIR
      const res = await axiosInstance.get("/dianchuanshi");
      const panditas = res.data;

      // 2. HITUNG ID TERAKHIR
      const lastId = panditas.length > 0 
        ? Math.max(...panditas.map(p => p.id))
        : 0;

      const nextId = lastId + 1;

      // 3. BENTUK ling_ming_time JIKA ADA
      let lingMingDate = null;
      if (values.ling_ming_month && values.ling_ming_year) {
        const monthIndex = months.indexOf(values.ling_ming_month);
        lingMingDate = new Date(parseInt(values.ling_ming_year), monthIndex, 1);
      }

      // 4. PAYLOAD
      const payload = {
        id: nextId,
        name: values.name,
        mandarin_name: values.mandarin_name || null,
        area: values.area,
        is_fuwuyuan: values.is_fuwuyuan === "true" ? true : false,
        ling_ming_time: lingMingDate ? lingMingDate.toISOString() : null,
      };

      console.log("Payload dikirim:", payload);

      // 5. KIRIM KE BACKEND
      await axiosInstance.post("/dianchuanshi", payload);

      toast({
        title: "Pandita berhasil ditambahkan",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/dianchuanshi");
    } catch (err) {
      console.error("Error:", err.response?.data);
      toast({
        title: "Gagal menyimpan pandita",
        description: err?.response?.data?.message || "Terjadi kesalahan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout title="Tambah Pandita">
      <Box p={4}>
        <Formik
          initialValues={{
            name: "",
            mandarin_name: "",
            area: "",
            is_fuwuyuan: "",
            ling_ming_month: "",
            ling_ming_year: "",
          }}
          validationSchema={addPanditaSchema}
          onSubmit={handleSubmitPandita}
        >
          {({ values, handleChange, touched, errors, isSubmitting }) => (
            <Form>
              <VStack spacing={6} align="stretch">
                <Heading size="lg">Tambah Pandita</Heading>

                {/* NAMA INDONESIA & MANDARIN */}
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="bold">Nama Indonesia</FormLabel>
                    <Input
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      placeholder="Masukkan nama pandita"
                    />
                    {touched.name && errors.name && (
                      <Text color="red.500" fontSize="sm">{errors.name}</Text>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="bold">Nama Mandarin</FormLabel>
                    <Input
                      name="mandarin_name"
                      value={values.mandarin_name}
                      onChange={handleChange}
                      placeholder="Nama dalam huruf Mandarin (opsional)"
                      maxLength={4}
                    />
                  </FormControl>
                </Grid>

                {/* KORDA WILAYAH */}
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Wilayah</FormLabel>
                  <Select
                    name="area"
                    placeholder="Pilih Wilayah"
                    value={values.area}
                    onChange={handleChange}
                  >
                    {Array.from({ length: 6 }, (_, i) => (
                      <option key={i + 1} value={`Korwil_${i + 1}`}>
                        Wilayah {i + 1}
                      </option>
                    ))}
                  </Select>
                  {touched.area && errors.area && (
                    <Text color="red.500" fontSize="sm">{errors.area}</Text>
                  )}
                </FormControl>

                {/* STATUS FUWUYUAN — WAJIB */}
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Status Fuwuyuan</FormLabel>
                  <Select
                    name="is_fuwuyuan"
                    placeholder="Pilih status"
                    value={values.is_fuwuyuan}
                    onChange={handleChange}
                  >
                    <option value="true">Ya</option>
                    <option value="false">Tidak</option>
                  </Select>
                  {touched.is_fuwuyuan && errors.is_fuwuyuan && (
                    <Text color="red.500" fontSize="sm">{errors.is_fuwuyuan}</Text>
                  )}
                </FormControl>

                {/* LING MING TIME — OPTIONAL */}
                <FormControl>
                  <FormLabel fontWeight="bold">Waktu Ling Ming</FormLabel>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <GridItem>
                      <FormLabel fontSize="sm" mb={1}>Bulan</FormLabel>
                      <Select
                        name="ling_ming_month"
                        placeholder="Pilih bulan (opsional)"
                        value={values.ling_ming_month}
                        onChange={handleChange}
                      >
                        <option value="">—</option>
                        {months.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </Select>
                    </GridItem>

                    <GridItem>
                      <FormLabel fontSize="sm" mb={1}>Tahun</FormLabel>
                      <Select
                        name="ling_ming_year"
                        placeholder="Pilih tahun (opsional)"
                        value={values.ling_ming_year}
                        onChange={handleChange}
                      >
                        <option value="">—</option>
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </Select>
                    </GridItem>
                  </Grid>
                </FormControl>

                {/* TOMBOL SIMPAN */}
                <Button
                  type="submit"
                  colorScheme="green"
                  size="lg"
                  w="100%"
                  mt={6}
                  isLoading={isSubmitting}
                  loadingText="Menyimpan..."
                >
                  Simpan
                </Button>
              </VStack>
            </Form>
          )}
        </Formik>
      </Box>
    </Layout>
  );
}