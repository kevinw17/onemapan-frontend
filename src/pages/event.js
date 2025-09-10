import {
  Box, Button, Flex, Heading, Text, IconButton, useToast,
  Tag, VStack, Divider, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  useDisclosure, FormControl, FormLabel, Input, Select,
  Textarea, HStack, Menu, MenuButton, MenuList, MenuItem,
  Collapse, Checkbox, Radio, RadioGroup, Image, Spinner
} from "@chakra-ui/react";
import { FiEdit, FiTrash, FiPlus, FiChevronDown, FiFilter, FiMinus, FiPlus as FiPlusIcon } from "react-icons/fi";
import Layout from "@/components/layout";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";

// Backend base URL (adjust to your backend's actual URL and port)
const BACKEND_BASE_URL = "http://localhost:2025";

// Utility function to debounce state updates
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Utility function to sanitize and validate image URL
const getImageUrl = (url) => {
  const fallbackUrl = "https://via.placeholder.com/400";
  console.log("getImageUrl input:", url); // Debug input
  if (!url || typeof url !== "string" || url.trim() === "") {
    console.warn("Image URL is empty or invalid, using fallback:", fallbackUrl);
    return fallbackUrl;
  }

  // If the URL is already absolute (starts with http:// or https://), validate it
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      new URL(url);
      console.log("Using absolute URL:", url);
      return url; // Use as-is if valid
    } catch (e) {
      console.error("Invalid absolute URL:", url, e);
      return fallbackUrl;
    }
  }

  // Handle relative paths or malformed URLs
  const normalizedUrl = url.startsWith("/uploads/")
    ? url
    : `/uploads/${url.replace(/^\/*uploads\//i, "")}`;
  const fullUrl = `${BACKEND_BASE_URL}${normalizedUrl}`;
  console.log("Generated image URL:", fullUrl); // Debug generated URL
  try {
    new URL(fullUrl);
    return fullUrl;
  } catch (e) {
    console.error("Invalid URL generated:", fullUrl, e);
    return fallbackUrl;
  }
};

// Utility function to validate image file
const validateImageFile = (file) => {
  if (!file) return { valid: false, error: "Harap pilih file gambar." };
  const validTypes = ["image/jpeg", "image/png"];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: "Harap unggah file JPEG atau PNG." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "Ukuran file maksimum 5MB." };
  }
  return { valid: true };
};

// Utility function to validate dates
const validateDates = (startDate, endDate) => {
  if (!startDate) return { valid: false, error: "Tanggal mulai wajib diisi." };
  if (endDate && new Date(endDate) <= new Date(startDate)) {
    return { valid: false, error: "Tanggal selesai harus setelah tanggal mulai." };
  }
  return { valid: true };
};

const fetchEvents = async ({ event_type = [], provinceId = [] }) => {
  const response = await axiosInstance.get("/event/filtered", {
    params: {
      event_type: event_type.length ? event_type.join(",") : undefined,
      provinceId: provinceId.length ? provinceId.join(",") : undefined,
    },
  }).catch(() => ({ data: [] }));

  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  const flattenedEvents = response.data.flatMap((event) => {
    if (!event.occurrences || !Array.isArray(event.occurrences)) {
      return [];
    }

    return event.occurrences.map((occ) => {
      const startDate = new Date(occ.greg_occur_date);
      const endDate = occ.greg_end_date ? new Date(occ.greg_end_date) : null;

      if (isNaN(startDate.getTime())) {
        return null;
      }

      const isSameDay = endDate
        ? startDate.getFullYear() === endDate.getFullYear() &&
          startDate.getMonth() === endDate.getMonth() &&
          startDate.getDate() === endDate.getDate()
        : true;

      const isSameMonthYear = endDate
        ? startDate.getFullYear() === endDate.getFullYear() &&
          startDate.getMonth() === endDate.getMonth()
        : false;

      const startDay = startDate.toLocaleDateString("id-ID", { day: "numeric" });
      const endDay = endDate && !isNaN(endDate.getTime())
        ? endDate.toLocaleDateString("id-ID", { day: "numeric" })
        : "TBD";
      const monthYear = startDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      const endMonthYear = endDate && !isNaN(endDate.getTime())
        ? endDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
        : "TBD";
      const dateRange = isSameDay
        ? `${startDay} ${monthYear}`
        : isSameMonthYear
        ? `${startDay} - ${endDay} ${monthYear}`
        : `${startDay} ${monthYear} - ${endDay} ${endMonthYear}`;

      const startDayName = startDate.toLocaleDateString("id-ID", { weekday: "long" }).split(",")[0];
      const endDayName = endDate && !isNaN(endDate.getTime())
        ? endDate.toLocaleDateString("id-ID", { weekday: "long" }).split(",")[0]
        : "TBD";
      const dayRange = isSameDay ? startDayName : `${startDayName} - ${endDayName}`;

      const startTime = startDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " WIB";
      const endTime = endDate && !isNaN(endDate.getTime())
        ? endDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) + " WIB"
        : "TBD";
      const timeDisplay = isSameDay ? `${startTime} - ${endTime}` : startTime;

      return {
        id: event.event_id,
        occurrence_id: occ.occurrence_id,
        date: dateRange,
        day: dayRange,
        time: timeDisplay,
        isSameDay,
        name: event.event_name || "Unnamed Event",
        location: typeof event.location === 'object' && event.location?.location_name
          ? event.location.location_name
          : event.location || "Unknown Location",
        localityId: event.location?.localityId || "",
        provinceId: event.location?.locality?.district?.city?.provinceId || "",
        cityId: event.location?.locality?.district?.city?.id || "",
        districtId: event.location?.locality?.district?.id || "",
        type: event.event_type === "Hari_Besar" ? "Hari Besar" : event.event_type || "Regular",
        description: event.description || "No description available",
        lunar_sui_ci_year: event.lunar_sui_ci_year || "",
        lunar_month: event.lunar_month || "",
        lunar_day: event.lunar_day || "",
        is_recurring: event.is_recurring || false,
        poster_s3_bucket_link: event.poster_s3_bucket_link || null,
        rawDate: startDate,
        rawEndDate: endDate,
        occurrences: event.occurrences.map((o) => ({
          occurrence_id: o.occurrence_id,
          greg_occur_date: new Date(o.greg_occur_date),
          greg_end_date: o.greg_end_date ? new Date(o.greg_end_date) : null,
        })),
      };
    }).filter(event => event !== null);
  });

  return flattenedEvents;
};

const fetchProvinces = async () => {
  const response = await axiosInstance.get("/profile/location/provinces");
  return response.data || [];
};

const fetchCities = async (provinceId) => {
  if (!provinceId) return [];
  const response = await axiosInstance.get(`/profile/location/cities?provinceId=${provinceId}`);
  return response.data || [];
};

const fetchDistricts = async (cityId) => {
  if (!cityId) return [];
  const response = await axiosInstance.get(`/profile/location/districts?cityId=${cityId}`);
  return response.data || [];
};

const fetchLocalities = async (districtId) => {
  if (!districtId) return [];
  const response = await axiosInstance.get(`/profile/location/localities?districtId=${districtId}`);
  return response.data || [];
};

const deleteEvent = async (id) => {
  const response = await axiosInstance.delete(`/event/${id}`);
  return response.data;
};

const updateEvent = async (id, payload) => {
  await axiosInstance.patch(`/event/${id}`, payload);
};

const createEvent = async (payload) => {
  const response = await axiosInstance.post("/event", payload);
  return response.data;
};

export default function Event() {
  const toast = useToast();
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
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const cropperRef = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState([]);
  const [provinceFilter, setProvinceFilter] = useState([]);
  const [tempEventTypeFilter, setTempEventTypeFilter] = useState([]);
  const [tempProvinceFilter, setTempProvinceFilter] = useState([]);
  const [isEventTypeFilterOpen, setIsEventTypeFilterOpen] = useState(false);
  const [isProvinceFilterOpen, setIsProvinceFilterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState("Bulan ini");

  const memoizedImageUrl = useMemo(() => 
    selectedEvent?.poster_s3_bucket_link ? getImageUrl(selectedEvent.poster_s3_bucket_link) : "https://via.placeholder.com/400", 
    [selectedEvent?.poster_s3_bucket_link]
  );

  // Debounced setPreviewImage to prevent rapid updates
  const setPreviewImageDebounced = useCallback(debounce(setPreviewImage, 300), []);

  // Validate image URL before rendering Cropper
  useEffect(() => {
    if (previewImage && typeof previewImage === "string" && previewImage !== "") {
      const img = new window.Image();
      img.src = previewImage;
      img.onload = () => setIsImageLoaded(true);
      img.onerror = () => {
        console.error("Failed to load image:", previewImage);
        setIsImageLoaded(false);
        setPreviewImage(null);
        toast({
          title: "Gagal Memuat Gambar",
          description: "Tidak dapat memuat gambar untuk cropping.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      };
    } else {
      setIsImageLoaded(false);
    }
  }, [previewImage, toast]);

  // Handle Cropper.replace errors
  useEffect(() => {
    if (cropperRef.current?.cropper && previewImage && isImageLoaded) {
      try {
        cropperRef.current.cropper.replace(previewImage);
      } catch (error) {
        console.error("Error replacing Cropper image:", error);
        setIsImageLoaded(false);
        toast({
          title: "Error",
          description: "Gagal memperbarui gambar di Cropper.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [previewImage, isImageLoaded, toast]);

  useEffect(() => {
    const fetchProvincesData = async () => {
      try {
        const res = await fetchProvinces();
        setProvinces(res);
      } catch (err) {
        toast({
          title: "Gagal memuat provinsi",
          description: err.message || "Terjadi kesalahan saat memuat data provinsi.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchProvincesData();
  }, [toast]);

  const handleProvinceChange = useCallback(async (e) => {
    const provinceId = e.target.value;
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
      setCities(res);
    } catch (error) {
      toast({
        title: "Gagal memuat kota",
        description: error.message || "Terjadi kesalahan saat memuat data kota.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleCityChange = useCallback(async (e) => {
    const cityId = e.target.value;
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
      setDistricts(res);
    } catch (err) {
      toast({
        title: "Gagal memuat kecamatan",
        description: err.message || "Terjadi kesalahan saat memuat data kecamatan.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleDistrictChange = useCallback(async (e) => {
    const districtId = e.target.value;
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
      toast({
        title: "Gagal memuat kelurahan",
        description: err.message || "Terjadi kesalahan saat memuat data kelurahan.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLocalityLoading(false);
    }
  }, [toast]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) {
      toast({
        title: "Tidak ada file dipilih",
        description: "Silakan pilih file gambar (JPEG atau PNG).",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "File Tidak Valid",
        description: validation.error,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setImage(null);
      setPreviewImageDebounced(null);
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImageDebounced(reader.result);
    };
    reader.onerror = () => {
      toast({
        title: "Gagal Membaca File",
        description: "Tidak dapat membaca file gambar. Silakan coba file lain.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setImage(null);
      setPreviewImageDebounced(null);
    };
    reader.readAsDataURL(file);
  }, [toast, setPreviewImageDebounced]);

  const getCroppedImage = useCallback(() => {
    if (!image || !cropperRef.current?.cropper) {
      return Promise.resolve(image);
    }
    return new Promise((resolve) => {
      cropperRef.current.cropper.getCroppedCanvas().toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `poster.${blob.type === "image/jpeg" ? "jpg" : "png"}`, {
            type: blob.type,
          });
          resolve(file);
        } else {
          resolve(image);
        }
      }, "image/jpeg", 0.8);
    });
  }, [image]);

  const handleIsRecurringChange = useCallback((value) => {
    setFormData((prev) => ({
      ...prev,
      is_recurring: value === "true",
    }));
  }, []);

  const handleEventTypeFilterChange = useCallback((value) => {
    setTempEventTypeFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  }, []);

  const handleProvinceFilterChange = useCallback((value) => {
    setTempProvinceFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  }, []);

  const applyFilters = useCallback(() => {
    setEventTypeFilter([...tempEventTypeFilter]);
    setProvinceFilter([...tempProvinceFilter]);
    setFilterOpen(false);
    queryClient.invalidateQueries({ queryKey: ["events"] });
  }, [tempEventTypeFilter, tempProvinceFilter, queryClient]);

  const clearFilters = useCallback(() => {
    setTempEventTypeFilter([]);
    setTempProvinceFilter([]);
    setEventTypeFilter([]);
    setProvinceFilter([]);
    setFilterOpen(false);
    queryClient.invalidateQueries({ queryKey: ["events"] });
  }, [queryClient]);

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
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
      onConfirmClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateEvent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Kegiatan Diperbarui",
        description: "Kegiatan berhasil diperbarui.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      resetFormData();
      onEditClose();
      onDetailClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || "Gagal memperbarui kegiatan.";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Kegiatan Ditambahkan",
        description: "Kegiatan berhasil ditambahkan.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      resetFormData();
      onAddClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || "Gagal menambahkan kegiatan.";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

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

    const imageUrl = event.poster_s3_bucket_link ? getImageUrl(event.poster_s3_bucket_link) : null;
    setImage(null);
    setPreviewImageDebounced(imageUrl);

    try {
      if (event.provinceId) {
        const citiesData = await fetchCities(event.provinceId);
        setCities(citiesData);
      }

      if (event.cityId) {
        const districtsData = await fetchDistricts(event.cityId);
        setDistricts(districtsData);
      }

      if (event.districtId) {
        setIsLocalityLoading(true);
        const localitiesData = await fetchLocalities(event.districtId);
        setLocalities(localitiesData);
        setIsLocalityLoading(false);
      }

      if (imageUrl) {
        const img = new window.Image();
        img.src = imageUrl;
        img.onerror = () => {
          console.error("Invalid image URL in handleEdit:", imageUrl);
          setPreviewImageDebounced(null);
          toast({
            title: "Gagal Memuat Gambar",
            description: "Poster kegiatan tidak valid.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        };
      }
    } catch (error) {
      toast({
        title: "Gagal memuat data lokasi",
        description: error.message || "Terjadi kesalahan saat memuat data lokasi.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    onEditOpen();
  }, [toast, setPreviewImageDebounced, onEditOpen]);

  const handleDelete = useCallback((event) => {
    setSelectedEvent(event);
    onConfirmOpen();
  }, [onConfirmOpen]);

  const confirmDelete = useCallback(() => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id);
    }
  }, [selectedEvent, deleteMutation]);

  const openDetailPopup = useCallback(async (event) => {
    try {
      const response = await axiosInstance.get(`/event/${event.id}`);
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
        description: "Gagal memuat detail kegiatan.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast, onDetailOpen]);

  const openActionPopup = useCallback(async (event) => {
    try {
      const response = await axiosInstance.get(`/event/${event.id}`);
      setSelectedEvent({
        ...event,
        ...response.data,
        location: typeof response.data.location === 'object' && response.data.location?.location_name
          ? response.data.location.location_name
          : response.data.location || "Unknown Location",
        poster_s3_bucket_link: response.data.poster_s3_bucket_link || null,
      });
      onActionOpen();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat detail kegiatan.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast, onActionOpen]);

  const validateForm = useCallback(() => {
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
      return { valid: false, error: "Semua field wajib diisi kecuali Nama Kegiatan (Mandarin), Deskripsi, Tanggal Selesai, dan Poster." };
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
      return { valid: false, error: "Semua ID lokasi harus berupa angka." };
    }

    if (isLocalityLoading) {
      return { valid: false, error: "Data kelurahan masih dimuat. Tunggu sebentar." };
    }

    const dateValidation = validateDates(formData.greg_occur_date, formData.greg_end_date);
    if (!dateValidation.valid) {
      return dateValidation;
    }

    return { valid: true };
  }, [formData, isLocalityLoading]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateForm();
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    let poster_s3_bucket_link = formData.poster_s3_bucket_link;
    if (image) {
      const croppedImage = await getCroppedImage();
      if (croppedImage) {
        const formDataImage = new FormData();
        formDataImage.append("file", croppedImage);
        try {
          const uploadResponse = await axiosInstance.post("/event/upload", formDataImage, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          poster_s3_bucket_link = uploadResponse.data.url;
        } catch (error) {
          toast({
            title: "Error",
            description: "Gagal mengunggah poster.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setIsSubmitting(false);
          return;
        }
      }
    }

    const occurrences = [
      {
        greg_occur_date: new Date(formData.greg_occur_date).toISOString(),
        greg_end_date: formData.greg_end_date ? new Date(formData.greg_end_date).toISOString() : null,
      },
    ];

    if (formData.is_recurring) {
      const startDate = new Date(formData.greg_occur_date);
      const endDate = formData.greg_end_date ? new Date(formData.greg_end_date) : null;
      const timeDiff = endDate ? endDate.getTime() - startDate.getTime() : 0;
      const endOfNextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0);
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + 7);

      while (currentDate <= endOfNextMonth) {
        const newOccurDate = new Date(currentDate);
        const newEndDate = endDate ? new Date(newOccurDate.getTime() + timeDiff) : null;
        occurrences.push({
          greg_occur_date: newOccurDate.toISOString(),
          greg_end_date: newEndDate ? newEndDate.toISOString() : null,
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }

    const payload = {
      event_name: formData.event_name,
      event_mandarin_name: formData.event_mandarin_name || null,
      localityId: parseInt(formData.localityId),
      location_name: formData.location_name,
      provinceId: parseInt(formData.provinceId),
      cityId: parseInt(formData.cityId),
      districtId: parseInt(formData.districtId),
      event_type: formData.event_type,
      description: formData.description || null,
      lunar_sui_ci_year: formData.lunar_sui_ci_year,
      lunar_month: formData.lunar_month,
      lunar_day: formData.lunar_day,
      is_recurring: formData.is_recurring,
      poster_s3_bucket_link,
      occurrences,
    };

    createMutation.mutate(payload);
    setIsSubmitting(false);
  }, [formData, image, getCroppedImage, validateForm, toast, createMutation]);

  const handleUpdate = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateForm();
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    let poster_s3_bucket_link = formData.poster_s3_bucket_link;
    if (image) {
      const croppedImage = await getCroppedImage();
      if (croppedImage) {
        const formDataImage = new FormData();
        formDataImage.append("file", croppedImage);
        try {
          const uploadResponse = await axiosInstance.post("/event/upload", formDataImage, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          poster_s3_bucket_link = uploadResponse.data.url;
        } catch (error) {
          toast({
            title: "Error",
            description: "Gagal mengunggah poster.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setIsSubmitting(false);
          return;
        }
      }
    }

    const occurrences = [
      {
        greg_occur_date: new Date(formData.greg_occur_date).toISOString(),
        greg_end_date: formData.greg_end_date ? new Date(formData.greg_end_date).toISOString() : null,
      },
    ];

    if (formData.is_recurring) {
      const startDate = new Date(formData.greg_occur_date);
      const endDate = formData.greg_end_date ? new Date(formData.greg_end_date) : null;
      const timeDiff = endDate ? endDate.getTime() - startDate.getTime() : 0;
      const endOfNextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0);
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + 7);

      while (currentDate <= endOfNextMonth) {
        const newOccurDate = new Date(currentDate);
        const newEndDate = endDate ? new Date(newOccurDate.getTime() + timeDiff) : null;
        occurrences.push({
          greg_occur_date: newOccurDate.toISOString(),
          greg_end_date: newEndDate ? newEndDate.toISOString() : null,
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }

    const payload = {
      event_name: formData.event_name,
      event_mandarin_name: formData.event_mandarin_name || null,
      localityId: parseInt(formData.localityId),
      location_name: formData.location_name,
      provinceId: parseInt(formData.provinceId),
      cityId: parseInt(formData.cityId),
      districtId: parseInt(formData.districtId),
      event_type: formData.event_type,
      description: formData.description || null,
      lunar_sui_ci_year: formData.lunar_sui_ci_year,
      lunar_month: formData.lunar_month,
      lunar_day: formData.lunar_day,
      is_recurring: formData.is_recurring,
      poster_s3_bucket_link,
      occurrences,
    };

    updateMutation.mutate({ id: selectedEvent.id, payload });
    setIsSubmitting(false);
  }, [formData, image, selectedEvent, getCroppedImage, validateForm, toast, updateMutation]);

  const resetFormData = useCallback(() => {
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
    setCities([]);
    setDistricts([]);
    setLocalities([]);
    setIsLocalityLoading(false);
    setImage(null);
    setPreviewImageDebounced(null);
  }, [setPreviewImageDebounced]);

  const currentDate = new Date("2025-09-10T16:52:00+07:00"); // Updated to 04:52 PM WIB, September 10, 2025
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
              hour: "2-digit",
              minute: "2-digit",
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
            <Spinner size="xl" />
            <Text fontSize="xl" textAlign="center">
              Memuat kegiatan...
            </Text>
          </VStack>
        ) : error ? (
          <VStack h="70vh" justify="center" align="center">
            <Text fontSize="xl" textAlign="center">
              Error memuat kegiatan: {error.message}
            </Text>
          </VStack>
        ) : filteredEvents.length === 0 ? (
          <VStack h="70vh" justify="center" align="center">
            <Text fontSize="xl" textAlign="center">
              Tidak ada kegiatan untuk saat ini
            </Text>
          </VStack>
        ) : (
          filteredEvents.map((event) => (
            <Box
              key={`${event.id}-${event.occurrence_id}`}
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
                    {event.location || "Unknown Location"}
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

        <Modal isOpen={isDetailOpen} onClose={onDetailClose}>
          <ModalOverlay />
          <ModalContent maxW="600px">
            <ModalHeader>{selectedEvent?.name || "Detail Kegiatan"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedEvent?.poster_s3_bucket_link && (
                <Box mb={4} display="flex" justifyContent="center">
                  <Image
                    src={memoizedImageUrl}
                    alt={`Poster untuk ${selectedEvent.name}`}
                    fallbackSrc="https://via.placeholder.com/400"
                    style={{
                      width: "auto",
                      maxWidth: "400px", // Further zoomed out to reduce space usage
                      height: "auto",
                      maxHeight: "600px", // Adjusted to fit within modal while maintaining aspect ratio
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                    onError={() => {
                      toast({
                        title: "Gagal Memuat Gambar",
                        description: `Tidak dapat memuat poster untuk ${selectedEvent.name}.`,
                        status: "warning",
                        duration: 3000,
                        isClosable: true,
                      });
                    }}
                  />
                </Box>
              )}
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
                <strong>Lokasi:</strong> {selectedEvent?.location || "Unknown Location"}
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
                  onClick={() => handleEdit(selectedEvent)}
                  flex="1"
                  mr={2}
                >
                  Edit
                </Button>
                <Button
                  colorScheme="red"
                  leftIcon={<FiTrash />}
                  onClick={() => handleDelete(selectedEvent)}
                  flex="1"
                  ml={2}
                >
                  Hapus
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isActionOpen} onClose={onActionClose}>
          <ModalOverlay />
          <ModalContent maxW="600px">
            <ModalHeader>{selectedEvent?.name || "Aksi Kegiatan"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedEvent?.poster_s3_bucket_link && (
                <Box mb={4} display="flex" justifyContent="center">
                  <Image
                    src={memoizedImageUrl}
                    alt={`Poster untuk ${selectedEvent.name}`}
                    fallbackSrc="https://via.placeholder.com/400"
                    style={{
                      width: "auto",
                      maxWidth: "400px", // Further zoomed out to reduce space usage
                      height: "auto",
                      maxHeight: "600px", // Adjusted to fit within modal while maintaining aspect ratio
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                    onError={() => {
                      toast({
                        title: "Gagal Memuat Gambar",
                        description: `Tidak dapat memuat poster untuk ${selectedEvent.name}.`,
                        status: "warning",
                        duration: 3000,
                        isClosable: true,
                      });
                    }}
                  />
                </Box>
              )}
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
                <strong>Lokasi:</strong> {selectedEvent?.location || "Unknown Location"}
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
                  onClick={() => handleEdit(selectedEvent)}
                  flex="1"
                  mr={2}
                >
                  Edit
                </Button>
                <Button
                  colorScheme="red"
                  leftIcon={<FiTrash />}
                  onClick={() => handleDelete(selectedEvent)}
                  flex="1"
                  ml={2}
                >
                  Hapus
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

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
                        isDisabled={cities.length === 0}
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
                        isDisabled={districts.length === 0}
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
                        isDisabled={localities.length === 0 || isLocalityLoading}
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
                          aspectRatio={1.414} // A4 ratio (210mm x 297mm)
                          viewMode={0} // Remove viewMode constraint to allow full image cropping
                          autoCrop={false} // Disable auto-crop to start from edges
                          responsive={true}
                          ref={cropperRef}
                        />
                      </Box>
                    )}
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
              <Button
                colorScheme="blue"
                type="submit"
                form="edit-event-form"
                isLoading={isSubmitting}
                loadingText="Menyimpan..."
              >
                Simpan Perubahan
              </Button>
              <Button variant="ghost" onClick={onEditClose} ml={3}>
                Batal
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isAddOpen} onClose={onAddClose} size="2xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Buat Kegiatan Baru</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <form id="add-event-form" onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch">
                  <HStack spacing={4}>
                    <FormControl isRequired flex={1}>
                      <FormLabel>Nama Kegiatan</FormLabel>
                      <Input
                        name="event_name"
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
                        isDisabled={cities.length === 0}
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
                        isDisabled={districts.length === 0}
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
                        isDisabled={localities.length === 0 || isLocalityLoading}
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
                          aspectRatio={1}
                          viewMode={1}
                          autoCropArea={1}
                          responsive={true}
                          ref={cropperRef}
                        />
                      </Box>
                    )}
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
              <Button
                colorScheme="blue"
                type="submit"
                form="edit-event-form"
                isLoading={isSubmitting}
                loadingText="Menyimpan..."
              >
                Simpan Perubahan
              </Button>
              <Button variant="ghost" onClick={onEditClose} ml={3}>
                Batal
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isAddOpen} onClose={onAddClose} size="2xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Buat Kegiatan Baru</ModalHeader>
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
                        isDisabled={cities.length === 0}
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
                        isDisabled={districts.length === 0}
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
                        isDisabled={localities.length === 0 || isLocalityLoading}
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
                          aspectRatio={1}
                          viewMode={1}
                          autoCropArea={1}
                          responsive={true}
                          ref={cropperRef}
                        />
                      </Box>
                    )}
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
              <Button
                colorScheme="blue"
                type="submit"
                form="add-event-form"
                isLoading={isSubmitting}
                loadingText="Menambahkan..."
              >
                Tambah Kegiatan
              </Button>
              <Button variant="ghost" onClick={onAddClose} ml={3}>
                Batal
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isConfirmOpen} onClose={onConfirmClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Konfirmasi Hapus</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Apakah Anda yakin ingin menghapus kegiatan {selectedEvent?.name}?</Text>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="red"
                onClick={confirmDelete}
                isLoading={deleteMutation.isLoading}
              >
                Hapus
              </Button>
              <Button variant="ghost" onClick={onConfirmClose} ml={3}>
                Batal
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
}