// src/pages/event/editEvent.js
import Layout from "@/components/layout";
import { 
  Box, 
  Spinner, 
  VStack, 
  Text, 
  Button, 
  Flex, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalCloseButton, 
  ModalBody, 
  ModalFooter,
  useDisclosure,
  useToast 
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, useCallback } from "react";
import { axiosInstance } from "@/lib/axios";
import { useEventForm } from "@/features/event/useEventForm";
import { useDeleteEvent } from "@/features/event/useDeleteEvent"; // ✅ IMPORT INI
import { useFetchProvinces, useFetchCities } from "@/features/location/useFetchLocations";
import { useFetchFotang } from "@/features/location/useFetchFotang";
import { useFetchInstitution } from "@/features/institution/useFetchInstitution";
import EventFormContent from "@/components/EventFormContent";
import { jwtDecode } from "jwt-decode";
import { toWIBLocalString } from "@/lib/timezone";
import { isNationalRole } from "@/lib/roleUtils";

export default function EditEvent() {
  const router = useRouter();
  const { eventId } = router.query;
  const toast = useToast(); // ✅ ADD TOAST
  const cropperRef = useRef(null);

  // ✅ DELETE MODAL & MUTATION
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const deleteEventMutation = useDeleteEvent();

  const [loading, setLoading] = useState(true);
  const [userArea, setUserArea] = useState("Korwil_1");
  const [previewImage, setPreviewImage] = useState(null);
  const [formLoaded, setFormLoaded] = useState(false);
  const [userRole, setUserRole] = useState(null); // ✅ ADD USER ROLE

  const {
    formData,
    setFormData,
    isSubmitting,
    handleChange,
    handleIsRecurringChange,
    handleUpdate,
    handleImageChange,
  } = useEventForm({
    selectedEvent: null,
    onEditClose: () => window.location.href = '/event',
    resetFormData: () => {},
    setImage: () => {},
    setPreviewImage,
    previewImage,
  });

  // ✅ TOKEN HANDLING - ADD ROLE
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        
        if (decoded.role === "Super Admin" || !decoded.area) {
          setUserArea("Korwil_1");
        } else {
          const area = decoded.area;
          setUserArea(area);
        }
        
        setUserRole(decoded.role || null); // ✅ SET USER ROLE
      } catch (e) {
        setUserArea("Korwil_1");
        setUserRole(null);
      }
    } else {
      setUserArea("Korwil_1");
      setUserRole(null);
    }
  }, []);

  // ✅ DELETE HANDLERS
  const handleDelete = () => {
    onConfirmOpen();
  };

  const handleConfirmDelete = async () => {
    if (!eventId) return;
    
    try {
      await deleteEventMutation.mutateAsync(eventId);
      toast({
        title: "Kegiatan berhasil dihapus",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/event");
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "Terjadi kesalahan saat menghapus";
      toast({
        title: "Gagal menghapus",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onConfirmClose();
    }
  };

  // ... (sisa kode fetchFotangDetails, handleAreaChange, dll tetap sama)

  const fetchFotangDetails = useCallback(async (fotangId) => {
    if (!fotangId) return null;
    try {
      const res = await axiosInstance.get(`/fotang/${fotangId}`);
      const fotang = res.data;
      
      const provinceId = String(fotang.locality?.district?.city?.province?.id || "");
      const cityId = String(fotang.locality?.district?.city?.id || "");
      
      return { provinceId, cityId, area: fotang.area };
    } catch (err) {
      console.error("Fotang details error:", err.message);
      return null;
    }
  }, []);

  const handleAreaChange = useCallback((e) => {
    const area = e.target.value;
    setFormData(prev => ({
      ...prev,
      area,
      provinceId: "",
      cityId: "",
      fotangId: ""
    }));
  }, [setFormData]);

  const handleProvinceChange = useCallback((e) => {
    const provinceId = e.target.value;
    setFormData(prev => ({
      ...prev,
      provinceId,
      cityId: "",
      fotangId: ""
    }));
  }, [setFormData]);

  const handleCityChange = useCallback((e) => {
    const cityId = e.target.value;
    setFormData(prev => ({
      ...prev,
      cityId,
      fotangId: ""
    }));
  }, [setFormData]);

  const handleFotangChange = useCallback((e) => {
    const fotangId = e.target.value;
    setFormData(prev => ({ ...prev, fotangId }));
  }, [setFormData]);

  // Data pendukung
  const { data: provinces = [] } = useFetchProvinces();
  const { data: citiesForExternal = [] } = useFetchCities(formData.external_provinceId || null);
  const { data: allFotangsRaw = [] } = useFetchFotang({ limit: 1000 });
  const { data: institutionsRaw = [] } = useFetchInstitution({ limit: 1000 });

  const allFotangs = (allFotangsRaw?.data || []).map(f => ({
    id: f.fotang_id,
    name: f.location_name,
    area: f.area || null,
    province_id: f.locality?.district?.city?.province?.id || null,
    province_name: f.locality?.district?.city?.province?.name || "-",
    city_id: f.locality?.district?.city?.id || null,
    city_name: f.locality?.district?.city?.name || "-",
  })).filter(f => f.area && f.province_id && f.city_id);

  const institutions = (institutionsRaw?.data || []).map(i => ({
    id: i.institution_id,
    name: i.institution_name
  }));

  const jangkauanOptions = [
    { value: "Korwil_1", label: "Wilayah 1" },
    { value: "Korwil_2", label: "Wilayah 2" },
    { value: "Korwil_3", label: "Wilayah 3" },
    { value: "Korwil_4", label: "Wilayah 4" },
    { value: "Korwil_5", label: "Wilayah 5" },
    { value: "Korwil_6", label: "Wilayah 6" },
  ];

  // Token handling
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        
        if (decoded.role === "Super Admin" || !decoded.area) {
          setUserArea("Korwil_1");
          return;
        }
        
        const area = decoded.area;
        setUserArea(area);
      } catch (e) {
        setUserArea("Korwil_1");
      }
    } else {
      setUserArea("Korwil_1");
    }
  }, []);

  // Form load
  useEffect(() => {
    if (!eventId) return;

    let isCancelled = false;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        console.log("🚀 START LOADING EVENT:", eventId);

        const res = await axiosInstance.get(`/event/${eventId}`);
        const event = res.data;
        
        console.log("🔍 RAW EVENT DATA:", {
          category: event.category,
          is_in_fotang: event.is_in_fotang,
          eventLocation: event.eventLocation,
          institution_id: event.institution_id,
          fotang: event.fotang
        });

        const occ = event.occurrences?.[0];
        const gregOccurDateWIB = occ?.greg_occur_date ? toWIBLocalString(occ.greg_occur_date) : "";
        const gregEndDateWIB = occ?.greg_end_date ? toWIBLocalString(occ.greg_end_date) : "";

        const isInternal = event.category === "Internal";
        const isInFotang = Boolean(event.is_in_fotang);

        // ✅ INITIALIZE
        let area = "Korwil_1";
        let fotangId = "";
        let provinceId = "";
        let cityId = "";
        let external_area = "";
        let external_provinceId = "";
        let external_cityId = "";
        let location_name = "";
        let institutionId = ""; // ✅ INI YANG MASALAH

        // ✅ CASE 1: INTERNAL / EXTERNAL + FOTANG
        if ((isInternal || (event.category === "External" && isInFotang)) && event.fotang) {
          fotangId = String(event.fotang.fotang_id || "");
          area = event.fotang.area || "Korwil_1";
          if (fotangId) {
            const fotangDetails = await fetchFotangDetails(fotangId);
            if (fotangDetails) {
              provinceId = fotangDetails.provinceId;
              cityId = fotangDetails.cityId;
            }
          }
        }

        // ✅ CASE 2: EXTERNAL + NON-FOTANG
        if (event.category === "External" && !isInFotang && event.eventLocation) {
          console.log("🔍 EVENTLOCATION DATA:", event.eventLocation);
          
          external_area = event.eventLocation.area || "Korwil_1";
          external_provinceId = String(
            event.eventLocation.city?.provinceId || 
            event.eventLocation.city?.province?.id || 
            event.eventLocation.province_id || 
            event.eventLocation.provinceId || 
            ""
          );
          external_cityId = String(
            event.eventLocation.cityId || 
            event.eventLocation.city?.id || 
            ""
          );
          location_name = event.eventLocation.location_name || "";
          area = external_area;
          
          console.log("✅ EXTERNAL FIELDS FIXED:", {
            external_area,
            external_provinceId,
            external_cityId,
            location_name,
            cityProvince: event.eventLocation.city?.provinceId
          });
        }

        // ✅ CASE 3: INSTITUTION - FIXED VERSION!
        console.log("🔍 FULL EVENT STRUCTURE FOR INSTITUTION:", {
          eventLocation_institution_id: event.eventLocation?.institution_id,
          eventLocation_institutionId: event.eventLocation?.institutionId,
          eventLocation_institution: event.eventLocation?.institution,
          event_institution_id: event.institution_id,
          event_institutionId: event.institutionId,
          event_institution: event.institution,
          event_keys: Object.keys(event).filter(k => k.toLowerCase().includes('institution')),
        });

        if (event.category === "External") {
          // ✅ PRIORITAS 1: event.institutionId (WORKING!)
          institutionId = String(event.institutionId || "");
          
          // ✅ PRIORITAS 2: event.institution.institution_id
          if (!institutionId && event.institution?.institution_id) {
            institutionId = String(event.institution.institution_id);
          }
          
          // ✅ PRIORITAS 3: Direct fields
          if (!institutionId) {
            institutionId = String(
              event.institution_id || 
              event.eventLocation?.institution_id || 
              event.eventLocation?.institutionId || 
              ""
            );
          }
          
          console.log("✅ INSTITUTION RESOLUTION:", {
            final_institutionId: institutionId,
            found_in: institutionId ? "SUCCESS" : "NOT_FOUND",
            source: institutionId ? 
              (event.institutionId ? "event.institutionId" : 
              event.institution?.institution_id ? "event.institution.institution_id" : 
              "other") : "none"
          });
        }

        // ✅ FORM DATA - INI YANG PENTING!
        const formDataToSet = {
          category: event.category || "Internal",
          event_name: event.event_name || "",
          event_mandarin_name: event.event_mandarin_name || "",
          greg_occur_date: gregOccurDateWIB,
          greg_end_date: gregEndDateWIB,
          area,
          is_in_fotang: isInFotang,
          fotangId,
          provinceId,
          cityId,
          external_area,
          external_provinceId,
          external_cityId,
          location_name,
          institutionId, // ✅ INI YANG HARUS MASUK!
          event_type: event.event_type || "Regular",
          description: event.description || "",
          is_recurring: !!event.is_recurring,
          poster_s3_bucket_link: event.poster_s3_bucket_link || null,
        };

        console.log("✅ FINAL FORM DATA:", formDataToSet);

        setFormData(formDataToSet);
        setPreviewImage(event.poster_s3_bucket_link || null);
        
        setTimeout(() => {
          setFormLoaded(true);
        }, 100);

      } catch (err) {
        console.error("❌ Error loading event:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchEvent();
    return () => { isCancelled = true; };
  }, [eventId, setFormData, fetchFotangDetails]);

  useEffect(() => {
    if (!formLoaded || !institutions.length || !formData.institutionId) return;
    
    const institutionExists = institutions.some(i => String(i.id) === String(formData.institutionId));
    if (institutionExists) {
      console.log("✅ Institution auto-selected:", formData.institutionId);
    } else {
      console.log("⚠️ Institution not found in list:", formData.institutionId);
    }
  }, [formLoaded, institutions, formData.institutionId]);

  if (loading) {
    return (
      <Layout>
        <VStack h="80vh" justify="center" spacing={6}>
          <Spinner size="xl" color="blue.500" />
          <Text fontSize="lg" fontWeight="semibold">Memuat data kegiatan...</Text>
        </VStack>
      </Layout>
    );
  }

  const canDelete = isNationalRole(userRole);

  return (
    <Layout title={`Edit: ${formData.event_name || "Kegiatan"}`}>
      <Box p={2}>
        <VStack spacing={6} align="stretch">
          <Text fontSize="2xl" fontWeight="bold">
            Pengubahan Data Kegiatan
          </Text>

          <EventFormContent
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            handleIsRecurringChange={handleIsRecurringChange}
            handleAreaChange={handleAreaChange}
            handleProvinceChange={handleProvinceChange}
            handleCityChange={handleCityChange}
            handleFotangChange={handleFotangChange}
            handleImageChange={handleImageChange}
            previewImage={previewImage}
            provinces={provinces}
            citiesForExternal={citiesForExternal}
            allFotangs={allFotangs}
            institutions={institutions}
            filteredJangkauanOptions={jangkauanOptions}
            eventCategory={formData.category}
          />

          {/* ✅ BUTTONS - SAMA PERSIS SEPERTI EDITUMAT */}
          <Flex gap={4} mt={8}>
            {canDelete && (
              <Button 
                colorScheme="red" 
                w="120px" 
                size="lg"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
            <Button 
              onClick={() => router.push("/event")} 
              colorScheme="gray" 
              flex="1"
              size="lg"
            >
              Batal
            </Button>
            <Button
              colorScheme="blue"
              isLoading={isSubmitting}
              onClick={(e) => handleUpdate(e, cropperRef.current)}
              flex="1"
              size="lg"
            >
              Simpan Perubahan
            </Button>
          </Flex>
        </VStack>
      </Box>

      {/* ✅ DELETE CONFIRMATION MODAL - SAMA PERSIS SEPERTI EDITUMAT */}
      {canDelete && (
        <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} size="xs" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Konfirmasi hapus data</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Apakah Anda yakin ingin menghapus kegiatan ini?</Text>
            </ModalBody>
            <ModalFooter>
              <Flex w="100%" gap={2}>
                <Button 
                  variant="ghost" 
                  onClick={onConfirmClose} 
                  flex="1"
                >
                  Tidak
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleConfirmDelete} 
                  flex="1"
                  isLoading={deleteEventMutation.isLoading}
                >
                  Ya
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Layout>
  );
}