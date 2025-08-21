import { 
  Box, Center, 
  Divider, Flex, Heading, 
  HStack, Spinner, Text, 
  Menu, MenuButton, MenuList, 
  MenuItem, IconButton, Tag, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Button 
} from "@chakra-ui/react";
import { FiArrowLeft, FiChevronRight, FiSettings, FiChevronLeft, FiChevronRight as FiChevronRightNav, FiMoreVertical, FiEdit, FiTrash } from "react-icons/fi";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { logout } from "@/lib/auth/logout";
import { isAuthenticated } from "@/lib/auth/checkAuth";
import { useEffect, useState } from "react";
import Calendar from "react-calendar"; // Impor react-calendar
import "react-calendar/dist/Calendar.css"; // Impor CSS bawaan
import { axiosInstance } from "@/lib/axios"; // Impor axiosInstance dari konfigurasi Anda

export default function Layout({ children, title, showCalendar = false }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username);
      } catch (e) {
        console.error("Gagal parsing user:", e);
      }
    }
  }, []);

  useEffect(() => {
    const checkAuthStatus = () => {
      const isLoginPage = router.pathname === "/login";
      const isAuth = isAuthenticated();

      if (!isAuth && !isLoginPage) {
        router.replace("/login");
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  // Fetch events for calendar with error handling using axiosInstance
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axiosInstance.get("/event").catch(() => ({ data: [] }));
        console.log("Response status:", response.status); // Debug: Periksa status
        console.log("Response data:", response.data); // Debug: Periksa data yang diambil
        if (!response.data || !Array.isArray(response.data)) {
          // Data dummy untuk menguji tanggal 12 dan 17 Agustus 2025
          const dummyEvents = [
            {
              event_id: "1",
              event_name: "Kegiatan 12 Agustus",
              occurrences: [{ greg_occur_date: "2025-08-12T09:00:00Z" }],
              location_name: "Vihara 1",
              event_type: "Ad-hoc",
            },
            {
              event_id: "2",
              event_name: "Kegiatan 17 Agustus",
              occurrences: [{ greg_occur_date: "2025-08-17T14:00:00Z" }],
              location_name: "Vihara 2",
              event_type: "Hari Besar",
            },
          ].map((event) => {
            const occurDate = event.occurrences[0]?.greg_occur_date || new Date().toISOString();
            return {
              id: event.event_id,
              name: event.event_name,
              time: new Date(occurDate).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Jakarta",
              }) + " WIB",
              location: event.location_name || "All Vihara",
              type: event.event_type === "Hari_Besar" ? "Hari Besar" : event.event_type || "Ad-hoc",
              date: new Date(occurDate),
              day: new Date(occurDate).toLocaleDateString("id-ID", { weekday: "long" }) || "Hari",
              lunar_sui_ci_year: "Tahun Lunar",
              lunar_month: "Bulan Lunar",
              lunar_day: "Hari Lunar",
              description: "Deskripsi belum tersedia",
            };
          });
          setEvents(dummyEvents);
          return;
        }
        const fetchedEvents = response.data.map((event) => {
          const occurDate = event.occurrences[0]?.greg_occur_date || new Date().toISOString();
          return {
            id: event.event_id,
            name: event.event_name,
            time: new Date(occurDate).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Jakarta",
            }) + " WIB",
            location: event.location_name || "All Vihara",
            type: event.event_type === "Hari_Besar" ? "Hari Besar" : event.event_type || "Ad-hoc",
            date: new Date(occurDate),
            day: new Date(occurDate).toLocaleDateString("id-ID", { weekday: "long" }) || "Hari",
            lunar_sui_ci_year: event.lunar_sui_ci_year || "Tahun Lunar",
            lunar_month: event.lunar_month || "Bulan Lunar",
            lunar_day: event.lunar_day || "Hari Lunar",
            description: event.description || "Deskripsi belum tersedia",
          };
        });
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("API Error:", error);
        setEvents([]);
      }
    };
    fetchEvents();
  }, []);

  if (isCheckingAuth) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard", iconSrc: "/dashboard_icon.svg" },
    { label: "Kegiatan", href: "/event", iconSrc: "/event_icon.svg" },
    { label: "Laporan", href: "/report", iconSrc: "/report_icon.svg" },
    { label: "Umat", href: "/umat", iconSrc: "/user_icon.svg" },
    { label: "QiuDao", href: "/qiudao", iconSrc: "/qiudao_icon.svg" },
  ];

  const handleLogout = () => logout();

  const showBackButton = ["/umat/addUmat", "/umat/editUmat", "/qiudao/addQiudao", "/qiudao/editQiudao"].includes(router.pathname);
  const backPath = router.pathname.includes("umat") ? "/umat" : "/qiudao";

  const getEventsForDate = (selectedDate) => {
    console.log("Checking date:", selectedDate); // Debug: Periksa tanggal yang dicek
    const eventsForDate = events.filter((event) => {
      const eventDate = new Date(event.date);
      const isMatch = (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
      console.log("Event:", event.name, "Date:", eventDate, "Match:", isMatch); // Debug: Periksa setiap event
      return isMatch;
    }).sort((a, b) => {
      const timeA = a.time.replace(" WIB", "").split(":");
      const timeB = b.time.replace(" WIB", "").split(":");
      return (parseInt(timeA[0]) * 60 + parseInt(timeA[1])) - (parseInt(timeB[0]) * 60 + parseInt(timeB[1]));
    });
    console.log("Events for date:", eventsForDate); // Debug: Periksa hasil filter
    return eventsForDate;
  };

  const onCloseModal = () => setSelectedEvent(null);

  return (
    <Flex direction="column" h="100vh" maxW="100vw" overflow="hidden">
      <Flex flex="1" overflow="hidden">
        <Box
          width="240px"
          p={6}
          borderRight="4px solid #e2e8f0"
          overflow="auto"
        >
          <Box mb={6}>
            <Image
              src="/Onemapan_ss.svg"
              alt="Logo"
              width={200}
              height={180}
              style={{ objectFit: "contain" }}
            />
          </Box>
          <Flex direction="column" gap={3}>
            {/* Button Dashboard, Kegiatan, dan Laporan */}
            {navItems.slice(0, 3).map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Box
                  key={item.href}
                  as={NextLink}
                  href={item.href}
                  px={4}
                  py={2}
                  borderRadius="full"
                  bg={isActive ? "blue.100" : "transparent"}
                  color={isActive ? "blue.600" : "blue.500"}
                  fontWeight={isActive ? "bold" : "normal"}
                  _hover={isActive ? {} : { bg: "gray.100" }}
                >
                  <HStack spacing={2}>
                    <Image
                      src={item.iconSrc}
                      alt={item.label}
                      width={24}
                      height={24}
                      style={{ minWidth: 24, minHeight: 24 }}
                    />
                    <Text>{item.label}</Text>
                  </HStack>
                </Box>
              );
            })}

            {/* Header Management Umat */}
            <Text fontWeight="bold" color="gray.600" mt={4} mb={2} px={2}>
              Management Umat
            </Text>

            {/* Button Umat dan QiuDao */}
            {navItems.slice(3).map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Box
                  key={item.href}
                  as={NextLink}
                  href={item.href}
                  px={4}
                  py={2}
                  borderRadius="full"
                  bg={isActive ? "blue.100" : "transparent"}
                  color={isActive ? "blue.600" : "blue.500"}
                  fontWeight={isActive ? "bold" : "normal"}
                  _hover={isActive ? {} : { bg: "gray.100" }}
                >
                  <HStack spacing={2}>
                    <Image
                      src={item.iconSrc}
                      alt={item.label}
                      width={24}
                      height={24}
                      style={{ minWidth: 24, minHeight: 24 }}
                    />
                    <Text>{item.label}</Text>
                  </HStack>
                </Box>
              );
            })}
          </Flex>
        </Box>

        {/* Konten Utama dan Kalender */}
        <Flex flex="1" direction="row" overflow="hidden">
          <Box
            flex="1"
            overflowY="auto"
            overflowX="hidden"
            minW="0"
          >
            <Flex justify="space-between" align="center" p={3}>
              <HStack spacing={2} ml={3}>
                {showBackButton && (
                  <>
                    <IconButton
                      variant="outline"
                      size="sm"
                      icon={<FiArrowLeft fontSize="20px" color="gray.600" />}
                      aria-label="Kembali"
                      borderColor="blue.500"
                      onClick={() => {
                        router.push(backPath);
                      }}
                      mr={2}
                    />
                  </>
                )}

                <Heading size="sm" color={showBackButton ? "gray.300" : "black"}>
                  {title}
                </Heading>

                {showBackButton && (
                  <>
                    <IconButton
                      variant="unstyled"
                      size="sm"
                      icon={<FiChevronRight color="gray.600" />}
                      aria-label="ActivePage"
                      p={2.5}
                    />

                    <Heading size="sm">
                      Tambah manual
                    </Heading>
                  </>
                )}
              </HStack>

              <Flex gap={2} align="center">
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiSettings />}
                    variant="ghost"
                    aria-label="Settings"
                  />
                  <MenuList>
                    {username && (
                      <Text px={3} py={2} fontWeight="bold">
                        Halo, {username}
                      </Text>
                    )}
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            </Flex>

            <Divider borderBottomWidth="4px"/>
            <Box p={4}>
              {children}
            </Box>
          </Box>

          {/* Box Khusus Kalender */}
          {showCalendar && (
            <Box
              width="320px"
              bg="gray.50"
              borderLeft="4px solid #e2e8f0"
              p={4}
              overflowY="auto"
            >
              <Calendar
                onChange={setDate}
                value={date}
                locale="id-ID"
                tileClassName={({ date: tileDate }) => {
                  const today = new Date();
                  const isToday = new Date(tileDate).toDateString() === new Date(today).toDateString();
                  const classes = [];
                  if (isToday) classes.push("highlight");
                  return classes.join(" ");
                }}
              />
              <style jsx>{`
                .react-calendar {
                  width: 100%;
                  border: none;
                  font-family: inherit;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .react-calendar__tile {
                  height: 48px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 4px;
                  position: relative;
                  color: #2d3748; /* Warna default tanggal */
                }
                .react-calendar__tile--now {
                  background: #edf2f7;
                  color: #2b6cb0;
                }
                .react-calendar__tile:global(.highlight) {
                  background: #edf2f7;
                  color: #2b6cb0;
                }
                .react-calendar__navigation button {
                  color: #2b6cb0;
                  font-weight: bold;
                }
                .react-calendar__month-view__days__day--neighboringMonth {
                  color: #a0aec0;
                }
                .react-calendar__tile:hover {
                  background-color: #e2e8f0; /* Warna abu-abu saat hover */
                  color: #2d3748; /* Tetap hitam untuk teks */
                }
                .react-calendar__tile--active {
                  background-color: #e2e8f0; /* Warna abu-abu saat tanggal dipilih */
                  color: #2d3748; /* Tetap hitam untuk teks */
                }
              `}</style>
              {/* Detail Acara untuk tanggal yang dipilih */}
              <Box mt={4}>
                {getEventsForDate(date).length > 0 ? (
                  getEventsForDate(date).map((event) => (
                    <Flex key={event.id} justify="space-between" align="center" mb={2} p={2} bg="gray.50" borderRadius="md">
                      <Box>
                        <Text fontSize="lg" fontWeight="bold" color={"#2e05e8ff"}>{event.time}</Text>
                        <Text fontSize="md" fontWeight="bold">{event.name}</Text>
                        <Text fontSize="sm" color="gray.600">{event.location}</Text>
                        <HStack spacing={2} mt={1}>
                          <Tag size="sm" variant="solid" colorScheme="blue">{event.type}</Tag>
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
                          <MenuItem onClick={() => setSelectedEvent(event)}>Lihat Detail</MenuItem>
                        </MenuList>
                      </Menu>
                    </Flex>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center">Tidak ada acara pada tanggal ini.</Text>
                )}
              </Box>
            </Box>
          )}
        </Flex>
      </Flex>

      {/* Modal untuk Detail Event */}
      <Modal isOpen={selectedEvent !== null} onClose={onCloseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedEvent?.name || "Detail Kegiatan"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedEvent && (
              <>
                <Text mb={2}><strong>Tanggal:</strong> {selectedEvent.day}, {selectedEvent.date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</Text>
                <Text my={2}><strong>Tanggal Lunar:</strong> {selectedEvent.lunar_sui_ci_year} {selectedEvent.lunar_month} {selectedEvent.lunar_day}</Text>
                <Text my={2}><strong>Waktu:</strong> {selectedEvent.time}</Text>
                <Text my={2}><strong>Lokasi:</strong> {selectedEvent.location}</Text>
                <Text my={2}><strong>Jenis:</strong> {selectedEvent.type}</Text>
                <Text my={2}><strong>Deskripsi:</strong> {selectedEvent.description}</Text>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
}