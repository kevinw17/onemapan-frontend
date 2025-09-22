import {
  Box, Button, Flex, Heading, Text, IconButton, useToast,
  Tag, VStack, Divider, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Select, Textarea, HStack,
  Menu, MenuButton, MenuList, MenuItem, Collapse, Checkbox,
  Radio, RadioGroup, Image, Spinner,
  useDisclosure
} from "@chakra-ui/react";
import { FiEdit, FiTrash, FiPlus, FiChevronDown, FiFilter, FiMinus, FiPlus as FiPlusIcon } from "react-icons/fi";
import Layout from "@/components/layout";
import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useFetchEvents } from "@/features/event/useFetchEvents";
import { useDeleteEvent } from "@/features/event/useDeleteEvent";
import { useFetchProvinces, useFetchCities, useFetchDistricts, useFetchLocalities } from "@/features/location/useFetchLocations";
import { useEventForm } from "@/features/event/useEventForm";
import { useEventFilter } from "@/features/event/useEventFilter";
import { useImageUpload } from "@/features/event/useImageUpload";
import { axiosInstance } from "@/lib/axios";

const lunarYears = ["乙巳年"];
const lunarMonths = [
  "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月",
];
const lunarDays = [
  "初一日", "初二日", "初三日", "初四日", "初五日", "初六日", "初七日", "初八日", "初九日", "十日",
  "十一日", "十二日", "十三日", "十四日", "十五日", "十六日", "十七日", "十八日", "十九日", "二十日",
  "二十一日", "二十二日", "二十三日", "二十四日", "二十五日", "二十六日", "二十七日", "二十八日", "二十九日", "三十日",
];
const eventTypes = ["Regular", "Hari_Besar", "AdHoc", "Anniversary", "Peresmian", "Seasonal"];

const EventList = ({ events, isLoading, error, filter, onEventClick }) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const endOfNextMonth = new Date(currentYear, currentMonth + 2, 0);

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
      return event.rawDate <= endOfNextMonth;
    })
    .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

  if (isLoading) {
    return (
      <VStack h="70vh" justify="center" align="center">
        <Spinner size="xl" />
        <Text fontSize="xl" textAlign="center">Memuat kegiatan...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack h="70vh" justify="center" align="center">
        <Text fontSize="xl" textAlign="center">Error memuat kegiatan: {error.message}</Text>
      </VStack>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <VStack h="70vh" justify="center" align="center">
        <Text fontSize="xl" textAlign="center">Tidak ada kegiatan untuk saat ini</Text>
      </VStack>
    );
  }

  return filteredEvents.map((event) => (
    <Box
      key={`${event.id}-${event.occurrence_id}`}
      bg="white"
      p={4}
      mb={4}
      borderRadius="md"
      boxShadow="sm"
      border="1px solid #e2e8f0"
      onClick={() => onEventClick(event)}
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
          <Text fontWeight="bold" color="gray.600">{event.date}</Text>
          <Text fontSize="sm" color="gray.500">{event.day}</Text>
        </Box>
        <Box flex="1">
          <Text fontSize="lg" fontWeight="bold" color="#2e05e8ff">{event.time}</Text>
          <Text mt={1}>{event.name}</Text>
          <Text color="gray.500" mt={1}>{event.location || "Unknown Location"}</Text>
          <Flex mt={2} align="center" gap={2}>
            <Tag size="sm" colorScheme="blue" borderRadius="full">{event.type}</Tag>
            {event.is_recurring && (
              <Tag size="sm" colorScheme="green" borderRadius="full">Berulang</Tag>
            )}
          </Flex>
        </Box>
      </Flex>
    </Box>
  ));
};

const EventDetailModal = ({ isOpen, onClose, event, onEdit, onDelete, imageUrl }) => {
  const toast = useToast();
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxW="600px">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{event?.name || "Detail Kegiatan"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {event?.poster_s3_bucket_link && (
            <Box mb={4} display="flex" justifyContent="center">
              <Image
                src={imageUrl}
                alt={`Poster untuk ${event.name}`}
                fallbackSrc="https://via.placeholder.com/400"
                style={{
                  width: "auto",
                  maxWidth: "400px",
                  height: "auto",
                  maxHeight: "600px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
                onError={() => {
                  toast({
                    title: "Gagal Memuat Gambar",
                    description: `Tidak dapat memuat poster untuk ${event.name}.`,
                    status: "warning",
                    duration: 3000,
                    isClosable: true,
                  });
                }}
              />
            </Box>
          )}
          <Text mb={2}><strong>Tanggal:</strong> {event?.day}, {event?.date}</Text>
          <Text my={2}><strong>Tanggal Lunar:</strong> {event?.lunar_sui_ci_year} {event?.lunar_month} {event?.lunar_day}</Text>
          <Text my={2}><strong>Waktu:</strong> {event?.time}</Text>
          <Text my={2}><strong>Lokasi:</strong> {event?.location || "Unknown Location"}</Text>
          <Text my={2}><strong>Jenis:</strong> {event?.type}</Text>
          <Text my={2}><strong>Berulang:</strong> {event?.is_recurring ? "Ya" : "Tidak"}</Text>
          <Text my={2}><strong>Deskripsi:</strong> {event?.description}</Text>
        </ModalBody>
        <ModalFooter>
          <Flex w="100%" justifyContent="space-between">
            <Button
              colorScheme="green"
              leftIcon={<FiEdit />}
              onClick={() => onEdit(event)}
              flex="1"
              mr={2}
            >
              Edit
            </Button>
            <Button
              colorScheme="red"
              leftIcon={<FiTrash />}
              onClick={() => onDelete(event)}
              flex="1"
              ml={2}
            >
              Hapus
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const EventForm = ({ isOpen, onClose, onSubmit, formData, handleChange, handleProvinceChange, handleCityChange, handleDistrictChange, handleIsRecurringChange, handleImageChange, isSubmitting, isImageLoaded, previewImage, setPreviewImage, cropperRef, provinces, cities, districts, localities, isProvincesLoading, isCitiesLoading, isDistrictsLoading, isLocalitiesLoading, title }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form id={title.toLowerCase().replace(" ", "-") + "-form"} onSubmit={onSubmit}>
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
                <FormControl isRequired flex={1}>
                  <FormLabel>Tanggal dan Waktu Mulai</FormLabel>
                  <Input
                    name="greg_occur_date"
                    value={formData.greg_occur_date}
                    onChange={handleChange}
                    type="datetime-local"
                    placeholder="Pilih tanggal dan waktu mulai"
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel>Tanggal dan Waktu Selesai</FormLabel>
                  <Input
                    name="greg_end_date"
                    value={formData.greg_end_date}
                    onChange={handleChange}
                    type="datetime-local"
                    placeholder="Pilih tanggal dan waktu selesai (opsional)"
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
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>{type === "Hari_Besar" ? "Hari Besar" : type}</option>
                    ))}
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
                    placeholder={isProvincesLoading ? "Memuat provinsi..." : "Pilih provinsi"}
                    isDisabled={isProvincesLoading}
                  >
                    {provinces.map((province) => (
                      <option key={province.id} value={province.id}>{province.name}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired flex={1}>
                  <FormLabel>Kota</FormLabel>
                  <Select
                    name="cityId"
                    value={formData.cityId}
                    onChange={handleCityChange}
                    placeholder={isCitiesLoading ? "Memuat kota..." : formData.provinceId ? "Pilih kota" : "Pilih provinsi terlebih dahulu"}
                    isDisabled={isCitiesLoading || !formData.provinceId}
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
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
                    placeholder={isDistrictsLoading ? "Memuat kecamatan..." : formData.cityId ? "Pilih kecamatan" : "Pilih kota terlebih dahulu"}
                    isDisabled={isDistrictsLoading || !formData.cityId}
                  >
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired flex={1}>
                  <FormLabel>Kelurahan</FormLabel>
                  <Select
                    name="localityId"
                    value={formData.localityId}
                    onChange={handleChange}
                    placeholder={isLocalitiesLoading ? "Memuat kelurahan..." : formData.districtId ? "Pilih kelurahan" : "Pilih kecamatan terlebih dahulu"}
                    isDisabled={isLocalitiesLoading || !formData.districtId}
                  >
                    {localities.map((locality) => (
                      <option key={locality.id} value={locality.id}>{locality.name}</option>
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
                      <option key={year} value={year}>{year}</option>
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
                      <option key={month} value={month}>{month}</option>
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
                      <option key={day} value={day}>{day}</option>
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
              <FormControl>
                <FormLabel>Poster</FormLabel>
                <Input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                />
                {isImageLoaded && previewImage && (
                  <Box mt={4}>
                    <Cropper
                      src={previewImage}
                      style={{ height: 400, width: "100%" }}
                      autoCrop={false}
                      responsive={true}
                      ref={cropperRef}
                    />
                  </Box>
                )}
              </FormControl>
              <FormControl>
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
          <Button
            colorScheme="blue"
            type="submit"
            form={title.toLowerCase().replace(" ", "-") + "-form"}
            isLoading={isSubmitting}
            loadingText={title === "Buat Kegiatan Baru" ? "Menambahkan..." : "Menyimpan..."}
          >
            {title === "Buat Kegiatan Baru" ? "Tambah Kegiatan" : "Simpan Perubahan"}
          </Button>
          <Button variant="ghost" onClick={onClose} ml={3}>Batal</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, eventName, isDeleting }) => (
  <Modal isOpen={isOpen} onClose={onClose} maxW="600px">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Konfirmasi Hapus</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>Apakah Anda yakin ingin menghapus kegiatan {eventName}?</Text>
      </ModalBody>
      <ModalFooter>
        <Button
          colorScheme="red"
          onClick={onConfirm}
          isLoading={isDeleting}
        >
          Hapus
        </Button>
        <Button variant="ghost" onClick={onClose} ml={3}>Batal</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default function Event() {
  const toast = useToast();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const queryClient = useQueryClient();

  const { formData, setFormData, isSubmitting, handleChange, handleIsRecurringChange, handleSubmit, handleUpdate, validateForm } = useEventForm({
    onAddClose,
    onEditClose,
    selectedEvent,
    resetFormData: () => {
      setFormData({
        event_name: "",
        event_mandarin_name: "",
        greg_occur_date: "",
        greg_end_date: "",
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
        poster_s3_bucket_link: null,
      });
      setImage(null);
      setPreviewImage(null);
    }
  });
  const deleteMutation = useDeleteEvent();
  const { image, setImage, previewImage, setPreviewImage, isImageLoaded, cropperRef, handleImageChange } = useImageUpload();
  const { filterOpen, setFilterOpen, eventTypeFilter, provinceFilter, tempEventTypeFilter, tempProvinceFilter, isEventTypeFilterOpen, setIsEventTypeFilterOpen, isProvinceFilterOpen, setIsProvinceFilterOpen, filter, setFilter, handleEventTypeFilterChange, handleProvinceFilterChange, applyFilters, clearFilters } = useEventFilter();

  const { data: provinces = [], isLoading: isProvincesLoading } = useFetchProvinces();
  const { data: cities = [], isLoading: isCitiesLoading } = useFetchCities(formData.provinceId);
  const { data: districts = [], isLoading: isDistrictsLoading } = useFetchDistricts(formData.cityId);
  const { data: localities = [], isLoading: isLocalitiesLoading } = useFetchLocalities(formData.localityId);

  const { data: events = [], isLoading, error, refetch } = useFetchEvents({
    event_type: eventTypeFilter,
    provinceId: provinceFilter,
  });

  useEffect(() => {
    refetch();
  }, [eventTypeFilter, provinceFilter, refetch]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error Memuat Kegiatan",
        description: "Terjadi kesalahan saat memuat kegiatan. Silakan coba lagi atau periksa koneksi Anda.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      refetch();
    }
  }, [error, refetch, toast]);

  const handleProvinceChange = useCallback((e) => {
    const provinceId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      provinceId,
      cityId: "",
      districtId: "",
      localityId: "",
    }));
  }, [setFormData]);

  const handleCityChange = useCallback((e) => {
    const cityId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      cityId,
      districtId: "",
      localityId: "",
    }));
  }, [setFormData]);

  const handleDistrictChange = useCallback((e) => {
    const districtId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      districtId,
      localityId: "",
    }));
  }, [setFormData]);

  const handleEdit = useCallback(async (event) => {
    const localDateTime = event.rawDate.toLocaleString("sv-SE", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).replace(" ", "T");

    const localEndDateTime = event.rawEndDate && !isNaN(event.rawEndDate.getTime())
      ? event.rawEndDate.toLocaleString("sv-SE", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).replace(" ", "T")
      : "";

    setFormData({
      event_name: event.name || "",
      event_mandarin_name: event.event_mandarin_name || "",
      greg_occur_date: localDateTime,
      greg_end_date: localEndDateTime,
      provinceId: event.provinceId ? event.provinceId.toString() : "",
      cityId: event.cityId ? event.cityId.toString() : "",
      districtId: event.districtId ? event.districtId.toString() : "",
      localityId: event.localityId ? event.localityId.toString() : "",
      location_name: event.location || "",
      event_type: event.type === "Hari Besar" ? "Hari_Besar" : event.type || "Regular",
      description: event.description || "",
      lunar_sui_ci_year: event.lunar_sui_ci_year || "",
      lunar_month: event.lunar_month || "",
      lunar_day: event.lunar_day || "",
      is_recurring: event.is_recurring || false,
      poster_s3_bucket_link: event.poster_s3_bucket_link || null,
    });

    setImage(null);
    setPreviewImage(event.poster_s3_bucket_link || null);
    onEditOpen();
  }, [setFormData, setImage, setPreviewImage, onEditOpen]);

  const handleDelete = useCallback((event) => {
    setSelectedEvent(event);
    onConfirmOpen();
  }, [onConfirmOpen]);

  const confirmDelete = useCallback(() => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id, {
        onSuccess: () => {
          toast({
            title: "Kegiatan Dihapus",
            description: "Kegiatan berhasil dihapus.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          onConfirmClose();
          onDetailClose();
          refetch();
          setSelectedEvent(null);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        },
      });
    }
  }, [selectedEvent, toast, onConfirmClose, onDetailClose, refetch, deleteMutation]);

  const openEventDetail = useCallback(async (event) => {
    try {
      const response = await axiosInstance.get(`/event/${event.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setSelectedEvent({
        ...event,
        ...response.data,
        location: typeof response.data.location === 'object' && response.data.location?.location_name
          ? response.data.location.location_name
          : response.data.location || "Unknown Location",
        poster_s3_bucket_link: response.data.poster_s3_bucket_link || null,
      });
      onDetailOpen();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat detail kegiatan. Periksa apakah endpoint API benar atau coba lagi nanti.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Error fetching event details:", error.response ? error.response.data : error.message);
    }
  }, [toast, onDetailOpen]);

  return (
    <Layout title="Kegiatan">
      <Box p={2}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="md">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Jakarta",
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
                setFormData({
                  event_name: "",
                  event_mandarin_name: "",
                  greg_occur_date: "",
                  greg_end_date: "",
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
                  poster_s3_bucket_link: null,
                });
                setImage(null);
                setPreviewImage(null);
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
        <EventList
          events={events}
          isLoading={isLoading}
          error={error}
          filter={filter}
          onEventClick={openEventDetail}
        />
        <EventDetailModal
          isOpen={isDetailOpen}
          onClose={onDetailClose}
          event={selectedEvent}
          onEdit={handleEdit}
          onDelete={handleDelete}
          imageUrl={selectedEvent?.poster_s3_bucket_link || "https://via.placeholder.com/400"}
        />
        <EventForm
          isOpen={isAddOpen}
          onClose={onAddClose}
          onSubmit={(e) => handleSubmit(e, cropperRef)}
          formData={formData}
          handleChange={handleChange}
          handleProvinceChange={handleProvinceChange}
          handleCityChange={handleCityChange}
          handleDistrictChange={handleDistrictChange}
          handleIsRecurringChange={handleIsRecurringChange}
          handleImageChange={handleImageChange}
          isSubmitting={isSubmitting}
          isImageLoaded={isImageLoaded}
          previewImage={previewImage}
          setPreviewImage={setPreviewImage}
          cropperRef={cropperRef}
          provinces={provinces}
          cities={cities}
          districts={districts}
          localities={localities}
          isProvincesLoading={isProvincesLoading}
          isCitiesLoading={isCitiesLoading}
          isDistrictsLoading={isDistrictsLoading}
          isLocalitiesLoading={isLocalitiesLoading}
          title="Buat Kegiatan Baru"
        />
        <EventForm
          isOpen={isEditOpen}
          onClose={onEditClose}
          onSubmit={(e) => handleUpdate(e, cropperRef)}
          formData={formData}
          handleChange={handleChange}
          handleProvinceChange={handleProvinceChange}
          handleCityChange={handleCityChange}
          handleDistrictChange={handleDistrictChange}
          handleIsRecurringChange={handleIsRecurringChange}
          handleImageChange={handleImageChange}
          isSubmitting={isSubmitting}
          isImageLoaded={isImageLoaded}
          previewImage={previewImage}
          setPreviewImage={setPreviewImage}
          cropperRef={cropperRef}
          provinces={provinces}
          cities={cities}
          districts={districts}
          localities={localities}
          isProvincesLoading={isProvincesLoading}
          isCitiesLoading={isCitiesLoading}
          isDistrictsLoading={isDistrictsLoading}
          isLocalitiesLoading={isLocalitiesLoading}
          title={`Edit Kegiatan: ${selectedEvent?.name || ""}`}
        />
        <DeleteConfirmModal
          isOpen={isConfirmOpen}
          onClose={onConfirmClose}
          onConfirm={confirmDelete}
          eventName={selectedEvent?.name}
          isDeleting={deleteMutation.isLoading}
        />
      </Box>
    </Layout>
  );
}