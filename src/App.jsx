import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./index.css";
import Footer from "./components/Footer";
import Header from "./components/Header";
import StepHeader from "./components/StepHeader";
import ConfirmReservePage from "./pages/ConfirmReservePage";
import HomePage from "./pages/HomePage";
import SiteDetailStep from "./pages/SiteDetailStep";
import SiteSelectStep from "./pages/SiteSelectStep";
import PaymentConfirmPage from "./pages/PaymentConfirmPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailPage from "./pages/PaymentFailPage";
import ReservationLookupPage from "./pages/ReservationLookupPage";
import CustomerInquiryPage from "./pages/CustomerInquiryPage";
import UsageGuidePage from "./pages/UsageGuidePage";


function App() {
  const [step, setStep] = useState("home");
  const [quickData, setQuickData] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [paymentPayload, setPaymentPayload] = useState({
    userInfo: null,
    extraCharge: 0,
    qa: {},
    agree: {},
  });
  const [activePage, setActivePage] = useState("main");
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: "lookup", label: "예약확인" },
    { id: "inquiry", label: "고객문의" },
    { id: "guide", label: "이용안내" },
  ];

  const goHome = () => {
    setStep("home");
    setQuickData(null);
    setSelectedSite(null);
    setActivePage("main");
  };
  const handleQuickNext = (payload) => {
    setActivePage("main");
    setQuickData(payload);
    setSelectedSite(null);
    setStep("select-site");
  };
  const handleSiteSelect = (site) => {
    setActivePage("main");
    setSelectedSite(site);
    setStep("site-detail");
  };
  const handleMapNext = (site) => {
    setActivePage("main");
    setQuickData(null);
    setSelectedSite(site);
    setStep("site-detail");
  };
  const handleGoConfirm = () => setStep("confirm");
  const handleGoPayment = (payload) => {
    setPaymentPayload({
      userInfo: payload?.userInfo || null,
      extraCharge: payload?.extraCharge || 0,
      qa: payload?.qa || {},
      agree: payload?.agree || {},
      people: payload?.people ?? quickData?.people ?? 1,
    });
    setStep("payment");
  };
  const handleUpdateDatesFromDetail = (partial) => { setQuickData((prev) => ({ ...(prev || {}), ...partial })); };

  const headerTitle = getHeaderTitle(step, quickData, selectedSite);
  const handleMenuSelect = (pageId) => {
    setActivePage(pageId);
  };

  const handleBack = () => {
    if (step === "select-site") { setStep("home"); setSelectedSite(null); }
    else if (step === "site-detail") { setStep("select-site"); setSelectedSite(null); }
    else if (step === "confirm") { setStep("site-detail"); }
    else if (step === "payment") { setStep("confirm"); }
    else { goHome(); }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [step]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  const isHome = step === "home";
  const isMainView = activePage === "main";
  const pageClassName = `dc-page ${
    isMainView && isHome ? "dc-page--home" : "dc-page--step"
  }`;

  const renderMenuBar = () => (
      <div
        className="dc-page-menu"
        style={{
        display: "grid",
        gridTemplateColumns: `repeat(${menuItems.length}, minmax(0, 1fr))`,
        gap: 8,
        padding: "8px 16px",
      }}
    >
      {menuItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={
            "dc-page-menu-btn" + (activePage === item.id ? " active" : "")
          }
          style={{
            padding: "12px 0",
            fontSize: 14,
            borderRadius: 6,
            border: "1px solid #dae3ef",
            background: activePage === item.id ? "#1d4ed8" : "#ffffff",
            color: activePage === item.id ? "#fff" : "#1b1b1b",
          }}
          onClick={() => setActivePage(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  const pageTitleMap = {
    lookup: "예약확인",
    inquiry: "고객문의",
    guide: "이용안내",
  };

  const renderExtraPage = () => {
    if (activePage === "lookup") return <ReservationLookupPage />;
    if (activePage === "inquiry") return <CustomerInquiryPage />;
    if (activePage === "guide") return <UsageGuidePage />;
    return null;
  };

  if (location.pathname === "/payment/success") {
    const goOutcomeHome = () => {
      setStep("home");
      setSelectedSite(null);
      navigate("/", { replace: true });
    };
    return (
      <div className="dc-page dc-page--step">
        {renderMenuBar()}
        <StepHeader title="결제 성공" onBack={goOutcomeHome} onHome={goOutcomeHome} />
        <main className="dc-step-main">
          <PaymentSuccessPage onReservationBack={goOutcomeHome} onHome={goOutcomeHome} />
        </main>
        <Footer />
      </div>
    );
  }

  if (location.pathname === "/payment/fail") {
    const goOutcomeHome = () => {
      setStep("home");
      setSelectedSite(null);
      navigate("/", { replace: true });
    };
    return (
      <div className="dc-page dc-page--step">
        {renderMenuBar()}
        <StepHeader title="결제 실패" onBack={goOutcomeHome} onHome={goOutcomeHome} />
        <main className="dc-step-main">
          <PaymentFailPage onRetry={goOutcomeHome} onHome={goOutcomeHome} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={pageClassName}>
      {!isHome &&
        step !== "select-site" &&
        step !== "site-detail" &&
        step !== "confirm" &&
        renderMenuBar()}
      {isMainView ? (
        <>
          {isHome && <Header onMenuSelect={handleMenuSelect} />}
          {isHome ? (
            <main className="dc-home-main">
              <HomePage onQuickNext={handleQuickNext} onMapNext={handleMapNext} />
            </main>
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
                  <ConfirmReservePage
                    quickData={quickData}
                    site={selectedSite}
                    onProceed={handleGoPayment}
                  />
                )}
            {step === "payment" && (
              <PaymentConfirmPage
                quickData={quickData}
                site={selectedSite}
                userInfo={paymentPayload.userInfo}
                extraCharge={paymentPayload.extraCharge}
                qa={paymentPayload.qa}
                agree={paymentPayload.agree}
                people={paymentPayload.people}
                onEditReservation={() => setStep("confirm")}
              />
            )}
              </main>
            </>
          )}
        </>
      ) : (
        <>
          <StepHeader title={pageTitleMap[activePage]} onBack={goHome} onHome={goHome} />
          <main className="dc-step-main">{renderExtraPage()}</main>
        </>
      )}
      <Footer />
    </div>
  );
}

function getTypeLabel(quickData) {
  const t = quickData?.siteType;
  if (t === "self-caravan") return "자가 카라반존";
  if (t === "cabana-deck") return "카바나 데크";
  if (t === "tent") return "텐트 사이트";
  if (t === "lodging") return "숙박 시설";
  return "캠핑";
}

function getHeaderTitle(step, quickData, selectedSite) {
  const typeLabel = getTypeLabel(quickData);
  if (step === "select-site") return `${typeLabel} 사이트 선택`;
  if (step === "site-detail") return "예약 상세보기";
  if (step === "confirm") return "예약하기";
  if (step === "payment") return "결제확인";
  return "예약 계획";
}

export default App;
