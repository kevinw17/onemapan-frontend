import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, Box, VStack, Text, FormControl, FormLabel,
    Input, Select, Button,
    Collapse
} from "@chakra-ui/react";
import LocationSection from "./LocationSection";
import { useEffect, useState } from "react";

function UserDetailModal(
    { isOpen, onClose, selectedUser, isEditing, setIsEditing, 
        formData, setFormData, handleSave, handleDelete
    }) {
    const [showKtpLocation, setShowKtpLocation] = useState(false);
    const [showDomicileLocation, setShowDomicileLocation] = useState(false);

    useEffect(() => {
        if (!isOpen) {
        setShowKtpLocation(false);
        setShowDomicileLocation(false);
        }
    }, [isOpen]);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Detail Umat</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                {selectedUser && (
                    <Box as="section">
                    {isEditing ? (
                        <VStack spacing={4} align="stretch">
                        {[
                            { label: "Nama Lengkap", field: "full_name" },
                            { label: "Nama Mandarin", field: "mandarin_name" },
                            { label: "Tempat Lahir", field: "place_of_birth" },
                            { label: "Tanggal Lahir", field: "date_of_birth", type: "date" },
                            { label: "No. KTP", field: "id_card_number" },
                            { label: "No. HP", field: "phone_number", type: "tel" },
                            { label: "Email", field: "email" },
                            { label: "Pendidikan terakhir", field: "last_education_level" },
                            { label: "Jurusan pendidikan", field: "education_major" },
                            { label: "Pekerjaan", field: "job_name" },
                        ].map(({ label, field, type }) => (
                            <FormControl key={field}>
                            <FormLabel fontWeight="bold">{label}</FormLabel>
                            <Input
                                type={type || "text"}
                                value={
                                    type === "date" && formData[field]
                                    ? formData[field].slice(0, 10)
                                    : formData[field] || ""
                                }
                                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                            />
                            </FormControl>
                        ))}

                        <FormControl>
                            <FormLabel fontWeight="bold">Status Ikrar Vegetarian (Qing Kou)</FormLabel>
                            <Select
                            value={formData.is_qing_kou ? "true" : "false"}
                            onChange={(e) => setFormData({ ...formData, is_qing_kou: e.target.value === "true" })}
                            >
                            <option value="true">Sudah berikrar vegetarian</option>
                            <option value="false">Belum berikrar vegetarian</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="bold">Jenis Kelamin</FormLabel>
                            <Select
                            value={formData.gender || ""}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                            <option value="Male">Pria</option>
                            <option value="Female">Wanita</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="bold">Golongan Darah</FormLabel>
                            <Select
                            value={formData.blood_type || ""}
                            onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                            >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="O">O</option>
                            <option value="AB">AB</option>
                            </Select>
                        </FormControl>

                        <Button
                            colorScheme="teal"
                            onClick={() => setShowKtpLocation(!showKtpLocation)}
                        >
                            {showKtpLocation ? "Sembunyikan Lokasi KTP" : "Tampilkan Lokasi KTP"}
                        </Button>
                        <Collapse in={showKtpLocation}>
                            <Box>
                                <LocationSection
                                    location={formData.id_card_location}
                                    onChange={(updatedLocation) =>
                                        setFormData(prev => ({ ...prev, id_card_location: updatedLocation }))
                                    }
                                    hideMandarinName
                                />
                            </Box>
                        </Collapse>

                        <Button
                            colorScheme="teal"
                            onClick={() => setShowDomicileLocation(!showDomicileLocation)}
                        >
                            {showDomicileLocation ? "Sembunyikan Lokasi Domisili" : "Tampilkan Lokasi Domisili"}
                        </Button>
                        <Collapse in={showDomicileLocation}>
                            <Box>
                                <LocationSection
                                    location={formData.domicile_location}
                                    onChange={(updatedLocation) =>
                                        setFormData(prev => ({ ...prev, domicile_location: updatedLocation }))
                                    }
                                    hideMandarinName={true}
                                />
                            </Box>
                        </Collapse>
                        </VStack>
                    ) : (
                        <VStack align="start" spacing={3}>
                            <Text><b>ID:</b> {selectedUser.user_info_id}</Text>

                            {selectedUser.full_name?.trim() && (
                                <Text><b>Nama Lengkap:</b> {selectedUser.full_name}</Text>
                            )}

                            {selectedUser.mandarin_name?.trim() && (
                                <Text><b>Nama Mandarin:</b> {selectedUser.mandarin_name}</Text>
                            )}

                            {selectedUser.gender?.trim() && (
                                <Text><b>Jenis Kelamin:</b> {selectedUser.gender === "Male" ? "Pria" : "Wanita"}</Text>
                            )}

                            <Text><b>Status Vegetarian:</b> {selectedUser.is_qing_kou ? "Sudah Berikrar Vegetarian" : "Belum Berikrar Vegetarian"}</Text>

                            {selectedUser.blood_type?.trim() && (
                                <Text><b>Golongan Darah:</b> {selectedUser.blood_type}</Text>
                            )}

                            {selectedUser.place_of_birth?.trim() && (
                                <Text><b>Tempat Lahir:</b> {selectedUser.place_of_birth}</Text>
                            )}

                            {selectedUser.date_of_birth && (
                                <Text>
                                <b>Tanggal Lahir:</b>{" "}
                                {new Date(selectedUser.date_of_birth).toLocaleDateString("id-ID", {
                                    year: "numeric", month: "long", day: "numeric"
                                })}
                                </Text>
                            )}

                            {selectedUser.phone_number?.trim() && (
                                <Text><b>No. HP:</b> {selectedUser.phone_number}</Text>
                            )}

                            {selectedUser.id_card_number?.trim() && (
                                <Text><b>No. KTP:</b> {selectedUser.id_card_number}</Text>
                            )}

                            {selectedUser.email?.trim() && (
                                <Text><b>Email:</b> {selectedUser.email}</Text>
                            )}

                            {selectedUser.marital_status?.trim() && (
                                <Text><b>Status Pernikahan:</b> {selectedUser.marital_status === "Married" ? "Sudah Menikah" : "Belum Menikah"}</Text>
                            )}

                            {selectedUser.last_education_level?.trim() && (
                                <Text><b>Pendidikan Terakhir:</b> {selectedUser.last_education_level}</Text>
                            )}

                            {selectedUser.education_major?.trim() && (
                                <Text><b>Jurusan:</b> {selectedUser.education_major}</Text>
                            )}

                            {selectedUser.job_name?.trim() && (
                                <Text><b>Pekerjaan:</b> {selectedUser.job_name}</Text>
                            )}

                            {["street", "locality", "district", "city", "province"].some(f => selectedUser.id_card_location?.[f]) && (
                                <Text>
                                <b>Domisili KTP:</b>{" "}
                                {["street", "locality", "district", "city", "province"]
                                    .map(f => selectedUser.id_card_location?.[f])
                                    .filter(Boolean)
                                    .join(", ")}
                                </Text>
                            )}

                            {["street", "locality", "district", "city", "province"].some(f => selectedUser.domicile_location?.[f]) && (
                                <Text>
                                <b>Domisili Saat Ini:</b>{" "}
                                {["street", "locality", "district", "city", "province"]
                                    .map(f => selectedUser.domicile_location?.[f])
                                    .filter(Boolean)
                                    .join(", ")}
                                </Text>
                            )}
                        </VStack>
                    )}
                    </Box>
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
                            setFormData(selectedUser);
                        }}
                        >
                        Batal
                        </Button>
                        <Button
                        colorScheme="blue"
                        flex="1"
                        onClick={handleSave}
                        >
                        Simpan
                        </Button>
                    </Box>
                    ) : (
                    <Box display="flex" gap={4}>
                        <Button
                        colorScheme="blue"
                        flex="1"
                        onClick={() => setIsEditing(true)}
                        >
                        Edit
                        </Button>
                        <Button
                        colorScheme="red"
                        flex="1"
                        onClick={() => handleDelete(selectedUser.user_info_id)}
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

export default UserDetailModal;
