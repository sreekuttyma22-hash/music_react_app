import { useEffect, useMemo, useState } from "react";
import {
  addAppointmentParticipant,
  authenticatedFetch,
  getAppointmentParticipants,
  getLocations,
  getSelectedLocationId,
  removeAppointmentParticipant,
} from "../apiClient";
import ConfirmDialog from "../component/ConfirmDialog";
import "./AppointmentPage.css";

const API_BASE_URL = "https://sreekuttyma22.pythonanywhere.com/api";

/* =========================================================
   ICONS
========================================================= */

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4" width="18" height="17" rx="3" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m7 10 5 5 5-5" />
  </svg>
);

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm = {
  enrollment: "",
  instructor: "",
  room: "",
  lesson: "",
  lesson_type: "",
  level: "",
  mode: "",
  date: "",
  start_time: "",
  end_time: "",
  appointment_type: "individual",
  status: "requested",
  branch_id: "",
  branch_name: "",
  notes: "",
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeSelectValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "object") {
    return String(value.name || value.code || value.label || value.value || "").trim();
  }

  return String(value).trim();
};

const formatOptionLabel = (value) => {
  const label = normalizeSelectValue(value);
  if (!label) return "";

  return label
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part)
    .join(" ");
};

const getLocationName = (location) =>
  location?.name || location?.branch_name || location?.location_name || location?.title || "";

const getId = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (typeof value === "object") {
    const id = value.id ?? value.pk;
    return id === null || id === undefined ? "" : String(id);
  }
  return String(value);
};

const toTimeInput = (value) => {
  if (!value) return "";
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const normalizeAppointment = (item) => {
  const enrollmentDetails = item.enrollment_details || {};
  const instructorDetails = item.instructor_details || {};
  const roomDetails = item.room_details || item.room || null;
  const pricingMode = enrollmentDetails.pricing_details?.mode || enrollmentDetails.pricing?.mode || item.lesson_mode || item.mode || "";
  const lessonMode = typeof pricingMode === "object"
    ? pricingMode.name || pricingMode.code || ""
    : String(pricingMode);

  return {
    ...item,
    id: item.id,
    appointment_number: item.appointment_number || "",
    enrollmentId: getId(item.enrollment),
    instructorId: getId(item.instructor),
    studentName:
      enrollmentDetails.student_details?.name ||
      enrollmentDetails.student?.name ||
      "Unknown Student",
    courseName:
      enrollmentDetails.course_details?.course_name ||
      enrollmentDetails.course?.name ||
      "",
    instructorName:
      instructorDetails.name ||
      "Unknown Instructor",
    roomId: getId(item.room || roomDetails),
    roomName: roomDetails?.name || "",
    roomCapacity: roomDetails?.capacity || null,
    participantCount: Number(item.participant_count ?? item.participants?.length ?? 0),
    participants: item.participants || [],
    lessonMode: lessonMode.toLowerCase(),
    lesson: item.lesson || "",
    date: item.appointment_date || item.date || "",
    start_time: toTimeInput(item.start_time),
    end_time: toTimeInput(item.end_time),
    appointment_type: String(item.appointment_type || "individual").toLowerCase(),
    status: String(item.status || "requested").toLowerCase(),
    branch_id: item.branch_id ?? "",
    branch_name: item.branch_name || "",
    notes: item.notes || "",
  };
};

const roomBlockingStatuses = new Set(["requested", "confirmed", "scheduled"]);

const timeToMinutes = (value) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const timeRangesOverlap = (startA, endA, startB, endB) => {
  const firstStart = timeToMinutes(startA);
  const firstEnd = timeToMinutes(endA);
  const secondStart = timeToMinutes(startB);
  const secondEnd = timeToMinutes(endB);

  if ([firstStart, firstEnd, secondStart, secondEnd].some((value) => value === null)) {
    return false;
  }

  return firstStart < secondEnd && secondStart < firstEnd;
};

const appointmentOccupancy = (appointment) => {
  const participantCount = Number(appointment.participantCount);
  return Number.isFinite(participantCount) && participantCount > 0 ? participantCount : 1;
};

const isRoomAvailabilityError = (message = "") => (
  /room|already booked|already occupied|unavailable|capacity/i.test(message)
);

/* =========================================================
   API RESPONSE HELPER
========================================================= */

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(formatApiError(data, response.status));
    }
    return data;
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Server error (${response.status}). ${text.slice(0, 300)}`);
  }
  return text;
};

const formatApiError = (data, statusCode) => {
  if (!data) return `Request failed (${statusCode})`;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.error) return data.error;

  if (typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        if (Array.isArray(value)) return `${key}: ${value.join(", ")}`;
        if (typeof value === "object" && value !== null) return `${key}: ${JSON.stringify(value)}`;
        return `${key}: ${value}`;
      })
      .join(" | ");
  }
  return `Request failed (${statusCode})`;
};

/* =========================================================
   DATE / TIME
========================================================= */

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  if (hours === undefined || minutes === undefined) return time;

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatTimeRange = (start, end) => {
  if (!start && !end) return "Time not set";
  if (start && end) return `${formatTime(start)} - ${formatTime(end)}`;
  return formatTime(start || end);
};

const getInitials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const capitalize = (value = "") => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

/* =========================================================
   COMPONENT
========================================================= */

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [roomAlert, setRoomAlert] = useState("");

  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [groupAppointment, setGroupAppointment] = useState(null);
  const [groupParticipants, setGroupParticipants] = useState([]);
  const [participantEnrollment, setParticipantEnrollment] = useState("");
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantSaving, setParticipantSaving] = useState(false);
  const [participantError, setParticipantError] = useState("");
  const [participantSuccess, setParticipantSuccess] = useState("");
  const [participantToRemove, setParticipantToRemove] = useState(null);

  const filters = ["All", "Confirmed", "Requested", "Cancelled", "Completed"];

  useEffect(() => {
    if (!error || !isRoomAvailabilityError(error)) {
      setRoomAlert("");
      return undefined;
    }

    setRoomAlert(error);
    const timeoutId = window.setTimeout(() => setRoomAlert(""), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  /* =======================================================
     DERIVED DATA (SELECTED ENROLLMENT PRICING)
  ======================================================= */

  const selectedEnrollment = useMemo(() => {
    return enrollments.find((item) => String(item.id) === String(formData.enrollment));
  }, [enrollments, formData.enrollment]);

  const selectedPricing = selectedEnrollment?.pricing_details || {};
  const selectedLessonMeta = {
    lesson_type: formData.lesson_type || normalizeSelectValue(selectedPricing.lesson_type),
    level: formData.level || normalizeSelectValue(selectedPricing.level),
    mode: formData.mode || normalizeSelectValue(selectedPricing.mode),
  };
  const lessonMode = String(selectedLessonMeta.mode || "").toLowerCase();
  const roomRequired = Boolean(lessonMode) && !lessonMode.includes("online") && !lessonMode.includes("home");

  const roomAvailability = useMemo(() => {
    const availability = new Map();
    const canCheckSlot = Boolean(formData.date && formData.start_time && formData.end_time);

    rooms.forEach((room) => {
      const capacity = Number(room.capacity);
      const roomAppointments = canCheckSlot
        ? appointments.filter((appointment) => {
          if (String(appointment.roomId) !== String(room.id)) return false;
          if (editingAppointment && String(appointment.id) === String(editingAppointment.id)) return false;
          if (!roomBlockingStatuses.has(appointment.status)) return false;
          if (appointment.date !== formData.date) return false;
          if (formData.branch_id && appointment.branch_id && String(appointment.branch_id) !== String(formData.branch_id)) {
            return false;
          }
          return timeRangesOverlap(
            formData.start_time,
            formData.end_time,
            appointment.start_time,
            appointment.end_time,
          );
        })
        : [];

      const usedCapacity = roomAppointments.reduce(
        (total, appointment) => total + appointmentOccupancy(appointment),
        0,
      );
      const hasCapacity = !canCheckSlot || !Number.isFinite(capacity) || capacity <= 0 || usedCapacity < capacity;

      availability.set(String(room.id), {
        hasCapacity,
        usedCapacity,
        capacity,
        blockedByAppointments: roomAppointments.length > 0,
      });
    });

    return availability;
  }, [appointments, editingAppointment, formData.branch_id, formData.date, formData.end_time, formData.start_time, rooms]);

  const selectedRoomAvailability = roomAvailability.get(String(formData.room));

  const lessonTypeOptions = useMemo(() => {
    const values = [
      selectedPricing.lesson_type,
      selectedEnrollment?.lesson_type,
      selectedEnrollment?.course_details?.lesson_type,
      selectedEnrollment?.course_details?.lesson_types,
    ].flatMap((value) => (Array.isArray(value) ? value : [value]));

    const normalized = [...new Set(values.map(normalizeSelectValue).filter(Boolean))];
    return normalized.length ? normalized : ["private", "group"];
  }, [selectedEnrollment, selectedPricing.lesson_type]);

  const levelOptions = useMemo(() => {
    const values = [
      selectedPricing.level,
      selectedEnrollment?.level,
      selectedEnrollment?.course_details?.selected_levels,
      selectedEnrollment?.course_details?.level,
    ].flatMap((value) => (Array.isArray(value) ? value : [value]));

    const normalized = [...new Set(values.map(normalizeSelectValue).filter(Boolean))];
    return normalized.length ? normalized : ["beginner", "intermediate", "advanced"];
  }, [selectedEnrollment, selectedPricing.level]);

  const modeOptions = useMemo(() => {
    const values = [
      selectedPricing.mode,
      selectedEnrollment?.mode,
      selectedEnrollment?.course_details?.selected_modes,
      selectedEnrollment?.course_details?.mode,
    ].flatMap((value) => (Array.isArray(value) ? value : [value]));

    const normalized = [...new Set(values.map(normalizeSelectValue).filter(Boolean))];
    return normalized.length ? normalized : ["online", "institute", "home"];
  }, [selectedEnrollment, selectedPricing.mode]);

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await authenticatedFetch(`${API_BASE_URL}/appointments/`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const data = await parseResponse(response);
      const appointmentList = Array.isArray(data) ? data : data.results || data.data || [];
      setAppointments(appointmentList.map(normalizeAppointment));
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setError(err.message || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/enrollments/`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const data = await parseResponse(response);
      const enrollmentList = Array.isArray(data) ? data : data.results || data.data || [];
      setEnrollments(enrollmentList);
    } catch (err) {
      console.error("Failed to load enrollments:", err);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/instructors/`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const data = await parseResponse(response);
      const instructorList = Array.isArray(data) ? data : data.results || data.data || [];
      setInstructors(instructorList);
    } catch (err) {
      console.error("Failed to load instructors:", err);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/rooms/`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = await parseResponse(response);
      const roomList = Array.isArray(data) ? data : data.results || data.data || [];
      setRooms(roomList.filter((room) => room.active !== false));
    } catch (err) {
      console.error("Failed to load rooms:", err);
      setRooms([]);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await getLocations();
      setBranches(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (err) {
      console.error("Failed to load branches:", err);
      setBranches([]);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchEnrollments();
    fetchInstructors();
    fetchRooms();
    fetchBranches();
  }, []);

  /* =======================================================
     SUMMARY & FILTER
  ======================================================= */

  const summary = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((item) => item.status === "confirmed").length;
    const requested = appointments.filter((item) => item.status === "requested").length;
    const today = new Date().toISOString().split("T")[0];
    const todaySessions = appointments.filter((item) => item.date === today).length;

    return { total, confirmed, requested, todaySessions };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesFilter =
        activeFilter === "All" || appointment.status === activeFilter.toLowerCase();

      const matchesSearch =
        !searchText ||
        appointment.studentName?.toLowerCase().includes(searchText) ||
        appointment.instructorName?.toLowerCase().includes(searchText) ||
        appointment.roomName?.toLowerCase().includes(searchText) ||
        appointment.lesson?.toLowerCase().includes(searchText);

      const matchesDate = !selectedDate || appointment.date === selectedDate;

      return matchesFilter && matchesSearch && matchesDate;
    });
  }, [appointments, activeFilter, search, selectedDate]);

  /* =======================================================
     FORM HANDLERS
  ======================================================= */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (error && /room|already booked|already occupied|unavailable|capacity/i.test(error) && ["room", "date", "start_time", "end_time"].includes(name)) {
      setError("");
    }

    if (name === "enrollment") {
      const nextEnrollment = enrollments.find((item) => String(item.id) === String(value));
      const nextLessonType = normalizeSelectValue(nextEnrollment?.pricing_details?.lesson_type) || "private";
      const nextLevel = normalizeSelectValue(nextEnrollment?.pricing_details?.level) || "beginner";
      const nextMode = normalizeSelectValue(nextEnrollment?.pricing_details?.mode) || "institute";

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        lesson_type: nextEnrollment ? nextLessonType : prev.lesson_type,
        level: nextEnrollment ? nextLevel : prev.level,
        mode: nextEnrollment ? nextMode : prev.mode,
      }));
      return;
    }

    if (name === "branch_name") {
      const selectedBranch = branches.find(
        (branch) => String(branch.id) === String(value) || getLocationName(branch) === value
      );

      setFormData((prev) => ({
        ...prev,
        branch_name: getLocationName(selectedBranch) || value,
        branch_id: selectedBranch ? String(selectedBranch.id) : prev.branch_id,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingAppointment(null);
    const today = new Date().toISOString().split("T")[0];
    const selectedLocationId = getSelectedLocationId();
    const defaultBranch = branches.find((branch) => String(branch.id) === String(selectedLocationId)) || branches[0] || null;

    setFormData({
      ...initialForm,
      date: today,
      branch_id: defaultBranch ? String(defaultBranch.id) : "",
      branch_name: defaultBranch ? getLocationName(defaultBranch) : "",
    });
    setError("");
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal || !selectedEnrollment) return;

    setFormData((prev) => {
      const nextLessonType = prev.lesson_type || normalizeSelectValue(selectedPricing.lesson_type) || "private";
      const nextLevel = prev.level || normalizeSelectValue(selectedPricing.level) || "beginner";
      const nextMode = prev.mode || normalizeSelectValue(selectedPricing.mode) || "institute";

      if (prev.lesson_type === nextLessonType && prev.level === nextLevel && prev.mode === nextMode) {
        return prev;
      }

      return {
        ...prev,
        lesson_type: nextLessonType,
        level: nextLevel,
        mode: nextMode,
      };
    });
  }, [showModal, selectedEnrollment, selectedPricing.lesson_type, selectedPricing.level, selectedPricing.mode]);

  useEffect(() => {
    const handleOpenNewAppointment = () => openCreateModal();
    window.addEventListener("open-new-appointment", handleOpenNewAppointment);
    return () => window.removeEventListener("open-new-appointment", handleOpenNewAppointment);
  }, []);

  const openEditModal = (appointment) => {
    setEditingAppointment(appointment);

    const selectedBranch = branches.find(
      (branch) => String(branch.id) === String(appointment.branch_id)
    ) || branches.find((branch) => getLocationName(branch) === appointment.branch_name) || null;

    setFormData({
      enrollment: String(appointment.enrollmentId || getId(appointment.enrollment) || ""),
      instructor: String(appointment.instructorId || getId(appointment.instructor) || ""),
      room: String(appointment.roomId || getId(appointment.room) || ""),
      lesson: appointment.lesson || "",
      date: appointment.date || "",
      start_time: toTimeInput(appointment.start_time),
      end_time: toTimeInput(appointment.end_time),
      appointment_type: String(appointment.appointment_type || "individual").toLowerCase(),
      status: String(appointment.status || "requested").toLowerCase(),
      branch_id: String(appointment.branch_id ?? selectedBranch?.id ?? ""),
      branch_name: appointment.branch_name || getLocationName(selectedBranch) || "",
      notes: appointment.notes || "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingAppointment(null);
    setFormData(initialForm);
    setError("");
  };

  const openGroupDetails = async (appointment) => {
    setGroupAppointment(appointment);
    setGroupParticipants(appointment.participants || []);
    setParticipantEnrollment("");
    setParticipantError("");
    setParticipantSuccess("");
    setParticipantsLoading(true);
    try {
      const participants = await getAppointmentParticipants(appointment.id);
      setGroupParticipants(participants);
    } catch (err) {
      setParticipantError(err.message || "Unable to load participants.");
    } finally {
      setParticipantsLoading(false);
    }
  };

  const refreshGroupDetails = async () => {
    if (!groupAppointment) return;
    const participants = await getAppointmentParticipants(groupAppointment.id);
    const nextAppointment = normalizeAppointment({
      ...groupAppointment,
      participants,
      participant_count: participants.length,
    });
    setGroupParticipants(participants);
    setGroupAppointment(nextAppointment);
    setAppointments((previous) => previous.map((item) => item.id === nextAppointment.id ? nextAppointment : item));
  };

  const handleAddParticipant = async (event) => {
    event.preventDefault();
    if (!groupAppointment || !participantEnrollment || participantSaving) return;
    if (groupAppointment.roomCapacity && groupParticipants.length >= Number(groupAppointment.roomCapacity)) {
      setParticipantError("This room has reached its capacity.");
      return;
    }
    setParticipantSaving(true);
    setParticipantError("");
    setParticipantSuccess("");
    try {
      await addAppointmentParticipant(groupAppointment.id, participantEnrollment);
      setParticipantEnrollment("");
      await refreshGroupDetails();
      setParticipantSuccess("Participant added successfully.");
    } catch (err) {
      setParticipantError(err.message || "Unable to add participant.");
    } finally {
      setParticipantSaving(false);
    }
  };

  const handleRemoveParticipant = async (participant) => {
    if (!groupAppointment || participantSaving) return;
    setParticipantSaving(true);
    setParticipantError("");
    try {
      await removeAppointmentParticipant(groupAppointment.id, participant.id);
      await refreshGroupDetails();
      setParticipantSuccess("Participant removed successfully.");
    } catch (err) {
      setParticipantError(err.message || "Unable to remove participant.");
    } finally {
      setParticipantSaving(false);
    }
  };

  /* =======================================================
     SAVE & DELETE
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();
    if ((roomRequired || formData.appointment_type === "group") && !formData.room) {
      setError("A room is required for institute/offline lessons.");
      return;
    }
    if (formData.room && selectedRoomAvailability && !selectedRoomAvailability.hasCapacity) {
      setError("The selected room is already requested or scheduled at capacity for this time slot.");
      return;
    }
    setSaving(true);
    setError("");

    // Auto-construct dynamic lesson description from selected pricing details
    const autoLesson = [
      selectedLessonMeta.lesson_type,
      selectedLessonMeta.level,
      selectedLessonMeta.mode,
    ]
      .filter(Boolean)
      .join(" - ") || formData.lesson || "Music Lesson";

    try {
      const payload = {
        enrollment: formData.enrollment ? Number(formData.enrollment) : null,
        instructor: formData.instructor ? Number(formData.instructor) : null,
        room: formData.room ? Number(formData.room) : null,
        lesson: autoLesson,
        appointment_date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        appointment_type: String(formData.appointment_type).toLowerCase(),
        status: String(formData.status || "requested").toLowerCase(),
        branch_id: formData.branch_id ? Number(formData.branch_id) : null,
        branch_name: formData.branch_name.trim(),
        notes: formData.notes.trim(),
      };

      const isEditing = Boolean(editingAppointment);
      const url = isEditing
        ? `${API_BASE_URL}/appointments/${editingAppointment.id}/`
        : `${API_BASE_URL}/appointments/`;

      const response = await authenticatedFetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      await parseResponse(response);
      await fetchAppointments();
      closeModal();
    } catch (err) {
      console.error("Appointment save error:", err);
      const message = String(err.message || "");
      const normalizedMessage = message.toLowerCase();
      setError(normalizedMessage.includes("room") && (normalizedMessage.includes("conflict") || normalizedMessage.includes("already booked") || normalizedMessage.includes("already occupied") || normalizedMessage.includes("unavailable"))
        ? "The selected room is already booked for this time slot."
        : message || "Unable to save appointment.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setError("");

      const url = `${API_BASE_URL}/appointments/${deleteTarget.id}/`;
      const response = await authenticatedFetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!response.ok && response.status !== 204) {
        await parseResponse(response);
      }

      setAppointments((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete appointment error:", err);
      setError(err.message || "Unable to delete appointment.");
    } finally {
      setDeleting(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="appointments-page">
      

      {/* MAIN PANEL */}
      <section className="appointment-panel">
        <div className="appointment-toolbar">
          <div className="appointment-tabs">
            {filters.map((filter) => (
                  <button
                type="button"
                key={filter}
                className={activeFilter === filter ? "appointment-tab active" : "appointment-tab"}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="toolbar-right">
            <div className="appointment-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search appointments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="date-filter-wrapper">
              <CalendarIcon />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Filter by date"
              />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="appointment-table-wrapper">
          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner" />
              <span>Loading appointments...</span>
            </div>
          ) : (
            <table className="appointment-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Lesson</th>
                  <th>Instructor</th>
                  <th>Room</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="actions-column"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar">
                          {getInitials(appointment.studentName)}
                        </div>
                        <div className="student-details">
                          <strong>{appointment.appointment_type === "group" ? "Group appointment" : appointment.studentName}</strong>
                          {appointment.appointment_type === "group" ? (
                            <span>{appointment.participantCount} / {appointment.roomCapacity || "—"} students</span>
                          ) : appointment.courseName && <span>{appointment.courseName}</span>}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="lesson-cell">
                        <strong>{appointment.lesson || "—"}</strong>
                        <span>Music Lesson</span>
                      </div>
                    </td>

                    <td>
                      <div className="instructor-cell">
                        {appointment.instructorName}
                      </div>
                    </td>

                    <td>
                      <div className="lesson-cell">
                        <strong>{appointment.roomName || (appointment.lessonMode.includes("online") ? "Online" : "Home Visit")}</strong>
                        {appointment.roomCapacity && <span>Capacity: {appointment.roomCapacity}</span>}
                      </div>
                    </td>

                    <td>
                      <div className="datetime-cell">
                        <strong>{formatDate(appointment.date)}</strong>
                        <span>
                          <ClockIcon />
                          {formatTimeRange(appointment.start_time, appointment.end_time)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="appointment-type">
                        {capitalize(appointment.appointment_type)}
                      </span>
                    </td>

                    <td>
                      <span className={`appointment-status ${appointment.status}`}>
                        <i />
                        {capitalize(appointment.status)}
                      </span>
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="row-action edit"
                          title="Edit appointment"
                          onClick={() => openEditModal(appointment)}
                        >
                          <EditIcon />
                        </button>
                        {appointment.appointment_type === "group" && (
                          <button
                            type="button"
                            className="row-action edit"
                            title="View participants"
                            onClick={() => openGroupDetails(appointment)}
                          >
                            <span>Group</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="row-action delete"
                          title="Delete appointment"
                          onClick={() => setDeleteTarget(appointment)}
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredAppointments.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon"><CalendarIcon /></div>
              <h3>No appointments found</h3>
              <p>Try changing your search or filter, or create a new appointment.</p>
            </div>
          )}
        </div>

        {!loading && filteredAppointments.length > 0 && (
          <div className="appointment-footer">
            <span>
              Showing <strong>{filteredAppointments.length}</strong> of{" "}
              <strong>{appointments.length}</strong> appointments
            </span>
          </div>
        )}
      </section>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {roomAlert && (
            <div className="appointment-room-alert" role="alert">
              <strong>Error</strong>
              <span>{roomAlert}</span>
            </div>
          )}
          <div className="appointment-modal">
            <div className="modal-header">
              <div>
                <h2>{editingAppointment ? "Edit Appointment" : "New Appointment"}</h2>
                <p>
                  {editingAppointment
                    ? "Update appointment details."
                    : "Schedule a new music lesson."}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                <CloseIcon />
              </button>
            </div>

            {error && !/room|already booked|already occupied|unavailable|capacity/i.test(error) && <div className="form-error">{error}</div>}

            <form className="appointment-form" onSubmit={handleSubmit}>
              {/* SECTION 01 */}
              <div className="form-section">
                <div className="form-section-title">
                  <span>01</span>
                  Appointment Details
                </div>

                <div className="form-grid">
                  {/* STUDENT SELECT */}
                  <div className="form-group full-width">
                    <label>
                      Student <em>*</em>
                    </label>
                    <div className="select-wrapper">
                      <select
                        name="enrollment"
                        value={formData.enrollment}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Student</option>
                        {enrollments.map((item) => {
                          const studentName =
                            item.student_details?.name || "Unknown Student";
                          const courseName = item.course_details?.course_name;

                          return (
                            <option key={item.id} value={String(item.id)}>
                              {studentName} {courseName ? `— ${courseName}` : ""}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>

                  {/* LESSON DETAILS SECTION */}
                  <div className="form-group full-width">
                    <label>Lesson Details</label>
                    <div className="form-grid">
                      {/* <div className="form-group">
                        <div className="select-wrapper">
                          <select
                            name="lesson_type"
                            value={formData.lesson_type || ""}
                            onChange={handleInputChange}
                          >
                            <option value="">Select type</option>
                            {lessonTypeOptions.map((option) => (
                              <option key={option} value={option}>
                                {formatOptionLabel(option)}
                              </option>
                            ))}
                          </select>
                          <ChevronIcon />
                        </div>
                      </div> */}

                      <div className="form-group">
                        <div className="select-wrapper">
                          <select
                            name="level"
                            value={formData.level || ""}
                            onChange={handleInputChange}
                          >
                            <option value="">Select level</option>
                            {levelOptions.map((option) => (
                              <option key={option} value={option}>
                                {formatOptionLabel(option)}
                              </option>
                            ))}
                          </select>
                          <ChevronIcon />
                        </div>
                      </div>

                      <div className="form-group">
                        <div className="select-wrapper">
                          <select
                            name="mode"
                            value={formData.mode || ""}
                            onChange={handleInputChange}
                          >
                            <option value="">Select mode</option>
                            {modeOptions.map((option) => (
                              <option key={option} value={option}>
                                {formatOptionLabel(option)}
                              </option>
                            ))}
                          </select>
                          <ChevronIcon />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* INSTRUCTOR */}
                  <div className="form-group full-width">
                    <label>
                      Instructor <em>*</em>
                    </label>
                    <div className="select-wrapper">
                      <select
                        name="instructor"
                        value={formData.instructor}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select instructor</option>
                          {instructors.map((instructor) => {
                            const name = instructor.instructor_name || instructor.name || "Unnamed Instructor";
                            const spec = instructor.specialization ? ` — ${instructor.specialization}` : "";

                            return (
                              <option key={instructor.id} value={String(instructor.id)}>
                                {name}{spec}
                              </option>
                            );
                          })}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>
                      Room {roomRequired && <em>*</em>}
                    </label>
                    <div className="select-wrapper">
                      <select
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        required={roomRequired}
                      >
                        <option value="">{roomRequired ? "Select room" : "choose the room"}</option>
                        {rooms.map((room) => (
                          <option
                            key={room.id}
                            value={String(room.id)}
                            disabled={roomAvailability.get(String(room.id))?.hasCapacity === false}
                          >
                            {room.name} - Capacity: {room.capacity}
                            {roomAvailability.get(String(room.id))?.hasCapacity === false ? " (Already requested/scheduled)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                    {error && /room|already booked|already occupied|unavailable|capacity/i.test(error) && (
                      <small className="room-availability-error">{error}</small>
                    )}
                    {!rooms.length && roomRequired && <small>No rooms available for this location.</small>}
                  </div>
                </div>
              </div>

              {/* SECTION 02 */}
              <div className="form-section">
                <div className="form-section-title">
                  <span>02</span>
                  Date & Time
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Date <em>*</em>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Start Time <em>*</em>
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      End Time <em>*</em>
                    </label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Appointment Type</label>
                    <div className="select-wrapper">
                      <select
                        name="appointment_type"
                        value={formData.appointment_type}
                        onChange={handleInputChange}
                      >
                        <option value="individual">Private / Individual</option>
                        <option value="group">Group</option>
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 03 */}
              <div className="form-section">
                <div className="form-section-title">
                  <span>03</span>
                  Additional Information
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Status</label>
                    <div className="select-wrapper">
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="requested">Requested</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Branch Name</label>
                    <div className="select-wrapper">
                      <select
                        name="branch_name"
                        value={formData.branch_name || ""}
                        onChange={handleInputChange}
                      >
                        <option value="">Select branch</option>
                        {branches.length ? branches.map((branch) => (
                          <option key={branch.id} value={String(branch.id)}>
                            {getLocationName(branch) || `Location ${branch.id}`}
                          </option>
                        )) : (
                          <option value={formData.branch_name || ""}>
                            {formData.branch_name || "No branch available"}
                          </option>
                        )}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Add notes about this appointment..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="button-spinner" />
                      Saving...
                    </>
                  ) : editingAppointment ? (
                    "Update Appointment"
                  ) : (
                    "Create Appointment"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {groupAppointment && (
        <div className="modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !participantSaving) setGroupAppointment(null);
        }}>
          <div className="appointment-modal group-details-modal">
            <div className="modal-header">
              <div>
                <h2>Group Appointment</h2>
                <p>{groupAppointment.lesson || "Group lesson"} · {groupAppointment.roomName || "Room not assigned"}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setGroupAppointment(null)} disabled={participantSaving}>
                <CloseIcon />
              </button>
            </div>

            {participantError && <div className="form-error">{participantError}</div>}
            {participantSuccess && <div className="form-success">{participantSuccess}</div>}

            <div className="group-capacity-summary">
              <strong>{groupParticipants.length} / {groupAppointment.roomCapacity || "—"} students</strong>
              <span>{groupAppointment.roomName || "Online"}</span>
              <div className="group-capacity-track">
                <span style={{ width: `${groupAppointment.roomCapacity ? Math.min(100, (groupParticipants.length / groupAppointment.roomCapacity) * 100) : 0}%` }} />
              </div>
            </div>

            <form className="participant-form" onSubmit={handleAddParticipant}>
              <label>Add Participant</label>
              <div className="participant-form-row">
                <select
                  value={participantEnrollment}
                  onChange={(event) => setParticipantEnrollment(event.target.value)}
                  disabled={participantSaving || participantsLoading || (groupAppointment.roomCapacity && groupParticipants.length >= Number(groupAppointment.roomCapacity))}
                >
                  <option value="">Select student enrollment</option>
                  {enrollments
                    .filter((enrollment) => !groupParticipants.some((participant) => String(participant.enrollment) === String(enrollment.id)))
                    .map((enrollment) => (
                      <option key={enrollment.id} value={String(enrollment.id)}>
                        {enrollment.student_details?.name || "Unknown Student"} - {enrollment.course_details?.course_name || "Course"} (#{enrollment.id})
                      </option>
                    ))}
                </select>
                <button type="submit" className="primary-button" disabled={participantSaving || !participantEnrollment || Boolean(groupAppointment.roomCapacity && groupParticipants.length >= Number(groupAppointment.roomCapacity))}>
                  {participantSaving ? "Saving..." : "Add Student"}
                </button>
              </div>
              {groupAppointment.roomCapacity && groupParticipants.length >= Number(groupAppointment.roomCapacity) && <small>Room capacity reached.</small>}
            </form>

            {participantsLoading ? (
              <div className="table-loading">Loading participants...</div>
            ) : groupParticipants.length === 0 ? (
              <div className="empty-state"><h3>No participants yet</h3><p>Add an active enrollment to this group.</p></div>
            ) : (
              <div className="participant-list">
                {groupParticipants.map((participant) => (
                  <div className="participant-row" key={participant.id}>
                    <div>
                      <strong>{participant.student_name || "Unknown Student"}</strong>
                      <span>{participant.student_number || "No student number"} · {participant.course_name || "Course"}</span>
                      <small>Enrollment ID: {participant.enrollment}</small>
                    </div>
                    <button type="button" className="row-action delete" onClick={() => setParticipantToRemove(participant)} disabled={participantSaving} title="Remove participant">
                      <DeleteIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="delete-modal">
            <div className="delete-icon-wrapper">
              <DeleteIcon />
            </div>

            <h2>Delete Appointment?</h2>
            <p>
              Are you sure you want to delete the appointment for{" "}
              <strong>{deleteTarget.studentName}</strong>? This action cannot be undone.
            </p>

            <div className="delete-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(participantToRemove)}
        title="Remove participant?"
        message={groupParticipants.length === 1
          ? "This removes the only participant. Keep the group appointment empty?"
          : "Remove this participant from the group appointment?"}
        confirmLabel="Remove"
        busy={participantSaving}
        onCancel={() => setParticipantToRemove(null)}
        onConfirm={async () => {
          await handleRemoveParticipant(participantToRemove);
          setParticipantToRemove(null);
        }}
      />
    </main>
  );
};

export default AppointmentsPage;