import {
  Box, Button, FormControl, FormLabel, Heading,
  Input, VStack, Grid, GridItem, useToast, Text
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import Layout from "@/components/layout";
import { axiosInstance } from "@/lib/axios";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { useFetchInstitution } from "@/features/institution/useFetchInstitution";
import { useEffect, useState } from "react";

const addInstitutionSchema = Yup.object().shape({
  institution_name: Yup.string().required("Nama Lembaga wajib diisi"),
  institution_leader: Yup.string().required("Pimpinan wajib diisi"),
});

export default function AddInstitutionPage() {
  const toast = useToast();
  const router = useRouter();
  const { data: institutions, isLoading } = useFetchInstitution({ limit: 1000 });
  const [nextId, setNextId] = useState(null);

  useEffect(() => {
    if (institutions?.data) {
      const ids = institutions.data
        .map(i => i.institution_id)
        .filter(id => typeof id === 'number')
        .sort((a, b) => a - b);
      const maxId = ids.length > 0 ? Math.max(...ids) : 0;
      setNextId(maxId + 1);
    }
  }, [institutions]);

  const handleSubmit = async (values, { setSubmitting }) => {
    if (nextId === null) {
      toast({
        title: "Gagal",
        description: "Sedang memuat data ID...",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const payload = {
        institution_id: nextId,
        institution_name: values.institution_name,
        institution_leader: values.institution_leader,
        institution_secretary_general: values.institution_secretary_general || null,
      };

      console.log("Payload dikirim:", payload);

      await axiosInstance.post("/institution", payload);

      toast({
        title: "Lembaga berhasil ditambahkan",
        description: `ID: ${nextId}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/institution");
    } catch (err) {
      console.error("Error:", err.response?.data);
      toast({
        title: "Gagal menyimpan lembaga",
        description: err?.response?.data?.message || "Terjadi kesalahan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || nextId === null) {
    return (
      <Layout title="Tambah Lembaga">
        <Box p={4} textAlign="center">
          <Text>Memuat ID lembaga terakhir...</Text>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Tambah Lembaga">
      <Box p={4}>
        <Formik
          initialValues={{
            institution_name: "",
            institution_leader: "",
            institution_secretary_general: "",
          }}
          validationSchema={addInstitutionSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, touched, errors, isSubmitting }) => (
            <Form>
              <VStack spacing={6} align="stretch">
                <Heading size="lg">Tambah Lembaga</Heading>

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

                  <FormControl>
                    <FormLabel fontWeight="bold">Sekretaris Jenderal</FormLabel>
                    <Input
                      name="institution_secretary_general"
                      value={values.institution_secretary_general}
                      onChange={handleChange}
                      placeholder="Masukkan nama sekretaris jenderal"
                    />
                  </FormControl>
                </Grid>

                <Button
                  type="submit"
                  colorScheme="green"
                  size="lg"
                  w="100%"
                  mt={6}
                  isLoading={isSubmitting}
                  loadingText="Menyimpan..."
                >
                  Simpan Lembaga
                </Button>
              </VStack>
            </Form>
          )}
        </Formik>
      </Box>
    </Layout>
  );
}