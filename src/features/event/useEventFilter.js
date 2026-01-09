import { useState, useCallback } from "react";

export const useEventFilter = () => {
  const [filterOpen, setFilterOpen] = useState(false);

  const [eventTypeFilter, setEventTypeFilter] = useState([]);
  const [areaFilter, setAreaFilter] = useState([]);
  const [provinceFilter, setProvinceFilter] = useState([]);
  const [cityFilter, setCityFilter] = useState([]);
  const [institutionFilter, setInstitutionFilter] = useState([]);
  const [isRecurringFilter, setIsRecurringFilter] = useState(null);

  const [tempEventTypeFilter, setTempEventTypeFilter] = useState([]);
  const [tempAreaFilter, setTempAreaFilter] = useState([]);
  const [tempProvinceFilter, setTempProvinceFilter] = useState([]); 
  const [tempCityFilter, setTempCityFilter] = useState([]);
  const [tempInstitutionFilter, setTempInstitutionFilter] = useState([]);

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
    setTempCityFilter([]);
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

    setEventTypeFilter([]);
    setAreaFilter([]);
    setProvinceFilter([]);
    setCityFilter([]);
    setInstitutionFilter([]);
  }, []);

  return {
    filterOpen,
    setFilterOpen,
    eventTypeFilter,
    areaFilter,
    provinceFilter,
    cityFilter,
    isRecurringFilter,
    institutionFilter,
    tempEventTypeFilter,
    setTempEventTypeFilter,
    tempAreaFilter,
    setTempAreaFilter,
    tempProvinceFilter,
    setTempProvinceFilter,
    tempCityFilter,
    setTempCityFilter, 
    tempInstitutionFilter,
    setTempInstitutionFilter,
    setIsRecurringFilter,
    isEventTypeOpen,
    setIsEventTypeOpen,
    isAreaOpen,
    setIsAreaOpen,
    isLocationOpen,
    setIsLocationOpen,
    isInstitutionOpen,
    setIsInstitutionOpen,
    handleEventTypeChange,
    handleAreaFilterChange,
    handleProvinceFilterChange,
    handleCityFilterChange,
    applyFilters,
    clearFilters,
  };
};