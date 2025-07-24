import { 
  Box, Button, Center, 
  Divider, Flex, Heading, 
  HStack, Spinner, Text, 
  Menu, MenuButton, MenuList, 
  MenuItem, IconButton, 
  useToast} from "@chakra-ui/react";
import { FiDownload, FiSettings, FiUpload } from "react-icons/fi";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { logout } from "@/lib/auth/logout";
import { isAuthenticated } from "@/lib/auth/checkAuth";
import { useEffect, useRef, useState } from "react";

export default function Layout({ children, title, onImportSuccess }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const toast = useToast();
  const fileInputRef = useRef();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username);
      } catch (e) {
        console.error("Gagal parsing user:", e);
      }
    }
  }, []);

  useEffect(() => {
    const checkAuthStatus = () => {
      const isLoginPage = router.pathname === "/login";
      const isAuth = isAuthenticated();

      if (!isAuth && !isLoginPage) {
        router.replace("/login");
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  const navItems = [
    { label: "Umat", href: "/umat" , iconSrc:"/user_icon.svg"},
    { label: "QiuDao", href: "/qiudao", iconSrc: "/qiudao_icon.svg" },
  ];

  const handleLogout = () => logout();

  const handleExportQiudao = async () => {
    try {
      const response = await fetch("http://localhost:2025/export/qiudao", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Gagal mengekspor data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = "qiudao_data.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Terjadi kesalahan saat mengekspor data");
    }
  };

  const handleExportUmat = async () => {
    try {
      const response = await fetch("http://localhost:2025/export/umat", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Gagal mengekspor data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "umat_data.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Terjadi kesalahan saat mengekspor data");
    }
  };

  const handleImportQiudao = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:2025/import/qiudao", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengimpor");
      }

      toast({
        title: "Berhasil mengimpor data Qiudao",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onImportSuccess?.();
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

  const handleFileChangeUmat = async (e) => {
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
        title: "Berhasil mengimpor data Umat",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onImportSuccess?.();
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
    <Flex minH="100vh" maxW="100vw" overflow="hidden">
      <Box width="240px" p={6}borderRight="4px solid #e2e8f0">
        <Box mb={6}>
        <Image
          src="/Onemapan_ss.svg"
          alt="Logo"
          width={200}
          height={180}
          style={{ objectFit: "contain" }}
        />
      </Box>
        <Flex direction="column" gap={3}>
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Box
                key={item.href}
                as={NextLink}
                href={item.href}
                px={4}
                py={2}
                borderRadius="full"
                bg={isActive ? "blue.100" : "transparent"}
                color={isActive ? "blue.600" : "blue.500"}
                fontWeight={isActive ? "bold" : "normal"}
                _hover={isActive ? {} : { bg: "gray.100" }}
              >
                <HStack spacing={2}>
                  <Image 
                    src={item.iconSrc} 
                    alt={item.label} 
                    width={24}
                    height={24}
                    style={{ minWidth: 24, minHeight: 24 }}
                  />
                  <Text>{item.label}</Text>
                </HStack>
              </Box>
            );
          })}
        </Flex>
      </Box>

      {/* Content */}
      <Box flex="1" p={4} overflowX="auto" maxW="100vw">
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="lg" ml={2}>{title}</Heading>

          <Flex gap={2} align="center">
            {router.pathname === "/qiudao" && (
              <Button
                size="sm"
                colorScheme="teal"
                variant="outline"
                borderRadius="full"
                leftIcon={<FiDownload />}
                onClick={handleExportQiudao}
              >
                Export data qiudao
              </Button>
            )}

            {router.pathname === "/umat" && (
              <Button
                size="sm"
                colorScheme="teal"
                variant="outline"
                borderRadius="full"
                leftIcon={<FiDownload />}
                onClick={handleExportUmat}
              >
                Export data umat
              </Button>
            )}

            {router.pathname === "/umat" && (
              <>
                <input
                  type="file"
                  accept=".xlsx"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChangeUmat}
                />
                <Button
                  size="sm"
                  colorScheme="teal"
                  variant="outline"
                  borderRadius="full"
                  leftIcon={<FiUpload />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import data umat
                </Button>
              </>
            )}

            {router.pathname === "/qiudao" && (
              <>
                <input
                  type="file"
                  accept=".xlsx"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <Button
                  size="sm"
                  colorScheme="teal"
                  variant="outline"
                  borderRadius="full"
                  leftIcon={<FiUpload />}
                  onClick={handleImportQiudao}
                >
                  Import data qiudao
                </Button>
              </>
            )}

            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiSettings />}
                variant="ghost"
                aria-label="Settings"
              />
              <MenuList>
                {username && (
                  <Text px={3} py={2} fontWeight="bold">
                    Halo, {username}
                  </Text>
                )}
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>

        <Divider mb={4} />

        {children}
      </Box>
    </Flex>
  );
}
