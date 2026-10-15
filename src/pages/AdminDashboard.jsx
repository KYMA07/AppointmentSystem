import { useEffect, useState } from "react";
import api from "../api";

const PAGE_SIZE = 10;

export default function AdminDashboard({ studioSettings }) {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState(""); // what is typed
  const [search, setSearch] = useState(""); // what is sent to the server
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0); // bump to refetch after a change
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    revenue: 0,
    cancelled: 0,
  });

  /* Wait until the admin stops typing, then search from page 1 */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* A new status filter starts from page 1 */
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  /* LOAD ONE PAGE (search, filter and pagination all happen on the server) */
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/appointments", {
          params: {
            page: currentPage,
            limit: PAGE_SIZE,
            ...(filter !== "All" && { status: filter }),
            ...(search && { search }),
          },
        });

        if (ignore) return;

        setRows(data.appointments);
        setTotalCount(data.total);
        setTotalPages(Math.max(data.totalPages, 1));

        /* e.g. the last row of the last page was just deleted */
        if (data.totalPages > 0 && currentPage > data.totalPages) {
          setCurrentPage(data.totalPages);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || "Could not load appointments.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [currentPage, filter, search, reload]);

  /* METRICS (counted by the server across ALL appointments) */
  useEffect(() => {
    api
      .get("/appointments/stats")
      .then(({ data }) => setMetrics(data.stats))
      .catch(() => {});
  }, [reload]);

  /* RECEIPT: fetched with the login token, shown in the modal */
  const viewReceipt = async (id) => {
    try {
      const { data } = await api.get(`/appointments/${id}/receipt`, {
        responseType: "blob",
      });
      setSelectedReceipt(URL.createObjectURL(data));
    } catch (err) {
      alert("Could not load the receipt.");
    }
  };

  /* Free the image from memory when the modal closes */
  useEffect(() => {
    return () => {
      if (selectedReceipt) URL.revokeObjectURL(selectedReceipt);
    };
  }, [selectedReceipt]);

  /* STATUS UPDATE HANDLER */
  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      setReload((n) => n + 1);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Could not update the appointment. Please try again."
      );
    }
  };

  /* DELETE HANDLER */
  const deleteAppointment = async (id) => {
    if (!window.confirm("Delete this appointment permanently?")) return;

    try {
      await api.delete(`/appointments/${id}`);
      setReload((n) => n + 1);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Could not delete the appointment. Please try again."
      );
    }
  };

  /* Every appointment matching the current filter and search (for the CSV) */
  const fetchAllMatching = async () => {
    const all = [];
    let page = 1;
    let pages = 1;

    try {
      do {
        const { data } = await api.get("/appointments", {
          params: {
            page,
            limit: 50,
            ...(filter !== "All" && { status: filter }),
            ...(search && { search }),
          },
        });
        all.push(...data.appointments);
        pages = data.totalPages;
        page += 1;
      } while (page <= pages);
    } catch (err) {
      alert("Could not load the data for export.");
      return [];
    }

    return all;
  };
  /* CSV EXPORT HANDLER */
    const handleExportCSV = async () => {
    const filteredAppointments = await fetchAllMatching();
    if (filteredAppointments.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = ["Booking ID", "Date", "Time", "Customer Name", "Email", "Phone", "Package", "Payment", "GCash Ref", "Total", "Status"];
    const rows = filteredAppointments.map(app => [
      app.id,
      app.date,
      app.time,
      `"${app.firstName} ${app.lastName}"`,
      app.email,
      app.phone,
      `"${app.packageName || app.package?.name}"`,
      app.paymentMethod,
      app.gcashReference || "N/A",
      app.total,
      app.status
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SnapYourself_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe fallback if settings aren't passed yet
  const config = studioSettings || {
    studioName: "Snap Yourself Studio",
    openTime: "09:00",
    closeTime: "18:00",
    gcashNumber: "09123456789"
  };

  return (
    <div className="page-container pb-20">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-label">MANAGEMENT DASHBOARD</div>
        <h1 className="page-title">{config.studioName} Overview</h1>
        <p className="page-description">
          Monitor studio metrics, verify GCash payments, and manage customer appointments.
        </p>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Bookings" value={metrics.total} icon="📅" color="text-sky-600" bg="bg-sky-50" />
        <MetricCard title="Active Appointments" value={metrics.active} icon="⚡" color="text-green-600" bg="bg-green-50" />
        <MetricCard title="Total Revenue" value={`₱${metrics.revenue.toLocaleString()}`} icon="💳" color="text-purple-600" bg="bg-purple-50" />
        <MetricCard title="Cancelled" value={metrics.cancelled} icon="✕" color="text-red-600" bg="bg-red-50" />
      </div>

      {/* ACTIVE SETTINGS WIDGET */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Active GCash Receiver</p>
            <p className="mt-1 font-semibold text-slate-900">{config.gcashNumber}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">📱</div>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Operating Hours</p>
            <p className="mt-1 font-semibold text-slate-900">{config.openTime} - {config.closeTime}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">⏰</div>
        </div>
      </div>

      {/* APPOINTMENTS MANAGER */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        
        {/* TABLE ACTION BAR (Search, Filter, Export) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-950">Appointments Log</h2>
          
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search name, email, or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
            </div>

            {/* Status Filter */}
            <select
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>📥</span> Export CSV
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="history-table-wrapper">
          <table className="history-table w-full">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Schedule</th>
                <th>Package Details</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-red-600">
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500">
                    {loading ? "Loading appointments..." : "No appointments found matching your search or filter."}
                  </td>
                </tr>
              ) : (
                rows.map((app) => (
                  <tr key={app.id}>
                    {/* CUSTOMER */}
                    <td>
                      <strong className="block text-slate-900">{app.firstName} {app.lastName}</strong>
                      <span className="block mt-1 text-xs text-slate-500">{app.email}</span>
                      <span className="block text-xs text-slate-500">{app.phone}</span>
                    </td>
                    
                    {/* SCHEDULE */}
                    <td>
                      <strong className="block text-slate-900">📅 {app.date}</strong>
                      <span className="block mt-1 text-xs text-slate-500">🕐 {app.time}</span>
                    </td>

                    {/* PACKAGE DETAILS */}
                    <td>
                      <strong className="block text-slate-900">{app.packageName || app.package?.name}</strong>
                      <span className="block mt-1 text-xs text-slate-500">₱{(Number(app.total) || 0).toLocaleString()}</span>
                    </td>

                    {/* PAYMENT */}
                    <td>
                      <strong className="block text-slate-900">{app.paymentMethod}</strong>
                      {app.paymentMethod === "GCash" && app.gcashReference && (
                        <div className="mt-2 flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400">REF: {app.gcashReference}</span>
                          {app.hasReceipt && (
                            <button
                              onClick={() => viewReceipt(app.id)}
                              className="text-xs font-bold text-sky-600 hover:text-sky-800 text-left"
                            >
                              View Receipt
                            </button>
                          )}

                        </div>
                      )}
                    </td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`status-badge ${
                          app.status === "Confirmed" ? "confirmed"
                            : app.status === "Completed" ? "bg-green-100 text-green-700 border-green-200"
                            : app.status === "Pending" ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "cancelled"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="flex flex-col gap-2">
                        {(app.status === "Pending" || app.status === "Cancelled") && (
                          <button
                            onClick={() => updateStatus(app.id, "Confirmed")}
                            className="rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-200 transition"
                          >
                            Confirm
                          </button>
                        )}
                        {app.status === "Confirmed" && (
                          <button
                            onClick={() => updateStatus(app.id, "Completed")}
                            className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-200 transition"
                          >
                            Mark Completed
                          </button>
                        )}
                        {app.status !== "Cancelled" && app.status !== "Completed" && (
                          <button
                            onClick={() => updateStatus(app.id, "Cancelled")}
                            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 transition"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => deleteAppointment(app.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500">
              Showing <span className="font-bold text-slate-900">{((currentPage - 1) * PAGE_SIZE) + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of <span className="font-bold text-slate-900">{totalCount}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-slate-600 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RECEIPT VIEW MODAL */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-[28px] bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">GCash Receipt Verification</h3>
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 h-96 overflow-hidden">
              {typeof selectedReceipt === 'string' ? (
                 <img src={selectedReceipt} alt="GCash Receipt" className="max-h-full max-w-full object-contain" />
              ) : (
                 <p className="text-sm font-bold text-slate-400">File attached.</p>
              )}
            </div>
            <button
              onClick={() => setSelectedReceipt(null)}
              className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, color, bg }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${bg} ${color} text-2xl`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">{title}</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}