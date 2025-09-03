import { Box, Button, Flex, Heading, Text, IconButton, useToast, Tag, VStack, Divider, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure, FormControl, FormLabel, Input, Select, Textarea, HStack, Checkbox, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { FiEdit, FiTrash, FiEye, FiPlus, FiChevronDown } from "react-icons/fi";
import Layout from "@/components/layout"; // Retaining layout.js
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios"; // Using custom axios instance

const fetchEvents = async () => {
    try {
        const response = await axiosInstance.get("/event").catch(() => ({ data: [] }));
        if (!response.data || !Array.isArray(response.data)) {
        return [];
        }
        return response.data.map((event) => ({
        id: event.event_id,
        occurrence_id: event.occurrences[0]?.occurrence_id, // Add occurrence_id from the first occurrence
        date: new Date(event.occurrences[0].greg_occur_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
        day: new Date(event.occurrences[0].greg_occur_date).toLocaleDateString("id-ID", { weekday: "long" }).split(",")[0],
        time: new Date(event.occurrences[0].greg_occur_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) + " WIB",
        name: event.event_name,
        location: event.location_name,
        type: event.event_type === "Hari_Besar" ? "Hari Besar" : event.event_type,
        description: event.description || "No description available",
        lunar_sui_ci_year: event.lunar_sui_ci_year || "",
        lunar_month: event.lunar_month || "",
        lunar_day: event.lunar_day || "",
        rawDate: new Date(event.occurrences[0].greg_occur_date),
        }));
    } catch (error) {
        console.error("API Error:", error);
        return [];
    }
};

const deleteEvent = async (id) => {
    console.log(`Attempting to delete event with ID: ${id} at ${new Date().toISOString()}`);
    const response = await axiosInstance.delete(`/event/${id}`);
    console.log(`Delete response for event ${id}:`, response.data);
    return response.data;
};

const updateEvent = async (id, payload) => {
    await axiosInstance.patch(`/event/${id}`, payload);
};

export default function Event() {
    const toast = useToast();
    const [filter, setFilter] = useState("Bulan ini");
    const queryClient = useQueryClient();
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure(); // Modal for event details
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure(); // Modal for adding event
    const { isOpen: isActionOpen, onOpen: onActionOpen, onClose: onActionClose } = useDisclosure(); // Modal for actions (Edit/Delete)
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure(); // Modal for editing event
    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure(); // Modal for delete confirmation
    const [selectedEvent, setSelectedEvent] = useState(null); // Store selected event for popup
    const [formData, setFormData] = useState({
        event_name: "",
        event_mandarin_name: "",
        greg_occur_date: "",
        location_name: "",
        event_type: "Regular",
        description: "",
        lunar_sui_ci_year: "",
        lunar_month: "",
        lunar_day: "",
        is_recurring: false,
    });

    const { data: events = [], isLoading, error } = useQuery({
        queryKey: ["events"],
        queryFn: fetchEvents,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteEvent,
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["events"] });
        toast({
            title: "Kegiatan Dihapus",
            description: "Kegiatan berhasil dihapus.",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
        onActionClose(); // Close action modal after deletion
        onConfirmClose(); // Close confirmation modal after deletion
        },
        onError: (error) => {
        const errorMessage = error.response?.data?.message || error.message || "Gagal menghapus kegiatan.";
        console.error("Delete Error Details:", {
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data,
            requestId: error.response?.headers?.['x-request-id'], // If available
            eventId: selectedEvent?.id, // Log the ID being deleted
        });
        toast({
            title: "Error",
            description: `${errorMessage} Periksa konsol untuk detail. Hubungi admin jika masalah berlanjut.`,
            status: "error",
            duration: 6000,
            isClosable: true,
        });
        onConfirmClose(); // Close confirmation modal on error
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data) => updateEvent(data.id, data.payload),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["events"] });
        toast({
            title: "Kegiatan Diperbarui",
            description: "Kegiatan berhasil diperbarui.",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
        onEditClose(); // Close edit modal after successful update
        onDetailClose(); // Close detail modal after successful update
        },
        onError: (error) => {
        console.error("Update Error:", error.response ? error.response.data : error.message);
        toast({
            title: "Error",
            description: "Gagal memperbarui kegiatan.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        },
    });

    const handleEdit = (name) => {
        if (selectedEvent) {
        // Preserve local time by formatting rawDate with local timezone
        const localDateTime = selectedEvent.rawDate.toLocaleString("sv-SE", {
            timeZone: "Asia/Jakarta", // WIB timezone
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).replace(" ", "T"); // Convert to "YYYY-MM-DDTHH:mm" format

        setFormData({
            event_name: selectedEvent.name,
            event_mandarin_name: selectedEvent.event_mandarin_name || "",
            greg_occur_date: localDateTime,
            location_name: selectedEvent.location,
            event_type: selectedEvent.type === "Hari Besar" ? "Hari_Besar" : selectedEvent.type,
            description: selectedEvent.description,
            lunar_sui_ci_year: selectedEvent.lunar_sui_ci_year,
            lunar_month: selectedEvent.lunar_month,
            lunar_day: selectedEvent.lunar_day,
            is_recurring: selectedEvent.is_recurring || false,
        });
        onEditOpen();
        }
    };

    const handleDelete = (id, name) => {
        if (selectedEvent) {
        setSelectedEvent({ ...selectedEvent, id, name }); // Ensure id and name are set for deletion
        onConfirmOpen(); // Open confirmation modal
        }
    };

    const confirmDelete = () => {
        if (selectedEvent) {
        deleteMutation.mutate(selectedEvent.id);
        }
    };

    const openDetailPopup = (event) => {
        setSelectedEvent(event);
        onDetailOpen();
    };

    const openActionPopup = (event) => {
        setSelectedEvent(event);
        onActionOpen();
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.event_name || !formData.greg_occur_date || !formData.location_name || !formData.event_type || !formData.lunar_sui_ci_year || !formData.lunar_month || !formData.lunar_day) {
        toast({
            title: "Error",
            description: "Semua field wajib diisi.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }

        try {
        const payload = {
            event_name: formData.event_name,
            event_mandarin_name: formData.event_mandarin_name,
            location_name: formData.location_name,
            event_type: formData.event_type,
            description: formData.description,
            lunar_sui_ci_year: formData.lunar_sui_ci_year,
            lunar_month: formData.lunar_month,
            lunar_day: formData.lunar_day,
            is_recurring: formData.is_recurring,
            occurrences: [
            {
                greg_occur_date: new Date(formData.greg_occur_date).toISOString(),
            },
            ],
        };
        console.log("Sending payload:", payload); // Log payload for debugging
        await axiosInstance.post("/event", payload);
        toast({
            title: "Kegiatan Ditambahkan",
            description: "Kegiatan berhasil ditambahkan.",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
        setFormData({
            event_name: "",
            event_mandarin_name: "",
            greg_occur_date: "",
            location_name: "",
            event_type: "Regular",
            description: "",
            lunar_sui_ci_year: "",
            lunar_month: "",
            lunar_day: "",
            is_recurring: false,
        }); // Reset form
        onAddClose(); // Close modal
        queryClient.invalidateQueries({ queryKey: ["events"] }); // Refresh event list
        } catch (error) {
        console.error("Error adding event:", error.response ? error.response.data : error.message); // Log detailed error
        toast({
            title: "Error",
            description: "Gagal menambahkan kegiatan.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!formData.event_name || !formData.greg_occur_date || !formData.location_name || !formData.event_type || !formData.lunar_sui_ci_year || !formData.lunar_month || !formData.lunar_day) {
        toast({
            title: "Error",
            description: "Semua field wajib diisi.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }

        try {
        const payload = {
            event_name: formData.event_name,
            event_mandarin_name: formData.event_mandarin_name || undefined,
            location_name: formData.location_name,
            event_type: formData.event_type,
            description: formData.description || undefined,
            lunar_sui_ci_year: formData.lunar_sui_ci_year,
            lunar_month: formData.lunar_month,
            lunar_day: formData.lunar_day,
            is_recurring: formData.is_recurring,
            occurrences: {
                updateMany: {
                    where: {
                        event_id: selectedEvent.id, // Update all occurrences for this event
                    },
                    data: {
                        greg_occur_date: new Date(formData.greg_occur_date).toISOString(),
                    },
                },
            },
        };
        // Remove undefined fields for PATCH
        Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
        console.log("Sending update payload:", payload); // Log the full payload for debugging
        await updateMutation.mutate({ id: selectedEvent.id, payload });
        onActionClose();
        } catch (error) {
        console.error("Error updating event:", error.response ? error.response.data : error.message);
        toast({
            title: "Error",
            description: "Gagal memperbarui kegiatan.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        }
    };

    const resetFormData = () => {
        setFormData({
            event_name: "",
            event_mandarin_name: "",
            greg_occur_date: "",
            location_name: "",
            event_type: "Regular",
            description: "",
            lunar_sui_ci_year: "",
            lunar_month: "",
            lunar_day: "",
            is_recurring: false,
        });
    };

    const currentDate = new Date(); // Dynamic current timestamp
    const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 7 = August)
    const currentYear = currentDate.getFullYear();

    const filteredEvents = events.filter((event) => {
        const eventMonth = event.rawDate.getMonth();
        const eventYear = event.rawDate.getFullYear();

        if (filter === "Bulan lalu") {
            return eventYear < currentYear || (eventYear === currentYear && eventMonth < currentMonth);
        }
        if (filter === "Bulan ini") {
            return eventYear === currentYear && eventMonth === currentMonth;
        }
        if (filter === "Bulan depan") {
            return eventYear > currentYear || (eventYear === currentYear && eventMonth > currentMonth);
        }
        return true;
    }).sort((a, b) => a.rawDate.getDate() - b.rawDate.getDate());

    return (
        <Layout title="Kegiatan">
        <Box p={2}>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="md">{currentDate.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</Heading>
                <Flex gap={4} align="center">
                    <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => { resetFormData(); onAddOpen(); }} size="sm">
                    Buat Kegiatan Baru
                    </Button>
                    <Menu>
                    <MenuButton as={Button} rightIcon={<FiChevronDown />} variant="outline" size="sm">
                        Show: {filter}
                    </MenuButton>
                    <MenuList>
                        <MenuItem onClick={() => setFilter("Bulan depan")}>Bulan depan</MenuItem>
                        <MenuItem onClick={() => setFilter("Bulan ini")}>Bulan ini</MenuItem>
                        <MenuItem onClick={() => setFilter("Bulan lalu")}>Bulan lalu</MenuItem>
                    </MenuList>
                    </Menu>
                </Flex>
            </Flex>

            <Divider borderBottomWidth="2px"/>
            
            {isLoading ? (
            <VStack h="70vh" justify="center" align="center">
                <Text fontSize="xl" textAlign="center">Loading...</Text>
            </VStack>
            ) : error ? (
            <VStack h="70vh" justify="center" align="center">
                <Text fontSize="xl" textAlign="center">Error loading events: {error.message}</Text>
            </VStack>
            ) : filteredEvents.length === 0 ? (
            <VStack h="70vh" justify="center" align="center">
                <Text fontSize="xl" textAlign="center">Tidak ada kegiatan untuk saat ini</Text>
            </VStack>
            ) : (
            filteredEvents.map((event, index) => (
                <Box
                key={index}
                bg="white"
                p={4}
                mb={4}
                borderRadius="md"
                boxShadow="sm"
                border="1px solid #e2e8f0"
                onClick={() => openActionPopup(event)} // Make row clickable to open action modal
                cursor="pointer"
                _hover={{ bg: "gray.50" }} // Optional hover effect
                >
                <Flex align="stretch" gap={4}>
                    <Box bg="gray.100" p={4} borderRadius="md" minWidth="80px" display="flex" flexDirection="column" justifyContent="flex-start">
                        <Text fontWeight="bold" color="gray.600">
                            {event.date}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                            {event.day}
                        </Text>
                    </Box>
                    <Box flex="1">
                    <Text fontSize="lg" fontWeight="bold" color={"#2e05e8ff"}>
                        {event.time}
                    </Text>
                    <Text mt={1}>{event.name}</Text>
                    <Text color="gray.500" mt={1}>
                        {event.location}
                    </Text>
                    <Flex mt={2} align="center" gap={2}>
                        <Tag size="sm" colorScheme="blue" borderRadius="full">
                        {event.type}
                        </Tag>
                    </Flex>
                    </Box>
                </Flex>
                </Box>
            ))
            )}
            {/* Modal for Event Details */}
            <Modal isOpen={isDetailOpen} onClose={onDetailClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{selectedEvent?.name || "Event Details"}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                <Text mb={2}><strong>Tanggal:</strong> {selectedEvent?.day}, {selectedEvent?.date}</Text>
                <Text my={2}><strong>Tanggal Lunar:</strong> {selectedEvent?.lunar_sui_ci_year} {selectedEvent?.lunar_month} {selectedEvent?.lunar_day}</Text>
                <Text my={2}><strong>Waktu:</strong> {selectedEvent?.time}</Text>
                <Text my={2}><strong>Lokasi:</strong> {selectedEvent?.location}</Text>
                <Text my={2}><strong>Jenis:</strong> {selectedEvent?.type}</Text>
                <Text my={2}><strong>Deskripsi:</strong> {selectedEvent?.description}</Text>
                </ModalBody>
                <ModalFooter>
                <Flex w="100%" justifyContent="space-between">
                    <Button colorScheme="green" leftIcon={<FiEdit />} onClick={() => handleEdit(selectedEvent?.name)} flex="1" mr={2}>
                    Edit
                    </Button>
                    <Button colorScheme="red" leftIcon={<FiTrash />} onClick={() => handleDelete(selectedEvent?.id, selectedEvent?.name)} flex="1" ml={2}>
                    Hapus
                    </Button>
                </Flex>
                </ModalFooter>
            </ModalContent>
            </Modal>

            {/* Modal for Actions (Edit/Delete) */}
            <Modal isOpen={isActionOpen} onClose={onActionClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{selectedEvent?.name || "Event Actions"}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                <Text mb={2}><strong>Tanggal:</strong> {selectedEvent?.day}, {selectedEvent?.date}</Text>
                <Text my={2}><strong>Tanggal Lunar:</strong> {selectedEvent?.lunar_sui_ci_year} {selectedEvent?.lunar_month} {selectedEvent?.lunar_day}</Text>
                <Text my={2}><strong>Waktu:</strong> {selectedEvent?.time}</Text>
                <Text my={2}><strong>Lokasi:</strong> {selectedEvent?.location}</Text>
                <Text my={2}><strong>Jenis:</strong> {selectedEvent?.type}</Text>
                <Text my={2}><strong>Deskripsi:</strong> {selectedEvent?.description}</Text>
                </ModalBody>
                <ModalFooter>
                <Flex w="100%" justifyContent="space-between">
                    <Button colorScheme="green" leftIcon={<FiEdit />} onClick={() => handleEdit(selectedEvent?.name)} flex="1" mr={2}>
                    Edit
                    </Button>
                    <Button colorScheme="red" leftIcon={<FiTrash />} onClick={() => handleDelete(selectedEvent?.id, selectedEvent?.name)} flex="1" ml={2}>
                    Hapus
                    </Button>
                </Flex>
                </ModalFooter>
            </ModalContent>
            </Modal>

            {/* Modal for Editing Event */}
            <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Edit Kegiatan: {selectedEvent?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                <form onSubmit={handleUpdate}>
                    <VStack spacing={6} align="stretch">
                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Nama Kegiatan</FormLabel>
                        <Input name="event_name" value={formData.event_name} onChange={handleChange} placeholder="Masukkan nama kegiatan" />
                        </FormControl>
                        <FormControl flex={1}>
                        <FormLabel>Nama Kegiatan (Mandarin)</FormLabel>
                        <Input name="event_mandarin_name" value={formData.event_mandarin_name} onChange={handleChange} placeholder="Masukkan nama kegiatan (Mandarin)" />
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Tanggal dan Waktu</FormLabel>
                        <Input
                            name="greg_occur_date"
                            value={formData.greg_occur_date}
                            onChange={handleChange}
                            type="datetime-local"
                            placeholder="Pilih tanggal dan waktu"
                        />
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Lokasi</FormLabel>
                        <Input name="location_name" value={formData.location_name} onChange={handleChange} placeholder="Masukkan lokasi" />
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Jenis Kegiatan</FormLabel>
                        <Select name="event_type" value={formData.event_type} onChange={handleChange}>
                            <option value="Regular">Regular</option>
                            <option value="Hari_Besar">Hari Besar</option>
                            <option value="AdHoc">Ad-hoc</option>
                            <option value="Anniversary">Anniversary</option>
                            <option value="Peresmian">Peresmian</option>
                            <option value="Seasonal">Seasonal</option>
                        </Select>
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Tahun Lunar (Sui Ci)</FormLabel>
                        <Input name="lunar_sui_ci_year" value={formData.lunar_sui_ci_year} onChange={handleChange} placeholder="Masukkan tahun lunar" />
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Bulan Lunar</FormLabel>
                        <Input name="lunar_month" value={formData.lunar_month} onChange={handleChange} placeholder="Masukkan bulan lunar" />
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Hari Lunar</FormLabel>
                        <Input name="lunar_day" value={formData.lunar_day} onChange={handleChange} placeholder="Masukkan hari lunar" />
                        </FormControl>
                    </HStack>

                    <FormControl>
                        <FormLabel>Deskripsi</FormLabel>
                        <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Masukkan deskripsi kegiatan" />
                    </FormControl>

                    {/* <FormControl>
                        <Checkbox name="is_recurring" isChecked={formData.is_recurring} onChange={handleChange}>
                        Berulang
                        </Checkbox>
                    </FormControl> */}
                    </VStack>
                </form>
                </ModalBody>
                <ModalFooter>
                <Button colorScheme="blue" mr={3} type="submit" form="edit-event-form" onClick={handleUpdate}>
                    Simpan Perubahan
                </Button>
                <Button variant="ghost" onClick={onEditClose}>
                    Batal
                </Button>
                </ModalFooter>
            </ModalContent>
            </Modal>

            {/* Modal for Adding New Event */}
            <Modal isOpen={isAddOpen} onClose={onAddClose} size="2xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Tambah Kegiatan Baru</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                <form onSubmit={handleSubmit}>
                    <VStack spacing={6} align="stretch">
                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Nama Kegiatan</FormLabel>
                        <Input name="event_name" value={formData.event_name} onChange={handleChange} placeholder="Masukkan nama kegiatan" />
                        </FormControl>
                        <FormControl flex={1}>
                        <FormLabel>Nama Kegiatan (Mandarin)</FormLabel>
                        <Input name="event_mandarin_name" value={formData.event_mandarin_name} onChange={handleChange} placeholder="Masukkan nama kegiatan (Mandarin)" />
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Tanggal dan Waktu</FormLabel>
                        <Input
                            name="greg_occur_date"
                            value={formData.greg_occur_date}
                            onChange={handleChange}
                            type="datetime-local"
                            placeholder="Pilih tanggal dan waktu"
                        />
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Lokasi</FormLabel>
                        <Input name="location_name" value={formData.location_name} onChange={handleChange} placeholder="Masukkan lokasi" />
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Jenis Kegiatan</FormLabel>
                        <Select name="event_type" value={formData.event_type} onChange={handleChange}>
                            <option value="Regular">Regular</option>
                            <option value="Hari_Besar">Hari Besar</option>
                            <option value="AdHoc">Ad-hoc</option>
                            <option value="Anniversary">Anniversary</option>
                            <option value="Peresmian">Peresmian</option>
                            <option value="Seasonal">Seasonal</option>
                        </Select>
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Tahun Lunar (Sui Ci)</FormLabel>
                        <Input name="lunar_sui_ci_year" value={formData.lunar_sui_ci_year} onChange={handleChange} placeholder="Masukkan tahun lunar" />
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Bulan Lunar</FormLabel>
                        <Input name="lunar_month" value={formData.lunar_month} onChange={handleChange} placeholder="Masukkan bulan lunar" />
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Hari Lunar</FormLabel>
                        <Input name="lunar_day" value={formData.lunar_day} onChange={handleChange} placeholder="Masukkan hari lunar" />
                        </FormControl>
                    </HStack>

                    <FormControl>
                        <FormLabel>Deskripsi</FormLabel>
                        <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Masukkan deskripsi kegiatan" />
                    </FormControl>

                    {/* <FormControl>
                        <Checkbox name="is_recurring" isChecked={formData.is_recurring} onChange={handleChange}>
                        Berulang
                        </Checkbox>
                    </FormControl> */}
                    </VStack>
                </form>
                </ModalBody>
                <ModalFooter>
                <Button colorScheme="blue" mr={3} type="submit" form="add-event-form" onClick={handleSubmit}>
                    Simpan Kegiatan
                </Button>
                <Button variant="ghost" onClick={onAddClose}>
                    Batal
                </Button>
                </ModalFooter>
            </ModalContent>
            </Modal>

            {/* Modal for Delete Confirmation */}
            <Modal isOpen={isConfirmOpen} onClose={onConfirmClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Konfirmasi Hapus</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                <Text>Yakin ingin menghapus kegiatan <strong>{selectedEvent?.name}</strong>?</Text>
                </ModalBody>
                <ModalFooter>
                <Button colorScheme="red" mr={3} onClick={confirmDelete}>
                    Hapus
                </Button>
                <Button variant="ghost" onClick={onConfirmClose}>
                    Batal
                </Button>
                </ModalFooter>
            </ModalContent>
            </Modal>
        </Box>
        </Layout>
    );
}