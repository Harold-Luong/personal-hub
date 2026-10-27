import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import QRScannerCamera from "../../src/modules/qr-toolkit/components/QRScannerCamera";
import MediaCutterPage from "../../src/modules/media-cutter/pages/MediaCutterPage";
import JsonToolkitPage from "../../src/modules/json-toolkit/pages/JsonToolkitPage";
import "../../src/modules/qr-toolkit/styles/qr-toolkit.scss";
export default function Fixture() {
    const [page, setPage] = useState("camera");
    return <><nav>{["camera", "media", "json", "empty"].map((name) => <button key={name} onClick={() => setPage(name)}>{name}</button>)}</nav>
        {page === "camera" && <QRScannerCamera onResult={() => {}} />}
        {page === "media" && <MediaCutterPage />}
        {page === "json" && <JsonToolkitPage />}
    </>;
}
createRoot(document.getElementById("root")).render(<StrictMode><BrowserRouter><Fixture /></BrowserRouter></StrictMode>);
