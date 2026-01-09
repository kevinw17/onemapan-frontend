import Layout from "@/components/layout";
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Spinner, Flex, Text, Button,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  SimpleGrid, useDisclosure, VStack, HStack, FormControl, FormLabel,
  IconButton, Collapse, Checkbox
} from "@chakra-ui/react";
import { useFetchDianChuanShi } from "@/features/dianchuanshi/useFetchDianChuanShi";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { FiPlus, FiFilter, FiMinus, FiX } from "react-icons/fi";

export default function DianChuanShiPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);
  const router = useRouter();

  const [filterOpen, setFilterOpen] = useState(false);
  const [tempAreaFilter, setTempAreaFilter] = useState([]);
  const [tempFuwuyuanFilter, setTempFuwuyuanFilter] = useState([]);
  const [areaFilter, setAreaFilter] = useState([]);
  const [fuwuyuanFilter, setFuwuyuanFilter] = useState([]);
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [isFuwuyuanOpen, setIsFuwuyuanOpen] = useState(false);

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

  const { data: panditas, isLoading: isDataLoading } = useFetchDianChuanShi({ limit: 1000 });

  const isLoading = isDataLoading || isSuperAdmin === null;

  const formatArea = (area) => {
    if (!area) return "-";
    return area.startsWith("Korwil_")
      ? `Wilayah ${area.replace("Korwil_", "")}`
      : area;
  };

  const formatLingMing = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const month = d.toLocaleString("id-ID", { month: "long" });
    const year = d.getFullYear();
    return `${month} ${year}`;
  };

  const rawList = (panditas?.data || []).map(p => ({
    dian_chuan_shi_id: p.id,
    name: p.name || "-",
    mandarin_name: p.mandarin_name || "-",
    area_raw: p.area || null,
    area: formatArea(p.area),
    is_fuwuyuan_raw: p.is_fuwuyuan,
    is_fuwuyuan: p.is_fuwuyuan ? "Ya" : "Tidak",
    ling_ming_time: formatLingMing(p.ling_ming_time),
  })).sort((a, b) => a.dian_chuan_shi_id - b.dian_chuan_shi_id);

  const filteredList = useMemo(() => {
    return rawList.filter(p => {
      const matchArea = areaFilter.length === 0 || areaFilter.includes(p.area_raw);
      const matchFuwuyuan = fuwuyuanFilter.length === 0 ||
        (fuwuyuanFilter.includes("true") && p.is_fuwuyuan_raw === true) ||
        (fuwuyuanFilter.includes("false") && p.is_fuwuyuan_raw === false);
      return matchArea && matchFuwuyuan;
    });
  }, [rawList, areaFilter, fuwuyuanFilter]);

  const totalPandita = filteredList.length;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPandita, setSelectedPandita] = useState(null);

  const handleRowClick = (pandita) => {
    setSelectedPandita(pandita);
    onOpen();
  };

  const handleAreaChange = (value) => {
    setTempAreaFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleFuwuyuanChange = (value) => {
    setTempFuwuyuanFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const applyFilters = () => {
    setAreaFilter([...tempAreaFilter]);
    setFuwuyuanFilter([...tempFuwuyuanFilter]);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setTempAreaFilter([]);
    setTempFuwuyuanFilter([]);
    setAreaFilter([]);
    setFuwuyuanFilter([]);
    setFilterOpen(false);
  };

  if (isLoading) {
    return (
      <Layout title="List Pandita">
        <Flex direction="column" align="center" justify="center" h="80vh" gap={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">Memuat data pandita...</Text>
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
    <Layout title="List Pandita">
      <Box p={4}>
        <Flex align="center" justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <Heading size="md" fontFamily="inherit">
            Daftar Pandita (Dian Chuan Shi)
            <Box as="span" fontSize="lg" color="gray.500" ml={2}>
              {totalPandita}
            </Box>
          </Heading>

          <Flex gap={2} align="center" flexWrap="nowrap" flexShrink={0}>
            <Box position="relative">
              <Button
                colorScheme="white"
                textColor="gray.700"
                borderRadius="full"
                borderWidth="1px"
                borderColor="gray.400"
                size="xs"
                minW="80px"
                leftIcon={<FiFilter />}
                onClick={() => setFilterOpen(!filterOpen)}
                fontFamily="inherit"
                fontSize="sm"
              >
                Filter
              </Button>

              {filterOpen && (
                <VStack
                  spacing={3}
                  p={4}
                  bg="white"
                  borderRadius="md"
                  boxShadow="md"
                  zIndex={10}
                  align="stretch"
                  w="280px"
                  position="absolute"
                  top="100%"
                  right={0}
                  mt={1}
                  fontFamily="inherit"
                  fontSize="sm"
                >
                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0} fontSize="sm" fontFamily="inherit">Wilayah</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={isAreaOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsAreaOpen(!isAreaOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isAreaOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        {[1, 2, 3, 4, 5, 6].map(i => {
                          const value = `Korwil_${i}`;
                          return (
                            <Checkbox
                              key={i}
                              size="sm"
                              isChecked={tempAreaFilter.includes(value)}
                              onChange={() => handleAreaChange(value)}
                              fontSize="sm"
                              fontFamily="inherit"
                            >
                              Wilayah {i}
                            </Checkbox>
                          );
                        })}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0} fontSize="sm" fontFamily="inherit">Status Fuwuyuan</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={isFuwuyuanOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsFuwuyuanOpen(!isFuwuyuanOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isFuwuyuanOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        <Checkbox
                          size="sm"
                          isChecked={tempFuwuyuanFilter.includes("true")}
                          onChange={() => handleFuwuyuanChange("true")}
                          fontSize="sm"
                          fontFamily="inherit"
                        >
                          Fuwuyuan
                        </Checkbox>
                        <Checkbox
                          size="sm"
                          isChecked={tempFuwuyuanFilter.includes("false")}
                          onChange={() => handleFuwuyuanChange("false")}
                          fontSize="sm"
                          fontFamily="inherit"
                        >
                          Bukan Fuwuyuan
                        </Checkbox>
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <HStack justify="flex-end" spacing={2} mt={2}>
                    <Button size="sm" variant="ghost" onClick={clearFilters}>Reset</Button>
                    <Button size="sm" onClick={() => setFilterOpen(false)}>Cancel</Button>
                    <Button size="sm" colorScheme="blue" onClick={applyFilters}>Terapkan</Button>
                  </HStack>
                </VStack>
              )}
            </Box>

            <Button
              colorScheme="blue"
              borderRadius="full"
              size="xs"
              minW="140px"
              leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
              onClick={() => router.push("/dianchuanshi/addDianChuanShi")}
              fontSize="sm"
              fontFamily="inherit"
            >
              Tambah Pandita
            </Button>
          </Flex>
        </Flex>

        <Box overflowX="auto">
          <Table variant="striped" colorScheme="gray" size="sm">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Nama Indonesia</Th>
                <Th>Nama Mandarin</Th>
                <Th>Area</Th>
                <Th>Status Fuwuyuan</Th>
                <Th>Waktu Ling Ming</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredList.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" color="gray.500">
                    Tidak ada data pandita sesuai filter
                  </Td>
                </Tr>
              ) : (
                filteredList.map((p) => (
                  <Tr
                    key={p.dian_chuan_shi_id}
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                    onClick={() => handleRowClick(p)}
                  >
                    <Td>{p.dian_chuan_shi_id}</Td>
                    <Td>{p.name}</Td>
                    <Td>{p.mandarin_name}</Td>
                    <Td>{p.area}</Td>
                    <Td>{p.is_fuwuyuan}</Td>
                    <Td>{p.ling_ming_time}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader fontSize="md" display="flex" justifyContent="space-between" alignItems="center">
              Detail Pandita
              <Flex gap={2}>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => {
                    onClose();
                    router.push(`/dianchuanshi/editDianChuanShi?dianChuanShiId=${selectedPandita.dian_chuan_shi_id}`);
                  }}
                >
                  Edit
                </Button>
                <ModalCloseButton position="static" />
              </Flex>
            </ModalHeader>
            <ModalBody pb={6} fontSize="sm">
              {selectedPandita && (
                <SimpleGrid columns={2} spacing={5}>
                  <Box><Text fontWeight="medium" color="gray.600">ID Pandita</Text><Text>{selectedPandita.dian_chuan_shi_id}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Nama Indonesia</Text><Text>{selectedPandita.name}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Nama Mandarin</Text><Text>{selectedPandita.mandarin_name}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Area</Text><Text>{selectedPandita.area}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Status Fuwuyuan</Text><Text>{selectedPandita.is_fuwuyuan}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Waktu Ling Ming</Text><Text>{selectedPandita.ling_ming_time}</Text></Box>
                </SimpleGrid>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
}