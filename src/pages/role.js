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
} from "@chakra-ui/react";
import Layout from "@/components/layout";
import { useRoleManagement } from "@/features/role/useRoleManagement";

const permissionOptions = [
  { mod: "umat", action: "create", label: "Tambah Umat" },
  { mod: "umat", action: "read", label: "Lihat Daftar Umat" },
  { mod: "umat", action: "update", label: "Edit Umat" },
  { mod: "umat", action: "delete", label: "Hapus Umat" },
  { mod: "qiudao", action: "create", label: "Tambah Qiudao" },
  { mod: "qiudao", action: "read", label: "Lihat Daftar Qiudao" },
  { mod: "qiudao", action: "update", label: "Edit Qiudao" },
  { mod: "qiudao", action: "delete", label: "Hapus Qiudao" },
  { mod: "account", action: "create_role", label: "Buat Peran" },
  { mod: "account", action: "edit_role", label: "Edit Peran" },
  { mod: "account", action: "delete_role", label: "Hapus Peran" },
  { mod: "kegiatan", action: "create", label: "Tambah Kegiatan" },
  { mod: "kegiatan", action: "read", label: "Lihat Daftar Kegiatan" },
  { mod: "kegiatan", action: "update", label: "Edit Kegiatan" },
  { mod: "kegiatan", action: "delete", label: "Hapus Kegiatan" },
];

const areaOptions = ["nasional", "wilayah"];

const RolePage = () => {
  const {
    roles,
    rolesLoading,
    allUsers,
    allUsersLoading,
    allUsersError,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    removeRole,
    tokenData,
    permissionsToArray,
    arrayToPermissions,
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

  const validModules = ["umat", "qiudao", "kegiatan", "account"]; // FIXED: Hapus "event"

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
        umat: tokenData.role === "Super_Admin" ? "nasional" : "wilayah",
        qiudao: tokenData.role === "Super_Admin" ? "nasional" : "wilayah",
        kegiatan: tokenData.role === "Super_Admin" ? "nasional" : "wilayah",
        account: tokenData.role === "Super_Admin" ? "nasional" : "wilayah",
      },
    });
    onOpen();
  };

  const handleEditRole = (role) => {
    console.log("✅ [role.js] EDIT ROLE INPUT:", JSON.stringify(role, null, 2));
    setSelectedRole({
      id: role.role_id,
      name: role.name,
      description: role.description,
      permissions: permissionsToArray(role.permissions),
      scopes: Object.fromEntries(
        Object.entries(role.permissions || {}).map(([mod, perms]) => [
          mod,
          perms?.scope && perms.scope !== "nasional" ? "wilayah" : "nasional",
        ])
      ),
    });
    onOpen();
  };

  const handleSaveRole = async () => {
    if (!selectedRole?.name.trim()) {
      toast({
        title: "Error",
        description: "Nama peran wajib diisi",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!selectedRole.permissions.length) {
      toast({
        title: "Error",
        description: "Setidaknya satu izin harus dipilih",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log("✅ [role.js] TOKEN DATA:", JSON.stringify(tokenData, null, 2));
      console.log("✅ [role.js] SELECTED ROLE BEFORE BUILD:", JSON.stringify(selectedRole, null, 2));

      const permissions = {};
      for (const perm of selectedRole.permissions) {
        const [mod, action] = perm.split("_");
        if (validModules.includes(mod)) {
          if (!permissions[mod]) {
            permissions[mod] = {
              scope: selectedRole.scopes[mod] || "nasional",
            };
          }
          permissions[mod][action] = true;
        } else {
          console.warn(`✅ [role.js] SKIPPING INVALID MODULE: ${mod}`);
        }
      }

      // Tambah modul yang ada di scopes tapi tidak ada permissions-nya
      for (const mod of Object.keys(selectedRole.scopes)) {
        if (validModules.includes(mod) && !permissions[mod] && selectedRole.permissions.some((p) => p.startsWith(mod))) {
          permissions[mod] = {
            scope: selectedRole.scopes[mod] || "nasional",
          };
        }
      }

      const roleData = {
        name: selectedRole.name,
        description: selectedRole.description || "",
        permissions,
      };

      console.log("✅ [role.js] SENDING ROLE DATA:", JSON.stringify(roleData, null, 2));

      if (selectedRole.id) {
        const response = await updateRole({ id: selectedRole.id, input: roleData });
        console.log("✅ [role.js] UPDATE ROLE RESPONSE:", JSON.stringify(response, null, 2));
        toast({
          title: "Berhasil",
          description: `Peran "${selectedRole.name}" berhasil diperbarui`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        const response = await createRole(roleData);
        console.log("✅ [role.js] CREATE ROLE RESPONSE:", JSON.stringify(response, null, 2));
        toast({
          title: "Berhasil",
          description: `Peran "${selectedRole.name}" berhasil dibuat`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      await refetchRoles();
      onClose();
    } catch (error) {
      console.error("❌ [role.js] ERROR SAVE ROLE:", JSON.stringify(error.response?.data || error.message, null, 2));
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Gagal menyimpan peran",
        status: "error",
        duration: 5000,
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
        toast({
          title: "Berhasil",
          description: `Peran "${roleToDelete.name}" berhasil dihapus`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        await refetchRoles();
        onDeleteClose();
      } catch (error) {
        console.error("❌ [role.js] ERROR DELETE ROLE:", JSON.stringify(error.response?.data || error.message, null, 2));
        toast({
          title: "Error",
          description: error.response?.data?.message || error.message || "Gagal menghapus peran",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleAssignRole = (role) => {
    setSelectedRole({
      id: role.role_id,
      name: role.name,
    });
    setSelectedUserIds([]);
    onAssignOpen();
  };

  const handleSubmitAssign = async () => {
    if (selectedRole?.id && selectedUserIds.length > 0) {
      setIsSaving(true);
      try {
        for (const user_id of selectedUserIds) {
          try {
            const userCurrentRoles = roles
              .flatMap((r) => r.userRoles?.filter((ur) => (ur.user?.user_info_id || ur.user_id) === user_id) || [])
              .map((ur) => ur.role_id);

            if (userCurrentRoles.length > 0) {
              for (const oldRoleId of userCurrentRoles) {
                if (oldRoleId !== selectedRole.id) {
                  await removeRole({ user_id, role_id: oldRoleId });
                }
              }
            }

            const response = await assignRole({ user_id, role_id: selectedRole.id });
            console.log(`✅ [role.js] ASSIGN ROLE RESPONSE for user ${user_id}:`, JSON.stringify(response, null, 2));
          } catch (userError) {
            console.error(`❌ [role.js] Error for user ${user_id}:`, JSON.stringify(userError.response?.data || userError.message, null, 2));
          }
        }

        toast({
          title: "Berhasil",
          description: `${selectedUserIds.length} pengguna berhasil diganti rolenya ke "${selectedRole.name}"`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        await refetchUsers();
        onAssignClose();
      } catch (error) {
        console.error("❌ [role.js] ERROR ASSIGN ROLE:", JSON.stringify(error.response?.data || error.message, null, 2));
        toast({
          title: "Error",
          description: error.response?.data?.message || error.message || "Gagal mengassign peran",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleTogglePermission = (perm) => {
    setSelectedRole((prev) => {
      if (!prev) return prev;
      console.log("✅ [role.js] TOGGLING PERMISSION:", perm);
      const newPermissions = prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleScopeChange = (mod, scope) => {
    setSelectedRole((prev) => {
      if (!prev) return prev;
      console.log(`✅ [role.js] CHANGING SCOPE for ${mod}: ${scope}`);
      return {
        ...prev,
        scopes: {
          ...prev.scopes,
          [mod]: scope,
        },
      };
    });
  };

  const getPermissionSummary = (permissions) => {
    const mods = ["umat", "qiudao", "kegiatan", "account"]; // FIXED: Hapus "event"
    const totalActions = {
      umat: 4,
      qiudao: 4,
      kegiatan: 4,
      account: 3,
    };

    const lines = [];
    let hasPermissions = false;

    mods.forEach((mod) => {
      const perms = permissions?.[mod];
      if (perms) {
        const actions = Object.keys(perms).filter((key) => key !== "scope" && perms[key]);
        const actionCount = actions.length;

        if (actionCount > 0) {
          hasPermissions = true;
          let statusText = "";
          if (actionCount === totalActions[mod]) statusText = "Full features";
          else if (actionCount >= 3) statusText = "Most features";
          else if (actionCount === 2) statusText = "Partial";
          else if (actionCount === 1 && actions.includes("read")) statusText = "Read-only";
          else statusText = "Limited";
          lines.push(`${mod.charAt(0).toUpperCase() + mod.slice(1)}: ${statusText}`);
        }
      }
    });

    if (!hasPermissions) {
      return "No permissions";
    }

    const scope = mods
      .map((mod) => permissions?.[mod]?.scope)
      .filter(Boolean)[0];
    if (scope) {
      lines.push(`Scope: ${scope}`);
    }

    return lines.join("\n");
  };

  const getUserNames = (userRoles) => {
    if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
      return "None";
    }
    return userRoles
      .map((ur) => {
        return (
          ur.user?.userCredential?.username ||
          ur.user?.username ||
          ur.user?.full_name ||
          ur.username ||
          `User ${ur.user_id}`
        );
      })
      .filter(Boolean)
      .join(", ");
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
          <Text>Loading roles...</Text>
        ) : roles.length === 0 ? (
          <Text>Tidak ada peran</Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nama Peran</Th>
                <Th>Deskripsi</Th>
                <Th>Izin</Th>
                <Th>Pengguna</Th>
                <Th>Aksi</Th>
              </Tr>
            </Thead>
            <Tbody>
              {roles.map((role) => {
                const availableUsers = getAvailableUsersForRole(role.role_id);
                const availableCount = availableUsers.length;
                return (
                  <Tr key={role.role_id}>
                    <Td>{role.name}</Td>
                    <Td>{role.description || "None"}</Td>
                    <Td style={{ whiteSpace: "pre-line" }}>
                      {getPermissionSummary(role.permissions)}
                    </Td>
                    <Td>{getUserNames(role.userRoles)}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => handleEditRole(role)}
                          isLoading={isSaving}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDeleteRole(role)}
                          isLoading={isSaving}
                        >
                          Hapus
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="green"
                          variant="outline"
                          onClick={() => handleAssignRole(role)}
                          isLoading={isSaving}
                        >
                          Assign role ({availableCount})
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
            <ModalHeader>{selectedRole?.id ? "Edit Peran" : "Tambah Peran"}</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="start">
                <Text fontWeight="bold">Nama Peran</Text>
                <Input
                  value={selectedRole?.name || ""}
                  onChange={(e) => setSelectedRole((prev) => prev && { ...prev, name: e.target.value })}
                  placeholder="Masukkan nama peran"
                  isRequired
                />
                <Text fontWeight="bold">Deskripsi</Text>
                <Input
                  value={selectedRole?.description || ""}
                  onChange={(e) => setSelectedRole((prev) => prev && { ...prev, description: e.target.value })}
                  placeholder="Masukkan deskripsi peran"
                />
                <Text fontWeight="bold">Izin</Text>
                <SimpleGrid columns={2} spacing={4} w="100%">
                  {validModules.map((mod) => (
                    <Box key={mod}>
                      <Text fontWeight="bold" mb={2} textTransform="capitalize">
                        {mod}
                      </Text>
                      <VStack align="start">
                        <Text>Scope</Text>
                        <Select
                          value={selectedRole?.scopes?.[mod] || "nasional"}
                          onChange={(e) => handleScopeChange(mod, e.target.value)}
                          disabled={tokenData.role !== "Super_Admin" && tokenData.area}
                        >
                          {areaOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt === "nasional" ? "Nasional" : "Wilayah"}
                            </option>
                          ))}
                        </Select>
                        {permissionOptions
                          .filter((opt) => opt.mod === mod)
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
                    </Box>
                  ))}
                </SimpleGrid>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose} mr={2} isDisabled={isSaving}>
                Batal
              </Button>
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