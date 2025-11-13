import React, { useEffect, useMemo, useRef, useState } from "react";
import { diffDays, formatDateLabel, toISO } from "../utils/date";
import TermsModal from "../components/TermsModal";

const OPTION_PRICE = 5000;
const TERM_DETAILS = [
  {
    key: "a1",
    label: "(필수) 취소 및 환불 규정 동의",
    title: "취소 및 환불 규정 동의",
    sections: [
      {
        title: "취소수수료 규정 안내",
        items: [
          '예약취소는 구매한 사이트 "MYPAGE" 혹은 "예약확인/취소"에서 가능합니다.',
          "취소수수료는 예약 시점과는 무관하게 '입실일로부터 남은 날짜' 기준으로 부과되오니 신중히 예약 바랍니다.",
          "예약 이용일 변경은 불가합니다. (취소 수수료 확인 후) 기존 예약 건 취소 및 재예약하셔야 합니다.",
          "중복예약 취소, 업체 요청에 의한 취소, 법령에 의한 취소 등은 반드시 캠핑톡 고객센터(1566-1024) 또는 해당 숙소를 통하여 도움을 받으십시오.",
          "미성년자는 예약이 불가하며, 보호자 동반 없이 이용 불가합니다.",
        ],
      },
      {
        title: "기상 상황 및 감염병 관련 예약 취소 안내",
        items: [
          "우천으로 인한 환불 및 날짜 변경은 불가합니다.",
          "천재지변, 법정 감염병 등 불가항력적인 사유로 제휴 캠핑장 이용이 불가한 경우, 캠핑톡 고객센터로 예약내역 및 증빙서류를 보내주시면 예약취소 가능 여부를 확인해 드립니다.",
          "단, 당사는 통신판매중개자로서 이용자와 제휴 판매자 간의 중재 역할을 수행하고 있으며, 각 제휴 판매점의 이용정책 및 규정에 근거하여 상황에 따라 수수료가 발생하거나 취소가 제한될 수 있는 점 양해 부탁드립니다.",
          "사전 협의 없이 예약자가 직접 예약을 취소한 경우, 일반 환불 규정에 따라 처리되며 취소수수료가 부과됩니다.",
        ],
      },
      {
        title: "환불 관련 안내",
        items: [
          "취소 시 결제금액에서 취소수수료를 제외한 금액이 환불되며, 취소수수료는 총 결제금액 기준으로 책정됩니다.",
          "취소 신청 후 간편결제 사업자 또는 은행/신용카드사에 따라 환불 절차에 일정 시간이 소요됩니다.",
          "영업일 기준(토/일/공휴일 제외)으로 실시간 계좌이체 2~3일, 신용카드 3~5일 소요됩니다.",
          "환불과 관련된 자세한 사항은 고객센터(070-4336-1824)로 문의 부탁드립니다.",
        ],
      },
      {
        title: "쿠폰 사용 시 예약 취소 관련 유의사항",
        items: [
          "전액 환불 가능 기간 내 취소 시 결제 금액은 전액 환불되며, 사용한 쿠폰은 유효기간이 남아있는 경우 자동 복원됩니다.",
          "취소 수수료는 쿠폰 및 포인트와 같은 할인 적용 전 전체 예약 금액을 기준으로 산정됩니다.",
          "취소수수료는 실결제금액(포인트 등 포함) → 쿠폰 순서로 차감되며, 사용한 쿠폰의 정책에 따라 복원되지 않을 수 있습니다.",
          "쿠폰 반환 불가 사항: 유효기간이 만료된 쿠폰, 즉시 할인쿠폰‧선착순 쿠폰 등, 취소 수수료가 실 결제 금액을 초과한 경우, 사용한 쿠폰/이벤트 정책에 의해 반환이 불가능한 경우.",
          "기타 유의사항: 쿠폰을 부정하게 사용한 경우 사전 통보 없이 회수될 수 있으며, 복원 및 이의 제기는 사용한 날로부터 30일 이내에만 접수 가능합니다.",
          "숙소 측 사유 또는 천재지변 등 불가피한 사유로 취소되는 경우 고객센터로 문의해주세요.",
        ],
      },
      {
        title: "취소수수료율 안내",
        items: [
          "캠핑톡(주)는 중개플랫폼사로, 현장에서 발생된 숙박업체와의 분쟁으로 인한 취소 및 환불에 관여하지 않습니다.",
          "이용일 10일 전: 수수료 없음, 전액 환불",
          "이용일 9일 전: 10% 수수료, 90% 환불",
          "이용일 8일 전: 20% 수수료, 80% 환불",
          "이용일 7일 전: 30% 수수료, 70% 환불",
          "이용일 6일 전: 40% 수수료, 60% 환불",
          "이용일 5일 전: 50% 수수료, 50% 환불",
          "이용일 4일 전: 60% 수수료, 40% 환불",
          "이용일 3일 전: 70% 수수료, 30% 환불",
          "이용일 2일 전: 80% 수수료, 20% 환불",
          "이용일 1일 전: 90% 수수료, 10% 환불",
          "이용일 당일: 100% 수수료, 환불 없음",
        ],
      },
    ],
  },
  {
    key: "a2",
    label: "(필수) 숙소 이용 규칙 및 주의사항 동의",
    title: "숙소 이용 규칙 및 주의사항",
    sections: [
      {
        title: "알립니다",
        items: [
          "캠핑장의 출입은 반드시 지정된 출입구를 이용하며 관리자의 안내에 따라 주시기 바랍니다.",
          "이용시간을 준수하시고 퇴장 시 다음 이용객을 위하여 이용한 사이트는 깨끗하게 정리하여 주시기 바랍니다.",
          "캠핑장 내 전 지역 금연구역입니다.",
          "캠핑장 내 차량은 시속 20Km 이하로 서행하시고, 23시~7시까지 이동 자제를 부탁드립니다.",
          "차도 밑 잔디 밭은 주차 금지 구역입니다.",
          "쓰레기는 지정된 장소에 버려주시고, 재활용품은 퇴실시 쓰레기를 분리 수거해 분리수거함에 버려 주시고, 주변 정리해 주세요.",
          "캠핑장 내에서 세차하실 수 없습니다.",
          "폭죽, 풍등 사용 불가. (화재 위험)",
          "밀폐된 곳에서 화로, 가스 사용 금지.(일산화탄소 중독 우려)",
          "고전력의 전자 제품은 감전, 화재 위험으로 사용 불가. (사이트 당 사용량은 600W 이하)",
          "야외에 벌레 등 있을 수 있으니 개인 위생과 안전에 각별히 주의 바랍니다.",
          "뒷정리 및 잔불 정리해주세요.",
          "바베큐 사용 후 숯과 재는 불씨가 꺼진 것을 확인 후, 전용 숯(재) 수거함에 배출.",
          "폐수는 반드시 지정된 개수대에 배출바랍니다. 캠핑장 바닥에 버릴시 토양이 오염되어 악취가 발생됩니다.",
          "이용객의 소유물에 대한 유실, 피해에 대한 책임과 이용객의 부주의로 인한 사고에 대한 책임은 이용객에게 있습니다.",
          "캠핑장 이용 중에 시설물을 파손시켰을 때에는 별도로 말씀해 주셔야 합니다.",
          "위급을 요하거나 호우, 강풍등으로 대피가 필요한 경우에는 관리자의 지시에 따라 안전한곳으로 대피하여야 합니다.",
          "정치, 종교적 홍보활동 금지합니다.",
          "관리자의 허가 없이 상업적인 홍보 또는 물품 판매는 금지합니다.",
        ],
      },
      {
        title: "예약 규정 안내",
        items: [
          "예약관리는 특성상 약간의 시간차에 의하여 오차가 발생할 수 있습니다.",
          "오차에 의한 중복예약 발생시 먼저 예약된 예약건이 우선시 되며 이 경우, 취소수수료 없이 전액 환불처리됩니다.",
          "숙소의 요청에 따라 일부 요금은 현장에서 결제가 진행될 수 있습니다.",
          "각 숙박시설 정보는 예약을 위한 참고 자료입니다. 숙박시설 내 자체 변동이나 기타 사유로 인해 실제와 차이가 있을 수 있으며, 이에 대해 캠핑톡(주)는 책임을 지지 않습니다.",
          "고객님의 요청사항은 숙박시설에 전달되나, 최종 반영 여부는 예약하신 숙박시설의 결정사항이므로 캠핑톡(주)에서 보장할 수 없는 사항임을 유의하여 주시기 바랍니다.",
          "객실요금은 기준인원에 대한 요금이며 인원 추가시 추가요금이 발생하며 숙소 사정에 따라 현장결제 할 수도 있습니다. 최대인원 이외의 인원은 입실은 불가합니다.",
          "예약시 신청하신 인원이외에 추가인원은 입실이 거부될 수 있습니다. 예약인원 초과로 인한 입실 거부시 환불 불가 정책이 적용되오니, 유의하시기 바랍니다.",
          "예약 이후 모든 변경은 해당 예약 취소후 다시 예약하셔야 합니다. 예약변경을 위한 취소시에도 취소수수료가 부과되오니 신중하게 예약하시기 바랍니다.",
          "캠핑톡(주)에서는 이용수칙과 관련하여 모든 숙소에 대하여 통일된 규정을 제공하지 않습니다.",
        ],
      },
    ],
  },
  {
    key: "a3",
    label: "(필수) 개인정보 수집 및 이용 동의",
    title: "개인정보 수집 및 이용",
    sections: [
      {
        title: "수집 항목 및 목적",
        items: [
          "분류: 필수정보",
          "수집 및 이용 동의 목적: 계약의 이행 및 서비스 제공, 예약, 구매, 관심상품 내역, 결제대금의 청구, 상담, 불만·민원처리, 고지/안내사항 전달, 상품/서비스 이용실적 정보 통계 분석, 상품/서비스 개선 및 추천, 불법·부정 이용 방지, 개인정보 유효기간제 준수",
          "항목: 예약내역(예약일시, 결제금액, 업체명), 디바이스 ID, 휴대폰 번호, 서비스이용기록, IP 주소, 접속로그, Cookie, 광고식별자, 단말기 OS/버전/모델명, 브라우저 버전, 예약자 및 구매자의 이름/휴대폰 번호, (필요시) 생년월일, (예약자와 방문자가 다른 경우) 방문자 및 탑승자의 이름/휴대폰 번호/생년월일, (예약확인서 발급 시) 예약자의 이메일 주소, (현금 환불 요청 시) 계좌번호 및 예금주명",
        ],
      },
      {
        title: "보유 및 이용 기간",
        items: [
          "주기본: 예약서비스 제공 완료 후 6개월 후 삭제",
          "[상법, 전자상거래 등에서의 소비자보호에 관한 법률 등 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 관계법령이 정한 일정 기간 동안만 회원 정보를 보관하며, 해당 정보는 그 보관 목적에만 사용됩니다.]",
          "계약 또는 청약철회 등에 관한 기록: 보존 이유 - 전자상거래 등에서의 소비자보호에 관한 법률 / 보존 기간 - 5년",
          "대금결제 및 재화 등의 공급에 관한 기록: 보존 이유 - 전자상거래 등에서의 소비자보호에 관한 법률 / 보존 기간 - 5년",
          "전자금융 거래에 관한 기록: 보존 이유 - 전자금융거래법 / 보존 기간 - 5년",
          "소비자의 불만 또는 분쟁처리에 관한 기록: 보존 이유 - 전자상거래 등에서의 소비자보호에 관한 법률 / 보존 기간 - 3년",
          "웹사이트 방문기록: 보존 이유 - 통신비밀보호법 / 보존 기간 - 3개월",
        ],
      },
    ],
  },
  {
    key: "a4",
    label: "(필수) 개인정보 제3자 제공 동의",
    title: "개인정보 제3자 제공",
    sections: [
      {
        title: "제3자 제공 안내",
        items: [
          "제공받는 자: 평창 가야지캠핑장 (상호: 가야지캠핑장)",
          "제공 목적: 예약·구매한 상품·서비스의 제공 및 계약의 이행(이용자 및 이용정보 확인, 정산 등), 민원처리 등 소비자 분쟁 해결",
          "제공 항목: 예약번호, 예약자 정보(예약자명, 휴대폰 번호) 또는 방문자 정보(방문자명, 휴대폰 번호)",
          "이용 및 보유기간: 예약서비스 제공 완료 후 6개월 (단, 관계법령에 의하여 보존할 필요가 있는 경우 그 기간까지 보관 후 지체 없이 파기)",
          "위 개인정보 제3자 제공 동의를 거부할 수 있으며, 거부할 경우 서비스 이용이 제한됩니다.",
        ],
      },
    ],
  },
  {
    key: "a5",
    label: "(필수) 만 19세 이상 이용 동의",
    title: "만 19세 이상 이용 안내",
    sections: [
      {
        title: "이용 자격 안내",
        items: [
          "고객님께서는 전자상거래법 제8조 2항에 따른 고지사항(이용 시 주의사항, 취소수수료 정책 등) 및 서비스 이용약관을 확인하고 이에 동의합니다.",
          "이용약관은 사이트 하단의 \"이용약관\"에서 확인 가능합니다.",
          "만 19세가 되는 해의 1월 1일을 맞이하지 않으신 고객님께서는 예약이 불가능합니다.",
          "동법 제30조 8항에 의거하여 미성년자의 혼숙은 법령으로 엄격히 금지됩니다.",
        ],
      },
    ],
  },
];

function ConfirmReservePage({ quickData, site, onProceed }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISO(today);

  const checkIn = quickData?.checkIn || "";
  const checkOut = quickData?.checkOut || "";
  const people = quickData?.people || 2;
  const initialVisitorCount = quickData?.people ? Number(quickData.people) : 0;

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
    q2: "0",
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
  const [activeTermKey, setActiveTermKey] = useState(null);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const confirmTopRef = useRef(null);
  const qaRef = useRef(null);
  const firstQaRef = useRef(null);
  const agreeRef = useRef(null);
  const [highlightTarget, setHighlightTarget] = useState(null);

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

  useEffect(() => {
    if (!highlightTarget) return undefined;
    const timer = setTimeout(() => setHighlightTarget(null), 1200);
    return () => clearTimeout(timer);
  }, [highlightTarget]);

  const focusAndHighlight = (target) => {
    const scrollToElement = (element, offset = 120) => {
      if (!element) return;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    };

    if (target === "qa" && firstQaRef.current) {
      scrollToElement(firstQaRef.current, 140);
      setHighlightTarget(target);
      return;
    }
    if (target === "agree" && agreeRef.current) {
      scrollToElement(agreeRef.current, 120);
      setHighlightTarget(target);
      return;
    }
    const refs = {
      name: nameRef,
      phone: phoneRef,
      info: confirmTopRef,
      qa: qaRef,
      agree: agreeRef,
    };
    const ref = refs[target];
    if (ref?.current) {
      scrollToElement(ref.current, 120);
      ref.current.focus?.();
    }
    setHighlightTarget(target);
  };

  const qaCompleted = useMemo(() => {
    const required = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];
    return required.every((key) => {
      if (key === "q2") return Number(qa.q2) > 0;
      return Boolean(qa[key]);
    });
  }, [qa]);

  const getNextRequirement = () => {
    if (!name.trim()) return { key: "name", message: "예약자 이름 입력" };
    if (!phone.trim()) return { key: "phone", message: "휴대폰 번호 입력" };
    if (!checkIn || !checkOut)
      return { key: "info", message: "체크인/체크아웃 선택" };
    if (!qaCompleted) return { key: "qa", message: "질의응답 확인" };
    if (!(agree.a1 && agree.a2 && agree.a3 && agree.a4 && agree.a5))
      return { key: "agree", message: "약관 동의 필요" };
    return { key: null, message: "다음 단계로 이동" };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = getNextRequirement();
    if (next.key) {
      focusAndHighlight(next.key);
      return;
    }
    if (typeof onProceed === "function") {
      onProceed({
        userInfo: { name, phone, email, request },
        extraCharge: extraCnt * OPTION_PRICE,
      });
    }
  };


  const displayTitle = site?.name || "캠핑장 예약";
  const activeTerm = TERM_DETAILS.find((term) => term.key === activeTermKey);
  const nextRequirement = getNextRequirement();
  const buttonMessage = nextRequirement.message;

  return (
    <>
      <form className="dc-step-card dc-confirm-wrap" onSubmit={handleSubmit}>
        <div
          className={`dc-confirm-top ${
            highlightTarget === "info" ? "section-highlight" : ""
          }`}
          ref={confirmTopRef}
        >
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

      <section
        className={`dc-confirm-section ${
          highlightTarget === "agree" ? "section-highlight" : ""
        }`}
      >
        <h3>예약자 정보</h3>
        <div
          className={`dc-field ${highlightTarget === "name" ? "input-highlight" : ""}`}
          ref={nameRef}
        >
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
        <div
          className={`dc-field ${highlightTarget === "phone" ? "input-highlight" : ""}`}
          ref={phoneRef}
        >
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

      <section className="dc-confirm-section" ref={agreeRef}>
        <h3>추가 옵션</h3>
        <div className="dc-extra-card">
          <p className="dc-extra-title">★고기배송-미국산 꽃갈비살 500g-43,900원★</p>
          <p className="dc-extra-note">
            1) 미국산 꽃갈비살 500g(2인분)<br />
            2) 가격 : 43,900원(택배비 무료)<br />
            3) 별도안내/투어포켓 고기 공지 예약배송 참고<br />
            *무료 옵션 상품이 아닙니다.
          </p>
          <div className="dc-extra-list">
            <p>■투어포켓 고기 예약필독 공지■</p>
            <p>1) 기본 택배비 4,000원/5만원 이상 무료</p>
            <p>2) 바비큐용 숯+그릴 별도</p>
            <p>3) 희망일변경 최소 3일전까지</p>
            <p>4) 주말&공휴일, 당일예약/취소 X</p>
            <p>5) 주문은 도착희망일 최소 3일전까지</p>
            <p>6) 일,월요일+공휴일 택배사 휴무로 배송&예약 불가</p>
          </div>
          <div className="dc-extra-price-row">
            <span className="dc-extra-price">
              {(extraCnt * OPTION_PRICE).toLocaleString()}원
            </span>
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



      <section className={`dc-confirm-section ${highlightTarget === "qa" ? "section-highlight" : ""}`}
        ref={qaRef}>
        <h3>예약자 질의응답</h3>

        <div ref={firstQaRef}>
          <QaToggle
            label="[예약안내] 어린이/연휴 기간 관련 안내를 확인하셨나요?"
            qaKey="q1"
            checked={qa.q1}
            onToggle={toggleQa}
          />
        </div>
        <div className="dc-number-input">
          <div className="dc-qa-label-row">
            <span className="dc-qa-required">필수</span>
            <p className="dc-qa-text">
              [필수] 본인 포함 총 방문 인원 수를 입력해주세요. (기준 인원 초과 시 현장 결제)
            </p>
          </div>
          <div className="dc-number-control">
            <button
              type="button"
              onClick={() =>
                setQa((prev) => {
                  const current = Number(prev.q2 ?? "0");
                  return { ...prev, q2: String(Math.max(0, current - 1)) };
                })
              }
            >
              -
            </button>
            <span className="dc-number-value">{Number(qa.q2 ?? "0")}</span>
            <button
              type="button"
              onClick={() =>
                setQa((prev) => {
                  const current = Number(prev.q2 ?? "0");
                  return { ...prev, q2: String(current + 1) };
                })
              }
            >
              +
            </button>
          </div>
          {initialVisitorCount > 0 && Number(qa.q2 ?? "0") !== initialVisitorCount && (
            <p className="dc-number-hint">
              처음 입력한 인원과 다릅니다. 이 인원으로 확정하겠습니다.
            </p>
          )}
        </div>
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

      <section className="dc-confirm-section" ref={agreeRef}>
        <h3>약관 확인 및 동의</h3>
        <div className="dc-agree-all dc-agree-item">
          <label className="dc-agree-item-label">
            <input
              type="checkbox"
              checked={agree.all}
              onChange={() => handleAgreeToggle("all")}
            />
            <span className="dc-agree-label-body">전체 동의</span>
          </label>
        </div>
        <ul className="dc-agree-list">
          {TERM_DETAILS.map((term) => (
            <AgreeItem
              key={term.key}
              label={term.label}
              checked={agree[term.key]}
              onToggle={() => handleAgreeToggle(term.key)}
              onDetail={() => setActiveTermKey(term.key)}
            />
          ))}
        </ul>
      </section>

      <div className="dc-confirm-submit-wrap">
        <button
          type="submit"
          className="dc-confirm-submit-btn"
        >
          {buttonMessage}
        </button>
      </div>
    </form>
    {activeTerm && (
      <TermsModal term={activeTerm} onClose={() => setActiveTermKey(null)} />
    )}
    </>
  );
}

function QaToggle({ label, qaKey, checked, onToggle }) {
  return (
    <div className="dc-qa-box">
      <div className="dc-qa-required-row">
        <span className="dc-qa-required">필수</span>
      </div>
      <p className="dc-qa-text">{label}</p>
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
      <div className="dc-qa-required-row">
        <span className="dc-qa-required">필수</span>
      </div>
      <p className="dc-qa-text">{label}</p>
      <textarea
        className="dc-qa-input"
        placeholder="필수 질의응답을 입력해주세요."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AgreeItem({ label, checked, onToggle, onDetail }) {
  return (
    <li className="dc-agree-item">
      <label className="dc-agree-item-label">
        <input type="checkbox" checked={checked} onChange={onToggle} />
        {label.startsWith("(필수)") ? (
          <>
            <span className="dc-agree-prefix">(필수)</span>
            <span className="dc-agree-label-body">
              {label.replace("(필수)", "").trim()}
            </span>
          </>
        ) : (
          <span className="dc-agree-label-body">{label}</span>
        )}
      </label>
      <button
        type="button"
        className="dc-agree-arrow"
        aria-label={`${label} 상세보기`}
        onClick={(event) => {
          event.stopPropagation();
          onDetail();
        }}
      >
        ▶
      </button>
    </li>
  );
}

export default ConfirmReservePage;
