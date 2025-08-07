import {
    Table, Tbody, Thead, Tr, Th, Td, Spinner, 
    Box, useDisclosure, Button, Input, InputGroup, 
    InputLeftElement, InputRightElement, IconButton,
    useToast, Select, Checkbox, VStack, HStack,
    FormControl, FormLabel, Collapse
} from "@chakra-ui/react";
import { useFetchUsers } from "@/features/user/useFetchUsers";
import Layout from "../components/layout";
import { Badge, Flex, Heading } from "@chakra-ui/react";
import { useState, useRef } from "react";
import { useUpdateUser } from "@/features/user/useUpdateUser";
import { useDeleteUser } from "@/features/user/useDeleteUser";
import Pagination from "@/components/Pagination";
import { FiFilter, FiMinus, FiPlus, FiSearch, FiX } from "react-icons/fi";
import UserDetailModal from "@/components/UserDetailModal";
import { useUpdateLocation } from "@/features/location/useUpdateLocation";
import { useRouter } from "next/router";

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
    const [tempJobFilter, setTempJobFilter] = useState([]);
    const [tempEducationFilter, setTempEducationFilter] = useState([]);
    const [isJobFilterOpen, setIsJobFilterOpen] = useState(false);
    const [isEducationFilterOpen, setIsEducationFilterOpen] = useState(false);
    const { data: users, isLoading, refetch: refetchUsers } = useFetchUsers({
        page,
        limit,
        search: searchQuery,
        searchField: searchField,
        job_name: jobFilter,
        last_education_level: educationFilter,
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
    const router = useRouter();
    const fileInputRef = useRef(null);

    const handleRowClick = (user) => {
        setSelectedUser(user);
        setFormData(user);
        setIsEditing(false);
        onOpen();
    };

    const handleDelete = async (userId) => {
        deleteUserMutation.mutate(userId, {
            onSuccess: () => {
                refetchUsers();
                onClose();
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

    const applyFilters = () => {
        setJobFilter([...tempJobFilter]);
        setEducationFilter([...tempEducationFilter]);
        refetchUsers({
            page,
            limit,
            search: searchQuery,
            searchField,
            job_name: tempJobFilter,
            last_education_level: tempEducationFilter,
        }).then(() => {
            console.log("Applied filters:", { job_name: tempJobFilter, last_education_level: tempEducationFilter });
        }).catch((error) => {
            console.error("Error applying filters:", error);
        });
        setFilterOpen(false);
    };

    const clearFilters = () => {
        setTempJobFilter([]);
        setTempEducationFilter([]);
        setJobFilter([]);
        setEducationFilter([]);
        refetchUsers({
            page,
            limit,
            search: searchQuery,
            searchField,
        });
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

    const handleImportUmat = () => {
        fileInputRef.current?.click();
    };

    const handleFileUmatChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://localhost:2025/import/umat", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Gagal mengimpor");
            }

            toast({
                title: "Berhasil mengimpor data umat",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            handleImportSuccess();
        } catch (err) {
            toast({
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

                    <Box position="relative">
                        <Button
                            colorScheme="white"
                            textColor="gray.700"
                            borderRadius={16}
                            borderWidth="1px"
                            borderColor="gray.400"
                            size="sm"
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

                                <HStack justify="flex-end" spacing={2}>
                                    <Button size="sm" onClick={clearFilters}>Cancel</Button>
                                    <Button size="sm" colorScheme="blue" onClick={applyFilters}>Unggah</Button>
                                </HStack>
                            </VStack>
                        )}
                    </Box>

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

                    <Button
                        colorScheme="blue"
                        borderRadius="full"
                        size="sm"
                        leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
                        onClick={() => router.push("/umat/addUmat")}
                    >
                        Tambah Umat
                    </Button>

                    <Button
                        colorScheme="green"
                        borderRadius="full"
                        size="sm"
                        leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
                        onClick={handleImportUmat}
                    >
                        Import Data Massal
                    </Button>
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

            <input
                type="file"
                accept=".xlsx"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileUmatChange}
            />
        </Layout>
    );
}