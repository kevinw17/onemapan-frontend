import { useState } from "react";
import {
  Box, Button, FormControl, FormLabel,
  Input, Heading, VStack, Alert, AlertIcon, Text,
  InputGroup, InputRightElement, IconButton
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useRouter } from "next/router";
import { axiosInstance } from "@/lib/axios";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    // if (!validatePassword(form.password)) {
    //   setError("Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan simbol");
    //   return;
    // }

    try {
      await axiosInstance.post("/register", {
        username: form.username,
        password: form.password,
      });
      localStorage.setItem("loginSuccess", "Akun berhasil dibuat! Silakan login.");
      router.push("/login");
    } catch (err) {
      setError(err?.response?.data || "Terjadi kesalahan saat registrasi");
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={20} p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <Heading mb={6} textAlign="center">Daftar Akun</Heading>

      {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}

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
                  size="sm"
                  variant="ghost"
                  aria-label="Toggle password"
                  icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="confirmPassword">Konfirmasi Password</FormLabel>
            <InputGroup>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi password"
                autoComplete="new-password"
              />
              <InputRightElement>
                <IconButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Toggle confirm password"
                  icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Button
            colorScheme="teal"
            type="submit"
            width="full"
            isDisabled={
              !form.username || !form.password || !form.confirmPassword
            }
          >
            Daftar
          </Button>

          <Text fontSize="sm" mt={2}>
            Sudah punya akun?{" "}
            <Box
              as="span"
              color="blue.500"
              cursor="pointer"
              onClick={() => router.push("/login")}
              textDecoration="underline"
            >
              Login disini
            </Box>
          </Text>
        </VStack>
      </form>
    </Box>
  );
}
