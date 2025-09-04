import {
    Box, Button, Flex, Heading, Text, IconButton, useToast,
    Tag, VStack, Divider, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    useDisclosure, FormControl, FormLabel, Input, Select,
    Textarea, HStack, Menu, MenuButton, MenuList, MenuItem,
    Collapse, Checkbox, Radio, RadioGroup,
} from "@chakra-ui/react";
import { FiEdit, FiTrash, FiPlus, FiChevronDown, FiFilter, FiMinus, FiPlus as FiPlusIcon } from "react-icons/fi";
import Layout from "@/components/layout";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

const fetchEvents = async ({ event_type = [], provinceId = [] }) => {
    try {
        const response = await axiosInstance.get("/event/filtered", {
            params: {
                event_type: event_type.length ? event_type.join(",") : undefined,
                provinceId: provinceId.length ? provinceId.join(",") : undefined,
            },
        }).catch(() => ({ data: [] }));

        if (!response.data || !Array.isArray(response.data)) {
            return [];
        }

        // Flatten occurrences into individual event entries
        const flattenedEvents = response.data.flatMap((event) =>
            event.occurrences.map((occ) => ({
                id: event.event_id,
                occurrence_id: occ.occurrence_id,
                date: new Date(occ.greg_occur_date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                }),
                day: new Date(occ.greg_occur_date)
                    .toLocaleDateString("id-ID", { weekday: "long" })
                    .split(",")[0],
                time:
                new Date(occ.greg_occur_date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                }) + " WIB",
                name: event.event_name,
                location: event.location.location_name,
                localityId: event.location.localityId,
                provinceId: event.location.locality.district.city.provinceId,
                type: event.event_type === "Hari_Besar" ? "Hari Besar" : event.event_type,
                description: event.description || "No description available",
                lunar_sui_ci_year: event.lunar_sui_ci_year || "",
                lunar_month: event.lunar_month || "",
                lunar_day: event.lunar_day || "",
                is_recurring: event.is_recurring || false,
                rawDate: new Date(occ.greg_occur_date),
                occurrences: event.occurrences.map((o) => ({
                    occurrence_id: o.occurrence_id,
                    greg_occur_date: new Date(o.greg_occur_date),
                })),
            }))
        );
        return flattenedEvents;
    } catch (error) {
        console.error("API Error in fetchEvents:", error);
        return [];
    }
};

// Fetch provinces
const fetchProvinces = async () => {
    const response = await axiosInstance.get("/profile/location/provinces");
    return response.data;
};

// Fetch cities by provinceId
const fetchCities = async (provinceId) => {
    const response = await axiosInstance.get(`/profile/location/cities?provinceId=${provinceId}`);
    return response.data;
};

// Fetch districts by cityId
const fetchDistricts = async (cityId) => {
    const response = await axiosInstance.get(`/profile/location/districts?cityId=${cityId}`);
    return response.data;
};

// Fetch localities by districtId
const fetchLocalities = async (districtId) => {
    const response = await axiosInstance.get(`/profile/location/localities?districtId=${districtId}`);
    return response.data;
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
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
    const { isOpen: isActionOpen, onOpen: onActionOpen, onClose: onActionClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [localities, setLocalities] = useState([]);
    const [isLocalityLoading, setIsLocalityLoading] = useState(false);
    const [formData, setFormData] = useState({
        event_name: "",
        event_mandarin_name: "",
        greg_occur_date: "",
        provinceId: "",
        cityId: "",
        districtId: "",
        localityId: "",
        location_name: "",
        event_type: "Regular",
        description: "",
        lunar_sui_ci_year: "",
        lunar_month: "",
        lunar_day: "",
        is_recurring: false,
    });
    const [filterOpen, setFilterOpen] = useState(false);
    const [eventTypeFilter, setEventTypeFilter] = useState([]);
    const [provinceFilter, setProvinceFilter] = useState([]);
    const [tempEventTypeFilter, setTempEventTypeFilter] = useState([]);
    const [tempProvinceFilter, setTempProvinceFilter] = useState([]);
    const [isEventTypeFilterOpen, setIsEventTypeFilterOpen] = useState(false);
    const [isProvinceFilterOpen, setIsProvinceFilterOpen] = useState(false);

  // Fetch provinces on component mount
    useEffect(() => {
        const fetchProvincesData = async () => {
            try {
                const res = await fetchProvinces();
                console.log("Fetched provinces:", res);
                setProvinces(res);
            } catch (err) {
                console.error("Failed to fetch provinces:", err);
                toast({
                title: "Gagal memuat data provinsi",
                description: err.message || "Terjadi kesalahan saat memuat data provinsi.",
                status: "error",
                duration: 3000,
                isClosable: true,
                });
            }
        };
        fetchProvincesData();
    }, [toast]);

  // Handle province change
    const handleProvinceChange = async (e) => {
        const provinceId = e.target.value;
        console.log("Province changed to:", provinceId);
        setFormData((prev) => ({
            ...prev,
            provinceId,
            cityId: "",
            districtId: "",
            localityId: "",
        }));
        setCities([]);
        setDistricts([]);
        setLocalities([]);

        if (!provinceId) return;

        try {
            const res = await fetchCities(provinceId);
            console.log("Fetched cities:", res);
            setCities(res);
        } catch (error) {
            console.error("Failed to fetch cities:", error);
            toast({
                title: "Gagal memuat data kota",
                description: error.message || "Terjadi kesalahan saat memuat data kota.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

  // Handle city change
  const handleCityChange = async (e) => {
        const cityId = e.target.value;
        consol.log("City changed to:", cityId);
        setFormData((prev) => ({
            ...prev,
            cityId,
            districtId: "",
            localityId: "",
        }));
        setDistricts([]);
        setLocalities([]);

        if (!cityId) return;

        try {
            const res = await fetchDistricts(cityId);
            console.log("Fetched districts:", res);
            setDistricts(res);
        } catch (err) {
            console.error("Failed to fetch districts:", err);
            toast({
                title: "Gagal memuat data kecamatan",
                description: err.message || "Terjadi kesalahan saat memuat data kecamatan.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

  // Handle district change
    const handleDistrictChange = async (e) => {
        const districtId = e.target.value;
        console.log("District changed to:", districtId);
        setFormData((prev) => ({
            ...prev,
            districtId,
            localityId: "",
        }));
        setLocalities([]);
        setIsLocalityLoading(true);

        if (!districtId) {
            setIsLocalityLoading(false);
            return;
        }

        try {
            const res = await fetchLocalities(districtId);
            console.log("Fetched localities:", res);
            if (res.length === 0) {
                toast({
                    title: "Tidak ada kelurahan",
                    description: "Tidak ada data kelurahan untuk kecamatan ini.",
                    status: "warning",
                    duration: 3000,
                    isClosable: true,
                });
            }
            setLocalities(res);
        } catch (err) {
            console.error("Failed to fetch localities:", err);
            toast({
                title: "Gagal memuat data kelurahan",
                description: err.message || "Terjadi kesalahan saat memuat data kelurahan.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLocalityLoading(false);
        }
    };

  // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        console.log(`Field ${name} changed to: ${value}`);
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

  // Handle radio button change for is_recurring
    const handleIsRecurringChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            is_recurring: value === "true",
        }));
    };

  // Handle filter changes
    const handleEventTypeFilterChange = (value) => {
        setTempEventTypeFilter((prev) =>
        prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value]
        );
    };

    const handleProvinceFilterChange = (value) => {
        setTempProvinceFilter((prev) =>
        prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value]
        );
    };

    const applyFilters = () => {
        setEventTypeFilter([...tempEventTypeFilter]);
        setProvinceFilter([...tempProvinceFilter]);
        setFilterOpen(false);
        queryClient.invalidateQueries({ queryKey: ["events"] });
    };

    const clearFilters = () => {
        setTempEventTypeFilter([]);
        setTempProvinceFilter([]);
        setEventTypeFilter([]);
        setProvinceFilter([]);
        setFilterOpen(false);
        queryClient.invalidateQueries({ queryKey: ["events"] });
    };

    const { data: events = [], isLoading, error } = useQuery({
        queryKey: ["events", { event_type: eventTypeFilter, provinceId: provinceFilter }],
        queryFn: () => fetchEvents({ event_type: eventTypeFilter, provinceId: provinceFilter }),
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
            onActionClose();
            onConfirmClose();
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || error.message || "Gagal menghapus kegiatan.";
            console.error("Delete Error Details:", {
                message: errorMessage,
                status: error.response?.status,
                data: error.response?.data,
                requestId: error.response?.headers?.["x-request-id"],
                eventId: selectedEvent?.id,
            });
            toast({
                title: "Error",
                description: `${errorMessage} Periksa konsol untuk detail. Hubungi admin jika masalah berlanjut.`,
                status: "error",
                duration: 6000,
                isClosable: true,
            });
            onConfirmClose();
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
            onEditClose();
            onDetailClose();
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || error.message || "Gagal memperbarui kegiatan.";
            console.error("Update Error:", {
                message: errorMessage,
                status: error.response?.status,
                data: error.response?.data,
                requestId: error.response?.headers?.["x-request-id"],
            });
            toast({
                title: "Error",
                description: `${errorMessage} Periksa konsol untuk detail.`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        },
    });

    const handleEdit = (name) => {
        if (selectedEvent) {
            const localDateTime = selectedEvent.rawDate.toLocaleString("sv-SE", {
                timeZone: "Asia/Jakarta",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }).replace(" ", "T");

            console.log("Selected event localityId:", selectedEvent.localityId);
            setFormData({
                event_name: selectedEvent.name,
                event_mandarin_name: selectedEvent.event_mandarin_name || "",
                greg_occur_date: localDateTime,
                provinceId: selectedEvent.provinceId ? selectedEvent.provinceId.toString() : "",
                cityId: "",
                districtId: "",
                localityId: selectedEvent.localityId ? selectedEvent.localityId.toString() : "",
                location_name: selectedEvent.location,
                event_type: selectedEvent.type === "Hari Besar" ? "Hari_Besar" : selectedEvent.type,
                description: selectedEvent.description,
                lunar_sui_ci_year: selectedEvent.lunar_sui_ci_year,
                lunar_month: selectedEvent.lunar_month,
                lunar_day: selectedEvent.lunar_day,
                is_recurring: selectedEvent.is_recurring || false,
            });
            // Optionally, log all occurrences to help users see them
            console.log("All occurrences for this event:", selectedEvent.occurrences);
            onEditOpen();
        }
    };

    const handleDelete = (id, name) => {
        if (selectedEvent) {
            setSelectedEvent({ ...selectedEvent, id, name });
            onConfirmOpen();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form data before submission:", formData);
        console.log("Localities state:", localities);
        console.log("Is locality loading?", isLocalityLoading);
        console.log("Raw localityId:", formData.localityId, "Parsed localityId:", parseInt(formData.localityId));

        if ( !formData.event_name ||
            !formData.greg_occur_date ||
            !formData.location_name ||
            !formData.event_type ||
            !formData.lunar_sui_ci_year ||
            !formData.lunar_month ||
            !formData.lunar_day ||
            !formData.provinceId ||
            !formData.cityId ||
            !formData.districtId ||
            !formData.localityId
        ) {
            toast({
                title: "Error",
                description: "Semua field wajib diisi kecuali Nama Kegiatan (Mandarin) dan Deskripsi.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const provinceId = parseInt(formData.provinceId);
        const cityId = parseInt(formData.cityId);
        const districtId = parseInt(formData.districtId);
        const localityId = parseInt(formData.localityId);

        if ( isNaN(provinceId) ||
            isNaN(cityId) ||
            isNaN(districtId) ||
            isNaN(localityId)
        ) {
            toast({
                title: "Error",
                description: `Semua ID lokasi harus berupa angka. Province: ${formData.provinceId}, City: ${formData.cityId}, District: ${formData.districtId}, Locality: ${formData.localityId}`,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (isLocalityLoading) {
            toast({
                title: "Error",
                description: "Data kelurahan masih dimuat. Tunggu sebentar.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Generate occurrences for recurring events
        const occurrences = [
            {
                greg_occur_date: new Date(formData.greg_occur_date).toISOString(),
            },
        ];

        if (formData.is_recurring) {
            const startDate = new Date(formData.greg_occur_date);
            const endOfNextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0); // Last day of next month
            let currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + 7); // Start from next week

            while (currentDate <= endOfNextMonth) {
                occurrences.push({
                greg_occur_date: new Date(currentDate).toISOString(),
                });
                currentDate.setDate(currentDate.getDate() + 7);
            }
        }

        const payload = {
            event_name: formData.event_name,
            event_mandarin_name: formData.event_mandarin_name || null,
            localityId: localityId,
            location_name: formData.location_name,
            provinceId: provinceId,
            cityId: cityId,
            districtId: districtId,
            event_type: formData.event_type,
            description: formData.description || null,
            lunar_sui_ci_year: formData.lunar_sui_ci_year,
            lunar_month: formData.lunar_month,
            lunar_day: formData.lunar_day,
            is_recurring: formData.is_recurring,
            occurrences,
        };

        try {
            console.log("Sending payload:", JSON.stringify(payload, null, 2));
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
                provinceId: "",
                cityId: "",
                districtId: "",
                localityId: "",
                location_name: "",
                event_type: "Regular",
                description: "",
                lunar_sui_ci_year: "",
                lunar_month: "",
                lunar_day: "",
                is_recurring: false,
            });
            setCities([]);
            setDistricts([]);
            setLocalities([]);
            onAddClose();
            queryClient.invalidateQueries({ queryKey: ["events"] });
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Gagal menambahkan kegiatan.";
            console.error("Submit Error:", {
                message: errorMessage,
                status: error.response?.status,
                data: error.response?.data,
                requestId: error.response?.headers?.["x-request-id"],
                payload: JSON.stringify(payload, null, 2),
            });
            toast({
                title: "Error",
                description: `${errorMessage} Periksa konsol untuk detail.`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        console.log("Form data before update:", formData);
        console.log("Localities state:", localities);
        console.log("Is locality loading?", isLocalityLoading);
        console.log("Raw localityId:", formData.localityId, "Parsed localityId:", parseInt(formData.localityId));

        if (
        !formData.event_name ||
        !formData.greg_occur_date ||
        !formData.location_name ||
        !formData.event_type ||
        !formData.lunar_sui_ci_year ||
        !formData.lunar_month ||
        !formData.lunar_day ||
        !formData.provinceId ||
        !formData.cityId ||
        !formData.districtId ||
        !formData.localityId
        ) {
        toast({
            title: "Error",
            description: "Semua field wajib diisi kecuali Nama Kegiatan (Mandarin) dan Deskripsi.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }

        const provinceId = parseInt(formData.provinceId);
        const cityId = parseInt(formData.cityId);
        const districtId = parseInt(formData.districtId);
        const localityId = parseInt(formData.localityId);

        if (
        isNaN(provinceId) ||
        isNaN(cityId) ||
        isNaN(districtId) ||
        isNaN(localityId)
        ) {
        toast({
            title: "Error",
            description: `Semua ID lokasi harus berupa angka. Province: ${formData.provinceId}, City: ${formData.cityId}, District: ${formData.districtId}, Locality: ${formData.localityId}`,
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }

        if (isLocalityLoading) {
        toast({
            title: "Error",
            description: "Data kelurahan masih dimuat. Tunggu sebentar.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
        }

        // Generate occurrences for recurring events
        const occurrences = [
        {
            greg_occur_date: new Date(formData.greg_occur_date).toISOString(),
        },
        ];

        if (formData.is_recurring) {
        const startDate = new Date(formData.greg_occur_date);
        const endOfNextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0); // Last day of next month
        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 7); // Start from next week

        while (currentDate <= endOfNextMonth) {
            occurrences.push({
            greg_occur_date: new Date(currentDate).toISOString(),
            });
            currentDate.setDate(currentDate.getDate() + 7);
        }
        }

        const payload = {
        event_name: formData.event_name,
        event_mandarin_name: formData.event_mandarin_name || null,
        localityId: localityId,
        location_name: formData.location_name,
        provinceId: provinceId,
        cityId: cityId,
        districtId: districtId,
        event_type: formData.event_type,
        description: formData.description || null,
        lunar_sui_ci_year: formData.lunar_sui_ci_year,
        lunar_month: formData.lunar_month,
        lunar_day: formData.lunar_day,
        is_recurring: formData.is_recurring,
        occurrences,
        };

        try {
        console.log("Sending update payload:", JSON.stringify(payload, null, 2));
        await updateMutation.mutateAsync({ id: selectedEvent.id, payload });
        setCities([]);
        setDistricts([]);
        setLocalities([]);
        onActionClose();
        } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Gagal memperbarui kegiatan.";
        console.error("Update Error:", {
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data,
            requestId: error.response?.headers?.["x-request-id"],
            payload: JSON.stringify(payload, null, 2),
        });
        toast({
            title: "Error",
            description: `${errorMessage} Periksa konsol untuk detail.`,
            status: "error",
            duration: 5000,
            isClosable: true,
        });
        }
    };

    const resetFormData = () => {
        setFormData({
            event_name: "",
            event_mandarin_name: "",
            greg_occur_date: "",
            provinceId: "",
            cityId: "",
            districtId: "",
            localityId: "",
            location_name: "",
            event_type: "Regular",
            description: "",
            lunar_sui_ci_year: "",
            lunar_month: "",
            lunar_day: "",
            is_recurring: false,
        });
        setCities([]);
        setDistricts([]);
        setLocalities([]);
        setIsLocalityLoading(false);
    };

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const endOfNextMonth = new Date(currentYear, currentMonth + 2, 0); // Last day of next month

    const filteredEvents = events
        .filter((event) => {
            const eventMonth = event.rawDate.getMonth();
            const eventYear = event.rawDate.getFullYear();

            if (filter === "Bulan lalu") {
                return eventYear < currentYear || (eventYear === currentYear && eventMonth < currentMonth);
            }
            if (filter === "Bulan ini") {
                return eventYear === currentYear && eventMonth === currentMonth;
            }
            if (filter === "Bulan depan") {
                return eventYear === currentYear && eventMonth === currentMonth + 1;
            }
            return event.rawDate <= endOfNextMonth; // Show all events up to the end of next month
        })
        .sort((a, b) => a.rawDate.getDate() - b.rawDate.getDate());

    const lunarYears = ["乙巳年"];
    const lunarMonths = [
        "一月",
        "二月",
        "三月",
        "四月",
        "五月",
        "六月",
        "七月",
        "八月",
        "九月",
        "十月",
        "十一月",
        "十二月",
    ];
    const lunarDays = [
        "初一日",
        "初二日",
        "初三日",
        "初四日",
        "初五日",
        "初六日",
        "初七日",
        "初八日",
        "初九日",
        "十日",
        "十一日",
        "十二日",
        "十三日",
        "十四日",
        "十五日",
        "十六日",
        "十七日",
        "十八日",
        "十九日",
        "二十日",
        "二十一日",
        "二十二日",
        "二十三日",
        "二十四日",
        "二十五日",
        "二十六日",
        "二十七日",
        "二十八日",
        "二十九日",
        "三十日",
    ];

    const eventTypes = ["Regular", "Hari_Besar", "AdHoc", "Anniversary", "Peresmian", "Seasonal"];

    return (
        <Layout title="Kegiatan">
        <Box p={2}>
            <Flex justify="space-between" align="center" mb={6}>
            <Heading size="md">
                {currentDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
                })}
            </Heading>
            <Flex gap={2} align="center">
                <Box position="relative">
                <Button
                    colorScheme="white"
                    textColor="gray.700"
                    borderRadius={16}
                    borderWidth="1px"
                    borderColor="gray.400"
                    size="sm"
                    leftIcon={<FiFilter />}
                    onClick={() => setFilterOpen(!filterOpen)}
                >
                    Filter
                </Button>
                {filterOpen && (
                    <VStack
                    spacing={2}
                    p={4}
                    bg="white"
                    borderRadius="md"
                    boxShadow="md"
                    zIndex={10}
                    align="stretch"
                    w="300px"
                    position="absolute"
                    top="100%"
                    left={0}
                    mt={1}
                    >
                    <FormControl>
                        <Flex align="center" justify="space-between">
                        <FormLabel mb={0}>Jenis Kegiatan</FormLabel>
                        <IconButton
                            size="xs"
                            variant="ghost"
                            aria-label={isEventTypeFilterOpen ? "Hide event type filter" : "Show event type filter"}
                            icon={isEventTypeFilterOpen ? <FiMinus /> : <FiPlusIcon />}
                            onClick={() => setIsEventTypeFilterOpen(!isEventTypeFilterOpen)}
                            _hover={{ bg: "transparent" }}
                        />
                        </Flex>
                        <Collapse in={isEventTypeFilterOpen} animateOpacity>
                        <VStack align="start" spacing={1}>
                            {eventTypes.map((type) => (
                            <Checkbox
                                key={type}
                                isChecked={tempEventTypeFilter.includes(type)}
                                onChange={() => handleEventTypeFilterChange(type)}
                            >
                                {type === "Hari_Besar" ? "Hari Besar" : type}
                            </Checkbox>
                            ))}
                        </VStack>
                        </Collapse>
                    </FormControl>

                    <FormControl>
                        <Flex align="center" justify="space-between">
                        <FormLabel mb={0}>Provinsi</FormLabel>
                        <IconButton
                            size="xs"
                            variant="ghost"
                            aria-label={isProvinceFilterOpen ? "Hide province filter" : "Show province filter"}
                            icon={isProvinceFilterOpen ? <FiMinus /> : <FiPlusIcon />}
                            onClick={() => setIsProvinceFilterOpen(!isProvinceFilterOpen)}
                            _hover={{ bg: "transparent" }}
                        />
                        </Flex>
                        <Collapse in={isProvinceFilterOpen} animateOpacity>
                        <VStack align="start" spacing={1}>
                            {provinces.map((province) => (
                            <Checkbox
                                key={province.id}
                                isChecked={tempProvinceFilter.includes(province.id.toString())}
                                onChange={() => handleProvinceFilterChange(province.id.toString())}
                            >
                                {province.name}
                            </Checkbox>
                            ))}
                        </VStack>
                        </Collapse>
                    </FormControl>

                    <HStack justify="flex-end" spacing={2}>
                        <Button size="sm" onClick={clearFilters}>Reset</Button>
                        <Button size="sm" onClick={() => setFilterOpen(false)}>Cancel</Button>
                        <Button size="sm" colorScheme="blue" onClick={applyFilters}>Terapkan</Button>
                    </HStack>
                    </VStack>
                )}
                </Box>
                <Button
                colorScheme="blue"
                leftIcon={<FiPlus />}
                onClick={() => {
                    resetFormData();
                    onAddOpen();
                }}
                size="sm"
                >
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
                    <MenuItem onClick={() => setFilter("Semua")}>Semua</MenuItem>
                </MenuList>
                </Menu>
            </Flex>
            </Flex>

            <Divider borderBottomWidth="2px" />

            {isLoading ? (
            <VStack h="70vh" justify="center" align="center">
                <Text fontSize="xl" textAlign="center">
                Loading...
                </Text>
            </VStack>
            ) : error ? (
            <VStack h="70vh" justify="center" align="center">
                <Text fontSize="xl" textAlign="center">
                Error loading events: {error.message}
                </Text>
            </VStack>
            ) : filteredEvents.length === 0 ? (
            <VStack h="70vh" justify="center" align="center">
                <Text fontSize="xl" textAlign="center">
                Tidak ada kegiatan untuk saat ini
                </Text>
            </VStack>
            ) : (
            filteredEvents.map((event, index) => (
                <Box
                    key={`${event.id}-${event.occurrence_id}`} // Unique key for each occurrence
                    bg="white"
                    p={4}
                    mb={4}
                    borderRadius="md"
                    boxShadow="sm"
                    border="1px solid #e2e8f0"
                    onClick={() => openActionPopup(event)}
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                >
                    <Flex align="stretch" gap={4}>
                    <Box
                        bg="gray.100"
                        p={4}
                        borderRadius="md"
                        minWidth="80px"
                        display="flex"
                        flexDirection="column"
                        justifyContent="flex-start"
                    >
                        <Text fontWeight="bold" color="gray.600">
                        {event.date}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                        {event.day}
                        </Text>
                    </Box>
                    <Box flex="1">
                        <Text fontSize="lg" fontWeight="bold" color="#2e05e8ff">
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
                        {event.is_recurring && (
                            <Tag size="sm" colorScheme="green" borderRadius="full">
                            Berulang
                            </Tag>
                        )}
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
                <Text mb={2}>
                    <strong>Tanggal:</strong> {selectedEvent?.day}, {selectedEvent?.date}
                </Text>
                <Text my={2}>
                    <strong>Tanggal Lunar:</strong> {selectedEvent?.lunar_sui_ci_year} {selectedEvent?.lunar_month}{" "}
                    {selectedEvent?.lunar_day}
                </Text>
                <Text my={2}>
                    <strong>Waktu:</strong> {selectedEvent?.time}
                </Text>
                <Text my={2}>
                    <strong>Lokasi:</strong> {selectedEvent?.location}
                </Text>
                <Text my={2}>
                    <strong>Jenis:</strong> {selectedEvent?.type}
                </Text>
                <Text my={2}>
                    <strong>Berulang:</strong> {selectedEvent?.is_recurring ? "Ya" : "Tidak"}
                </Text>
                <Text my={2}>
                    <strong>Deskripsi:</strong> {selectedEvent?.description}
                </Text>
                </ModalBody>
                <ModalFooter>
                <Flex w="100%" justifyContent="space-between">
                    <Button
                    colorScheme="green"
                    leftIcon={<FiEdit />}
                    onClick={() => handleEdit(selectedEvent?.name)}
                    flex="1"
                    mr={2}
                    >
                    Edit
                    </Button>
                    <Button
                    colorScheme="red"
                    leftIcon={<FiTrash />}
                    onClick={() => handleDelete(selectedEvent?.id, selectedEvent?.name)}
                    flex="1"
                    ml={2}
                    >
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
                <Text mb={2}>
                    <strong>Tanggal:</strong> {selectedEvent?.day}, {selectedEvent?.date}
                </Text>
                <Text my={2}>
                    <strong>Tanggal Lunar:</strong> {selectedEvent?.lunar_sui_ci_year} {selectedEvent?.lunar_month}{" "}
                    {selectedEvent?.lunar_day}
                </Text>
                <Text my={2}>
                    <strong>Waktu:</strong> {selectedEvent?.time}
                </Text>
                <Text my={2}>
                    <strong>Lokasi:</strong> {selectedEvent?.location}
                </Text>
                <Text my={2}>
                    <strong>Jenis:</strong> {selectedEvent?.type}
                </Text>
                <Text my={2}>
                    <strong>Berulang:</strong> {selectedEvent?.is_recurring ? "Ya" : "Tidak"}
                </Text>
                <Text my={2}>
                    <strong>Deskripsi:</strong> {selectedEvent?.description}
                </Text>
                </ModalBody>
                <ModalFooter>
                <Flex w="100%" justifyContent="space-between">
                    <Button
                    colorScheme="green"
                    leftIcon={<FiEdit />}
                    onClick={() => handleEdit(selectedEvent?.name)}
                    flex="1"
                    mr={2}
                    >
                    Edit
                    </Button>
                    <Button
                    colorScheme="red"
                    leftIcon={<FiTrash />}
                    onClick={() => handleDelete(selectedEvent?.id, selectedEvent?.name)}
                    flex="1"
                    ml={2}
                    >
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
                <form id="edit-event-form" onSubmit={handleUpdate}>
                    <VStack spacing={6} align="stretch">
                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Nama Kegiatan</FormLabel>
                        <Input
                            name="event_name"
                            value={formData.event_name}
                            onChange={handleChange}
                            placeholder="Masukkan nama kegiatan"
                        />
                        </FormControl>
                        <FormControl flex={1}>
                        <FormLabel>Nama Kegiatan (Mandarin)</FormLabel>
                        <Input
                            name="event_mandarin_name"
                            value={formData.event_mandarin_name}
                            onChange={handleChange}
                            placeholder="Masukkan nama kegiatan (Mandarin)"
                        />
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired>
                        <FormLabel>Tanggal dan Waktu</FormLabel>
                        <Input
                            name="greg_occur_date"
                            value={formData.greg_occur_date}
                            onChange={handleChange}
                            type="datetime-local"
                            placeholder="Pilih tanggal dan waktu"
                        />
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Nama Lokasi</FormLabel>
                        <Input
                            name="location_name"
                            value={formData.location_name}
                            onChange={handleChange}
                            placeholder="Masukkan nama lokasi"
                        />
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
                        <FormLabel>Provinsi</FormLabel>
                        <Select
                            name="provinceId"
                            value={formData.provinceId}
                            onChange={handleProvinceChange}
                            placeholder={provinces.length === 0 ? "Memuat provinsi..." : "Pilih provinsi"}
                            isDisabled={provinces.length === 0}
                        >
                            {provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                                {province.name}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Kota</FormLabel>
                        <Select
                            name="cityId"
                            value={formData.cityId}
                            onChange={handleCityChange}
                            placeholder={cities.length === 0 ? (formData.provinceId ? "Memuat kota..." : "Pilih provinsi terlebih dahulu") : "Pilih kota"}
                            isDisabled={!formData.provinceId}
                        >
                            {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                                {city.name}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Kecamatan</FormLabel>
                        <Select
                            name="districtId"
                            value={formData.districtId}
                            onChange={handleDistrictChange}
                            placeholder={districts.length === 0 ? (formData.cityId ? "Memuat kecamatan..." : "Pilih kota terlebih dahulu") : "Pilih kecamatan"}
                            isDisabled={!formData.cityId}
                        >
                            {districts.map((district) => (
                            <option key={district.id} value={district.id}>
                                {district.name}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Kelurahan</FormLabel>
                        <Select
                            name="localityId"
                            value={formData.localityId}
                            onChange={handleChange}
                            placeholder={localities.length === 0 ? (formData.districtId ? "Memuat kelurahan..." : "Pilih kecamatan terlebih dahulu") : "Pilih kelurahan"}
                            isDisabled={!formData.districtId || isLocalityLoading}
                        >
                            {localities.map((locality) => (
                            <option key={locality.id} value={locality.id}>
                                {locality.name}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Tahun Lunar (Sui Ci)</FormLabel>
                        <Select
                            name="lunar_sui_ci_year"
                            value={formData.lunar_sui_ci_year}
                            onChange={handleChange}
                            placeholder="Pilih tahun lunar"
                        >
                            {lunarYears.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Bulan Lunar</FormLabel>
                        <Select
                            name="lunar_month"
                            value={formData.lunar_month}
                            onChange={handleChange}
                            placeholder="Pilih bulan lunar"
                        >
                            {lunarMonths.map((month) => (
                            <option key={month} value={month}>
                                {month}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Hari Lunar</FormLabel>
                        <Select
                            name="lunar_day"
                            value={formData.lunar_day}
                            onChange={handleChange}
                            placeholder="Pilih hari lunar"
                        >
                            {lunarDays.map((day) => (
                            <option key={day} value={day}>
                                {day}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                    </HStack>

                    <FormControl>
                        <FormLabel>Deskripsi</FormLabel>
                        <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Masukkan deskripsi kegiatan"
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel>Apakah kegiatan ini berulang?</FormLabel>
                        <RadioGroup
                        name="is_recurring"
                        value={formData.is_recurring.toString()}
                        onChange={handleIsRecurringChange}
                        >
                        <HStack spacing={4}>
                            <Radio value="false">Tidak</Radio>
                            <Radio value="true">Ya</Radio>
                        </HStack>
                        </RadioGroup>
                    </FormControl>
                    </VStack>
                </form>
                </ModalBody>
                <ModalFooter>
                <Button colorScheme="blue" mr={3} type="submit" form="edit-event-form">
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
                <form id="add-event-form" onSubmit={handleSubmit}>
                    <VStack spacing={6} align="stretch">
                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Nama Kegiatan</FormLabel>
                        <Input
                            name="event_name"
                            value={formData.event_name}
                            onChange={handleChange}
                            placeholder="Masukkan nama kegiatan"
                        />
                        </FormControl>
                        <FormControl flex={1}>
                        <FormLabel>Nama Kegiatan (Mandarin)</FormLabel>
                        <Input
                            name="event_mandarin_name"
                            value={formData.event_mandarin_name}
                            onChange={handleChange}
                            placeholder="Masukkan nama kegiatan (Mandarin)"
                        />
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired>
                        <FormLabel>Tanggal dan Waktu</FormLabel>
                        <Input
                            name="greg_occur_date"
                            value={formData.greg_occur_date}
                            onChange={handleChange}
                            type="datetime-local"
                            placeholder="Pilih tanggal dan waktu"
                        />
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Nama Lokasi</FormLabel>
                        <Input
                            name="location_name"
                            value={formData.location_name}
                            onChange={handleChange}
                            placeholder="Masukkan nama lokasi"
                        />
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
                        <FormLabel>Provinsi</FormLabel>
                        <Select
                            name="provinceId"
                            value={formData.provinceId}
                            onChange={handleProvinceChange}
                            placeholder={provinces.length === 0 ? "Memuat provinsi..." : "Pilih provinsi"}
                            isDisabled={provinces.length === 0}
                        >
                            {provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                                {province.name}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Kota</FormLabel>
                        <Select
                            name="cityId"
                            value={formData.cityId}
                            onChange={handleCityChange}
                            placeholder={cities.length === 0 ? (formData.provinceId ? "Memuat kota..." : "Pilih provinsi terlebih dahulu") : "Pilih kota"}
                            isDisabled={!formData.provinceId}
                        >
                            {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                                {city.name}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Kecamatan</FormLabel>
                        <Select
                            name="districtId"
                            value={formData.districtId}
                            onChange={handleDistrictChange}
                            placeholder={districts.length === 0 ? (formData.cityId ? "Memuat kecamatan..." : "Pilih kota terlebih dahulu") : "Pilih kecamatan"}
                            isDisabled={!formData.cityId}
                        >
                            {districts.map((district) => (
                            <option key={district.id} value={district.id}>
                                {district.name}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Kelurahan</FormLabel>
                        <Select
                            name="localityId"
                            value={formData.localityId}
                            onChange={handleChange}
                            placeholder={localities.length === 0 ? (formData.districtId ? "Memuat kelurahan..." : "Pilih kecamatan terlebih dahulu") : "Pilih kelurahan"}
                            isDisabled={!formData.districtId || isLocalityLoading}
                        >
                            {localities.map((locality) => (
                            <option key={locality.id} value={locality.id}>
                                {locality.name}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                    </HStack>

                    <HStack spacing={4}>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Tahun Lunar (Sui Ci)</FormLabel>
                        <Select
                            name="lunar_sui_ci_year"
                            value={formData.lunar_sui_ci_year}
                            onChange={handleChange}
                            placeholder="Pilih tahun lunar"
                        >
                            {lunarYears.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Bulan Lunar</FormLabel>
                        <Select
                            name="lunar_month"
                            value={formData.lunar_month}
                            onChange={handleChange}
                            placeholder="Pilih bulan lunar"
                        >
                            {lunarMonths.map((month) => (
                            <option key={month} value={month}>
                                {month}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                        <FormControl isRequired flex={1}>
                        <FormLabel>Hari Lunar</FormLabel>
                        <Select
                            name="lunar_day"
                            value={formData.lunar_day}
                            onChange={handleChange}
                            placeholder="Pilih hari lunar"
                        >
                            {lunarDays.map((day) => (
                            <option key={day} value={day}>
                                {day}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                    </HStack>

                    <FormControl>
                        <FormLabel>Deskripsi</FormLabel>
                        <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Masukkan deskripsi kegiatan"
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel>Apakah kegiatan ini berulang?</FormLabel>
                        <RadioGroup
                        name="is_recurring"
                        value={formData.is_recurring.toString()}
                        onChange={handleIsRecurringChange}
                        >
                        <HStack spacing={4}>
                            <Radio value="false">Tidak</Radio>
                            <Radio value="true">Ya</Radio>
                        </HStack>
                        </RadioGroup>
                    </FormControl>
                    </VStack>
                </form>
                </ModalBody>
                <ModalFooter>
                <Button colorScheme="blue" mr={3} type="submit" form="add-event-form">
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
                <Text>
                    Yakin ingin menghapus kegiatan <strong>{selectedEvent?.name}</strong>?
                </Text>
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