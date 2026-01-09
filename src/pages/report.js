import Layout from "@/components/layout";
import {
  Box, Flex, Heading, Button, Drawer, DrawerOverlay, DrawerContent, DrawerHeader,
  DrawerBody, DrawerFooter, useDisclosure, Text, VStack, Stack, Checkbox,
  CheckboxGroup, Table, Thead, Tbody, Tr, Th, Td, IconButton, useToast,
  Collapse, FormControl, FormLabel, Select, Grid, GridItem,
  HStack, Tfoot
} from "@chakra-ui/react";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FiFilter, FiDownload, FiX, FiPlus, FiMinus } from "react-icons/fi";

const ALL_FIELDS = [
  { key: "full_name", label: "Nama Lengkap", source: "user" },
  { key: "mandarin_name", label: "Nama Mandarin", source: "user" },
  { key: "gender", label: "Jenis Kelamin", source: "user" },
  { key: "is_qing_kou", label: "Qingkou", source: "user" },
  { key: "phone_number", label: "No. HP", source: "user" },
  { key: "email", label: "Email", source: "user" },
  { key: "date_of_birth", label: "Tanggal Lahir", source: "user" },
  { key: "place_of_birth", label: "Tempat Lahir", source: "user" },
  { key: "blood_type", label: "Golongan Darah", source: "user" },
  { key: "marital_status", label: "Status Pernikahan", source: "user" },
  { key: "last_education_level", label: "Pendidikan Terakhir", source: "user" },
  { key: "education_major", label: "Jurusan", source: "user" },
  { key: "job_name", label: "Pekerjaan", source: "user" },
  { key: "id_card_number", label: "No. KTP", source: "user" },
  { key: "spiritual_status", label: "Status Spiritual", source: "user" },
  { key: "lunar_year", label: "Tahun Qiu Dao", source: "qiudao" },
  { key: "lunar_month", label: "Bulan Qiu Dao", source: "qiudao" },
  { key: "lunar_day", label: "Tanggal Qiu Dao", source: "qiudao" },
  { key: "shi_chen_time", label: "Waktu Qiu Dao", source: "qiudao" },
  { key: "dcs_full_name", label: "Nama Dian Chuan Shi Pendhiksa", source: "dcs" },
  { key: "dcs_mandarin_name", label: "Nama Mandarin Dian Chuan Shi Pendhiksa", source: "dcs" },
  { key: "fotang_name", label: "Lokasi Qiudao", source: "fotang" },
  { key: "area", label: "Wilayah", source: "fotang" },
  { key: "province", label: "Provinsi", source: "fotang" },
  { key: "city", label: "Kota/Kabupaten", source: "fotang" },
  { key: "district", label: "Kecamatan", source: "fotang" },
  { key: "locality", label: "Kelurahan", source: "fotang" },
];

const SPIRITUAL_STATUS = [
  "QianRen", "DianChuanShi", "TanZhu", "FoYuan", "BanShiYuan", "QianXian", "DaoQin"
];

const GENDER_OPTIONS = ["Male", "Female"];
const EDUCATION_LEVELS = ["SD", "SMP", "SMA", "D1", "D2", "D3", "S1", "S2", "S3"];
const BLOOD_TYPES = ["A", "B", "AB", "O"];

export default function ReportBuilder() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedFields, setSelectedFields] = useState([]);
  const [selectedSpiritualStatus, setSelectedSpiritualStatus] = useState([]);
  const [tempAreaFilter, setTempAreaFilter] = useState([]);
  const [tempProvinceFilter, setTempProvinceFilter] = useState([]);
  const [tempCityFilter, setTempCityFilter] = useState([]);
  const [tempDistrictFilter, setTempDistrictFilter] = useState([]);
  const [tempLocalityFilter, setTempLocalityFilter] = useState([]);
  const [areaFilter, setAreaFilter] = useState([]);
  const [provinceFilter, setProvinceFilter] = useState([]);
  const [cityFilter, setCityFilter] = useState([]);
  const [districtFilter, setDistrictFilter] = useState([]);
  const [localityFilter, setLocalityFilter] = useState([]);
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isLocalityOpen, setIsLocalityOpen] = useState(false);
  const [tempGenderFilter, setTempGenderFilter] = useState([]);
  const [tempQingkouFilter, setTempQingkouFilter] = useState([]);
  const [tempEducationFilter, setTempEducationFilter] = useState([]);
  const [tempBloodTypeFilter, setTempBloodTypeFilter] = useState([]);
  const [tempJobFilter, setTempJobFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState([]);
  const [qingkouFilter, setQingkouFilter] = useState([]);
  const [educationFilter, setEducationFilter] = useState([]);
  const [bloodTypeFilter, setBloodTypeFilter] = useState([]);
  const [jobFilter, setJobFilter] = useState("");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [mandarinFontBase64, setMandarinFontBase64] = useState("");
  const [mandarinFontLoaded, setMandarinFontLoaded] = useState(false);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["report-builder-data"],
    queryFn: async () => {
      const [usersRes, qiudaoRes, fotangRes, dcsRes] = await Promise.all([
        axiosInstance.get("/profile/user", { params: { limit: 9999 } }),
        axiosInstance.get("/profile/qiudao", { params: { limit: 9999 } }),
        axiosInstance.get("/fotang", { params: { limit: 9999 } }),
        axiosInstance.get("/dianchuanshi", { params: { limit: 9999 } }),
      ]);

      const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || [];
      const qiudao = Array.isArray(qiudaoRes.data) ? qiudaoRes.data : qiudaoRes.data.data || [];
      const fotang = Array.isArray(fotangRes.data) ? fotangRes.data : fotangRes.data.data || [];
      const dcsList = Array.isArray(dcsRes.data) ? dcsRes.data : dcsRes.data.data || [];

      const dcsMap = Object.fromEntries(dcsList.map(d => [d.dian_chuan_shi_id, d]));

      const joined = users.map(user => {
        const qd = qiudao.find(q => q.qiu_dao_id === user.qiu_dao_id);
        const ft = fotang.find(f => f.fotang_id === qd?.qiu_dao_location_id);
        const dcs = dcsMap[qd?.dian_chuan_shi_id] || {};

        const province = ft?.locality?.district?.city?.province?.name;
        const city = ft?.locality?.district?.city?.name;
        const district = ft?.locality?.district?.name;
        const locality = ft?.locality?.name;
        const area = ft?.area;

        return {
          ...user,
          qiudao: qd || {},
          fotang: ft || {},
          dcs: dcs || {},
          spiritual_status: user.spiritualUser?.spiritual_status,
          area,
          province,
          city,
          district,
          locality,
          lunar_year: qd?.lunar_sui_ci_year,
          lunar_month: qd?.lunar_month,
          lunar_day: qd?.lunar_day,
          shi_chen_time: qd?.lunar_shi_chen_time,
          dcs_full_name: dcs.full_name,
          dcs_mandarin_name: dcs.mandarin_name,
          fotang_name: ft?.location_name,
        };
      });

      return { joined, fotang };
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (mandarinFontLoaded || mandarinFontBase64) return;

    const loadFont = () => {
      console.log("Memuat font Mandarin dari: /fonts/NotoSansSC-Regular.ttf");

      fetch("/fonts/NotoSansSC-Regular.ttf")
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then(blob => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            const base64 = dataUrl.split(',')[1];
            setMandarinFontBase64(base64);
            setMandarinFontLoaded(true);
            window.mandarinFontBase64 = base64;
            console.log("Font Mandarin berhasil dimuat! (Base64 length:", base64.length, ")");
          };
          reader.onerror = () => {
            throw new Error("FileReader gagal membaca font");
          };
          reader.readAsDataURL(blob);
        })
        .catch(err => {
          console.error("GAGAL MEMUAT FONT MANDARIN:", err);
          toast({
            title: "Font Mandarin gagal dimuat",
            description: "Nama Mandarin di PDF akan rusak",
            status: "warning",
            duration: 7000,
          });
        });
    };

    loadFont();
  }, [mandarinFontLoaded, mandarinFontBase64, toast]);
  
  const availableProvinces = useMemo(() => {
    if (!rawData?.fotang || tempAreaFilter.length === 0) return [];
    return [...new Set(
      rawData.fotang
        .filter(f => tempAreaFilter.includes(f.area))
        .map(f => f.locality?.district?.city?.province?.name)
        .filter(Boolean)
    )].sort();
  }, [rawData, tempAreaFilter]);

  const availableCities = useMemo(() => {
    if (!rawData?.fotang || tempProvinceFilter.length === 0) return [];
    return [...new Set(
      rawData.fotang
        .filter(f => tempProvinceFilter.includes(f.locality?.district?.city?.province?.name))
        .map(f => f.locality?.district?.city?.name)
        .filter(Boolean)
    )].sort();
  }, [rawData, tempProvinceFilter]);

  const availableDistricts = useMemo(() => {
    if (!rawData?.fotang || tempCityFilter.length === 0) return [];
    return [...new Set(
      rawData.fotang
        .filter(f => tempCityFilter.includes(f.locality?.district?.city?.name))
        .map(f => f.locality?.district?.name)
        .filter(Boolean)
    )].sort();
  }, [rawData, tempCityFilter]);

  const availableLocalities = useMemo(() => {
    if (!rawData?.fotang || tempDistrictFilter.length === 0) return [];
    return [...new Set(
      rawData.fotang
        .filter(f => tempDistrictFilter.includes(f.locality?.district?.name))
        .map(f => f.locality?.name)
        .filter(Boolean)
    )].sort();
  }, [rawData, tempDistrictFilter]);

  const availableJobs = useMemo(() => {
    if (!rawData?.joined) return [];
    return [...new Set(rawData.joined.map(u => u.job_name).filter(Boolean))].sort();
  }, [rawData]);

  const filteredData = useMemo(() => {
    if (!rawData?.joined) return [];
    let data = rawData.joined;

    if (selectedSpiritualStatus.length > 0) {
      data = data.filter(d => selectedSpiritualStatus.includes(d.spiritual_status));
    }

    if (areaFilter.length > 0) data = data.filter(d => areaFilter.includes(d.area));
    if (provinceFilter.length > 0) data = data.filter(d => provinceFilter.includes(d.province));
    if (cityFilter.length > 0) data = data.filter(d => cityFilter.includes(d.city));
    if (districtFilter.length > 0) data = data.filter(d => districtFilter.includes(d.district));
    if (localityFilter.length > 0) data = data.filter(d => localityFilter.includes(d.locality));

    if (genderFilter.length > 0) data = data.filter(d => genderFilter.includes(d.gender));
    if (qingkouFilter.length > 0) data = data.filter(d => qingkouFilter.includes(d.is_qing_kou));
    if (educationFilter.length > 0) data = data.filter(d => educationFilter.includes(d.last_education_level));
    if (bloodTypeFilter.length > 0) data = data.filter(d => bloodTypeFilter.includes(d.blood_type));
    if (jobFilter) data = data.filter(d => d.job_name?.toLowerCase().includes(jobFilter.toLowerCase()));

    return data;
  }, [rawData, selectedSpiritualStatus, areaFilter, provinceFilter, cityFilter, districtFilter, localityFilter, genderFilter, qingkouFilter, educationFilter, bloodTypeFilter, jobFilter]);

  const totalRows = filteredData.length;

  const exportTable = (headers, rows, total, filename) => {
    const totalText = `Total: ${total}`;
    const mandarinColumns = selectedFields
      .map((key, idx) => ({ key, idx }))
      .filter(f => f.key === "mandarin_name" || f.key === "dcs_mandarin_name")
      .map(f => f.idx);

    if (exportFormat === "pdf") {
      const doc = new jsPDF("landscape");

      if (mandarinFontLoaded && window.mandarinFontBase64) {
        try {
          doc.addFileToVFS("NotoSansSC-Regular.ttf", window.mandarinFontBase64);
          doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
        } catch (e) {
          console.error("Error addFont:", e);
        }
      }

      const bodyWithTotal = [...rows, Array(headers.length).fill("")];

      bodyWithTotal[bodyWithTotal.length - 1][0] = totalText;

      autoTable(doc, {
        head: [headers],
        body: bodyWithTotal,
        theme: "grid",
        styles: { 
          fontSize: 11, 
          font: mandarinFontLoaded ? "NotoSansSC" : "helvetica"
        },
        headStyles: { fillColor: [33, 150, 243] },
        startY: 20,
        didParseCell: (data) => {
          const isMandarin = mandarinColumns.includes(data.column.index);
          if (mandarinFontLoaded && isMandarin) {
            data.cell.styles.font = "NotoSansSC";
          }

          if (data.row.index === rows.length) {
            data.cell.colSpan = headers.length;
            data.cell.styles.halign = "center";
            data.cell.styles.valign = "middle";
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fontSize = 14;
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [34, 139, 34];
            if (mandarinFontLoaded) {
              data.cell.styles.font = "NotoSansSC";
            }
          }
        }
      });

      doc.save(`${filename}.pdf`);
    }
    
    else if (exportFormat === "excel") {
      const totalRow = Array(headers.length).fill("");
      totalRow[0] = totalText;

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows, totalRow]);

      const headerRange = XLSX.utils.decode_range(ws["!ref"]);
      for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
        if (cell) {
          cell.s = { 
            fill: { fgColor: { rgb: "2196F3" } }, 
            font: { color: { rgb: "FFFFFF" }, bold: true } 
          };
        }
      }

      const totalRowIndex = rows.length + 1;
      for (let c = 0; c < headers.length; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: totalRowIndex, c })];
        if (cell) {
          cell.s = {
            fill: { fgColor: { rgb: "DCFCE7" } },
            font: { bold: true, sz: 12, color: { rgb: "228B22" } },
            alignment: { horizontal: c === 0 ? "center" : "left" }
          };
        }
      }

      if (!ws["!merges"]) ws["!merges"] = [];
      ws["!merges"].push({
        s: { r: totalRowIndex, c: 0 },
        e: { r: totalRowIndex, c: headers.length - 1 }
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Uint8Array(excelBuffer);
      const arr = new ArrayBuffer(data.length + 3);
      const view = new Uint8Array(arr);
      view[0] = 0xEF; view[1] = 0xBB; view[2] = 0xBF;
      view.set(data, 3);
      saveAs(new Blob([arr]), `${filename}.xlsx`);
    } 
    else if (exportFormat === "csv") {
      const totalRow = [totalText, ...Array(headers.length - 1).fill("")];
      const csv = [headers, ...rows, totalRow].map(r => r.join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      saveAs(blob, `${filename}.csv`);
    }
  };

  const handleExport = () => {
    const headers = selectedFields.map(k => ALL_FIELDS.find(f => f.key === k).label);
    const rows = filteredData.slice(0, 1000).map(d => {
      return selectedFields.map(key => {
        let val = d[key];
        if (key === "gender") val = d.gender === "Male" ? "Pria" : "Wanita";
        if (key === "is_qing_kou") val = val ? "Ya" : "Tidak";
        if (key === "date_of_birth") val = val ? new Date(val).toLocaleDateString("id-ID") : "-";
        if (key === "area") val = d.area ? `Wilayah ${d.area.replace("Korwil_", "")}` : "-";
        return val ?? "-";
      });
    });
    exportTable(headers, rows, totalRows, "report-data");
  };

  const applyFilters = () => {
    setAreaFilter([...tempAreaFilter]);
    setProvinceFilter([...tempProvinceFilter]);
    setCityFilter([...tempCityFilter]);
    setDistrictFilter([...tempDistrictFilter]);
    setLocalityFilter([...tempLocalityFilter]);
    setGenderFilter([...tempGenderFilter]);
    setQingkouFilter([...tempQingkouFilter]);
    setEducationFilter([...tempEducationFilter]);
    setBloodTypeFilter([...tempBloodTypeFilter]);
    setJobFilter(tempJobFilter);
    onClose();
  };

  const resetFilter = () => {
    setSelectedFields([]);
    setSelectedSpiritualStatus([]);
    setTempAreaFilter([]); setTempProvinceFilter([]); setTempCityFilter([]); setTempDistrictFilter([]); setTempLocalityFilter([]);
    setAreaFilter([]); setProvinceFilter([]); setCityFilter([]); setDistrictFilter([]); setLocalityFilter([]);
    setTempGenderFilter([]); setTempQingkouFilter([]); setTempEducationFilter([]); setTempBloodTypeFilter([]); setTempJobFilter("");
    setGenderFilter([]); setQingkouFilter([]); setEducationFilter([]); setBloodTypeFilter([]); setJobFilter("");
  };

  if (isLoading) return <Layout title="Laporan"><Box p={2}>Memuat data...</Box></Layout>;

  const hasData = selectedFields.length > 0 && filteredData.length > 0;

  return (
    <Layout title="Laporan">
      <Box p={2}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Laporan</Heading>
          <HStack>
            <Button leftIcon={<FiFilter />} colorScheme="blue" onClick={onOpen}>
              Report Filter
            </Button>
            <Button
              leftIcon={<FiDownload />}
              colorScheme="green"
              onClick={() => {
                if (hasData) {
                  handleExport();
                  toast({ title: "Berhasil diekspor!", status: "success" });
                } else {
                  toast({ title: "Pilih field terlebih dahulu", status: "warning" });
                }
              }}
              isDisabled={!hasData}
            >
              Ekspor
            </Button>
          </HStack>
        </Flex>

        {!hasData && (
          <Box textAlign="center" py={16} color="gray.500" bg="gray.50" borderRadius="lg">
            <Text fontSize="lg" fontWeight="medium">
              Pilih field untuk menampilkan data
            </Text>
            <Text fontSize="sm" mt={2}>
              Klik Report Filter untuk memulai
            </Text>
          </Box>
        )}

        {hasData && (
          <Box>
            <Text fontWeight="bold" fontSize="lg" mb={6}>Hasil Laporan</Text>
            <Box bg="white" borderRadius="lg" shadow="md" overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead bg="blue.500">
                  <Tr>
                    {selectedFields.map(key => {
                      const f = ALL_FIELDS.find(x => x.key === key);
                      return (
                        <Th key={key} color="white" fontWeight="bold">
                          {f.label}
                        </Th>
                      );
                    })}
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredData.map((d, i) => (
                    <Tr key={i}>
                      {selectedFields.map((key, idx) => {
                        let val = d[key];
                        if (key === "gender") val = d.gender === "Male" ? "Pria" : "Wanita";
                        if (key === "is_qing_kou") val = val ? "Ya" : "Tidak";
                        if (key === "date_of_birth") val = val ? new Date(val).toLocaleDateString("id-ID") : "-";
                        if (key === "area") val = d.area ? `Wilayah ${d.area.replace("Korwil_", "")}` : "-";
                        return (
                          <Td key={key} textAlign={idx === 0 ? "left" : "left"}>
                            {val ?? "-"}
                          </Td>
                        );
                      })}
                    </Tr>
                  ))}
                </Tbody>
                <Tfoot>
                  <Tr>
                    <Th
                      colSpan={selectedFields.length}
                      textAlign="center"
                      fontWeight="bold"
                      fontSize="xl"
                      bg="green.50"
                      color="green.700"
                      py={4}
                      height="45px"
                      lineHeight="1.2"
                    >
                      Total: {totalRows}
                    </Th>
                  </Tr>
                </Tfoot>
              </Table>
              {filteredData.length > 100 && (
                <Text p={3} color="gray.500" fontStyle="italic">
                  Menampilkan 100 dari {totalRows} data
                </Text>
              )}
            </Box>
          </Box>
        )}

        <Drawer isOpen={isOpen} onClose={onClose} size="xl">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader borderBottomWidth="1px">
              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="bold">Report Filter</Text>
                <IconButton icon={<FiX />} onClick={onClose} size="sm" />
              </Flex>
            </DrawerHeader>
            <DrawerBody overflowY="auto">
              <Grid templateColumns="1fr 1fr" gap={6}>
                <GridItem>
                  <Text fontWeight="bold" fontSize="md" mb={4} color="blue.600">
                    Field yang Ingin Ditampilkan
                  </Text>
                  <VStack align="stretch" spacing={3} maxH="70vh" overflowY="auto">
                    <CheckboxGroup value={selectedFields} onChange={setSelectedFields}>
                      <Stack spacing={2}>
                        {ALL_FIELDS.map(f => (
                          <Checkbox key={f.key} value={f.key} size="sm">
                            {f.label}
                          </Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  </VStack>
                </GridItem>

                <GridItem>
                  <Text fontWeight="bold" fontSize="md" mb={4} color="blue.600">
                    Filter
                  </Text>
                  <VStack align="stretch" spacing={5} maxH="70vh" overflowY="auto">

                    <Box>
                      <FormLabel fontSize="sm" fontWeight="medium">Status Spiritual</FormLabel>
                      <CheckboxGroup value={selectedSpiritualStatus} onChange={setSelectedSpiritualStatus}>
                        <Stack spacing={2} direction="row" flexWrap="wrap">
                          {SPIRITUAL_STATUS.map(s => (
                            <Checkbox key={s} value={s} size="sm">{s}</Checkbox>
                          ))}
                        </Stack>
                      </CheckboxGroup>
                    </Box>

                    <Box>
                      <FormControl mb={2}>
                        <Flex align="center" justify="space-between">
                          <FormLabel mb={0} fontSize="sm">Wilayah</FormLabel>
                          <IconButton size="xs" icon={isAreaOpen ? <FiMinus /> : <FiPlus />} onClick={() => setIsAreaOpen(!isAreaOpen)} />
                        </Flex>
                        <Collapse in={isAreaOpen}>
                          <VStack align="start" spacing={1}>
                            {[1,2,3,4,5,6].map(i => {
                              const val = `Korwil_${i}`;
                              return (
                                <Checkbox
                                  key={i}
                                  size="sm"
                                  isChecked={tempAreaFilter.includes(val)}
                                  onChange={() => {
                                    setTempAreaFilter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
                                    setTempProvinceFilter([]); setTempCityFilter([]); setTempDistrictFilter([]); setTempLocalityFilter([]);
                                  }}
                                >
                                  Wilayah {i}
                                </Checkbox>
                              );
                            })}
                          </VStack>
                        </Collapse>
                      </FormControl>

                      {tempAreaFilter.length > 0 && (
                        <FormControl mb={2}>
                          <Flex align="center" justify="space-between">
                            <FormLabel mb={0} fontSize="sm">Provinsi</FormLabel>
                            <IconButton size="xs" icon={isProvinceOpen ? <FiMinus /> : <FiPlus />} onClick={() => setIsProvinceOpen(!isProvinceOpen)} />
                          </Flex>
                          <Collapse in={isProvinceOpen}>
                            <VStack align="start" spacing={1} maxH="100px" overflowY="auto">
                              {availableProvinces.map(p => (
                                <Checkbox
                                  key={p}
                                  size="sm"
                                  isChecked={tempProvinceFilter.includes(p)}
                                  onChange={() => {
                                    setTempProvinceFilter(prev => prev.includes(p) ? prev.filter(v => v !== p) : [...prev, p]);
                                    setTempCityFilter([]); setTempDistrictFilter([]); setTempLocalityFilter([]);
                                  }}
                                >
                                  {p}
                                </Checkbox>
                              ))}
                            </VStack>
                          </Collapse>
                        </FormControl>
                      )}

                      {tempProvinceFilter.length > 0 && (
                        <FormControl mb={2}>
                          <Flex align="center" justify="space-between">
                            <FormLabel mb={0} fontSize="sm">Kota/Kab</FormLabel>
                            <IconButton size="xs" icon={isCityOpen ? <FiMinus /> : <FiPlus />} onClick={() => setIsCityOpen(!isCityOpen)} />
                          </Flex>
                          <Collapse in={isCityOpen}>
                            <VStack align="start" spacing={1} maxH="100px" overflowY="auto">
                              {availableCities.map(c => (
                                <Checkbox
                                  key={c}
                                  size="sm"
                                  isChecked={tempCityFilter.includes(c)}
                                  onChange={() => {
                                    setTempCityFilter(prev => prev.includes(c) ? prev.filter(v => v !== c) : [...prev, c]);
                                    setTempDistrictFilter([]); setTempLocalityFilter([]);
                                  }}
                                >
                                  {c}
                                </Checkbox>
                              ))}
                            </VStack>
                          </Collapse>
                        </FormControl>
                      )}

                      {tempCityFilter.length > 0 && (
                        <FormControl mb={2}>
                          <Flex align="center" justify="space-between">
                            <FormLabel mb={0} fontSize="sm">Kecamatan</FormLabel>
                            <IconButton size="xs" icon={isDistrictOpen ? <FiMinus /> : <FiPlus />} onClick={() => setIsDistrictOpen(!isDistrictOpen)} />
                          </Flex>
                          <Collapse in={isDistrictOpen}>
                            <VStack align="start" spacing={1} maxH="100px" overflowY="auto">
                              {availableDistricts.map(d => (
                                <Checkbox
                                  key={d}
                                  size="sm"
                                  isChecked={tempDistrictFilter.includes(d)}
                                  onChange={() => {
                                    setTempDistrictFilter(prev => prev.includes(d) ? prev.filter(v => v !== d) : [...prev, d]);
                                    setTempLocalityFilter([]);
                                  }}
                                >
                                  {d}
                                </Checkbox>
                              ))}
                            </VStack>
                          </Collapse>
                        </FormControl>
                      )}

                      {tempDistrictFilter.length > 0 && (
                        <FormControl>
                          <Flex align="center" justify="space-between">
                            <FormLabel mb={0} fontSize="sm">Kelurahan</FormLabel>
                            <IconButton size="xs" icon={isLocalityOpen ? <FiMinus /> : <FiPlus />} onClick={() => setIsLocalityOpen(!isLocalityOpen)} />
                          </Flex>
                          <Collapse in={isLocalityOpen}>
                            <VStack align="start" spacing={1} maxH="100px" overflowY="auto">
                              {availableLocalities.map(l => (
                                <Checkbox
                                  key={l}
                                  size="sm"
                                  isChecked={tempLocalityFilter.includes(l)}
                                  onChange={() => setTempLocalityFilter(prev => prev.includes(l) ? prev.filter(v => v !== l) : [...prev, l])}
                                >
                                  {l}
                                </Checkbox>
                              ))}
                            </VStack>
                          </Collapse>
                        </FormControl>
                      )}
                    </Box>

                    <Box>
                      <FormControl mb={2}>
                        <FormLabel fontSize="sm">Jenis Kelamin</FormLabel>
                        <CheckboxGroup value={tempGenderFilter} onChange={setTempGenderFilter}>
                          <Stack spacing={2}>
                            {GENDER_OPTIONS.map(g => (
                              <Checkbox key={g} value={g} size="sm">
                                {g === "Male" ? "Pria" : "Wanita"}
                              </Checkbox>
                            ))}
                          </Stack>
                        </CheckboxGroup>
                      </FormControl>

                      <FormControl mb={3}>
                        <FormLabel fontSize="sm">Qingkou</FormLabel>
                        <CheckboxGroup value={tempQingkouFilter} onChange={v => setTempQingkouFilter(v.map(Boolean))}>
                          <Stack spacing={2}>
                            <Checkbox value={true} size="sm">Ya</Checkbox>
                            <Checkbox value={false} size="sm">Tidak</Checkbox>
                          </Stack>
                        </CheckboxGroup>
                      </FormControl>

                      <FormControl mb={3}>
                        <FormLabel fontSize="sm">Pendidikan Terakhir</FormLabel>
                        <CheckboxGroup value={tempEducationFilter} onChange={setTempEducationFilter}>
                          <Stack spacing={2} direction="row" flexWrap="wrap">
                            {EDUCATION_LEVELS.map(e => (
                              <Checkbox key={e} value={e} size="sm">{e}</Checkbox>
                            ))}
                          </Stack>
                        </CheckboxGroup>
                      </FormControl>

                      <FormControl mb={3}>
                        <FormLabel fontSize="sm">Golongan Darah</FormLabel>
                        <CheckboxGroup value={tempBloodTypeFilter} onChange={setTempBloodTypeFilter}>
                          <Stack spacing={2} direction="row">
                            {BLOOD_TYPES.map(b => (
                              <Checkbox key={b} value={b} size="sm">{b}</Checkbox>
                            ))}
                          </Stack>
                        </CheckboxGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Pekerjaan</FormLabel>
                        <Select
                          placeholder="Pilih opsi"
                          value={tempJobFilter}
                          onChange={e => setTempJobFilter(e.target.value)}
                          size="sm"
                        >
                          {availableJobs.map(job => (
                            <option key={job} value={job}>{job}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </VStack>
                </GridItem>
              </Grid>
            </DrawerBody>
            <DrawerFooter borderTopWidth="1px">
              <Button variant="outline" mr={3} onClick={resetFilter}>
                Reset
              </Button>
              <Button colorScheme="blue" onClick={applyFilters}>
                Apply
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Box>
    </Layout>
  );
}