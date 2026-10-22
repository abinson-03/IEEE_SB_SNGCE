import React from "react";
import Directory from "../Directory";

// Reuse the public Directory page component inside the member dashboard
const MemberDirectory = () => (
  <div>
    <div className="dash-page-header">
      <h1>Member Directory</h1>
      <p>Browse all IEEE SB SNGCE members by chapter and name.</p>
    </div>
    <Directory />
  </div>
);

export default MemberDirectory;
