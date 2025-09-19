import { 
  Box, Center, 
  Divider, Flex, Heading, 
  HStack, Spinner, Text, 
  Menu, MenuButton, MenuList, 
  MenuItem, IconButton, Tag 
} from "@chakra-ui/react";
import { FiArrowLeft, FiChevronRight, FiSettings, FiMoreVertical } from "react-icons/fi";
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

const Sidebar = ({ navItems, router }) => (
  <Box width="240px" p={6} borderRight="4px solid #e2e8f0" overflow="auto">
    <Box mb={6}>
      <Image src="/Onemapan_ss.svg" alt="Logo" width={200} height={180} style={{ objectFit: "contain" }} />
    </Box>
    <Flex direction="column" gap={3}>
      {navItems.slice(0, 3).map((item) => (
        <NavItem key={item.href} item={item} isActive={router.pathname === item.href} />
      ))}
      <Text fontWeight="bold" color="gray.600" mt={4} mb={2} px={2}>
        Management Umat
      </Text>
      {navItems.slice(3).map((item) => (
        <NavItem key={item.href} item={item} isActive={router.pathname === item.href} />
      ))}
    </Flex>
  </Box>
);

const NavItem = ({ item, isActive }) => (
  <Box
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

const Header = ({ title, showBackButton, backPath, router, username, handleLogout }) => (
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
          <Heading size="sm">Tambah manual</Heading>
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

const EventCalendar = ({ date, setDate, viewMode, setViewMode, events, setSelectedEvent }) => {
  const getEventsForDate = useMemo(() => (selectedDate) => {
    const eventsForDate = events
      .filter((event) => {
        if (!event.dateRange || !Array.isArray(event.dateRange)) {
          console.warn(`Invalid dateRange for event ${event.id}, occurrence ${event.occurrence_id}:`, event.dateRange);
          return false;
        }
        return event.dateRange.some((eventDate) => (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        ));
      })
      .reduce((uniqueEvents, event) => {
        const key = `${event.id}-${selectedDate.toDateString()}`;
        if (!uniqueEvents.some(e => e.id === event.id)) {
          uniqueEvents.push({
            ...event,
            time: event.isSameDay 
              ? `${event.startTime || "00:00 WIB"} - ${event.endTime !== "TBD" ? event.endTime : "00:00 WIB"}`
              : ""
          });
        }
        return uniqueEvents;
      }, [])
      .sort((a, b) => {
        const timeA = (a.startTime || "00:00 WIB").replace(" WIB", "").split(":");
        const timeB = (b.startTime || "00:00 WIB").replace(" WIB", "").split(":");
        return (parseInt(timeA[0]) * 60 + parseInt(timeA[1])) - (parseInt(timeB[0]) * 60 + parseInt(timeB[1]));
      });
    return eventsForDate;
  }, [events]);

  const getEventsForMonth = useMemo(() => (selectedDate) => {
    const eventsForMonth = events
      .filter((event) => {
        if (!event.dateRange || !Array.isArray(event.dateRange)) {
          console.warn(`Invalid dateRange for event ${event.id}, occurrence ${event.occurrence_id}:`, event.dateRange);
          return false;
        }
        return event.dateRange.some((eventDate) => (
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        ));
      })
      .reduce((uniqueEvents, event) => {
        if (!uniqueEvents.some(e => e.id === event.id)) {
          uniqueEvents.push(event);
        }
        return uniqueEvents;
      }, [])
      .sort((a, b) => {
        const dateA = a.dateRange[0] || new Date(a.rawDate);
        const dateB = b.dateRange[0] || new Date(b.rawDate);
        return dateA - dateB;
      });
    return eventsForMonth;
  }, [events]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setViewMode("date");
  };

  const handleActiveDateChange = ({ activeStartDate }) => {
    setDate(new Date(activeStartDate.getFullYear(), activeStartDate.getMonth(), 1));
    setViewMode("month");
  };

  return (
    <Box width="360px" bg="gray.50" borderLeft="4px solid #e2e8f0" p={4} overflowY="auto">
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
              return false;
            }
            return event.dateRange.some((eventDate) => (
              eventDate.getDate() === tileDate.getDate() &&
              eventDate.getMonth() === tileDate.getMonth() &&
              eventDate.getFullYear() === tileDate.getFullYear()
            ));
          });
          return [
            isToday && "highlight",
            hasEvents && "has-events"
          ].filter(Boolean).join(" ");
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
        .react-calendar__tile--now,
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
        .react-calendar__tile:hover,
        .react-calendar__tile--active {
          background-color: #e2e8f0;
          color: #2d3748;
        }
      `}</style>
      <Box mt={4}>
        {(viewMode === "month" ? getEventsForMonth(date) : getEventsForDate(date)).length > 0 ? (
          (viewMode === "month" ? getEventsForMonth(date) : getEventsForDate(date)).map((event) => (
            <Flex 
              key={`${event.id}-${event.occurrence_id}`} 
              justify="space-between" 
              align="center" 
              mb={2} 
              p={2} 
              bg="gray.50" 
              borderRadius="md"
            >
              <Box>
                {viewMode === "month" ? (
                  <>
                    <Text fontSize="md" fontWeight="bold" color="#2e05e8ff">
                      {event.dateString || event.dateRange[0]?.toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
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
  );
};

export default function Layout({ children, title, showCalendar = false }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState("month");

  const navItems = useMemo(() => [
    { label: "Dashboard", href: "/dashboard", iconSrc: "/dashboard_icon.svg" },
    { label: "Kegiatan", href: "/event", iconSrc: "/event_icon.svg" },
    { label: "Laporan", href: "/report", iconSrc: "/report_icon.svg" },
    { label: "Umat", href: "/umat", iconSrc: "/user_icon.svg" },
    { label: "QiuDao", href: "/qiudao", iconSrc: "/qiudao_icon.svg" },
  ], []);

  const showBackButton = useMemo(() => 
    ["/umat/addUmat", "/umat/editUmat", "/qiudao/addQiudao", "/qiudao/editQiudao"].includes(router.pathname),
    [router.pathname]
  );

  const backPath = router.pathname.includes("umat") ? "/umat" : "/qiudao";

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
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated() && router.pathname !== "/login") {
      router.replace("/login");
    }
  }, [router]);

  const { data: fetchedEvents = [] } = useFetchEvents({
    event_type: [],
    provinceId: [],
  });

  useEffect(() => {
    const transformedEvents = fetchedEvents.map((event) => {
      const dateRanges = [];
      event.occurrences.forEach((occ) => {
        const startDate = new Date(occ.greg_occur_date);
        const endDate = occ.greg_end_date ? new Date(occ.greg_end_date) : startDate;
        const dates = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
        if (event.is_recurring) {
          dates.forEach((date) => {
            if (!dateRanges.some(d => d.toDateString() === date.toDateString())) {
              dateRanges.push(date);
            }
          });
        } else {
          dateRanges.push(...dates);
        }
      });
      return { ...event, dateRange: dateRanges };
    });
    setEvents(transformedEvents);
  }, [fetchedEvents]);

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
        <Sidebar navItems={navItems} router={router} />
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
              events={events} 
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