import { Navigate, Route, Routes } from "react-router";
import MediaCutterPage from "../pages/MediaCutterPage";

export default function MediaCutterRouter() {
    return (
        <Routes>
            <Route index element={<MediaCutterPage />} />
            <Route path="*" element={<Navigate replace to="/tools/media-cutter" />} />
        </Routes>
    );
}
