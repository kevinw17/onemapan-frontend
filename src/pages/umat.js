import {
  Table, Tbody, Thead, Tr, Th, Td, Spinner,
  Box, useDisclosure, Button, Input, InputGroup,
  InputLeftElement, InputRightElement, IconButton,
  useToast, Select, Checkbox, VStack, HStack,
  FormControl, FormLabel, Collapse, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Text, Flex, Heading,
  Badge
} from "@chakra-ui/react";
import { useFetchUsers } from "@/features/user/useFetchUsers";
import Layout from "../components/layout";
import { useState, useRef, useEffect, useMemo } from "react";
import { useUpdateUser } from "@/features/user/useUpdateUser";
import { useDeleteUser } from "@/features/user/useDeleteUser";
import Pagination from "@/components/Pagination";
import { FiFilter, FiMinus, FiPlus, FiSearch, FiX } from "react-icons/fi";
import UserDetailModal from "@/components/UserDetailModal";
import { useUpdateLocation } from "@/features/location/useUpdateLocation";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, selectedCount, isDeleting }) => (
  <Modal isOpen={isOpen} onClose={onClose} maxW="600px">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Konfirmasi Hapus</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>Apakah Anda yakin ingin menghapus {selectedCount} data umat?</Text>
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
        <Button variant="ghost" onClick={onClose} ml={3} size="sm">Batal</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default function UmatPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("full_name");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState([]);
  const [educationFilter, setEducationFilter] = useState([]);
  const [spiritualFilter, setSpiritualFilter] = useState([]);
  const [qingKouFilter, setQingKouFilter] = useState([]);
  const [genderFilter, setGenderFilter] = useState([]);
  const [bloodTypeFilter, setBloodTypeFilter] = useState([]);
  const [tempJobFilter, setTempJobFilter] = useState([]);
  const [tempEducationFilter, setTempEducationFilter] = useState([]);
  const [tempSpiritualFilter, setTempSpiritualFilter] = useState([]);
  const [tempQingKouFilter, setTempQingKouFilter] = useState([]);
  const [tempGenderFilter, setTempGenderFilter] = useState([]);
  const [tempBloodTypeFilter, setTempBloodTypeFilter] = useState([]);
  const [isJobFilterOpen, setIsJobFilterOpen] = useState(false);
  const [isEducationFilterOpen, setIsEducationFilterOpen] = useState(false);
  const [isSpiritualFilterOpen, setIsSpiritualFilterOpen] = useState(false);
  const [isQingKouFilterOpen, setIsQingKouFilterOpen] = useState(false);
  const [isGenderFilterOpen, setIsGenderFilterOpen] = useState(false);
  const [isBloodTypeFilterOpen, setIsBloodTypeFilterOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({
    user_info_id: true,
    full_name: true,
    mandarin_name: false,
    spiritual_status: true,
    is_qing_kou: true,
    gender: true,
    blood_type: true,
    place_of_birth: false,
    date_of_birth: false,
    phone_number: true,
    job_name: true,
    last_education_level: true,
  });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [canCreateUmat, setCanCreateUmat] = useState(false);
  const [canUpdateUmat, setCanUpdateUmat] = useState(false);
  const [canDeleteUmat, setCanDeleteUmat] = useState(false);
  const [umatScope, setUmatScope] = useState(null);

  const isPersonalMode = userId !== null && umatScope === "self";

  const [columnFilters, setColumnFilters] = useState({
    job_name: [],
    last_education_level: [],
    spiritualStatus: [],
    is_qing_kou: [],
    gender: [],
    blood_type: [],
  });
  const [isColumnFilterOpen, setIsColumnFilterOpen] = useState({
    job_name: false,
    last_education_level: false,
    spiritualStatus: false,
    is_qing_kou: false,
    gender: false,
    blood_type: false,
  });

  const queryParams = useMemo(() => ({
    page,
    limit,
    search: isAdminMode ? searchQuery : undefined,
    searchField: isAdminMode ? searchField : undefined,
    job_name: isAdminMode ? jobFilter : undefined,
    last_education_level: isAdminMode ? educationFilter : undefined,
    spiritualStatus: isAdminMode ? spiritualFilter : undefined,
    is_qing_kou: isAdminMode ? qingKouFilter : undefined,
    gender: isAdminMode ? genderFilter : undefined,
    blood_type: isAdminMode ? bloodTypeFilter : undefined,
    userId: isPersonalMode ? userId : undefined,
    umatScope: isAdminMode ? umatScope : undefined,
  }), [page, limit, searchQuery, searchField, jobFilter, educationFilter, spiritualFilter, qingKouFilter, genderFilter, bloodTypeFilter, userId, isAdminMode, isPersonalMode, umatScope]);

  const { data: users, isLoading, refetch: refetchUsers } = useFetchUsers(queryParams);
  const usersList = useMemo(() => {
    const rawUsers = users?.data || [];

    if (umatScope === "self" && userId) {
      const myData = rawUsers.filter(u => String(u.user_info_id) === String(userId));
      return myData;
    }

    return rawUsers;
  }, [users, umatScope, userId]);
  const isSelfScope = umatScope === "self";
  const total = users?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const toast = useToast();
  const genderMap = { Male: "Pria", Female: "Wanita" };
  const bloodTypeBadgeColor = { A: "blue", B: "purple", O: "yellow", AB: "gray" };
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const updateLocationMutation = useUpdateLocation();
  const router = useRouter();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const fullUserId = decoded.user_info_id

          if (fullUserId) {
            setUserId(fullUserId);
          }
          const perms = decoded.permissions || {};

          const create = !!perms.umat?.create;
          const update = !!perms.umat?.update;
          const del = !!perms.umat?.delete;
          const scope = perms.umat?.scope || null;

          setCanCreateUmat(create);
          setCanUpdateUmat(update);
          setCanDeleteUmat(del);
          setUmatScope(scope);
          setIsAdminMode(create || update || del);

        } catch (error) {
          console.error("Token invalid atau error decode:", error);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    }
  }, [router]);
  
  useEffect(() => {
    if (!isSelfScope && isAdminMode) {
      setColumnVisibility((prev) => ({
        ...prev,
        mandarin_name: true,
        place_of_birth: true,
        date_of_birth: true,
      }));
    }
  }, [isAdminMode, isSelfScope]);

  useEffect(() => {
    setTempJobFilter([...columnFilters.job_name]);
    setTempEducationFilter([...columnFilters.last_education_level]);
    setTempSpiritualFilter([...columnFilters.spiritualStatus]);
    setTempQingKouFilter([...columnFilters.is_qing_kou]);
    setTempGenderFilter([...columnFilters.gender]);
    setTempBloodTypeFilter([...columnFilters.blood_type]);
  }, [columnFilters]);

  useEffect(() => {
    setColumnFilters((prev) => ({
      ...prev,
      job_name: [...jobFilter],
      last_education_level: [...educationFilter],
      spiritualStatus: [...spiritualFilter],
      is_qing_kou: [...qingKouFilter],
      gender: [...genderFilter],
      blood_type: [...bloodTypeFilter],
    }));
  }, [jobFilter, educationFilter, spiritualFilter, qingKouFilter, genderFilter, bloodTypeFilter]);

  const handleClickOutside = (e) => {
    if (!e.target.closest('.filter-dropdown') && !e.target.closest('.chakra-popover__content')) {
      setIsColumnFilterOpen({
        job_name: false,
        last_education_level: false,
        spiritualStatus: false,
        is_qing_kou: false,
        gender: false,
        blood_type: false,
      });
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setFormData(user);
    setIsEditing(false);
    onOpen();
  };

  const handleDelete = (userId) => {
    if (!canDeleteUmat) {
      toast({ title: "Akses Ditolak", description: "Anda tidak punya izin hapus.", status: "error" });
      return;
    }
    deleteUserMutation.mutate(userId, {
      onSuccess: () => {
        refetchUsers();
        onClose();
        toast({
          id: `delete-success-${userId}`,
          title: "Berhasil dihapus",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        let errorMessage = error.message || "Terjadi kesalahan saat menghapus data.";
        if (error?.response?.status === 403 && errorMessage.includes("region")) {
          errorMessage = "Forbidden: Anda tidak dapat menghapus user dari wilayah lain.";
        }
        toast({
          id: `delete-error-${userId}`,
          title: "Gagal menghapus",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };

  const confirmBulkDelete = async () => {
    if (!canDeleteUmat) {
      toast({
        id: `bulk-delete-error`,
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk menghapus data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    let successCount = 0;
    let failCount = 0;
    let failMessages = [];
    try {
      for (const id of selectedIds) {
        try {
          await deleteUserMutation.mutateAsync(id);
          successCount++;
        } catch (err) {
          failCount++;
          let errMsg = err?.response?.data?.message || "Kesalahan tidak diketahui";
          if (err?.response?.status === 403 && errMsg.includes("region")) {
            errMsg = `ID ${id}: Forbidden - User dari wilayah lain`;
          }
          failMessages.push(errMsg);
        }
      }
      toast({
        id: `bulk-delete-result`,
        title: `Hapus selesai: ${successCount} berhasil, ${failCount} gagal`,
        description: failCount > 0 ? `Gagal: ${failMessages.join(", ")}` : "Semua berhasil dihapus.",
        status: failCount > 0 ? "warning" : "success",
        duration: 5000,
        isClosable: true,
      });
      setSelectedIds([]);
      setIsAllSelected(false);
      refetchUsers();
      onConfirmClose();
    } catch (error) {
      toast({
        id: `bulk-delete-error`,
        title: "Gagal menghapus",
        description: "Terjadi kesalahan saat menghapus data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSave = async () => {
    if (!canUpdateUmat) {
      toast({
        id: `save-error`,
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mengubah data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const {
      full_name,
      mandarin_name,
      is_qing_kou,
      phone_number,
      gender,
      blood_type,
      place_of_birth,
      date_of_birth,
      id_card_number,
      email,
      marital_status,
      last_education_level,
      education_major,
      job_name,
      id_card_location,
      domicile_location,
    } = formData;

    const idCardLocationId = parseInt(id_card_location?.location_id || 0);
    const domicileLocationId = parseInt(domicile_location?.location_id || 0);

    if (!idCardLocationId || isNaN(idCardLocationId)) {
      toast({
        id: "invalid-id-card-location",
        title: "Lokasi KTP tidak valid",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!domicileLocationId || isNaN(domicileLocationId)) {
      toast({
        id: "invalid-domicile-location",
        title: "Lokasi Domisili tidak valid",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const payload = {
      full_name,
      mandarin_name,
      is_qing_kou,
      phone_number,
      gender,
      blood_type,
      place_of_birth,
      date_of_birth: date_of_birth ? new Date(date_of_birth).toISOString() : null,
      id_card_number,
      email,
      marital_status,
      last_education_level,
      education_major,
      job_name,
      id_card_location_id: idCardLocationId,
      domicile_location_id: domicileLocationId,
      spiritual_status: formData.spiritual_status || null,
    };

    try {
      if (id_card_location?.location_id && id_card_location?.localityId) {
        await updateLocationMutation.mutateAsync({
          locationId: id_card_location.location_id,
          payload: {
            localityId: id_card_location.localityId,
            location_name: id_card_location.location_name,
            street: id_card_location.street,
            postal_code: id_card_location.postal_code,
          },
        });
      }

      if (domicile_location?.location_id && domicile_location?.localityId) {
        await updateLocationMutation.mutateAsync({
          locationId: domicile_location.location_id,
          payload: {
            localityId: domicile_location.localityId,
            location_name: domicile_location.location_name,
            street: domicile_location.street,
            postal_code: domicile_location.postal_code,
          },
        });
      }

      await updateUserMutation.mutateAsync({
        userId: formData.user_info_id,
        payload,
      });

      toast({
        id: `save-success-${formData.user_info_id}`,
        title: "Berhasil disimpan",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      refetchUsers();
    } catch (err) {
      const errorData = err?.response?.data;
      const errorMessage =
        typeof errorData === "string"
          ? errorData
          : errorData?.message || "Terjadi kesalahan saat menyimpan";

      toast({
        id: `save-error-${formData.user_info_id}`,
        title: "Gagal menyimpan",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleImportSuccess = () => {
    refetchUsers();
  };

  const applyFilters = () => {
    setJobFilter([...tempJobFilter]);
    setEducationFilter([...tempEducationFilter]);
    setSpiritualFilter([...tempSpiritualFilter]);
    setQingKouFilter([...tempQingKouFilter]);
    setGenderFilter([...tempGenderFilter]);
    setBloodTypeFilter([...tempBloodTypeFilter]);
    setColumnFilters({
      job_name: [...tempJobFilter],
      last_education_level: [...tempEducationFilter],
      spiritualStatus: [...tempSpiritualFilter],
      is_qing_kou: [...tempQingKouFilter],
      gender: [...tempGenderFilter],
      blood_type: [...tempBloodTypeFilter],
    });
    refetchUsers();
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setTempJobFilter([]);
    setTempEducationFilter([]);
    setTempSpiritualFilter([]);
    setTempQingKouFilter([]);
    setTempGenderFilter([]);
    setTempBloodTypeFilter([]);
    setJobFilter([]);
    setEducationFilter([]);
    setSpiritualFilter([]);
    setQingKouFilter([]);
    setGenderFilter([]);
    setBloodTypeFilter([]);
    setColumnFilters({
      job_name: [],
      last_education_level: [],
      spiritualStatus: [],
      is_qing_kou: [],
      gender: [],
      blood_type: [],
    });
    refetchUsers();
    setFilterOpen(false);
  };

  const handleJobFilterChange = (value) => {
    setTempJobFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleEducationFilterChange = (value) => {
    setTempEducationFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleSpiritualFilterChange = (value) => {
    setTempSpiritualFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleQingKouFilterChange = (value) => {
    setTempQingKouFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value === "true" ? "true" : "false"]
    );
  };

  const handleGenderFilterChange = (value) => {
    setTempGenderFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleBloodTypeFilterChange = (value) => {
    setTempBloodTypeFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleColumnFilterChange = (column, value) => {
    setColumnFilters((prev) => {
      const current = prev[column] || [];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [column]: updated };
    });
  };

  const applyColumnFilters = () => {
    setJobFilter([...columnFilters.job_name]);
    setEducationFilter([...columnFilters.last_education_level]);
    setSpiritualFilter([...columnFilters.spiritualStatus]);
    setQingKouFilter([...columnFilters.is_qing_kou]);
    setGenderFilter([...columnFilters.gender]);
    setBloodTypeFilter([...columnFilters.blood_type]);
    refetchUsers();
    setIsColumnFilterOpen({
      job_name: false,
      last_education_level: false,
      spiritualStatus: false,
      is_qing_kou: false,
      gender: false,
      blood_type: false,
    });
  };

  const clearColumnFilters = (column) => {
    setColumnFilters((prev) => ({ ...prev, [column]: [] }));
    setTempJobFilter((prev) => (column === "job_name" ? [] : prev));
    setTempEducationFilter((prev) => (column === "last_education_level" ? [] : prev));
    setTempSpiritualFilter((prev) => (column === "spiritualStatus" ? [] : prev));
    setTempQingKouFilter((prev) => (column === "is_qing_kou" ? [] : prev));
    setTempGenderFilter((prev) => (column === "gender" ? [] : prev));
    setTempBloodTypeFilter((prev) => (column === "blood_type" ? [] : prev));
    switch (column) {
      case "job_name": setJobFilter([]); break;
      case "last_education_level": setEducationFilter([]); break;
      case "spiritualStatus": setSpiritualFilter([]); break;
      case "is_qing_kou": setQingKouFilter([]); break;
      case "gender": setGenderFilter([]); break;
      case "blood_type": setBloodTypeFilter([]); break;
    }
    refetchUsers();
  };

  const handleImportUmat = () => {
    if (!canCreateUmat) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mengimpor data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUmatChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!canCreateUmat) {
      toast({
        id: "import-permission",
        title: "Akses Ditolak",
        description: "Hanya Super Admin yang dapat mengimpor data umat.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Token tidak ditemukan. Silakan login terlebih dahulu.");
        }
        const res = await fetch("http://localhost:2025/import/umat", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Gagal mengimpor");
        }

        toast({
          id: "import-success",
          title: "Berhasil mengimpor data umat",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        handleImportSuccess();
      }
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

  return (
    <Layout title="Umat">
      <Heading size="md" mb={4} ml={2} fontFamily="inherit">
        Data Umat
        <Box as="span" fontSize="lg" color="gray.500" ml={2}>
          {!isSelfScope && isAdminMode ? total : usersList.length}
        </Box>
      </Heading>

      <Flex mb={4} justify="space-between" align="center" wrap="nowrap" gap={2}>
        {!isSelfScope && isAdminMode && (
          <Box>
            <Pagination
              page={page}
              totalPages={totalPages}
              pageSize={limit}
              onLimitChange={(val) => {
                setPage(1);
                setLimit(val);
              }}
              onPageChange={(val) => setPage(val)}
              search={searchQuery}
              onSearchChange={(val) => {
                setSearchQuery(val);
                setPage(1);
              }}
            />
          </Box>
        )}

        <Flex gap={2} align="center" flexWrap="nowrap" flexShrink={0}>
          { !isSelfScope && isAdminMode && selectedIds.length > 0 && canDeleteUmat && (
            <Button colorScheme="red" borderRadius="full" size="xs" onClick={onConfirmOpen}>
              Hapus {selectedIds.length} Data
            </Button>
          )}

          { !isSelfScope && isAdminMode && (
            <Box position="relative">
              <Button
                leftIcon={<FiFilter />}
                onClick={() => setFilterOpen(!filterOpen)}
                size="xs"
                borderRadius="full"
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
                  position="absolute"
                  top="100%"
                  left={0}
                  mt={1}
                  fontFamily="inherit"
                  fontSize="sm"
                >
                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0} fontSize="sm" fontFamily="inherit">Pekerjaan</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label={isJobFilterOpen ? "Hide job filter" : "Show job filter"}
                        icon={isJobFilterOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsJobFilterOpen(!isJobFilterOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isJobFilterOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        {["PNS", "Guru/Dosen", "Dokter/Perawat", "Wiraswasta", "Karyawan Swasta", "Petani/Nelayan", "Pelajar/Mahasiswa", "Pensiunan", "Lainnya"].map((job) => (
                          <Checkbox
                            key={job}
                            size="sm"
                            isChecked={tempJobFilter.includes(job)}
                            onChange={() => handleJobFilterChange(job)}
                            fontSize="sm"
                            fontFamily="inherit"
                            sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}
                          >
                            {job}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0} fontSize="sm" fontFamily="inherit">Pendidikan Terakhir</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={isEducationFilterOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsEducationFilterOpen(!isEducationFilterOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isEducationFilterOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        {["TK", "SD", "SMP", "SMA", "D1", "D2", "D3", "S1", "S2", "S3"].map((edu) => (
                          <Checkbox
                            key={edu}
                            size="sm"
                            isChecked={tempEducationFilter.includes(edu)}
                            onChange={() => handleEducationFilterChange(edu)}
                            fontSize="sm"
                            fontFamily="inherit"
                            sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}
                          >
                            {edu === "TK" ? "TK (Taman Kanak-Kanak)" :
                              edu === "SD" ? "SD (Sekolah Dasar)" :
                              edu === "SMP" ? "SMP (Sekolah Menengah Pertama)" :
                              edu === "SMA" ? "SMA (Sekolah Menengah Atas)" :
                              edu === "D1" ? "D1 (Diploma 1)" :
                              edu === "D2" ? "D2 (Diploma 2)" :
                              edu === "D3" ? "D3 (Diploma 3)" :
                              edu === "S1" ? "S1 (Sarjana 1)" :
                              edu === "S2" ? "S2 (Magister)" :
                              "S3 (Doktor)"}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0} fontSize="sm" fontFamily="inherit">Status Rohani</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={isSpiritualFilterOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsSpiritualFilterOpen(!isSpiritualFilterOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isSpiritualFilterOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        {["TanZhu", "FoYuan", "BanShiYuan", "QianXian", "DaoQin"].map((status) => (
                          <Checkbox
                            key={status}
                            size="sm"
                            isChecked={tempSpiritualFilter.includes(status)}
                            onChange={() => handleSpiritualFilterChange(status)}
                            fontSize="sm"
                            fontFamily="inherit"
                            sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}
                          >
                            {status === "TanZhu" ? "Tan Zhu / Pandita Madya" :
                              status === "FoYuan" ? "Fo Yuan / Buddha Siswa" :
                              status === "BanShiYuan" ? "Ban Shi Yuan / Pelaksana Vihara" :
                              status === "QianXian" ? "Qian Xian / Aktivis" :
                              "Dao Qin / Umat"}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0} fontSize="sm" fontFamily="inherit">Status Vegetarian</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={isQingKouFilterOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsQingKouFilterOpen(!isQingKouFilterOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isQingKouFilterOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        <Checkbox
                          size="sm"
                          isChecked={tempQingKouFilter.includes("true")}
                          onChange={() => handleQingKouFilterChange("true")}
                          fontSize="sm"
                          fontFamily="inherit"
                          sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}
                        >
                          Sudah
                        </Checkbox>
                        <Checkbox
                          size="sm"
                          isChecked={tempQingKouFilter.includes("false")}
                          onChange={() => handleQingKouFilterChange("false")}
                          fontSize="sm"
                          fontFamily="inherit"
                          sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}
                        >
                          Belum
                        </Checkbox>
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0} fontSize="sm" fontFamily="inherit">Jenis Kelamin</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={isGenderFilterOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsGenderFilterOpen(!isGenderFilterOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isGenderFilterOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        <Checkbox
                          size="sm"
                          isChecked={tempGenderFilter.includes("Male")}
                          onChange={() => handleGenderFilterChange("Male")}
                          fontSize="sm"
                          fontFamily="inherit"
                          sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}
                        >
                          Pria
                        </Checkbox>
                        <Checkbox
                          size="sm"
                          isChecked={tempGenderFilter.includes("Female")}
                          onChange={() => handleGenderFilterChange("Female")}
                          fontSize="sm"
                          fontFamily="inherit"
                          sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}
                        >
                          Wanita
                        </Checkbox>
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0} fontSize="sm" fontFamily="inherit">Golongan Darah</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={isBloodTypeFilterOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsBloodTypeFilterOpen(!isBloodTypeFilterOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isBloodTypeFilterOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        {["A", "B", "O", "AB"].map((type) => (
                          <Checkbox
                            key={type}
                            size="sm"
                            isChecked={tempBloodTypeFilter.includes(type)}
                            onChange={() => handleBloodTypeFilterChange(type)}
                            fontSize="sm"
                            fontFamily="inherit"
                            sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}
                          >
                            {type}
                          </Checkbox>
                        ))}
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
          )}

          { !isSelfScope && isAdminMode && (
            <Select size="xs" width="180px" value={searchField} onChange={(e) => setSearchField(e.target.value)}>
              <option value="full_name">Nama Lengkap</option>
              {columnVisibility.mandarin_name && <option value="mandarin_name">Nama Mandarin</option>}
              {columnVisibility.place_of_birth && <option value="place_of_birth">Tempat Lahir</option>}
              <option value="phone_number">No. HP</option>
              <option value="last_education_level">Pendidikan Terakhir</option>
              <option value="job_name">Pekerjaan</option>
            </Select>
          )}

          { !isSelfScope && isAdminMode && (
            <InputGroup size="xs" width="160px">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="black" />
              </InputLeftElement>
              <Input
                placeholder="Cari data umat..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                borderRadius="full"
                fontSize="sm"
                fontFamily="inherit"
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
          )}

          {canCreateUmat && (
            <Button
              colorScheme="blue"
              borderRadius="full"
              size="xs"
              minW="100px"
              leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
              onClick={() => router.push("/umat/addUmat")}
              fontSize="sm"
              fontFamily="inherit"
            >
              Tambah Umat
            </Button>
          )}

          {canCreateUmat && (
            <Button
              colorScheme="green"
              borderRadius="full"
              size="xs"
              minW="100px"
              leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
              onClick={handleImportUmat}
              fontSize="sm"
              fontFamily="inherit"
            >
              Import Data
            </Button>
          )}
        </Flex>
      </Flex>

      <Box overflowX="auto" minH="80vh">
        {isLoading ? (
          <Flex justify="center" py={10} height="60vh">
            <Spinner size="sm" />
          </Flex>
        ) : (
          <Table minWidth="max-content">
            <Thead>
              <Tr>
                {columnVisibility.user_info_id && (
                  <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">
                    <Flex align="center" justify="center" gap={2}>
                      {canDeleteUmat ? (
                          <Checkbox
                            size="sm"
                            isChecked={isAllSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsAllSelected(checked);
                              setSelectedIds(checked ? usersList.map(u => u.user_info_id) : []);
                            }}
                            sx={{
                              ".chakra-checkbox__control": {
                                borderColor: "gray.500",
                                borderWidth: "1px",
                              }
                            }}
                          />
                        ) : null}
                      <Box>ID Umat</Box>
                    </Flex>
                  </Th>
                )}
                {columnVisibility.full_name && <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">Nama Lengkap</Th>}
                {columnVisibility.mandarin_name && <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">Nama Mandarin</Th>}
                {columnVisibility.spiritual_status && (
                  <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">
                    {!isSelfScope && isAdminMode ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Status Rohani
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label="Filter spiritual status"
                          icon={<FiFilter />}
                          onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, spiritualStatus: !prev.spiritualStatus }))}
                          _hover={{ bg: "transparent" }}
                        />
                        {isColumnFilterOpen.spiritualStatus && (
                          <VStack
                            className="filter-dropdown"
                            spacing={1}
                            p={2}
                            bg="white"
                            borderRadius="md"
                            boxShadow="md"
                            zIndex={10}
                            position="absolute"
                            top="100%"
                            left="0"
                            mt={1}
                            align="start"
                            width="220px"
                            fontFamily="inherit"
                            fontSize="sm"
                          >
                            {["TanZhu", "FoYuan", "BanShiYuan", "QianXian", "DaoQin"].map((status) => (
                              <Checkbox
                                key={status}
                                size="sm"
                                isChecked={columnFilters.spiritualStatus.includes(status)}
                                onChange={() => handleColumnFilterChange("spiritualStatus", status)}
                                fontSize="sm"
                                fontFamily="inherit"
                                textAlign="left"
                                sx={{ "& .chakra-checkbox__label": { textAlign: "left", width: "100%" } }}
                              >
                                {status === "TanZhu" ? "Tan Zhu / Pandita Madya" :
                                  status === "FoYuan" ? "Fo Yuan / Buddha Siswa" :
                                  status === "BanShiYuan" ? "Ban Shi Yuan / Pelaksana Vihara" :
                                  status === "QianXian" ? "Qian Xian / Aktivis" :
                                  "Dao Qin / Umat"}
                              </Checkbox>
                            ))}
                            <HStack justify="flex-end" spacing={2} mt={1}>
                              <Button size="xs" variant="ghost" onClick={() => { clearColumnFilters("spiritualStatus"); setIsColumnFilterOpen((prev) => ({ ...prev, spiritualStatus: false })); }}>Reset</Button>
                              <Button size="xs" colorScheme="blue" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, spiritualStatus: false })); }}>Apply</Button>
                            </HStack>
                          </VStack>
                        )}
                      </Flex>
                    ) : (
                      "Status Rohani"
                    )}
                  </Th>
                )}
                {columnVisibility.is_qing_kou && (
                  <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">
                    {!isSelfScope && isAdminMode ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Status Vegetarian
                        <IconButton size="xs" variant="ghost" icon={<FiFilter />} onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, is_qing_kou: !prev.is_qing_kou }))} />
                        {isColumnFilterOpen.is_qing_kou && (
                          <VStack className="filter-dropdown" spacing={1} p={2} bg="white" borderRadius="md" boxShadow="md" zIndex={10} position="absolute" top="100%" left="0" mt={1} align="start" width="180px" fontFamily="inherit" fontSize="sm">
                            <Checkbox size="sm" isChecked={columnFilters.is_qing_kou.includes("true")} onChange={() => handleColumnFilterChange("is_qing_kou", "true")} fontSize="sm" fontFamily="inherit" textAlign="left" sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}>Sudah</Checkbox>
                            <Checkbox size="sm" isChecked={columnFilters.is_qing_kou.includes("false")} onChange={() => handleColumnFilterChange("is_qing_kou", "false")} fontSize="sm" fontFamily="inherit" textAlign="left" sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}>Belum</Checkbox>
                            <HStack justify="flex-end" spacing={2} mt={1}>
                              <Button size="xs" variant="ghost" onClick={() => { clearColumnFilters("is_qing_kou"); setIsColumnFilterOpen((prev) => ({ ...prev, is_qing_kou: false })); }}>Reset</Button>
                              <Button size="xs" colorScheme="blue" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, is_qing_kou: false })); }}>Apply</Button>
                            </HStack>
                          </VStack>
                        )}
                      </Flex>
                    ) : (
                      "Status Vegetarian"
                    )}
                  </Th>
                )}
                {columnVisibility.gender && (
                  <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">
                    {!isSelfScope && isAdminMode ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Jenis Kelamin
                        <IconButton size="xs" variant="ghost" icon={<FiFilter />} onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, gender: !prev.gender }))} />
                        {isColumnFilterOpen.gender && (
                          <VStack className="filter-dropdown" spacing={1} p={2} bg="white" borderRadius="md" boxShadow="md" zIndex={10} position="absolute" top="100%" left="0" mt={1} align="start" width="180px" fontFamily="inherit" fontSize="sm">
                            <Checkbox size="sm" isChecked={columnFilters.gender.includes("Male")} onChange={() => handleColumnFilterChange("gender", "Male")} fontSize="sm" fontFamily="inherit" textAlign="left" sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}>Pria</Checkbox>
                            <Checkbox size="sm" isChecked={columnFilters.gender.includes("Female")} onChange={() => handleColumnFilterChange("gender", "Female")} fontSize="sm" fontFamily="inherit" textAlign="left" sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}>Wanita</Checkbox>
                            <HStack justify="flex-end" spacing={2} mt={1}>
                              <Button size="xs" variant="ghost" onClick={() => { clearColumnFilters("gender"); setIsColumnFilterOpen((prev) => ({ ...prev, gender: false })); }}>Reset</Button>
                              <Button size="xs" colorScheme="blue" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, gender: false })); }}>Apply</Button>
                            </HStack>
                          </VStack>
                        )}
                      </Flex>
                    ) : (
                      "Jenis Kelamin"
                    )}
                  </Th>
                )}
                {columnVisibility.blood_type && (
                  <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">
                    {!isSelfScope && isAdminMode ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Golongan Darah
                        <IconButton size="xs" variant="ghost" icon={<FiFilter />} onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, blood_type: !prev.blood_type }))} />
                        {isColumnFilterOpen.blood_type && (
                          <VStack className="filter-dropdown" spacing={1} p={2} bg="white" borderRadius="md" boxShadow="md" zIndex={10} position="absolute" top="100%" left="0" mt={1} align="start" width="180px" fontFamily="inherit" fontSize="sm">
                            {["A", "B", "O", "AB"].map((type) => (
                              <Checkbox key={type} size="sm" isChecked={columnFilters.blood_type.includes(type)} onChange={() => handleColumnFilterChange("blood_type", type)} fontSize="sm" fontFamily="inherit" textAlign="left" sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}>
                                {type}
                              </Checkbox>
                            ))}
                            <HStack justify="flex-end" spacing={2} mt={1}>
                              <Button size="xs" variant="ghost" onClick={() => { clearColumnFilters("blood_type"); setIsColumnFilterOpen((prev) => ({ ...prev, blood_type: false })); }}>Reset</Button>
                              <Button size="xs" colorScheme="blue" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, blood_type: false })); }}>Apply</Button>
                            </HStack>
                          </VStack>
                        )}
                      </Flex>
                    ) : (
                      "Golongan Darah"
                    )}
                  </Th>
                )}
                {columnVisibility.place_of_birth && <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">Tempat Lahir</Th>}
                {columnVisibility.date_of_birth && <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">Tanggal Lahir</Th>}
                {columnVisibility.phone_number && <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">No. HP</Th>}
                {columnVisibility.job_name && (
                  <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">
                    {!isSelfScope && isAdminMode ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Pekerjaan
                        <IconButton size="xs" variant="ghost" icon={<FiFilter />} onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, job_name: !prev.job_name }))} />
                        {isColumnFilterOpen.job_name && (
                          <VStack className="filter-dropdown" spacing={1} p={2} bg="white" borderRadius="md" boxShadow="md" zIndex={10} position="absolute" top="100%" left="0" mt={1} align="start" width="220px" fontFamily="inherit" fontSize="sm" maxH="200px" overflowY="auto">
                            {["PNS", "Guru/Dosen", "Dokter/Perawat", "Wiraswasta", "Karyawan Swasta", "Petani/Nelayan", "Pelajar/Mahasiswa", "Pensiunan", "Lainnya"].map((job) => (
                              <Checkbox key={job} size="sm" isChecked={columnFilters.job_name.includes(job)} onChange={() => handleColumnFilterChange("job_name", job)} fontSize="sm" fontFamily="inherit" textAlign="left" sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}>
                                {job}
                              </Checkbox>
                            ))}
                            <HStack justify="flex-end" spacing={2} mt={1}>
                              <Button size="xs" variant="ghost" onClick={() => { clearColumnFilters("job_name"); setIsColumnFilterOpen((prev) => ({ ...prev, job_name: false })); }}>Reset</Button>
                              <Button size="xs" colorScheme="blue" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, job_name: false })); }}>Apply</Button>
                            </HStack>
                          </VStack>
                        )}
                      </Flex>
                    ) : (
                      "Pekerjaan"
                    )}
                  </Th>
                )}
                {columnVisibility.last_education_level && (
                  <Th textAlign="center" textTransform="none" fontWeight="medium" fontSize="sm">
                    {!isSelfScope && isAdminMode ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Pendidikan Terakhir
                        <IconButton size="xs" variant="ghost" icon={<FiFilter />} onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, last_education_level: !prev.last_education_level }))} />
                        {isColumnFilterOpen.last_education_level && (
                          <VStack className="filter-dropdown" spacing={1} p={2} bg="white" borderRadius="md" boxShadow="md" zIndex={10} position="absolute" top="100%" left="0" mt={1} align="start" width="250px" fontFamily="inherit" fontSize="sm" maxH="200px" overflowY="auto">
                            {["TK", "SD", "SMP", "SMA", "D1", "D2", "D3", "S1", "S2", "S3"].map((edu) => (
                              <Checkbox key={edu} size="sm" isChecked={columnFilters.last_education_level.includes(edu)} onChange={() => handleColumnFilterChange("last_education_level", edu)} fontSize="sm" fontFamily="inherit" textAlign="left" sx={{ "& .chakra-checkbox__label": { textAlign: "left" } }}>
                                {edu === "TK" ? "TK (Taman Kanak-Kanak)" :
                                  edu === "SD" ? "SD (Sekolah Dasar)" :
                                  edu === "SMP" ? "SMP (Sekolah Menengah Pertama)" :
                                  edu === "SMA" ? "SMA (Sekolah Menengah Atas)" :
                                  edu === "D1" ? "D1 (Diploma 1)" :
                                  edu === "D2" ? "D2 (Diploma 2)" :
                                  edu === "D3" ? "D3 (Diploma 3)" :
                                  edu === "S1" ? "S1 (Sarjana 1)" :
                                  edu === "S2" ? "S2 (Magister)" :
                                  "S3 (Doktor)"}
                              </Checkbox>
                            ))}
                            <HStack justify="flex-end" spacing={2} mt={1}>
                              <Button size="xs" variant="ghost" onClick={() => { clearColumnFilters("last_education_level"); setIsColumnFilterOpen((prev) => ({ ...prev, last_education_level: false })); }}>Reset</Button>
                              <Button size="xs" colorScheme="blue" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, last_education_level: false })); }}>Apply</Button>
                            </HStack>
                          </VStack>
                        )}
                      </Flex>
                    ) : (
                      "Pendidikan Terakhir"
                    )}
                  </Th>
                )}
              </Tr>
            </Thead>
            <Tbody>
              {usersList.length === 0 ? (
                <Tr>
                  <Td colSpan={Object.values(columnVisibility).filter(Boolean).length + (isAdminMode ? 1 : 0)} textAlign="center" color="gray.500" fontSize="sm">
                    Belum ada data
                  </Td>
                </Tr>
              ) : (
                usersList.map(user => (
                  <Tr
                    key={user.user_info_id}
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                    onClick={() => handleRowClick(user)}
                  >
                    {columnVisibility.user_info_id && (
                      <Td textAlign="center" onClick={(e) => e.stopPropagation()}>
                        <Flex align="center" justify="center" gap={3}>
                          {canDeleteUmat ? (
                            <Checkbox
                                size="sm"
                                isChecked={selectedIds.includes(user.user_info_id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  if (checked) {
                                    setSelectedIds((prev) => [...prev, user.user_info_id]);
                                  } else {
                                    setSelectedIds((prev) => prev.filter(id => id !== user.user_info_id));
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  ".chakra-checkbox__control": {
                                    borderColor: "gray.500",
                                    borderWidth: "1px",
                                  }
                                }}
                              />
                          ) : null}
                          <Box>{user.user_info_id}</Box>
                        </Flex>
                      </Td>
                    )}
                    {columnVisibility.full_name && <Td textAlign="center">{user.full_name}</Td>}
                    {columnVisibility.mandarin_name && <Td textAlign="center">{user.mandarin_name}</Td>}
                    {columnVisibility.spiritual_status && (
                      <Td textAlign="center">{user.spiritualUser?.spiritual_status || "-"}</Td>
                    )}
                    {columnVisibility.is_qing_kou && (
                      <Td textAlign="center">
                        <Badge
                          colorScheme={user.is_qing_kou ? "green" : "gray"}
                          variant="subtle"
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          {user.is_qing_kou ? "Sudah" : "Belum"}
                        </Badge>
                      </Td>
                    )}
                    {columnVisibility.gender && (
                      <Td textAlign="center">
                        <Badge
                          colorScheme={
                            user.gender === "Male" ? "blue" :
                            user.gender === "Female" ? "pink" : "gray"
                          }
                          variant="subtle"
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          {genderMap[user.gender] || "-"}
                        </Badge>
                      </Td>
                    )}
                    {columnVisibility.blood_type && (
                      <Td textAlign="center">
                        <Badge
                          colorScheme={
                            bloodTypeBadgeColor[user.blood_type] || "gray"
                          }
                          variant="subtle"
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          {user.blood_type || "-"}
                        </Badge>
                      </Td>
                    )}
                    {columnVisibility.place_of_birth && <Td textAlign="center">{user.place_of_birth || "-"}</Td>}
                    {columnVisibility.date_of_birth && (
                      <Td textAlign="center">
                        {user.date_of_birth
                          ? new Date(user.date_of_birth).toLocaleDateString("id-ID", {
                              year: "numeric", month: "long", day: "numeric"
                            })
                          : "-"
                        }
                      </Td>
                    )}
                    {columnVisibility.phone_number && <Td textAlign="center">{user.phone_number}</Td>}
                    {columnVisibility.job_name && <Td textAlign="center">{user.job_name || "-"}</Td>}
                    {columnVisibility.last_education_level && <Td textAlign="center">{user.last_education_level || "-"}</Td>}
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        )}
      </Box>

      <UserDetailModal
        isOpen={isOpen}
        onClose={onClose}
        selectedUser={selectedUser}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
        handleDelete={handleDelete}
        canEdit={canUpdateUmat}
        canDelete={canDeleteUmat}
      />

      {isAdminMode && canDeleteUmat && (
        <DeleteConfirmModal
          isOpen={isConfirmOpen}
          onClose={onConfirmClose}
          onConfirm={confirmBulkDelete}
          selectedCount={selectedIds.length}
          isDeleting={deleteUserMutation.isLoading}
        />
      )}

      {canCreateUmat && (
        <input type="file" accept=".xlsx" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUmatChange} />
      )}
    </Layout>
  );
}