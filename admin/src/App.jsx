import React, { useState } from "react";
import AdminLayout from "./components/AdminLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import TodayDashboardPage from "./pages/TodayDashboardPage.jsx";
import RefundRequestsPage from "./pages/RefundRequestsPage.jsx";
import InquiryListPage from "./pages/InquiryListPage.jsx";
import ReservationListPage from "./pages/ReservationListPage.jsx";
import ReservationDetailPage from "./pages/ReservationDetailPage.jsx";
import SiteStatusPage from "./pages/SiteStatusPage.jsx";
import SiteManagePage from "./pages/SiteManagePage.jsx";
import AdminInternalReservationsPage from "./pages/AdminInternalReservationsPage.jsx";
import BannerAdminPage from "./pages/BannerAdminPage.jsx";

export default function App() {
  const [activePage, setActivePage] = useState("reservationList");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [previousPage, setPreviousPage] = useState("reservationList");

  const handleChangePage = (pageId) => {
    setActivePage(pageId);
    if (pageId !== "reservationDetail") {
      setSelectedReservation(null);
    }
  };

  const handleViewDetail = (reservation, origin = "reservationList") => {
    setPreviousPage(origin);
    setSelectedReservation(reservation);
    setActivePage("reservationDetail");
  };

  let page = null;
  if (activePage === "dashboard") {
    page = <DashboardPage onSelectReservation={(reservation) => handleViewDetail(reservation, "dashboard")} />;
  } else if (activePage === "today") {
    page = (
      <TodayDashboardPage
        onSelectReservation={(reservation) =>
          handleViewDetail(reservation, "today")
        }
      />
    );
  } else if (activePage === "siteStatus") {
    page = (
      <SiteStatusPage
        onViewDetail={(reservation) =>
          handleViewDetail(reservation, "siteStatus")
        }
      />
    );
  } else if (activePage === "siteManage") {
    page = <SiteManagePage />;
  } else if (activePage === "reservationList") {
    page = (
      <ReservationListPage
        onViewDetail={(reservation) =>
          handleViewDetail(reservation, "reservationList")
        }
      />
    );
  } else if (activePage === "internalReservations") {
    page = <AdminInternalReservationsPage />;
  } else if (activePage === "reservationDetail") {
    page = (
      <ReservationDetailPage
        reservation={selectedReservation}
        onBack={() => {
          setActivePage(previousPage || "reservationList");
        }}
      />
    );
  } else if (activePage === "refunds") {
    page = <RefundRequestsPage />;
  } else if (activePage === "inquiries") {
    page = <InquiryListPage />;
  } else if (activePage === "banners") {
    page = <BannerAdminPage />;
  } else {
    page = <DashboardPage />;
  }

  return (
    <AdminLayout activePage={activePage} onChangePage={handleChangePage}>
      {page}
    </AdminLayout>
  );
}
