import Layout from "../components/layout";
import {
  Table,
  Tbody,
  Thead,
  Tr,
  Th,
  Td,
  Spinner,
  Box,
  useDisclosure,
  Button,
  Input,
  useToast,
  Flex,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Select,
  Checkbox,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Collapse,
  HStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
} from "@chakra-ui/react";
import { useFetchQiudaos } from "@/features/qiudao/useFetchQiudaos";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { FiSearch, FiX, FiPlus, FiFilter, FiMinus } from "react-icons/fi";
import Pagination from "@/components/Pagination";
import { useUpdateLocation } from "@/features/location/useUpdateLocation";
import QiudaoDetailModal from "@/components/QiudaoDetailModal";
import { useDeleteQiudao } from "@/features/qiudao/useDeleteQiudao";
import { useUpdateQiudao } from "@/features/qiudao/useUpdateQiudao";
import { jwtDecode } from "jwt-decode";
import { useQueryClient } from "@tanstack/react-query";

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, selectedCount, isDeleting }) => (
  <Modal isOpen={isOpen} onClose={onClose} maxW="600px">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Konfirmasi Hapus</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>Apakah Anda yakin ingin menghapus {selectedCount} data qiudao?</Text>
      </ModalBody>
      <ModalFooter>
        <Button
          colorScheme="red"
          onClick={onConfirm}
          isLoading={isDeleting}
          size="sm"
        >
          Hapus
        </Button>
        <Button variant="ghost" onClick={onClose} ml={3} size="sm">
          Batal
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default function QiudaoPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("qiu_dao_mandarin_name");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userScope, setUserScope] = useState(null);
  const [userArea, setUserArea] = useState(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [canCreateQiudao, setCanCreateQiudao] = useState(false);
  const [canUpdateQiudao, setCanUpdateQiudao] = useState(false);
  const [canDeleteQiudao, setCanDeleteQiudao] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    qiu_dao_id: true,
    qiu_dao_name: true,
    qiu_dao_mandarin_name: false,
    location_name: true,
    location_mandarin_name: false,
    dian_chuan_shi_name: true,
    dian_chuan_shi_mandarin_name: false,
    yin_shi_qd_name: true,
    yin_shi_qd_mandarin_name: false,
    bao_shi_qd_name: true,
    bao_shi_qd_mandarin_name: false,
    date: true,
  });

  const [filterOpen, setFilterOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState([]);
  const [locationMandarinFilter, setLocationMandarinFilter] = useState([]);
  const [dianChuanShiFilter, setDianChuanShiFilter] = useState([]);
  const [dianChuanShiMandarinFilter, setDianChuanShiMandarinFilter] = useState([]);
  const [tempLocationFilter, setTempLocationFilter] = useState([]);
  const [tempLocationMandarinFilter, setTempLocationMandarinFilter] = useState([]);
  const [tempDianChuanShiFilter, setTempDianChuanShiFilter] = useState([]);
  const [tempDianChuanShiMandarinFilter, setTempDianChuanShiMandarinFilter] = useState([]);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLocationMandarinOpen, setIsLocationMandarinOpen] = useState(false);
  const [isDianChuanShiOpen, setIsDianChuanShiOpen] = useState(false);
  const [isDianChuanShiMandarinOpen, setIsDianChuanShiMandarinOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});
  const [columnSearch, setColumnSearch] = useState({});
  const filterableColumns = [
    "location_name",
    "location_mandarin_name",
    "dian_chuan_shi_name",
    "dian_chuan_shi_mandarin_name",
  ];

  const tableHeaders = [
    { key: "qiu_dao_id", label: "ID Qiudao" },
    { key: "qiu_dao_name", label: "Nama Indonesia" },
    { key: "qiu_dao_mandarin_name", label: "Nama Mandarin Qiudao" },
    { key: "location_name", label: "Nama Vihara (Indonesia)" },
    { key: "location_mandarin_name", label: "Nama Vihara (Mandarin)" },
    { key: "dian_chuan_shi_name", label: "Nama Indonesia Pandita" },
    { key: "dian_chuan_shi_mandarin_name", label: "Nama Mandarin Pandita" },
    { key: "yin_shi_qd_name", label: "Nama Indonesia Guru Pengajak" },
    { key: "yin_shi_qd_mandarin_name", label: "Nama Mandarin Guru Pengajak" },
    { key: "bao_shi_qd_name", label: "Nama Indonesia Guru Penanggung" },
    { key: "bao_shi_qd_mandarin_name", label: "Nama Mandarin Guru Penanggung" },
    { key: "date", label: "Tanggal Qiudao" },
  ].filter(header => columnVisibility[header.key]);

  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const [selectedQiudao, setSelectedQiudao] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const updateLocationMutation = useUpdateLocation();
  const updateQiudaoMutation = useUpdateQiudao();
  const deleteQiudaoMutation = useDeleteQiudao();
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const isNotSelfScope = userScope !== "self";

  useEffect(() => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const decodedUserId = decoded.user_info_id;
        const perms = decoded.permissions || {};

        if (decodedUserId) {
          setUserId(decodedUserId);
        }

        const createQiudao = !!perms.qiudao?.create;
        const updateQiudao = !!perms.qiudao?.update;
        const deleteQiudao = !!perms.qiudao?.delete;

        setCanCreateQiudao(createQiudao);
        setCanUpdateQiudao(updateQiudao);
        setCanDeleteQiudao(deleteQiudao);
        setUserScope(decoded.scope);
        setUserArea(decoded.area || null);

        if (decoded.scope === "fotang" && decoded.fotang_id) {
          localStorage.setItem("fotang_id", decoded.fotang_id);
        }

        localStorage.setItem("userId", decodedUserId);
        localStorage.setItem("scope", decoded.scope);
        localStorage.setItem("area", decoded.area || "");
      } catch (error) {
        toast({
          id: "token-decode-error",
          title: "Gagal memproses token",
          description: "Token tidak valid atau tidak dapat diproses.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
    setIsUserLoaded(true);
  }
}, [toast, router]);

  const isQiudaoAdminMode = canCreateQiudao || canUpdateQiudao || canDeleteQiudao;
  const fotangId = userScope === "fotang" ? decoded.fotang_id || null : undefined;

  useEffect(() => {
    if (userArea) {
      localStorage.setItem("area", userArea);
    }

    if (userScope) {
      setColumnVisibility({
        qiu_dao_id: true,
        qiu_dao_name: true,
        qiu_dao_mandarin_name: userScope !== "self",
        location_name: true,
        location_mandarin_name: userScope !== "self",
        dian_chuan_shi_name: true,
        dian_chuan_shi_mandarin_name: userScope !== "self",
        yin_shi_qd_name: true,
        yin_shi_qd_mandarin_name: userScope !== "self",
        bao_shi_qd_name: true,
        bao_shi_qd_mandarin_name: userScope !== "self",
        date: true,
      });
    }
  }, [userScope, userArea]);

  useEffect(() => {
    if (userId && typeof window !== "undefined") {
      queryClient.invalidateQueries(["qiudaos"]);
    }
  }, [userId, queryClient]);

  useEffect(() => {
    if (filterOpen) {
      setTempLocationFilter([...locationFilter]);
      setTempLocationMandarinFilter([...locationMandarinFilter]);
      setTempDianChuanShiFilter([...dianChuanShiFilter]);
      setTempDianChuanShiMandarinFilter([...dianChuanShiMandarinFilter]);
    }
  }, [filterOpen, locationFilter, locationMandarinFilter, dianChuanShiFilter, dianChuanShiMandarinFilter]);

  const fetchParams = useMemo(() => {
    const params = {
      page: isNotSelfScope ? page : undefined,
      limit: isNotSelfScope ? limit : undefined,
      search: isNotSelfScope ? searchQuery : undefined,
      searchField: isNotSelfScope ? searchField : undefined,

      location_name: isNotSelfScope ? locationFilter : [],
      location_mandarin_name: isNotSelfScope ? locationMandarinFilter : [],
      dian_chuan_shi_name: isNotSelfScope ? dianChuanShiFilter : [],
      dian_chuan_shi_mandarin_name: isNotSelfScope ? dianChuanShiMandarinFilter : [],

      ...Object.fromEntries(
        Object.entries(columnFilters).map(([key, values]) => [
          key,
          isNotSelfScope ? values : [],
        ])
      ),

      userId: userScope === "self" ? userId : undefined,
      userArea: userScope === "wilayah" ? userArea : undefined,
      fotangId: userScope === "fotang" ? fotangId : undefined,
    };
    return params;
  }, [
    page, limit, searchQuery, searchField, isNotSelfScope,
    locationFilter, locationMandarinFilter,
    dianChuanShiFilter, dianChuanShiMandarinFilter,
    columnFilters, userId, userArea, fotangId, userScope
  ]);

  const { data: qiudaos, isLoading, error, refetch: refetchQiudaos } = useFetchQiudaos(fetchParams);
  const qiudaosList = useMemo(() => {
    const rawQiudaos = qiudaos?.data || [];
    const filteredQiudaos = userScope === "self"
      ? rawQiudaos.filter(q => q.qiu_dao_id === userId)
      : rawQiudaos;
    return filteredQiudaos;
  }, [qiudaos, userScope, userId]);
  const total = isNotSelfScope ? qiudaos?.total || 0 : qiudaosList.length;
  const totalPages = isNotSelfScope ? Math.max(1, Math.ceil(total / limit)) : 1;

  useEffect(() => {
    if (error && error.message !== lastError) {
      toast({
        id: `fetch-error-${error?.message || "unknown"}`,
        title: "Gagal memuat data Qiudao",
        description: error?.response?.status === 403
          ? "Akses ditolak: Anda tidak memiliki izin untuk melihat data ini."
          : error?.message || "Terjadi kesalahan saat memuat data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLastError(error?.message || null);
    }
  }, [error, lastError, toast]);

  const applyFilters = () => {
    setLocationFilter([...tempLocationFilter]);
    setLocationMandarinFilter([...tempLocationMandarinFilter]);
    setDianChuanShiFilter([...tempDianChuanShiFilter]);
    setDianChuanShiMandarinFilter([...tempDianChuanShiMandarinFilter]);
    setPage(1);
    refetchQiudaos();
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setTempLocationFilter([]);
    setTempLocationMandarinFilter([]);
    setTempDianChuanShiFilter([]);
    setTempDianChuanShiMandarinFilter([]);
    setLocationFilter([]);
    setLocationMandarinFilter([]);
    setDianChuanShiFilter([]);
    setDianChuanShiMandarinFilter([]);
    setColumnFilters({});
    setColumnSearch({});
    setPage(1);
    refetchQiudaos();
    setFilterOpen(false);
  };

  const handleFilterChange = (setter, value) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleColumnFilterChange = (key, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [key]: prev[key]?.includes(value) ? prev[key].filter(v => v !== value) : [...(prev[key] || []), value]
    }));
  };

  const handleColumnSearchChange = (key, value) => {
    setColumnSearch(prev => ({ ...prev, [key]: value }));
  };

  const applyColumnFilter = (key, closePopover) => {
    setPage(1);
    refetchQiudaos();
    closePopover();
  };

  const clearColumnFilter = (key, closePopover) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
    setColumnSearch(prev => {
      const newSearch = { ...prev };
      delete newSearch[key];
      return newSearch;
    });
    setPage(1);
    refetchQiudaos();
    closePopover();
  };

  const getColumnValues = (key) => {
    const search = columnSearch[key] || "";
    const values = Array.from(new Set(qiudaosList.map(q => {
      if (key === "location_name") return q.qiu_dao_location?.location_name;
      if (key === "location_mandarin_name") return q.qiu_dao_location?.location_mandarin_name;
      if (key === "dian_chuan_shi_name") return q.dian_chuan_shi?.name;
      if (key === "dian_chuan_shi_mandarin_name") return q.dian_chuan_shi?.mandarin_name;
      return q[key];
    }).filter(Boolean)));
    return values.filter(v => v.toLowerCase().includes(search.toLowerCase()));
  };

  const handleRowClick = (qiudao) => {
    if (userScope === "wilayah" && userArea) {
      if (qiudao.qiu_dao_location?.area && qiudao.qiu_dao_location.area !== userArea) {
        toast({
          id: `row-click-error-${qiudao.qiu_dao_id}`,
          title: "Tidak Diizinkan",
          description: "Anda hanya bisa melihat data dari wilayah Anda.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }
    if (userScope === "self" && qiudao.qiu_dao_id !== userId) {
      toast({
        id: `row-click-error-${qiudao.qiu_dao_id}`,
        title: "Tidak Diizinkan",
        description: "Anda hanya dapat melihat data Anda sendiri.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setSelectedQiudao(qiudao);
    setFormData(qiudao);
    setIsEditing(false);
    onOpen();
  };

  const handleClose = () => {
    onClose();
    setSelectedQiudao(null);
    setFormData({});
  };

  const dateFormat = (qd) =>
    `${qd.lunar_sui_ci_year || ""}${qd.lunar_month || ""}${qd.lunar_day || ""}${qd.lunar_shi_chen_time || ""}`;

  const confirmBulkDelete = async () => {
    if (!isNotSelfScope) {
      toast({
        id: "bulk-delete-error",
        title: "Tidak Diizinkan",
        description: "Anda tidak memiliki izin untuk menghapus data.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      for (const id of selectedIds) {
        await deleteQiudaoMutation.mutateAsync(id);
      }
      toast({
        id: "bulk-delete-success",
        title: "Berhasil dihapus",
        description: `${selectedIds.length} data qiudao berhasil dihapus.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setSelectedIds([]);
      setIsAllSelected(false);
      refetchQiudaos();
      onConfirmClose();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Terjadi kesalahan saat menghapus";
      toast({
        id: `bulk-delete-error-${error.message}`,
        title: "Gagal menghapus",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSave = async () => {
    if (!isNotSelfScope) {
      toast({
        id: "save-error",
        title: "Tidak Diizinkan",
        description: "Anda tidak memiliki izin untuk mengupdate data.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const {
      qiu_dao_id,
      qiu_dao_location_id,
      qiu_dao_name,
      qiu_dao_mandarin_name,
      yin_shi_qd_mandarin_name,
      bao_shi_qd_mandarin_name,
      lunar_sui_ci_year,
      lunar_month,
      lunar_day,
      lunar_shi_chen_time,
      qiu_dao_location,
    } = formData;

    try {
      if (qiu_dao_location?.location_id) {
        const locationPayload = {
          location_name: qiu_dao_location.location_name,
          location_mandarin_name: qiu_dao_location.location_mandarin_name,
          province: qiu_dao_location.province,
          city: qiu_dao_location.city,
          district: qiu_dao_location.district,
          street: qiu_dao_location.street,
          locality: qiu_dao_location.locality,
          postal_code: qiu_dao_location.postal_code,
        };

        await updateLocationMutation.mutateAsync({
          locationId: qiu_dao_location.location_id,
          payload: locationPayload,
        });
      }

      const qiudaoPayload = {
        qiu_dao_location_id,
        qiu_dao_name,
        qiu_dao_mandarin_name,
        dian_chuan_shi_id: formData.dian_chuan_shi_id,
        yin_shi_qd_mandarin_name,
        bao_shi_qd_mandarin_name,
        lunar_sui_ci_year,
        lunar_month,
        lunar_day,
        lunar_shi_chen_time,
      };

      await updateQiudaoMutation.mutateAsync({ qiu_dao_id, payload: qiudaoPayload });

      toast({
        id: `save-success-${qiu_dao_id}`,
        title: "Berhasil disimpan",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setSelectedQiudao({ ...selectedQiudao, ...qiudaoPayload, qiu_dao_location });
      setIsEditing(false);
      refetchQiudaos();
      handleClose();
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "Terjadi kesalahan saat menyimpan";
      toast({
        id: `save-error-${qiu_dao_id}`,
        title: "Gagal menyimpan",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleImportSuccess = () => {
    refetchQiudaos();
  };

  const handleImportQiudao = () => {
      if (!canCreateQiudao) {
        toast({
          id: "import-permission",
          title: "Akses Ditolak",
          description: "Hanya Super Admin yang dapat mengimpor data qiudao.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      fileInputRef.current?.click();
    };

    const handleFileQiudaoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!canCreateQiudao) {
      toast({
        id: "import-permission",
        title: "Akses Ditolak",
        description: "Hanya Super Admin yang dapat mengimpor data qiudao.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:2025/import/qiudao", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengimpor");
      }

      toast({
        id: "import-success",
        title: "Berhasil mengimpor data Qiudao",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      handleImportSuccess();
    } catch (err) {
      toast({
        id: `import-error-${err.message}`,
        title: "Gagal mengimpor data",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      e.target.value = "";
    }
  };

  if (!isUserLoaded) {
    return (
      <Layout title="Qiudao">
        <Flex justify="center" align="center" height="100vh">
          <Spinner size="lg" />
        </Flex>
      </Layout>
    );
  }

  if (!userId) {
    router.push("/login");
    return null;
  }

  return (
    <Layout title="Qiudao">
      <Heading size="md" mb={4} ml={2}>
        Data Qiudao
        <Box as="span" fontSize="xl" color="gray.500" ml={2}>
          {isNotSelfScope ? total : qiudaosList.length}
        </Box>
      </Heading>

      {isNotSelfScope && (
        <Flex justify="space-between" align="center" mb={4} wrap="nowrap" gap={2}>
          <Box>
            <Pagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              onLimitChange={(val) => {
                setLimit(val);
                setPage(1);
              }}
              onPageChange={(val) => setPage(val)}
              search={searchQuery}
              onSearchChange={(val) => {
                setSearchQuery(val);
                setPage(1);
              }}
            />
          </Box>

          <Flex gap={2} align="center" flexWrap="nowrap" flexShrink={0}>
            {selectedIds.length > 0 && (
              <Button
                colorScheme="red"
                borderRadius="full"
                size="xs"
                minW="100px"
                onClick={onConfirmOpen}
              >
                Hapus {selectedIds.length} Data
              </Button>
            )}

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
              >
                Filter
              </Button>

              {filterOpen && (
                <VStack
                  spacing={2}
                  p={4}
                  bg="white"
                  borderRadius="md"
                  boxShadow="md"
                  zIndex={10}
                  align="stretch"
                  w="340px"
                  position="absolute"
                  top="100%"
                  left={0}
                  mt={1}
                  maxH="70vh"
                  overflowY="auto"
                >
                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0}>Vihara (Indonesia)</FormLabel>
                      <IconButton size="xs" variant="ghost" icon={isLocationOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsLocationOpen(!isLocationOpen)} />
                    </Flex>
                    <Collapse in={isLocationOpen} animateOpacity>
                      <VStack align="start" spacing={1} maxH="200px" overflowY="auto">
                        {Array.from(new Set(qiudaosList.map(q => q.qiu_dao_location?.location_name).filter(Boolean))).map(loc => (
                          <Checkbox key={loc} isChecked={tempLocationFilter.includes(loc)}
                            onChange={() => handleFilterChange(setTempLocationFilter, loc)}>
                            {loc}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0}>Vihara (Mandarin)</FormLabel>
                      <IconButton size="xs" variant="ghost" icon={isLocationMandarinOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsLocationMandarinOpen(!isLocationMandarinOpen)} />
                    </Flex>
                    <Collapse in={isLocationMandarinOpen} animateOpacity>
                      <VStack align="start" spacing={1} maxH="200px" overflowY="auto">
                        {Array.from(new Set(qiudaosList.map(q => q.qiu_dao_location?.location_mandarin_name).filter(Boolean))).map(loc => (
                          <Checkbox key={loc} isChecked={tempLocationMandarinFilter.includes(loc)}
                            onChange={() => handleFilterChange(setTempLocationMandarinFilter, loc)}>
                            {loc}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0}>Pandita (Indonesia)</FormLabel>
                      <IconButton size="xs" variant="ghost" icon={isDianChuanShiOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsDianChuanShiOpen(!isDianChuanShiOpen)} />
                    </Flex>
                    <Collapse in={isDianChuanShiOpen} animateOpacity>
                      <VStack align="start" spacing={1} maxH="200px" overflowY="auto">
                        {Array.from(new Set(qiudaosList.map(q => q.dian_chuan_shi?.name).filter(Boolean))).map(name => (
                          <Checkbox key={name} isChecked={tempDianChuanShiFilter.includes(name)}
                            onChange={() => handleFilterChange(setTempDianChuanShiFilter, name)}>
                            {name}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0}>Pandita (Mandarin)</FormLabel>
                      <IconButton size="xs" variant="ghost" icon={isDianChuanShiMandarinOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsDianChuanShiMandarinOpen(!isDianChuanShiMandarinOpen)} />
                    </Flex>
                    <Collapse in={isDianChuanShiMandarinOpen} animateOpacity>
                      <VStack align="start" spacing={1} maxH="200px" overflowY="auto">
                        {Array.from(new Set(qiudaosList.map(q => q.dian_chuan_shi?.mandarin_name).filter(Boolean))).map(name => (
                          <Checkbox key={name} isChecked={tempDianChuanShiMandarinFilter.includes(name)}
                            onChange={() => handleFilterChange(setTempDianChuanShiMandarinFilter, name)}>
                            {name}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <HStack justify="flex-end" spacing={2} mt={3}>
                    <Button size="sm" onClick={clearFilters}>Reset</Button>
                    <Button size="sm" onClick={() => setFilterOpen(false)}>Batal</Button>
                    <Button size="sm" colorScheme="blue" onClick={applyFilters}>Terapkan</Button>
                  </HStack>
                </VStack>
              )}
            </Box>

            <Select
              size="xs"
              width="320px"
              borderRadius="full"
              value={searchField}
              onChange={(e) => {
                setSearchField(e.target.value);
                setPage(1);
              }}
            >
              <option value="qiu_dao_name">Nama Qiudao (Indonesia)</option>
              <option value="qiu_dao_mandarin_name">Nama Qiudao (Mandarin)</option>
              <option value="qiu_dao_location.name">Nama Vihara (Indonesia)</option>
              <option value="qiu_dao_location.location_mandarin_name">Nama Vihara (Mandarin)</option>
              <option value="dian_chuan_shi.name">Nama Pandita (Indonesia)</option>
              <option value="dian_chuan_shi.mandarin_name">Nama Pandita (Mandarin)</option>
              <option value="yin_shi_qd_name">Guru Pengajak (Indonesia)</option>
              <option value="yin_shi_qd_mandarin_name">Guru Pengajak (Mandarin)</option>
              <option value="bao_shi_qd_name">Guru Penanggung (Indonesia)</option>
              <option value="bao_shi_qd_mandarin_name">Guru Penanggung (Mandarin)</option>
              <option value="lunar_sui_ci_year">Tahun Lunar</option>
              <option value="lunar_month">Bulan Lunar</option>
              <option value="lunar_day">Tanggal Lunar</option>
              <option value="lunar_shi_chen_time">Waktu Shi Chen</option>
            </Select>

            <InputGroup size="xs" width="180px">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="black" />
              </InputLeftElement>
              <Input
                placeholder="Cari data qiudao..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                borderRadius="full"
              />
              {searchQuery && (
                <InputRightElement>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    aria-label="Clear search"
                    icon={<FiX />}
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    _hover={{ bg: "transparent" }}
                    _active={{ bg: "transparent" }}
                    _focus={{ boxShadow: "none" }}
                  />
                </InputRightElement>
              )}
            </InputGroup>

            {canCreateQiudao && (
              <Button
                colorScheme="blue"
                borderRadius="full"
                size="xs"
                minW="100px"
                leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
                onClick={() => router.push("/qiudao/addQiudao")}
              >
                Tambah Qiudao
              </Button>
            )}

            {canCreateQiudao && (
              <Button
                colorScheme="green"
                borderRadius="full"
                size="xs"
                minW="100px"
                leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
                onClick={handleImportQiudao}
              >
                Import Data
              </Button>
            )}
          </Flex>
        </Flex>
      )}

      <Box overflowX="auto" minH="80vh">
        {isLoading ? (
          <Flex justify="center" py={10} height="60vh">
            <Spinner size="sm" />
          </Flex>
        ) : qiudaosList.length === 0 ? (
          <Flex
            justify="center"
            align="center"
            direction="column"
            height="60vh"
            color="gray.500"
          >
            Belum ada data
          </Flex>
        ) : (
          <Table minWidth="max-content">
            <Thead>
              <Tr>
                {tableHeaders.map((header) => (
                  <Th
                    key={header.key}
                    textAlign="center"
                    position="relative"
                    textTransform="none"
                    fontWeight="medium"
                    fontSize="sm"
                  >
                    <Flex align="center" justify="center" gap={1}>
                      {isNotSelfScope && canDeleteQiudao && header.key === "qiu_dao_id" ? (
                        <Checkbox
                          size="sm"
                          isChecked={isAllSelected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsAllSelected(checked);
                            setSelectedIds(checked ? qiudaosList.map((q) => q.qiu_dao_id) : []);
                          }}
                          sx={{ ".chakra-checkbox__control": { borderColor: "gray.500", borderWidth: "1px" } }}
                        />
                      ) : null}
                      <Box>{header.label}</Box>
                      {filterableColumns.includes(header.key) && (
                        <Popover placement="bottom-start">
                          {({ onClose }) => (
                            <>
                              <PopoverTrigger>
                                <IconButton size="xs" variant="ghost" icon={<FiFilter />} />
                              </PopoverTrigger>
                              <PopoverContent width="340px">
                                <PopoverArrow />
                                <PopoverCloseButton
                                  position="absolute"
                                  right="8px"
                                  top="8px"
                                  zIndex="1"
                                />
                                <PopoverBody pt={10}>
                                  <Input
                                    size="sm"
                                    placeholder="Cari..."
                                    value={columnSearch[header.key] || ""}
                                    onChange={(e) => handleColumnSearchChange(header.key, e.target.value)}
                                    mb={3}
                                    textAlign="left"
                                  />
                                  <VStack align="start" spacing={2} maxH="240px" overflowY="auto">
                                    {getColumnValues(header.key).map(value => (
                                      <Checkbox
                                        key={value}
                                        size="sm"
                                        isChecked={columnFilters[header.key]?.includes(value)}
                                        onChange={() => handleColumnFilterChange(header.key, value)}
                                        width="full"
                                      >
                                        <Box textAlign="left">{value}</Box>
                                      </Checkbox>
                                    ))}
                                  </VStack>
                                </PopoverBody>
                                <PopoverFooter>
                                  <HStack justify="space-between">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => clearColumnFilter(header.key, onClose)}
                                    >
                                      Reset
                                    </Button>
                                    <Button
                                      size="sm"
                                      colorScheme="blue"
                                      onClick={() => applyColumnFilter(header.key, onClose)}
                                    >
                                      Terapkan
                                    </Button>
                                  </HStack>
                                </PopoverFooter>
                              </PopoverContent>
                            </>
                          )}
                        </Popover>
                      )}
                    </Flex>
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {qiudaosList.map((qiudao) => (
                <Tr
                  key={qiudao.qiu_dao_id}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => handleRowClick(qiudao)}
                >
                  {tableHeaders.map((header) => (
                    <Td
                      key={header.key}
                      textAlign="center"
                      fontFamily="inherit"
                      fontSize="sm"
                      onClick={header.key === "qiu_dao_id" ? (e) => e.stopPropagation() : undefined}
                    >
                      {header.key === "qiu_dao_id" && isNotSelfScope && canDeleteQiudao ? (
                        <Flex align="center" justify="center" gap={2}>
                          <Checkbox
                            size="sm"
                            isChecked={selectedIds.includes(qiudao.qiu_dao_id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                setSelectedIds((prev) => [...prev, qiudao.qiu_dao_id]);
                              } else {
                                setSelectedIds((prev) => prev.filter((id) => id !== qiudao.qiu_dao_id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              ".chakra-checkbox__control": {
                                borderColor: "gray.500",
                                borderWidth: "1px",
                              },
                            }}
                          />
                          <Box>{qiudao.qiu_dao_id}</Box>
                        </Flex>
                      ) : header.key === "qiu_dao_id" ? (
                        qiudao.qiu_dao_id
                      ) : header.key === "qiu_dao_name" ? (
                        qiudao.qiu_dao_name?.trim() || "-"
                      ) : header.key === "qiu_dao_mandarin_name" ? (
                        qiudao.qiu_dao_mandarin_name || "-"
                      ) : header.key === "location_name" ? (
                        qiudao.qiu_dao_location?.location_name || "-"
                      ) : header.key === "location_mandarin_name" ? (
                        qiudao.qiu_dao_location?.location_mandarin_name || "-"
                      ) : header.key === "dian_chuan_shi_name" ? (
                        qiudao.dian_chuan_shi?.name || "-"
                      ) : header.key === "dian_chuan_shi_mandarin_name" ? (
                        qiudao.dian_chuan_shi?.mandarin_name || "-"
                      ) : header.key === "yin_shi_qd_name" ? (
                        qiudao.yin_shi_qd_name?.trim() || "-"
                      ) : header.key === "yin_shi_qd_mandarin_name" ? (
                        qiudao.yin_shi_qd_mandarin_name?.trim() || "-"
                      ) : header.key === "bao_shi_qd_name" ? (
                        qiudao.bao_shi_qd_name?.trim() || "-"
                      ) : header.key === "bao_shi_qd_mandarin_name" ? (
                        qiudao.bao_shi_qd_mandarin_name?.trim() || "-"
                      ) : header.key === "date" ? (
                        dateFormat(qiudao)
                      ) : (
                        "-"
                      )}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      <QiudaoDetailModal
        isOpen={isOpen}
        onClose={handleClose}
        selectedQiudao={selectedQiudao}
        handleDelete={(id) => deleteQiudaoMutation.mutateAsync(id)}
        canEdit={isNotSelfScope && canUpdateQiudao}
      />

      {isNotSelfScope && canDeleteQiudao && (
        <DeleteConfirmModal
          isOpen={isConfirmOpen}
          onClose={onConfirmClose}
          onConfirm={confirmBulkDelete}
          selectedCount={selectedIds.length}
          isDeleting={deleteQiudaoMutation.isLoading}
        />
      )}

      {canCreateQiudao && (
        <input
          type="file"
          accept=".xlsx"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileQiudaoChange}
        />
      )}
    </Layout>
  );
}