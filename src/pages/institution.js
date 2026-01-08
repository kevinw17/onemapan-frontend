// src/pages/institution/institution.js
import Layout from "@/components/layout";
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Spinner, Flex, Text, Button,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  SimpleGrid, useDisclosure
} from "@chakra-ui/react";
import { useFetchInstitution } from "@/features/institution/useFetchInstitution";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FiPlus } from "react-icons/fi";

export default function InstitutionPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);
  const router = useRouter();

  // === AUTH ===
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const scope = decoded.scope?.toLowerCase();
          const role = decoded.role?.toLowerCase();

          const isNasional = scope === "nasional" || 
            ["superadmin", "ketualembaga", "sekjenlembaga"].includes(role);

          setIsSuperAdmin(isNasional);
        } catch (err) {
          console.error("Token invalid:", err);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  // === DATA ===
  const { data: institutions, isLoading: isDataLoading } = useFetchInstitution({ limit: 1000 });

  const isLoading = isDataLoading || isSuperAdmin === null;

  // === MAPPING DATA ===
  const lembagas = (institutions?.data || [])
    .map(i => ({
      institution_id: i.institution_id,
      institution_name: i.institution_name || "-",
      institution_leader: i.institution_leader || "-",
      institution_secretary_general: i.institution_secretary_general || "-",
    }))
    .sort((a, b) => a.institution_id - b.institution_id);

  const totalLembaga = lembagas.length;

  // === MODAL DETAIL ===
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLembaga, setSelectedLembaga] = useState(null);

  const handleRowClick = (lembaga) => {
    setSelectedLembaga(lembaga);
    onOpen();
  };

  // === RENDER ===
  if (isLoading) {
    return (
      <Layout title="List Lembaga">
        <Flex direction="column" align="center" justify="center" h="80vh" gap={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">Memuat data lembaga...</Text>
        </Flex>
      </Layout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Layout title="Akses Ditolak">
        <Flex direction="column" align="center" justify="center" h="80vh" color="red.500">
          <Heading size="lg">Akses Ditolak</Heading>
          <Text mt={2}>Hanya Super Admin yang dapat mengakses halaman ini.</Text>
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout title="List Lembaga">
      <Box p={4}>
        {/* JUDUL + TOMBOL */}
        <Flex align="center" justify="space-between" mb={6} flexWrap="wrap" gap={2}>
          <Heading size="md" fontFamily="inherit">
            Daftar Lembaga
            <Box as="span" fontSize="lg" color="gray.500" ml={2}>
              {totalLembaga}
            </Box>
          </Heading>

          <Button
            colorScheme="blue"
            borderRadius="full"
            size="xs"
            minW="140px"
            leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
            onClick={() => router.push("/institution/addInstitution")}
            fontSize="sm"
            fontFamily="inherit"
          >
            Tambah Lembaga
          </Button>
        </Flex>

        {/* TABEL */}
        <Box overflowX="auto">
          <Table variant="striped" colorScheme="gray" size="sm">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Nama Lembaga</Th>
                <Th>Sekretaris Jenderal</Th>
                <Th>Pimpinan</Th>
              </Tr>
            </Thead>
            <Tbody>
              {lembagas.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center" color="gray.500">
                    Belum ada data lembaga
                  </Td>
                </Tr>
              ) : (
                lembagas.map((l) => (
                  <Tr
                    key={l.institution_id}
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                    onClick={() => handleRowClick(l)}
                  >
                    <Td>{l.institution_id}</Td>
                    <Td>{l.institution_name}</Td>
                    <Td>{l.institution_secretary_general}</Td>
                    <Td>{l.institution_leader}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
            <ModalHeader fontSize="md" display="flex" justifyContent="space-between" alignItems="center">
            Detail Lembaga
            <Flex gap={2}>
                <Button
                size="sm"
                colorScheme="blue"
                onClick={() => {
                    onClose();
                    router.push(`/institution/editInstitution?institutionId=${selectedLembaga?.institution_id}`);
                }}
                >
                Edit
                </Button>
                <ModalCloseButton position="static" />
            </Flex>
            </ModalHeader>
            <ModalBody pb={6}>
            {selectedLembaga && (
                <Box>
                <Box mb={4}>
                    <Text fontWeight="medium" color="gray.600" fontSize="sm">Nama Lembaga</Text>
                    <Text fontSize="md" fontWeight="semibold">{selectedLembaga.institution_name}</Text>
                </Box>
                <Box mb={4}>
                    <Text fontWeight="medium" color="gray.600" fontSize="sm">Pimpinan</Text>
                    <Text fontSize="md">{selectedLembaga.institution_leader}</Text>
                </Box>
                <Box mb={4}>
                    <Text fontWeight="medium" color="gray.600" fontSize="sm">Sekretaris Jenderal</Text>
                    <Text fontSize="md">{selectedLembaga.institution_secretary_general}</Text>
                </Box>
                </Box>
            )}
            </ModalBody>
        </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
}