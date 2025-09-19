import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Text, Image, useToast, Box } from "@chakra-ui/react";

export default function EventDetailModal({ isOpen, onClose, event, imageUrl }) {
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
            <Text mb={2}><strong>Tanggal:</strong> {event?.day}, {event?.dateString}</Text>
            <Text my={2}><strong>Tanggal Lunar:</strong> {event?.lunar_sui_ci_year} {event?.lunar_month} {event?.lunar_day}</Text>
            <Text my={2}><strong>Waktu:</strong> {event?.time}</Text>
            <Text my={2}><strong>Lokasi:</strong> {event?.location || "Unknown Location"}</Text>
            <Text my={2}><strong>Jenis:</strong> {event?.type}</Text>
            <Text my={2}><strong>Berulang:</strong> {event?.is_recurring ? "Ya" : "Tidak"}</Text>
            <Text my={2}><strong>Deskripsi:</strong> {event?.description}</Text>
            </ModalBody>
        </ModalContent>
        </Modal>
    );
}