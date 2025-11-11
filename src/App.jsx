import React, { useState } from "react";
import "./index.css";
import Footer from "./components/Footer";
import StepHeader from "./components/StepHeader";
import ConfirmReservePage from "./pages/ConfirmReservePage";
import HomePage from "./pages/HomePage";
import SiteDetailStep from "./pages/SiteDetailStep";
import SiteSelectStep from "./pages/SiteSelectStep";

function App() {
  const [step, setStep] = useState("home");
  const [quickData, setQuickData] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);

  const goHome = () => {
    setStep("home");
    setSelectedSite(null);
  };

  const handleQuickNext = (payload) => {
    setQuickData(payload);
    setSelectedSite(null);
    setStep("select-site");
  };

  const handleSiteSelect = (site) => {
    setSelectedSite(site);
    setStep("site-detail");
  };

  const handleGoConfirm = () => {
    setStep("confirm");
  };

  const handleUpdateDatesFromDetail = (partial) => {
    setQuickData((prev) => ({
      ...(prev || {}),
      ...partial,
    }));
  };

  const headerTitle = getHeaderTitle(step, quickData, selectedSite);

  const handleBack = () => {
    if (step === "select-site") {
      setStep("home");
      setSelectedSite(null);
    } else if (step === "site-detail") {
      setStep("select-site");
      setSelectedSite(null);
    } else if (step === "confirm") {
      setStep("site-detail");
    } else {
      goHome();
    }
  };

  return (
    <div className="dc-page">
      {step === "home" ? (
        <HomePage onQuickNext={handleQuickNext} />
      ) : (
        <>
          <StepHeader title={headerTitle} onBack={handleBack} onHome={goHome} />
          <main className="dc-step-main">
            {step === "select-site" && (
              <SiteSelectStep
                data={quickData}
                onChangeFilter={setQuickData}
                onSelectSite={handleSiteSelect}
              />
            )}
            {step === "site-detail" && (
              <SiteDetailStep
                data={quickData}
                site={selectedSite}
                onReserve={handleGoConfirm}
                onUpdateDates={handleUpdateDatesFromDetail}
              />
            )}
            {step === "confirm" && (
              <ConfirmReservePage quickData={quickData} site={selectedSite} />
            )}
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}

function getHeaderTitle(step, quickData, selectedSite) {
  const t = quickData?.siteType;
  const typeLabel =
    t === "self-caravan"
      ? "자가 카라반"
      : t === "cabana-deck"
      ? "카바나 데크"
      : t === "tent"
      ? "텐트 사이트"
      : t === "lodging"
      ? "숙박 시설"
      : "캠핑장";

  if (step === "select-site") {
    return `${typeLabel} 사이트 선택`;
  }

  if (step === "site-detail") {
    if (selectedSite?.name) return selectedSite.name;
    return `${typeLabel} 사이트 상세`;
  }

  if (step === "confirm") {
    return "예약하기";
  }

  return "예약 단계";
}

export default App;
