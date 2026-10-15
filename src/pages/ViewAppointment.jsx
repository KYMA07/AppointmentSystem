import cameraBg from "./camerabg.png";

export default function ViewAppointment({
  appointments = [],
  setCurrentView,
}) {

  const activeAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status !==
        "Cancelled"
    );

  const getPackageName = (
    appointment
  ) => {
    return (
      appointment?.packageName ||
      appointment?.package?.name ||
      "Package"
    );
  };

  /* 
     PACKAGE ICON
*/

  const getPackageIcon = (
    appointment
  ) => {
    return (
      appointment?.package?.icon ||
      "📷"
    );
  };

  /* 
     GET PACKAGE PEOPLE
  */

  const getPackagePeople = (
    appointment
  ) => {
    return (
      appointment?.packagePeople ||
      appointment?.package?.people ||
      ""
    );
  };

  /* 
     GET TOTAL
  */

  const getTotal = (
    appointment
  ) => {
    return (
      appointment?.total ||
      0
    );
  };

  /* 
     RENDER
  */

  return (
    <div className="page-container">

      {/* 
          PAGE HEADER
      */}

      <div className="page-header">

        <div className="page-label">
          CUSTOMER DASHBOARD
        </div>

        <h1 className="page-title">
          My Appointments
        </h1>

        <p className="page-description">
          View your upcoming appointments,
          booking status, and appointment history.
        </p>

      </div>

      {/* 
          UPCOMING APPOINTMENTS
      */}

      <section className="appointment-section">

        <div className="section-small-heading">
          Upcoming Appointments
        </div>

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
              No Upcoming Appointments
            </h2>

            <p>
              You don't have any active
              photography appointments.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setCurrentView(
                  "packages"
                )
              }
            >
              Book a Photoshoot →
            </button>

          </div>

        ) : (

          <div className="appointment-list">

            {activeAppointments.map(
              (appointment) => (
                <AppointmentCard
                  key={
                    appointment.id
                  }
                  appointment={
                    appointment
                  }
                  packageName={
                    getPackageName(
                      appointment
                    )
                  }
                  packageIcon={
                    getPackageIcon(
                      appointment
                    )
                  }
                  packagePeople={
                    getPackagePeople(
                      appointment
                    )
                  }
                  total={
                    getTotal(
                      appointment
                    )
                  }
                />
              )
            )}

          </div>

        )}

      </section>

      {/* 
          APPOINTMENT HISTORY
      */}

      <section className="appointment-section">

        <div className="section-small-heading">
          Appointment History
        </div>

        {appointments.length ===
        0 ? (

          <div className="history-empty">
            No appointment history yet.
          </div>

        ) : (

          <div className="history-table-wrapper">

            <table className="history-table">

              <thead>

                <tr>

                  <th>
                    Package
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Time
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {appointments.map(
                  (appointment) => {

                    /*
                      Get package name from either
                      the new or old appointment structure.
                    */
                    const packageName =
                      getPackageName(
                        appointment
                      );

                    const total =
                      getTotal(
                        appointment
                      );

                    return (
                      <tr
                        key={
                          appointment.id
                        }
                      >

                        {/* 
                            PACKAGE
                        */}

                        <td>

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-lg">
                              {getPackageIcon(
                                appointment
                              )}
                            </div>

                            <div>

                              <strong className="block">
                                {
                                  packageName
                                }
                              </strong>

                              {getPackagePeople(
                                appointment
                              ) && (
                                <span className="block mt-1 text-xs text-slate-500">
                                  {
                                    getPackagePeople(
                                      appointment
                                    )
                                  }
                                </span>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* 
                            DATE
                        */}

                        <td>
                          {
                            appointment.date
                          }
                        </td>

                        {/* 
                            TIME
                        */}

                        <td>
                          {
                            appointment.time
                          }
                        </td>

                        {/* 
                            TOTAL
                        */}

                        <td>
                          ₱
                          {Number(
                            total
                          ).toLocaleString()}
                        </td>

                        {/* 
                            STATUS
                        */}

                        <td>

                          <span
                            className={`status-badge ${
                              appointment.status ===
                              "Confirmed"
                                ? "confirmed"
                                : "cancelled"
                            }`}
                          >
                            {
                              appointment.status
                            }
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}

/* 
   APPOINTMENT CARD
*/

function AppointmentCard({
  appointment,
  packageName,
  packageIcon,
  packagePeople,
  total,
}) {
  return (
    <div className="appointment-card">

      {/* 
          PACKAGE ICON
      */}

      <div className="appointment-card-icon">

        <div className="flex h-full w-full items-center justify-center text-4xl">
          {packageIcon}
        </div>

      </div>

      {/* 
          MAIN CONTENT
      */}

      <div className="appointment-main">

        {/* 
            TITLE
        */}

        <div className="appointment-title-row">

          <div>

            <span className="appointment-card-label">
              PHOTOGRAPHY APPOINTMENT
            </span>

            <h3>
              {packageName}
            </h3>

            {packagePeople && (
              <p className="mt-1 text-sm text-slate-500">
                {packagePeople}
              </p>
            )}

          </div>

          <span className="status-badge confirmed">
            {appointment.status}
          </span>

        </div>

        {/* 
            DETAILS
        */}

        <div className="appointment-details">

          {/* DATE */}

          <div>

            <span>
              DATE
            </span>

            <strong>
              📅 {appointment.date}
            </strong>

          </div>

          {/* TIME */}

          <div>

            <span>
              TIME
            </span>

            <strong>
              🕐 {appointment.time}
            </strong>

          </div>

          {/* PAYMENT */}

          <div>

            <span>
              PAYMENT
            </span>

            <strong>
              {appointment.paymentMethod ||
                "Not specified"}
            </strong>

          </div>

          {/* TOTAL */}

          <div>

            <span>
              TOTAL
            </span>

            <strong>
              ₱
              {Number(
                total
              ).toLocaleString()}
            </strong>

          </div>

        </div>

        {/* 
            BACKDROPS
        */}

        <div className="appointment-extra">

          <span>
            Free Backdrop:

            <strong>
              {" "}
              {appointment.freeBackdrop ||
                (
                  appointment.freeBackdrops ||
                  []
                ).join(", ") ||
                "Not selected"}
            </strong>
          </span>

          {(
            appointment.extraBackdrop ||
            (
              appointment.extraBackdrops ||
              []
            ).length > 0
          ) && (

            <span>

              Extra Backdrop:

              <strong>
                {" "}
                {appointment.extraBackdrop ||
                  (
                    appointment.extraBackdrops ||
                    []
                  ).join(", ")}
              </strong>

            </span>

          )}

        </div>

      </div>

    </div>
  );
}