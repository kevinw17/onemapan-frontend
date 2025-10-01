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
import { useFetchUserProfile } from "@/features/user/useFetchUserProfile";
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
  const [lastError, setLastError] = useState(null);
  const [userRole, setUserRole] = useState(null);
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

  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useFetchUserProfile(userId);
  const isNotUserRole = isProfileLoading ? false : (userProfile?.role || userRole) !== "User";

  const queryParams = useMemo(() => ({
    page,
    limit,
    search: isNotUserRole ? searchQuery : undefined,
    searchField: isNotUserRole ? searchField : undefined,
    job_name: isNotUserRole ? jobFilter : undefined,
    last_education_level: isNotUserRole ? educationFilter : undefined,
    spiritualStatus: isNotUserRole ? spiritualFilter : undefined,
    is_qing_kou: isNotUserRole ? qingKouFilter : undefined,
    gender: isNotUserRole ? genderFilter : undefined,
    blood_type: isNotUserRole ? bloodTypeFilter : undefined,
    userId: !isNotUserRole ? userId : undefined,
  }), [page, limit, searchQuery, searchField, jobFilter, educationFilter, spiritualFilter, qingKouFilter, genderFilter, bloodTypeFilter, userId, isNotUserRole]);

  const { data: users, isLoading, refetch: refetchUsers } = useFetchUsers(queryParams);
  const usersList = useMemo(() => {
    const rawUsers = users?.data || [];
    // Fallback filter for "User" role to ensure only their own data is shown
    return isNotUserRole ? rawUsers : rawUsers.filter(user => user.user_info_id === userId);
  }, [users, isNotUserRole, userId]);
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
      const id = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      const storedRole = localStorage.getItem("role");
      if (id && token) {
        setUserId(parseInt(id));
        setUserRole(storedRole || "User");
        console.log("User ID, token, and role fetched:", { userId: id, token, role: storedRole });
      } else if (token) {
        try {
          const decoded = jwtDecode(token);
          const decodedUserId = parseInt(decoded.user_info_id);
          const decodedRole = decoded.role || "User";
          if (decodedUserId) {
            localStorage.setItem("userId", decodedUserId.toString());
            localStorage.setItem("role", decodedRole);
            setUserId(decodedUserId);
            setUserRole(decodedRole);
            console.log("User ID and role fetched from token:", { userId: decodedUserId, role: decodedRole, token });
          } else {
            console.warn("No user_info_id found in token", { token });
            toast({
              id: "token-decode-error",
              title: "Gagal memproses token",
              description: "Tidak dapat menemukan user_info_id di token.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }
        } catch (error) {
          console.error("Failed to decode token:", error);
          toast({
            id: "token-decode-error",
            title: "Gagal memproses token",
            description: "Token tidak valid atau tidak dapat diproses.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        console.warn("Missing userId or token in localStorage", { userId: id, token });
        toast({
          id: "auth-error",
          title: "Autentikasi Gagal",
          description: "Silakan login kembali.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        router.push("/login");
      }
    }
  }, [toast, router]);

  useEffect(() => {
    if (userProfile?.role) {
      setUserRole(userProfile.role);
      localStorage.setItem("role", userProfile.role);
      if (userProfile.role !== "User") {
        setColumnVisibility((prev) => ({
          ...prev,
          mandarin_name: true,
          place_of_birth: true,
          date_of_birth: true,
        }));
      } else {
        setColumnVisibility((prev) => ({
          ...prev,
          mandarin_name: false,
          place_of_birth: false,
          date_of_birth: false,
        }));
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (profileError && profileError.message !== lastError) {
      console.error("Profile fetch error:", profileError);
      toast({
        id: `profile-error-${profileError?.message || "unknown"}`,
        title: "Gagal memuat profil pengguna",
        description: profileError?.message || "Terjadi kesalahan saat memuat data profil. Silakan login kembali.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLastError(profileError?.message || null);
      router.push("/login");
    }
  }, [profileError, lastError, toast, router]);

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
    if (!e.target.closest('.filter-dropdown')) {
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
    if (!isNotUserRole && user.user_info_id !== userId) {
      toast({
        id: `row-click-error-${user.user_info_id}`,
        title: "Akses Ditolak",
        description: "Anda hanya dapat melihat data Anda sendiri.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setSelectedUser(user);
    setFormData(user);
    setIsEditing(false);
    onOpen();
  };

  const handleDelete = async (userId) => {
    if (!isNotUserRole) {
      toast({
        id: `delete-error-${userId}`,
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk menghapus data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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
    if (!isNotUserRole) {
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
    if (!isNotUserRole) {
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
    fileInputRef.current?.click();
  };

  const handleFileUmatChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isNotUserRole) {
      toast({
        id: `import-error`,
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mengimpor data.",
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
      <Heading size="md" mb={4} ml={2}>
        Data Umat
        <Box as="span" fontSize="lg" color="gray.500" ml={2}>
          {isNotUserRole ? total : usersList.length}
        </Box>
      </Heading>
      {isProfileLoading && (
        <Flex justify="center" py={4}>
          <Spinner size="sm" />
        </Flex>
      )}
      {!isProfileLoading && profileError && (
        <Box color="red.500" mb={4}>
          Gagal memuat profil pengguna. Silakan coba lagi atau login ulang.
        </Box>
      )}
      <Flex mb={4} justify="space-between" align="center" wrap="nowrap" gap={2}>
        {isNotUserRole && (
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
          {isNotUserRole && selectedIds.length > 0 && (
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

          {isNotUserRole && (
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
                  w="300px"
                  position="absolute"
                  top="100%"
                  left={0}
                  mt={1}
                >
                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0}>Pekerjaan</FormLabel>
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
                            isChecked={tempJobFilter.includes(job)}
                            onChange={() => handleJobFilterChange(job)}
                          >
                            {job}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0}>Pendidikan Terakhir</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label={isEducationFilterOpen ? "Hide education filter" : "Show education filter"}
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
                            isChecked={tempEducationFilter.includes(edu)}
                            onChange={() => handleEducationFilterChange(edu)}
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
                      <FormLabel mb={0}>Status Rohani</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label={isSpiritualFilterOpen ? "Hide spiritual filter" : "Show spiritual filter"}
                        icon={isSpiritualFilterOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsSpiritualFilterOpen(!isSpiritualFilterOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isSpiritualFilterOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        {["QianRen", "DianChuanShi", "TanZhu", "FoYuan", "BanShiYuan", "QianXian", "DaoQin"].map((status) => (
                          <Checkbox
                            key={status}
                            isChecked={tempSpiritualFilter.includes(status)}
                            onChange={() => handleSpiritualFilterChange(status)}
                          >
                            {status === "QianRen" ? "Qian Ren / Sesepuh" :
                              status === "DianChuanShi" ? "Dian Chuan Shi / Pandita" :
                              status === "TanZhu" ? "Tan Zhu / Pandita Madya" :
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
                      <FormLabel mb={0}>Status Vegetarian</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label={isQingKouFilterOpen ? "Hide vegetarian filter" : "Show vegetarian filter"}
                        icon={isQingKouFilterOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsQingKouFilterOpen(!isQingKouFilterOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isQingKouFilterOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        <Checkbox
                          key="true"
                          isChecked={tempQingKouFilter.includes("true")}
                          onChange={() => handleQingKouFilterChange("true")}
                        >
                          Sudah
                        </Checkbox>
                        <Checkbox
                          key="false"
                          isChecked={tempQingKouFilter.includes("false")}
                          onChange={() => handleQingKouFilterChange("false")}
                        >
                          Belum
                        </Checkbox>
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0}>Jenis Kelamin</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label={isGenderFilterOpen ? "Hide gender filter" : "Show gender filter"}
                        icon={isGenderFilterOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsGenderFilterOpen(!isGenderFilterOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isGenderFilterOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        <Checkbox
                          key="Male"
                          isChecked={tempGenderFilter.includes("Male")}
                          onChange={() => handleGenderFilterChange("Male")}
                        >
                          Pria
                        </Checkbox>
                        <Checkbox
                          key="Female"
                          isChecked={tempGenderFilter.includes("Female")}
                          onChange={() => handleGenderFilterChange("Female")}
                        >
                          Wanita
                        </Checkbox>
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0}>Golongan Darah</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label={isBloodTypeFilterOpen ? "Hide blood type filter" : "Show blood type filter"}
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
                            isChecked={tempBloodTypeFilter.includes(type)}
                            onChange={() => handleBloodTypeFilterChange(type)}
                          >
                            {type}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Collapse>
                  </FormControl>

                  <HStack justify="flex-end" spacing={2}>
                    <Button size="sm" onClick={clearFilters}>Reset</Button>
                    <Button size="sm" onClick={() => setFilterOpen(false)}>Cancel</Button>
                    <Button size="sm" colorScheme="blue" onClick={applyFilters}>Unggah</Button>
                  </HStack>
                </VStack>
              )}
            </Box>
          )}

          {isNotUserRole && (
            <Select
              size="xs"
              width="180px"
              borderRadius="full"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="full_name">Nama Lengkap</option>
              {columnVisibility.mandarin_name && <option value="mandarin_name">Nama Mandarin</option>}
              {columnVisibility.place_of_birth && <option value="place_of_birth">Tempat Lahir</option>}
              <option value="id_card_number">No. KTP</option>
              <option value="phone_number">No. HP</option>
              <option value="email">Email</option>
              <option value="last_education_level">Pendidikan Terakhir</option>
              <option value="education_major">Jurusan Pendidikan</option>
              <option value="job_name">Pekerjaan</option>
              <option value="domicile_location.city">Domisili (Kota)</option>
              <option value="id_card_location.city">Lokasi sesuai KTP (Kota)</option>
            </Select>
          )}

          {isNotUserRole && (
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

          {isNotUserRole && (
            <Button
              colorScheme="blue"
              borderRadius="full"
              size="xs"
              minW="100px"
              leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
              onClick={() => router.push("/umat/addUmat")}
            >
              Tambah Umat
            </Button>
          )}

          {isNotUserRole && (
            <Button
              colorScheme="green"
              borderRadius="full"
              size="xs"
              minW="100px"
              leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
              onClick={handleImportUmat}
            >
              Import Data
            </Button>
          )}
        </Flex>
      </Flex>

      <Box overflowX="auto" minH="80vh">
        {isLoading || isProfileLoading ? (
          <Flex justify="center" py={10} height="60vh"><Spinner size="sm" /></Flex>
        ) : (
          <Table minWidth="max-content">
            <Thead>
              <Tr>
                {columnVisibility.user_info_id && isNotUserRole && (
                  <Th textAlign="center">
                    <Flex align="center" justify="center" gap={2}>
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
                      <Box>ID</Box>
                    </Flex>
                  </Th>
                )}
                {columnVisibility.user_info_id && !isNotUserRole && (
                  <Th textAlign="center">ID</Th>
                )}
                {columnVisibility.full_name && <Th textAlign="center">Nama Lengkap</Th>}
                {columnVisibility.mandarin_name && <Th textAlign="center">Nama Mandarin</Th>}
                {columnVisibility.spiritual_status && (
                  <Th textAlign="center">
                    {isNotUserRole ? (
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
                            width="200px"
                            style={{ textTransform: "none" }}
                          >
                            {["QianRen", "DianChuanShi", "TanZhu", "FoYuan", "BanShiYuan", "QianXian", "DaoQin"].map((status) => (
                              <Checkbox
                                key={status}
                                isChecked={columnFilters.spiritualStatus.includes(status)}
                                onChange={() => handleColumnFilterChange("spiritualStatus", status)}
                                style={{ textTransform: "none", textAlign: "left" }}
                              >
                                {status === "QianRen" ? "Qian Ren / Sesepuh" :
                                  status === "DianChuanShi" ? "Dian Chuan Shi / Pandita" :
                                  status === "TanZhu" ? "Tan Zhu / Pandita Madya" :
                                  status === "FoYuan" ? "Fo Yuan / Buddha Siswa" :
                                  status === "BanShiYuan" ? "Ban Shi Yuan / Pelaksana Vihara" :
                                  status === "QianXian" ? "Qian Xian / Aktivis" :
                                  "Dao Qin / Umat"}
                              </Checkbox>
                            ))}
                            <HStack justify="flex-end" spacing={2}>
                              <Button size="xs" onClick={() => { clearColumnFilters("spiritualStatus"); setIsColumnFilterOpen((prev) => ({ ...prev, spiritualStatus: false })); }}>Reset</Button>
                              <Button size="xs" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, spiritualStatus: false })); }}>Apply</Button>
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
                  <Th textAlign="center">
                    {isNotUserRole ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Status Vegetarian
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label="Filter vegetarian status"
                          icon={<FiFilter />}
                          onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, is_qing_kou: !prev.is_qing_kou }))}
                          _hover={{ bg: "transparent" }}
                        />
                        {isColumnFilterOpen.is_qing_kou && (
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
                            width="200px"
                            style={{ textTransform: "none" }}
                          >
                            <Checkbox
                              key="true"
                              isChecked={columnFilters.is_qing_kou.includes("true")}
                              onChange={() => handleColumnFilterChange("is_qing_kou", "true")}
                              style={{ textTransform: "none", textAlign: "left" }}
                            >
                              Sudah
                            </Checkbox>
                            <Checkbox
                              key="false"
                              isChecked={columnFilters.is_qing_kou.includes("false")}
                              onChange={() => handleColumnFilterChange("is_qing_kou", "false")}
                              style={{ textTransform: "none", textAlign: "left" }}
                            >
                              Belum
                            </Checkbox>
                            <HStack justify="flex-end" spacing={2}>
                              <Button size="xs" onClick={() => { clearColumnFilters("is_qing_kou"); setIsColumnFilterOpen((prev) => ({ ...prev, is_qing_kou: false })); }}>Reset</Button>
                              <Button size="xs" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, is_qing_kou: false })); }}>Apply</Button>
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
                  <Th textAlign="center">
                    {isNotUserRole ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Jenis Kelamin
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label="Filter gender"
                          icon={<FiFilter />}
                          onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, gender: !prev.gender }))}
                          _hover={{ bg: "transparent" }}
                        />
                        {isColumnFilterOpen.gender && (
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
                            width="200px"
                            style={{ textTransform: "none" }}
                          >
                            <Checkbox
                              key="Male"
                              isChecked={columnFilters.gender.includes("Male")}
                              onChange={() => handleColumnFilterChange("gender", "Male")}
                              style={{ textTransform: "none", textAlign: "left" }}
                            >
                              Pria
                            </Checkbox>
                            <Checkbox
                              key="Female"
                              isChecked={columnFilters.gender.includes("Female")}
                              onChange={() => handleColumnFilterChange("gender", "Female")}
                              style={{ textTransform: "none", textAlign: "left" }}
                            >
                              Wanita
                            </Checkbox>
                            <HStack justify="flex-end" spacing={2}>
                              <Button size="xs" onClick={() => { clearColumnFilters("gender"); setIsColumnFilterOpen((prev) => ({ ...prev, gender: false })); }}>Reset</Button>
                              <Button size="xs" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, gender: false })); }}>Apply</Button>
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
                  <Th textAlign="center">
                    {isNotUserRole ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Golongan Darah
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label="Filter blood type"
                          icon={<FiFilter />}
                          onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, blood_type: !prev.blood_type }))}
                          _hover={{ bg: "transparent" }}
                        />
                        {isColumnFilterOpen.blood_type && (
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
                            width="200px"
                            style={{ textTransform: "none" }}
                          >
                            {["A", "B", "O", "AB"].map((type) => (
                              <Checkbox
                                key={type}
                                isChecked={columnFilters.blood_type.includes(type)}
                                onChange={() => handleColumnFilterChange("blood_type", type)}
                                style={{ textTransform: "none", textAlign: "left" }}
                              >
                                {type}
                              </Checkbox>
                            ))}
                            <HStack justify="flex-end" spacing={2}>
                              <Button size="xs" onClick={() => { clearColumnFilters("blood_type"); setIsColumnFilterOpen((prev) => ({ ...prev, blood_type: false })); }}>Reset</Button>
                              <Button size="xs" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, blood_type: false })); }}>Apply</Button>
                            </HStack>
                          </VStack>
                        )}
                      </Flex>
                    ) : (
                      "Golongan Darah"
                    )}
                  </Th>
                )}
                {columnVisibility.place_of_birth && <Th textAlign="center">Tempat Lahir</Th>}
                {columnVisibility.date_of_birth && <Th textAlign="center">Tanggal Lahir</Th>}
                {columnVisibility.phone_number && <Th textAlign="center">No. HP</Th>}
                {columnVisibility.job_name && (
                  <Th textAlign="center">
                    {isNotUserRole ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Pekerjaan
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label="Filter job"
                          icon={<FiFilter />}
                          onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, job_name: !prev.job_name }))}
                          _hover={{ bg: "transparent" }}
                        />
                        {isColumnFilterOpen.job_name && (
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
                            width="200px"
                            style={{ textTransform: "none" }}
                          >
                            {["PNS", "Guru/Dosen", "Dokter/Perawat", "Wiraswasta", "Karyawan Swasta", "Petani/Nelayan", "Pelajar/Mahasiswa", "Pensiunan", "Lainnya"].map((job) => (
                              <Checkbox
                                key={job}
                                isChecked={columnFilters.job_name.includes(job)}
                                onChange={() => handleColumnFilterChange("job_name", job)}
                                style={{ textTransform: "none", textAlign: "left" }}
                              >
                                {job}
                              </Checkbox>
                            ))}
                            <HStack justify="flex-end" spacing={2}>
                              <Button size="xs" onClick={() => { clearColumnFilters("job_name"); setIsColumnFilterOpen((prev) => ({ ...prev, job_name: false })); }}>Reset</Button>
                              <Button size="xs" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, job_name: false })); }}>Apply</Button>
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
                  <Th textAlign="center">
                    {isNotUserRole ? (
                      <Flex align="center" justify="center" gap={1} position="relative">
                        Pendidikan Terakhir
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label="Filter education"
                          icon={<FiFilter />}
                          onClick={() => setIsColumnFilterOpen((prev) => ({ ...prev, last_education_level: !prev.last_education_level }))}
                          _hover={{ bg: "transparent" }}
                        />
                        {isColumnFilterOpen.last_education_level && (
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
                            width="200px"
                            style={{ textTransform: "none" }}
                          >
                            {["TK", "SD", "SMP", "SMA", "D1", "D2", "D3", "S1", "S2", "S3"].map((edu) => (
                              <Checkbox
                                key={edu}
                                isChecked={columnFilters.last_education_level.includes(edu)}
                                onChange={() => handleColumnFilterChange("last_education_level", edu)}
                                style={{ textTransform: "none", textAlign: "left" }}
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
                            <HStack justify="flex-end" spacing={2}>
                              <Button size="xs" onClick={() => { clearColumnFilters("last_education_level"); setIsColumnFilterOpen((prev) => ({ ...prev, last_education_level: false })); }}>Reset</Button>
                              <Button size="xs" onClick={() => { applyColumnFilters(); setIsColumnFilterOpen((prev) => ({ ...prev, last_education_level: false })); }}>Apply</Button>
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
                  <Td colSpan={Object.values(columnVisibility).filter(Boolean).length + (isNotUserRole ? 1 : 0)} textAlign="center" color="gray.500">
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
                    {columnVisibility.user_info_id && isNotUserRole && (
                      <Td textAlign="center" onClick={(e) => e.stopPropagation()}>
                        <Flex align="center" justify="center" gap={3}>
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
                          <Box>{user.user_info_id}</Box>
                        </Flex>
                      </Td>
                    )}
                    {columnVisibility.user_info_id && !isNotUserRole && (
                      <Td textAlign="center">{user.user_info_id}</Td>
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
        canEdit={isNotUserRole}
        canDelete={isNotUserRole}
      />

      {isNotUserRole && (
        <DeleteConfirmModal
          isOpen={isConfirmOpen}
          onClose={onConfirmClose}
          onConfirm={confirmBulkDelete}
          selectedCount={selectedIds.length}
          isDeleting={deleteUserMutation.isLoading}
        />
      )}

      {isNotUserRole && (
        <input
          type="file"
          accept=".xlsx"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUmatChange}
        />
      )}
    </Layout>
  );
}