import { VStack, Input, Box, Text } from "@chakra-ui/react";

export default function LocationSection({ location = {}, onChange, hideMandarinName = false, customLabels = {} }) {
    const defaultFields = {
        location_name: "Nama Lokasi",
        location_mandarin_name: "Nama Mandarin",
        street: "Jalan",
        locality: "Kelurahan",
        district: "Kecamatan",
        city: "Kota",
        province: "Provinsi",
        postal_code: "Kode Pos",
    };

    const fields = Object.entries(defaultFields).map(([field, defaultLabel]) => [
        field,
        customLabels[field] || defaultLabel,
    ]);

    const filteredFields = fields.filter(
        ([key]) => !(hideMandarinName && key === "location_mandarin_name")
    );

    return (
        <VStack spacing={3} align="start" w="100%">
            {filteredFields.map(([field, label]) => (
                <Box key={field} w="100%">
                    <Text fontWeight="bold" mb={1}>{label}</Text>
                    <Input
                        value={location?.[field] || ""}
                        onChange={(e) =>
                            onChange({
                                ...location,
                                [field]: e.target.value,
                            })
                        }
                    />
                </Box>
            ))}
        </VStack>
    );
}
