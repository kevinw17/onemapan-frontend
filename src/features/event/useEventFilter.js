import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const useEventFilter = () => {
    const queryClient = useQueryClient();
    const [filterOpen, setFilterOpen] = useState(false);
    const [eventTypeFilter, setEventTypeFilter] = useState([]);
    const [jangkauanFilter, setJangkauanFilter] = useState([]);
    const [isRecurringFilter, setIsRecurringFilter] = useState([]);
    const [tempEventTypeFilter, setTempEventTypeFilter] = useState([]);
    const [tempJangkauanFilter, setTempJangkauanFilter] = useState([]);
    const [tempIsRecurringFilter, setTempIsRecurringFilter] = useState([]);
    const [isEventTypeFilterOpen, setIsEventTypeFilterOpen] = useState(false);
    const [isJangkauanFilterOpen, setIsJangkauanFilterOpen] = useState(false);
    const [isIsRecurringFilterOpen, setIsIsRecurringFilterOpen] = useState(false);
    const [filter, setFilter] = useState("Bulan ini");

    const handleEventTypeFilterChange = useCallback((value) => {
        setTempEventTypeFilter((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
    }, []);

    const handleJangkauanFilterChange = useCallback((value) => {
        setTempJangkauanFilter((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
    }, []);

    const handleIsRecurringFilterChange = useCallback((value) => {
        setTempIsRecurringFilter((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
    }, []);

    const applyFilters = useCallback(() => {
        setEventTypeFilter([...tempEventTypeFilter]);
        setJangkauanFilter([...tempJangkauanFilter]);
        setIsRecurringFilter([...tempIsRecurringFilter]);
        setFilterOpen(false);
        queryClient.invalidateQueries({ 
            queryKey: ["fetch.events", tempEventTypeFilter, tempJangkauanFilter, tempIsRecurringFilter] 
        });
    }, [tempEventTypeFilter, tempJangkauanFilter, tempIsRecurringFilter, queryClient]);

    const clearFilters = useCallback(() => {
        setTempEventTypeFilter([]);
        setTempJangkauanFilter([]);
        setTempIsRecurringFilter([]);
        setEventTypeFilter([]);
        setJangkauanFilter([]);
        setIsRecurringFilter([]);
        setFilterOpen(false);
        queryClient.invalidateQueries({ queryKey: ["fetch.events", [], [], []] });
    }, [queryClient]);

    return {
        filterOpen,
        setFilterOpen,
        eventTypeFilter,
        setEventTypeFilter,
        jangkauanFilter,
        setJangkauanFilter,
        isRecurringFilter,
        setIsRecurringFilter,
        tempEventTypeFilter,
        setTempEventTypeFilter,
        tempJangkauanFilter,
        setTempJangkauanFilter,
        tempIsRecurringFilter,
        setTempIsRecurringFilter,
        isEventTypeFilterOpen,
        setIsEventTypeFilterOpen,
        isJangkauanFilterOpen,
        setIsJangkauanFilterOpen,
        isIsRecurringFilterOpen,
        setIsIsRecurringFilterOpen,
        filter,
        setFilter,
        handleEventTypeFilterChange,
        handleJangkauanFilterChange,
        handleIsRecurringFilterChange,
        applyFilters,
        clearFilters,
    };
};