import React, { useEffect, useState } from "react";
import RefundRequestDetailPage from "./RefundRequestDetailPage.jsx";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function RefundRequestsPage() {
  const [refundList, setRefundList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  const loadRefunds = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/refund-requests")
      .then((res) => {
        if (!res.ok) throw new Error("환불 요청을 불러오지 못했습니다.");
        return res.json();
      })
      .then((data) => {
        setRefundList(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "환불 요청 정보를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  return (
    <div className="dc-card">
      <h2 className="dc-card-title">환불 요청 목록</h2>
      {loading && (
        <p className="dc-status-text" style={{ marginBottom: 16 }}>
          요청 목록을 불러오는 중입니다...
        </p>
      )}
      {error && (
        <p className="dc-status-text" style={{ marginBottom: 16 }}>
          {error}
        </p>
      )}
      {!loading && !error && refundList.length === 0 && (
        <p className="dc-status-text" style={{ marginBottom: 16 }}>
          현재 환불 요청이 없습니다.
        </p>
      )}
      {refundList.length > 0 && (
        <div className="dc-table-wrap">
          <table className="dc-table">
            <thead>
              <tr>
                <th>예약번호</th>
                <th>이름</th>
                <th>연락처</th>
                <th>사이트</th>
                <th>체크인</th>
                <th>체크아웃</th>
                <th>사전 체크</th>
                <th>요청일</th>
                <th>사유</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {refundList.map((item) => (
                <tr key={item.reservationId}>
                  <td>{item.reservationId}</td>
                  <td>{item.userName || "-"}</td>
                  <td>{item.userPhone || "-"}</td>
                  <td>
                    {item.siteName || item.siteId || "-"}
                    {item.zone ? ` (${item.zone})` : ""}
                  </td>
                  <td>{formatDate(item.checkIn)}</td>
                  <td>{formatDate(item.checkOut)}</td>
                <td>
                  {typeof item.daysBeforeCheckIn === "number"
                    ? `체크인 ${item.daysBeforeCheckIn}일 전`
                    : "-"}
                </td>
                  <td>{formatDateTime(item.requestedAt)}</td>
                  <td>{item.reason || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="dc-btn dc-btn-outline"
                      onClick={() => {
                        setSelectedRequest(item);
                      }}
                    >
                      상세 보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedRequest && (
        <RefundRequestDetailPage
          request={selectedRequest}
          adminNote={adminNote}
          onAdminNoteChange={setAdminNote}
          onClose={() => setSelectedRequest(null)}
          onActionComplete={() => {
            setSelectedRequest(null);
            setAdminNote("");
            loadRefunds();
          }}
        />
      )}
    </div>
  );
}
