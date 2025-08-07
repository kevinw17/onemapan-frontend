import { 
  Box, Center, 
  Divider, Flex, Heading, 
  HStack, Spinner, Text, 
  Menu, MenuButton, MenuList, 
  MenuItem, IconButton, 
} from "@chakra-ui/react";
import { FiArrowLeft, FiChevronRight, FiSettings } from "react-icons/fi";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { logout } from "@/lib/auth/logout";
import { isAuthenticated } from "@/lib/auth/checkAuth";
import { useEffect, useState } from "react";

export default function Layout({ children, title }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
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
    { label: "Umat", href: "/umat", iconSrc: "/user_icon.svg" },
    { label: "QiuDao", href: "/qiudao", iconSrc: "/qiudao_icon.svg" },
  ];

  const handleLogout = () => logout();

  const showBackButton = ["/umat/addUmat", "/umat/editUmat", "/qiudao/addQiudao", "/qiudao/editQiudao"].includes(router.pathname);
  const backPath = router.pathname.includes("umat") ? "/umat" : "/qiudao";
  const pageAction = router.pathname.includes("edit") ? "Edit" : "Tambah";

  return (
    <Flex direction="column" h="100vh" maxW="100vw" overflow="hidden">
      <Flex flex="1" overflow="hidden">
        <Box
          width="240px"
          p={6}
          borderRight="4px solid #e2e8f0"
          overflow="auto"
        >
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

        {/* Konten Utama */}
        <Box
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          minW="0"
        >
          <Flex justify="space-between" align="center" p={3}>
            <HStack spacing={2} ml={3}>
              {showBackButton && (
                <>
                  <IconButton
                    variant="outline"
                    size="sm"
                    icon={<FiArrowLeft fontSize="20px" color="gray.600" />}
                    aria-label="Kembali"
                    borderColor="blue.500"
                    onClick={() => {
                      router.push(backPath);
                    }}
                    mr={2}
                  />
                </>
              )}

              <Heading size="sm" color={showBackButton ? "gray.300" : "black"}>
                {title}
              </Heading>

              {showBackButton && (
                <>
                  <IconButton
                    variant="unstyled"
                    size="sm"
                    icon={<FiChevronRight color="gray.600" />}
                    aria-label="ActivePage"
                    p={2.5}
                  />

                  <Heading size="sm">
                    Tambah manual
                  </Heading>
                </>
              )}
            </HStack>

            <Flex gap={2} align="center">
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

          <Divider borderBottomWidth="4px"/>
          <Box p={4}>
            {children}
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}