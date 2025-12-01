// pages/fotang.js
import Layout from "@/components/layout";
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Spinner, Flex, Text, Button,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  SimpleGrid, useDisclosure, VStack, HStack, FormControl, FormLabel,
  IconButton, Collapse, Checkbox
} from "@chakra-ui/react";
import { useFetchFotang } from "@/features/location/useFetchFotang";
import { useFetchUserProfile } from "@/features/user/useFetchUserProfile";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { FiPlus, FiFilter, FiMinus } from "react-icons/fi";
import { isNationalRole } from "@/lib/roleUtils";

export default function FotangPage() {
  const [userId, setUserId] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);
  const router = useRouter();

  // === FILTER STATE ===
  const [filterOpen, setFilterOpen] = useState(false);

  // Temp filters (untuk modal)
  const [tempAreaFilter, setTempAreaFilter] = useState([]);
  const [tempProvinceFilter, setTempProvinceFilter] = useState([]);
  const [tempCityFilter, setTempCityFilter] = useState([]);
  const [tempDistrictFilter, setTempDistrictFilter] = useState([]);
  const [tempLocalityFilter, setTempLocalityFilter] = useState([]);

  // Applied filters
  const [areaFilter, setAreaFilter] = useState([]);
  const [provinceFilter, setProvinceFilter] = useState([]);
  const [cityFilter, setCityFilter] = useState([]);
  const [districtFilter, setDistrictFilter] = useState([]);
  const [localityFilter, setLocalityFilter] = useState([]);

  // Collapse state
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isLocalityOpen, setIsLocalityOpen] = useState(false);

  // === AUTH ===
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const decodedUserId = parseInt(decoded.user_info_id);
          if (decodedUserId && !isNaN(decodedUserId)) {
            setUserId(decodedUserId);
          } else {
            router.push("/login");
          }
        } catch (err) {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  // === PROFILE ===
  const { data: userProfile, isLoading: isProfileLoading } = useFetchUserProfile(userId);

  useEffect(() => {
    if (userProfile?.role) {
      setIsSuperAdmin(isNationalRole(userProfile?.role));
    }
  }, [userProfile]);

  // === DATA ===
  const { data: locations, isLoading: isDataLoading } = useFetchFotang({ limit: 1000 });

  const isLoading = isProfileLoading || isDataLoading || isSuperAdmin === null;

  // === MAPPING DATA ===
  const viharas = (locations?.data || []).map(f => {
    const areaRaw = f.area || null;
    const areaDisplay = areaRaw ? `Wilayah ${areaRaw.replace("Korwil_", "")}` : "-";

    return {
      location_id: f.fotang_id,
      location_name: f.location_name || "-",
      location_mandarin_name: f.location_mandarin_name || "-",
      province: f.locality?.district?.city?.province?.name || "-",
      province_id: f.locality?.district?.city?.province?.id || null,
      city: f.locality?.district?.city?.name || "-",
      city_id: f.locality?.district?.city?.id || null,
      district: f.locality?.district?.name || "-",
      district_id: f.locality?.district?.id || null,
      locality: f.locality?.name || "-",
      locality_id: f.locality?.id || null,
      street: f.street || "-",
      postal_code: f.postal_code || "-",
      area_raw: areaRaw,
      area: areaDisplay,
    };
  }).sort((a, b) => a.location_id - b.location_id);

  // === DERIVED FILTER OPTIONS (CASCADING) ===
  const availableProvinces = useMemo(() => {
    if (tempAreaFilter.length === 0) return [];
    return [...new Set(
      viharas
        .filter(v => tempAreaFilter.includes(v.area_raw))
        .map(v => v.province)
        .filter(Boolean)
    )].sort();
  }, [viharas, tempAreaFilter]);

  const availableCities = useMemo(() => {
    if (tempProvinceFilter.length === 0) return [];
    return [...new Set(
      viharas
        .filter(v => tempProvinceFilter.includes(v.province))
        .map(v => v.city)
        .filter(Boolean)
    )].sort();
  }, [viharas, tempProvinceFilter]);

  const availableDistricts = useMemo(() => {
    if (tempCityFilter.length === 0) return [];
    return [...new Set(
      viharas
        .filter(v => tempCityFilter.includes(v.city))
        .map(v => v.district)
        .filter(Boolean)
    )].sort();
  }, [viharas, tempCityFilter]);

  const availableLocalities = useMemo(() => {
    if (tempDistrictFilter.length === 0) return [];
    return [...new Set(
      viharas
        .filter(v => tempDistrictFilter.includes(v.district))
        .map(v => v.locality)
        .filter(Boolean)
    )].sort();
  }, [viharas, tempDistrictFilter]);

  // === FILTER LOGIC ===
  const filteredList = useMemo(() => {
    return viharas.filter(v => {
      const matchArea = areaFilter.length === 0 || areaFilter.includes(v.area_raw);
      const matchProvince = provinceFilter.length === 0 || provinceFilter.includes(v.province);
      const matchCity = cityFilter.length === 0 || cityFilter.includes(v.city);
      const matchDistrict = districtFilter.length === 0 || districtFilter.includes(v.district);
      const matchLocality = localityFilter.length === 0 || localityFilter.includes(v.locality);

      return matchArea && matchProvince && matchCity && matchDistrict && matchLocality;
    });
  }, [viharas, areaFilter, provinceFilter, cityFilter, districtFilter, localityFilter]);

  const totalVihara = filteredList.length;

  // === MODAL DETAIL ===
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedVihara, setSelectedVihara] = useState(null);

  const handleRowClick = (vihara) => {
    setSelectedVihara(vihara);
    onOpen();
  };

  // === FILTER HANDLERS ===
  const handleAreaChange = (value) => {
    setTempAreaFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
    // Reset lower levels
    setTempProvinceFilter([]);
    setTempCityFilter([]);
    setTempDistrictFilter([]);
    setTempLocalityFilter([]);
  };

  const handleProvinceChange = (value) => {
    setTempProvinceFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
    setTempCityFilter([]);
    setTempDistrictFilter([]);
    setTempLocalityFilter([]);
  };

  const handleCityChange = (value) => {
    setTempCityFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
    setTempDistrictFilter([]);
    setTempLocalityFilter([]);
  };

  const handleDistrictChange = (value) => {
    setTempDistrictFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
    setTempLocalityFilter([]);
  };

  const handleLocalityChange = (value) => {
    setTempLocalityFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const applyFilters = () => {
    setAreaFilter([...tempAreaFilter]);
    setProvinceFilter([...tempProvinceFilter]);
    setCityFilter([...tempCityFilter]);
    setDistrictFilter([...tempDistrictFilter]);
    setLocalityFilter([...tempLocalityFilter]);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setTempAreaFilter([]);
    setTempProvinceFilter([]);
    setTempCityFilter([]);
    setTempDistrictFilter([]);
    setTempLocalityFilter([]);
    setAreaFilter([]);
    setProvinceFilter([]);
    setCityFilter([]);
    setDistrictFilter([]);
    setLocalityFilter([]);
    setFilterOpen(false);
  };

  // === RENDER ===
  if (isLoading) {
    return (
      <Layout title="List Vihara">
        <Flex direction="column" align="center" justify="center" h="80vh" gap={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">Memuat data vihara...</Text>
        </Flex>
      </Layout>
    );
  }

  if (!isNationalRole(userProfile?.role)) {
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
    <Layout title="List Vihara">
      <Box p={4}>
        {/* JUDUL + FILTER + TOMBOL TAMBAH */}
        <Flex align="center" justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <Heading size="md" fontFamily="inherit">
            Daftar Vihara (Fotang)
            <Box as="span" fontSize="lg" color="gray.500" ml={2}>
              {totalVihara}
            </Box>
          </Heading>

          <Flex gap={2} align="center" flexWrap="nowrap" flexShrink={0}>
            {/* TOMBOL FILTER */}
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
                  w="320px"
                  maxH="70vh"
                  overflowY="auto"
                  position="absolute"
                  top="100%"
                  right={0}
                  mt={1}
                  fontFamily="inherit"
                  fontSize="sm"
                >
                  {/* WILAYAH */}
                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0} fontSize="sm">Wilayah</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={isAreaOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsAreaOpen(!isAreaOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isAreaOpen} animateOpacity>
                      <VStack align="start" spacing={1} maxH="120px" overflowY="auto">
                        {[1, 2, 3, 4, 5, 6].map(i => {
                          const value = `Korwil_${i}`;
                          return (
                            <Checkbox
                              key={i}
                              size="sm"
                              isChecked={tempAreaFilter.includes(value)}
                              onChange={() => handleAreaChange(value)}
                            >
                              Wilayah {i}
                            </Checkbox>
                          );
                        })}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  {/* PROVINSI */}
                  {tempAreaFilter.length > 0 && (
                    <FormControl>
                      <Flex align="center" justify="space-between">
                        <FormLabel mb={0} fontSize="sm">Provinsi</FormLabel>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={isProvinceOpen ? <FiMinus /> : <FiPlus />}
                          onClick={() => setIsProvinceOpen(!isProvinceOpen)}
                          _hover={{ bg: "transparent" }}
                        />
                      </Flex>
                      <Collapse in={isProvinceOpen} animateOpacity>
                        <VStack align="start" spacing={1} maxH="120px" overflowY="auto">
                          {availableProvinces.map(prov => (
                            <Checkbox
                              key={prov}
                              size="sm"
                              isChecked={tempProvinceFilter.includes(prov)}
                              onChange={() => handleProvinceChange(prov)}
                            >
                              {prov}
                            </Checkbox>
                          ))}
                        </VStack>
                      </Collapse>
                    </FormControl>
                  )}

                  {/* KOTA */}
                  {tempProvinceFilter.length > 0 && (
                    <FormControl>
                      <Flex align="center" justify="space-between">
                        <FormLabel mb={0} fontSize="sm">Kota/Kab</FormLabel>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={isCityOpen ? <FiMinus /> : <FiPlus />}
                          onClick={() => setIsCityOpen(!isCityOpen)}
                          _hover={{ bg: "transparent" }}
                        />
                      </Flex>
                      <Collapse in={isCityOpen} animateOpacity>
                        <VStack align="start" spacing={1} maxH="120px" overflowY="auto">
                          {availableCities.map(city => (
                            <Checkbox
                              key={city}
                              size="sm"
                              isChecked={tempCityFilter.includes(city)}
                              onChange={() => handleCityChange(city)}
                            >
                              {city}
                            </Checkbox>
                          ))}
                        </VStack>
                      </Collapse>
                    </FormControl>
                  )}

                  {/* KECAMATAN */}
                  {tempCityFilter.length > 0 && (
                    <FormControl>
                      <Flex align="center" justify="space-between">
                        <FormLabel mb={0} fontSize="sm">Kecamatan</FormLabel>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={isDistrictOpen ? <FiMinus /> : <FiPlus />}
                          onClick={() => setIsDistrictOpen(!isDistrictOpen)}
                          _hover={{ bg: "transparent" }}
                        />
                      </Flex>
                      <Collapse in={isDistrictOpen} animateOpacity>
                        <VStack align="start" spacing={1} maxH="120px" overflowY="auto">
                          {availableDistricts.map(dist => (
                            <Checkbox
                              key={dist}
                              size="sm"
                              isChecked={tempDistrictFilter.includes(dist)}
                              onChange={() => handleDistrictChange(dist)}
                            >
                              {dist}
                            </Checkbox>
                          ))}
                        </VStack>
                      </Collapse>
                    </FormControl>
                  )}

                  {/* KELURAHAN */}
                  {tempDistrictFilter.length > 0 && (
                    <FormControl>
                      <Flex align="center" justify="space-between">
                        <FormLabel mb={0} fontSize="sm">Kelurahan</FormLabel>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={isLocalityOpen ? <FiMinus /> : <FiPlus />}
                          onClick={() => setIsLocalityOpen(!isLocalityOpen)}
                          _hover={{ bg: "transparent" }}
                        />
                      </Flex>
                      <Collapse in={isLocalityOpen} animateOpacity>
                        <VStack align="start" spacing={1} maxH="120px" overflowY="auto">
                          {availableLocalities.map(loc => (
                            <Checkbox
                              key={loc}
                              size="sm"
                              isChecked={tempLocalityFilter.includes(loc)}
                              onChange={() => handleLocalityChange(loc)}
                            >
                              {loc}
                            </Checkbox>
                          ))}
                        </VStack>
                      </Collapse>
                    </FormControl>
                  )}

                  <HStack justify="flex-end" spacing={2} mt={3}>
                    <Button size="sm" variant="ghost" onClick={clearFilters}>Reset</Button>
                    <Button size="sm" onClick={() => setFilterOpen(false)}>Cancel</Button>
                    <Button size="sm" colorScheme="blue" onClick={applyFilters}>Terapkan</Button>
                  </HStack>
                </VStack>
              )}
            </Box>

            {/* TOMBOL TAMBAH VIHARA */}
            <Button
              colorScheme="blue"
              borderRadius="full"
              size="xs"
              minW="140px"
              leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
              onClick={() => router.push("/fotang/addFotang")}
              fontSize="sm"
              fontFamily="inherit"
            >
              Tambah Vihara
            </Button>
          </Flex>
        </Flex>

        {/* TABEL RESPONSIF */}
        <Box
          overflowX="auto"
          borderRadius="md"
          boxShadow="sm"
          bg="white"
          css={{
            "&::-webkit-scrollbar": { height: "8px" },
            "&::-webkit-scrollbar-track": { background: "#f1f1f1", borderRadius: "4px" },
            "&::-webkit-scrollbar-thumb": { background: "#c1c1c1", borderRadius: "4px" },
          }}
        >
          <Table variant="striped" colorScheme="gray" size="sm">
            <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
              <Tr>
                <Th width="60px" position="sticky" left={0} bg="gray.50" zIndex={2} fontSize="xs">ID</Th>
                <Th minWidth="180px" fontSize="xs">Nama Vihara</Th>
                <Th minWidth="100px" fontSize="xs">Mandarin</Th>
                <Th width="90px" fontSize="xs">Wilayah</Th>
                <Th minWidth="100px" fontSize="xs">Provinsi</Th>
                <Th minWidth="100px" fontSize="xs">Kota</Th>
                <Th minWidth="100px" fontSize="xs">Kec.</Th>
                <Th minWidth="100px" fontSize="xs">Kel.</Th>
                <Th minWidth="140px" fontSize="xs">Alamat</Th>
                <Th width="80px" fontSize="xs">Kode Pos</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredList.length === 0 ? (
                <Tr>
                  <Td colSpan={10} textAlign="center" color="gray.500" py={6}>
                    Tidak ada data vihara sesuai filter
                  </Td>
                </Tr>
              ) : (
                filteredList.map((v) => (
                  <Tr
                    key={v.location_id}
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                    onClick={() => handleRowClick(v)}
                    fontSize="xs"
                  >
                    <Td position="sticky" left={0} bg="white" _hover={{ bg: "gray.50" }} whiteSpace="nowrap">
                      {v.location_id}
                    </Td>
                    <Td whiteSpace="normal" wordBreak="break-word">{v.location_name}</Td>
                    <Td whiteSpace="normal">{v.location_mandarin_name}</Td>
                    <Td whiteSpace="nowrap">{v.area}</Td>
                    <Td whiteSpace="normal">{v.province}</Td>
                    <Td whiteSpace="normal">{v.city}</Td>
                    <Td whiteSpace="normal">{v.district}</Td>
                    <Td whiteSpace="normal">{v.locality}</Td>
                    <Td whiteSpace="normal" wordBreak="break-word" minWidth="140px" maxWidth="200px">
                      {v.street}
                    </Td>
                    <Td whiteSpace="nowrap">{v.postal_code}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        {/* MODAL DETAIL */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader fontSize="md" display="flex" justifyContent="space-between" alignItems="center">
              Detail Vihara
              <Flex gap={2}>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => {
                    onClose();
                    router.push(`/fotang/editFotang?fotangId=${selectedVihara?.location_id}`);
                  }}
                >
                  Edit
                </Button>
                <ModalCloseButton position="static" />
              </Flex>
            </ModalHeader>
            <ModalBody pb={6} fontSize="sm">
              {selectedVihara && (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  <Box><Text fontWeight="medium" color="gray.600">ID Vihara</Text><Text>{selectedVihara.location_id}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Nama Vihara</Text><Text>{selectedVihara.location_name}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Nama Mandarin</Text><Text>{selectedVihara.location_mandarin_name}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Wilayah</Text><Text>{selectedVihara.area}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Provinsi</Text><Text>{selectedVihara.province}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Kota/Kabupaten</Text><Text>{selectedVihara.city}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Kecamatan</Text><Text>{selectedVihara.district}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Kelurahan</Text><Text>{selectedVihara.locality}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Alamat Jalan</Text><Text whiteSpace="pre-wrap">{selectedVihara.street}</Text></Box>
                  <Box><Text fontWeight="medium" color="gray.600">Kode Pos</Text><Text>{selectedVihara.postal_code}</Text></Box>
                </SimpleGrid>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
}