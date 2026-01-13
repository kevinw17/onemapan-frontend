import {
  Box, Button, Flex, Heading, Text, IconButton, useToast,
  Tag, VStack, Divider, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Select, Textarea, HStack,
  Checkbox, Image, Spinner, useDisclosure,
  InputGroup, InputRightElement, Collapse,
  Radio,
  RadioGroup,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  GridItem,
  Grid,
  CheckboxGroup,
  DrawerFooter
} from "@chakra-ui/react";
import { FiEdit, FiTrash, FiPlus, FiFilter, FiMinus, FiPlus as FiPlusIcon, FiCalendar, FiX, FiDownload } from "react-icons/fi";
import Layout from "@/components/layout";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
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
import { useFetchCities, useFetchProvinces } from "@/features/location/useFetchLocations";
import { jwtDecode } from "jwt-decode";
import { useFetchInstitution } from "@/features/institution/useFetchInstitution";
import { useFetchFotang } from "@/features/location/useFetchFotang";
import { isNationalRole } from "@/lib/roleUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  const getWilayahLabel = (area) => {
    const map = {
      "Korwil_1": "Wilayah 1",
      "Korwil_2": "Wilayah 2",
      "Korwil_3": "Wilayah 3",
      "Korwil_4": "Wilayah 4",
      "Korwil_5": "Wilayah 5",
      "Korwil_6": "Wilayah 6",
    };
    return map[area] || "Wilayah Tidak Diketahui";
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
            <Text fontWeight="bold" color="gray.600">{event.date || "Tanggal Tidak Tersedia"}</Text>
            <Text fontSize="sm" color="gray.500">{event.day || "Hari Tidak Tersedia"}</Text>
          </Box>
          <Box flex="1">
            <Text fontSize="lg" fontWeight="bold" color="#2e05e8ff">{event.time || "Waktu Tidak Tersedia"}</Text>
            <Text mt={1}>{event.name || "Nama Tidak Tersedia"}</Text>
            <Text color="gray.500" mt={1}>{event.location || "Unknown Location"}</Text>
            <Flex mt={2} align="center" gap={2}>
              <Tag size="sm" colorScheme="blue" borderRadius="full">{event.type || "Tipe Tidak Diketahui"}</Tag>
              <Tag size="sm" colorScheme="purple" borderRadius="full">
                {getWilayahLabel(event.area)}
              </Tag>
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
const EventDetailModal = ({ isOpen, onClose, event, onEdit, onDelete, imageUrl, isDetailLoading, userRole }) => {
  const toast = useToast();
  const router = useRouter();

  const canEdit = (() => {
    if (!userRole || !event) return false;

    const role = userRole.toString().toLowerCase().replace(/\s+/g, "");

    if (role === "superadmin" || role === "sekjenlembaga") {
      return true;
    }

    if (role === "admin") {
      let userArea = null;
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userArea = payload.area || null;
        }
      } catch (e) {
        console.error("Gagal decode token:", e);
      }

      if (!userArea) {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userArea = user.area || user.korwil || null;
          } catch (e) {}
        }
      }

      if (!userArea || !userArea.startsWith("Korwil_")) {
        return false;
      }

      const eventArea = event.wilayahLabel?.includes("Wilayah") 
        ? "Korwil_" + event.wilayahLabel.split(" ")[1] 
        : event.area || 
          (event.fotang && event.fotang.area) || 
          (event.eventLocation && event.eventLocation.area) || 
          null;

      console.log("DEBUG EDIT:", { userArea, eventArea, canEdit: eventArea === userArea });

      return eventArea === userArea;
    }

    return false;
  })();

  if (isDetailLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalBody display="flex" justifyContent="center" alignItems="center" h="300px">
            <VStack>
              <Spinner size="xl" />
              <Text mt={4}>Memuat detail kegiatan...</Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
  if (!event) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detail Kegiatan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color="red.500">Gagal memuat detail kegiatan. Silakan coba lagi.</Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Tutup</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
  const lunarDate = [event.lunar_sui_ci_year, event.lunar_month, event.lunar_day]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center" justify="space-between" w="100%">
            <Text>{event.name || "Detail Kegiatan"}</Text>
            <Flex align="center">
              {canEdit && (
                <Button
                  aria-label="Edit"
                  variant="solid"
                  colorScheme="blue"
                  onClick={() => {
                    if (!event?.id) {
                      toast({ title: "Gagal", description: "ID kegiatan tidak valid", status: "error" });
                      return;
                    }
                    router.push(`/event/editEvent?eventId=${event.id}`);
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
          {event.poster_s3_bucket_link && (
            <Box mb={4} display="flex" justifyContent="center">
              <Image
                src={imageUrl}
                alt={`Poster ${event.name}`}
                fallbackSrc="https://via.placeholder.com/400"
                maxH="500px"
                borderRadius="md"
                objectFit="contain"
              />
            </Box>
          )}
          <VStack align="start" spacing={3}>
            <Text><strong>Tanggal:</strong> {event.fullDate}</Text>
            <Text><strong>Waktu:</strong> {event.time}</Text>
            {lunarDate && <Text><strong>Tanggal Lunar:</strong> {lunarDate}</Text>}
            <Text><strong>Lokasi:</strong> {event.location}</Text>
            <Text><strong>Jenis:</strong> {event.type === "Hari_Besar" ? "Hari Besar" : event.type}</Text>
            <Text><strong>Wilayah:</strong> {event.wilayahLabel}</Text>
            {event.description && event.description !== "-" && (
              <Text whiteSpace="pre-wrap"><strong>Deskripsi:</strong> {event.description}</Text>
            )}
            {event.institution_name && event.institution_name !== "-" && (
              <Text><strong>Lembaga:</strong> {event.institution_name}</Text>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
const EventForm = ({
  isOpen, onClose, onSubmit, formData, handleChange, handleAreaChange, handleFotangChange,
  handleProvinceChange, handleCityChange, handleIsRecurringChange, handleImageChange,
  isSubmitting, previewImage, setPreviewImage, cropperRef,
  provinces, cities, fotangs, allFotangs, institutions,
  isProvincesLoading, isCitiesLoading, isFotangsLoading, isInstitutionsLoading,
  title, filteredJangkauanOptions, setFormData, userArea, eventCategory
}) => {
  const isInternal = eventCategory === "Internal";
  const isExternal = eventCategory === "External";
  const {
    data: citiesForExternalRaw = [],
    isLoading: isCitiesForExternalLoading
  } = useFetchCities(formData.external_provinceId ? parseInt(formData.external_provinceId) : null);
  const citiesForExternal = Array.isArray(citiesForExternalRaw)
    ? citiesForExternalRaw
    : (citiesForExternalRaw.data || []);
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
                  <Input name="event_name" value={formData.event_name || ""} onChange={handleChange} />
                </FormControl>
                {isInternal && (
                  <FormControl isRequired flex={1}>
                    <FormLabel>Nama Kegiatan (Mandarin)</FormLabel>
                    <Input name="event_mandarin_name" value={formData.event_mandarin_name || ""} onChange={handleChange} />
                  </FormControl>
                )}
              </HStack>
              <HStack spacing={4}>
                <FormControl isRequired flex={1}>
                  <FormLabel>Tanggal Mulai</FormLabel>
                  <Input type="datetime-local" name="greg_occur_date" value={formData.greg_occur_date || ""} onChange={handleChange} />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel>Tanggal Selesai</FormLabel>
                  <Input type="datetime-local" name="greg_end_date" value={formData.greg_end_date || ""} onChange={handleChange} />
                </FormControl>
              </HStack>
              {isExternal && (
                <FormControl isRequired>
                  <FormLabel>Apakah kegiatan di vihara / fotang?</FormLabel>
                  <RadioGroup
                    value={formData.is_in_fotang === true ? "yes" : formData.is_in_fotang === false ? "no" : ""}
                    onChange={(value) => {
                      const boolValue = value === "yes";
                      setFormData(prev => ({
                        ...prev,
                        is_in_fotang: boolValue,
                        ...(boolValue
                          ? {
                              external_provinceId: "",
                              external_cityId: "",
                              location_name: "",
                            }
                          : {
                              fotangId: "",
                              provinceId: "",
                              cityId: "",
                            }
                        ),
                      }));
                    }}
                  >
                    <HStack spacing={10}>
                      <Radio value="yes" colorScheme="blue">
                        Ya, di vihara/fotang
                      </Radio>
                      <Radio value="no" colorScheme="orange">
                        Tidak, di tempat lain
                      </Radio>
                    </HStack>
                  </RadioGroup>
                </FormControl>
              )}
              <FormControl isRequired>
                <FormLabel>Wilayah</FormLabel>
                <Select
                  name="area"
                  value={formData.area || ""}
                  onChange={handleAreaChange}
                  placeholder="Pilih wilayah"
                >
                  {filteredJangkauanOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </FormControl>
              {(isInternal || (isExternal && formData.is_in_fotang)) && formData.area && (
                <>
                  <HStack spacing={4}>
                    <FormControl flex={1}>
                      <FormLabel>Provinsi</FormLabel>
                      <Select
                        value={formData.provinceId || ""}
                        onChange={handleProvinceChange}
                        placeholder="Pilih Provinsi"
                      >
                        {Array.from(
                          new Map(
                            allFotangs
                              .filter(f => f.area === formData.area && f.province_id)
                              .map(f => [f.province_id, { id: f.province_id, name: f.province_name }])
                          ).values()
                        )
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </Select>
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel>Kota/Kabupaten</FormLabel>
                      <Select
                        value={formData.cityId || ""}
                        onChange={handleCityChange}
                        isDisabled={!formData.provinceId}
                        placeholder="Pilih Kota/Kabupaten"
                      >
                        {formData.provinceId &&
                          Array.from(
                            new Map(
                              allFotangs
                                .filter(f =>
                                  f.area === formData.area &&
                                  f.province_id === parseInt(formData.provinceId) &&
                                  f.city_id
                                )
                                .map(f => [f.city_id, { id: f.city_id, name: f.city_name }])
                            ).values()
                          )
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                      </Select>
                    </FormControl>
                  </HStack>
                  <FormControl isRequired>
                    <FormLabel>Pilih Vihara / Fotang</FormLabel>
                    <Select
                      value={formData.fotangId || ""}
                      onChange={handleFotangChange}
                      isDisabled={!formData.cityId}
                      placeholder="Pilih vihara/fotang"
                    >
                      {allFotangs
                        .filter(f =>
                          f.area === formData.area &&
                          f.province_id === parseInt(formData.provinceId) &&
                          f.city_id === parseInt(formData.cityId)
                        )
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                    </Select>
                  </FormControl>
                </>
              )}
              {isExternal && formData.is_in_fotang === false && formData.area && (
                <>
                  <HStack spacing={4}>
                    <FormControl isRequired flex={1}>
                      <FormLabel>Provinsi</FormLabel>
                      <Select
                        value={formData.external_provinceId || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          external_provinceId: e.target.value,
                          external_cityId: ""
                        }))}
                        placeholder="Pilih provinsi"
                      >
                        {provinces
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </Select>
                    </FormControl>
                    <FormControl isRequired flex={1}>
                      <FormLabel>Kota/Kabupaten</FormLabel>
                      <Select
                        value={formData.external_cityId || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          external_cityId: e.target.value
                        }))}
                        isDisabled={!formData.external_provinceId || isCitiesForExternalLoading}
                        placeholder={
                          isCitiesForExternalLoading
                            ? "Memuat kota..."
                            : !formData.external_provinceId
                              ? "Pilih provinsi dulu"
                              : "Pilih kota"
                        }
                      >
                        {citiesForExternal
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                      </Select>
                    </FormControl>
                  </HStack>
                  <FormControl isRequired>
                    <FormLabel>Nama Lokasi</FormLabel>
                    <Input
                      name="location_name"
                      value={formData.location_name || ""}
                      onChange={handleChange}
                      placeholder="Contoh: Hotel Santika, Gedung Serbaguna"
                    />
                  </FormControl>
                </>
              )}
              {isExternal && (
                <FormControl isRequired>
                  <FormLabel>Lembaga</FormLabel>
                  <Select
                    name="institutionId"
                    value={formData.institutionId || ""}
                    onChange={handleChange}
                    placeholder="Pilih Lembaga"
                  >
                    {institutions.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl isRequired>
                <FormLabel>Jenis Kegiatan</FormLabel>
                <Select
                  name="event_type"
                  value={formData.event_type || ""}
                  onChange={handleChange}
                  placeholder="Pilih jenis kegiatan"
                >
                  {eventCategory === "Internal" ? (
                    <>
                      <option value="Regular">Regular</option>
                      <option value="Hari_Besar">Hari Besar</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Peresmian">Peresmian</option>
                      <option value="Seasonal">Seasonal</option>
                    </>
                  ) : (
                    <>
                      <option value="Lembaga">Lembaga</option>
                      <option value="Seasonal">Seasonal</option>
                    </>
                  )}
                </Select>
              </FormControl>
              {isInternal && (
                <>
                  <HStack spacing={4}>
                    <FormControl flex={1}>
                      <FormLabel>Tahun Lunar (Opsional)</FormLabel>
                      <Select name="lunar_sui_ci_year" value={formData.lunar_sui_ci_year || ""} onChange={handleChange}>
                        <option value="">Tidak diisi</option>
                        <option value="乙巳年">乙巳年</option>
                      </Select>
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel>Bulan Lunar (Opsional)</FormLabel>
                      <Select name="lunar_month" value={formData.lunar_month || ""} onChange={handleChange}>
                        <option value="">Tidak diisi</option>
                        {lunarMonths.map(m => <option key={m} value={m}>{m}</option>)}
                      </Select>
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel>Hari Lunar (Opsional)</FormLabel>
                      <Select name="lunar_day" value={formData.lunar_day || ""} onChange={handleChange}>
                        <option value="">Tidak diisi</option>
                        {lunarDays.map(d => <option key={d} value={d}>{d}</option>)}
                      </Select>
                    </FormControl>
                  </HStack>
                  <FormControl>
                    <FormLabel>Kegiatan Berulang?</FormLabel>
                    <RadioGroup
                      value={formData.is_recurring === true ? "yes" : "no"}
                      onChange={(value) => handleIsRecurringChange(value === "yes")}
                    >
                      <HStack spacing={6}>
                        <Radio value="yes" colorScheme="blue">Ya</Radio>
                        <Radio value="no" colorScheme="orange">Tidak</Radio>
                      </HStack>
                    </RadioGroup>
                  </FormControl>
                </>
              )}
              <FormControl>
                <FormLabel>Deskripsi (Opsional)</FormLabel>
                <Textarea name="description" value={formData.description || ""} onChange={handleChange} />
              </FormControl>
            
              <FormControl>
                <FormLabel>Poster (Opsional)</FormLabel>
                <Input type="file" accept="image/*" onChange={handleImageChange} />
                {previewImage && (
                  <Box mt={4}>
                    <Cropper
                      src={previewImage}
                      style={{ height: 400, width: "100%" }}
                      ref={cropperRef}
                      autoCrop={false}
                      responsive
                    />
                  </Box>
                )}
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
          >
            {title.includes("Buat") ? "Tambah" : "Simpan"}
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const [eventCategory, setEventCategory] = useState("Internal");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const nowInWIB = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    return {
      startDate: startOfMonth(nowInWIB),
      endDate: endOfMonth(nowInWIB),
    };
  });
  const { isOpen: isDateRangeOpen, onOpen: onDateRangeOpen, onClose: onDateRangeClose } = useDisclosure();
  const [reportDateRange, setReportDateRange] = useState(() => ({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  }));
  const { isOpen: isReportDateRangeOpen, onOpen: onReportDateRangeOpen, onClose: onReportDateRangeClose } = useDisclosure();
  const [userArea, setUserArea] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();
  const [selectedReportFields, setSelectedReportFields] = useState([]);
  const [reportExportFormat, setReportExportFormat] = useState("pdf");
  const EVENT_REPORT_FIELDS = useMemo(() => {
    const baseFields = [
      { key: "name", label: "Nama Kegiatan" },
      { key: "mandarin_name", label: "Nama Kegiatan (Mandarin)" },
      { key: "type", label: "Jenis Kegiatan" },
      { key: "date", label: "Tanggal" },
      { key: "time", label: "Waktu" },
      { key: "location", label: "Lokasi" },
      { key: "area", label: "Wilayah" },
      { key: "lunar_date", label: "Tanggal Lunar" },
      { key: "description", label: "Deskripsi" },
    ];
    if (eventCategory === "External") {
      baseFields.push({ key: "institution", label: "Lembaga" });
    }
    return baseFields;
  }, [eventCategory]);
  const [mandarinFontBase64, setMandarinFontBase64] = useState("");
  const [mandarinFontLoaded, setMandarinFontLoaded] = useState(false);
  useEffect(() => {
    if (mandarinFontLoaded || mandarinFontBase64) return;
    fetch("/fonts/NotoSansSC-Regular.ttf")
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          setMandarinFontBase64(base64);
          setMandarinFontLoaded(true);
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => console.warn("Font Mandarin gagal dimuat"));
  }, [mandarinFontLoaded, mandarinFontBase64]);

  const handleFormSuccess = useCallback(async (data) => {
    console.log("✅ Event created/updated:", data);
    
      try {
        await queryClient.invalidateQueries({
          queryKey: ['events-final-v3'],
          predicate: (query) => query.queryKey[0] === 'events-final-v3'
        });
      
        console.log("🔄 Starting refetch...");
        await queryClient.refetchQueries({
          queryKey: ['events-final-v3'],
          type: 'active'
        });
      
        const newEvents = queryClient.getQueryData(['events-final-v3']) || [];
        console.log("✅ Refetch completed! New events count:", newEvents.length);
      
      } catch (error) {
        console.error("❌ Refetch failed:", error);
      }
  }, [queryClient]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUserRole(decoded.role || null);
          setUserArea(decoded.area || null);
        } catch (error) {
          console.error("Failed to decode token:", error);
        }
      }
    }
  }, []);
  
  const filteredJangkauanOptions = useMemo(() => {
    if (isNationalRole(userRole)) return jangkauanOptions;
    if (!userArea) return [];
    return jangkauanOptions.filter(o => o.value === userArea);
  }, [userRole, userArea]);

  const {
    image,
    setImage,
    previewImage,
    setPreviewImage,
    isImageLoaded,
    cropperRef,
    handleImageChange
  } = useImageUpload();

  const {
    formData,
    setFormData,
    isSubmitting,
    handleChange,
    handleIsRecurringChange,
    handleSubmit,
    handleUpdate
  } = useEventForm({
    onAddClose,
    onDetailClose,
    selectedEvent,
    resetFormData: () => {
      setFormData({
        category: eventCategory,
        event_name: "",
        event_mandarin_name: "",
        greg_occur_date: "",
        greg_end_date: "",
        area: userArea || "",
        cityId: "",
        fotangId: "",
        location_name: "",
        is_in_fotang: true,
        event_type: "Regular",
        description: "",
        lunar_sui_ci_year: "",
        lunar_month: "",
        lunar_day: "",
        is_recurring: false,
        poster_s3_bucket_link: null,
        institutionId: "",
      });
    },
    setImage,
    setPreviewImage ,
    previewImage,
    onSuccessCallback: handleFormSuccess
  });
  const deleteMutation = useDeleteEvent();

  const {
    filterOpen, setFilterOpen,
    eventTypeFilter, areaFilter, provinceFilter, cityFilter, isRecurringFilter, institutionFilter,
    tempEventTypeFilter, tempAreaFilter,
    tempProvinceFilter, setTempProvinceFilter,
    tempCityFilter, setTempCityFilter,
    tempInstitutionFilter, setTempInstitutionFilter,
    isEventTypeOpen, setIsEventTypeOpen, setTempAreaFilter,
    isLocationOpen, setIsLocationOpen,
    isInstitutionOpen, setIsInstitutionOpen,
    handleEventTypeChange,
    handleAreaFilterChange,
    handleProvinceFilterChange,
    handleCityFilterChange,
    applyFilters,
    clearFilters,
  } = useEventFilter();
  const { data: provincesRaw = [], isLoading: isProvincesLoading } = useFetchProvinces();
  const provinces = Array.isArray(provincesRaw) ? provincesRaw : (provincesRaw.data || []);
  const { data: citiesRaw = [], isLoading: isCitiesLoading } = useFetchCities(formData.provinceId || null);
  const cities = Array.isArray(citiesRaw) ? citiesRaw : (citiesRaw.data || []);
  const { data: allFotangsRaw = [], isLoading: isAllFotangsLoading } = useFetchFotang({ limit: 1000 });
  const allFotangs = (allFotangsRaw?.data || []).map(f => ({
    id: f.fotang_id,
    name: f.location_name,
    mandarin_name: f.location_mandarin_name || "",
    province_id: f.locality?.district?.city?.province?.id || null,
    province_name: f.locality?.district?.city?.province?.name || "-",
    city_id: f.locality?.district?.city?.id || null,
    city_name: f.locality?.district?.city?.name || "-",
    area: f.area || null,
  })).filter(f => f.area);
  const filteredFotangs = useMemo(() => {
    return allFotangs.filter(f => {
      if (formData.area && f.area !== formData.area) return false;
      if (formData.provinceId && f.province_id !== parseInt(formData.provinceId)) return false;
      if (formData.cityId && f.city_id !== parseInt(formData.cityId)) return false;
      return true;
    });
  }, [allFotangs, formData.area, formData.provinceId, formData.cityId]);
  const { data: institutionsRaw = [], isLoading: isInstitutionsLoading } = useFetchInstitution({ limit: 1000 });
  const institutions = (institutionsRaw?.data || []).map(i => ({
    id: i.institution_id,
    name: i.institution_name || "Tanpa Nama",
  }));
  const {
    data: citiesForExternalRaw = [],
    isLoading: isCitiesForExternalLoading
  } = useFetchCities(formData.external_provinceId || null);
  const citiesForExternal = Array.isArray(citiesForExternalRaw)
    ? citiesForExternalRaw
    : (citiesForExternalRaw.data || []);
  const { data: events = [], isLoading, error, refetch } = useFetchEvents({
    category: eventCategory,
    event_type: eventTypeFilter.length > 0 ? eventTypeFilter : undefined,
    area: isNationalRole(userRole)
      ? (areaFilter.length > 0 ? areaFilter : undefined)
      : userArea,
    province_id: provinceFilter.length > 0 ? provinceFilter : undefined,
    city_id: cityFilter.length > 0 ? cityFilter : undefined,
    institution_id: eventCategory === "External" && institutionFilter.length > 0
      ? institutionFilter
      : undefined,
    is_recurring: isRecurringFilter !== null ? isRecurringFilter : undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const {
    data: eventsForReport = [],
    isLoading: isReportLoading,
    refetch: refetchReport
  } = useFetchEvents({
    category: eventCategory,
    event_type: eventTypeFilter.length > 0 ? eventTypeFilter : undefined,
    area: isNationalRole(userRole)
      ? (areaFilter.length > 0 ? areaFilter : undefined)
      : userArea,
    province_id: provinceFilter.length > 0 ? provinceFilter : undefined,
    city_id: cityFilter.length > 0 ? cityFilter : undefined,
    institution_id: eventCategory === "External" && institutionFilter.length > 0
      ? institutionFilter
      : undefined,
    is_recurring: isRecurringFilter !== null ? isRecurringFilter : undefined,
    startDate: reportDateRange.startDate,
    endDate: reportDateRange.endDate,
    enabled: isReportDateRangeOpen
  });
  useEffect(() => {
    if (isReportOpen) {
      refetchReport();
    }
  }, [reportDateRange, isReportOpen, refetchReport]);
  const validEvents = useMemo(() => {
    return events
      .filter(e => e.rawDate && isValid(new Date(e.rawDate)))
      .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
      .filter(e => e.id && e.date && e.day && e.name);
  }, [events]);
  useEffect(() => {
    refetch();
  }, [
    dateRange,
    eventTypeFilter,
    areaFilter,
    provinceFilter, 
    cityFilter,
    isRecurringFilter,
    refetch
  ]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error Memuat Kegiatan",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      refetch();
    }
  }, [error, refetch, toast]);

  const handleAreaChange = useCallback((e) => {
    const selectedArea = e.target.value;
    const isExternalNonFotang = formData.category === "External" && formData.is_in_fotang === false;
    setFormData(prev => ({
      ...prev,
      provinceId: "",
      cityId: "",
      fotangId: "",
      external_provinceId: "",
      external_cityId: "",
      location_name: "",
      area: isExternalNonFotang ? prev.area || selectedArea : selectedArea,
      external_area: isExternalNonFotang ? selectedArea : prev.external_area || selectedArea,
    }));
  }, [formData.category, formData.is_in_fotang, setFormData]);

  const handleFotangChange = useCallback((e) => {
    const fotangId = e.target.value;
    const fotang = allFotangs.find(f => f.id === parseInt(fotangId));
    setFormData(prev => ({
      ...prev,
      fotangId,
      cityId: fotang?.city_id?.toString() || "",
      provinceId: fotang?.province_id?.toString() || "",
      location_name: "",
    }));
  }, [allFotangs, setFormData]);

  const handleProvinceChange = useCallback((e) => {
    const provinceId = e.target.value;
    setFormData(prev => ({
      ...prev,
      provinceId,
      cityId: "",
    }));
  }, [setFormData]);

  const handleCityChange = useCallback((e) => {
    const cityId = e.target.value;
    setFormData(prev => ({ ...prev, cityId }));
  }, [setFormData]);
  
  const handleEdit = useCallback((event) => {
    const eventId = event.id;
    if (!eventId) {
      toast({ title: "Error", description: "ID event tidak ditemukan", status: "error" });
      return;
    }
    router.push(`/event/editEvent?eventId=${eventId}`);
  }, [router, toast]);

  const handleDelete = useCallback((event) => {
    setSelectedEvent(event);
    onConfirmOpen();
  }, [onConfirmOpen]);

  const confirmDelete = useCallback(() => {
    if (!selectedEvent?.id) {
      toast({
        title: "Error",
        description: "ID kegiatan tidak valid",
        status: "error"
      });
      return;
    }
    deleteMutation.mutate(selectedEvent.id, {
      onSuccess: () => {
        onConfirmClose();
        refetch();
        toast({
          title: "Berhasil",
          description: "Kegiatan berhasil dihapus",
          status: "success",
          duration: 3000
        });
        onDetailClose();
      },
      onError: (err) => {
        console.error("Delete error:", err);
        toast({
          title: "Gagal Menghapus",
          description: err.response?.data?.message || err.message || "Terjadi kesalahan",
          status: "error",
          duration: 5000
        });
      },
    });
  }, [selectedEvent?.id, deleteMutation, onConfirmClose, refetch, toast, onDetailClose]);

  const openEventDetail = useCallback(async (event) => {
    if (!event?.id) {
      toast({ title: "Error", description: "ID kegiatan tidak valid", status: "error" });
      return;
    }
    setIsDetailLoading(true);
    setSelectedEvent(null);
    onDetailOpen();
    try {
      const res = await axiosInstance.get(`/event/${event.id}`);
      const data = res.data;
      const occ = data.occurrences?.[0];
      if (!occ) throw new Error("Data tanggal tidak ditemukan");
      const rawDate = new Date(occ.greg_occur_date);
      let displayLocation = "Lokasi Tidak Diketahui";
      if (data.is_in_fotang && data.fotang?.location_name) {
        displayLocation = data.fotang.location_name;
      } else if (!data.is_in_fotang && data.eventLocation?.location_name) {
        displayLocation = data.eventLocation.location_name;
      }
      let wilayahValue = "";
      if (data.is_in_fotang && data.fotang?.area) {
        wilayahValue = data.fotang.area;
      } else if (!data.is_in_fotang && data.eventLocation?.area) {
        wilayahValue = data.eventLocation.area;
      } else if (data.area) {
        wilayahValue = data.area;
      }
      const getWilayahLabel = (value) => {
        const opt = jangkauanOptions.find(o => o.value === value);
        return opt ? opt.label : "-";
      };
      const fullIndonesianDate = rawDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      setSelectedEvent({
        id: data.event_id,
        name: data.event_name || "Tanpa Nama",
        location: displayLocation,
        wilayahLabel: getWilayahLabel(wilayahValue),
        type: data.event_type || "Regular",
        description: data.description || "-",
        fullDate: fullIndonesianDate,
        time: `${format(rawDate, "HH:mm")} WIB`,
        lunar_sui_ci_year: data.lunar_sui_ci_year || "",
        lunar_month: data.lunar_month || "",
        lunar_day: data.lunar_day || "",
        poster_s3_bucket_link: data.poster_s3_bucket_link || null,
        institution_name: data.institution?.institution_name || data.institution_name || "-",
        institution: data.institution || null,
      });
    } catch (err) {
      console.error("Gagal fetch detail event:", err);
      toast({
        title: "Gagal Memuat Detail",
        description: "Terjadi kesalahan saat memuat detail kegiatan.",
        status: "error",
      });
      setSelectedEvent(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, [onDetailOpen, toast]);
  const formatDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) return "";
    return `${format(dateRange.startDate, "dd-MM-yyyy")} - ${format(dateRange.endDate, "dd-MM-yyyy")}`;
  };
  const handleApplyDateRange = () => {
    refetch();
    onDateRangeClose();
  };
  const handleEventReportExport = () => {
    if (selectedReportFields.length === 0) {
      toast({ title: "Pilih minimal satu field", status: "warning" });
      return;
    }
    const totalEvents = eventsForReport.length;

    if (totalEvents === 0) {
      toast({ title: "Tidak ada data untuk rentang tanggal ini", status: "info" });
      return;
    }

    const headers = selectedReportFields.map(k => {
      const field = EVENT_REPORT_FIELDS.find(f => f.key === k);
      return field ? field.label : k;
    });

    const rows = eventsForReport.map(event => {
      return selectedReportFields.map(key => {
        switch (key) {
          case "name": return event.name || "-";
          case "mandarin_name": return event.event_mandarin_name || "-";
          case "type": 
            return event.type === "Hari_Besar" 
              ? "Hari Besar" 
              : (event.type || "-");
          case "date": return event.fullDate || event.date || "-";
          case "time": return event.time || "-";
          case "location": return event.location || "-";
          case "area": 
            return event.wilayahLabel || 
                  (event.area ? event.area.replace("Korwil_", "Wilayah ") : "-");
          case "lunar_date": 
            return [event.lunar_sui_ci_year, event.lunar_month, event.lunar_day]
              .filter(Boolean).join(" ") || "-";
          case "description": return event.description || "-";
          case "institution":
            const instName = 
              event.institution?.institution_name ||
              event.institution_name ||
              event.institution?.name ||
              event.institutionName ||
              event.institution_id && institutions.find(i => i.id === event.institution_id)?.name ||
              "-";
            return instName;
          default: return "-";
        }
      });
    });

    const filename = `report-kegiatan-${eventCategory}-${format(reportDateRange.startDate, "yyyy-MM-dd")}_sd_${format(reportDateRange.endDate, "yyyy-MM-dd")}`;

    if (reportExportFormat === "pdf") {
      const doc = new jsPDF("landscape");
      if (mandarinFontLoaded && mandarinFontBase64) {
        doc.addFileToVFS("NotoSansSC-Regular.ttf", mandarinFontBase64);
        doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
      }
      autoTable(doc, {
        head: [headers],
        body: rows,
        theme: "grid",
        styles: { font: mandarinFontLoaded ? "NotoSansSC" : "helvetica", fontSize: 10 },
        headStyles: { fillColor: [33, 150, 243] },
        foot: [[`Total: ${totalEvents} kegiatan`]],
        didParseCell: (data) => {
          if (data.row.section === "foot") {
            data.cell.colSpan = headers.length;
            data.cell.styles.halign = "center";
            data.cell.styles.fontStyle = "bold";
          }
          if (selectedReportFields[data.column.index] === "mandarin_name" && mandarinFontLoaded) {
            data.cell.styles.font = "NotoSansSC";
          }
        }
      });
      doc.save(`${filename}.pdf`);
    }
    toast({ title: "Berhasil diekspor!", status: "success" });
    setSelectedReportFields([]);
    onReportClose();
  };
  useEffect(() => {
    console.log("allFotangs di event.js:", allFotangs);
    console.log("formData.category:", formData.category);
    console.log("formData.is_in_fotang:", formData.is_in_fotang);
  }, [allFotangs, formData.category, formData.is_in_fotang]);
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
          <Flex gap={2}>
            {["Internal", "External"].map(cat => (
              <Tag
                key={cat}
                size="lg"
                borderRadius="full"
                variant={eventCategory === cat ? "solid" : "outline"}
                colorScheme={eventCategory === cat ? "blue" : "gray"}
                cursor="pointer"
                onClick={() => {
                  setEventCategory(cat);
                  setFormData(prev => ({
                    ...prev,
                    category: cat,
                    event_type: cat === "Internal" ? "Regular" : "Lembaga",
                    event_mandarin_name: "",
                    lunar_sui_ci_year: "",
                    lunar_month: "",
                    lunar_day: "",
                    is_recurring: false,
                  }));
                }}
              >
                {cat === "Internal" ? "Internal" : "Eksternal"}
              </Tag>
            ))}
          </Flex>
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
                  spacing={3}
                  p={4}
                  bg="white"
                  borderRadius="md"
                  boxShadow="lg"
                  zIndex={20}
                  align="stretch"
                  w="320px"
                  position="absolute"
                  top="100%"
                  right={0}
                  mt={2}
                >
                  <FormControl>
                    <Flex justify="space-between" align="center">
                      <FormLabel mb={0} fontSize="sm">Jenis Kegiatan</FormLabel>
                      <IconButton size="xs" variant="ghost" icon={isEventTypeOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsEventTypeOpen(!isEventTypeOpen)} />
                    </Flex>
                    <Collapse in={isEventTypeOpen}>
                      <VStack align="start" mt={2} spacing={1}>
                        {eventTypes
                          .filter(t =>
                            eventCategory === "Internal"
                              ? !["Lembaga"].includes(t)
                              : ["Lembaga", "Seasonal"].includes(t)
                          )
                          .map(t => (
                            <Checkbox
                              key={t}
                              size="sm"
                              isChecked={tempEventTypeFilter.includes(t)}
                              onChange={() => handleEventTypeChange(t)}
                            >
                              {t === "Hari_Besar" ? "Hari Besar" : t}
                            </Checkbox>
                          ))}
                      </VStack>
                    </Collapse>
                  </FormControl>
                  <FormControl>
                    <Flex justify="space-between" align="center">
                      <FormLabel mb={0} fontSize="sm">Lokasi</FormLabel>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={isLocationOpen ? <FiMinus /> : <FiPlus />}
                        onClick={() => setIsLocationOpen(!isLocationOpen)}
                      />
                    </Flex>
                    <Collapse in={isLocationOpen}>
                      <VStack align="start" spacing={3} mt={2}>
                        {userRole === "Super Admin" && (
                          <Box w="100%">
                            <FormLabel fontSize="xs" color="gray.600" mb={1}>Wilayah</FormLabel>
                            <VStack align="start" spacing={1} maxH="120px" overflowY="auto">
                              {filteredJangkauanOptions.map(o => (
                                <Checkbox
                                  key={o.value}
                                  size="sm"
                                  isChecked={tempAreaFilter.includes(o.value)}
                                  onChange={() => {
                                    handleAreaFilterChange(o.value);
                                    setTempProvinceFilter([]);
                                    setTempCityFilter([]);
                                  }}
                                >
                                  {o.label}
                                </Checkbox>
                              ))}
                            </VStack>
                          </Box>
                        )}
                        {tempAreaFilter.length > 0 && (
                          <Box w="100%">
                            <FormLabel fontSize="xs" color="gray.600" mb={1}>Provinsi</FormLabel>
                            <VStack align="start" spacing={1} maxH="140px" overflowY="auto">
                              {Array.from(
                                new Map(
                                  allFotangs
                                    .filter(f => tempAreaFilter.includes(f.area) && f.province_id)
                                    .map(f => [f.province_id, { id: f.province_id, name: f.province_name }])
                                ).values()
                              )
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(prov => (
                                  <Checkbox
                                    key={prov.id}
                                    size="sm"
                                    isChecked={tempProvinceFilter.includes(prov.id)}
                                    onChange={() => {
                                      handleProvinceFilterChange(prov.id);
                                    }}
                                  >
                                    {prov.name}
                                  </Checkbox>
                                ))}
                            </VStack>
                          </Box>
                        )}
                        {tempProvinceFilter.length > 0 && (
                          <Box w="100%">
                            <FormLabel fontSize="xs" color="gray.600" mb={1}>Kota/Kabupaten</FormLabel>
                            <VStack align="start" spacing={1} maxH="140px" overflowY="auto">
                              {Array.from(
                                new Map(
                                  allFotangs
                                    .filter(f =>
                                      tempAreaFilter.includes(f.area) &&
                                      tempProvinceFilter.includes(f.province_id) &&
                                      f.city_id
                                    )
                                    .map(f => [f.city_id, { id: f.city_id, name: f.city_name }])
                                ).values()
                              )
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(city => (
                                  <Checkbox
                                    key={city.id}
                                    size="sm"
                                    isChecked={tempCityFilter.includes(city.id)}
                                    onChange={() => handleCityFilterChange(city.id)}
                                  >
                                    {city.name}
                                  </Checkbox>
                                ))}
                            </VStack>
                          </Box>
                        )}
                        {tempAreaFilter.length === 0 && userRole === "Super Admin" && (
                          <Text fontSize="xs" color="gray.500" mt={2}>
                            Pilih wilayah terlebih dahulu untuk melihat provinsi
                          </Text>
                        )}
                        {tempAreaFilter.length === 0 && userRole !== "Super Admin" && (
                          <Text fontSize="xs" color="gray.500" mt={2}>
                            Filter lokasi hanya tersedia untuk Super Admin
                          </Text>
                        )}
                      </VStack>
                    </Collapse>
                  </FormControl>
                  {eventCategory === "External" && (
                    <FormControl>
                      <Flex justify="space-between" align="center">
                        <FormLabel mb={0} fontSize="sm">Lembaga</FormLabel>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={isInstitutionOpen ? <FiMinus /> : <FiPlus />}
                          onClick={() => setIsInstitutionOpen(!isInstitutionOpen)}
                        />
                      </Flex>
                      <Collapse in={isInstitutionOpen}>
                        <Box w="100%" mt={2}>
                          <FormLabel fontSize="xs" color="gray.600" mb={1}>
                            Pilih satu atau lebih lembaga
                          </FormLabel>
                          <VStack align="start" spacing={1} maxH="200px" overflowY="auto" pr={2}>
                            {institutions.length === 0 ? (
                              <Text fontSize="xs" color="gray.500">Memuat lembaga...</Text>
                            ) : (
                              institutions
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(inst => (
                                  <Checkbox
                                    key={inst.id}
                                    size="sm"
                                    isChecked={tempInstitutionFilter.includes(inst.id.toString())}
                                    onChange={() => {
                                      setTempInstitutionFilter(prev =>
                                        prev.includes(inst.id.toString())
                                          ? prev.filter(v => v !== inst.id.toString())
                                          : [...prev, inst.id.toString()]
                                      );
                                    }}
                                  >
                                    {inst.name}
                                  </Checkbox>
                                ))
                            )}
                          </VStack>
                        </Box>
                      </Collapse>
                    </FormControl>
                  )}
                  <Divider />
                  <HStack justify="flex-end" spacing={2}>
                    <Button size="sm" onClick={clearFilters}>Reset</Button>
                    <Button size="sm" variant="ghost" onClick={() => setFilterOpen(false)}>Batal</Button>
                    <Button size="sm" colorScheme="blue" onClick={applyFilters}>Terapkan</Button>
                  </HStack>
                </VStack>
              )}
            </Box>
            <HStack spacing={3}>
              <Button leftIcon={<FiDownload />} colorScheme="green" size="sm" onClick={onReportOpen}>
                Report
              </Button>
              <Button
                colorScheme="blue"
                leftIcon={<FiPlus />}
                size="sm"
                onClick={() => {
                  const nowWIB = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T');
                  const defaultEventType = eventCategory === "Internal" ? "Regular" : "Lembaga";
                  setFormData({
                    ...formData,
                    category: eventCategory,
                    event_name: "",
                    event_mandarin_name: "",
                    greg_occur_date: nowWIB,
                    greg_end_date: "",
                    area: userArea || "",
                    event_type: defaultEventType,
                    is_recurring: false,
                    description: "",
                    lunar_sui_ci_year: "",
                    lunar_month: "",
                    lunar_day: "",
                    institutionId: "",
                    is_in_fotang: true,
                    location_name: "",
                    external_provinceId: "",
                    external_cityId: "",
                  });
                  setImage(null);
                  setPreviewImage(null);
                  onAddOpen();
                }}
              >
                Tambah Kegiatan
              </Button>
              <InputGroup size="xs" w="180px">
                <Input value={formatDateRange()} isReadOnly cursor="pointer" onClick={onDateRangeOpen} borderRadius="full" />
                <InputRightElement>
                  <IconButton icon={<FiCalendar />} size="xs" onClick={onDateRangeOpen} />
                </InputRightElement>
              </InputGroup>
            </HStack>
          </Flex>
        </Flex>
        <EventList events={validEvents} isLoading={isLoading} error={error} onEventClick={openEventDetail} />
        <EventDetailModal
          isOpen={isDetailOpen}
          onClose={onDetailClose}
          event={selectedEvent}
          onEdit={handleEdit}
          onDelete={handleDelete}
          imageUrl={selectedEvent?.poster_s3_bucket_link || "https://via.placeholder.com/400"}
          userRole={userRole}
        />
        <EventForm
          isOpen={isAddOpen}
          onClose={onAddClose}
          onSubmit={(e) => handleSubmit(e, cropperRef.current)}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleAreaChange={handleAreaChange}
          handleFotangChange={handleFotangChange}
          handleProvinceChange={handleProvinceChange}
          handleCityChange={handleCityChange}
          handleIsRecurringChange={handleIsRecurringChange}
          handleImageChange={handleImageChange}
          isSubmitting={isSubmitting}
          isImageLoaded={isImageLoaded}
          previewImage={previewImage}
          setPreviewImage={setPreviewImage}
          cropperRef={cropperRef}
          provinces={provinces}
          cities={cities}
          fotangs={filteredFotangs}
          allFotangs={allFotangs}
          institutions={institutions}
          isProvincesLoading={isProvincesLoading}
          isCitiesLoading={isCitiesLoading}
          isFotangsLoading={isAllFotangsLoading}
          isInstitutionsLoading={isInstitutionsLoading}
          title="Buat Kegiatan Baru"
          filteredJangkauanOptions={filteredJangkauanOptions}
          citiesForExternal={citiesForExternal}
          isCitiesForExternalLoading={isCitiesForExternalLoading}
          eventCategory={eventCategory}
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
        
        <Drawer isOpen={isReportOpen} onClose={onReportClose} size="xl">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader borderBottomWidth="1px">
              <Flex justify="space-between" align="center">
                <Text fontWeight="bold">Report Kegiatan {eventCategory}</Text>
                <IconButton icon={<FiX />} onClick={onReportClose} aria-label="Tutup" />
              </Flex>
            </DrawerHeader>
            <DrawerBody>
              <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
                <GridItem>
                  <Text fontWeight="bold" mb={4} color="blue.600">
                    Pilih Field yang Ingin Ditampilkan
                  </Text>
                  <CheckboxGroup value={selectedReportFields} onChange={setSelectedReportFields}>
                    <VStack align="start" spacing={2} maxH="70vh" overflowY="auto">
                      {EVENT_REPORT_FIELDS.map(f => (
                        <Checkbox key={f.key} value={f.key} size="sm">
                          {f.label}
                        </Checkbox>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                </GridItem>
                <GridItem>
                  <Text fontWeight="bold" mb={4} color="blue.600">Pengaturan Export</Text>
                  <VStack align="stretch" spacing={5}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>Rentang Tanggal Export</Text>
                      <InputGroup size="sm">
                        <Input
                          value={`${format(reportDateRange.startDate, "dd-MM-yyyy")} - ${format(reportDateRange.endDate, "dd-MM-yyyy")}`}
                          isReadOnly
                          cursor="pointer"
                          onClick={onReportDateRangeOpen}
                        />
                        <InputRightElement>
                          <IconButton icon={<FiCalendar />} size="xs" onClick={onReportDateRangeOpen} />
                        </InputRightElement>
                      </InputGroup>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">
                        Data akan diekspor sesuai rentang tanggal di atas.
                      </Text>
                      <Text fontSize="sm" mt={2}>
                        Total kegiatan: <strong>
                          {events.filter(e => {
                            if (!e.rawDate) return false;
                            const eventDate = new Date(e.rawDate);
                            return eventDate >= reportDateRange.startDate && eventDate <= reportDateRange.endDate;
                          }).length}
                        </strong>
                      </Text>
                    </Box>
                  </VStack>
                </GridItem>
              </Grid>
            </DrawerBody>
            <DrawerFooter borderTopWidth="1px">
              <Select size="sm" w="120px" mr={3} value={reportExportFormat} onChange={e => setReportExportFormat(e.target.value)}>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </Select>
              <Button variant="outline" mr={3} onClick={() => setSelectedReportFields([])}>Reset</Button>
              <Button
                colorScheme="green"
                onClick={handleEventReportExport}
                isDisabled={selectedReportFields.length === 0}
              >
                Ekspor {reportExportFormat.toUpperCase()}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <DateRangeModal
          isOpen={isReportDateRangeOpen}
          onClose={onReportDateRangeClose}
          onApply={onReportDateRangeClose}
          dateRange={reportDateRange}
          setDateRange={setReportDateRange}
        />
      </Box>
    </Layout>
  );
}