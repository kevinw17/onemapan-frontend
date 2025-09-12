// features/event/useEventForm.js
import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { axiosInstance } from "@/lib/axios";
import { validateDates } from "./eventUtils";
import { useCreateEvent } from "./useCreateEvent";
import { useUpdateEvent } from "./useUpdateEvent";

export const useEventForm = ({ onAddClose, onEditClose, selectedEvent, resetFormData }) => {
    const toast = useToast();
    const createMutation = useCreateEvent();
    const updateMutation = useUpdateEvent();
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        if (isNaN(provinceId) || isNaN(cityId) || isNaN(districtId) || isNaN(localityId)) {
        return { valid: false, error: "Semua ID lokasi harus berupa angka." };
        }

        const dateValidation = validateDates(formData.greg_occur_date, formData.greg_end_date);
        if (!dateValidation.valid) {
        return dateValidation;
        }

        return { valid: true };
    }, [formData]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        }));
    }, []);

    const handleIsRecurringChange = useCallback((value) => {
        setFormData((prev) => ({
        ...prev,
        is_recurring: value === "true",
        }));
    }, []);

    const getCroppedImage = useCallback((cropperRef) => {
        if (!cropperRef.current?.cropper) {
        return Promise.resolve(null);
        }
        return new Promise((resolve) => {
        cropperRef.current.cropper.getCroppedCanvas().toBlob((blob) => {
            if (blob) {
            const file = new File([blob], `poster.${blob.type === "image/jpeg" ? "jpg" : "png"}`, {
                type: blob.type,
            });
            resolve(file);
            } else {
            resolve(null);
            }
        }, "image/jpeg", 0.8);
        });
    }, []);

    const handleSubmit = useCallback(
        async (e, cropperRef) => {
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
        if (cropperRef.current?.cropper) {
            const croppedImage = await getCroppedImage(cropperRef);
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

        createMutation.mutate(payload, {
            onSuccess: () => {
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
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            },
        });
        setIsSubmitting(false);
        },
        [formData, validateForm, toast, createMutation, onAddClose, resetFormData, getCroppedImage]
    );

    const handleUpdate = useCallback(
        async (e, cropperRef) => {
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
        if (cropperRef.current?.cropper) {
            const croppedImage = await getCroppedImage(cropperRef);
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

        updateMutation.mutate(
            { id: selectedEvent.id, payload },
            {
            onSuccess: () => {
                toast({
                title: "Kegiatan Diperbarui",
                description: "Kegiatan berhasil diperbarui.",
                status: "success",
                duration: 3000,
                isClosable: true,
                });
                resetFormData();
                onEditClose();
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
            }
        );
        setIsSubmitting(false);
        },
        [formData, selectedEvent, validateForm, toast, updateMutation, onEditClose, resetFormData, getCroppedImage]
    );

    return {
        formData,
        setFormData,
        isSubmitting,
        handleChange,
        handleIsRecurringChange,
        handleSubmit,
        handleUpdate,
        validateForm,
    };
};