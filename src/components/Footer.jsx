import React from "react";

function Footer() {
  return (
    <footer className="dc-footer">
      <div>
        <div className="dc-logo-sm">담양 금성산성 오토캠핑장</div>
        <div>
          예약·문의 : 010-0000-0000
          <br />
          주소 : 전라남도 담양군 (예시 주소)
        </div>
      </div>
      <div>
        © {new Date().getFullYear()} Damyang Auto Camping. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;
