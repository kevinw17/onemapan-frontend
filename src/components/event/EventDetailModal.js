import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Text,
  Image,
  Box,
  VStack,
  Button,
} from "@chakra-ui/react";

export default function EventDetailModal({ isOpen, onClose, event, imageUrl }) {
  if (!event) return null;

  const hasValue = (val) =>
    val !== null &&
    val !== undefined &&
    val !== "" &&
    val !== "-" &&
    String(val).trim() !== "";

  const institutionName =
    event.institution_name ||
    event.institution?.institution_name ||
    event.institution?.name ||
    event.institutionName ||
    null;

  const category =
    event.category ||
    (event.type === "Lembaga" || event.type === "Seasonal" ? "External" : "Internal");

  const lunarDate = [event.lunar_sui_ci_year, event.lunar_month, event.lunar_day]
    .filter(Boolean)
    .join(" ")
    .trim();

  const fullDate = event.fullDate || event.dateString || "Tanggal tidak tersedia";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box>{event.name || "Detail Kegiatan"}</Box>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {event.poster_s3_bucket_link && (
            <Box mb={6} display="flex" justifyContent="center">
              <Image
                src={imageUrl || event.poster_s3_bucket_link}
                alt={`Poster ${event.name}`}
                fallbackSrc="https://via.placeholder.com/500x700?text=Poster+Tidak+Tersedia"
                maxH="500px"
                borderRadius="md"
                objectFit="contain"
                boxShadow="sm"
              />
            </Box>
          )}

          <VStack align="start" spacing={3} fontSize="md">
            <Text>
              <strong>Tanggal:</strong> {fullDate}
            </Text>

            {hasValue(event.time) && (
              <Text>
                <strong>Waktu:</strong> {event.time}
              </Text>
            )}

            {lunarDate && (
              <Text>
                <strong>Tanggal Lunar:</strong> {lunarDate}
              </Text>
            )}

            {hasValue(event.location) && (
              <Text>
                <strong>Lokasi:</strong> {event.location}
              </Text>
            )}

            {hasValue(event.type) && (
              <Text>
                <strong>Jenis:</strong>{" "}
                {event.type === "Hari_Besar" ? "Hari Besar" : event.type}
              </Text>
            )}

            <Text>
              <strong>Kategori:</strong>{" "}
              {category === "Internal" ? "Internal" : "External"}
            </Text>

            {hasValue(event.wilayahLabel) && (
              <Text>
                <strong>Wilayah:</strong> {event.wilayahLabel}
              </Text>
            )}

            {category === "External" && hasValue(institutionName) && (
              <Text>
                <strong>Lembaga:</strong> {institutionName}
              </Text>
            )}

            {event.is_recurring && (
              <Text>
                <strong>Berulang:</strong> Ya
              </Text>
            )}

            {hasValue(event.description) && (
              <Text whiteSpace="pre-wrap">
                <strong>Deskripsi:</strong> {event.description}
              </Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}