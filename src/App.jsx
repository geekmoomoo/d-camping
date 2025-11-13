import React, { useEffect, useState } from "react";
import {
  searchReservationsByPhone,
  requestCancelReservation,
} from "./api/client";
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

function App() {
  const [step, setStep] = useState("home");
  const [quickData, setQuickData] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [paymentPayload, setPaymentPayload] = useState({
    userInfo: null,
    extraCharge: 0,
    reservationId: null,
    amount: null,
    status: null,
  });
  const [activeTopMenu, setActiveTopMenu] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

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

  const handleMapNext = (site) => {
    setQuickData(null);
    setSelectedSite(site);
    setStep("site-detail");
  };

  const handleGoConfirm = () => setStep("confirm");

  const handleGoPayment = (payload) => {
    setPaymentPayload({
      reservationId: payload?.reservationId || null,
      amount: payload?.amount ?? null,
      status: payload?.status || null,
      userInfo: payload?.userInfo || null,
      extraCharge: payload?.extraCharge || 0,
    });
    setStep("payment");
  };

  const handleUpdateDatesFromDetail = (partial) => {
    setQuickData((prev) => ({ ...(prev || {}), ...partial }));
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
    } else if (step === "payment") {
      setStep("confirm");
    } else {
      goHome();
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [step]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  const isHome = step === "home";
  const pageClassName = `dc-page ${isHome ? "dc-page--home" : "dc-page--step"}`;

  if (location.pathname === "/payment/success") {
    const goOutcomeHome = () => {
      setStep("home");
      setSelectedSite(null);
      navigate("/", { replace: true });
    };
    return (
      <div className="dc-page dc-page--step">
        <StepHeader title="결제 성공" onBack={goOutcomeHome} onHome={goOutcomeHome} />
        <main className="dc-step-main">
          <PaymentSuccessPage
            onReservationBack={goOutcomeHome}
            onHome={goOutcomeHome}
          />
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
      {isHome && <Header />}

      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "8px 12px",
          borderBottom: "1px solid #e5e5e5",
          overflowX: "auto",
          backgroundColor: "#ffffff",
        }}
      >
        {[
          { key: "lookup", label: "예약확인" },
          { key: "cancel", label: "취소/환불 요청" },
          { key: "contact", label: "고객문의" },
          { key: "guide", label: "이용안내" },
        ].map((item) => {
          const isActive = activeTopMenu === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (item.key === "lookup" || item.key === "cancel") {
                  setActiveTopMenu((prev) =>
                    prev === item.key ? null : item.key
                  );
                } else if (item.key === "contact") {
                  alert("고객문의 페이지는 다음 단계에서 구성할 예정입니다.");
                } else if (item.key === "guide") {
                  alert("이용안내 페이지는 다음 단계에서 구성할 예정입니다.");
                }
              }}
              style={{
                flexShrink: 0,
                padding: "6px 10px",
                borderRadius: "999px",
                border: isActive ? "1px solid #2d6cdf" : "1px solid #cccccc",
                backgroundColor: isActive ? "#2d6cdf" : "#ffffff",
                color: isActive ? "#ffffff" : "#333333",
                fontSize: "0.9rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

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
                paymentPayload={paymentPayload}
                onEditReservation={() => setStep("confirm")}
              />
            )}
          </main>
        </>
      )}

      <Footer />

      {activeTopMenu === "lookup" && (
        <ReservationLookupPanel onClose={() => setActiveTopMenu(null)} />
      )}

      {activeTopMenu === "cancel" && (
        <CancelRequestPanel onClose={() => setActiveTopMenu(null)} />
      )}
    </div>
  );
}

function ReservationLookupPanel({ onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setResult(null);

    const trimmedPhone = String(phone || "").replace(/[-\s]/g, "");
    if (!trimmedPhone) {
      setErrorMsg("휴대폰 번호를 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      const data = await searchReservationsByPhone(trimmedPhone);
      const filteredItems = (data.items || []).filter((item) => {
        if (!name) return true;
        const itemName = String(item.customerName || "").trim();
        return itemName.includes(name.trim());
      });

      setResult({ total: filteredItems.length, items: filteredItems });
    } catch (err) {
      console.error("[ReservationLookupPanel] ERROR:", err);
      setErrorMsg("예약 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "60px",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "480px",
          maxHeight: "80vh",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>예약확인</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSearch} style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              이름 (선택)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예약자 이름"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              휴대폰 번호 (필수)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "8px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#2d6cdf",
              color: "#ffffff",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            {isLoading ? "조회 중..." : "예약 조회하기"}
          </button>
        </form>

        {errorMsg && <div style={{ color: "red", marginBottom: "8px" }}>{errorMsg}</div>}

        {result && (
          <div>
            {result.total === 0 ? (
              <p>조회된 예약이 없습니다.</p>
            ) : (
              <>
                <p>총 {result.total}건의 예약이 있습니다.</p>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {result.items.map((r) => (
                    <li
                      key={r.id}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "10px",
                        marginBottom: "8px",
                        fontSize: "0.9rem",
                      }}
                    >
                      <div>
                        <strong>예약번호</strong> : {r.id}
                      </div>
                      <div>
                        <strong>이름</strong> : {r.customerName}
                      </div>
                      <div>
                        <strong>연락처</strong> : {r.customerPhone}
                      </div>
                      <div>
                        <strong>이용일</strong> : {formatDate(r.checkIn)} ~{" "}
                        {formatDate(r.checkOut)}
                      </div>
                      <div>
                        <strong>사이트</strong> : {r.siteId}
                      </div>
                      <div>
                        <strong>인원</strong> : {r.people}명
                      </div>
                      <div>
                        <strong>금액</strong> :{" "}
                        {(r.totalAmount?.toLocaleString?.() ?? r.totalAmount) || 0}원
                      </div>
                      <div>
                        <strong>상태</strong> : {r.status}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CancelRequestPanel({ onClose }) {
  const [reservationId, setReservationId] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setResult(null);

    const trimmedId = String(reservationId || "").trim();
    const trimmedPhone = String(phone || "").replace(/[-\s]/g, "");

    if (!trimmedId) {
      setErrorMsg("예약번호를 입력해주세요.");
      return;
    }
    if (!trimmedPhone) {
      setErrorMsg("예약자 휴대폰 번호를 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      const updated = await requestCancelReservation({
        id: trimmedId,
        phone: trimmedPhone,
        reason,
      });
      setResult(updated);
    } catch (err) {
      console.error("[CancelRequestPanel] ERROR:", err);
      setErrorMsg(
        "취소/환불 요청 중 오류가 발생했습니다. 입력 정보를 다시 확인해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "60px",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "480px",
          maxHeight: "80vh",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>취소/환불 요청</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              예약번호 (필수)
            </label>
            <input
              type="text"
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              placeholder="예약확인에서 조회된 예약번호"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              휴대폰 번호 (필수)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              취소/환불 사유 (선택)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="변경된 일정, 우천 등 사유를 간단히 적어주세요."
              rows={3}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "8px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#d43f3a",
              color: "#ffffff",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            {isLoading ? "요청 중..." : "취소/환불 요청 보내기"}
          </button>
        </form>

        {errorMsg && (
          <div style={{ color: "red", marginBottom: "8px" }}>{errorMsg}</div>
        )}

        {result && (
          <div
            style={{
              borderTop: "1px solid #eee",
              paddingTop: "8px",
              fontSize: "0.9rem",
            }}
          >
            <p>취소/환불 요청이 접수되었습니다.</p>
            <div>
              <strong>예약번호</strong> : {result.id}
            </div>
            <div>
              <strong>이름</strong> : {result.customerName}
            </div>
            <div>
              <strong>연락처</strong> : {result.customerPhone}
            </div>
            <div>
              <strong>이용일</strong> : {formatDate(result.checkIn)} ~{" "}
              {formatDate(result.checkOut)}
            </div>
            <div>
              <strong>현재 상태</strong> : {result.status}
            </div>
            {result.cancelRequest && (
              <div style={{ marginTop: "4px" }}>
                <strong>요청 사유</strong> :{" "}
                {result.cancelRequest.reason || "-"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeLabel(quickData) {
  const t = quickData?.siteType;
  if (t === "self-caravan") return "자가 카라반존";
  if (t === "cabana-deck") return "카바나 데크존";
  if (t === "tent") return "텐트 사이트";
  if (t === "pension") return "숙박시설";
  if (t === "lodging") return "숙박시설";
  return "캠핑";
}

function getHeaderTitle(step, quickData, selectedSite) {
  const typeLabel = getTypeLabel(quickData);
  if (step === "select-site") return `${typeLabel} 선택`;
  if (step === "site-detail") return "예약 상세 보기";
  if (step === "confirm") return "예약하기";
  if (step === "payment") return "결제 확인";
  return "예약 계획";
}

export default App;
