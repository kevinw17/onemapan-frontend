// src/pages/qiudao.js
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
} from "@chakra-ui/react";
import { useFetchQiudaos } from "@/features/qiudao/useFetchQiudaos";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import Pagination from "@/components/Pagination";
import { useUpdateLocation } from "@/features/location/useUpdateLocation";
import QiudaoDetailModal from "@/components/QiudaoDetailModal";
import { useDeleteQiudao } from "@/features/qiudao/useDeleteQiudao";
import { useUpdateQiudao } from "@/features/qiudao/useUpdateQiudao";
import { jwtDecode } from "jwt-decode";
import { useFetchUserProfile } from "@/features/user/useFetchUserProfile";
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

  const tableHeaders = [
    { key: "qiu_dao_id", label: "ID" },
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
          console.log("DEBUG: Decoded JWT in qiudao.js:", decoded);
          const decodedUserId = parseInt(decoded.user_info_id);
          setUserId(decodedUserId);
          setUserScope(decoded.scope);
          setUserArea(decoded.area || null);
          localStorage.setItem("userId", decodedUserId.toString());
          localStorage.setItem("scope", decoded.scope);
          localStorage.setItem("area", decoded.area || "");
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
          router.push("/login");
        }
      } else {
        console.warn("Missing token in localStorage");
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
      setIsUserLoaded(true);
    }
  }, [toast, router]);

  const { data: userProfile, isLoading: isProfileLoading, error: profileError, refetch: refetchProfile } = useFetchUserProfile(userId);

  useEffect(() => {
    if (userProfile?.area) {
      setUserArea(userProfile.area);
      localStorage.setItem("area", userProfile.area);
      console.log("DEBUG: Set userArea from profile:", userProfile.area);
    } else if (userScope === "wilayah") {
      console.warn("DEBUG: userProfile.area is missing:", userProfile);
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
  }, [userProfile, userScope]);

  useEffect(() => {
    if (userId && typeof window !== "undefined") {
      queryClient.invalidateQueries(["userProfile"]);
      queryClient.invalidateQueries(["qiudaos"]);
      refetchProfile();
    }
  }, [userId, queryClient, refetchProfile]);

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

  const fetchParams = useMemo(() => {
    const params = {
      page: isNotSelfScope ? page : undefined,
      limit: isNotSelfScope ? limit : undefined,
      search: isNotSelfScope ? searchQuery : undefined,
      searchField: isNotSelfScope ? searchField : undefined,
      area: userScope === "wilayah" && userArea ? userArea : undefined,
      userId: userScope === "self" ? userId : undefined,
    };
    console.log("DEBUG: fetchParams:", params);
    return params;
  }, [page, limit, searchQuery, searchField, userScope, userArea, userId, isNotSelfScope]);

  const { data: qiudaos, isLoading, error, refetch: refetchQiudaos } = useFetchQiudaos(fetchParams);
  const qiudaosList = useMemo(() => {
    const rawQiudaos = qiudaos?.data || [];
    console.log("DEBUG: rawQiudaos:", rawQiudaos);
    const filteredQiudaos = userScope === "self"
      ? rawQiudaos.filter(q => {
          const matches = q.qiu_dao_id === userProfile?.qiu_dao_id;
          console.log("DEBUG: Filtering qiudao:", { qiu_dao_id: q.qiu_dao_id, userQiuDaoId: userProfile?.qiu_dao_id, matches });
          return matches;
        })
      : rawQiudaos;
    console.log("DEBUG: qiudaosList:", filteredQiudaos);
    return filteredQiudaos;
  }, [qiudaos, userScope, userProfile]);
  const total = isNotSelfScope ? qiudaos?.total || 0 : qiudaosList.length;
  const totalPages = isNotSelfScope ? Math.max(1, Math.ceil(total / limit)) : 1;

  useEffect(() => {
    if (error && error.message !== lastError) {
      console.error("Qiudao fetch error:", error);
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

  const handleRowClick = (qiudao) => {
    console.log("DEBUG: handleRowClick:", {
      userScope,
      userArea,
      qiudaoArea: qiudao.qiu_dao_location?.area,
      qiu_dao_id: qiudao.qiu_dao_id,
      userQiuDaoId: userProfile?.qiu_dao_id,
    });
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
    if (userScope === "self" && qiudao.qiu_dao_id !== userProfile?.qiu_dao_id) {
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
      console.error("Gagal menyimpan:", err);
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
    if (!isNotSelfScope) {
      toast({
        id: "import-error",
        title: "Tidak Diizinkan",
        description: "Anda tidak memiliki izin untuk import data.",
        status: "warning",
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

  if (!isUserLoaded || isProfileLoading) {
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

            <Select
              size="xs"
              width="240px"
              borderRadius="full"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="qiu_dao_mandarin_name">Nama Mandarin Qiudao</option>
              <option value="qiu_dao_name">Nama Qiudao</option>
              <option value="dian_chuan_shi.name">Nama Pandita</option>
              <option value="dian_chuan_shi.mandarin_name">Nama Mandarin Pandita</option>
              <option value="yin_shi_qd_name">Nama Guru Pengajak</option>
              <option value="yin_shi_qd_mandarin_name">Nama Mandarin Guru Pengajak</option>
              <option value="bao_shi_qd_name">Nama Guru Penanggung</option>
              <option value="bao_shi_qd_mandarin_name">Nama Mandarin Guru Penanggung</option>
              <option value="lunar_sui_ci_year">Tahun Lunar</option>
              <option value="lunar_month">Bulan Lunar</option>
              <option value="lunar_day">Tanggal Lunar</option>
              <option value="lunar_shi_chen_time">Waktu Lunar</option>
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
                  <Th key={header.key} textAlign="center">
                    {isNotSelfScope && header.key === "qiu_dao_id" ? (
                      <Flex align="center" justify="center" gap={2}>
                        <Checkbox
                          size="sm"
                          isChecked={isAllSelected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsAllSelected(checked);
                            setSelectedIds(checked ? qiudaosList.map((q) => q.qiu_dao_id) : []);
                          }}
                          sx={{
                            ".chakra-checkbox__control": {
                              borderColor: "gray.500",
                              borderWidth: "1px",
                            },
                          }}
                        />
                        <Box>{header.label}</Box>
                      </Flex>
                    ) : (
                      header.label
                    )}
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
                    <Td key={header.key} textAlign="center" onClick={header.key === "qiu_dao_id" ? (e) => e.stopPropagation() : undefined}>
                      {header.key === "qiu_dao_id" && isNotSelfScope ? (
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
        canEdit={isNotSelfScope}
      />

      {isNotSelfScope && (
        <DeleteConfirmModal
          isOpen={isConfirmOpen}
          onClose={onConfirmClose}
          onConfirm={confirmBulkDelete}
          selectedCount={selectedIds.length}
          isDeleting={deleteQiudaoMutation.isLoading}
        />
      )}

      {isNotSelfScope && (
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