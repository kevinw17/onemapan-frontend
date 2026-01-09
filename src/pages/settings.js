import Layout from "@/components/layout";
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Heading,
    Text,
    useToast,
    InputGroup,
    InputRightElement,
    IconButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/router";
import { axiosInstance } from "@/lib/axios";

export default function SettingsPage() {
    const toast = useToast();
    const router = useRouter();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!oldPassword || !newPassword || !confirmPassword) {
        toast({
            title: "Error",
            description: "Semua kolom wajib diisi",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }

        if (newPassword !== confirmPassword) {
        toast({
            title: "Error",
            description: "Password baru dan konfirmasi tidak cocok",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }

        if (newPassword.length < 6) {
        toast({
            title: "Error",
            description: "Password baru minimal 6 karakter",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }

        setIsLoading(true);

        try {
        const response = await axiosInstance.post("/change-password", {
            oldPassword,
            newPassword,
        });

        toast({
            title: "Berhasil!",
            description: "Password berhasil diganti. Anda akan dialihkan ke login.",
            status: "success",
            duration: 5000,
            isClosable: true,
        });

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => router.push("/login"), 2000);
        } catch (err) {
        const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Terjadi kesalahan saat mengganti password";

        toast({
            title: "Gagal",
            description: errorMessage,
            status: "error",
            duration: 5000,
            isClosable: true,
        });
        } finally {
        setIsLoading(false);
        }
    };

    return (
        <Layout title="Pengaturan">
        <Box p={2}>
            <VStack spacing={6} align="stretch">
            <Heading size="lg" color="blue.600">
                Pengaturan Akun
            </Heading>

            <Box p={6} bg="white" borderRadius="lg" boxShadow="md" borderWidth="1px" borderColor="gray.200">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                Ganti Password
                </Text>
                <Text fontSize="sm" color="gray.600" mb={6}>
                Pastikan password baru kuat dan berbeda dari yang sebelumnya
                </Text>

                <form onSubmit={handleSubmit}>
                <VStack spacing={5} align="stretch">
                    <FormControl isRequired>
                    <FormLabel>Password Lama</FormLabel>
                    <InputGroup>
                        <Input
                        type={showOld ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Masukkan password lama"
                        size="lg"
                        />
                        <InputRightElement height="full">
                        <IconButton
                            variant="ghost"
                            size="sm"
                            icon={showOld ? <FiEyeOff /> : <FiEye />}
                            onClick={() => setShowOld(!showOld)}
                            aria-label={showOld ? "Sembunyikan" : "Tampilkan"}
                        />
                        </InputRightElement>
                    </InputGroup>
                    </FormControl>

                    <FormControl isRequired>
                    <FormLabel>Password Baru</FormLabel>
                    <InputGroup>
                        <Input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        size="lg"
                        />
                        <InputRightElement height="full">
                        <IconButton
                            variant="ghost"
                            size="sm"
                            icon={showNew ? <FiEyeOff /> : <FiEye />}
                            onClick={() => setShowNew(!showNew)}
                            aria-label={showNew ? "Sembunyikan" : "Tampilkan"}
                        />
                        </InputRightElement>
                    </InputGroup>
                    </FormControl>

                    <FormControl isRequired>
                    <FormLabel>Konfirmasi Password Baru</FormLabel>
                    <InputGroup>
                        <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ketik ulang password baru"
                        size="lg"
                        />
                        <InputRightElement height="full">
                        <IconButton
                            variant="ghost"
                            size="sm"
                            icon={showConfirm ? <FiEyeOff /> : <FiEye />}
                            onClick={() => setShowConfirm(!showConfirm)}
                            aria-label={showConfirm ? "Sembunyikan" : "Tampilkan"}
                        />
                        </InputRightElement>
                    </InputGroup>
                    </FormControl>

                    <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    mt={4}
                    isLoading={isLoading}
                    loadingText="Menyimpan..."
                    >
                    Simpan Perubahan Password
                    </Button>
                </VStack>
                </form>

                <Text fontSize="sm" color="gray.500" mt={6} textAlign="center">
                Setelah mengganti password, Anda akan otomatis logout dan diminta login ulang.
                </Text>
            </Box>
            </VStack>
        </Box>
        </Layout>
    );
}