import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    VStack,
    Text,
    Button,
    Box,
    Flex,
    useDisclosure,
    Spinner,
    IconButton,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { FiEdit, FiX } from "react-icons/fi";
import { useRouter } from "next/router";
import { useToast } from "@chakra-ui/react";

export default function QiudaoDetailModal({
    isOpen,
    onClose,
    selectedQiudao,
    handleDelete,
    canEdit,
}) {
    const [dianChuanList, setDianChuanList] = useState([]);
    const [templeLocations, setTempleLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();
    const router = useRouter();

    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
    const [qiudaoIdToDelete, setQiudaoIdToDelete] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            Promise.all([
                axiosInstance.get("/dianchuanshi").then(res => setDianChuanList(res.data)).catch(err => console.error("Gagal ambil Dian Chuan Shi:", err)),
                axiosInstance.get("/fotang").then(res => setTempleLocations(res.data || [])).catch(err => console.error("Gagal ambil lokasi vihara:", err)),
            ]).finally(() => setIsLoading(false));
        }
    }, [isOpen, selectedQiudao]);

    const handleConfirmDelete = async () => {
        try {
            await handleDelete(qiudaoIdToDelete);
            toast({
                title: "Berhasil dihapus",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            const errorData = err?.response?.data;
            const errorMessage =
                typeof errorData === "string"
                    ? errorData
                    : errorData?.message || "Terjadi kesalahan saat menghapus";
            toast({
                title: "Gagal menghapus",
                description: errorMessage,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            onConfirmClose();
            onClose();
        }
    };

    if (!selectedQiudao) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Flex align="center" justify="space-between" w="100%">
                        <Text>Detail Qiudao</Text>
                        <Flex align="center">
                            {canEdit && (
                                <Button
                                    aria-label="Edit"
                                    variant="solid"
                                    colorScheme="blue"
                                    onClick={() => {
                                        router.push({
                                            pathname: "/qiudao/editQiudao",
                                            query: { qiuDaoId: selectedQiudao.qiu_dao_id },
                                        });
                                    }}
                                    size="sm"
                                    mr={2}
                                >
                                    Edit
                                </Button>
                            )}
                            <IconButton
                                icon={<FiX />}
                                aria-label="Close"
                                variant="ghost"
                                onClick={onClose}
                                size="sm"
                            />
                        </Flex>
                    </Flex>
                </ModalHeader>
                <ModalBody>
                    {isLoading ? (
                        <Flex justify="center" py={10}>
                            <Spinner size="sm" />
                        </Flex>
                    ) : selectedQiudao ? (
                        <VStack align="start" spacing={3}>
                            {selectedQiudao.qiu_dao_id && <Text><b>ID:</b> {selectedQiudao.qiu_dao_id}</Text>}

                            {selectedQiudao.qiu_dao_location && (
                                <Text>
                                    <b>Lokasi Qiudao:</b>{" "}
                                    {selectedQiudao.qiu_dao_location.location_name?.trim() || "(Tanpa Nama)"}{" "}
                                    ({selectedQiudao.qiu_dao_location.location_mandarin_name?.trim() || "无名"})
                                </Text>
                            )}

                            {selectedQiudao.dian_chuan_shi && (
                                <Text>
                                    <b>Pandita:</b>{" "}
                                    {selectedQiudao.dian_chuan_shi.name?.trim() || "(Tanpa Nama)"}{" "}
                                    ({selectedQiudao.dian_chuan_shi.mandarin_name?.trim() || "无名"})
                                </Text>
                            )}

                            {(selectedQiudao.yin_shi_qd_mandarin_name || selectedQiudao.yin_shi_qd_name)?.trim() && (
                                <Text>
                                    <b>Guru Pengajak:</b>{" "}
                                    {selectedQiudao.yin_shi_qd_mandarin_name?.trim() || selectedQiudao.yin_shi_qd_name}
                                </Text>
                            )}

                            {(selectedQiudao.bao_shi_qd_mandarin_name || selectedQiudao.bao_shi_qd_name)?.trim() && (
                                <Text>
                                    <b>Guru Penanggung:</b>{" "}
                                    {selectedQiudao.bao_shi_qd_mandarin_name?.trim() || selectedQiudao.bao_shi_qd_name}
                                </Text>
                            )}

                            {selectedQiudao.qiu_dao_name?.trim() && (
                                <Text><b>Nama Qiudao:</b> {selectedQiudao.qiu_dao_name}</Text>
                            )}

                            {selectedQiudao.qiu_dao_mandarin_name?.trim() && (
                                <Text><b>Nama Mandarin Qiudao:</b> {selectedQiudao.qiu_dao_mandarin_name}</Text>
                            )}

                            {[selectedQiudao.lunar_sui_ci_year, selectedQiudao.lunar_month, selectedQiudao.lunar_day, selectedQiudao.lunar_shi_chen_time].some(val => !!val?.toString().trim()) && (
                                <Text>
                                    <b>Tanggal Qiudao:</b> {
                                        [selectedQiudao.lunar_sui_ci_year, selectedQiudao.lunar_month, selectedQiudao.lunar_day, selectedQiudao.lunar_shi_chen_time].filter(val => !!val?.toString().trim()).join(" ")
                                    }
                                </Text>
                            )}
                        </VStack>
                    ) : (
                        <Text>Tidak ada data Qiudao yang dipilih.</Text>
                    )}
                </ModalBody>
                <ModalFooter w="100%">
                </ModalFooter>
            </ModalContent>

            <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} size="xs" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Konfirmasi hapus data</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>Apakah Anda yakin ingin menghapus data ini?</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Flex w="100%" gap={2}>
                            <Button variant="ghost" onClick={onConfirmClose} flex="1">
                                Tidak
                            </Button>
                            <Button colorScheme="red" onClick={handleConfirmDelete} flex="1">
                                Ya
                            </Button>
                        </Flex>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Modal>
    );
}
