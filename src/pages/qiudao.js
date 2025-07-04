import Layout from "../components/layout";
import {
  Table, Tbody, Thead, Tr, Th, Td, Spinner, Box,
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
  Checkbox
} from "@chakra-ui/react";
import { useFetchQiudaos } from "@/features/qiudao/useFetchQiudaos";
import { useState } from "react";
import { useRouter } from "next/router";
import { FiPlus, FiSearch, FiX } from "react-icons/fi";
import Pagination from "@/components/Pagination";
import { useUpdateLocation } from "@/features/location/useUpdateLocation";
import QiudaoDetailModal from "@/components/QiudaoDetailModal";
import { useDeleteQiudao } from "@/features/qiudao/useDeleteQiudao";
import { useUpdateQiudao } from "@/features/qiudao/useUpdateQiudao";

export default function QiudaoPage() {
  const tableHeaders = [
    "ID", "Lokasi Qiudao", "Nama Indonesia", "Nama Mandarin Qiudao",
    "Dian Chuan Shi", "Guru Pengajak", "Guru Penanggung", "Tanggal Qiudao"
  ];
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("qiu_dao_mandarin_name");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const { data: qiudaos, isLoading, refetch: refetchQiudaos } = useFetchQiudaos({
    page,
    limit,
    search: searchQuery,
    searchField: searchField,
  });
  const qiudaosList = qiudaos?.data || [];
  const total = qiudaos?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedQiudao, setSelectedQiudao] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const updateLocationMutation = useUpdateLocation();
  const updateQiudaoMutation = useUpdateQiudao();
  const deleteQiudaoMutation = useDeleteQiudao();
  
  const handleRowClick = (qiudao) => {
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

  const dateFormat = (qd) => `${qd.lunar_sui_ci_year || ""}${qd.lunar_month || ""}${qd.lunar_day || ""}${qd.lunar_shi_chen_time || ""}`;

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    deleteQiudaoMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Berhasil dihapus", status: "success", duration: 3000, isClosable: true });
        onClose();
      },
      onError: (err) => {
        const message =
          err?.response?.data?.message ||
          err?.response?.data ||
          "Terjadi kesalahan saat menghapus data";
        toast({
          title: "Gagal menghapus",
          description: message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      },
    });
  };

  const handleSave = async () => {
    const {
      qiu_dao_id,
      qiu_dao_location_id,
      qiu_dao_name,
      qiu_dao_mandarin_name,
      dian_chuan_shi_mandarin_name,
      yin_shi_qd_mandarin_name,
      bao_shi_qd_mandarin_name,
      lunar_sui_ci_year,
      lunar_month,
      lunar_day,
      lunar_shi_chen_time,
      qiu_dao_location
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
        dian_chuan_shi_mandarin_name,
        yin_shi_qd_mandarin_name,
        bao_shi_qd_mandarin_name,
        lunar_sui_ci_year,
        lunar_month,
        lunar_day,
        lunar_shi_chen_time,
      };

      await updateQiudaoMutation.mutateAsync({ qiu_dao_id, qiudaoPayload });

      toast({ title: "Berhasil disimpan", status: "success", duration: 3000, isClosable: true });
      setSelectedQiudao({ ...selectedQiudao, ...qiudaoPayload, qiu_dao_location });
      setIsEditing(false);
      refetchQiudaos();

    } catch (err) {
      console.error("Gagal menyimpan:", err);
      toast({ title: "Gagal menyimpan", status: "error", duration: 3000, isClosable: true });
    }
  };

  const handleImportSuccess = () => {
    refetchQiudaos();
  };

  return (
    <Layout title="Qiudao" onImportSuccess={handleImportSuccess}>
      <Flex justify="space-between" align="center" mb={4}>
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

          <Flex gap={2} align="center" flexWrap="nowrap" flexShrink={0}>
            {selectedIds.length > 0 && (
              <Button
                  colorScheme="red"
                  borderRadius="full"
                  size="sm"
                  onClick={async () => {
                      const confirm = window.confirm(
                        `Yakin ingin menghapus ${selectedIds.length} data umat ini?`
                      );
                      if (!confirm) return;

                      for (const id of selectedIds) {
                        await deleteQiudaoMutation.mutateAsync(id);
                      }

                      toast({
                        title: "Berhasil dihapus",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                      });

                      setSelectedIds([]);
                      setIsAllSelected(false);
                      refetchQiudaos();
                  }}
              >
              Hapus {selectedIds.length} data
              </Button>
            )}

            <Select
                    size="sm"
                    width="auto"
                    borderRadius="full"
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                >
                    <option value="qiu_dao_mandarin_name">Nama Mandarin Qiudao</option>
                    <option value="qiu_dao_name">Nama Qiudao</option>
                    <option value="dian_chuan_shi_name">Nama Pandita</option>
                    <option value="dian_chuan_shi_mandarin_name">Nama Mandarin Pandita</option>
                    <option value="yin_shi_qd_name">Nama Guru Pengajak</option>
                    <option value="yin_shi_qd_mandarin_name">Nama Mandarin Guru Pengajak</option>
                    <option value="bao_shi_qd_name">Nama Guru Penanggung</option>
                    <option value="bao_shi_qd_mandarin_name">Nama Mandarin Guru Penanggung</option>
                    <option value="lunar_sui_ci_year">Tahun Lunar</option>
                    <option value="lunar_month">Bulan Lunar</option>
                    <option value="lunar_day">Tanggal Lunar</option>
                    <option value="lunar_shi_chen_time">Waktu Lunar</option>
            </Select>

            <InputGroup size="sm" width="200px">
                <InputLeftElement pointerEvents="none">
                    <FiSearch color="black" />
                </InputLeftElement>
                <Input
                    placeholder="Cari data umat disini..."
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
              size="sm"
              leftIcon={<FiPlus style={{ marginTop: "2px" }}/>}
              onClick={() => router.push("/qiudao/addQiudao")}
            >
                Qiudao baru
            </Button>
          </Flex>
      </Flex>

      <Box overflowX="auto">
        <Table minWidth="max-content">
          <Thead>
            <Tr>
              <Th textAlign="center">
                <Flex align="center" justify="center" gap={2}>
                  <Checkbox
                    size="sm" 
                    isChecked={isAllSelected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsAllSelected(checked);
                      setSelectedIds(checked ? qiudaosList.map(q => q.qiu_dao_id) : []);
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
              {tableHeaders.slice(1).map(h => (
                <Th key={h} textAlign="center">{h}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr><Td colSpan={tableHeaders.length}><Spinner size="sm" /></Td></Tr>
            ) : (
              qiudaosList.map(qiudao => (
                <Tr 
                  key={qiudao.qiu_dao_id}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => handleRowClick(qiudao)}
                >
                  <Td textAlign="center" onClick={(e) => e.stopPropagation()}>
                    <Flex align="center" justify="center" gap={2}>
                      <Checkbox
                        size="sm"
                        isChecked={selectedIds.includes(qiudao.qiu_dao_id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            setSelectedIds((prev) => [...prev, qiudao.qiu_dao_id]);
                          } else {
                            setSelectedIds((prev) => prev.filter(id => id !== qiudao.qiu_dao_id));
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
                      <Box>{qiudao.qiu_dao_id}</Box>
                    </Flex>
                  </Td>
                  <Td textAlign="center">{qiudao.qiu_dao_location?.location_mandarin_name}</Td>
                  <Td textAlign="center">{qiudao.qiu_dao_name?.trim() || "-"}</Td>
                  <Td textAlign="center">{qiudao.qiu_dao_mandarin_name}</Td>
                  <Td textAlign="center">{qiudao.dian_chuan_shi_mandarin_name}</Td>
                  <Td textAlign="center">{qiudao.yin_shi_qd_mandarin_name}</Td>
                  <Td textAlign="center">{qiudao.bao_shi_qd_mandarin_name}</Td>
                  <Td textAlign="center">{dateFormat(qiudao)}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
      <QiudaoDetailModal
        isOpen={isOpen}
        onClose={handleClose}
        selectedQiudao={selectedQiudao}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
        handleDelete={handleDelete}
      />
    </Layout>
  );
}
