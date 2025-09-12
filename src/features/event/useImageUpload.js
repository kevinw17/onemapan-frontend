import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@chakra-ui/react";
import { validateImageFile } from "./eventUtils";

export const useImageUpload = () => {
    const toast = useToast();
    const cropperRef = useRef(null);
    const [image, setImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
        };
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const setPreviewImageDebounced = useCallback(debounce(setPreviewImage, 300), []);

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

    return {
        image,
        setImage,
        previewImage,
        setPreviewImage,
        isImageLoaded,
        cropperRef,
        handleImageChange,
        getCroppedImage,
    };
};