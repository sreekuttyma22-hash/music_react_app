import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./Dashboard.css";
import API_CONFIG from "../apiConfig";
import { apiRequest } from "../apiClient";

const API_URL = API_CONFIG.ENDPOINTS.DASHBOARD;

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

const PERIODS = {
  week: {
    label: "This Week",
    previousLabel: "Last Week",

    revenueKey: "this_week",
    previousRevenueKey: "last_week",

    enrollmentKey: "this_week",
    previousEnrollmentKey: "last_week",

    appointmentKey: "this_week",
    previousAppointmentKey: "last_week",
  },

  month: {
    label: "This Month",
    previousLabel: "Last Month",

    revenueKey: "this_month",
    previousRevenueKey: "last_month",

    enrollmentKey: "this_month",
    previousEnrollmentKey: "last_month",

    appointmentKey: "this_month",
    previousAppointmentKey: "last_month",
  },

  year: {
    label: "This Year",
    previousLabel: "Last Year",

    revenueKey: "this_year",
    previousRevenueKey: "last_year",

    enrollmentKey: "this_year",
    previousEnrollmentKey: "last_year",

    appointmentKey: "this_year",
    previousAppointmentKey: "last_year",
  },
};


/* ======================================================
   HELPERS
====================================================== */

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString("en-IN");
};


const formatCurrency = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};


const getPercentage = (value, total) => {
  if (!Number(total)) return 0;

  return Math.round(
    (Number(value || 0) / Number(total)) * 100
  );
};


const getChangePercent = (current, previous) => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);

  if (previousValue === 0) {
    if (currentValue === 0) {
      return 0;
    }

    return null;
  }

  return Math.round(
    ((currentValue - previousValue) / previousValue) * 100
  );
};


const getChangeText = (current, previous) => {
  const change = getChangePercent(
    current,
    previous
  );

  if (change === null) {
    return Number(current || 0) > 0
      ? "New"
      : "0%";
  }

  return `${change > 0 ? "+" : ""}${change}%`;
};


const getChangeClass = (current, previous) => {
  const change = getChangePercent(
    current,
    previous
  );

  if (change === null || change > 0) {
    return "positive";
  }

  if (change < 0) {
    return "negative";
  }

  return "neutral";
};


/* ======================================================
   DASHBOARD
====================================================== */

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedPeriod, setSelectedPeriod] =
    useState("month");


  /* ====================================================
     FETCH DASHBOARD
  ==================================================== */

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(API_URL, {
        method: "GET",
      });

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to load dashboard"
        );
      }


      setDashboard(data);

    } catch (err) {
      console.error(
        "Dashboard API Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load dashboard data"
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboard();
  }, []);


  /* ====================================================
     DATA
  ==================================================== */

  const summary =
    dashboard?.summary || {};

  const appointments =
    dashboard?.appointments_overview || {};

  const topCourses =
    dashboard?.top_courses || [];

  const instructors =
    dashboard?.instructors_performance || [];

  const enrollmentStatuses =
    dashboard?.enrollment_statuses || {};


  /* ====================================================
     SELECTED PERIOD
  ==================================================== */

  const period =
    PERIODS[selectedPeriod];


  const revenue =
    summary.revenue || {};


  const enrollmentData =
    summary.enrollments || {};


  const currentRevenue = Number(
    revenue[period.revenueKey] || 0
  );


  const previousRevenue = Number(
    revenue[period.previousRevenueKey] || 0
  );


  const currentEnrollments =
    Number(
      enrollmentData[
        period.enrollmentKey
      ] || 0
    );


  const previousEnrollments =
    Number(
      enrollmentData[
        period.previousEnrollmentKey
      ] || 0
    );


  const currentAppointments =
    Number(
      appointments[
        period.appointmentKey
      ] || 0
    );


  const previousAppointments =
    Number(
      appointments[
        period.previousAppointmentKey
      ] || 0
    );


  const revenueChange =
    getChangePercent(
      currentRevenue,
      previousRevenue
    );


  const enrollmentChange =
    getChangePercent(
      currentEnrollments,
      previousEnrollments
    );


  const appointmentChange =
    getChangePercent(
      currentAppointments,
      previousAppointments
    );


  /* ====================================================
     COURSE CHART
  ==================================================== */

  const courseChartData = useMemo(() => {
    return topCourses.map((course) => ({
      name:
        course.course_name?.length > 13
          ? `${course.course_name.substring(
              0,
              13
            )}...`
          : course.course_name ||
            "Course",

      students: Number(
        course.enrolled_students || 0
      ),
    }));
  }, [topCourses]);


  /* ====================================================
     ENROLLMENT STATUS CHART
  ==================================================== */

  const statusChartData = useMemo(() => {
    return Object.entries(
      enrollmentStatuses
    ).map(([status, count]) => ({
      name: status,

      value: Number(count || 0),
    }));
  }, [enrollmentStatuses]);


  /* ====================================================
     REVENUE CHART
  ==================================================== */

  const revenueChartData = useMemo(() => {
    return [
      {
        name: period.previousLabel,

        revenue: previousRevenue,
      },

      {
        name: period.label,

        revenue: currentRevenue,
      },
    ];
  }, [
    period.label,
    period.previousLabel,
    previousRevenue,
    currentRevenue,
  ]);


  /* ====================================================
     APPOINTMENT COMPLETION
  ==================================================== */

  const totalAppointments =
    Number(
      appointments.completed || 0
    ) +
    Number(
      appointments.pending || 0
    );


  const appointmentCompletion =
    getPercentage(
      appointments.completed,
      totalAppointments
    );


  /* ====================================================
     STATUS TOTAL
  ==================================================== */

  const totalStatusCount =
    statusChartData.reduce(
      (sum, item) =>
        sum + item.value,
      0
    );


  /* ====================================================
     LOADING
  ==================================================== */

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="spinner" />

          <p>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }


  /* ====================================================
     ERROR
  ==================================================== */

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">

          <div className="error-icon">
            !
          </div>

          <h2>
            Unable to load dashboard
          </h2>

          <p>
            {error}
          </p>

          <button
            className="retry-button"
            onClick={fetchDashboard}
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }


  /* ====================================================
     MAIN UI
  ==================================================== */

  return (
    <div className="dashboard-page">

      


      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="kpi-grid">

        {/* ACTIVE STUDENTS */}

        <div className="kpi-card">

          <div className="kpi-top">

            <div className="kpi-icon blue">
              👥
            </div>

            <span>
              Active Students
            </span>

          </div>


          <div className="kpi-number">
            {formatNumber(
              summary.total_students
            )}
          </div>


          <div className="kpi-bottom positive">
            Active students
          </div>


          <div className="mini-line blue-line">

            <svg
              viewBox="0 0 120 40"
              preserveAspectRatio="none"
            >
              <polyline
                points="0,32 15,27 30,29 45,16 60,23 75,10 90,18 105,5 120,12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>

          </div>

        </div>


        {/* ACTIVE ENROLLMENTS */}

        <div className="kpi-card">

          <div className="kpi-top">

            <div className="kpi-icon green">
              🎓
            </div>

            <span>
              Active Enrollments
            </span>

          </div>


          <div className="kpi-number">
            {formatNumber(
              summary.active_enrollments
            )}
          </div>


          <div className="kpi-bottom kpi-comparison">

            <span>
              {period.label}
            </span>

            <ChangeBadge
              current={
                currentEnrollments
              }
              previous={
                previousEnrollments
              }
            />

          </div>


          <div className="mini-line green-line">

            <svg
              viewBox="0 0 120 40"
              preserveAspectRatio="none"
            >
              <polyline
                points="0,10 15,17 30,13 45,23 60,17 75,29 90,20 105,31 120,27"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>

          </div>

        </div>


        {/* TOTAL REVENUE */}

        <div className="kpi-card">

          <div className="kpi-top">

            <div className="kpi-icon yellow">
              ₹
            </div>

            <span>
              Total Revenue
            </span>

          </div>


          <div className="kpi-number">
            {formatCurrency(
              summary.total_revenue
            )}
          </div>


          <div className="kpi-bottom kpi-comparison">

            <span>
              {period.label}
            </span>

            <ChangeBadge
              current={currentRevenue}
              previous={previousRevenue}
            />

          </div>


          <div className="mini-bars">

            {[
              35,
              50,
              42,
              63,
              48,
              72,
              57,
              82,
              67,
            ].map(
              (height, index) => (
                <span
                  key={index}
                  style={{
                    height: `${height}%`,
                  }}
                />
              )
            )}

          </div>

        </div>


        {/* ACTIVE INSTRUCTORS */}

        <div className="kpi-card">

          <div className="kpi-top">

            <div className="kpi-icon purple">
              👨‍🏫
            </div>

            <span>
              Active Instructors
            </span>

          </div>


          <div className="kpi-number">
            {formatNumber(
              summary.total_instructors
            )}
          </div>


          <div className="kpi-bottom positive">
            Available instructors
          </div>


          <div className="mini-line purple-line">

            <svg
              viewBox="0 0 120 40"
              preserveAspectRatio="none"
            >
              <polyline
                points="0,30 15,22 30,27 45,15 60,20 75,11 90,17 105,7 120,14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>

          </div>

        </div>

      </div>


      {/* =================================================
          MAIN GRID
      ================================================= */}

      <div className="main-grid">

        {/* =================================================
            REVENUE OVERVIEW
        ================================================= */}

        <div className="dashboard-card revenue-card">

          <div className="card-header">

            <div>

              <h2>
                Revenue Overview
              </h2>

              <p>
                Compare current and
                previous periods
              </p>

            </div>


            <select
              value={selectedPeriod}
              onChange={(event) =>
                setSelectedPeriod(
                  event.target.value
                )
              }
              aria-label="Revenue period"
            >

              <option value="week">
                Week
              </option>

              <option value="month">
                Month
              </option>

              <option value="year">
                Year
              </option>

            </select>

          </div>


          <div className="revenue-values">

            <div>

              <span>
                {period.label}
              </span>

              <strong>
                {formatCurrency(
                  currentRevenue
                )}
              </strong>

            </div>


            <div>

              <span>
                {period.previousLabel}
              </span>

              <strong>
                {formatCurrency(
                  previousRevenue
                )}
              </strong>

            </div>


            <div className="revenue-change-box">

              <span>
                Change
              </span>

              <strong
                className={getChangeClass(
                  currentRevenue,
                  previousRevenue
                )}
              >
                {getChangeText(
                  currentRevenue,
                  previousRevenue
                )}
              </strong>

            </div>

          </div>


          <div className="period-summary">

            <span>
              {period.label}
            </span>

            <span>
              {period.previousLabel}
            </span>

          </div>


          <div className="chart-wrapper">

            <ResponsiveContainer
              width="100%"
              height={280}
            >

              <AreaChart
                data={
                  revenueChartData
                }
                margin={{
                  top: 20,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >

                <defs>

                  <linearGradient
                    id="revenueFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor="#2563eb"
                      stopOpacity={0.25}
                    />

                    <stop
                      offset="100%"
                      stopColor="#2563eb"
                      stopOpacity={0.02}
                    />

                  </linearGradient>

                </defs>


                <CartesianGrid
                  stroke="#e5e7eb"
                  strokeDasharray="4 4"
                  vertical={false}
                />


                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />


                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                  tickFormatter={(value) =>
                    `₹${value}`
                  }
                />


                <Tooltip
                  formatter={(value) =>
                    formatCurrency(value)
                  }
                />


                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#revenueFill)"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* =================================================
            POPULAR COURSES
        ================================================= */}

        <div className="dashboard-card courses-card">

          <div className="card-header">

            <div>

              <h2>
                Popular Courses
              </h2>

              <p>
                Based on active
                enrollments
              </p>

            </div>


            <button
              className="more-button"
              type="button"
              aria-label="More course options"
            >
              •••
            </button>

          </div>


          {courseChartData.length === 0 ? (

            <EmptyState
              text="No course data available"
            />

          ) : (

            <>

              <div className="course-chart">

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >

                  <BarChart
                    data={
                      courseChartData
                    }
                    margin={{
                      top: 20,
                      right: 10,
                      left: -20,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      vertical={false}
                      stroke="#eef2f7"
                    />


                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#64748b",
                        fontSize: 11,
                      }}
                    />


                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#64748b",
                        fontSize: 10,
                      }}
                    />


                    <Tooltip />


                    <Bar
                      dataKey="students"
                      fill="#2563eb"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                      barSize={42}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>


              <div className="course-list">

                {topCourses.map(
                  (course, index) => (

                    <div
                      className="course-row"
                      key={
                        course.id ||
                        index
                      }
                    >

                      <div className="course-number">
                        {index + 1}
                      </div>


                      <div className="course-details">

                        <strong>
                          {
                            course.course_name ||
                            "Unnamed course"
                          }
                        </strong>

                        <span>
                          {
                            course.category ||
                            "General"
                          }
                        </span>

                      </div>


                      <div className="course-count">

                        <strong>
                          {formatNumber(
                            course.enrolled_students
                          )}
                        </strong>

                        <span>
                          students
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            </>

          )}

        </div>


        {/* =================================================
            KEY METRICS
        ================================================= */}

        <div className="dashboard-card key-metrics-card">

          <div className="card-header">

            <div>

              <h2>
                Key Metrics
              </h2>

              <p>
                {period.label}
                performance
              </p>

            </div>

          </div>


          <div className="metric-list">

            <Metric
              label="Active Students"
              value={formatNumber(
                summary.total_students
              )}
            />


            <Metric
              label="Active Courses"
              value={formatNumber(
                summary.total_active_courses
              )}
            />


            <Metric
              label={`${period.label} Enrollments`}
              value={formatNumber(
                currentEnrollments
              )}
              change={
                enrollmentChange
              }
            />


            <Metric
              label={`${period.label} Revenue`}
              value={formatCurrency(
                currentRevenue
              )}
              change={
                revenueChange
              }
            />


            <Metric
              label="Today's Appointments"
              value={formatNumber(
                appointments.today
              )}
            />

          </div>

        </div>

      </div>


      {/* =================================================
          SECONDARY GRID
      ================================================= */}

      <div className="secondary-grid">

        {/* =================================================
            ENROLLMENT STATUS
        ================================================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>

              <h2>
                Enrollment Status
              </h2>

              <p>
                Current enrollment
                breakdown
              </p>

            </div>

          </div>


          {statusChartData.length === 0 ? (

            <EmptyState
              text="No enrollment status data"
            />

          ) : (

            <div className="status-layout">

              <div className="pie-container">

                <ResponsiveContainer
                  width="100%"
                  height={220}
                >

                  <PieChart>

                    <Pie
                      data={
                        statusChartData
                      }
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                    >

                      {statusChartData.map(
                        (_, index) => (

                          <Cell
                            key={index}
                            fill={
                              COLORS[
                                index %
                                  COLORS.length
                              ]
                            }
                          />

                        )
                      )}

                    </Pie>


                    <Tooltip />

                  </PieChart>

                </ResponsiveContainer>


                <div className="pie-center">

                  <strong>
                    {formatNumber(
                      totalStatusCount
                    )}
                  </strong>

                  <span>
                    Total
                  </span>

                </div>

              </div>


              <div className="status-list">

                {statusChartData.map(
                  (item, index) => (

                    <div
                      className="status-row"
                      key={item.name}
                    >

                      <div>

                        <span
                          className="status-dot"
                          style={{
                            background:
                              COLORS[
                                index %
                                  COLORS.length
                              ],
                          }}
                        />

                        <span className="status-label">
                          {item.name}
                        </span>

                      </div>


                      <strong>
                        {formatNumber(
                          item.value
                        )}
                      </strong>

                    </div>

                  )
                )}

              </div>

            </div>

          )}

        </div>


        {/* =================================================
            APPOINTMENTS
        ================================================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>

              <h2>
                Appointments
              </h2>

              <p>
                Appointment overview
              </p>

            </div>

          </div>


          <div className="appointment-grid">

            <AppointmentBox
              label="Today"
              value={
                appointments.today
              }
              type="today"
            />


            <AppointmentBox
              label="Pending"
              value={
                appointments.pending
              }
              type="pending"
            />


            <AppointmentBox
              label="Completed"
              value={
                appointments.completed
              }
              type="completed"
            />

          </div>


          <div className="appointment-period-card">

            <div>

              <span>
                {period.label}
              </span>

              <strong>
                {formatNumber(
                  currentAppointments
                )}
              </strong>

            </div>


            <div className="appointment-period-change">

              <span>
                vs{" "}
                {
                  period.previousLabel
                }
              </span>

              <ChangeBadge
                current={
                  currentAppointments
                }
                previous={
                  previousAppointments
                }
              />

            </div>

          </div>


          <div className="completion">

            <div className="completion-header">

              <span>
                Overall Completion
              </span>

              <strong>
                {appointmentCompletion}%
              </strong>

            </div>


            <div className="progress">

              <span
                style={{
                  width: `${appointmentCompletion}%`,
                }}
              />

            </div>

          </div>

        </div>


        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>

              <h2>
                Recent Activity
              </h2>

              <p>
                Latest system activity
              </p>

            </div>

          </div>


          <div className="activity-list">

            <Activity
              icon="👤"
              title="Student enrollments"
              description={`${formatNumber(
                currentEnrollments
              )} enrollments ${period.label.toLowerCase()}`}
              color="blue"
            />


            <Activity
              icon="₹"
              title="Revenue"
              description={`${formatCurrency(
                currentRevenue
              )} generated ${period.label.toLowerCase()}`}
              color="green"
            />


            <Activity
              icon="📅"
              title="Today's appointments"
              description={`${formatNumber(
                appointments.today
              )} appointments today`}
              color="purple"
            />


            <Activity
              icon="🎓"
              title="Active courses"
              description={`${formatNumber(
                summary.total_active_courses
              )} active courses`}
              color="orange"
            />

          </div>

        </div>

      </div>


      {/* =================================================
          BOTTOM GRID
      ================================================= */}

      <div className="bottom-grid">

        {/* =================================================
            INSTRUCTOR PERFORMANCE
        ================================================= */}

        <div className="dashboard-card instructor-card">

          <div className="card-header">

            <div>

              <h2>
                Instructor Performance
              </h2>

              <p>
                Top instructors by
                appointments
              </p>

            </div>


            <button
              className="more-button"
              type="button"
              aria-label="More instructor options"
            >
              •••
            </button>

          </div>


          {instructors.length === 0 ? (

            <EmptyState
              text="No instructor data available"
            />

          ) : (

            <div className="instructor-table">

              <div className="table-head">

                <span>
                  Instructor
                </span>

                <span>
                  Specialization
                </span>

                <span>
                  Appointments
                </span>

                <span>
                  Completed
                </span>

                <span>
                  Completion
                </span>

              </div>


              {instructors.map(
                (instructor, index) => {

                  const completion =
                    getPercentage(
                      instructor.completed_appointments,
                      instructor.total_appointments
                    );


                  return (

                    <div
                      className="table-row"
                      key={
                        instructor.id ||
                        index
                      }
                    >

                      <div className="instructor-name">

                        <div className="avatar">

                          {
                            instructor
                              .instructor_name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                            "I"
                          }

                        </div>


                        <strong>
                          {
                            instructor.instructor_name ||
                            "Unknown"
                          }
                        </strong>

                      </div>


                      <span>
                        {
                          instructor.specialization ||
                          "General"
                        }
                      </span>


                      <strong>
                        {formatNumber(
                          instructor.total_appointments
                        )}
                      </strong>


                      <strong className="completed">
                        {formatNumber(
                          instructor.completed_appointments
                        )}
                      </strong>


                      <div className="completion-cell">

                        <span>
                          {completion}%
                        </span>


                        <div className="small-progress">

                          <span
                            style={{
                              width: `${completion}%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>

                  );
                }
              )}

            </div>

          )}

        </div>


        {/* =================================================
            QUICK SUMMARY
        ================================================= */}

        <div className="dashboard-card quick-card">

          <div className="card-header">

            <div>

              <h2>
                Quick Summary
              </h2>

              <p>
                {period.label}
                system overview
              </p>

            </div>

          </div>


          <div className="quick-grid">

            <QuickItem
              icon="👥"
              label="Students"
              value={formatNumber(
                summary.total_students
              )}
            />


            <QuickItem
              icon="📚"
              label="Courses"
              value={formatNumber(
                summary.total_active_courses
              )}
            />


            <QuickItem
              icon="👨‍🏫"
              label="Instructors"
              value={formatNumber(
                summary.total_instructors
              )}
            />


            <QuickItem
              icon="🎓"
              label="Enrollments"
              value={formatNumber(
                currentEnrollments
              )}
            />


            <QuickItem
              icon="₹"
              label="Revenue"
              value={formatCurrency(
                currentRevenue
              )}
            />


            <QuickItem
              icon="📅"
              label="Appointments"
              value={formatNumber(
                currentAppointments
              )}
            />

          </div>

        </div>

      </div>

    </div>
  );
}


/* ======================================================
   CHANGE BADGE
====================================================== */

function ChangeBadge({
  current,
  previous,
}) {
  const change =
    getChangePercent(
      current,
      previous
    );


  const text =
    getChangeText(
      current,
      previous
    );


  const className =
    getChangeClass(
      current,
      previous
    );


  return (
    <span
      className={`change-badge ${className}`}
    >
      {change !== null &&
      change > 0
        ? "↑"
        : change !== null &&
          change < 0
        ? "↓"
        : ""}{" "}
      {text}
    </span>
  );
}


/* ======================================================
   METRIC
====================================================== */

function Metric({
  label,
  value,
  change,
}) {
  return (
    <div className="metric">

      <span>
        {label}
      </span>


      <div className="metric-value-wrap">

        <strong>
          {value}
        </strong>


        {change !== undefined && (

          <span
            className={`metric-change ${
              change > 0
                ? "positive"
                : change < 0
                ? "negative"
                : "neutral"
            }`}
          >

            {change === null
              ? "New"
              : `${change > 0 ? "+" : ""}${change}%`}

          </span>

        )}

      </div>

    </div>
  );
}


/* ======================================================
   APPOINTMENT BOX
====================================================== */

function AppointmentBox({
  label,
  value,
  type,
}) {
  return (
    <div
      className={`appointment-box ${type}`}
    >

      <span>
        {label}
      </span>

      <strong>
        {formatNumber(value)}
      </strong>

    </div>
  );
}


/* ======================================================
   ACTIVITY
====================================================== */

function Activity({
  icon,
  title,
  description,
  color,
}) {
  return (
    <div className="activity">

      <div
        className={`activity-icon ${color}`}
      >
        {icon}
      </div>


      <div className="activity-info">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

    </div>
  );
}


/* ======================================================
   QUICK ITEM
====================================================== */

function QuickItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="quick-item">

      <div className="quick-icon">
        {icon}
      </div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* ======================================================
   EMPTY STATE
====================================================== */

function EmptyState({
  text,
}) {
  return (
    <div className="empty-state">

      <div>
        📊
      </div>

      <p>
        {text}
      </p>

    </div>
  );
}