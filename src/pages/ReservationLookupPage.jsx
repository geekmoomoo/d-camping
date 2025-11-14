import React, { useState } from "react";
import { searchReservations } from "../services/reservationService";

function ReservationLookupPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    reservationId: "",
  });
  const [results, setResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLookup = async () => {
    setLoading(true);
    setError(null);
    setStatusMessage("Searching for reservations...");
    try {
      const items = await searchReservations(form);
      setResults(items);
      setStatusMessage(items.length ? "Reservations found." : "No matching reservations.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Reservation lookup failed.");
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="dc-step-card">
      <h2>Reservation Lookup</h2>
      <div className="dc-field">
        <label>Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(event) => handleChange("name", event.target.value)}
        />
      </div>
      <div className="dc-field">
        <label>Phone</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(event) => handleChange("phone", event.target.value)}
        />
      </div>
      <div className="dc-field">
        <label>Reservation ID (optional)</label>
        <input
          type="text"
          value={form.reservationId}
          onChange={(event) => handleChange("reservationId", event.target.value)}
        />
      </div>
      <button type="button" className="dc-btn-primary" onClick={handleLookup} disabled={loading}>
        {loading ? "Searching..." : "Lookup Reservations"}
      </button>
      {statusMessage && <p className="dc-status-text">{statusMessage}</p>}
      {error && <p className="dc-status-text">{error}</p>}

      {results.length > 0 && (
        <div className="dc-reservation-grid">
          {results.map((reservation) => (
            <article key={reservation.reservationId} className="dc-reservation-card">
              <h3>{reservation.siteName}</h3>
              <p>
                Check-in {reservation.checkIn} · Check-out {reservation.checkOut}
              </p>
              <p>Guests {reservation.people}</p>
              <p>Amount {(reservation.totalAmount ?? 0).toLocaleString()}원</p>
              <p className="dc-status-chip">{reservation.status}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ReservationLookupPage;
