import { 
  Box, Center, 
  Divider, Flex, Heading, 
  HStack, Spinner, Text, 
  Menu, MenuButton, MenuList, 
  MenuItem, IconButton, Tag, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton 
} from "@chakra-ui/react";
import { FiArrowLeft, FiChevronRight, FiSettings, FiChevronLeft, FiChevronRight as FiChevronRightNav, FiMoreVertical } from "react-icons/fi";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { logout } from "@/lib/auth/logout";
import { isAuthenticated } from "@/lib/auth/checkAuth";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { axiosInstance } from "@/lib/axios";

export default function Layout({ children, title, showCalendar = false }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState("month"); // Default ke mode bulan

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

  // Fetch events for calendar
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axiosInstance.get("/event").catch(() => ({ data: [] }));
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);
        if (!response.data || !Array.isArray(response.data)) {
          console.warn("No valid event data received from API");
          setEvents([]);
          return;
        }
        const fetchedEvents = response.data.flatMap((event) => {
          if (!event.occurrences || !Array.isArray(event.occurrences)) {
            console.warn(`Invalid occurrences for event ${event.event_id}:`, event.occurrences);
            return [];
          }
          return event.occurrences.map((occ) => {
            const startDate = new Date(occ.greg_occur_date);
            const endDate = occ.greg_end_date ? new Date(occ.greg_end_date) : null;

            // Check for valid start date
            if (isNaN(startDate.getTime())) {
              console.warn(`Invalid start date for event ${event.event_id}, occurrence ${occ.occurrence_id}: ${occ.greg_occur_date}`);
              return null;
            }

            // Determine if same day
            const isSameDay = endDate
              ? startDate.getFullYear() === endDate.getFullYear() &&
                startDate.getMonth() === endDate.getMonth() &&
                startDate.getDate() === endDate.getDate()
              : true;

            // Check if same month and year
            const isSameMonthYear = endDate
              ? startDate.getFullYear() === endDate.getFullYear() &&
                startDate.getMonth() === endDate.getMonth()
              : false;

            // Format date range
            const startDay = startDate.toLocaleDateString("id-ID", { day: "numeric" });
            const endDay = endDate && !isNaN(endDate.getTime())
              ? endDate.toLocaleDateString("id-ID", { day: "numeric" })
              : "TBD";
            const monthYear = startDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
            const endMonthYear = endDate && !isNaN(endDate.getTime())
              ? endDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
              : "TBD";
            const dateRangeString = isSameDay
              ? `${startDay} ${monthYear}`
              : isSameMonthYear
              ? `${startDay} - ${endDay} ${monthYear}`
              : `${startDay} ${monthYear} - ${endDay} ${endMonthYear}`;

            // Generate date range for multi-day events
            const dateRange = [];
            if (endDate && !isSameDay && !isNaN(endDate.getTime())) {
              let currentDate = new Date(startDate);
              while (currentDate <= endDate) {
                dateRange.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
              }
            } else {
              dateRange.push(startDate);
            }

            // Format time display
            const startTime = startDate.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Jakarta",
            });
            const endTime = endDate && !isNaN(endDate.getTime())
              ? endDate.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Jakarta",
                })
              : "TBD";

            return {
              id: event.event_id,
              occurrence_id: occ.occurrence_id,
              name: event.event_name || "Unnamed Event",
              date: startDate, // Primary date for sorting
              dateRange, // Array of all dates for multi-day events
              dateString: dateRangeString, // Formatted date string for display
              time: isSameDay ? `${startTime} - ${endTime} WIB` : "", // Time set later in getEventsForDate
              startTime: `${startTime} WIB`,
              endTime: endTime !== "TBD" ? `${endTime} WIB` : "TBD",
              isSameDay,
              location: event.location?.location_name || "All Vihara",
              type: event.event_type === "Hari_Besar" ? "Hari Besar" : event.event_type || "Ad-hoc",
              day: startDate.toLocaleDateString("id-ID", { weekday: "long" }) || "Hari",
              lunar_sui_ci_year: event.lunar_sui_ci_year || "Tahun Lunar",
              lunar_month: event.lunar_month || "Bulan Lunar",
              lunar_day: event.lunar_day || "Hari Lunar",
              description: event.description || "Deskripsi belum tersedia",
              is_recurring: event.is_recurring || false,
            };
          }).filter(event => event !== null);
        });
        console.log("Fetched events:", fetchedEvents);
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

  // Fungsi untuk mendapatkan kegiatan di tanggal tertentu
  const getEventsForDate = (selectedDate) => {
    console.log("Checking date:", selectedDate);
    const eventsForDate = events
      .filter((event) => {
        if (!event.dateRange || !Array.isArray(event.dateRange)) {
          console.warn(`Invalid dateRange for event ${event.id}, occurrence ${event.occurrence_id}:`, event.dateRange);
          return false;
        }
        return event.dateRange.some((eventDate) => {
          const isMatch = (
            eventDate.getDate() === selectedDate.getDate() &&
            eventDate.getMonth() === selectedDate.getMonth() &&
            eventDate.getFullYear() === selectedDate.getFullYear()
          );
          if (isMatch) {
            // Set time based on the selected date's position
            if (event.isSameDay) {
              event.time = event.startTime + (event.endTime !== "TBD" ? ` - ${event.endTime}` : "");
            } else {
              event.time = "";
            }
          }
          return isMatch;
        });
      })
      .sort((a, b) => {
        const timeA = a.startTime.replace(" WIB", "").split(":");
        const timeB = b.startTime.replace(" WIB", "").split(":");
        return (parseInt(timeA[0]) * 60 + parseInt(timeA[1])) - (parseInt(timeB[0]) * 60 + parseInt(timeB[1]));
      });
    console.log("Events for date:", eventsForDate);
    return eventsForDate;
  };

  // Fungsi untuk mendapatkan kegiatan di bulan aktif
  const getEventsForMonth = (selectedDate) => {
    const eventsForMonth = events
      .filter((event) => {
        if (!event.dateRange || !Array.isArray(event.dateRange)) {
          console.warn(`Invalid dateRange for event ${event.id}, occurrence ${event.occurrence_id}:`, event.dateRange);
          return false;
        }
        return event.dateRange.some((eventDate) => {
          return (
            eventDate.getMonth() === selectedDate.getMonth() &&
            eventDate.getFullYear() === selectedDate.getFullYear()
          );
        });
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });
    console.log("Events for month:", selectedDate.toLocaleString("id-ID", { month: "long", year: "numeric" }), eventsForMonth);
    return eventsForMonth;
  };

  // Handler untuk perubahan tanggal
  const handleDateChange = (newDate) => {
    setDate(newDate);
    setViewMode("date");
  };

  // Handler untuk perubahan bulan aktif
  const handleActiveDateChange = ({ activeStartDate }) => {
    setDate(new Date(activeStartDate.getFullYear(), activeStartDate.getMonth(), 1));
    setViewMode("month");
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
            <Text fontWeight="bold" color="gray.600" mt={4} mb={2} px={2}>
              Management Umat
            </Text>
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

          {showCalendar && (
            <Box
              width="320px"
              bg="gray.50"
              borderLeft="4px solid #e2e8f0"
              p={4}
              overflowY="auto"
            >
              <Calendar
                onChange={handleDateChange}
                onActiveStartDateChange={handleActiveDateChange}
                value={date}
                locale="id-ID"
                tileClassName={({ date: tileDate }) => {
                  const today = new Date();
                  const isToday = new Date(tileDate).toDateString() === new Date(today).toDateString();
                  const hasEvents = events.some((event) => {
                    if (!event.dateRange || !Array.isArray(event.dateRange)) {
                      console.warn(`Invalid dateRange for event ${event.id}, occurrence ${event.occurrence_id}:`, event.dateRange);
                      return false;
                    }
                    return event.dateRange.some((eventDate) => {
                      return (
                        eventDate.getDate() === tileDate.getDate() &&
                        eventDate.getMonth() === tileDate.getMonth() &&
                        eventDate.getFullYear() === tileDate.getFullYear()
                      );
                    });
                  });
                  const classes = [];
                  if (isToday) classes.push("highlight");
                  if (hasEvents) classes.push("has-events");
                  return classes.join(" ");
                }}
              />
              <style jsx>{`
                .react-calendar {
                  width: 100%;
                  border: none;
                  font-family: inherit;
                  background: white;
                  borderRadius: 8px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .react-calendar__tile {
                  height: 48px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 4px;
                  position: relative;
                  color: #2d3748;
                }
                .react-calendar__tile--now {
                  background: #edf2f7;
                  color: #2b6cb0;
                }
                .react-calendar__tile:global(.highlight) {
                  background: #edf2f7;
                  color: #2b6cb0;
                }
                .react-calendar__tile:global(.has-events):after {
                  content: '';
                  width: 6px;
                  height: 6px;
                  background: #2b6cb0;
                  border-radius: 50%;
                  position: absolute;
                  bottom: 4px;
                }
                .react-calendar__navigation button {
                  color: #2b6cb0;
                  font-weight: bold;
                }
                .react-calendar__month-view__days__day--neighboringMonth {
                  color: #a0aec0;
                }
                .react-calendar__tile:hover {
                  background-color: #e2e8f0;
                  color: #2d3748;
                }
                .react-calendar__tile--active {
                  background-color: #e2e8f0;
                  color: #2d3748;
                }
              `}</style>
              {/* Detail Acara */}
              <Box mt={4}>
                {(viewMode === "month" ? getEventsForMonth(date) : getEventsForDate(date)).length > 0 ? (
                  (viewMode === "month" ? getEventsForMonth(date) : getEventsForDate(date)).map((event) => (
                    <Flex key={`${event.id}-${event.occurrence_id}`} justify="space-between" align="center" mb={2} p={2} bg="gray.50" borderRadius="md">
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
                          <MenuItem onClick={() => setSelectedEvent(event)}>Lihat Detail</MenuItem>
                        </MenuList>
                      </Menu>
                    </Flex>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center">
                    {viewMode === "month"
                      ? `Tidak ada acara di bulan ${date.toLocaleString("id-ID", { month: "long", year: "numeric" })}`
                      : "Tidak ada acara pada tanggal ini."}
                  </Text>
                )}
              </Box>
            </Box>
          )}
        </Flex>
      </Flex>

      <Modal isOpen={selectedEvent !== null} onClose={onCloseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedEvent?.name || "Detail Kegiatan"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedEvent && (
              <>
                <Text mb={2}><strong>Tanggal:</strong> {selectedEvent.day}, {selectedEvent.dateString}</Text>
                <Text my={2}><strong>Tanggal Lunar:</strong> {selectedEvent.lunar_sui_ci_year} {selectedEvent.lunar_month} {selectedEvent.lunar_day}</Text>
                {selectedEvent.time && (
                  <Text my={2}><strong>Waktu:</strong> {selectedEvent.time}</Text>
                )}
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