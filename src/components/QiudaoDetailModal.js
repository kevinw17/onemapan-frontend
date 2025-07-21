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
    Collapse,
    Select
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import LocationSection from "./LocationSection";
import { axiosInstance } from "@/lib/axios";

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
    const [dianChuanList, setDianChuanList] = useState([]);
    const [templeLocations, setTempleLocations] = useState([]);

    useEffect(() => {
        if (!isOpen) {
            setShowLocation(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            axiosInstance.get("/dianchuanshi")
                .then(res => setDianChuanList(res.data))
                .catch(err => console.error("Gagal ambil Dian Chuan Shi:", err));
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            axiosInstance.get("/fotang")
                .then(res => setTempleLocations(res.data || []))
                .catch(err => console.error("Gagal ambil lokasi vihara:", err));
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

                    <Text fontWeight="bold">Lokasi Vihara</Text>
                    <Select
                        placeholder="Pilih Lokasi Vihara"
                        value={formData.qiu_dao_location_id || ""}
                        onChange={(e) =>
                            setFormData({ ...formData, qiu_dao_location_id: parseInt(e.target.value) })
                        }
                    >
                        {templeLocations.map((fotang) => {
                            const label = [fotang.location_name, fotang.location_mandarin_name]
                                .filter(Boolean)
                                .join(" (") + (fotang.location_mandarin_name ? ")" : "");
                            return (
                                <option key={fotang.fotang_id} value={fotang.fotang_id}>
                                    {label}
                                </option>
                            );
                        })}
                    </Select>

                    <Text fontWeight="bold">Pandita</Text>
                    <Select
                        placeholder="Pilih Pandita"
                        value={formData.dian_chuan_shi_id || ""}
                        onChange={(e) => {
                            const selected = dianChuanList.find(item => item.id === parseInt(e.target.value));
                            setFormData({
                                ...formData,
                                dian_chuan_shi_id: selected?.id || null,
                            });
                        }}
                    >
                    {dianChuanList.map((item) => {
                        const indonesian = item.name?.trim() || "(Tanpa Nama)";
                        const mandarin = item.mandarin_name?.trim() || "(无名)";
                        return (
                        <option key={item.id} value={item.id}>
                            [{item.id}] {indonesian} ({mandarin})
                        </option>
                        );
                    })}
                    </Select>

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
                </VStack>
                ) : (
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
