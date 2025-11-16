import React, { useState } from "react";

function CancelPolicyAccordion() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((prev) => !prev);

  return (
    <div className="dc-cancel-wrap">
      <button type="button" className="dc-cancel-header" onClick={toggle}>
        <span className="dc-cancel-title">취소수수료 안내</span>
        <span className={"dc-cancel-arrow" + (open ? " open" : "")}>∨</span>
      </button>
      {open && (
        <div className="dc-cancel-body">
          <table className="dc-cancel-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>반환 기준</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>사용 예정일 10일 전에 취소</td>
                <td>선납금액 100% 반환</td>
              </tr>
              <tr>
                <td>사용 예정일 7일 전에 취소</td>
                <td>선납금액 100분의 90 반환</td>
              </tr>
              <tr>
                <td>사용 예정일 5일 전에 취소</td>
                <td>선납금액 100분의 70 반환</td>
              </tr>
              <tr>
                <td>사용 예정일 3일 전에 취소</td>
                <td>선납금액 100분의 50 반환</td>
              </tr>
              <tr>
                <td>사용 예정일 1일 전 또는 당일 취소</td>
                <td>선납금액 100분의 20 반환</td>
              </tr>
              <tr>
                <td>캠핑장 측 사정으로 인해 시설 사용이 불가한 경우</td>
                <td>기일에 관계없이 전액 반환</td>
              </tr>
            </tbody>
          </table>
          <div className="dc-cancel-text">
            <p>
              예약/선납된 경우로서 천재지변 등으로 인하여 시설사용을 할 수 없거나
              캠핑장 측의 사정으로 인하여 시설사용이 불가한 경우 전액 반환됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CancelPolicyAccordion;
