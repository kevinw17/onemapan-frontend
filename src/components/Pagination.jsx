import { HStack, IconButton, Select, Text } from "@chakra-ui/react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function Pagination({
    page,
    totalPages,
    pageSize,
    onLimitChange,
    onPageChange,
}) {
    const isPrevDisabled = page <= 1;
    const isNextDisabled = page >= totalPages;

    return (
        <HStack
            justify="space-between"
            align="center"
            flexWrap="wrap"
            gap={4}
        >
            <HStack spacing={3}>
                <Select
                    value={pageSize}
                    borderRadius="md"
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                    width="fit-content"
                    size="sm"
                    borderColor="black"
                >
                    {[10, 20, 50].map((size) => (
                        <option key={size} value={size}>
                        {size}
                        </option>
                    ))}
                </Select>
                <Text fontSize="sm" color="gray.600">
                Umat per halaman
                </Text>
            </HStack>

            <HStack spacing={2}>
                <IconButton
                    icon={<HiChevronLeft />}
                    aria-label="Halaman sebelumnya"
                    size="md"
                    onClick={() => onPageChange(page - 1)}
                    isDisabled={isPrevDisabled}
                    variant="ghost"
                />
                <Text fontSize="sm" color="gray.600">
                    {page} of {totalPages}
                </Text>
                <IconButton
                    icon={<HiChevronRight />}
                    aria-label="Halaman berikutnya"
                    size="md"
                    onClick={() => onPageChange(page + 1)}
                    isDisabled={isNextDisabled}
                    variant="ghost"
                />
            </HStack>
        </HStack>
    );
}