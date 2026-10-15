import {
  useEffect,
  useState,
} from "react";

import api from "../api";
import cameraBg from "./camerabg.png";

/* 
   AVAILABLE TIMES
 */

const times = [
  "10:00 AM",
  "11:30 AM",
  "01:00 PM",
  "02:30 PM",
  "04:00 PM",
  "05:30 PM",
];

/* 
   NOTIFICATION TYPES
*/

const notificationColors = {
  success: {
    wrapper:
      "border-green-200 bg-green-50",
    icon:
      "bg-green-100 text-green-700",
    title:
      "text-green-800",
    message:
      "text-green-700",
  },

  error: {
    wrapper:
      "border-red-200 bg-red-50",
    icon:
      "bg-red-100 text-red-700",
    title:
      "text-red-800",
    message:
      "text-red-700",
  },

  warning: {
    wrapper:
      "border-yellow-200 bg-yellow-50",
    icon:
      "bg-yellow-100 text-yellow-700",
    title:
      "text-yellow-800",
    message:
      "text-yellow-700",
  },

  info: {
    wrapper:
      "border-sky-200 bg-sky-50",
    icon:
      "bg-sky-100 text-sky-700",
    title:
      "text-sky-800",
    message:
      "text-sky-700",
  },
};

/* 
   MAIN COMPONENT
 */

export default function CancelReschedule({
  appointments,
  setAppointments,
}) {
  /* 
     RESCHEDULE
   */

  const [editingId, setEditingId] =
    useState(null);

  const [newDate, setNewDate] =
    useState("");

  const [newTime, setNewTime] =
    useState("");

  /* 
     WEBSITE NOTIFICATION
   */

  const [notification, setNotification] =
    useState(null);

  /* 
     CONFIRMATION MODAL
   */

  const [confirmation, setConfirmation] =
    useState(null);

  /* 
     AUTO REMOVE NOTIFICATION
  */

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timer =
      setTimeout(() => {
        setNotification(null);
      }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [notification]);

  /* 
     SHOW WEBSITE NOTIFICATION
 */

  const showNotification = (
    type,
    title,
    message
  ) => {
    setNotification({
      type,
      title,
      message,
    });
  };

  /* 
     ACTIVE APPOINTMENTS
  */

  const activeAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status !==
        "Cancelled"
    );

  /* 
     TODAY
  */

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  /* 
     CANCEL APPOINTMENT
 */

  const requestCancel = (
    appointment
  ) => {
    setConfirmation({
      type: "cancel",
      appointment,
    });
  };

  /* 
     ACTUALLY CANCEL
   */

  const confirmCancel = async () => {
    const appointment = confirmation?.appointment;

    if (!appointment) {
      return;
    }

    try {
      const { data } = await api.patch(
        `/appointments/${appointment.id}/cancel`
      );

      setAppointments((prev) =>
        prev.map((current) =>
          current.id === appointment.id ? data.appointment : current
        )
      );

      setConfirmation(null);

      showNotification(
        "success",
        "Appointment Cancelled",
        "Your appointment has been successfully cancelled."
      );
    } catch (error) {
      setConfirmation(null);

      showNotification(
        "error",
        "Could Not Cancel",
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  /* 
     START RESCHEDULE
*/

  const startReschedule = (
    appointment
  ) => {

    const rescheduleCount =
      appointment.rescheduleCount || 0;

    if (
      rescheduleCount >= 1
    ) {
      showNotification(
        "warning",
        "Reschedule Already Used",
        "This appointment can only be rescheduled once."
      );

      return;
    }

    setEditingId(
      appointment.id
    );

    setNewDate(
      appointment.date || ""
    );

    setNewTime(
      appointment.time || ""
    );

  
    setTimeout(() => {
      window.scrollTo({
        top:
          document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  /* 
     REQUEST RESCHEDULE CONFIRMATION
  */

  const requestReschedule =
    (id) => {
      if (
        !newDate ||
        !newTime
      ) {
        showNotification(
          "warning",
          "Schedule Required",
          "Please select both a new date and a new time."
        );

        return;
      }

      const appointment =
        appointments.find(
          (item) =>
            item.id === id
        );

      if (!appointment) {
        showNotification(
          "error",
          "Appointment Not Found",
          "The appointment could not be found."
        );

        return;
      }

   
      if (
        (appointment.rescheduleCount ||
          0) >= 1
      ) {
        showNotification(
          "warning",
          "Reschedule Already Used",
          "This appointment has already been rescheduled once."
        );

        setEditingId(null);
        return;
      }

   
      const conflict =
        appointments.some(
          (currentAppointment) =>
            currentAppointment.id !==
              id &&
            currentAppointment.status !==
              "Cancelled" &&
            currentAppointment.date ===
              newDate &&
            currentAppointment.time ===
              newTime
        );

      if (conflict) {
        showNotification(
          "error",
          "Schedule Unavailable",
          "That date and time is already booked. Please choose another schedule."
        );

        return;
      }

   
      setConfirmation({
        type: "reschedule",
        appointment,
        newDate,
        newTime,
      });
    };

  /* 
     CONFIRM RESCHEDULE
   */

  const confirmReschedule =
    async () => {
      const data =
        confirmation;

      if (
        !data ||
        data.type !==
          "reschedule"
      ) {
        return;
      }

      const {
        appointment,
        newDate: confirmedDate,
        newTime: confirmedTime,
      } = data;

  
      if (
        (appointment.rescheduleCount ||
          0) >= 1
      ) {
        setConfirmation(null);

        showNotification(
          "warning",
          "Reschedule Already Used",
          "This appointment has already been rescheduled once."
        );

        return;
      }

     
      const conflict =
        appointments.some(
          (currentAppointment) =>
            currentAppointment.id !==
              appointment.id &&
            currentAppointment.status !==
              "Cancelled" &&
            currentAppointment.date ===
              confirmedDate &&
            currentAppointment.time ===
              confirmedTime
        );

      if (conflict) {
        setConfirmation(null);

        showNotification(
          "error",
          "Schedule Unavailable",
          "That date and time has already been booked."
        );

        return;
      }

      try {
        const { data: result } = await api.patch(
          `/appointments/${appointment.id}/reschedule`,
          { date: confirmedDate, time: confirmedTime }
        );

        setAppointments((prev) =>
          prev.map((current) =>
            current.id === appointment.id ? result.appointment : current
          )
        );
      } catch (error) {
        setConfirmation(null);

        showNotification(
          "error",
          "Could Not Reschedule",
          error.response?.data?.message ||
            "Something went wrong. Please try again."
        );

        return;
      }

      /* 
         RESET FORM
    */

      setConfirmation(null);

      setEditingId(null);

      setNewDate("");

      setNewTime("");

      /* 
         WEBSITE SUCCESS NOTIFICATION
   */

      showNotification(
        "success",
        "Rescheduling Confirmed",
        `Your appointment has been successfully rescheduled to ${confirmedDate} at ${confirmedTime}.`
      );

   
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  /* 
     CANCEL RESCHEDULE EDIT
   */

  const cancelEditing = () => {
    setEditingId(null);
    setNewDate("");
    setNewTime("");
  };



  return (
    <div className="page-container">

      {/* 
          WEBSITE NOTIFICATION
      */}

      {notification && (
        <div className="fixed right-4 top-24 z-[10000] w-[calc(100%-2rem)] max-w-md">
          <div
            className={`rounded-2xl border p-4 shadow-2xl ${
              notificationColors[
                notification.type
              ]?.wrapper ||
              notificationColors.info
                .wrapper
            }`}
          >
            <div className="flex items-start gap-3">

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                  notificationColors[
                    notification.type
                  ]?.icon ||
                  notificationColors.info
                    .icon
                }`}
              >
                {notification.type ===
                "success"
                  ? "✓"
                  : notification.type ===
                    "error"
                  ? "!"
                  : notification.type ===
                    "warning"
                  ? "⚠"
                  : "i"}
              </div>

              <div className="min-w-0 flex-1">

                <h3
                  className={`font-bold ${
                    notificationColors[
                      notification.type
                    ]?.title ||
                    notificationColors.info
                      .title
                  }`}
                >
                  {
                    notification.title
                  }
                </h3>

                <p
                  className={`mt-1 text-sm leading-5 ${
                    notificationColors[
                      notification.type
                    ]?.message ||
                    notificationColors.info
                      .message
                  }`}
                >
                  {
                    notification.message
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setNotification(null)
                }
                className="text-slate-400 transition hover:text-slate-700"
              >
                ✕
              </button>

            </div>
          </div>
        </div>
      )}

      {/* 
          CONFIRMATION MODAL
       */}

      {confirmation && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4"
          onClick={() =>
            setConfirmation(null)
          }
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* ICON */}

            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
                confirmation.type ===
                "cancel"
                  ? "bg-red-100"
                  : "bg-sky-100"
              }`}
            >
              {confirmation.type ===
              "cancel"
                ? "⚠️"
                : "📅"}
            </div>

            {/* TITLE */}

            <h2 className="mt-5 text-center text-2xl font-bold text-slate-950">

              {confirmation.type ===
              "cancel"
                ? "Cancel Appointment?"
                : "Confirm Rescheduling?"}

            </h2>

            {/* MESSAGE */}

            <p className="mt-3 text-center text-sm leading-6 text-slate-500">

              {confirmation.type ===
              "cancel"
                ? "Are you sure you want to cancel your appointment? This action cannot be undone."
                : "Are you sure you want to reschedule your appointment to the new date and time?"}

            </p>

            {/* RESCHEDULE DETAILS */}

            {confirmation.type ===
              "reschedule" && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">

                <div className="flex items-center justify-between gap-4">

                  <span className="text-sm text-slate-500">
                    Current
                  </span>

                  <strong className="text-right text-sm text-slate-800">
                    {confirmation
                      .appointment
                      .date}
                    <br />
                    {
                      confirmation
                        .appointment
                        .time
                    }
                  </strong>

                </div>

                <div className="my-3 border-t border-slate-200" />

                <div className="flex items-center justify-between gap-4">

                  <span className="text-sm text-slate-500">
                    New Schedule
                  </span>

                  <strong className="text-right text-sm text-sky-700">
                    {
                      confirmation.newDate
                    }
                    <br />
                    {
                      confirmation.newTime
                    }
                  </strong>

                </div>

              </div>
            )}

            {/* BUTTONS */}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse">

              <button
                type="button"
                onClick={
                  confirmation.type ===
                  "cancel"
                    ? confirmCancel
                    : confirmReschedule
                }
                className={`w-full rounded-xl px-5 py-3.5 text-sm font-bold text-white transition ${
                  confirmation.type ===
                  "cancel"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-sky-600 hover:bg-sky-700"
                }`}
              >
                {confirmation.type ===
                "cancel"
                  ? "Yes, Cancel Appointment"
                  : "Yes, Reschedule"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmation(null)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-sky-400 hover:text-sky-700"
              >
                Go Back
              </button>

            </div>

          </div>
        </div>
      )}

      {/* 
          HEADER
       */}

      <div className="page-header">

        <div className="page-label">
          MANAGE APPOINTMENT
        </div>

        <h1 className="page-title">
          Cancel or Reschedule
        </h1>

        <p className="page-description">
          Need to change your schedule? Manage
          your existing appointment here.
        </p>

      </div>

      {/* 
          NO ACTIVE APPOINTMENTS
       */}

      {activeAppointments.length ===
      0 ? (
        <div className="empty-state">

          <div className="empty-icon camera-empty-icon">
            <img
              src={cameraBg}
              alt="Camera"
            />
          </div>

          <h2>
            No Active Appointments
          </h2>

          <p>
            You don't have any active
            photography appointments to
            manage.
          </p>

        </div>
      ) : (
        <div className="manage-list">

          {activeAppointments.map(
            (appointment) => {

              const rescheduleCount =
                appointment.rescheduleCount ||
                0;

              const hasUsedReschedule =
                rescheduleCount >= 1;

              return (
                <div
                  className="manage-card"
                  key={
                    appointment.id
                  }
                >

                  {/* 
                      CARD HEADER
                   */}

                  <div className="manage-card-top">

                    <div className="manage-package-info">

                      <div className="manage-camera-icon">
                        <img
                          src={cameraBg}
                          alt="Camera"
                        />
                      </div>

                      <div>

                        <span className="manage-label">
                          PACKAGE
                        </span>

                        <h2>
                          {appointment.packageName ||
                            appointment
                              .package
                              ?.name ||
                            "Photography Package"}
                        </h2>

                      </div>

                    </div>

                    <span className="status-badge confirmed">
                      {
                        appointment.status
                      }
                    </span>

                  </div>

                  {/* 
                      APPOINTMENT DETAILS
                 */}

                  <div className="manage-details">

                    <div>
                      <span>
                        DATE
                      </span>

                      <strong>
                        📅{" "}
                        {
                          appointment.date
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        TIME
                      </span>

                      <strong>
                        🕐{" "}
                        {
                          appointment.time
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        TOTAL
                      </span>

                      <strong>
                        ₱
                        {(
                          appointment.total ||
                          0
                        ).toLocaleString()}
                      </strong>
                    </div>

                  </div>

                  {/* 
                      RESCHEDULE STATUS
                  */}

                  {hasUsedReschedule && (
                    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                          ✓
                        </div>

                        <div>

                          <p className="text-sm font-bold text-green-800">
                            Reschedule already used
                          </p>

                          <p className="mt-1 text-xs leading-5 text-green-700">
                            This appointment has already
                            been rescheduled once. No
                            additional reschedules are
                            allowed.
                          </p>

                        </div>

                      </div>

                    </div>
                  )}

                  {/* 
                      RESCHEDULE FORM
                  */}

                  {editingId ===
                  appointment.id ? (
                    <div className="reschedule-box">

                      <div className="reschedule-heading">

                        <span className="page-label">
                          CHANGE SCHEDULE
                        </span>

                        <h3>
                          Choose New Schedule
                        </h3>

                        <p>
                          You can reschedule this
                          appointment only once.
                        </p>

                      </div>

                      {/* FORM */}

                      <div className="form-row">

                        {/* DATE */}

                        <div className="form-group">

                          <label>
                            New Date
                          </label>

                          <input
                            type="date"
                            className="form-control"
                            value={
                              newDate
                            }
                            min={today}
                            onChange={(e) =>
                              setNewDate(
                                e.target.value
                              )
                            }
                          />

                        </div>

                        {/* TIME */}

                        <div className="form-group">

                          <label>
                            New Time
                          </label>

                          <select
                            className="form-control"
                            value={
                              newTime
                            }
                            onChange={(e) =>
                              setNewTime(
                                e.target.value
                              )
                            }
                          >

                            <option value="">
                              Select time
                            </option>

                            {times.map(
                              (
                                time
                              ) => (
                                <option
                                  key={
                                    time
                                  }
                                  value={
                                    time
                                  }
                                >
                                  {
                                    time
                                  }
                                </option>
                              )
                            )}

                          </select>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="reschedule-actions">

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={
                            cancelEditing
                          }
                        >
                          Go Back
                        </button>

                        <button
                          type="button"
                          className="primary-button"
                          onClick={() =>
                            requestReschedule(
                              appointment.id
                            )
                          }
                        >
                          Continue →
                        </button>

                      </div>

                    </div>
                  ) : (

                    /* 
                       NORMAL ACTIONS
                     */

                    <div className="manage-actions">

                      {/* RESCHEDULE */}

                      <button
                        type="button"
                        className={
                          hasUsedReschedule
                            ? "secondary-button opacity-60 cursor-not-allowed"
                            : "secondary-button"
                        }
                        disabled={
                          hasUsedReschedule
                        }
                        onClick={() =>
                          startReschedule(
                            appointment
                          )
                        }
                      >
                        {hasUsedReschedule
                          ? "Reschedule Used"
                          : "Reschedule →"}
                      </button>

                      {/* CANCEL */}

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          requestCancel(
                            appointment
                          )
                        }
                      >
                        Cancel Appointment
                      </button>

                    </div>
                  )}

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}