import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Switch,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  HStack,
  VStack,
  Input,
  Select,
  useToast,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import Layout from "@/components/layout";
import { useRoleManagement } from "@/features/role/useRoleManagement";

const areaOptions = ["nasional", "wilayah", "fotang", "self"];
const permissionOptions = [
  { mod: "umat", action: "create", label: "Tambah Umat" },
  { mod: "umat", action: "read", label: "Lihat Daftar Umat" },
  { mod: "umat", action: "update", label: "Edit Umat" },
  { mod: "umat", action: "delete", label: "Hapus Umat" },
  { mod: "qiudao", action: "create", label: "Tambah Qiudao" },
  { mod: "qiudao", action: "read", label: "Lihat Daftar Qiudao" },
  { mod: "qiudao", action: "update", label: "Edit Qiudao" },
  { mod: "qiudao", action: "delete", label: "Hapus Qiudao" },
];

const validModules = ["umat", "qiudao"];

const RolePage = () => {
  const {
    roles,
    rolesLoading,
    allUsers,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    removeRole,
    tokenData,
    permissionsToArray,
    refetchRoles,
    refetchUsers,
  } = useRoleManagement();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();

  const [selectedRole, setSelectedRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const getAvailableUsersForRole = (roleId) => {
    if (!allUsers.length || !roles.length) return [];
    const role = roles.find((r) => r.role_id === roleId);
    if (!role) return allUsers;
    const currentUserIds = role.userRoles?.map((ur) => ur.user?.user_info_id || ur.user_id) || [];
    return allUsers.filter((user) => !currentUserIds.includes(user.user_info_id));
  };

  const handleAddRole = () => {
    setSelectedRole({
      name: "",
      description: "",
      permissions: [],
      scopes: {
        umat: "nasional",
        qiudao: "nasional",
      },
    });
    onOpen();
  };

  const handleEditRole = (role) => {
    const scopes = {};
    Object.keys(role.permissions || {}).forEach((mod) => {
      scopes[mod] = role.permissions[mod]?.scope || "nasional";
    });

    setSelectedRole({
      id: role.role_id,
      name: role.name,
      description: role.description || "",
      permissions: permissionsToArray(role.permissions),
      scopes,
    });
    onOpen();
  };

  const handleSaveRole = async () => {
    if (!selectedRole?.name.trim()) {
      toast({ title: "Error", description: "Nama peran wajib diisi", status: "error", isClosable: true });
      return;
    }

    if (!selectedRole.permissions.length) {
      toast({ title: "Error", description: "Setidaknya satu izin harus dipilih", status: "error", isClosable: true });
      return;
    }

    setIsSaving(true);
    try {
      const permissions = {};

      validModules.forEach((mod) => {
        permissions[mod] = {
          create: false,
          read: false,
          update: false,
          delete: false,
          scope: selectedRole.scopes[mod] || "nasional",
        };
      });

      for (const perm of selectedRole.permissions) {
        const [mod, action] = perm.split("_");
        if (validModules.includes(mod) && permissions[mod]) {
          permissions[mod][action] = true;
        }
      }

      const roleData = {
        name: selectedRole.name.trim(),
        description: selectedRole.description?.trim() || "",
        permissions,
      };

      if (selectedRole.id) {
        await updateRole({ id: selectedRole.id, input: roleData });
        toast({ title: "Berhasil", description: "Peran diperbarui", status: "success", isClosable: true });
      } else {
        await createRole(roleData);
        toast({ title: "Berhasil", description: "Peran dibuat", status: "success", isClosable: true });
      }

      await refetchRoles();
      onClose();
    } catch (error) {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Terjadi kesalahan",
        status: "error",
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = (role) => {
    setRoleToDelete(role);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (roleToDelete) {
      try {
        await deleteRole(roleToDelete.role_id);
        toast({ title: "Berhasil", description: "Peran dihapus", status: "success", isClosable: true });
        await refetchRoles();
        onDeleteClose();
      } catch (error) {
        toast({
          title: "Gagal",
          description: error.response?.data?.message || "Terjadi kesalahan",
          status: "error",
          isClosable: true,
        });
      }
    }
  };

  const handleAssignRole = (role) => {
    setSelectedRole({ id: role.role_id, name: role.name });
    setSelectedUserIds([]);
    onAssignOpen();
  };

  const handleSubmitAssign = async () => {
    if (!selectedRole?.id || selectedUserIds.length === 0) return;

    setIsSaving(true);
    try {
      for (const user_id of selectedUserIds) {
        const userCurrentRoles = roles
          .flatMap((r) => r.userRoles?.filter((ur) => (ur.user?.user_info_id || ur.user_id) === user_id) || [])
          .map((ur) => ur.role_id);

        for (const oldRoleId of userCurrentRoles) {
          if (oldRoleId !== selectedRole.id) {
            await removeRole({ user_id, role_id: oldRoleId });
          }
        }
        await assignRole({ user_id, role_id: selectedRole.id });
      }

      toast({
        title: "Berhasil",
        description: `${selectedUserIds.length} pengguna diganti ke role "${selectedRole.name}"`,
        status: "success",
        isClosable: true,
      });
      await refetchUsers();
      onAssignClose();
    } catch (error) {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Gagal assign role",
        status: "error",
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePermission = (perm) => {
    setSelectedRole((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleScopeChange = (mod, scope) => {
    setSelectedRole((prev) => ({
      ...prev,
      scopes: { ...prev.scopes, [mod]: scope },
    }));
  };

  const getPermissionSummary = (permissions) => {
    const lines = [];
    validModules.forEach((mod) => {
      const p = permissions?.[mod];
      if (p) {
        const actions = Object.keys(p).filter((k) => k !== "scope" && p[k]).length;
        if (actions > 0) {
          lines.push(`${mod}: ${actions} izin (${p.scope})`);
        }
      }
    });
    return lines.length ? lines.join(" | ") : "Tidak ada izin";
  };

  const getUserNames = (userRoles) => {
    if (!userRoles?.length) return "Tidak ada";
    return userRoles
      .map((ur) => ur.user?.full_name || ur.user?.username || `User ${ur.user_id}`)
      .slice(0, 3)
      .join(", ") + (userRoles.length > 3 ? "..." : "");
  };

  const availableUsersForAssign = getAvailableUsersForRole(selectedRole?.id || "");

  return (
    <Layout title="Manajemen Peran" showCalendar={false}>
      <Box p={4}>
        <Flex justify="space-between" mb={4}>
          <Heading size="md">Daftar Peran</Heading>
          <Button colorScheme="blue" onClick={handleAddRole} isLoading={isSaving}>
            Tambah Peran
          </Button>
        </Flex>

        {rolesLoading ? (
          <Text>Memuat peran...</Text>
        ) : (
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th textAlign="center">Nama Peran</Th>
                <Th textAlign="center">Deskripsi</Th>
                <Th textAlign="center">Izin</Th>
                <Th textAlign="center">Pengguna</Th>
                <Th textAlign="center">Aksi</Th>
              </Tr>
            </Thead>
            <Tbody>
              {roles.map((role) => {
                const availableCount = getAvailableUsersForRole(role.role_id).length;
                return (
                  <Tr key={role.role_id}>
                    <Td fontWeight="bold">{role.name}</Td>
                    <Td>{role.description || "-"}</Td>
                    <Td fontSize="sm">{getPermissionSummary(role.permissions)}</Td>
                    <Td>{getUserNames(role.userRoles)}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size="sm" onClick={() => handleEditRole(role)}>Edit</Button>
                        <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleDeleteRole(role)}>
                          Hapus
                        </Button>
                        <Button size="sm" colorScheme="green" variant="outline" onClick={() => handleAssignRole(role)}>
                          Assign ({availableCount})
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedRole?.id ? "Edit" : "Tambah"} Peran</ModalHeader>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Nama Peran</FormLabel>
                  <Input
                    value={selectedRole?.name || ""}
                    onChange={(e) => setSelectedRole((p) => ({ ...p, name: e.target.value }))}
                    placeholder="contoh: Admin Vihara"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Deskripsi</FormLabel>
                  <Input
                    value={selectedRole?.description || ""}
                    onChange={(e) => setSelectedRole((p) => ({ ...p, description: e.target.value }))}
                  />
                </FormControl>

                <Text fontWeight="bold">Izin per Modul</Text>

                {validModules.map((mod) => (
                  <Box key={mod} p={4} borderWidth="1px" borderRadius="md" w="100%">
                    <Text fontWeight="bold" textTransform="capitalize" mb={2}>{mod}</Text>
                    <SimpleGrid columns={2} spacing={4}>
                      <FormControl>
                        <FormLabel>Scope</FormLabel>
                        <Select
                          value={selectedRole?.scopes?.[mod] || "nasional"}
                          onChange={(e) => handleScopeChange(mod, e.target.value)}
                        >
                          {areaOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt === "nasional" 
                                ? "Nasional" 
                                : opt === "wilayah" 
                                  ? "Wilayah" 
                                  : opt === "fotang" 
                                    ? "Vihara" 
                                    : "Hanya Diri Sendiri (Self)"}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <VStack align="start" spacing={2}>
                        {permissionOptions
                          .filter((p) => p.mod === mod)
                          .map(({ action, label }) => (
                            <HStack key={`${mod}_${action}`}>
                              <Switch
                                isChecked={selectedRole?.permissions?.includes(`${mod}_${action}`) || false}
                                onChange={() => handleTogglePermission(`${mod}_${action}`)}
                              />
                              <Text>{label}</Text>
                            </HStack>
                          ))}
                      </VStack>
                    </SimpleGrid>
                  </Box>
                ))}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose} mr={3}>Batal</Button>
              <Button colorScheme="blue" onClick={handleSaveRole} isLoading={isSaving}>
                Simpan
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Hapus Peran</ModalHeader>
            <ModalBody>
              <Text>Apakah Anda yakin ingin menghapus peran {roleToDelete?.name}?</Text>
            </ModalBody>
            <ModalFooter>
              <Flex w="100%" justify="space-between">
                <Button flex="1" variant="ghost" onClick={onDeleteClose} mr={2} isDisabled={isSaving}>
                  Tidak
                </Button>
                <Button flex="1" colorScheme="red" onClick={confirmDelete} isLoading={isSaving}>
                  Ya
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Ganti Role ke {selectedRole?.name}</ModalHeader>
            <ModalBody>
              <Text mb={3} color="gray.600">
                Pilih pengguna yang role-nya akan <strong>diganti</strong> ke {selectedRole?.name}
              </Text>
              {availableUsersForAssign.length === 0 ? (
                <Text color="gray.500">Tidak ada pengguna yang tersedia</Text>
              ) : (
                <Select
                  multiple
                  value={selectedUserIds.map(String)}
                  onChange={(e) =>
                    setSelectedUserIds(Array.from(e.target.selectedOptions, (option) => Number(option.value)))
                  }
                  height="200px"
                >
                  {availableUsersForAssign.map((user) => (
                    <option key={user.user_info_id} value={user.user_info_id}>
                      {user.username} - {user.full_name} (ID: {user.user_info_id})
                    </option>
                  ))}
                </Select>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onAssignClose} mr={2} isDisabled={isSaving}>
                Batal
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmitAssign}
                isDisabled={selectedUserIds.length === 0 || isSaving}
                isLoading={isSaving}
              >
                Assign Role ({selectedUserIds.length})
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
};

export default RolePage;