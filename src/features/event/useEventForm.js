import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { axiosInstance } from "@/lib/axios";
import { validateDates } from "./eventUtils";
import { useCreateEvent } from "./useCreateEvent";
import { useUpdateEvent } from "./useUpdateEvent";
import { fromLocalToWIBISO } from "@/lib/timezone";

export const useEventForm = ({
  onAddClose,
  onEditClose,
  onDetailClose,
  selectedEvent,
  resetFormData,
  setImage,
  setPreviewImage,
  previewImage,
  onSuccessCallback
}) => {
  const toast = useToast();
  const router = useRouter();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const getEventId = () => {
    if (selectedEvent?.id) return parseInt(selectedEvent.id);
    
    if (router.query?.eventId) {
      return parseInt(router.query.eventId);
    }
    
    if (router.pathname && router.pathname.includes('/edit')) {
      return parseInt(router.query?.id || router.query?.eventId || 0);
    }
    
    return null;
  };

  const eventId = getEventId();
  const isEditMode = !!eventId;

  const [formData, setFormData] = useState({
    category: "Internal",
    event_type: "Regular",
    event_name: "",
    event_mandarin_name: "",
    greg_occur_date: "",
    greg_end_date: "",
    area: "",
    provinceId: "",
    cityId: "",
    fotangId: "",
    location_name: "",
    is_in_fotang: true,
    institutionId: "",
    lunar_sui_ci_year: "",
    lunar_month: "",
    lunar_day: "",
    is_recurring: false,
    description: "",
    poster_s3_bucket_link: null,
    external_area: "",
    external_provinceId: "",
    external_cityId: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const isInternal = formData.category === "Internal";
    const isExternal = formData.category === "External";

    if (!formData.event_name?.trim()) {
      return { valid: false, error: "Nama kegiatan wajib diisi." };
    }
    if (!formData.greg_occur_date) {
      return { valid: false, error: "Tanggal mulai wajib diisi." };
    }
    if (!formData.area && !formData.external_area) {
      return { valid: false, error: "Wilayah wajib dipilih." };
    }

    if (isInternal) {
      if (!formData.event_mandarin_name?.trim()) {
        return { valid: false, error: "Nama kegiatan (Mandarin) wajib diisi untuk Internal." };
      }
      if (!formData.fotangId) {
        return { valid: false, error: "Pilih vihara/fotang untuk kegiatan Internal." };
      }
    }

    if (isExternal) {
      if (formData.is_in_fotang) {
        if (!formData.fotangId) {
          return { valid: false, error: "Pilih vihara jika kegiatan di vihara." };
        }
      } else {
        if (!formData.external_cityId && !formData.cityId) {
          return { valid: false, error: "Pilih kota/kabupaten jika kegiatan tidak di vihara." };
        }
        if (!formData.location_name?.trim()) {
          return { valid: false, error: "Nama tempat wajib diisi jika tidak di vihara." };
        }
      }
    }

    const dateValidation = validateDates(formData.greg_occur_date, formData.greg_end_date);
    if (!dateValidation.valid) return dateValidation;

    return { valid: true };
  }, [formData]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    if (name === "category") {
      const isInternal = value === "Internal";
      const isExternal = value === "External";
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        provinceId: "",
        cityId: "",
        fotangId: "",
        external_provinceId: "",
        external_cityId: "",
        location_name: "",
        is_in_fotang: true,
        ...(isInternal
          ? {
              event_mandarin_name: "",
              lunar_sui_ci_year: "",
              lunar_month: "",
              lunar_day: "",
              is_recurring: false,
              institutionId: "",
              event_type: "Regular"
            }
          : {
              institutionId: "",
              event_type: "Lembaga",
              external_area: prev.area || ""
            }
        )
      }));

      return;
    }

    if (name === "is_in_fotang" && formData.category === "External") {
      const boolValue = checked;
      setFormData(prev => ({
        ...prev,
        is_in_fotang: boolValue,
        ...(boolValue
          ? {
              external_provinceId: "",
              external_cityId: "",
              location_name: "",
              provinceId: "",
              cityId: "",
              fotangId: ""
            }
          : {
              fotangId: "",
              provinceId: "",
              cityId: "",
              external_area: prev.area || ""
            }
        )
      }));
      return;
    }

    if (name === "is_in_fotang") {
      setFormData(prev => ({
        ...prev,
        is_in_fotang: checked,
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, [formData.category, formData.area]);

  const handleIsRecurringChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, is_recurring: value }));
  }, []);

  const getCroppedImage = useCallback((cropperRef) => {
    return new Promise((resolve) => {
      if (!cropperRef?.current?.cropper) {
        resolve(null);
        return;
      }

      try {
        const canvas = cropperRef.current.cropper.getCroppedCanvas({
          width: 1200,
          height: 1600,
        });

        if (!canvas) {
          resolve(null);
          return;
        }

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const file = new File([blob], `poster_${Date.now()}.jpeg`, { type: "image/jpeg" });
          resolve(file);
        }, "image/jpeg", 0.85);
      } catch (err) {
        console.error("Error cropping image:", err);
        resolve(null);
      }
    });
  }, []);

  const buildPayload = useCallback((posterUrl = null) => {
    const category = formData.category === "External" ? "External" : "Internal";

    const gregOccurDateISO = fromLocalToWIBISO(formData.greg_occur_date);
    const gregEndDateISO = formData.greg_end_date ? fromLocalToWIBISO(formData.greg_end_date) : null;

    let event_type = formData.event_type;

    if (category === "External") {
      if (!["Lembaga", "Seasonal"].includes(event_type)) {
        event_type = "Lembaga";
      }
    }

    if (!gregOccurDateISO) {
      throw new Error("Tanggal mulai tidak valid");
    }

    const payload = {
      category,
      event_type,
      event_name: formData.event_name.trim(),
      event_mandarin_name: formData.category === "Internal" ? formData.event_mandarin_name?.trim() || null : null,
      is_in_fotang: formData.is_in_fotang,
      area: formData.is_in_fotang ? formData.area : (formData.external_area || formData.area),
      is_recurring: formData.category === "Internal" ? formData.is_recurring : false,
      description: formData.description?.trim() || null,
      poster_s3_bucket_link: posterUrl || formData.poster_s3_bucket_link || null,
      occurrences: [{
        greg_occur_date: gregOccurDateISO,
        greg_end_date: gregEndDateISO,
      }],
    };

    if (formData.is_in_fotang && formData.fotangId) {
      payload.fotangId = parseInt(formData.fotangId);
    }

    if (!formData.is_in_fotang) {
      payload.createEventLocation = true;
      payload.location_name = formData.location_name.trim();
      payload.cityId = parseInt(formData.external_cityId || formData.cityId);
      payload.area = formData.external_area || formData.area;
    }

    if (category === "External" && formData.institutionId) {
      payload.institutionId = parseInt(formData.institutionId);
    }

    if (category === "Internal") {
      payload.lunar_sui_ci_year = formData.lunar_sui_ci_year || null;
      payload.lunar_month = formData.lunar_month || null;
      payload.lunar_day = formData.lunar_day || null;
    }

    console.log("🚀 PAYLOAD DEBUG:", { category, event_type, is_in_fotang: formData.is_in_fotang, payload }); // ✅ DEBUG

    return payload;
  }, [formData]);

  const uploadAndSubmit = async (e, cropperRef, isUpdate = false) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateForm();
    if (!validation.valid) {
      toast({ 
        title: "Validasi Gagal", 
        description: validation.error, 
        status: "error",
        duration: 5000
      });
      setIsSubmitting(false);
      return;
    }

    let finalPosterUrl = formData.poster_s3_bucket_link || null;

    if (previewImage && cropperRef?.current?.cropper) {
      try {
        const croppedFile = await getCroppedImage(cropperRef);
        if (croppedFile) {
          const fd = new FormData();
          fd.append("file", croppedFile);

          const res = await axiosInstance.post("/event/upload-poster", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          finalPosterUrl = res.data.url;
          setFormData(prev => ({ ...prev, poster_s3_bucket_link: res.data.url }));
        }
      } catch (err) {
        console.error("Upload poster gagal:", err);
        toast({
          title: "Poster Gagal Diunggah",
          description: "Kegiatan tetap disimpan tanpa poster.",
          status: "warning",
          duration: 4000
        });
      }
    }

    const payload = buildPayload(finalPosterUrl);

    let mutation, mutateArg;

    if (isUpdate && eventId) {
      mutation = updateMutation;
      mutateArg = { id: eventId, payload };
    } else {
      mutation = createMutation;
      mutateArg = payload;
    }

    mutation.mutate(mutateArg, {
      onSuccess: (responseData) => {
        toast({
          title: "Berhasil",
          description: isUpdate ? "Kegiatan berhasil diperbarui." : "Kegiatan berhasil ditambahkan.",
          status: "success",
          duration: 3000
        });

        if (onSuccessCallback) {
          onSuccessCallback(responseData);
        }

        resetFormData?.();
        setImage?.(null);
        setPreviewImage?.(null);
        if (isUpdate) {
          onEditClose?.();
          onDetailClose?.();
        } else {
          onAddClose?.();
        }
      },
      onError: (err) => {
        console.error("Mutation error:", err);
        toast({
          title: "Gagal",
          description: err.response?.data?.message || err.message || "Terjadi kesalahan.",
          status: "error",
          duration: 5000
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  const handleSubmit = useCallback(
    (e, cropperRef) => uploadAndSubmit(e, cropperRef, false),
    [formData, previewImage, validateForm, toast, createMutation, onAddClose, resetFormData, setImage, setPreviewImage]
  );

  const handleUpdate = useCallback(
    (e, cropperRef) => uploadAndSubmit(e, cropperRef, true),
    [formData, previewImage, eventId, validateForm, toast, updateMutation, onEditClose, onDetailClose, resetFormData, setImage, setPreviewImage]
  );

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [setPreviewImage]);

  return {
    formData,
    setFormData,
    isSubmitting,
    isEditMode,
    eventId,
    handleChange,
    handleIsRecurringChange,
    handleSubmit,
    handleUpdate,
    handleImageChange,
    validateForm,
  };
};