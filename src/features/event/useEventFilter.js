import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const useEventFilter = () => {
    const queryClient = useQueryClient();
    const [filterOpen, setFilterOpen] = useState(false);
    const [eventTypeFilter, setEventTypeFilter] = useState([]);
    const [provinceFilter, setProvinceFilter] = useState([]);
    const [tempEventTypeFilter, setTempEventTypeFilter] = useState([]);
    const [tempProvinceFilter, setTempProvinceFilter] = useState([]);
    const [isEventTypeFilterOpen, setIsEventTypeFilterOpen] = useState(false);
    const [isProvinceFilterOpen, setIsProvinceFilterOpen] = useState(false);
    const [filter, setFilter] = useState("Bulan ini");

    const handleEventTypeFilterChange = useCallback((value) => {
        setTempEventTypeFilter((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
    }, []);

    const handleProvinceFilterChange = useCallback((value) => {
        setTempProvinceFilter((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
    }, []);

    const applyFilters = useCallback(() => {
        console.log("Applying filters:", { tempEventTypeFilter, tempProvinceFilter });
        setEventTypeFilter([...tempEventTypeFilter]);
        setProvinceFilter([...tempProvinceFilter]);
        setFilterOpen(false);
        queryClient.invalidateQueries({ queryKey: ["fetch.events", tempEventTypeFilter, tempProvinceFilter] });
    }, [tempEventTypeFilter, tempProvinceFilter, queryClient]);

    const clearFilters = useCallback(() => {
        console.log("Clearing filters");
        setTempEventTypeFilter([]);
        setTempProvinceFilter([]);
        setEventTypeFilter([]);
        setProvinceFilter([]);
        setFilterOpen(false);
        queryClient.invalidateQueries({ queryKey: ["fetch.events", [], []] });
    }, [queryClient]);

    return {
        filterOpen,
        setFilterOpen,
        eventTypeFilter,
        setEventTypeFilter,
        provinceFilter,
        setProvinceFilter,
        tempEventTypeFilter,
        setTempEventTypeFilter,
        tempProvinceFilter,
        setTempProvinceFilter,
        isEventTypeFilterOpen,
        setIsEventTypeFilterOpen,
        isProvinceFilterOpen,
        setIsProvinceFilterOpen,
        filter,
        setFilter,
        handleEventTypeFilterChange,
        handleProvinceFilterChange,
        applyFilters,
        clearFilters,
    };
};