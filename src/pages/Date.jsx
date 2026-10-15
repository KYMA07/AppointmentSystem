const timeSlots = [
  "10:00 AM",
  "11:30 AM",
  "01:00 PM",
  "02:30 PM",
  "04:00 PM",
  "05:30 PM",
];

export default function DateSelector({
  date,
  setDate,
  time,
  setTime,
  appointments = [],
}) {
  const isSlotBooked = (slot) => {
    if (!date) {
      return false;
    }

    return appointments.some(
      (appointment) =>
        appointment.date === date &&
        appointment.time === slot &&
        appointment.status !== "Cancelled"
    );
  };

  const handleDateChange = (event) => {
    const newDate = event.target.value;

    setDate(newDate);

    /*
      If the selected time is already booked
      on the newly selected date, clear it.
    */
    if (
      time &&
      appointments.some(
        (appointment) =>
          appointment.date === newDate &&
          appointment.time === time &&
          appointment.status !== "Cancelled"
      )
    ) {
      setTime("");
    }
  };

  const handleTimeChange = (event) => {
    const selectedTime =
      event.target.value;

    /*
      Final protection inside the time selector.

      If the slot is already booked, do not
      allow it to be selected.
    */
    if (
      selectedTime &&
      isSlotBooked(selectedTime)
    ) {
      alert(
        `Sorry, ${date} at ${selectedTime} is already booked. Please choose another time.`
      );

      setTime("");
      return;
    }

    setTime(selectedTime);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Appointment Date *
          </label>

          <input
            type="date"
            required
            value={date}
            min={
              new Date()
                .toISOString()
                .split("T")[0]
            }
            onChange={handleDateChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
          />

          <p className="mt-2 text-xs text-slate-400">
            Select your preferred appointment date.
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Available Time Slot *
          </label>

          <select
            required
            value={time}
            onChange={handleTimeChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
          >
            <option value="">
              {date
                ? "Select an available time"
                : "Select a date first"}
            </option>

            {timeSlots.map((slot) => {
              const booked =
                isSlotBooked(slot);

              return (
                <option
                  key={slot}
                  value={slot}
                  disabled={booked}
                >
                  {slot}
                  {booked
                    ? " — Already Booked"
                    : ""}
                </option>
              );
            })}
          </select>

          <p className="mt-2 text-xs text-slate-400">
            {date
              ? "Times marked as already booked are unavailable."
              : "Choose a date first to see available times."}
          </p>
        </div>
      </div>

      {date && time && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white">
            ✓
          </div>

          <div>
            <p className="text-sm font-bold text-sky-900">
              Schedule Selected
            </p>

            <p className="mt-1 text-xs text-sky-700">
              {date} at {time}
            </p>
          </div>
        </div>
      )}

      {date && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-slate-600">
              Available
            </span>

            <span className="ml-4 h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-xs font-semibold text-slate-600">
              Already Booked
            </span>
          </div>
        </div>
      )}
    </div>
  );
}