import React, { useState } from "react";
import { diffDays, formatDateLabel, toISO } from "../utils/date";

function ConfirmReservePage({ quickData, site }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISO(today);

  const checkIn = quickData?.checkIn || "";
  const checkOut = quickData?.checkOut || "";
  const people = quickData?.people || 2;

  const d = checkIn ? diffDays(todayISO, checkIn) : null;
  const dLabel =
    d === null ? "-" : d > 0 ? `D-${d}` : d === 0 ? "D-Day" : "지난 날짜";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [request, setRequest] = useState("");
  const [extraCnt, setExtraCnt] = useState(0);

  const [qa, setQa] = useState({
    q1: false,
    q2: "",
    q3: false,
    q4: false,
    q5: false,
    q6: false,
    q7: false,
    q8: false,
  });

  const [agree, setAgree] = useState({
    all: false,
    a1: false,
    a2: false,
    a3: false,
    a4: false,
    a5: false,
  });

  const handleExtraChange = (delta) => {
    setExtraCnt((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next > 10) return 10;
      return next;
    });
  };

  const toggleQa = (key) =>
    setQa((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "boolean" ? !prev[key] : prev[key],
    }));

  const handleAgreeToggle = (key) => {
    if (key === "all") {
      const next = !agree.all;
      setAgree({
        all: next,
        a1: next,
        a2: next,
        a3: next,
        a4: next,
        a5: next,
      });
    } else {
      const next = { ...agree, [key]: !agree[key] };
      next.all = next.a1 && next.a2 && next.a3 && next.a4 && next.a5;
      setAgree(next);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("예약자 이름을 입력해주세요.");
      return;
    }
    if (!phone.trim()) {
      alert("휴대폰 번호를 입력해주세요.");
      return;
    }
    if (!(agree.a1 && agree.a2 && agree.a3 && agree.a4 && agree.a5)) {
      alert("모든 필수 약관에 동의해주세요.");
      return;
    }
    alert("예약 정보가 완료되었습니다. (실제 결제/전송 로직 연동 필요)");
  };

  const displayTitle = site?.name || "캠핑장 예약";
  const isFormReady =
    Boolean(name.trim() && phone.trim() && checkIn && checkOut) &&
    agree.a1 &&
    agree.a2 &&
    agree.a3 &&
    agree.a4 &&
    agree.a5;

  return (
      <form className="dc-step-card dc-confirm-wrap" onSubmit={handleSubmit}>
        <div className="dc-confirm-top">
          <div className="dc-confirm-camp-name">{displayTitle}</div>

          <div className="dc-confirm-date-cards">
          <div className="dc-confirm-date-card">
            <div className="label">입실일</div>
            <div className="date">
              {checkIn ? formatDateLabel(checkIn) : "-"}
            </div>
          </div>
          <div className="dc-confirm-date-card">
            <div className="label">퇴실일</div>
            <div className="date">
              {checkOut ? formatDateLabel(checkOut) : "-"}
            </div>
          </div>
        </div>

        <div className="dc-confirm-dday">
          캠핑 가는 날 <span className="point">{dLabel}</span>
        </div>
      </div>

      <section className="dc-confirm-section">
        <h3>예약자 정보</h3>
        <div className="dc-field">
          <label>
            예약자 이름 <span className="req">*</span>
          </label>
          <input
            type="text"
            placeholder="예약자 이름을 입력해주세요."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="dc-field">
          <label>
            휴대폰 번호 <span className="req">*</span>
          </label>
          <input
            type="tel"
            placeholder="휴대폰 번호를 입력해주세요."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="dc-field">
          <label>이메일 (선택)</label>
          <input
            type="email"
            placeholder="(선택) 이메일을 입력해주세요."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="dc-field">
          <label>요청사항 (선택)</label>
          <textarea
            placeholder="(선택) 요청사항을 입력해주세요."
            value={request}
            onChange={(e) => setRequest(e.target.value)}
          />
        </div>
      </section>

      <section className="dc-confirm-section">
        <h3>추가 옵션</h3>
        <div className="dc-option-box">
          <div className="dc-option-label-row">
            <span className="dc-option-badge">현장결제</span>
            <span className="dc-option-title">
              기준 인원 초과 시 모든 연령 1인 1박당 10,000원
            </span>
          </div>
          <p className="dc-option-help">
            상품 요금은 기준 인원에 대한 요금이며, 기준 인원 초과 시 추가 인원
            요금이 발생합니다. (최대 인원 초과 입실 불가)
          </p>
          <div className="dc-option-bottom">
            <div className="dc-option-price">10,000원</div>
            <div className="dc-option-counter">
              <button type="button" onClick={() => handleExtraChange(-1)}>
                -
              </button>
              <span>{extraCnt}</span>
              <button type="button" onClick={() => handleExtraChange(1)}>
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="dc-confirm-section">
        <h3>예약자 질의응답</h3>

        <QaToggle
          label="[예약안내] 어린이/연휴 기간 관련 안내를 확인하셨나요?"
          qaKey="q1"
          checked={qa.q1}
          onToggle={toggleQa}
        />
        <QaInput
          label="[필수] 본인 포함 총 방문 인원 수를 입력해주세요. (기준 인원 초과 시 현장 결제)"
          value={qa.q2}
          onChange={(v) => setQa((p) => ({ ...p, q2: v }))}
        />
        <QaToggle
          label="[예약안내] 1사이트 1차량, 추가 차량은 외부 주차 안내를 확인하셨나요?"
          qaKey="q3"
          checked={qa.q3}
          onToggle={toggleQa}
        />
        <QaToggle
          label="[예약안내] 취소·환불 규정 및 예약변경 불가 안내를 확인하셨나요?"
          qaKey="q4"
          checked={qa.q4}
          onToggle={toggleQa}
        />
        <QaToggle
          label="[예약안내] 중복 예약 및 요금 오류 관련 안내를 확인하셨나요?"
          qaKey="q5"
          checked={qa.q5}
          onToggle={toggleQa}
        />
        <QaToggle
          label="[예약안내] 매너타임(22:30~11:30) 준수에 동의하시나요?"
          qaKey="q6"
          checked={qa.q6}
          onToggle={toggleQa}
        />
        <QaToggle
          label="[예약안내] 본 시설 이용수칙 및 환불 규정에 동의하시나요?"
          qaKey="q7"
          checked={qa.q7}
          onToggle={toggleQa}
        />
        <QaToggle
          label="[예약안내] 만 19세 이상이며, 모든 안내사항을 확인하셨나요?"
          qaKey="q8"
          checked={qa.q8}
          onToggle={toggleQa}
        />
      </section>

      <section className="dc-confirm-section">
        <h3>약관 전체 동의</h3>
        <label className="dc-agree-all">
          <input
            type="checkbox"
            checked={agree.all}
            onChange={() => handleAgreeToggle("all")}
          />
          <span>(필수) 약관 전체 동의</span>
        </label>
        <ul className="dc-agree-list">
          <AgreeItem
            label="(필수) 취소 및 환불 규정 동의"
            checked={agree.a1}
            onToggle={() => handleAgreeToggle("a1")}
          />
          <AgreeItem
            label="(필수) 숙소 이용 규칙 및 주의사항 동의"
            checked={agree.a2}
            onToggle={() => handleAgreeToggle("a2")}
          />
          <AgreeItem
            label="(필수) 개인정보 수집 및 이용 동의"
            checked={agree.a3}
            onToggle={() => handleAgreeToggle("a3")}
          />
          <AgreeItem
            label="(필수) 개인정보 제3자 제공 동의"
            checked={agree.a4}
            onToggle={() => handleAgreeToggle("a4")}
          />
          <AgreeItem
            label="(필수) 만 19세 이상 이용 동의"
            checked={agree.a5}
            onToggle={() => handleAgreeToggle("a5")}
          />
        </ul>
      </section>

      <div className="dc-confirm-submit-wrap">
        <button
          type="submit"
          className="dc-confirm-submit-btn"
          disabled={!isFormReady}
        >
          정보 입력 후 신청완료
        </button>
      </div>
    </form>
  );
}

function QaToggle({ label, qaKey, checked, onToggle }) {
  return (
    <div className="dc-qa-box">
      <div className="dc-qa-label-row">
        <span className="dc-qa-required">필수</span>
        <p className="dc-qa-text">{label}</p>
      </div>
      <button
        type="button"
        className={"dc-qa-toggle" + (checked ? " active" : "")}
        onClick={() => onToggle(qaKey)}
      >
        네, 확인했습니다.
      </button>
    </div>
  );
}

function QaInput({ label, value, onChange }) {
  return (
    <div className="dc-qa-box">
      <div className="dc-qa-label-row">
        <span className="dc-qa-required">필수</span>
        <p className="dc-qa-text">{label}</p>
      </div>
      <textarea
        className="dc-qa-input"
        placeholder="필수 질의응답을 입력해주세요."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AgreeItem({ label, checked, onToggle }) {
  return (
    <li className="dc-agree-item">
      <label>
        <input type="checkbox" checked={checked} onChange={onToggle} />
        <span>{label}</span>
      </label>
      <span className="dc-agree-arrow">›</span>
    </li>
  );
}

export default ConfirmReservePage;
