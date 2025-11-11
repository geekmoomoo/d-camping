import React, { useState } from "react";

function CancelPolicyAccordion() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);

  return (
    <div className="dc-cancel-wrap">
      <button type="button" className="dc-cancel-header" onClick={toggle}>
        <span className="dc-cancel-title">취소수수료 안내</span>
        <span className={"dc-cancel-arrow" + (open ? " open" : "")}>⌃</span>
      </button>
      {open && (
        <div className="dc-cancel-body">
          <table className="dc-cancel-table">
            <thead>
              <tr>
                <th>취소 기준</th>
                <th>취소 수수료율</th>
                <th>환불률</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>이용일 7일 전</td>
                <td>수수료 없음</td>
                <td>전액 환불</td>
              </tr>
              <tr>
                <td>이용일 6일 전</td>
                <td>50%</td>
                <td>50%</td>
              </tr>
              <tr>
                <td>이용일 5일 전</td>
                <td>50%</td>
                <td>50%</td>
              </tr>
              <tr>
                <td>이용일 4일 전</td>
                <td>50%</td>
                <td>50%</td>
              </tr>
              <tr>
                <td>이용일 3일 전</td>
                <td>50%</td>
                <td>50%</td>
              </tr>
              <tr>
                <td>이용일 2일 전</td>
                <td>70%</td>
                <td>30%</td>
              </tr>
              <tr>
                <td>이용일 1일 전</td>
                <td>100%</td>
                <td>환불 없음</td>
              </tr>
              <tr>
                <td>이용일 당일</td>
                <td>100%</td>
                <td>환불 없음</td>
              </tr>
            </tbody>
          </table>
          <div className="dc-cancel-text">
            <p>
              예약취소는 "MYPAGE" 혹은 "예약확인/취소"에서 가능하며, 취소수수료는
              입실일 기준 남은 날짜에 따라 부과됩니다.
            </p>
            <p>
              우천, 단순 변심 등은 일반 환불 규정이 적용되며 상세 내용은 캠핑장
              안내를 참고해주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CancelPolicyAccordion;
