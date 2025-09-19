import { Box, Flex, Text, Tag, Menu, MenuButton, MenuList, MenuItem, IconButton, HStack } from "@chakra-ui/react";
import { FiMoreVertical } from "react-icons/fi";

export default function EventList({ events, onEventClick, viewMode, date }) {
    if (!events || events.length === 0) {
        return (
            <Box mt={4}>
                <Text color="gray.500" textAlign="center" fontSize="sm">
                {viewMode === "month"
                    ? `Tidak ada acara di bulan ${date.toLocaleString("id-ID", { month: "long", year: "numeric" })}`
                    : "Tidak ada acara pada tanggal ini."}
                </Text>
            </Box>
        );
    }

    return (
        <Box mt={4}>
        {events.length > 0 ? (
            events.map((event) => (
            <Flex
                key={`${event.id}-${event.occurrence_id}`}
                justify="space-between"
                align="center"
                mb={2}
                p={2}
                bg="gray.50"
                borderRadius="md"
            >
                <Box>
                {viewMode === "month" ? (
                    <>
                    <Text fontSize="md" fontWeight="bold" color="#2e05e8ff">
                        {event.dateString}
                    </Text>
                    {event.time && (
                        <Text fontSize="md" fontWeight="bold" color="#2e05e8ff">{event.time}</Text>
                    )}
                    </>
                ) : (
                    event.time && (
                    <Text fontSize="lg" fontWeight="bold" color="#2e05e8ff">{event.time}</Text>
                    )
                )}
                <Text fontSize="md" fontWeight="bold">{event.name}</Text>
                <Text fontSize="sm" color="gray.600">{event.location}</Text>
                <HStack spacing={2} mt={1}>
                    <Tag size="sm" variant="solid" colorScheme="blue">{event.type}</Tag>
                    {event.is_recurring && (
                    <Tag size="sm" variant="solid" colorScheme="green">Berulang</Tag>
                    )}
                </HStack>
                </Box>
                <Menu>
                <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    size="sm"
                    aria-label="More options"
                />
                <MenuList>
                    <MenuItem onClick={() => onEventClick(event)}>Lihat Detail</MenuItem>
                </MenuList>
                </Menu>
            </Flex>
            ))
        ) : (
            <Text color="gray.500" textAlign="center" fontSize="sm">
            {viewMode === "month"
                ? `Tidak ada acara di bulan ${date.toLocaleString("id-ID", { month: "long", year: "numeric" })}`
                : "Tidak ada acara pada tanggal ini."}
            </Text>
        )}
        </Box>
    );
}