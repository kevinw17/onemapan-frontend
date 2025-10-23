import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  VStack,
  Alert,
  AlertIcon,
  IconButton,
  InputGroup,
  InputRightElement,
  Text,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useRouter } from "next/router";
import NextLink from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginApi } from "@/features/login/loginApi";

export default function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [flashMessage, setFlashMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });

  const {
    mutate: login,
    isLoading: loginIsLoading,
    isError: loginIsError,
    error,
  } = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      if (data?.token && data?.user_data) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user_data));
        queryClient.invalidateQueries(["userProfile"]);
        queryClient.invalidateQueries(["users"]);
        router.push("/dashboard");
      } else {
        setFlashMessage("Login gagal: Data tidak lengkap");
      }
    },
    onError: (error) => {
      setForm((prev) => ({ ...prev, password: "" }));
      setFlashMessage(error?.response?.data?.message || "Terjadi kesalahan saat login");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      login(form);
    } catch (err) {
      setFlashMessage("Terjadi kesalahan saat login");
    }
  };

  useEffect(() => {
    const message = localStorage.getItem("loginSuccess");
    if (message) {
      setFlashMessage(message);
      localStorage.removeItem("loginSuccess");
      setTimeout(() => {
        setFlashMessage("");
      }, 5000);
    }
  }, []);

  return (
    <Box maxW="md" mx="auto" mt={20} p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <Heading mb={6} textAlign="center">Login OneMapan</Heading>

      {flashMessage && (
        <Alert status={loginIsError ? "error" : "success"} mb={4}>
          <AlertIcon />
          {flashMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel htmlFor="username">Username</FormLabel>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Masukkan username"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="password">Password</FormLabel>
            <InputGroup>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Masukkan password"
                autoComplete="new-password"
              />
              <InputRightElement>
                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={showPassword ? "Sembunyikan" : "Lihat"}
                  icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Button
            colorScheme="blue"
            type="submit"
            width="full"
            isDisabled={loginIsLoading || !form.username || !form.password}
            isLoading={loginIsLoading}
          >
            Masuk
          </Button>

          {/* Register belum diperlukan untuk saat ini */}
          {/* <Text fontSize="sm" mt={2}>
            Belum punya akun?{" "}
            <NextLink href="/register" passHref>
              <Box as="span" color="blue.500" textDecoration="underline" cursor="pointer">
                Daftar disini
              </Box>
            </NextLink>
          </Text> */}
        </VStack>
      </form>
    </Box>
  );
}