import {
    Table, Tbody, Thead, Tr, Th, Td, Spinner, 
    Box, useDisclosure, Button,Input, InputGroup, 
    InputLeftElement, InputRightElement, IconButton,
    useToast, Select, Checkbox
} from "@chakra-ui/react";
import { useFetchUsers } from "@/features/user/useFetchUsers";
import Layout from "../components/layout";
import { Badge, Flex, Heading } from "@chakra-ui/react";
import { useState } from "react";
import { useUpdateUser } from "@/features/user/useUpdateUser";
import { useDeleteUser } from "@/features/user/useDeleteUser";
import Pagination from "@/components/Pagination";
import { FiSearch, FiX } from "react-icons/fi";
import UserDetailModal from "@/components/UserDetailModal";
import { useUpdateLocation } from "@/features/location/useUpdateLocation";
import AddUmatMenu from "@/components/addUmatMenu";

export default function UmatPage() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchField, setSearchField] = useState("full_name");
    const [selectedIds, setSelectedIds] = useState([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const { data: users, isLoading, refetch: refetchUsers } = useFetchUsers({
        page,
        limit,
        search: searchQuery,
        searchField: searchField,
    });
    const usersList = users?.data || [];
    const total = users?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const toast = useToast();
    const genderMap = { Male: "Pria", Female: "Wanita" };
    const bloodTypeBadgeColor = {
        A: "blue", B: "purple", O: "yellow", AB: "gray"
    };
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();
    const updateLocationMutation = useUpdateLocation();
    const handleRowClick = (user) => {
        setSelectedUser(user);
        setFormData(user);
        setIsEditing(false);
        onOpen();
    };

    const handleDelete = async (userId) => {
        const confirm = window.confirm("Apakah Anda yakin ingin menghapus data ini?");
        if (!confirm) return;

        deleteUserMutation.mutate(userId, {
            onSuccess: () => {
                toast({
                    title: "Berhasil dihapus",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
                refetchUsers();
                onClose();
            },
            onError: (error) => {
                const errorData = error?.response?.data;
                const errorMessage =
                typeof errorData === "string"
                    ? errorData
                    : errorData?.message || "Terjadi kesalahan saat menghapus user.";
                toast({
                    title: "Gagal menghapus",
                    description: errorMessage,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            },
        });
    };

    const handleSave = async () => {
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
            title: "Lokasi KTP tidak valid",
            status: "error",
            duration: 3000,
            isClosable: true,
            });
            return;
        }

        if (!domicileLocationId || isNaN(domicileLocationId)) {
            toast({
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
                    }
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

    return (
        <Layout title="Umat">
            <Heading size="md" mb={4} ml={2}>
                Data Umat
                <Box as="span" fontSize="lg" color="gray.500" ml={2}>
                {total}
                </Box>
            </Heading>
        <Flex mb={4} justify="space-between" align="center" wrap="wrap" gap={4}>
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
                            await deleteUserMutation.mutateAsync(id);
                            }

                            toast({
                            title: "Berhasil dihapus",
                            status: "success",
                            duration: 3000,
                            isClosable: true,
                            });

                            setSelectedIds([]);
                            setIsAllSelected(false);
                            refetchUsers();
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
                    <option value="full_name">Nama Lengkap</option>
                    <option value="mandarin_name">Nama Mandarin</option>
                    <option value="place_of_birth">Tempat Lahir</option>
                    <option value="id_card_number">No. KTP</option>
                    <option value="phone_number">No. HP</option>
                    <option value="email">Email</option>
                    <option value="last_education_level">Pendidikan Terakhir</option>
                    <option value="education_major">Jurusan Pendidikan</option>
                    <option value="job_name">Pekerjaan</option>
                    <option value="domicile_location.city">Domisili (Kota)</option>
                    <option value="id_card_location.city">Lokasi sesuai KTP (Kota)</option>
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

                {/* <Button
                    colorScheme="blue"
                    borderRadius="full"
                    size="sm"
                    leftIcon={<FiPlus style={{ marginTop: "2px" }}/>}
                    onClick={() => router.push("/umat/addUmat")}
                >
                    Umat baru
                </Button> */}
                <AddUmatMenu onImportSuccess={handleImportSuccess} />
            </Flex>
        </Flex>

        <Box overflowX="auto" minH="80vh">
            {isLoading ? (
                <Flex justify="center" py={10} height="60vh"><Spinner size="sm" /></Flex>
            ) : usersList.length === 0 ? (
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
                        <Th textAlign="center">Nama Lengkap</Th>
                        <Th textAlign="center">Nama Mandarin</Th>
                        <Th textAlign="center">Status Rohani</Th>
                        <Th textAlign="center">Status Vegetarian</Th>
                        <Th textAlign="center">Jenis Kelamin</Th>
                        <Th textAlign="center">Golongan Darah</Th>
                        <Th textAlign="center">Tempat Lahir</Th>
                        <Th textAlign="center">Tanggal Lahir</Th>
                        <Th textAlign="center">No. HP</Th>
                        {/* <Th textAlign="center">Alamat Domisili</Th>
                        <Th textAlign="center">Alamat KTP</Th> */}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {usersList.map(user => (
                            <Tr
                                key={user.user_info_id}
                                cursor="pointer"
                                _hover={{ bg: "gray.50" }}
                                onClick={() => handleRowClick(user)}
                            >
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
                            <Td textAlign="center">{user.full_name}</Td>
                            <Td textAlign="center">{user.mandarin_name}</Td>
                            <Td textAlign="center">
                                {user.spiritualUser?.spiritual_status || "-"}
                            </Td>
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
                            <Td textAlign="center">{user.place_of_birth || "-"}</Td>
                            <Td textAlign="center">
                                {user.date_of_birth
                                    ? new Date(user.date_of_birth).toLocaleDateString("id-ID", {
                                        year: "numeric", month: "long", day: "numeric"
                                    })
                                    : "-"
                                }
                            </Td>
                            <Td textAlign="center">{user.phone_number}</Td>
                            {/* <Td textAlign="center">
                                {user.domicile_location?.street || "-"},{" "}
                                {user.domicile_location?.locality?.district?.city?.name || "-"}
                            </Td>
                            <Td textAlign="center">
                                {user.id_card_location?.street || "-"},{" "}
                                {user.id_card_location?.locality?.district?.city?.name || "-"}
                            </Td> */}
                            </Tr>
                        ))}
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
        />
    </Layout>
    );
}
