import { 
  Box, Center, 
  Divider, Flex, Heading, 
  HStack, Spinner, Text, 
  Menu, MenuButton, MenuList, 
  MenuItem, IconButton, Tag, Tooltip
} from "@chakra-ui/react";
import { FiArrowLeft, FiChevronRight, FiSettings, FiMoreVertical, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import EventDetailModal from "./event/EventDetailModal";
import { logout } from "@/lib/auth/logout";
import { isAuthenticated } from "@/lib/auth/checkAuth";
import { useFetchEvents } from "@/features/event/useFetchEvents";
import styles from "./css/event/eventCalendar.module.css";

const NavItem = ({ item, isActive, isCollapsed }) => (
  <Tooltip label={isCollapsed ? item.label : undefined} placement="right" hasArrow>
    <Box
      as={NextLink}
      href={item.href}
      px={isCollapsed ? 2 : 4}
      py={2}
      borderRadius="full"
      bg={isActive ? "blue.100" : "transparent"}
      color={isActive ? "blue.600" : "blue.500"}
      fontWeight={isActive ? "bold" : "normal"}
      _hover={isActive ? {} : { bg: "gray.100" }}
      display="flex"
      justifyContent={isCollapsed ? "center" : "flex-start"}
      alignItems="center"
      cursor="pointer"
      transition="all 0.2s"
    >
      <HStack spacing={isCollapsed ? 0 : 2}>
        <Image
          src={item.iconSrc}
          alt={item.label}
          width={24}
          height={24}
          style={{ minWidth: 24, minHeight: 24 }}
        />
        {!isCollapsed && <Text>{item.label}</Text>}
      </HStack>
    </Box>
  </Tooltip>
);

const Header = ({ title, showBackButton, backPath, router, username, handleLogout }) => {
  const isEditPage = useMemo(() => {
    const editPaths = [
      "/umat/editUmat",
      "/qiudao/editQiudao",
      "/fotang/editFotang",
      "/dianchuanshi/editDianChuanShi",
      "/event/editEvent",
      "/institution/editInstitution",
    ];
    return editPaths.includes(router.pathname);
  }, [router.pathname]);

  return (
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
              onClick={() => router.push(backPath)}
              mr={2}
            />
            <Heading size="sm" color="gray.300">{title}</Heading>
            <IconButton
              variant="unstyled"
              size="sm"
              icon={<FiChevronRight color="gray.600" />}
              aria-label="ActivePage"
              p={2.5}
            />
            <Heading size="sm">{isEditPage ? "Edit manual" : "Tambah manual"}</Heading>
          </>
        )}
        {!showBackButton && <Heading size="sm">{title}</Heading>}
      </HStack>
      <Flex gap={2} align="center">
        <Menu>
          <MenuButton as={IconButton} icon={<FiSettings />} variant="ghost" aria-label="Settings" />
          <MenuList>
            {username && <Text px={3} py={2} fontWeight="bold">Halo, {username}</Text>}
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
};

const EventCalendar = ({ date, setDate, viewMode, setViewMode, events = [], setSelectedEvent, overrideEvents }) => {
  const displayEvents = overrideEvents || events;

  const normalizedEvents = useMemo(() => {
    return displayEvents.map(event => {
      const name = event.event_name || event.name || "Tanpa Nama";

      const rawDate = event.rawDate || event.date || event.greg_occur_date || event.occurrences?.[0]?.greg_occur_date;
      const dateObj = rawDate ? new Date(rawDate) : null;

      let location = "Lokasi Tidak Diketahui";
      if (event.fotang?.location_name) {
        location = event.fotang.location_name;
      } else if (event.eventLocation?.location_name) {
        location = event.eventLocation.location_name;
      } else if (event.event_type === "Hari_Besar" || event.type === "Hari_Besar") {
        location = "Seluruh Indonesia";
      }

      const category = event.category || "Internal";

      const rawType = event.event_type || event.type || "Regular";
      const type = rawType === "Hari_Besar" ? "Hari Besar" 
                : rawType === "Lembaga" ? "Lembaga" 
                : rawType;

      const time = dateObj
        ? dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        : "00:00 WIB";

      return {
        ...event,
        id: event.event_id || event.id || Date.now(),
        name,
        location,
        type,
        category,
        dateRange: dateObj ? [dateObj] : [],
        time,
        dateString: dateObj?.toLocaleDateString("id-ID", { 
          day: "numeric", 
          month: "long", 
          year: "numeric" 
        }),
        is_recurring: !!event.is_recurring
      };
    }).filter(e => e.dateRange.length > 0);
  }, [displayEvents]);

  const getEventsForDate = (selectedDate) => {
    return normalizedEvents
      .filter(event => event.dateRange.some(d => 
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      ))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getEventsForMonth = (selectedDate) => {
    return normalizedEvents
      .filter(event => event.dateRange.some(d => 
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      ))
      .sort((a, b) => a.dateRange[0] - b.dateRange[0]);
  };

  return (
    <Box width="360px" bg="gray.50" borderLeft="4px solid" borderColor="gray.200" p={4} overflowY="auto">
      <Calendar
        onChange={(v) => { setDate(v); setViewMode("date"); }}
        onActiveStartDateChange={({ activeStartDate }) => {
          setDate(new Date(activeStartDate.getFullYear(), activeStartDate.getMonth(), 1));
          setViewMode("month");
        }}
        value={date}
        locale="id-ID"
        className={styles.calendar}
        tileClassName={({ date: tileDate }) => {
          const hasEvents = normalizedEvents.some(e => 
            e.dateRange.some(d => 
              d.getDate() === tileDate.getDate() &&
              d.getMonth() === tileDate.getMonth() &&
              d.getFullYear() === tileDate.getFullYear()
            )
          );
          const isToday = new Date().toDateString() === tileDate.toDateString();
          return `${isToday ? styles.highlight : ""} ${hasEvents ? styles.hasEvents : ""}`.trim();
        }}
      />

      <Box mt={4}>
        {(viewMode === "month" ? getEventsForMonth(date) : getEventsForDate(date)).length > 0 ? (
          (viewMode === "month" ? getEventsForMonth(date) : getEventsForDate(date)).map((event) => (
            <Flex 
              key={event.id} 
              justify="space-between" 
              align="center" 
              mb={3} 
              p={3} 
              bg="white" 
              borderRadius="md"
              boxShadow="sm"
              _hover={{ boxShadow: "md" }}
            >
              <Box flex="1">
                {viewMode === "month" ? (
                  <Text fontSize="sm" fontWeight="bold" color="blue.600">
                    {event.dateString}
                  </Text>
                ) : (
                  <Text fontSize="lg" fontWeight="bold" color="blue.600">
                    {event.time}
                  </Text>
                )}
                <Text fontSize="md" fontWeight="bold" noOfLines={2}>
                  {event.name}
                </Text>
                <Text fontSize="sm" color="gray.600" noOfLines={1} mt={1}>
                  {event.location}
                </Text>
                <HStack spacing={2} mt={2}>
                  <Tag 
                    size="sm" 
                    colorScheme={event.category === "Internal" ? "green" : "orange"}
                    variant="solid"
                  >
                    {event.category === "Internal" ? "Internal" : "External"}
                  </Tag>

                  <Tag 
                    size="sm" 
                    colorScheme={
                      event.type === "Hari Besar" ? "red" : 
                      event.type === "Lembaga" ? "purple" : "blue"
                    }
                  >
                    {event.type}
                  </Tag>

                  {event.is_recurring && (
                    <Tag size="sm" colorScheme="teal">Berulang</Tag>
                  )}
                </HStack>
              </Box>
              <Menu>
                <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
                <MenuList>
                  <MenuItem onClick={() => setSelectedEvent(event)}>
                    Lihat Detail
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          ))
        ) : (
          <Text color="gray.500" textAlign="center" fontSize="sm" mt={6}>
            Tidak ada acara {viewMode === "month" ? "di bulan ini" : "pada tanggal ini"}
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default function Layout({ children, title, showCalendar = false, calendarEvents }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRegularUser, setIsRegularUser] = useState(false);
  const [viewMode, setViewMode] = useState("month");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      setIsSidebarCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  const baseNavItems = useMemo(() => {
    const items = [
      { label: "Dashboard", href: "/dashboard", iconSrc: "/dashboard_icon.svg" },
      { label: "Kegiatan", href: "/event", iconSrc: "/event_icon.svg" },
    ];

    if (!isRegularUser) {
      items.push({ label: "Laporan", href: "/report", iconSrc: "/report_icon.svg" });
    }

    items.push(
      { label: "Umat", href: "/umat", iconSrc: "/user_icon.svg" },
      { label: "QiuDao", href: "/qiudao", iconSrc: "/qiudao_icon.svg" },
      { label: "Pengaturan", href: "/settings", iconSrc: "/settings_icon.svg" },
      { label: "Pusat Bantuan", href: "/help", iconSrc: "/help_icon.svg" }
    );

    return items;
  }, [isRegularUser]);

  const superAdminNavItems = useMemo(() => [
    { label: "Dashboard", href: "/dashboard", iconSrc: "/dashboard_icon.svg" },
    { label: "Kegiatan", href: "/event", iconSrc: "/event_icon.svg" },
    { label: "Laporan", href: "/report", iconSrc: "/report_icon.svg" },
    { label: "Umat", href: "/umat", iconSrc: "/user_icon.svg" },
    { label: "QiuDao", href: "/qiudao", iconSrc: "/qiudao_icon.svg" },
    { label: "Peran", href: "/role", iconSrc: "/role_icon.svg" },
    { label: "Pengaturan", href: "/settings", iconSrc: "/settings_icon.svg" },
    { label: "Pusat Bantuan", href: "/help", iconSrc: "/help_icon.svg" },
    { label: "List Vihara", href: "/fotang", iconSrc: "/temple_icon.svg" },
    { label: "List Pandita", href: "/dianchuanshi", iconSrc: "/group_icon.svg" },
    { label: "List Lembaga", href: "/institution", iconSrc: "/institution_icon.svg" },
  ], []);

  const navItems = isSuperAdmin ? superAdminNavItems : baseNavItems;

  const showBackButton = useMemo(() => 
    [
      "/umat/addUmat", 
      "/umat/editUmat", 
      "/qiudao/addQiudao", 
      "/qiudao/editQiudao",
      "/fotang/addFotang",
      "/fotang/editFotang",
      "/dianchuanshi/addDianChuanShi",
      "/dianchuanshi/editDianChuanShi",
      "/event/editEvent",
      "/institution/addInstitution",
      "/institution/editInstitution",
    ].includes(router.pathname),
    [router.pathname]
  );

  const backPath = useMemo(() => {
    if (router.pathname.includes("umat")) return "/umat";
    if (router.pathname.includes("qiudao")) return "/qiudao";
    if (router.pathname.includes("fotang")) return "/fotang";
    if (router.pathname.includes("dianchuanshi")) return "/dianchuanshi";
    if (router.pathname.includes("event")) return "/event";
    if (router.pathname.includes("institution")) return "/institution";
    return "/";
  }, [router.pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUsername(user.username);
          const role = (user.role || "").toLowerCase().replace(/\s+/g, "");

          const isRegularUser = user.scope === "self"

          setIsSuperAdmin(["superadmin", "ketualembaga", "sekjenlembaga"].includes(role));
          setIsRegularUser(isRegularUser);
        } catch (e) {
          console.error("Gagal parsing user:", e);
        }
      }
    }
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated() && router.pathname !== "/login") {
      router.replace("/login");
    }
  }, [router]);

  const { data: allEvents = [] } = useFetchEvents({

  });

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) setIsSidebarCollapsed(saved === "true");
  }, []);


  useEffect(() => setEvents(allEvents), [allEvents]);

  if (isCheckingAuth) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Flex direction="column" h="100vh" maxW="100vw" overflow="hidden">
      <Flex flex="1" overflow="hidden">
        {/* SIDEBAR */}
        <Box
          position="relative"
          transition="width 0.3s ease"
          width={isSidebarCollapsed ? "64px" : "240px"}
          minWidth={isSidebarCollapsed ? "64px" : "240px"}
          bg="white"
          borderRight="4px solid"
          borderColor="gray.200"
          overflow="hidden"
        >
          <Flex direction="column" h="full" justify="space-between">
            <Box p={isSidebarCollapsed ? 3 : 6} overflowY="auto" flex="1">
              <Box mb={6} textAlign="center">
                <Image
                  src={isSidebarCollapsed ? "/onemapan_collapsed.svg" : "/Onemapan_ss.svg"}
                  alt="Logo"
                  width={isSidebarCollapsed ? 40 : 200}
                  height={isSidebarCollapsed ? 40 : 180}
                  style={{ objectFit: "contain" }}
                />
              </Box>

              <Flex direction="column" gap={2}>
                {navItems.slice(0, 2).map((item) => (
                  <NavItem key={item.href} item={item} isActive={router.pathname === item.href} isCollapsed={isSidebarCollapsed} />
                ))}

                {!isRegularUser && navItems.some(item => item.label === "Laporan") && (
                  <NavItem 
                    key={navItems.find(item => item.label === "Laporan").href}
                    item={navItems.find(item => item.label === "Laporan")}
                    isActive={router.pathname === navItems.find(item => item.label === "Laporan").href}
                    isCollapsed={isSidebarCollapsed}
                  />
                )}

                {!isSidebarCollapsed && (
                  <>
                    <Text fontWeight="bold" color="gray.600" mt={4} mb={2} px={2}>Manajemen Umat</Text>
                    {navItems.filter(item => ["Umat", "QiuDao"].includes(item.label)).map((item) => (
                      <NavItem key={item.href} item={item} isActive={router.pathname === item.href} isCollapsed={isSidebarCollapsed} />
                    ))}

                    <Text fontWeight="bold" color="gray.600" mt={4} mb={2} px={2}>Manajemen Akun</Text>
                    
                    {isSuperAdmin && navItems.some(item => item.label === "Peran") && (
                      <NavItem 
                        key={navItems.find(item => item.label === "Peran").href}
                        item={navItems.find(item => item.label === "Peran")}
                        isActive={router.pathname === navItems.find(item => item.label === "Peran").href}
                        isCollapsed={isSidebarCollapsed}
                      />
                    )}

                    {navItems.filter(item => ["Pengaturan", "Pusat Bantuan"].includes(item.label)).map((item) => (
                      <NavItem key={item.href} item={item} isActive={router.pathname === item.href} isCollapsed={isSidebarCollapsed} />
                    ))}

                    {isSuperAdmin && (
                      <>
                        <Text fontWeight="bold" color="gray.600" mt={4} mb={2} px={2}>Manajemen Data</Text>
                        {navItems.filter(item => ["List Vihara", "List Pandita", "List Lembaga"].includes(item.label)).map((item) => (
                          <NavItem key={item.href} item={item} isActive={router.pathname === item.href} isCollapsed={isSidebarCollapsed} />
                        ))}
                      </>
                    )}
                  </>
                )}

                {isSidebarCollapsed && navItems.map((item) => (
                  <NavItem key={item.href} item={item} isActive={router.pathname === item.href} isCollapsed={isSidebarCollapsed} />
                ))}
              </Flex>
            </Box>

            <Box
              p={isSidebarCollapsed ? 2 : 3}
              display="flex"
              justifyContent={isSidebarCollapsed ? "center" : "flex-end"}
              alignItems="center"
            >
              <Box
                as="button"
                onClick={toggleSidebar}
                cursor="pointer"
                display="flex"
                alignItems="center"
                justifyContent="center"
                width={isSidebarCollapsed ? "36px" : "40px"}
                height={isSidebarCollapsed ? "36px" : "40px"}
                borderRadius="full"
                bg="transparent"
                border="transparent"
                transition="all 0.2s"
                _hover={{
                  bg: "gray.100",
                  borderColor: "gray.200",
                  transform: "scale(1.05)"
                }}
                _active={{
                  transform: "scale(0.95)"
                }}
              >
                <Box
                  as={isSidebarCollapsed ? FiChevronsRight : FiChevronsLeft}
                  color="gray.600"
                  fontSize="18px"
                />
              </Box>
            </Box>
          </Flex>
        </Box>

        <Flex flex="1" direction="row" overflow="hidden">
          <Box flex="1" overflowY="auto" overflowX="hidden" minW="0">
            <Header 
              title={title} 
              showBackButton={showBackButton} 
              backPath={backPath} 
              router={router} 
              username={username} 
              handleLogout={logout} 
            />
            <Divider borderBottomWidth="4px"/>
            <Box p={4}>{children}</Box>
          </Box>
          {showCalendar && (
            <EventCalendar 
              date={date} 
              setDate={setDate} 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              events={calendarEvents || allEvents}
              setSelectedEvent={setSelectedEvent}
            />
          )}
        </Flex>
      </Flex>

      <EventDetailModal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        imageUrl={selectedEvent?.poster_s3_bucket_link || "https://via.placeholder.com/400"}
      />
    </Flex>
  );
}