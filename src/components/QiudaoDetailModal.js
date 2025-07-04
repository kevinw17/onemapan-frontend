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
    Input,
    Button,
    Box,
    Collapse
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import LocationSection from "./LocationSection";

export default function QiudaoDetailModal({
    isOpen,
    onClose,
    selectedQiudao,
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    handleSave,
    handleDelete,
}) {
    const locationFieldLabels = {
        location_name: "Nama Vihara",
        location_mandarin_name: "Nama Vihara (Mandarin)",
        street: "Alamat",
        locality: "Kelurahan",
        district: "Kecamatan",
        city: "Kota / Kabupaten",
        province: "Provinsi",
        postal_code: "Kode Pos",
    };

    const [showLocation, setShowLocation] = useState(false);
    useEffect(() => {
        if (!isOpen) {
            setShowLocation(false);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
            <ModalHeader>Detail Qiudao</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
            {selectedQiudao && (
                isEditing ? (
                <VStack spacing={3} align="stretch" w="100%">
                    <Text fontWeight="bold">Nama Qiudao</Text>
                    <Input value={formData.qiu_dao_name || ""} onChange={(e) => setFormData({ ...formData, qiu_dao_name: e.target.value })} />

                    <Text fontWeight="bold">Nama Mandarin Qiudao</Text>
                    <Input value={formData.qiu_dao_mandarin_name || ""} onChange={(e) => setFormData({ ...formData, qiu_dao_mandarin_name: e.target.value })} />

                    <Text fontWeight="bold">Pandita</Text>
                    <Input value={formData.dian_chuan_shi_mandarin_name || ""} onChange={(e) => setFormData({ ...formData, dian_chuan_shi_mandarin_name: e.target.value })} />

                    <Text fontWeight="bold">Guru Pengajak</Text>
                    <Input value={formData.yin_shi_qd_mandarin_name || ""} onChange={(e) => setFormData({ ...formData, yin_shi_qd_mandarin_name: e.target.value })} />

                    <Text fontWeight="bold">Guru Penanggung</Text>
                    <Input value={formData.bao_shi_qd_mandarin_name || ""} onChange={(e) => setFormData({ ...formData, bao_shi_qd_mandarin_name: e.target.value })} />

                    <Text fontWeight="bold">Tahun Lunar</Text>
                    <Input value={formData.lunar_sui_ci_year || ""} onChange={(e) => setFormData({ ...formData, lunar_sui_ci_year: e.target.value })} />

                    <Text fontWeight="bold">Bulan Lunar</Text>
                    <Input value={formData.lunar_month || ""} onChange={(e) => setFormData({ ...formData, lunar_month: e.target.value })} />

                    <Text fontWeight="bold">Tanggal Lunar</Text>
                    <Input value={formData.lunar_day || ""} onChange={(e) => setFormData({ ...formData, lunar_day: e.target.value })} />

                    <Text fontWeight="bold">Waktu Lunar</Text>
                    <Input value={formData.lunar_shi_chen_time || ""} onChange={(e) => setFormData({ ...formData, lunar_shi_chen_time: e.target.value })} />

                    <VStack align="stretch" spacing={4}>
                        <Button
                            mt={2}
                            onClick={() => setShowLocation(prev => !prev)}
                            colorScheme="teal"
                        >
                            {showLocation ? "Sembunyikan Lokasi" : "Tampilkan Lokasi"}
                        </Button>
                        <Collapse in={showLocation} animateOpacity>
                            <LocationSection
                                location={formData.qiu_dao_location}
                                onChange={(updatedLocation) =>
                                    setFormData(prev => ({
                                    ...prev,
                                    qiu_dao_location: updatedLocation
                                    }))
                                }
                                customLabels={{
                                    location_name: "Nama Vihara",
                                    location_mandarin_name: "Nama Vihara (Mandarin)",
                                }}
                            />
                        </Collapse>
                    </VStack>
                </VStack>
                ) : (
                <VStack align="start" spacing={3}>
                    {selectedQiudao.qiu_dao_id && <Text><b>ID:</b> {selectedQiudao.qiu_dao_id}</Text>}

                    {selectedQiudao.qiu_dao_location?.location_mandarin_name?.trim() && (
                    <Text><b>Lokasi Qiudao:</b> {selectedQiudao.qiu_dao_location.location_mandarin_name}</Text>
                    )}

                    {selectedQiudao.dian_chuan_shi_mandarin_name?.trim() && (
                    <Text><b>Pandita:</b> {selectedQiudao.dian_chuan_shi_mandarin_name}</Text>
                    )}

                    {selectedQiudao.yin_shi_qd_mandarin_name?.trim() && (
                    <Text><b>Guru Pengajak:</b> {selectedQiudao.yin_shi_qd_mandarin_name}</Text>
                    )}

                    {selectedQiudao.bao_shi_qd_mandarin_name?.trim() && (
                    <Text><b>Guru Penanggung:</b> {selectedQiudao.bao_shi_qd_mandarin_name}</Text>
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
                )
            )}

            </ModalBody>

            <ModalFooter w="100%">
            <Box w="100%">
                {isEditing ? (
                <Box display="flex" gap={4}>
                    <Button
                    colorScheme="gray"
                    flex="1"
                    onClick={() => {
                        setIsEditing(false);
                        setFormData(selectedQiudao);
                    }}
                    >
                    Batal
                    </Button>
                    <Button colorScheme="blue" flex="1" onClick={handleSave}>
                    Simpan
                    </Button>
                </Box>
                ) : (
                <Box display="flex" gap={4}>
                    <Button colorScheme="blue" flex="1" onClick={() => setIsEditing(true)}>
                    Edit
                    </Button>
                    <Button
                    colorScheme="red"
                    flex="1"
                    onClick={() => handleDelete(selectedQiudao.qiu_dao_id)}
                    >
                    Hapus
                    </Button>
                </Box>
                )}
            </Box>
            </ModalFooter>
        </ModalContent>
        </Modal>
    );
}
