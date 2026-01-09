import {
  Box, VStack, HStack, FormControl, FormLabel, Input, Select, Textarea,
  Checkbox, RadioGroup, Radio
} from "@chakra-ui/react";

const lunarYears = ["乙巳年"];
const lunarMonths = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
const lunarDays = Array.from({length: 30}, (_, i) =>
  i < 9 ? `初${i + 1}日` : i === 29 ? "三十日" : `${i + 1}日`
);

export default function EventFormContent({
  formData, setFormData, handleChange, handleAreaChange, handleFotangChange,
  handleProvinceChange, handleCityChange, handleIsRecurringChange,
  handleImageChange, previewImage,
  provinces, citiesForExternal, allFotangs, institutions,
  filteredJangkauanOptions, eventCategory
}) {
  const isInternal = formData.category === "Internal";
  const isExternal = formData.category === "External";
  const isInFotang = formData.is_in_fotang === true;
  
  const activeArea = isExternal && !isInFotang
    ? (formData.external_area || formData.area || "")
    : (formData.area || "");

  const filteredProvinces = activeArea 
    ? allFotangs
        .filter(f => f.area === activeArea)
        .map(f => ({
          id: String(f.province_id),
          name: f.province_name
        }))
        .filter((p, index, self) => 
          index === self.findIndex(p2 => p2.id === p.id)
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const filteredCities = activeArea && formData.provinceId
    ? allFotangs
        .filter(f => 
          f.area === activeArea && 
          String(f.province_id) === String(formData.provinceId)
        )
        .map(f => ({
          id: String(f.city_id),
          name: f.city_name
        }))
        .filter((c, index, self) => 
          index === self.findIndex(c2 => c2.id === c.id)
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const filteredFotangs = allFotangs.filter(f => {
    const matchesArea = f.area === activeArea;
    const matchesCity = !formData.cityId || f.city_id === parseInt(formData.cityId);
    return matchesArea && matchesCity;
  });

  return (
    <Box as="form" onSubmit={(e) => e.preventDefault()}>
      <VStack spacing={6} align="stretch">
        <HStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Nama Kegiatan</FormLabel>
            <Input name="event_name" value={formData.event_name || ""} onChange={handleChange} />
          </FormControl>
          {isInternal && (
            <FormControl isRequired>
              <FormLabel>Nama Kegiatan (Mandarin)</FormLabel>
              <Input name="event_mandarin_name" value={formData.event_mandarin_name || ""} onChange={handleChange} />
            </FormControl>
          )}
        </HStack>

        <HStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Tanggal Mulai</FormLabel>
            <Input type="datetime-local" name="greg_occur_date" value={formData.greg_occur_date || ""} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Tanggal Selesai</FormLabel>
            <Input type="datetime-local" name="greg_end_date" value={formData.greg_end_date || ""} onChange={handleChange} />
          </FormControl>
        </HStack>

        {isExternal && (
          <FormControl isRequired>
            <FormLabel>Di vihara/fotang?</FormLabel>
            <RadioGroup
              value={isInFotang ? "yes" : "no"}
              onChange={(v) => {
                const bool = v === "yes";
                setFormData(prev => ({
                  ...prev,
                  is_in_fotang: bool,
                  ...(bool
                    ? { external_provinceId: "", external_cityId: "", location_name: "", external_area: "" }
                    : { fotangId: "", provinceId: "", cityId: "" }
                  )
                }));
              }}
            >
              <HStack spacing={10}>
                <Radio value="yes">Ya</Radio>
                <Radio value="no">Tidak</Radio>
              </HStack>
            </RadioGroup>
          </FormControl>
        )}

        <FormControl isRequired>
          <FormLabel>Wilayah</FormLabel>
          <Select 
            value={activeArea} 
            onChange={handleAreaChange} 
            placeholder="Pilih wilayah"
          >
            {filteredJangkauanOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </FormControl>

        {(isInternal || (isExternal && isInFotang)) && activeArea && (
          <>
            <Box>
              <HStack spacing={8} mb={2} align="flex-start">
                <FormLabel flex={1} fontSize="sm" fontWeight="medium" mb={0} isRequired>
                  Provinsi
                </FormLabel>
                <FormLabel flex={1} fontSize="sm" fontWeight="medium" mb={0} isRequired>
                  Kota/Kabupaten
                </FormLabel>
              </HStack>
              <HStack spacing={4}>
                <FormControl flex={1} isRequired>
                  <Select 
                    value={formData.provinceId || ""} 
                    onChange={handleProvinceChange}
                    placeholder="Pilih Provinsi"
                    isDisabled={filteredProvinces.length === 0}
                  >
                    {filteredProvinces.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl flex={1} isRequired>
                  <Select 
                    value={formData.cityId || ""} 
                    onChange={handleCityChange}
                    placeholder={
                      formData.provinceId 
                        ? (filteredCities.length === 0 ? "Memuat kota..." : "Pilih Kota") 
                        : "Pilih Provinsi dulu"
                    }
                    isDisabled={!formData.provinceId}
                  >
                    {filteredCities.length > 0 ? (
                      filteredCities.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    ) : formData.provinceId ? (
                      <option value="">Memuat kota...</option>
                    ) : (
                      <option value="">Pilih Provinsi dulu</option>
                    )}
                  </Select>
                </FormControl>
              </HStack>
            </Box>

            <FormControl isRequired>
              <FormLabel>Vihara</FormLabel>
              <Select
                value={formData.fotangId || ""}
                onChange={handleFotangChange}
                placeholder={
                  formData.cityId 
                    ? "Pilih vihara" 
                    : "Pilih Kota dulu"
                }
                isDisabled={!formData.cityId}
              >
                {filteredFotangs
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(f => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name} - {f.city_name}
                    </option>
                  ))}
              </Select>
            </FormControl>
          </>
        )}

        {isExternal && !isInFotang && activeArea && (
          <>
            <HStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Provinsi</FormLabel>
                <Select
                  value={formData.external_provinceId || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    external_provinceId: e.target.value,
                    external_cityId: ""
                  }))}
                  placeholder="Pilih Provinsi"
                >
                  {provinces
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(p => (
                      <option key={p.id} value={String(p.id)}>{p.name}</option>
                    ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Kota/Kabupaten</FormLabel>
                <Select
                  value={formData.external_cityId || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, external_cityId: e.target.value }))}
                  isDisabled={!formData.external_provinceId}
                  placeholder={
                    formData.external_provinceId 
                      ? (citiesForExternal.length === 0 ? "Memuat kota..." : "Pilih Kota")
                      : "Pilih Provinsi dulu"
                  }
                >
                  {citiesForExternal.length > 0 ? (
                    citiesForExternal
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))
                  ) : formData.external_provinceId ? (
                    <option value="">Memuat kota...</option>
                  ) : (
                    <option value="">Pilih Provinsi dulu</option>
                  )}
                </Select>
              </FormControl>
            </HStack>
            <FormControl isRequired>
              <FormLabel>Nama Tempat Kegiatan</FormLabel>
              <Input
                name="location_name"
                value={formData.location_name || ""}
                onChange={handleChange}
                placeholder="Contoh: Hotel Santika, Gedung Serbaguna"
              />
            </FormControl>
          </>
        )}

        {isExternal && (
        <FormControl isRequired>
          <FormLabel>Lembaga</FormLabel>
          <Select 
            name="institutionId" 
            value={formData.institutionId || ""} 
            onChange={handleChange}
          >
            <option value="">Pilih Lembaga</option>
            {institutions.map(i => (
              <option key={i.id} value={String(i.id)}>
                {i.name}
              </option>
            ))}
          </Select>
        </FormControl>
        )}

        <FormControl isRequired>
          <FormLabel>Jenis Kegiatan</FormLabel>
          <Select
            value={formData.event_type || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
          >
            {(eventCategory === "Internal"
              ? ["Regular", "Hari_Besar", "Anniversary", "Peresmian", "Seasonal"]
              : ["Lembaga", "Seasonal"]
            ).map(t => (
              <option key={t} value={t}>
                {t === "Hari_Besar" ? "Hari Besar" : t}
              </option>
            ))}
          </Select>
        </FormControl>

        {isInternal && (
          <>
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Tahun Lunar</FormLabel>
                <Select name="lunar_sui_ci_year" value={formData.lunar_sui_ci_year || ""} onChange={handleChange}>
                  <option value="">Tidak diisi</option>
                  {lunarYears.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Bulan Lunar</FormLabel>
                <Select name="lunar_month" value={formData.lunar_month || ""} onChange={handleChange}>
                  <option value="">Tidak diisi</option>
                  {lunarMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Hari Lunar</FormLabel>
                <Select name="lunar_day" value={formData.lunar_day || ""} onChange={handleChange}>
                  <option value="">Tidak diisi</option>
                  {lunarDays.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Kegiatan Berulang?</FormLabel>
              <HStack>
                <Checkbox 
                  isChecked={formData.is_recurring === true} 
                  onChange={() => handleIsRecurringChange(true)}
                >
                  Ya
                </Checkbox>
                <Checkbox 
                  isChecked={formData.is_recurring === false} 
                  onChange={() => handleIsRecurringChange(false)}
                >
                  Tidak
                </Checkbox>
              </HStack>
            </FormControl>
          </>
        )}

        <FormControl>
          <FormLabel>Deskripsi (Opsional)</FormLabel>
          <Textarea name="description" value={formData.description || ""} onChange={handleChange} />
        </FormControl>

        <FormControl>
          <FormLabel>Poster (Opsional)</FormLabel>
          <Input type="file" accept="image/*" onChange={handleImageChange} />
          {previewImage && (
            <Box mt={4}>
              <img
                src={previewImage}
                alt="Preview"
                style={{ 
                  height: 400, 
                  width: "100%", 
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "2px solid #e2e8f0"
                }}
              />
            </Box>
          )}
        </FormControl>
      </VStack>
    </Box>
  );
}