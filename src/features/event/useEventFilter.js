// src/features/event/useEventFilter.js
import { useState, useCallback } from "react";

export const useEventFilter = () => {
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter yang sudah diterapkan (dipakai di useFetchEvents)
  const [eventTypeFilter, setEventTypeFilter] = useState([]);
  const [areaFilter, setAreaFilter] = useState([]);
  const [provinceFilter, setProvinceFilter] = useState([]);
  const [cityFilter, setCityFilter] = useState([]);
  const [institutionFilter, setInstitutionFilter] = useState([]);
  const [isRecurringFilter, setIsRecurringFilter] = useState(null);

  // Temporary filter (di dalam modal filter)
  const [tempEventTypeFilter, setTempEventTypeFilter] = useState([]);
  const [tempAreaFilter, setTempAreaFilter] = useState([]);           // WAJIB ADA
  const [tempProvinceFilter, setTempProvinceFilter] = useState([]);   // WAJIB ADA (array, bukan string)
  const [tempCityFilter, setTempCityFilter] = useState([]);           // WAJIB ADA
  const [tempInstitutionFilter, setTempInstitutionFilter] = useState([]);

  // Collapse state
  const [isEventTypeOpen, setIsEventTypeOpen] = useState(false);
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isInstitutionOpen, setIsInstitutionOpen] = useState(false);

  const handleEventTypeChange = useCallback((value) => {
    setTempEventTypeFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }, []);

  const handleAreaFilterChange = useCallback((value) => {
    setTempAreaFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }, []);

  const handleProvinceFilterChange = useCallback((provinceId) => {
    setTempProvinceFilter(prev =>
      prev.includes(provinceId)
        ? prev.filter(v => v !== provinceId)
        : [...prev, provinceId]
    );
    setTempCityFilter([]); // auto reset kota
  }, []);

  const handleCityFilterChange = useCallback((cityId) => {
    setTempCityFilter(prev =>
      prev.includes(cityId)
        ? prev.filter(v => v !== cityId)
        : [...prev, cityId]
    );
  }, []);

  const applyFilters = useCallback(() => {
    setEventTypeFilter([...tempEventTypeFilter]);
    setAreaFilter([...tempAreaFilter]);
    setProvinceFilter([...tempProvinceFilter]);
    setCityFilter([...tempCityFilter]);
    setInstitutionFilter([...tempInstitutionFilter]);
    setFilterOpen(false);
  }, [tempEventTypeFilter, tempAreaFilter, tempProvinceFilter, tempCityFilter, tempInstitutionFilter]);

  const clearFilters = useCallback(() => {
    setTempEventTypeFilter([]);
    setTempAreaFilter([]);
    setTempProvinceFilter([]);
    setTempCityFilter([]);
    setTempInstitutionFilter([]);

    // Reset juga filter aktif
    setEventTypeFilter([]);
    setAreaFilter([]);
    setProvinceFilter([]);
    setCityFilter([]);
    setInstitutionFilter([]);
  }, []);

  return {
    // UI
    filterOpen,
    setFilterOpen,

    // Active filters (untuk query)
    eventTypeFilter,
    areaFilter,
    provinceFilter,
    cityFilter,
    isRecurringFilter,
    institutionFilter,

    // Temp filters (modal)
    tempEventTypeFilter,
    setTempEventTypeFilter,
    tempAreaFilter,
    setTempAreaFilter,                 // INI YANG DIPAKAI DI event.js
    tempProvinceFilter,
    setTempProvinceFilter,             // INI JUGA
    tempCityFilter,
    setTempCityFilter,                 // DAN INI
    tempInstitutionFilter,
    setTempInstitutionFilter,
    setIsRecurringFilter,

    // Collapse
    isEventTypeOpen,
    setIsEventTypeOpen,
    isAreaOpen,
    setIsAreaOpen,
    isLocationOpen,
    setIsLocationOpen,
    isInstitutionOpen,
    setIsInstitutionOpen,

    // Handlers
    handleEventTypeChange,
    handleAreaFilterChange,
    handleProvinceFilterChange,
    handleCityFilterChange,
    applyFilters,
    clearFilters,
  };
};