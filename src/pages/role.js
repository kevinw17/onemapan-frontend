import { 
    Box, Button, Flex, Heading, Text, 
    Switch, SimpleGrid, Table, Thead, Tbody, Tr, Th, Td, 
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, 
    useDisclosure, HStack, VStack 
} from "@chakra-ui/react";
import { useState } from "react";
import Layout from "@/components/layout";

const RolePage = () => {
    const initialRoles = [
        {
        id: 1,
        name: "Super Admin",
        permissions: {
            umat: { create: true, read: true, update: true, delete: true, bulkCreate: true, readNational: true, readArea: true },
            qiudao: { create: true, read: true, update: true, delete: true, bulkCreate: true, readNational: true, readArea: true },
            dashboard: { readNational: true, readArea: true },
            kegiatan: { create: true, read: true, update: true, delete: true, readNational: true, readArea: true },
            account: { createRole: true, updateRole: true, deleteRole: true, settings: true, help: true },
        },
        },
        {
        id: 2,
        name: "Admin",
        permissions: {
            umat: { create: true, read: true, update: true, delete: false, bulkCreate: true, readNational: false, readArea: true },
            qiudao: { create: true, read: true, update: true, delete: false, bulkCreate: true, readNational: false, readArea: true },
            dashboard: { readNational: false, readArea: true },
            kegiatan: { create: true, read: true, update: true, delete: true, readNational: true, readArea: true },
            account: { createRole: true, updateRole: true, deleteRole: false, settings: true, help: true },
        },
        },
        {
        id: 3,
        name: "User",
        permissions: {
            umat: { create: false, read: true, update: true, delete: false, bulkCreate: false, readNational: false, readArea: true },
            qiudao: { create: false, read: true, update: false, delete: false, bulkCreate: false, readNational: false, readArea: true },
            dashboard: { readNational: false, readArea: true },
            kegiatan: { create: false, read: true, update: false, delete: false, readNational: true, readArea: true },
            account: { createRole: false, updateRole: false, deleteRole: false, settings: true, help: true },
        },
        },
    ];

    const [roles, setRoles] = useState(initialRoles);
    const [selectedRole, setSelectedRole] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const [roleToDelete, setRoleToDelete] = useState(null);

    const handleEditRole = (role) => {
        setSelectedRole(role);
        onOpen();
    };

    const handleAddRole = () => {
        setSelectedRole({ id: null, name: "", permissions: {} });
        onOpen();
    };

    const handleSaveRole = () => {
        if (!selectedRole.name) return; // Basic validation
        if (selectedRole.id) {
        // Update existing role
        setRoles(roles.map((role) => (role.id === selectedRole.id ? selectedRole : role)));
        } else {
        // Add new role
        setRoles([...roles, { ...selectedRole, id: roles.length + 1 }]);
        }
        onClose();
    };

    const handleDeleteRole = (role) => {
        setRoleToDelete(role);
        onDeleteOpen();
    };

    const confirmDelete = () => {
        setRoles(roles.filter((role) => role.id !== roleToDelete.id));
        onDeleteClose();
    };

    const handleTogglePermission = (feature, action) => {
        setSelectedRole({
        ...selectedRole,
        permissions: {
            ...selectedRole.permissions,
            [feature]: {
            ...selectedRole.permissions[feature],
            [action]: !selectedRole.permissions[feature]?.[action],
            },
        },
        });
    };

    const getPermissionSummary = (permissions) => {
        const summaries = [];
        if (permissions.umat?.create && permissions.umat?.read && permissions.umat?.update && permissions.umat?.delete) {
        summaries.push("Umat: CRUD");
        } else if (permissions.umat?.create || permissions.umat?.read || permissions.umat?.update || permissions.umat?.delete) {
        summaries.push("Umat: Partial");
        }
        if (permissions.qiudao?.create && permissions.qiudao?.read && permissions.qiudao?.update && permissions.qiudao?.delete) {
        summaries.push("QiuDao: CRUD");
        } else if (permissions.qiudao?.create || permissions.qiudao?.read || permissions.qiudao?.update || permissions.qiudao?.delete) {
        summaries.push("QiuDao: Partial");
        }
        if (permissions.dashboard?.readNational || permissions.dashboard?.readArea) {
        summaries.push("Dashboard: Read");
        }
        if (permissions.kegiatan?.create && permissions.kegiatan?.read && permissions.kegiatan?.update && permissions.kegiatan?.delete) {
        summaries.push("Kegiatan: CRUD");
        } else if (permissions.kegiatan?.read) {
        summaries.push("Kegiatan: Read");
        }
        if (permissions.account?.createRole || permissions.account?.updateRole || permissions.account?.deleteRole) {
        summaries.push("Account: Role Mgmt");
        }
        if (permissions.account?.settings) summaries.push("Settings");
        if (permissions.account?.help) summaries.push("Help Center");
        return summaries.join(", ");
    };

    return (
        <Layout title="Manajemen Peran" showCalendar={false}>
        <Box p={4}>
            <Flex justify="space-between" mb={4}>
            <Heading size="md">Daftar Peran</Heading>
            <Button colorScheme="blue" onClick={handleAddRole}>
                Tambah Peran
            </Button>
            </Flex>

            <Table variant="simple">
            <Thead>
                <Tr>
                <Th>Nama Peran</Th>
                <Th>Izin</Th>
                <Th>Aksi</Th>
                </Tr>
            </Thead>
            <Tbody>
                {roles.map((role) => (
                <Tr key={role.id}>
                    <Td>{role.name}</Td>
                    <Td>{getPermissionSummary(role.permissions)}</Td>
                    <Td>
                    <HStack spacing={2}>
                        <Button size="sm" colorScheme="blue" variant="outline" onClick={() => handleEditRole(role)}>
                        Edit
                        </Button>
                        <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleDeleteRole(role)}>
                        Hapus
                        </Button>
                    </HStack>
                    </Td>
                </Tr>
                ))}
            </Tbody>
            </Table>

            {/* Edit/Add Role Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{selectedRole?.id ? "Edit Peran" : "Tambah Peran"}</ModalHeader>
                <ModalBody>
                <VStack spacing={4} align="start">
                    <Text fontWeight="bold">Nama Peran</Text>
                    <input
                    type="text"
                    value={selectedRole?.name || ""}
                    onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                    style={{ padding: "8px", width: "100%", border: "1px solid #E2E8F0", borderRadius: "4px" }}
                    placeholder="Masukkan nama peran"
                    />
                    <Text fontWeight="bold">Izin</Text>
                    <SimpleGrid columns={2} spacing={4} w="100%">
                    {/* Umat Permissions */}
                    <Box>
                        <Text fontWeight="bold" mb={2}>Umat</Text>
                        <VStack align="start">
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.umat?.create}
                            onChange={() => handleTogglePermission("umat", "create")}
                            />
                            <Text>Tambah Umat</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.umat?.bulkCreate}
                            onChange={() => handleTogglePermission("umat", "bulkCreate")}
                            />
                            <Text>Tambah Umat (Bulk)</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.umat?.update}
                            onChange={() => handleTogglePermission("umat", "update")}
                            />
                            <Text>Edit Umat</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.umat?.delete}
                            onChange={() => handleTogglePermission("umat", "delete")}
                            />
                            <Text>Hapus Umat</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.umat?.readNational}
                            onChange={() => handleTogglePermission("umat", "readNational")}
                            />
                            <Text>Lihat Data Nasional</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.umat?.readArea}
                            onChange={() => handleTogglePermission("umat", "readArea")}
                            />
                            <Text>Lihat Data Per Wilayah</Text>
                        </HStack>
                        </VStack>
                    </Box>

                    {/* QiuDao Permissions */}
                    <Box>
                        <Text fontWeight="bold" mb={2}>QiuDao</Text>
                        <VStack align="start">
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.qiudao?.create}
                            onChange={() => handleTogglePermission("qiudao", "create")}
                            />
                            <Text>Tambah QiuDao</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.qiudao?.bulkCreate}
                            onChange={() => handleTogglePermission("qiudao", "bulkCreate")}
                            />
                            <Text>Tambah QiuDao (Bulk)</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.qiudao?.update}
                            onChange={() => handleTogglePermission("qiudao", "update")}
                            />
                            <Text>Edit QiuDao</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.qiudao?.delete}
                            onChange={() => handleTogglePermission("qiudao", "delete")}
                            />
                            <Text>Hapus QiuDao</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.qiudao?.readNational}
                            onChange={() => handleTogglePermission("qiudao", "readNational")}
                            />
                            <Text>Lihat Data Nasional</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.qiudao?.readArea}
                            onChange={() => handleTogglePermission("qiudao", "readArea")}
                            />
                            <Text>Lihat Data Per Wilayah</Text>
                        </HStack>
                        </VStack>
                    </Box>

                    {/* Dashboard Permissions */}
                    <Box>
                        <Text fontWeight="bold" mb={2}>Dashboard</Text>
                        <VStack align="start">
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.dashboard?.readNational}
                            onChange={() => handleTogglePermission("dashboard", "readNational")}
                            />
                            <Text>Lihat Data Nasional</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.dashboard?.readArea}
                            onChange={() => handleTogglePermission("dashboard", "readArea")}
                            />
                            <Text>Lihat Data Per Wilayah</Text>
                        </HStack>
                        </VStack>
                    </Box>

                    {/* Kegiatan Permissions */}
                    <Box>
                        <Text fontWeight="bold" mb={2}>Kegiatan</Text>
                        <VStack align="start">
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.kegiatan?.create}
                            onChange={() => handleTogglePermission("kegiatan", "create")}
                            />
                            <Text>Tambah Kegiatan</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.kegiatan?.update}
                            onChange={() => handleTogglePermission("kegiatan", "update")}
                            />
                            <Text>Edit Kegiatan</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.kegiatan?.delete}
                            onChange={() => handleTogglePermission("kegiatan", "delete")}
                            />
                            <Text>Hapus Kegiatan</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.kegiatan?.readNational}
                            onChange={() => handleTogglePermission("kegiatan", "readNational")}
                            />
                            <Text>Lihat Data Nasional</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.kegiatan?.readArea}
                            onChange={() => handleTogglePermission("kegiatan", "readArea")}
                            />
                            <Text>Lihat Data Per Wilayah</Text>
                        </HStack>
                        </VStack>
                    </Box>

                    {/* Account Management Permissions */}
                    <Box>
                        <Text fontWeight="bold" mb={2}>Manajemen Akun</Text>
                        <VStack align="start">
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.account?.createRole}
                            onChange={() => handleTogglePermission("account", "createRole")}
                            />
                            <Text>Tambah Peran</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.account?.updateRole}
                            onChange={() => handleTogglePermission("account", "updateRole")}
                            />
                            <Text>Edit Peran</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.account?.deleteRole}
                            onChange={() => handleTogglePermission("account", "deleteRole")}
                            />
                            <Text>Hapus Peran</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.account?.settings}
                            onChange={() => handleTogglePermission("account", "settings")}
                            />
                            <Text>Pengaturan</Text>
                        </HStack>
                        <HStack>
                            <Switch
                            isChecked={selectedRole?.permissions.account?.help}
                            onChange={() => handleTogglePermission("account", "help")}
                            />
                            <Text>Pusat Bantuan</Text>
                        </HStack>
                        </VStack>
                    </Box>
                    </SimpleGrid>
                </VStack>
                </ModalBody>
                <ModalFooter>
                <Button variant="ghost" onClick={onClose} mr={2}>
                    Batal
                </Button>
                <Button colorScheme="blue" onClick={handleSaveRole}>
                    Simpan
                </Button>
                </ModalFooter>
            </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Hapus Peran</ModalHeader>
                <ModalBody>
                <Text>Apakah Anda yakin ingin menghapus peran {roleToDelete?.name}?</Text>
                </ModalBody>
                <ModalFooter>
                <Flex w="100%" justify="space-between">
                    <Button flex="1" variant="ghost" onClick={onDeleteClose} mr={2}>
                    Tidak
                    </Button>
                    <Button flex="1" colorScheme="red" onClick={confirmDelete}>
                    Ya
                    </Button>
                </Flex>
                </ModalFooter>
            </ModalContent>
            </Modal>
        </Box>
        </Layout>
    );
};

export default RolePage;