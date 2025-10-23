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

  { mod: "event", action: "create", label: "Tambah Event" },
  { mod: "event", action: "read", label: "Lihat Daftar Event" },
  { mod: "event", action: "update", label: "Edit Event" },
  { mod: "event", action: "delete", label: "Hapus Event" },
];

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
    refetchUsers,
  } = useRoleManagement();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const toast = useToast();

  const getAvailableUsersForRole = (roleId) => {
    if (!allUsers.length || !roles.length) return [];
    
    const role = roles.find(r => r.role_id === roleId);
    if (!role) return allUsers;
    
    const currentUserIds = role.userRoles?.map(ur => 
      ur.user?.user_info_id || ur.user_id
    ) || [];
    
    return allUsers.filter(user => 
      !currentUserIds.includes(user.user_info_id)
    );
  };

  const handleAddRole = () => {
    setSelectedRole({
      name: "",
      description: "",
      permissions: [],
      scopes: {
        umat: tokenData.role === "Super Admin" ? "nasional" : tokenData.area || "nasional",
        qiudao: tokenData.role === "Super Admin" ? "nasional" : tokenData.area || "nasional",
        event: tokenData.role === "Super Admin" ? "nasional" : tokenData.area || "nasional",
        account: tokenData.role === "Super Admin" ? "nasional" : tokenData.area || "nasional",
      },
    });
    onOpen();
  };

  const handleEditRole = (role) => {
    setSelectedRole({
      id: role.role_id,
      name: role.name,
      description: role.description,
      permissions: permissionsToArray(role.permissions),
      scopes: Object.fromEntries(
        Object.entries(role.permissions || {}).map(([mod, perms]) => [
          mod, 
          (perms && typeof perms === 'object' ? perms.scope : 'nasional') || 
          (tokenData.role === "Super Admin" ? "nasional" : tokenData.area || "nasional")
        ])
      ),
    });
    onOpen();
  };

  const handleSaveRole = () => {
    if (!selectedRole?.name.trim()) {
      alert("Nama peran wajib diisi");
      return;
    }
    const permissions = arrayToPermissions(
      selectedRole.permissions,
      tokenData.role === "Super Admin" ? "nasional" : tokenData.area || "nasional"
    );
    for (const mod of Object.keys(permissions)) {
      permissions[mod].scope = selectedRole.scopes?.[mod] || 
        (tokenData.role === "Super Admin" ? "nasional" : tokenData.area || "nasional");
    }
    const roleData = {
      name: selectedRole.name,
      description: selectedRole.description,
      permissions,
    };
    if (selectedRole.id) {
      updateRole({ id: selectedRole.id, input: roleData });
    } else {
      createRole(roleData);
    }
    onClose();
  };

  const handleDeleteRole = (role) => {
    setRoleToDelete(role);
    onDeleteOpen();
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteRole(roleToDelete.role_id);
      onDeleteClose();
    }
  };

  const handleAssignRole = (role) => {
    setSelectedRole({ 
      id: role.role_id, 
      name: role.name 
    });
    setSelectedUserIds([]);
    onAssignOpen();
  };

  const handleSubmitAssign = async () => {
    if (selectedRole?.id && selectedUserIds.length > 0) {
      for (const user_id of selectedUserIds) {
        try {
          const userCurrentRoles = roles
            .flatMap(r => r.userRoles?.filter(ur => (ur.user?.user_info_id || ur.user_id) === user_id) || [])
            .map(ur => ur.role_id);
          
          if (userCurrentRoles.length > 0) {
            for (const oldRoleId of userCurrentRoles) {
              if (oldRoleId !== selectedRole.id) {
                await removeRole({ user_id, role_id: oldRoleId });
              }
            }
          }
          
          await assignRole({ user_id, role_id: selectedRole.id });
          
        } catch (error) {
          console.error(`❌ Error replacing role for user ${user_id}:`, error);
        }
      }
      
      toast({
        title: "Berhasil!",
        description: `${selectedUserIds.length} pengguna berhasil diganti rolenya ke "${selectedRole.name}"`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      onAssignClose();
      refetchUsers(); 
    }
  };

  const handleTogglePermission = (perm) => {
    setSelectedRole((prev) => {
      if (!prev) return prev;
      const newPermissions = prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleScopeChange = (mod, scope) => {
    setSelectedRole((prev) => {
      if (!prev) return prev;
      return { 
        ...prev, 
        scopes: { 
          ...prev.scopes, 
          [mod]: scope 
        } 
      };
    });
  };

  const getPermissionSummary = (permissions) => {
    const modules = ["umat", "qiudao", "event", "account"];
    const totalActions = {
      umat: 4,
      qiudao: 4,
      event: 4,
      account: 3
    };
    
    const lines = [];
    let hasPermissions = false;
    
    modules.forEach((mod) => {
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
    
    const scope = modules.map(mod => permissions?.[mod]?.scope).filter(Boolean)[0];
    if (scope) {
      lines.push(`Scope: ${scope}`);
    }
    
    return lines.join("\n");
  };

  const areaOptions = tokenData.role === "Super Admin"
    ? ["nasional", "Korwil_1", "Korwil_2", "Korwil_3", "Korwil_4", "Korwil_5", "Korwil_6", "wilayah"]
    : [tokenData.area || "nasional"];

  const getUserNames = (userRoles) => {
    if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
      return "None";
    }
    return userRoles
      .map((ur) => {
        return ur.user?.userCredential?.username ||
          ur.user?.username ||
          ur.user?.full_name ||
          ur.username ||
          `User ${ur.user_id}`;
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
          <Button colorScheme="blue" onClick={handleAddRole}>
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
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          colorScheme="red" 
                          variant="outline" 
                          onClick={() => handleDeleteRole(role)}
                        >
                          Hapus
                        </Button>
                        <Button 
                          size="sm" 
                          colorScheme="green" 
                          variant="outline" 
                          onClick={() => handleAssignRole(role)}
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

        {/* Add/Edit Role Modal */}
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
                  {["umat", "qiudao", "event", "account"].map((mod) => (
                    <Box key={mod}>
                      <Text fontWeight="bold" mb={2} textTransform="capitalize">
                        {mod}
                      </Text>
                      <VStack align="start">
                        <Text>Scope</Text>
                        <Select
                          value={selectedRole?.scopes?.[mod] || 
                            (tokenData.role === "Super Admin" ? "nasional" : tokenData.area || "nasional")}
                          onChange={(e) => handleScopeChange(mod, e.target.value)}
                          disabled={tokenData.role !== "Super Admin" && tokenData.area}
                        >
                          {areaOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt === "nasional" ? "Nasional" : opt}
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

        {/* Assign Role Modal */}
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
              <Button variant="ghost" onClick={onAssignClose} mr={2}>
                Batal
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleSubmitAssign} 
                isDisabled={selectedUserIds.length === 0}
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