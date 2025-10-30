import {
  Box, Button, Flex, Heading, Text, IconButton, useToast,
  Tag, VStack, Divider, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Select, Textarea, HStack,
  Checkbox, Radio, RadioGroup, Image, Spinner, useDisclosure,
  InputGroup, InputRightElement, Collapse
} from "@chakra-ui/react";
import { FiEdit, FiTrash, FiPlus, FiFilter, FiMinus, FiPlus as FiPlusIcon, FiCalendar } from "react-icons/fi";
import Layout from "@/components/layout";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, addDays, isValid, parse } from "date-fns";
import { useDeleteEvent } from "@/features/event/useDeleteEvent";
import { useEventForm } from "@/features/event/useEventForm";
import { useEventFilter } from "@/features/event/useEventFilter";
import { useImageUpload } from "@/features/event/useImageUpload";
import { axiosInstance } from "@/lib/axios";
import { useFetchEvents } from "@/features/event/useFetchEvents";
import { useFetchCities, useFetchDistricts, useFetchLocalities, useFetchProvinces } from "@/features/location/useFetchLocations";
import { jwtDecode } from "jwt-decode";

const lunarYears = ["乙巳年"];
const lunarMonths = [
  "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月",
];
const lunarDays = [
  "初一日", "初二日", "初三日", "初四日", "初五日", "初六日", "初七日", "初八日", "初九日", "十日",
  "十一日", "十二日", "十三日", "十四日", "十五日", "十六日", "十七日", "十八日", "十九日", "二十日",
  "二十一日", "二十二日", "二十三日", "二十四日", "二十五日", "二十六日", "二十七日", "二十八日", "二十九日", "三十日",
];
const eventTypes = ["Regular", "Hari_Besar", "Lembaga", "Anniversary", "Peresmian", "Seasonal"];
const jangkauanOptions = [
  { value: "nasional", label: "Nasional" },
  { value: "Korwil_1", label: "Wilayah 1" },
  { value: "Korwil_2", label: "Wilayah 2" },
  { value: "Korwil_3", label: "Wilayah 3" },
  { value: "Korwil_4", label: "Wilayah 4" },
  { value: "Korwil_5", label: "Wilayah 5" },
  { value: "Korwil_6", label: "Wilayah 6" },
];
const isRecurringOptions = [
  { value: "true", label: "Berulang" },
  { value: "false", label: "Tidak Berulang" },
];

const DateRangeModal = ({ isOpen, onClose, onApply, dateRange, setDateRange }) => {
  const today = new Date();
  const [daysBefore, setDaysBefore] = useState("-");
  const [daysAfter, setDaysAfter] = useState("-");
  const formatDate = (date) => format(date, "dd-MM-yyyy");

  const handleFilterClick = (filter) => {
    let startDate, endDate;
    const before = daysBefore !== "-" && !isNaN(parseInt(daysBefore)) && parseInt(daysBefore) >= 0 ? parseInt(daysBefore) : null;
    const after = daysAfter !== "-" && !isNaN(parseInt(daysAfter)) && parseInt(daysAfter) >= 0 ? parseInt(daysAfter) : null;

    if (before !== null && after !== null) {
      startDate = subDays(today, before);
      endDate = addDays(today, after);
      setDateRange({ startDate, endDate });
      return;
    } else if (before !== null) {
      startDate = subDays(today, before);
      endDate = today;
      setDateRange({ startDate, endDate });
      return;
    } else if (after !== null) {
      startDate = today;
      endDate = addDays(today, after);
      setDateRange({ startDate, endDate });
      return;
    }

    switch (filter) {
      case "today":
        startDate = today;
        endDate = today;
        break;
      case "yesterday":
        startDate = subDays(today, 1);
        endDate = subDays(today, 1);
        break;
      case "thisWeek":
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "lastWeek":
        startDate = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        endDate = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        break;
      case "thisMonth":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "lastMonth":
        startDate = startOfMonth(subMonths(today, 1));
        endDate = endOfMonth(subMonths(today, 1));
        break;
      default:
        startDate = today;
        endDate = today;
    }
    setDateRange({ startDate, endDate });
  };

  const handleDaysBeforeChange = (e) => {
    const value = e.target.value;
    if (value === "" || value === "-") {
      setDaysBefore("-");
    } else if (!isNaN(value) && parseInt(value) >= 0) {
      setDaysBefore(value);
    }
  };

  const handleDaysAfterChange = (e) => {
    const value = e.target.value;
    if (value === "" || value === "-") {
      setDaysAfter("-");
    } else if (!isNaN(value) && parseInt(value) >= 0) {
      setDaysAfter(value);
    }
  };

  const handleApply = () => {
    const before = daysBefore !== "-" && !isNaN(parseInt(daysBefore)) && parseInt(daysBefore) >= 0 ? parseInt(daysBefore) : null;
    const after = daysAfter !== "-" && !isNaN(parseInt(daysAfter)) && parseInt(daysAfter) >= 0 ? parseInt(daysAfter) : null;

    if (before !== null && after !== null) {
      setDateRange({
        startDate: subDays(today, before),
        endDate: addDays(today, after),
      });
    } else if (before !== null) {
      setDateRange({
        startDate: subDays(today, before),
        endDate: today,
      });
    } else if (after !== null) {
      setDateRange({
        startDate: today,
        endDate: addDays(today, after),
      });
    }
    onApply();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pilih Rentang Tanggal</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction={{ base: "column", md: "row" }} gap={4}>
            <VStack align="start" spacing={2} w={{ base: "100%", md: "200px" }}>
              <Button size="sm" variant="outline" onClick={() => handleFilterClick("today")}>Hari Ini</Button>
              <Button size="sm" variant="outline" onClick={() => handleFilterClick("yesterday")}>Kemarin</Button>
              <Button size="sm" variant="outline" onClick={() => handleFilterClick("thisWeek")}>Minggu Ini</Button>
              <Button size="sm" variant="outline" onClick={() => handleFilterClick("lastWeek")}>Minggu Lalu</Button>
              <Button size="sm" variant="outline" onClick={() => handleFilterClick("thisMonth")}>Bulan Ini</Button>
              <Button size="sm" variant="outline" onClick={() => handleFilterClick("lastMonth")}>Bulan Lalu</Button>
              <HStack spacing={2} align="center">
                <Input
                  size="xs"
                  w="50px"
                  value={daysBefore}
                  onChange={handleDaysBeforeChange}
                  placeholder="-"
                  type="number"
                  min="0"
                />
                <Text fontSize="sm">days up to today</Text>
              </HStack>
              <HStack spacing={2} align="center">
                <Input
                  size="xs"
                  w="50px"
                  value={daysAfter}
                  onChange={handleDaysAfterChange}
                  placeholder="-"
                  type="number"
                  min="0"
                />
                <Text fontSize="sm">days starting today</Text>
              </HStack>
            </VStack>
            <Divider
              orientation="vertical"
              borderColor="gray.300"
              borderWidth="2px"
              height="100%"
              minH="400px"
              display={{ base: "none", md: "block" }}
            />
            <VStack align="start" spacing={2} flex="1">
              <HStack spacing={2}>
                <FormControl>
                  <FormLabel>Start Date</FormLabel>
                  <Input value={dateRange.startDate ? formatDate(dateRange.startDate) : ""} isReadOnly />
                </FormControl>
                <FormControl>
                  <FormLabel>End Date</FormLabel>
                  <Input value={dateRange.endDate ? formatDate(dateRange.endDate) : ""} isReadOnly />
                </FormControl>
              </HStack>
              <Calendar
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    setDateRange({ startDate: value[0], endDate: value[1] });
                    setDaysBefore("-");
                    setDaysAfter("-");
                  } else {
                    setDateRange({ startDate: value, endDate: value });
                    setDaysBefore("-");
                    setDaysAfter("-");
                  }
                }}
                value={[dateRange.startDate, dateRange.endDate]}
                selectRange={true}
                returnValue="range"
              />
            </VStack>
          </Flex>
          <Divider
            orientation="horizontal"
            borderColor="gray.300"
            borderWidth="2px"
          />
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleApply}>Terapkan</Button>
          <Button variant="ghost" onClick={onClose} ml={3}>Batal</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const EventList = ({ events, isLoading, error, dateRange, onEventClick }) => {
  const getJangkauanLabel = (value) => {
    const option = jangkauanOptions.find((opt) => opt.value === value);
    return option ? option.label : "-";
  };

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

  if (!events || events.length === 0) {
    return (
      <VStack h="70vh" justify="center" align="center">
        <Text fontSize="xl" textAlign="center">Tidak ada kegiatan untuk rentang tanggal ini</Text>
      </VStack>
    );
  }

  return events.map((event, index) => {
    if (!event || !event.id || !event.date || !event.day) {
      return null;
    }

    return (
      <Box
        key={`${event.id}-${event.occurrence_id}`}
        bg="white"
        p={4}
        mb={4}
        borderRadius="md"
        border="1px solid #e2e8f0"
        onClick={() => {
          onEventClick(event);
        }}
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
            <Text fontWeight="bold" color="gray.600">{event.date || "Tanggal Tidak Tersedia"}</Text>
            <Text fontSize="sm" color="gray.500">{event.day || "Hari Tidak Tersedia"}</Text>
          </Box>
          <Box flex="1">
            <Text fontSize="lg" fontWeight="bold" color="#2e05e8ff">{event.time || "Waktu Tidak Tersedia"}</Text>
            <Text mt={1}>{event.name || "Nama Tidak Tersedia"}</Text>
            <Text color="gray.500" mt={1}>{event.location || "Unknown Location"}</Text>
            <Flex mt={2} align="center" gap={2}>
              <Tag size="sm" colorScheme="blue" borderRadius="full">{event.type || "Tipe Tidak Diketahui"}</Tag>
              <Tag size="sm" colorScheme="purple" borderRadius="full">{getJangkauanLabel(event.jangkauan)}</Tag>
              {event.is_recurring && (
                <Tag size="sm" colorScheme="green" borderRadius="full">Berulang</Tag>
              )}
            </Flex>
          </Box>
        </Flex>
      </Box>
    );
  }).filter((event) => event !== null);
};

const EventDetailModal = ({ isOpen, onClose, event, onEdit, onDelete, imageUrl }) => {
  const toast = useToast();
  const getJangkauanLabel = (value) => {
    const option = jangkauanOptions.find((opt) => opt.value === value);
    return option ? option.label : "-";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{event?.name || "Detail Kegiatan"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {event?.poster_s3_bucket_link && (
            <Box mb={4} display="flex" justifyContent="center">
              <Image
                src={imageUrl}
                alt={`Poster untuk ${event.name || "Kegiatan"}`}
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
                    description: `Tidak dapat memuat poster untuk ${event.name || "kegiatan"}.`,
                    status: "warning",
                    duration: 3000,
                    isClosable: true,
                  });
                }}
              />
            </Box>
          )}
          <Text mb={2}><strong>Tanggal:</strong> {event?.day || "Hari Tidak Tersedia"}, {event?.date || "Tanggal Tidak Tersedia"}</Text>
          <Text my={2}><strong>Tanggal Lunar:</strong> {event?.lunar_sui_ci_year || "-"} {event?.lunar_month || "-"} {event?.lunar_day || "-"}</Text>
          <Text my={2}><strong>Waktu:</strong> {event?.time || "Waktu Tidak Tersedia"}</Text>
          <Text my={2}><strong>Lokasi:</strong> {event?.location || "Unknown Location"}</Text>
          <Text my={2}><strong>Jenis:</strong> {event?.type || "Tipe Tidak Diketahui"}</Text>
          <Text my={2}><strong>Jangkauan:</strong> {getJangkauanLabel(event?.jangkauan)}</Text>
          <Text my={2}><strong>Berulang:</strong> {event?.is_recurring ? "Ya" : "Tidak"}</Text>
          <Text my={2}><strong>Deskripsi:</strong> {event?.description || "Deskripsi Tidak Tersedia"}</Text>
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
                    value={formData.event_name || ""}
                    onChange={handleChange}
                    placeholder="Masukkan nama kegiatan"
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel>Nama Kegiatan (Mandarin)</FormLabel>
                  <Input
                    name="event_mandarin_name"
                    value={formData.event_mandarin_name || ""}
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
                    value={formData.greg_occur_date || ""}
                    onChange={handleChange}
                    type="datetime-local"
                    placeholder="Pilih tanggal dan waktu mulai"
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel>Tanggal dan Waktu Selesai</FormLabel>
                  <Input
                    name="greg_end_date"
                    value={formData.greg_end_date || ""}
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
                    value={formData.location_name || ""}
                    onChange={handleChange}
                    placeholder="Masukkan nama lokasi"
                  />
                </FormControl>
                <FormControl isRequired flex={1}>
                  <FormLabel>Jenis Kegiatan</FormLabel>
                  <Select name="event_type" value={formData.event_type || "Regular"} onChange={handleChange}>
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
                    value={formData.provinceId || ""}
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
                    value={formData.cityId || ""}
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
                    value={formData.districtId || ""}
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
                    value={formData.localityId || ""}
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
              <FormControl isRequired>
                <FormLabel>Jangkauan</FormLabel>
                <Select
                  name="jangkauan"
                  value={formData.area || ""}
                  onChange={handleChange}
                  placeholder="Pilih jangkauan"
                >
                  {jangkauanOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </FormControl>
              <HStack spacing={4}>
                <FormControl isRequired flex={1}>
                  <FormLabel>Tahun Lunar (Sui Ci)</FormLabel>
                  <Select
                    name="lunar_sui_ci_year"
                    value={formData.lunar_sui_ci_year || ""}
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
                    value={formData.lunar_month || ""}
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
                    value={formData.lunar_day || ""}
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
                  value={formData.description || ""}
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
                  value={formData.is_recurring?.toString() || "false"}
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
  <Modal isOpen={isOpen} onClose={onClose} size="xl">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Konfirmasi Hapus</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>Apakah Anda yakin ingin menghapus kegiatan {eventName || "ini"}?</Text>
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
  const { isOpen: isDateRangeOpen, onOpen: onDateRangeOpen, onClose: onDateRangeClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return {
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    };
  });
  const [userArea, setUserArea] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUserRole(decoded.role || null);
          setUserArea(decoded.area === null ? "nasional" : decoded.area || null);
        } catch (error) {
          console.error("Failed to decode token:", error);
        }
      }
    }
  }, []);

  const filteredJangkauanOptions = useMemo(() => {
    if (userRole === "Super Admin") {
      return jangkauanOptions;
    }
    return jangkauanOptions.filter(option => 
      option.value === "nasional" || option.value === userArea
    );
  }, [userRole, userArea]);

  const { formData, setFormData, isSubmitting, handleChange, handleIsRecurringChange, handleSubmit, handleUpdate } = useEventForm({
    onAddClose,
    onEditClose,
    onDetailClose,
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
        area: "",
      });
      setImage(null);
      setPreviewImage(null);
    }
  });

  const deleteMutation = useDeleteEvent();
  const { image, setImage, previewImage, setPreviewImage, isImageLoaded, cropperRef, handleImageChange } = useImageUpload();
  const { 
    filterOpen, setFilterOpen, 
    eventTypeFilter, jangkauanFilter, isRecurringFilter, 
    tempEventTypeFilter, tempJangkauanFilter, tempIsRecurringFilter, 
    setTempJangkauanFilter, isEventTypeFilterOpen, setIsEventTypeFilterOpen, 
    isJangkauanFilterOpen, setIsJangkauanFilterOpen, isIsRecurringFilterOpen, 
    setIsIsRecurringFilterOpen, handleEventTypeFilterChange, 
    handleJangkauanFilterChange, handleIsRecurringFilterChange, 
    applyFilters, clearFilters 
  } = useEventFilter();

  const { data: provinces = [], isLoading: isProvincesLoading } = useFetchProvinces();
  const { data: cities = [], isLoading: isCitiesLoading } = useFetchCities(formData.provinceId);
  const { data: districts = [], isLoading: isDistrictsLoading } = useFetchDistricts(formData.cityId);
  const { data: localities = [], isLoading: isLocalitiesLoading } = useFetchLocalities(formData.districtId);

  const { data: events = [], isLoading, error, refetch } = useFetchEvents({
    event_type: eventTypeFilter,
    area: jangkauanFilter,
    is_recurring: isRecurringFilter,
    startDate: format(dateRange.startDate, "yyyy-MM-dd"),
    endDate: format(dateRange.endDate, "yyyy-MM-dd"),
  });

  useEffect(() => {
    console.log("DEBUG: formData.districtId:", formData.districtId);
    console.log("DEBUG: localities:", localities);
    console.log("DEBUG: isLocalitiesLoading:", isLocalitiesLoading);
  }, [formData.districtId, localities, isLocalitiesLoading]);

  const sortedEvents = useMemo(() => {
    const filtered = events.filter(event => {
      if (!event.rawDate) {
        return false;
      }
      const eventDate = typeof event.rawDate === 'string' ? new Date(event.rawDate) : event.rawDate;
      if (!isValid(eventDate)) {
        return false;
      }
      const inRange = eventDate >= dateRange.startDate && eventDate <= dateRange.endDate;
      if (!inRange) {
        console.log("Event filtered out due to date range:", {
          eventId: event.id,
          eventName: event.name,
          eventDate: event.rawDate,
          startDate: format(dateRange.startDate, "yyyy-MM-dd"),
          endDate: format(dateRange.endDate, "yyyy-MM-dd"),
        });
      }
      return inRange;
    });
    const sorted = filtered.sort((a, b) => {
      const dateA = typeof a.rawDate === 'string' ? new Date(a.rawDate) : a.rawDate;
      const dateB = typeof b.rawDate === 'string' ? new Date(b.rawDate) : b.rawDate;
      if (!isValid(dateA) || !isValid(dateB)) {
        return 0;
      }
      return dateA - dateB;
    });
    return sorted;
  }, [events, dateRange.startDate, dateRange.endDate]);

  const validEvents = sortedEvents.filter(event => 
    event && 
    event.id && 
    event.date && 
    event.day && 
    event.name
  );

  useEffect(() => {
    refetch();
  }, [dateRange, eventTypeFilter, jangkauanFilter, isRecurringFilter, refetch]);

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
    if (provinceId) {
      queryClient.invalidateQueries(['cities', provinceId]);
    }
  }, [setFormData, queryClient]);

  const handleCityChange = useCallback((e) => {
    const cityId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      cityId,
      districtId: "",
      localityId: "",
    }));
    if (cityId) {
      queryClient.invalidateQueries(['districts', cityId]);
    }
  }, [setFormData, queryClient]);

  const handleDistrictChange = useCallback((e) => {
    const districtId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      districtId,
      localityId: "",
    }));
    if (districtId) {
      queryClient.invalidateQueries(['localities', districtId]);
    }
  }, [setFormData, queryClient]);

  const handleEdit = useCallback(async (event) => {
    if (!event?.id) {
      toast({
        title: "Error",
        description: "Kegiatan tidak valid untuk pengeditan.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      queryClient.invalidateQueries(["event", event.id]);
      const response = await axiosInstance.get(`/event/${event.id}`);
      const eventData = response.data;

      if (!eventData || typeof eventData !== 'object') {
        throw new Error("Invalid event data from API: response is empty or not an object");
      }

      let apiRawDate = eventData.rawDate ? (typeof eventData.rawDate === 'string' ? new Date(eventData.rawDate) : eventData.rawDate) : null;
      let apiRawEndDate = eventData.rawEndDate ? (typeof eventData.rawEndDate === 'string' ? new Date(eventData.rawEndDate) : eventData.rawEndDate) : null;

      let rawDate = apiRawDate || (event.rawDate ? (typeof event.rawDate === 'string' ? new Date(event.rawDate) : event.rawDate) : null);
      let rawEndDate = apiRawEndDate || (event.rawEndDate ? (typeof event.rawEndDate === 'string' ? new Date(event.rawEndDate) : event.rawEndDate) : null);

      if (!rawDate && event.date && event.time) {
        const timeStr = event.time.replace(" WIB", "");
        const dateTimeStr = `${event.date} ${timeStr}`;
        rawDate = parse(dateTimeStr, "d MMMM yyyy HH.mm", new Date(), { locale: require('date-fns/locale/id') });
      }

      const isRawDateValid = rawDate && isValid(rawDate);
      const isRawEndDateValid = rawEndDate && isValid(rawEndDate);

      const localDateTime = isRawDateValid
        ? rawDate.toLocaleString("sv-SE", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).replace(" ", "T")
        : "";

      const localEndDateTime = isRawEndDateValid
        ? rawEndDate.toLocaleString("sv-SE", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).replace(" ", "T")
        : "";

      const location = eventData.location || {};
      const locality = location.locality || {};
      const district = locality.district || {};
      const city = district.city || {};
      const province = city.province || {};

      const newFormData = {
        event_name: eventData.event_name || event.name || "Kegiatan Tanpa Nama",
        event_mandarin_name: eventData.event_mandarin_name || event.event_mandarin_name || "",
        greg_occur_date: localDateTime,
        greg_end_date: localEndDateTime,
        provinceId: province.id ? province.id.toString() : "",
        cityId: city.id ? city.id.toString() : "",
        districtId: district.id ? district.id.toString() : "",
        localityId: locality.id ? locality.id.toString() : "",
        location_name: location.location_name || event.location || "Unknown Location",
        event_type: eventData.event_type === "Hari_Besar" ? "Hari_Besar" : eventData.event_type || event.type || "Regular",
        description: eventData.description || event.description || "",
        lunar_sui_ci_year: eventData.lunar_sui_ci_year || event.lunar_sui_ci_year || "",
        lunar_month: eventData.lunar_month || event.lunar_month || "",
        lunar_day: eventData.lunar_day || event.lunar_day || "",
        is_recurring: eventData.is_recurring ?? event.is_recurring ?? false,
        poster_s3_bucket_link: eventData.poster_s3_bucket_link || event.poster_s3_bucket_link || null,
        area: eventData.area === null ? "nasional" : eventData.area || event.jangkauan || "",
      };

      setFormData(newFormData);
      if (province.id) queryClient.invalidateQueries(['cities', province.id.toString()]);
      if (city.id) queryClient.invalidateQueries(['districts', city.id.toString()]);
      if (district.id) queryClient.invalidateQueries(['localities', district.id.toString()]);
      setImage(null);
      setPreviewImage(eventData.poster_s3_bucket_link || event.poster_s3_bucket_link || null);
      onEditOpen();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat detail kegiatan untuk pengeditan: " + error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [setFormData, setImage, setPreviewImage, onEditOpen, queryClient, toast]);

  const handleDelete = useCallback((event) => {
    if (!event?.id) {
      toast({
        title: "Error",
        description: "Kegiatan tidak valid untuk penghapusan.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setSelectedEvent(event);
    onConfirmOpen();
  }, [onConfirmOpen, toast]);

  const confirmDelete = useCallback(() => {
    if (!selectedEvent?.id) {
      toast({
        title: "Error",
        description: "Kegiatan tidak valid untuk penghapusan.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
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
  }, [selectedEvent, toast, onConfirmClose, onDetailClose, refetch, deleteMutation]);

  const openEventDetail = useCallback(async (event) => {

    if (!event?.id) {
      toast({
        title: "Error",
        description: "Kegiatan tidak valid untuk dilihat detailnya.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      queryClient.invalidateQueries(["event", event.id]);
      const response = await axiosInstance.get(`/event/${event.id}`);
      const eventData = response.data;

      if (!eventData || typeof eventData !== 'object') {
        throw new Error("Invalid event data from API: response is empty or not an object");
      }

      let apiRawDate = eventData.rawDate ? (typeof eventData.rawDate === 'string' ? new Date(eventData.rawDate) : eventData.rawDate) : null;
      let apiRawEndDate = eventData.rawEndDate ? (typeof eventData.rawEndDate === 'string' ? new Date(eventData.rawEndDate) : eventData.rawEndDate) : null;

      let rawDate = apiRawDate || (event.rawDate ? (typeof event.rawDate === 'string' ? new Date(event.rawDate) : event.rawDate) : null);
      let rawEndDate = apiRawEndDate || (event.rawEndDate ? (typeof event.rawEndDate === 'string' ? new Date(event.rawEndDate) : event.rawEndDate) : null);

      if (!rawDate && event.date && event.time) {
        const timeStr = event.time.replace(" WIB", "");
        const dateTimeStr = `${event.date} ${timeStr}`;
        rawDate = parse(dateTimeStr, "d MMMM yyyy HH.mm", new Date(), { locale: require('date-fns/locale/id') });
      }

      if (rawDate && !isValid(rawDate)) {
        rawDate = null;
      }
      if (rawEndDate && !isValid(rawEndDate)) {
        rawEndDate = null;
      }

      const safeEventData = {
        id: eventData.id || event.id || null,
        name: eventData.event_name || event.name || "Kegiatan Tanpa Nama",
        rawDate: rawDate,
        rawEndDate: rawEndDate,
        event_mandarin_name: eventData.event_mandarin_name || event.event_mandarin_name || "",
        location: eventData.location && typeof eventData.location === 'object' && eventData.location.location_name
          ? eventData.location.location_name
          : eventData.location || event.location || "Unknown Location",
        type: eventData.event_type || event.type || "Regular",
        jangkauan: eventData.area === null ? "nasional" : eventData.area || event.jangkauan || "",
        is_recurring: eventData.is_recurring ?? event.is_recurring ?? false,
        description: eventData.description || event.description || "",
        lunar_sui_ci_year: eventData.lunar_sui_ci_year || event.lunar_sui_ci_year || "",
        lunar_month: eventData.lunar_month || event.lunar_month || "",
        lunar_day: eventData.lunar_day || event.lunar_day || "",
        poster_s3_bucket_link: eventData.poster_s3_bucket_link || event.poster_s3_bucket_link || null,
        date: eventData.date || event.date || (rawDate && isValid(rawDate) ? format(rawDate, "dd-MM-yyyy") : "Tanggal Tidak Tersedia"),
        day: eventData.day || event.day || (rawDate && isValid(rawDate) ? format(rawDate, "EEEE", { locale: require('date-fns/locale/id') }) : "Hari Tidak Tersedia"),
        time: eventData.time || event.time || (rawDate && isValid(rawDate) ? format(rawDate, "HH:mm") : "Waktu Tidak Tersedia"),
      };

      setSelectedEvent(safeEventData);
      onDetailOpen();
    } catch (error) {
      toast({
        title: "Error",
        description: `Gagal memuat detail kegiatan: ${error.message}. Silakan coba lagi.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast, onDetailOpen, queryClient]);

  const formatDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) return "";
    if (dateRange.startDate.getTime() === dateRange.endDate.getTime()) {
      return format(dateRange.startDate, "dd-MM-yyyy");
    }
    return `${format(dateRange.startDate, "dd-MM-yyyy")} - ${format(dateRange.endDate, "dd-MM-yyyy")}`;
  };

  const handleApplyDateRange = () => {
    refetch();
    onDateRangeClose();
  };

  return (
    <Layout title="Kegiatan" events={validEvents}>
      <Box p={2}>
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={2}>
          <Heading size="md">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            })}
          </Heading>
          <Flex gap={2} align="center" flexShrink={0}>
            <Box position="relative">
              <Button
                colorScheme="white"
                textColor="gray.700"
                borderRadius="full"
                borderWidth="1px"
                borderColor="gray.400"
                size="xs"
                minW="100px"
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
                  w="250px"
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
                  {userRole === "Super Admin" && (
                    <FormControl>
                      <Flex align="center" justify="space-between">
                        <FormLabel mb={0}>Jangkauan</FormLabel>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label={isJangkauanFilterOpen ? "Hide jangkauan filter" : "Show jangkauan filter"}
                          icon={isJangkauanFilterOpen ? <FiMinus /> : <FiPlusIcon />}
                          onClick={() => setIsJangkauanFilterOpen(!isJangkauanFilterOpen)}
                          _hover={{ bg: "transparent" }}
                        />
                      </Flex>
                      <Collapse in={isJangkauanFilterOpen} animateOpacity>
                        <VStack align="start" spacing={1}>
                          {filteredJangkauanOptions.map((option) => (
                            <Checkbox
                              key={option.value}
                              isChecked={(tempJangkauanFilter || []).includes(option.value)}
                              onChange={() => handleJangkauanFilterChange(option.value)}
                            >
                              {option.label}
                            </Checkbox>
                          ))}
                        </VStack>
                      </Collapse>
                    </FormControl>
                  )}
                  <FormControl>
                    <Flex align="center" justify="space-between">
                      <FormLabel mb={0}>Berulang</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label={isIsRecurringFilterOpen ? "Hide recurring filter" : "Show recurring filter"}
                        icon={isIsRecurringFilterOpen ? <FiMinus /> : <FiPlusIcon />}
                        onClick={() => setIsIsRecurringFilterOpen(!isIsRecurringFilterOpen)}
                        _hover={{ bg: "transparent" }}
                      />
                    </Flex>
                    <Collapse in={isIsRecurringFilterOpen} animateOpacity>
                      <VStack align="start" spacing={1}>
                        {isRecurringOptions.map((option) => (
                          <Checkbox
                            key={option.value}
                            isChecked={tempIsRecurringFilter.includes(option.value)}
                            onChange={() => handleIsRecurringFilterChange(option.value)}
                          >
                            {option.label}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Collapse>
                  </FormControl>
                  <HStack justify="flex-end" spacing={2}>
                    <Button size="xs" onClick={clearFilters}>Reset</Button>
                    <Button size="xs" onClick={() => setFilterOpen(false)}>Cancel</Button>
                    <Button size="xs" colorScheme="blue" onClick={applyFilters}>Terapkan</Button>
                  </HStack>
                </VStack>
              )}
            </Box>
            <Button
              colorScheme="blue"
              borderRadius="full"
              size="xs"
              minW="150px"
              leftIcon={<FiPlus style={{ marginTop: "2px" }} />}
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
                  area: "",
                });
                setImage(null);
                setPreviewImage(null);
                onAddOpen();
              }}
            >
              Tambah Kegiatan
            </Button>
            <FormControl display="flex" alignItems="center">
              <Text mr={2}>Tanggal:</Text>
              <InputGroup size="xs" width="180px">
                <Input
                  value={formatDateRange()}
                  isReadOnly
                  placeholder="Pilih tanggal..."
                  onClick={onDateRangeOpen}
                  cursor="pointer"
                  borderRadius="full"
                />
                <InputRightElement>
                  <IconButton
                    icon={<FiCalendar />}
                    variant="ghost"
                    size="xs"
                    onClick={onDateRangeOpen}
                    aria-label="Buka kalender"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </Flex>
        </Flex>
        <EventList
          events={validEvents}
          isLoading={isLoading}
          error={error}
          dateRange={dateRange}
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
          title="Edit Kegiatan"
        />
        <DeleteConfirmModal
          isOpen={isConfirmOpen}
          onClose={onConfirmClose}
          onConfirm={confirmDelete}
          eventName={selectedEvent?.name}
          isDeleting={deleteMutation.isLoading}
        />
        <DateRangeModal
          isOpen={isDateRangeOpen}
          onClose={onDateRangeClose}
          onApply={handleApplyDateRange}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      </Box>
    </Layout>
  );
}